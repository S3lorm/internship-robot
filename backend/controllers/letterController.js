const { User } = require('../models');
const auth = require('../middleware/auth');

// Program-specific signatures
const programSignatures = {
  'BSc Marine Engineering': {
    name: 'Dr. [Name]',
    title: 'Head of Department',
    department: 'Marine Engineering',
    signature: '/signatures/marine-engineering.png' // Path to signature image
  },
  'BSc Nautical Science': {
    name: 'Dr. [Name]',
    title: 'Head of Department',
    department: 'Nautical Science',
    signature: '/signatures/nautical-science.png'
  },
  'BSc Port & Shipping Administration': {
    name: 'Dr. [Name]',
    title: 'Head of Department',
    department: 'Port & Shipping Administration',
    signature: '/signatures/port-shipping.png'
  },
  'BSc Maritime Safety & Security': {
    name: 'Dr. [Name]',
    title: 'Head of Department',
    department: 'Maritime Safety & Security',
    signature: '/signatures/maritime-safety.png'
  },
  'BSc Electrical/Electronic Engineering': {
    name: 'Dr. [Name]',
    title: 'Head of Department',
    department: 'Electrical/Electronic Engineering',
    signature: '/signatures/electrical-engineering.png'
  },
  'BSc Computer Science': {
    name: 'Dr. [Name]',
    title: 'Head of Department',
    department: 'Computer Science',
    signature: '/signatures/computer-science.png'
  },
  'Diploma in Maritime Studies': {
    name: 'Dr. [Name]',
    title: 'Head of Department',
    department: 'Maritime Studies',
    signature: '/signatures/maritime-studies.png'
  }
};

// Default signature if program not found
const defaultSignature = {
  name: 'Dr. [Name]',
  title: 'Dean of Academic Affairs',
  department: 'Regional Maritime University',
  signature: '/signatures/default.png'
};

