const crypto = require('crypto');

// Create a new internship placement (Stage 2 - after general request approved)
async function createPlacement(req, res) {
  try {
    const user = req.user;
    const { LetterRequest, InternshipPlacement } = require('../models');

    if (!user || user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can create placement requests' });
    }

    const {
      generalRequestId,
      organizationName,
      organizationAddress,
      organizationEmail,
      supervisorName,
      supervisorPosition,
      supervisorContact,
      internshipStartDate,
      internshipEndDate,
      departmentRole,
    } = req.body;

    // Validate required fields
    if (!generalRequestId || !organizationName || !organizationEmail || !supervisorName) {
      return res.status(400).json({
        message: 'General request ID, organization name, organization email, and supervisor name are required'
      });
    }

    // Verify the general request exists and is approved
    const generalRequest = await LetterRequest.findByPk(generalRequestId);
    if (!generalRequest) {
      return res.status(404).json({ message: 'General request not found' });
    }
    if (generalRequest.studentId !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (generalRequest.status !== 'approved') {
      return res.status(400).json({ message: 'General request must be approved before submitting official placement' });
    }

    const placement = await InternshipPlacement.create({
      studentId: user.id,
      generalRequestId,
      organizationName,
      organizationAddress,
      organizationEmail,
      supervisorName,
      supervisorPosition,
      supervisorContact,
      internshipStartDate,
      internshipEndDate,
      departmentRole,
      status: 'pending',
    });

    // Notify admins
    const { createNotification } = require('../services/notificationService');
    const { User } = require('../models');
    const admins = await User.findAll({ where: { role: 'admin' } });

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'letter_request',
        title: 'New Official Placement Request',
        message: `${user.firstName} ${user.lastName} has submitted an official internship placement request for ${organizationName}`,
        relatedId: placement.id,
      });
    }

    res.status(201).json({
      message: 'Official placement request submitted successfully',
      placement,
    });
  } catch (error) {
    console.error('Error creating placement:', error);
    res.status(500).json({ message: 'Failed to create placement request', error: error.message });
  }
}

// Get placements (students see own, admins see all)
async function getPlacements(req, res) {
  try {
    const user = req.user;
    const { InternshipPlacement } = require('../models');
    const { status } = req.query;

    let where = {};
    if (user.role === 'student') {
      where.studentId = user.id;
    }
    if (status) {
      where.status = status;
    }

    const placements = await InternshipPlacement.findAll({ where });

    // Load related student data
    const { User } = require('../models');
    for (const placement of placements) {
      if (placement.studentId) {
        const student = await User.findOne({ id: placement.studentId });
        if (student) placement.student = student;
      }
    }

    res.json({ placements });
  } catch (error) {
    console.error('Error fetching placements:', error);
    res.status(500).json({ message: 'Failed to fetch placements', error: error.message });
  }
}

