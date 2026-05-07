const crypto = require('crypto');
const { normalizeDepartmentName } = require('../constants/departments');

function departmentMatch(a, b) {
  const na = normalizeDepartmentName(a) || (a && String(a).trim()) || '';
  const nb = normalizeDepartmentName(b) || (b && String(b).trim()) || '';
  if (!na || !nb) return false;
  return na.toLowerCase() === nb.toLowerCase();
}

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
      supervisorEmail,
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
      supervisorEmail,
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
        title: 'New official placement request',
        message: `${user.firstName} ${user.lastName} (${user.studentId || 'student'}) submitted an official placement for ${organizationName}. The department HOD is notified first; if they deny, ignore the request, or you need to step in, you have the same tools in Official placements — approve or deny with a reason, and on approval the official letter and evaluation link are emailed to the organization.`,
        relatedId: placement.id,
        link: '/admin/official-placement-management',
      });
    }

    const hods = await User.findAll({ where: { role: 'hod' } });
    for (const hod of hods) {
      if (!departmentMatch(hod.department, user.department)) continue;
      await createNotification({
        userId: hod.id,
        type: 'letter_request',
        title: 'Official placement request — your department',
        message: `${user.firstName} ${user.lastName} (${user.studentId || 'student'}) submitted an official placement for ${organizationName}. Approve or deny with a reason; if approved, the official letter and evaluation link are emailed to the organization.`,
        relatedId: placement.id,
        link: '/admin/internship-tracking',
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

    let placements = await InternshipPlacement.findAll({ where });

    // Load related student data
    const { User } = require('../models');
    for (const placement of placements) {
      if (placement.studentId) {
        const student = await User.findOne({ id: placement.studentId });
        if (student) placement.student = student;
      }
    }

    if (user.role === 'hod') {
      placements = placements.filter(
        (p) => p.student && departmentMatch(p.student.department, user.department)
      );
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
    const { InternshipPlacement, EvaluationToken, EmailLog, PlacementActionLog, User: UserModel } = require('../models');
    const { id } = req.params;

    const placement = await InternshipPlacement.findByPk(id);
    if (!placement) {
      return res.status(404).json({ message: 'Placement not found' });
    }

    if (user.role === 'student' && placement.studentId !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (placement.studentId) {
      const student = await UserModel.findOne({ id: placement.studentId });
      if (student) placement.student = student;
      if (user.role === 'hod' && (!student || !departmentMatch(student.department, user.department))) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Load evaluation tokens
    const tokens = await EvaluationToken.findByPlacement(id);
    placement.evaluationTokens = tokens;

    // Load email logs
    const emailLogs = await EmailLog.findByPlacement(id);
    placement.emailLogs = emailLogs;

    if (user.role === 'admin' || user.role === 'hod') {
      try {
        const rawLogs = await PlacementActionLog.findByPlacementId(id);
        const actionLogs = [];
        for (const log of rawLogs) {
          let actor = null;
          if (log.actorId) {
            const u = await UserModel.findOne({ id: log.actorId });
            if (u) {
              actor = {
                id: u.id,
                firstName: u.firstName,
                lastName: u.lastName,
                email: u.email,
              };
            }
          }
          actionLogs.push({ ...log, actor });
        }
        placement.actionLogs = actionLogs;
      } catch (logErr) {
        // e.g. migration 016 not applied yet — do not fail the whole GET
        console.error('placement action logs (non-fatal):', logErr?.message || logErr);
        placement.actionLogs = [];
      }
    }

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

    if (user.role !== 'admin' && user.role !== 'hod') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!['pending', 'approved', 'rejected', 'modification_requested'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const placement = await InternshipPlacement.findByPk(id);
    if (!placement) {
      return res.status(404).json({ message: 'Placement not found' });
    }

    if (user.role === 'hod') {
      const { User: UserModel } = require('../models');
      const st = await UserModel.findOne({ id: placement.studentId });
      if (!st || !departmentMatch(st.department, user.department)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const notesTrim = adminNotes != null ? String(adminNotes).trim() : '';
    if (status === 'rejected' && !notesTrim) {
      return res.status(400).json({
        message: 'A written reason is required when denying an official placement request.',
      });
    }
    if (status === 'modification_requested' && !notesTrim) {
      return res.status(400).json({
        message: 'Please explain what must be corrected before requesting modifications.',
      });
    }

    const previousStatus = placement.status;
    if (previousStatus === status) {
      return res.status(400).json({
        message: 'This request is already in the selected state. No update was made.',
      });
    }

    const isNewApproval = status === 'approved' && previousStatus !== 'approved';

    const updateData = {
      status,
      adminNotes:
        notesTrim.length > 0
          ? notesTrim
          : status === 'approved'
            ? placement.adminNotes ?? null
            : notesTrim,
      reviewedBy: user.id,
      reviewedAt: new Date().toISOString(),
    };

    // First-time approval only: reference, token, and auto-email (avoids duplicate tokens and duplicate emails)
    if (isNewApproval) {
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

      try {
        const { User: UserModel } = require('../models');
        const { resolveOfficialPlacementSignature } = require('../services/officialPlacementLetterSignature');
        const { signatureSnapshot } = require('../services/staffSignatureService');
        const student = await UserModel.findOne({ id: placement.studentId });
        if (student) {
          updateData.signatureSnapshot = signatureSnapshot(await resolveOfficialPlacementSignature({ ...placement, reviewedBy: user.id }, student));
        }
      } catch (signatureErr) {
        console.error('Official placement signature snapshot failed:', signatureErr.message || signatureErr);
      }

      // Generate secure evaluation token using SHA-256
      const tokenRaw = `${id}-${placement.studentId}-${Date.now()}-${crypto.randomBytes(32).toString('hex')}`;
      const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');

      let tokenExpiresAt;
      if (placement.internshipEndDate) {
        const end = new Date(placement.internshipEndDate);
        end.setDate(end.getDate() + 90);
        tokenExpiresAt = end.toISOString();
      } else {
        tokenExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      }

      await EvaluationToken.create({
        placementId: id,
        tokenHash,
        expiresAt: tokenExpiresAt,
      });
    }

    const updated = await InternshipPlacement.update(id, updateData);

    let organizationEmailSent = false;
    let organizationEmailError = null;
    if (isNewApproval) {
      try {
        const { sendOfficialLetterAndEvaluationToOrganization } = require('../services/placementOrganizationEmail');
        const sendResult = await sendOfficialLetterAndEvaluationToOrganization(id);
        if (sendResult.ok) {
          organizationEmailSent = true;
        } else {
          organizationEmailError = sendResult.error;
          console.error('Auto-send to organization after approval:', sendResult.error);
        }
      } catch (err) {
        organizationEmailError = err.message || String(err);
        console.error('Auto-send to organization after approval failed:', err);
      }
    }

    try {
      const { PlacementActionLog } = require('../models');
      await PlacementActionLog.create({
        placementId: id,
        actorId: user.id,
        actorRole: user.role,
        action: status,
        previousStatus,
        newStatus: status,
        notes: notesTrim.length > 0 ? notesTrim : null,
        organizationEmailSent: isNewApproval ? organizationEmailSent : null,
      });
    } catch (logErr) {
      console.error('placement_action_logs insert failed:', logErr);
    }

    // Notify student
    const { createNotification } = require('../services/notificationService');
    const approvedMsg = organizationEmailSent
      ? `Your official placement for ${placement.organizationName} was approved. The official letter (PDF with university logo) and supervisor evaluation link were sent to ${placement.organizationEmail}.`
      : organizationEmailError
        ? `Your official placement for ${placement.organizationName} was approved, but the automatic email to the organization could not be sent (${organizationEmailError}). You can try sending from your dashboard when ready.`
        : `Your official placement request for ${placement.organizationName} has been approved. You can send the official letter to the organization from your dashboard.`;

    const statusMsg = {
      approved: approvedMsg,
      rejected: notesTrim
        ? `Your official placement request for ${placement.organizationName} was not approved. Reason: ${notesTrim}`
        : `Your official placement request for ${placement.organizationName} has been rejected.`,
      modification_requested: notesTrim
        ? `Your official placement for ${placement.organizationName} needs updates before it can be approved. Instructions: ${notesTrim}`
        : `Your official placement request for ${placement.organizationName} requires modifications. Please review the notes in the portal.`,
    };

    await createNotification({
      userId: placement.studentId,
      type: 'letter_request',
      title: status === 'approved'
        ? organizationEmailSent
          ? 'Placement approved — organization notified'
          : 'Placement Approved - Official Letter Ready'
        : status === 'rejected'
          ? 'Placement Request Rejected'
          : 'Placement Requires Modifications',
      message: statusMsg[status] || `Your placement request status has been updated to ${status}`,
      relatedId: id,
      link: `/dashboard/letter-requests/official?view=${id}`,
    });

    if (user.role === 'hod' && (status === 'rejected' || status === 'modification_requested')) {
      const { User: UserModel } = require('../models');
      const adminsForEscalation = await UserModel.findAll({ where: { role: 'admin' } });
      const stu = await UserModel.findOne({ id: placement.studentId });
      const stLabel = stu ? `${stu.firstName} ${stu.lastName}` : 'A student';
      const actionLabel = status === 'rejected' ? 'denied' : 'returned for changes';
      const reasonSnippet =
        notesTrim.length > 220 ? `${notesTrim.slice(0, 217)}…` : notesTrim;
      for (const admin of adminsForEscalation) {
        await createNotification({
          userId: admin.id,
          type: 'letter_request',
          title: 'Official placement — HOD decision (you may take over)',
          message: `${stLabel}'s official placement for ${placement.organizationName} was ${actionLabel} by the department HOD.${reasonSnippet ? ` Reason: ${reasonSnippet}` : ''} If the student resubmits or you need to decide instead, open Official placements — you have the same approval, denial, and organisation email options as the HOD.`,
          relatedId: id,
          link: '/admin/official-placement-management',
        });
      }
    }

    res.json({
      message: 'Placement status updated successfully',
      placement: updated,
      ...(isNewApproval
        ? { organizationEmailSent, ...(organizationEmailError ? { organizationEmailError } : {}) }
        : {}),
    });
  } catch (error) {
    console.error('Error updating placement status:', error);
    res.status(500).json({ message: 'Failed to update placement status', error: error.message });
  }
}

// Student (or resend): send official letter + evaluation form — same pipeline as HOD approval auto-send
async function sendToOrganization(req, res) {
  try {
    const user = req.user;
    const { InternshipPlacement } = require('../models');
    const { id } = req.params;

    const placement = await InternshipPlacement.findByPk(id);
    if (!placement) {
      return res.status(404).json({ message: 'Placement not found' });
    }

    if (user.role === 'student' && placement.studentId !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (user.role !== 'admin' && user.role !== 'hod' && user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (placement.status !== 'approved') {
      return res.status(400).json({ message: 'Placement must be approved before sending to organization' });
    }

    if (user.role === 'hod') {
      const { User: UserModel } = require('../models');
      const st = await UserModel.findOne({ id: placement.studentId });
      if (!st || !departmentMatch(st.department, user.department)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const { sendOfficialLetterAndEvaluationToOrganization } = require('../services/placementOrganizationEmail');
    const sendResult = await sendOfficialLetterAndEvaluationToOrganization(id);
    if (!sendResult.ok) {
      return res.status(400).json({ message: sendResult.error });
    }

    const { createNotification } = require('../services/notificationService');
    await createNotification({
      userId: placement.studentId,
      type: 'letter_request',
      title: 'Official Letter Sent to Organization',
      message: `Your official internship letter and evaluation form have been sent to ${placement.organizationName} (${placement.organizationEmail}).`,
      relatedId: id,
    });

    res.json({
      message: 'Official letter and evaluation form sent successfully to the organization',
      placement: sendResult.placement,
    });
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

    if (user.role === 'hod' && !departmentMatch(student.department, user.department)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { resolveOfficialPlacementSignature } = require('../services/officialPlacementLetterSignature');
    const { signatureFromSnapshot } = require('../services/staffSignatureService');
    const signature = signatureFromSnapshot(placement.signatureSnapshot, student) || await resolveOfficialPlacementSignature(placement, student);

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
    if (user.role !== 'admin' && user.role !== 'hod') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { InternshipPlacement, EvaluationToken, EmailLog, User: UserModel } = require('../models');

    const placements = await InternshipPlacement.findAll({});
    
    const trackingData = [];
    for (const placement of placements) {
      // Get student info
      const student = await UserModel.findOne({ id: placement.studentId });

      if (user.role === 'hod' && (!student || !departmentMatch(student.department, user.department))) {
        continue;
      }
      
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
          department: student.department,
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