function generateLetterHTML(user, internship = null, letterRequest = null) {
  const signature = programSignatures[user.program] || defaultSignature;
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Use letter request details if provided, otherwise use internship details
  let internshipDetails = '';
  if (letterRequest) {
    internshipDetails = `
      <p><strong>Company/Organization:</strong> ${letterRequest.companyName}</p>
      ${letterRequest.companyAddress ? `<p><strong>Address:</strong> ${letterRequest.companyAddress}</p>` : ''}
      <p><strong>Internship Duration:</strong> ${letterRequest.internshipDuration}</p>
      ${letterRequest.internshipStartDate ? `<p><strong>Start Date:</strong> ${new Date(letterRequest.internshipStartDate).toLocaleDateString('en-GB')}</p>` : ''}
      ${letterRequest.internshipEndDate ? `<p><strong>End Date:</strong> ${new Date(letterRequest.internshipEndDate).toLocaleDateString('en-GB')}</p>` : ''}
      ${letterRequest.purpose ? `<p><strong>Purpose:</strong> ${letterRequest.purpose}</p>` : ''}
    `;
  } else if (internship) {
    internshipDetails = `
      <p><strong>Internship Position:</strong> ${internship.title}</p>
      <p><strong>Company:</strong> ${internship.company}</p>
      <p><strong>Location:</strong> ${internship.location}</p>
      <p><strong>Duration:</strong> ${internship.duration}</p>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Internship Application Letter - ${user.firstName} ${user.lastName}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
    body {
      font-family: 'Times New Roman', serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.6;
      color: #000;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #000;
      padding-bottom: 20px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .university-name {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .address {
      font-size: 12px;
      margin-top: 10px;
    }
    .date {
      text-align: right;
      margin-bottom: 30px;
    }
    .recipient {
      margin-bottom: 30px;
    }
    .subject {
      font-weight: bold;
      margin-bottom: 20px;
      text-decoration: underline;
    }
    .content {
      text-align: justify;
      margin-bottom: 20px;
    }
    .content p {
      margin-bottom: 15px;
      text-indent: 30px;
    }
    .signature-section {
      margin-top: 50px;
    }
    .signature-line {
      border-top: 1px solid #000;
      width: 300px;
      margin-top: 60px;
    }
    .signature-name {
      margin-top: 5px;
      font-weight: bold;
    }
    .signature-title {
      font-size: 12px;
    }
    .footer {
      margin-top: 30px;
      font-size: 10px;
      text-align: center;
      color: #666;
    }
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      background: #1e40af;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
    }
    .print-button:hover {
      background: #1e3a8a;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">Print / Save as PDF</button>
  
  <div class="header">
    <div class="logo">RMU</div>
    <div class="university-name">REGIONAL MARITIME UNIVERSITY</div>
    <div class="address">
      P.O. Box GP 1115, Accra, Ghana<br>
      Tel: +233 302 712 775 | Email: info@rmu.edu.gh<br>
      Website: www.rmu.edu.gh
    </div>
  </div>

  <div class="date">
    ${currentDate}
  </div>

  <div class="recipient">
    <p>The Human Resources Manager</p>
    ${internship ? `<p>${internship.company}</p>` : '<p>[Company Name]</p>'}
    ${internship ? `<p>${internship.location}</p>` : '<p>[Company Address]</p>'}
  </div>

  <div class="subject">
    SUBJECT: RECOMMENDATION FOR INTERNSHIP PLACEMENT - ${user.firstName.toUpperCase()} ${user.lastName.toUpperCase()}
  </div>

  <div class="content">
    <p>
      I am writing to recommend <strong>${user.firstName} ${user.lastName}</strong>, 
      Student ID: <strong>${user.studentId || 'N/A'}</strong>, a ${user.yearOfStudy || 'N/A'}${getOrdinalSuffix(user.yearOfStudy)} 
      year student enrolled in the <strong>${user.program || 'N/A'}</strong> program at the Regional Maritime University.
    </p>

    ${internshipDetails}

    <p>
      ${user.firstName} ${user.lastName} has demonstrated exceptional academic performance and a strong commitment 
      to their studies. Throughout their time at the Regional Maritime University, they have shown dedication, 
      professionalism, and a genuine interest in gaining practical experience in the maritime industry.
    </p>

    <p>
      We believe that ${user.firstName} would be an excellent candidate for this internship opportunity. 
      Their academic background, combined with their enthusiasm and willingness to learn, makes them well-suited 
      for this position. We are confident that they will contribute positively to your organization while 
      gaining valuable industry experience.
    </p>

    <p>
      The Regional Maritime University fully supports this internship placement and will ensure that 
      ${user.firstName} maintains the highest standards of professionalism and academic excellence 
      throughout the internship period.
    </p>

    <p>
      We would be grateful if you could consider ${user.firstName}'s application for this internship 
      opportunity. Should you require any additional information, please do not hesitate to contact us.
    </p>

    <p>
      Thank you for considering our student for this valuable learning opportunity.
    </p>
  </div>

  <div class="signature-section">
    <p>Yours faithfully,</p>
    <div class="signature-line"></div>
    <div class="signature-name">${signature.name}</div>
    <div class="signature-title">${signature.title}</div>
    <div class="signature-title">${signature.department}</div>
    <div class="signature-title">Regional Maritime University</div>
  </div>

  ${letterRequest && (letterRequest.referenceNumber || letterRequest.verificationCode) ? `
  <div class="reference-info">
    <p><strong>Document Reference:</strong> ${letterRequest.referenceNumber || 'N/A'}</p>
    ${letterRequest.verificationCode ? `<p><strong>Verification Code:</strong> ${letterRequest.verificationCode}</p>` : ''}
    <p><em>This document can be verified by contacting the Regional Maritime University with the reference number above.</em></p>
  </div>
  ` : ''}

  <div class="footer">
    <p>This is an official document from the Regional Maritime University</p>
    <p>For verification, please contact: info@rmu.edu.gh</p>
  </div>

  <script>
    // Auto-print on load (optional - can be removed)
    // window.onload = function() {
    //   setTimeout(() => window.print(), 500);
    // };
  </script>
</body>
</html>
  `;
}

function getOrdinalSuffix(num) {
  if (!num) return '';
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

async function generateLetter(req, res) {
  try {
    const user = req.user;
    const { internshipId } = req.query;

    if (!user || user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can generate letters' });
    }

    // Fetch user with latest data
    const fullUser = await User.findByPk(user.id);
    if (!fullUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If internshipId provided, fetch internship details
    let internship = null;
    if (internshipId) {
      const { Internship } = require('../models');
      internship = await Internship.findByPk(internshipId);
    }

    const html = generateLetterHTML(fullUser, internship);

    // Return HTML that can be rendered or converted to PDF
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error generating letter:', error);
    res.status(500).json({ message: 'Failed to generate letter', error: error.message });
  }
}

async function downloadLetter(req, res) {
  try {
    const user = req.user;
    const { internshipId, format = 'html' } = req.query;

    if (!user || user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can download letters' });
    }

    const fullUser = await User.findByPk(user.id);
    if (!fullUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    let internship = null;
    if (internshipId) {
      const { Internship } = require('../models');
      internship = await Internship.findByPk(internshipId);
    }

    const html = generateLetterHTML(fullUser, internship);

    if (format === 'html') {
      const filename = `Internship_Letter_${user.firstName}_${user.lastName}_${Date.now()}.html`;
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(html);
    } else {
      // For PDF, you would need a library like puppeteer or html-pdf
      // For now, return HTML which can be printed to PDF
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    }
  } catch (error) {
    console.error('Error downloading letter:', error);
    res.status(500).json({ message: 'Failed to download letter', error: error.message });
  }
}

// Letter Request Controllers
async function createRequest(req, res) {
  try {
    const user = req.user;
    const { LetterRequest } = require('../models');
    
    if (!user || user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can create letter requests' });
    }

    const {
      companyName,
      companyEmail,
      companyPhone,
      companyAddress,
      internshipDuration,
      internshipStartDate,
      internshipEndDate,
      purpose,
      category,
      additionalNotes,
    } = req.body;

    // Validation
    if (!companyName || !internshipDuration || !purpose) {
      return res.status(400).json({ 
        message: 'Company name, internship duration, and purpose are required' 
      });
    }

    const request = await LetterRequest.create({
      studentId: user.id,
      companyName,
      companyEmail,
      companyPhone,
      companyAddress,
      internshipDuration,
      internshipStartDate,
      internshipEndDate,
      purpose,
      category,
      additionalNotes,
      status: 'pending',
    });

    // Create notification for admin
    const { createNotification } = require('../services/notificationService');
    const { User } = require('../models');
    const admins = await User.findAll({ where: { role: 'admin' } });
    
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'letter_request',
        title: 'New Letter Request',
        message: `${user.firstName} ${user.lastName} has requested an internship letter for ${companyName}`,
        relatedId: request.id,
      });
    }

    res.status(201).json({ 
      message: 'Letter request submitted successfully', 
      request 
    });
  } catch (error) {
    console.error('Error creating letter request:', error);
    res.status(500).json({ 
      message: 'Failed to create letter request', 
      error: error.message 
    });
  }
}

async function getRequests(req, res) {
  try {
    const user = req.user;
    const { LetterRequest } = require('../models');
    const { status } = req.query;

    let where = {};
    
    // Students can only see their own requests
    if (user.role === 'student') {
      where.studentId = user.id;
    }
    
    // Admins can filter by status
    if (status && user.role === 'admin') {
      where.status = status;
    }

    const requests = await LetterRequest.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    // Load related student and reviewer data
    const { User } = require('../models');
    for (const request of requests) {
      if (request.studentId) {
        const student = await User.findOne({ id: request.studentId });
        if (student) request.student = student;
      }
      if (request.reviewedBy) {
        const reviewer = await User.findOne({ id: request.reviewedBy });
        if (reviewer) request.reviewer = reviewer;
      }
    }

    res.json({ requests });
  } catch (error) {
    console.error('Error fetching letter requests:', error);
    res.status(500).json({ 
      message: 'Failed to fetch letter requests', 
      error: error.message 
    });
  }
}

async function getRequestById(req, res) {
  try {
    const user = req.user;
    const { LetterRequest } = require('../models');
    const { id } = req.params;

    const request = await LetterRequest.findByPk(id);

    // Load related student and reviewer data
    if (request) {
      const { User } = require('../models');
      if (request.studentId) {
        const student = await User.findOne({ id: request.studentId });
        if (student) request.student = student;
      }
      if (request.reviewedBy) {
        const reviewer = await User.findOne({ id: request.reviewedBy });
        if (reviewer) request.reviewer = reviewer;
      }
    }

    if (!request) {
      return res.status(404).json({ message: 'Letter request not found' });
    }

    // Students can only view their own requests
    if (user.role === 'student' && request.studentId !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ request });
  } catch (error) {
    console.error('Error fetching letter request:', error);
    res.status(500).json({ 
      message: 'Failed to fetch letter request', 
      error: error.message 
    });
  }
}