// Get a single placement by ID
async function getPlacementById(req, res) {
  try {
    const user = req.user;
    const { InternshipPlacement, EvaluationToken, EmailLog } = require('../models');
    const { id } = req.params;

    const placement = await InternshipPlacement.findByPk(id);
    if (!placement) {
      return res.status(404).json({ message: 'Placement not found' });
    }

    if (user.role === 'student' && placement.studentId !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Load related data
    const { User } = require('../models');
    if (placement.studentId) {
      const student = await User.findOne({ id: placement.studentId });
      if (student) placement.student = student;
    }

    // Load evaluation tokens
    const tokens = await EvaluationToken.findByPlacement(id);
    placement.evaluationTokens = tokens;

    // Load email logs
    const emailLogs = await EmailLog.findByPlacement(id);
    placement.emailLogs = emailLogs;

    res.json({ placement });
  } catch (error) {
    console.error('Error fetching placement:', error);
    res.status(500).json({ message: 'Failed to fetch placement', error: error.message });
  }
}

// Admin: update placement status (approve/reject/request modifications)
async function updatePlacementStatus(req, res) {
  try {
    const user = req.user;
    const { InternshipPlacement, EvaluationToken } = require('../models');
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    if (!['pending', 'approved', 'rejected', 'modification_requested'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const placement = await InternshipPlacement.findByPk(id);
    if (!placement) {
      return res.status(404).json({ message: 'Placement not found' });
    }

    const updateData = {
      status,
      adminNotes,
      reviewedBy: user.id,
      reviewedAt: new Date().toISOString(),
    };

    // If approved, generate official letter + evaluation token
    if (status === 'approved') {
      // Generate reference number
      const now = new Date();
      const datePart = now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0');
      const randomSuffix = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
      updateData.referenceNumber = `INT-${datePart}-${randomSuffix}`;
      
      // Generate alphanumeric verification code
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let vCode = '';
      for (let i = 0; i < 7; i++) vCode += chars[Math.floor(Math.random() * chars.length)];
      updateData.verificationCode = vCode;

      updateData.officialLetterUrl = `/api/placements/${id}/download-letter`;
      updateData.officialLetterGeneratedAt = new Date().toISOString();

      // Generate secure evaluation token using SHA-256
      const tokenRaw = `${id}-${placement.studentId}-${Date.now()}-${crypto.randomBytes(32).toString('hex')}`;
      const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');

      await EvaluationToken.create({
        placementId: id,
        tokenHash,
      });
    }

    const updated = await InternshipPlacement.update(id, updateData);

    // Notify student
    const { createNotification } = require('../services/notificationService');
    const statusMsg = {
      approved: `Your official placement request for ${placement.organizationName} has been approved. You can now send the official letter to the organization.`,
      rejected: `Your official placement request for ${placement.organizationName} has been rejected.`,
      modification_requested: `Your official placement request for ${placement.organizationName} requires modifications. Please review the admin notes.`,
    };

    await createNotification({
      userId: placement.studentId,
      type: 'letter_request',
      title: status === 'approved' ? 'Placement Approved - Official Letter Ready' :
             status === 'rejected' ? 'Placement Request Rejected' : 'Placement Requires Modifications',
      message: statusMsg[status] || `Your placement request status has been updated to ${status}`,
      relatedId: id,
      link: `/dashboard/letter-requests/official?view=${id}`,
    });

    res.json({ message: 'Placement status updated successfully', placement: updated });
  } catch (error) {
    console.error('Error updating placement status:', error);
    res.status(500).json({ message: 'Failed to update placement status', error: error.message });
  }
}

// Student: send official letter + evaluation form to organization via email
async function sendToOrganization(req, res) {
  try {
    const user = req.user;
    const { InternshipPlacement, EvaluationToken, EmailLog, User: UserModel } = require('../models');
    const { id } = req.params;

    const placement = await InternshipPlacement.findByPk(id);
    if (!placement) {
      return res.status(404).json({ message: 'Placement not found' });
    }

    if (user.role === 'student' && placement.studentId !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (placement.status !== 'approved') {
      return res.status(400).json({ message: 'Placement must be approved before sending to organization' });
    }

    // Get student info
    const student = await UserModel.findOne({ id: placement.studentId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get evaluation token
    const tokens = await EvaluationToken.findByPlacement(id);
    const token = tokens.length > 0 ? tokens[0] : null;

    // Build evaluation form URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const evaluationUrl = token ? `${frontendUrl}/evaluate/${token.tokenHash}` : null;

    // Send email
    const transporter = require('../config/email');
    const { generateOfficialLetterPDF } = require('../services/pdfService');
    // Use EMAIL_FROM as-is (already includes name + address), fallback to SMTP_USER
    const emailFrom = process.env.EMAIL_FROM || `"RMU Internship Portal" <${process.env.SMTP_USER || 'noreply@rmu.edu.gh'}>`;

    const mailOptions = {
      from: emailFrom,
      to: placement.organizationEmail,
      subject: `Official Internship Placement - ${student.firstName} ${student.lastName} | Regional Maritime University`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1e3a5f; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .info-box { background: white; padding: 15px; border-left: 4px solid #1e3a5f; margin: 15px 0; }
            .eval-box { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #1e3a5f; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Regional Maritime University</h1>
              <h2>Official Internship Placement</h2>
            </div>
            <div class="content">
              <p>Dear ${placement.supervisorName || 'Sir/Madam'},</p>
              
              <p>We are pleased to inform you that the Regional Maritime University has officially approved the internship placement of our student with your organization.</p>
              
              <div class="info-box">
                <h3>Student Details</h3>
                <p><strong>Name:</strong> ${student.firstName} ${student.lastName}</p>
                <p><strong>Student ID:</strong> ${student.studentId || 'N/A'}</p>
                <p><strong>Program:</strong> ${student.program || 'N/A'}</p>
                <p><strong>Department:</strong> ${student.department || 'N/A'}</p>
              </div>

              <div class="info-box">
                <h3>Placement Details</h3>
                <p><strong>Organization:</strong> ${placement.organizationName}</p>
                <p><strong>Role/Department:</strong> ${placement.departmentRole || 'N/A'}</p>
                ${placement.internshipStartDate ? `<p><strong>Start Date:</strong> ${new Date(placement.internshipStartDate).toLocaleDateString('en-GB')}</p>` : ''}
                ${placement.internshipEndDate ? `<p><strong>End Date:</strong> ${new Date(placement.internshipEndDate).toLocaleDateString('en-GB')}</p>` : ''}
                <p><strong>Reference:</strong> ${placement.referenceNumber || 'N/A'}</p>
              </div>

              <p>Please find attached the official internship letter from the university.</p>

              ${evaluationUrl ? `
              <div class="eval-box">
                <h3>📋 Student Evaluation Form</h3>
                <p>At the end of the internship period, we kindly request that you evaluate the student's performance using the secure evaluation form below. This link is unique to this placement and should not be shared with the student.</p>
                <p style="text-align: center;">
                  <a href="${evaluationUrl}" class="button" style="background: #28a745; color: white;">Complete Evaluation Form</a>
                </p>
                <p><small><em>This is a secure link. Please keep it confidential.</em></small></p>
              </div>
              ` : ''}

              <p>If you have any questions or require further information, please contact the university administration.</p>

              <p>Best regards,<br>Regional Maritime University<br>Internship Coordination Office</p>
            </div>
            <div class="footer">
              <p>This is an official communication from Regional Maritime University</p>
              <p>For verification, please contact: info@rmu.edu.gh</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Official Internship Placement - Regional Maritime University

        Dear ${placement.supervisorName || 'Sir/Madam'},

        We are pleased to inform you that the Regional Maritime University has officially approved
        the internship placement of our student with your organization.

        Student: ${student.firstName} ${student.lastName}
        Student ID: ${student.studentId || 'N/A'}
        Program: ${student.program || 'N/A'}
        Organization: ${placement.organizationName}
        Reference: ${placement.referenceNumber || 'N/A'}
        ${placement.internshipStartDate ? `Start Date: ${new Date(placement.internshipStartDate).toLocaleDateString('en-GB')}` : ''}
        ${placement.internshipEndDate ? `End Date: ${new Date(placement.internshipEndDate).toLocaleDateString('en-GB')}` : ''}

        ${evaluationUrl ? `Evaluation Form: ${evaluationUrl} (Please keep this link confidential)` : ''}

        Best regards,
        Regional Maritime University
      `,
    };

    // Generate PDF and attach it
    try {
      const signature = require('../controllers/letterController').programSignatures[student.program] || {
        name: 'Dr. [Name]',
        title: 'Dean of Academic Affairs',
        department: 'Regional Maritime University',
      };
      const pdfBuffer = await generateOfficialLetterPDF(placement, student, signature);
      mailOptions.attachments = [{
        filename: `Official_Letter_${placement.referenceNumber || placement.id}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }];
    } catch (pdfErr) {
      console.error('⚠️ PDF generation failed, sending email without attachment:', pdfErr.message);
    }

    await transporter.sendMail(mailOptions);

    // Log the email
    await EmailLog.create({
      placementId: id,
      studentId: placement.studentId,
      recipientEmail: placement.organizationEmail,
      subject: mailOptions.subject,
      deliveryStatus: 'sent',
      tokenId: token?.id,
      attachments: { officialLetter: true, evaluationForm: !!evaluationUrl },
    });

    // Notify student
    const { createNotification } = require('../services/notificationService');
    await createNotification({
      userId: placement.studentId,
      type: 'letter_request',
      title: 'Official Letter Sent to Organization',
      message: `Your official internship letter and evaluation form have been sent to ${placement.organizationName} (${placement.organizationEmail}).`,
      relatedId: id,
    });

    res.json({ message: 'Official letter and evaluation form sent successfully to the organization' });
  } catch (error) {
    console.error('Error sending to organization:', error);
    res.status(500).json({ message: 'Failed to send to organization', error: error.message });
  }
}

// Download official letter for a placement (PDF)
async function downloadOfficialLetter(req, res) {
  try {
    const user = req.user;
    const { InternshipPlacement, User: UserModel } = require('../models');
    const { generateOfficialLetterPDF } = require('../services/pdfService');
    const { id } = req.params;

    const placement = await InternshipPlacement.findByPk(id);
    if (!placement) {
      return res.status(404).json({ message: 'Placement not found' });
    }

    if (user.role === 'student' && placement.studentId !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (placement.status !== 'approved') {
      return res.status(400).json({ message: 'Placement not yet approved' });
    }

    const student = await UserModel.findOne({ id: placement.studentId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const signature = require('../controllers/letterController').programSignatures[student.program] || {
      name: 'Dr. [Name]',
      title: 'Dean of Academic Affairs',
      department: 'Regional Maritime University',
    };

    const pdfBuffer = await generateOfficialLetterPDF(placement, student, signature);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Official_Letter_${placement.referenceNumber || placement.id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error downloading official letter:', error);
    res.status(500).json({ message: 'Failed to download official letter', error: error.message });
  }
}

// Admin: get tracking data for all placements
async function getTrackingData(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { InternshipPlacement, EvaluationToken, EmailLog, User: UserModel } = require('../models');

    const placements = await InternshipPlacement.findAll({});
    
    const trackingData = [];
    for (const placement of placements) {
      // Get student info
      const student = await UserModel.findOne({ id: placement.studentId });
      
      // Get evaluation tokens
      const tokens = await EvaluationToken.findByPlacement(placement.id);
      
      // Get email logs
      const emailLogs = await EmailLog.findByPlacement(placement.id);

      trackingData.push({
        ...placement,
        student: student ? {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          studentId: student.studentId,
          email: student.email,
          program: student.program,
        } : null,
        evaluationTokens: tokens,
        emailLogs,
        emailSent: emailLogs.length > 0,
        lastEmailSentAt: emailLogs.length > 0 ? emailLogs[0].sentDate : null,
      });
    }

    res.json({ trackingData });
  } catch (error) {
    console.error('Error fetching tracking data:', error);
    res.status(500).json({ message: 'Failed to fetch tracking data', error: error.message });
  }
}

// Public: verify a document by verification code
async function verifyDocument(req, res) {
  try {
    const { code } = req.params;
    const { InternshipPlacement, User } = require('../models');

    // Search by verification code
    const placement = await InternshipPlacement.findOne({ verificationCode: code });
    if (!placement) {
      return res.json({
        valid: false,
        message: 'No document found with this verification code.',
      });
    }

    // Load student data
    const student = await User.findByPk(placement.studentId);

    res.json({
      valid: true,
      document: {
        studentName: student ? `${student.firstName} ${student.lastName}` : 'N/A',
        organisationName: placement.organizationName,
        dateIssued: placement.officialLetterGeneratedAt
          ? new Date(placement.officialLetterGeneratedAt).toLocaleDateString('en-GB')
          : 'N/A',
        referenceNumber: placement.referenceNumber,
        status: placement.status === 'approved' ? 'Valid' : 'Invalid',
      },
    });
  } catch (error) {
    console.error('Error verifying document:', error);
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
}

module.exports = {
  createPlacement,
  getPlacements,
  getPlacementById,
  updatePlacementStatus,
  sendToOrganization,
  downloadOfficialLetter,
  getTrackingData,
  verifyDocument,
};