async function updateRequestStatus(req, res) {
  try {
    const user = req.user;
    const { LetterRequest } = require('../models');
    const { id } = req.params;
    const { status, adminNotes, sendEmail } = req.body;

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await LetterRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({ message: 'Letter request not found' });
    }

    const updateData = {
      status,
      adminNotes,
      reviewedBy: user.id,
      reviewedAt: new Date().toISOString(),
    };

    // If approved, generate PDF
    if (status === 'approved' && !request.pdfUrl) {
      try {
        const pdfData = await generateLetterPDF(request);
        updateData.pdfUrl = pdfData.url;
        updateData.pdfGeneratedAt = new Date().toISOString();
      } catch (pdfError) {
        console.error('Error generating PDF:', pdfError);
        // Continue with approval even if PDF generation fails
      }
    }

    const updated = await LetterRequest.update(id, updateData);

    // Create notification for student
    const { createNotification } = require('../services/notificationService');
    const notificationTitle = status === 'approved' 
      ? 'Letter Request Approved - PDF Ready' 
      : 'Letter Request Rejected';
    const notificationMessage = status === 'approved'
      ? `Your internship letter request for ${request.companyName} has been approved. Your PDF letter is now available for download. Reference: ${request.referenceNumber || 'N/A'}`
      : `Your internship letter request for ${request.companyName} has been rejected.`;

    await createNotification({
      userId: request.studentId,
      type: 'letter_request',
      title: notificationTitle,
      message: notificationMessage,
      relatedId: request.id,
      link: status === 'approved' ? `/dashboard/letter-requests?view=${request.id}` : undefined,
    });

    // Send email notification if requested and approved
    if (status === 'approved' && sendEmail !== false) {
      try {
        await sendLetterEmailNotification(request, updated);
        await LetterRequest.update(id, {
          emailSent: true,
          emailSentAt: new Date().toISOString(),
        });
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json({ 
      message: 'Request status updated successfully', 
      request: updated 
    });
  } catch (error) {
    console.error('Error updating letter request status:', error);
    res.status(500).json({ 
      message: 'Failed to update request status', 
      error: error.message 
    });
  }
}

// Generate PDF from letter request
async function generateLetterPDF(request) {
  const { User } = require('../models');
  const student = await User.findOne({ id: request.studentId });
  
  if (!student) {
    throw new Error('Student not found');
  }

  // Generate HTML letter
  const html = generateLetterHTML(student, null, request);

  // Create document verification record for security and integrity
  if (request.referenceNumber && request.verificationCode) {
    const { createDocumentVerification } = require('../services/documentVerificationService');
    await createDocumentVerification({
      documentType: 'letter',
      documentId: request.id,
      referenceNumber: request.referenceNumber,
      verificationCode: request.verificationCode,
      content: html,
      generatedBy: request.reviewedBy || student.id,
      metadata: {
        companyName: request.companyName,
        studentId: request.studentId,
        studentName: `${student.firstName} ${student.lastName}`,
      },
    });
  }
  
  const { v4: uuidv4 } = require('uuid');
  const filename = `letter_${request.referenceNumber || request.id}_${Date.now()}.html`;
  
  return {
    url: `/api/letters/requests/${request.id}/download`,
    filename: filename,
  };
}

// Send email notification when letter is approved
async function sendLetterEmailNotification(request, updatedRequest) {
  const transporter = require('../config/email');
  const { User } = require('../models');
  const student = await User.findOne({ id: request.studentId });

  if (!student || !student.email) {
    throw new Error('Student email not found');
  }

  const emailFrom = process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@rmu.edu.gh';
  
  const mailOptions = {
    from: `"RMU Internship Portal" <${emailFrom}>`,
    to: student.email,
    subject: `Internship Letter Approved - ${request.referenceNumber || 'Reference'}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e3a5f; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #1e3a5f; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #1e3a5f; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Internship Letter Approved</h1>
          </div>
          <div class="content">
            <p>Dear ${student.firstName} ${student.lastName},</p>
            
            <p>Your internship letter request has been <strong>approved</strong> and is now available for download.</p>
            
            <div class="info-box">
              <h3>Request Details</h3>
              <p><strong>Reference Number:</strong> ${request.referenceNumber || 'N/A'}</p>
              <p><strong>Verification Code:</strong> ${request.verificationCode || 'N/A'}</p>
              <p><strong>Company:</strong> ${request.companyName}</p>
              <p><strong>Duration:</strong> ${request.internshipDuration}</p>
            </div>
            
            <p>You can download your letter from your dashboard:</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/letter-requests?view=${request.id}" class="button">
              Download Letter
            </a>
            
            <p>If you have any questions, please contact the administration office.</p>
            
            <p>Best regards,<br>RMU Internship Portal</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Dear ${student.firstName} ${student.lastName},

      Your internship letter request has been approved and is now available for download.

      Reference Number: ${request.referenceNumber || 'N/A'}
      Verification Code: ${request.verificationCode || 'N/A'}
      Company: ${request.companyName}
      Duration: ${request.internshipDuration}

      Download your letter: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/letter-requests?view=${request.id}

      Best regards,
      RMU Internship Portal
    `,
  };

  await transporter.sendMail(mailOptions);
}

// Download PDF endpoint
async function downloadLetterPDF(req, res) {
  try {
    const user = req.user;
    const { LetterRequest } = require('../models');
    const { id } = req.params;

    const request = await LetterRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({ message: 'Letter request not found' });
    }

    // Students can only download their own letters
    if (user.role === 'student' && request.studentId !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only approved requests can be downloaded
    if (request.status !== 'approved') {
      return res.status(400).json({ message: 'Letter not yet approved' });
    }

    // Generate letter HTML
    const { User } = require('../models');
    const student = await User.findOne({ id: request.studentId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const html = generateLetterHTML(student, null, request);

    // Log document download
    const { logActivity } = require('../services/activityLogService');
    const { recordDocumentTransmission } = require('../services/documentTransmissionService');
    
    await logActivity({
      userId: user.id,
      actionType: 'document_download',
      resourceType: 'letter_request',
      resourceId: id,
      description: `Downloaded letter PDF: ${request.referenceNumber || request.id}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      metadata: {
        referenceNumber: request.referenceNumber,
        verificationCode: request.verificationCode,
      },
    });

    // Record document transmission
    await recordDocumentTransmission({
      documentId: id,
      documentType: 'letter',
      senderId: user.id,
      recipientType: user.role === 'student' ? 'student' : 'admin',
      recipientEmail: user.email,
      recipientName: `${user.firstName} ${user.lastName}`,
      transmissionMethod: 'download',
      metadata: {
        referenceNumber: request.referenceNumber,
        verificationCode: request.verificationCode,
      },
    });

    // Increment download count
    await LetterRequest.update(id, {
      downloadCount: (request.downloadCount || 0) + 1,
      lastDownloadedAt: new Date().toISOString(),
    });

    // Return HTML (can be printed to PDF by browser)
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="Internship_Letter_${request.referenceNumber || request.id}.html"`);
    res.send(html);
  } catch (error) {
    console.error('Error downloading letter PDF:', error);
    res.status(500).json({ 
      message: 'Failed to download letter', 
      error: error.message 
    });
  }
}

// Mark email as sent (for tracking purposes)
async function markEmailSent(req, res) {
  try {
    const user = req.user;
    const { LetterRequest } = require('../models');
    const { id } = req.params;

    const request = await LetterRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({ message: 'Letter request not found' });
    }

    // Students can only mark their own requests
    if (user.role === 'student' && request.studentId !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update email sent status
    const updated = await LetterRequest.update(id, {
      emailSent: true,
      emailSentAt: new Date().toISOString(),
    });

    res.json({ 
      message: 'Email status updated successfully', 
      request: updated 
    });
  } catch (error) {
    console.error('Error marking email as sent:', error);
    res.status(500).json({ 
      message: 'Failed to update email status', 
      error: error.message 
    });
  }
}

// Update letter request details (Admin only - before approval)
async function updateRequest(req, res) {
  try {
    const user = req.user;
    const { LetterRequest } = require('../models');
    const { id } = req.params;
    const {
      companyName,
      companyEmail,
      companyPhone,
      companyAddress,
      internshipDuration,
      internshipStartDate,
      internshipEndDate,
      purpose,
      category,
      additionalNotes,
    } = req.body;

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const request = await LetterRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({ message: 'Letter request not found' });
    }

    // Only allow editing if status is pending
    if (request.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Cannot edit request that has already been approved or rejected' 
      });
    }

    const updateData = {};
    if (companyName !== undefined) updateData.companyName = companyName;
    if (companyEmail !== undefined) updateData.companyEmail = companyEmail;
    if (companyPhone !== undefined) updateData.companyPhone = companyPhone;
    if (companyAddress !== undefined) updateData.companyAddress = companyAddress;
    if (internshipDuration !== undefined) updateData.internshipDuration = internshipDuration;
    if (internshipStartDate !== undefined) updateData.internshipStartDate = internshipStartDate;
    if (internshipEndDate !== undefined) updateData.internshipEndDate = internshipEndDate;
    if (purpose !== undefined) updateData.purpose = purpose;
    if (category !== undefined) updateData.category = category;
    if (additionalNotes !== undefined) updateData.additionalNotes = additionalNotes;

    const updated = await LetterRequest.update(id, updateData);

    res.json({ 
      message: 'Request updated successfully', 
      request: updated 
    });
  } catch (error) {
    console.error('Error updating letter request:', error);
    res.status(500).json({ 
      message: 'Failed to update request', 
      error: error.message 
    });
  }
}

module.exports = {
  generateLetter,
  downloadLetter,
  programSignatures,
  createRequest,
  getRequests,
  getRequestById,
  updateRequest,
  updateRequestStatus,
  downloadLetterPDF,
  markEmailSent,
};
