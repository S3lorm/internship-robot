const { studentBelongsToHodDepartment } = require('../constants/departmentCatalog');
const { isEmailVerifiedStudent } = require('../utils/verifiedStudent');

function isDepartmentHod(user) {
  if (!user) return false;
  if (user.originalRole === 'secutuary' || user.role === 'secutuary') return false;
  return user.role === 'hod' && Boolean(user.department);
}

function canStaffAccess(user, bundle) {
  if (!user || !bundle?.student) return false;
  if (user.originalRole === 'secutuary' || user.role === 'secutuary') return true;
  if (user.role === 'hod') {
    if (!user.department) return false;
    if (!studentBelongsToHodDepartment(bundle.student, user.department)) return false;
    // Logbook bundles load student from user_profiles; require verified when that flag is present.
    if (bundle.student.isEmailVerified === false) return false;
    if (bundle.student.role && bundle.student.role !== 'student') return false;
    return true;
  }
  return false;
}

function supervisorEmailForPlacement(placement) {
  return placement?.supervisor_email || placement?.organization_email || null;
}

async function getMyLogbook(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can access their Weekly Log Sheet Book here.' });
    }

    const { WeeklyLogbook } = require('../models');
    const { getPortalStatusPayload } = require('../services/internshipPortalService');
    const portalPayload = await getPortalStatusPayload();
    const placement = await WeeklyLogbook.findApprovedPlacementForStudent(user.id, req.query.placementId, {
      portalPayload,
    });
    if (!placement) {
      return res.status(404).json({ message: 'No approved official placement was found for this student.' });
    }

    const logbook = await WeeklyLogbook.getOrCreateForPlacement(user.id, placement.id);
    const bundle = await WeeklyLogbook.bundle(logbook.id);
    const { buildWeeklyLogSchedule } = require('../utils/weeklyLogbookSchedule');
    const schedule = buildWeeklyLogSchedule(placement);
    res.json({ bundle, schedule });
  } catch (error) {
    console.error('Error loading weekly logbook:', error);
    res.status(500).json({ message: 'Failed to load weekly logbook', error: error.message });
  }
}

async function getLogbook(req, res) {
  try {
    const user = req.user;
    const { WeeklyLogbook } = require('../models');
    const bundle = await WeeklyLogbook.bundle(req.params.id);
    if (!bundle) return res.status(404).json({ message: 'Weekly Log Sheet Book not found' });

    if (user.role === 'student' && bundle.logbook.studentId !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (user.role !== 'student' && !canStaffAccess(user, bundle)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ bundle });
  } catch (error) {
    console.error('Error loading weekly logbook:', error);
    res.status(500).json({ message: 'Failed to load weekly logbook', error: error.message });
  }
}

async function saveWeek(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'student') return res.status(403).json({ message: 'Only students can edit weekly entries.' });

    const { WeeklyLogbook } = require('../models');
    const logbook = await WeeklyLogbook.findById(req.params.id);
    if (!logbook) return res.status(404).json({ message: 'Weekly Log Sheet Book not found' });
    if (logbook.studentId !== user.id) return res.status(403).json({ message: 'Access denied' });

    const entry = await WeeklyLogbook.upsertEntry(logbook, req.body);
    await WeeklyLogbook.audit({
      logbookId: logbook.id,
      actorId: user.id,
      actorRole: 'student',
      action: 'weekly_entry_saved',
      metadata: { weekNumber: entry.weekNumber },
      ipAddress: req.ip,
    });

    res.json({ message: 'Weekly entry saved', entry });
  } catch (error) {
    console.error('Error saving weekly entry:', error);
    res.status(error.status || 500).json({ message: error.message || 'Failed to save weekly entry' });
  }
}

async function sendLogbookToSupervisor(logbook, studentUser, ipAddress, auditAction) {
  const { WeeklyLogbook } = require('../models');
  const { sendWeeklyLogbookReviewEmail } = require('../services/emailService');

  const bundle = await WeeklyLogbook.bundle(logbook.id);
  const { token } = await WeeklyLogbook.createSupervisorToken(logbook);
  const to = supervisorEmailForPlacement(bundle.placement);

  if (!to) {
    const err = new Error(
      'Supervisor email is missing on your placement. Update your official placement supervisor email first.'
    );
    err.status = 400;
    throw err;
  }

  await sendWeeklyLogbookReviewEmail({
    to,
    supervisorName: bundle.placement?.supervisor_name,
    student: bundle.student,
    placement: bundle.placement,
    token,
  });

  await WeeklyLogbook.audit({
    logbookId: logbook.id,
    actorId: studentUser.id,
    actorRole: 'student',
    action: auditAction,
    metadata: { status: 'submitted_final', supervisorEmail: to },
    ipAddress,
  });

  return { bundle: await WeeklyLogbook.bundle(logbook.id), supervisorEmail: to };
}

async function finalizeLogbook(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'student') return res.status(403).json({ message: 'Only students can finalize weekly logbooks.' });

    const { WeeklyLogbook } = require('../models');

    const logbook = await WeeklyLogbook.findById(req.params.id);
    if (!logbook) return res.status(404).json({ message: 'Weekly Log Sheet Book not found' });
    if (logbook.studentId !== user.id) return res.status(403).json({ message: 'Access denied' });

    const finalized = await WeeklyLogbook.finalize(logbook);
    const { bundle, supervisorEmail } = await sendLogbookToSupervisor(
      finalized,
      user,
      req.ip,
      'final_submission'
    );

    res.json({
      message: 'Weekly Log Sheet Book finalized and sent to supervisor',
      bundle,
      supervisorEmail,
    });
  } catch (error) {
    console.error('Error finalizing weekly logbook:', error);
    res.status(error.status || 500).json({ message: error.message || 'Failed to finalize weekly logbook' });
  }
}

async function resubmitLogbook(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can resubmit weekly logbooks.' });
    }

    const { WeeklyLogbook } = require('../models');

    const logbook = await WeeklyLogbook.findById(req.params.id);
    if (!logbook) return res.status(404).json({ message: 'Weekly Log Sheet Book not found' });
    if (logbook.studentId !== user.id) return res.status(403).json({ message: 'Access denied' });

    const wasRejected = logbook.status === 'rejected';
    const updated = await WeeklyLogbook.resubmitToSupervisor(logbook);
    const { bundle, supervisorEmail } = await sendLogbookToSupervisor(
      updated,
      user,
      req.ip,
      wasRejected ? 'resubmitted_after_rejection' : 'resubmitted_to_supervisor'
    );

    res.json({
      message: wasRejected
        ? 'Weekly Log Sheet Book resubmitted to your supervisor'
        : 'A new supervisor review link has been sent by email',
      bundle,
      supervisorEmail,
    });
  } catch (error) {
    console.error('Error resubmitting weekly logbook:', error);
    res.status(error.status || 500).json({ message: error.message || 'Failed to resubmit weekly logbook' });
  }
}

async function listStaffLogbooks(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'hod') return res.status(403).json({ message: 'Only HOD/Secretary can review Weekly Log Sheet Books.' });

    const { WeeklyLogbook } = require('../models');
    let bundles = await WeeklyLogbook.listForStaff(req.query.status || 'supervisor_reviewed');
    if (isDepartmentHod(user)) {
      bundles = bundles.filter((bundle) => canStaffAccess(user, bundle));
    }
    res.json({ logbooks: bundles });
  } catch (error) {
    console.error('Error listing weekly logbooks:', error);
    res.status(500).json({ message: 'Failed to list weekly logbooks', error: error.message });
  }
}

async function staffDecision(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'hod') return res.status(403).json({ message: 'Only HOD/Secretary can review Weekly Log Sheet Books.' });

    const { decision, remark } = req.body;
    const { WeeklyLogbook } = require('../models');
    const bundle = await WeeklyLogbook.bundle(req.params.id);
    if (!bundle) return res.status(404).json({ message: 'Weekly Log Sheet Book not found' });
    if (!canStaffAccess(user, bundle)) return res.status(403).json({ message: 'Access denied' });

    const updated = await WeeklyLogbook.staffDecision(bundle.logbook, user.id, decision, remark);
    await WeeklyLogbook.audit({
      logbookId: updated.id,
      actorId: user.id,
      actorRole: user.originalRole || user.role,
      action: `institutional_${decision}`,
      metadata: { remark },
      ipAddress: req.ip,
    });

    if (decision === 'rejected' && bundle.student?.id) {
      const { createNotification } = require('../services/notificationService');
      await createNotification({
        userId: bundle.student.id,
        type: 'weekly_logbook',
        title: 'Weekly Log Sheet Book returned for revision',
        message: remark
          ? `Your Weekly Log Sheet Book was not approved. Reason: ${remark}. Update your entries and resubmit to your supervisor.`
          : 'Your Weekly Log Sheet Book was not approved. Update your entries and resubmit to your supervisor.',
        relatedId: updated.id,
        link: '/dashboard/weekly-logbook',
        priority: 'high',
        actionRequired: true,
      });
    }

    res.json({ message: 'Institutional decision saved', bundle: await WeeklyLogbook.bundle(updated.id) });
  } catch (error) {
    console.error('Error saving weekly logbook decision:', error);
    res.status(error.status || 500).json({ message: error.message || 'Failed to save decision' });
  }
}

async function exportPdf(req, res) {
  try {
    const user = req.user;
    const { WeeklyLogbook } = require('../models');
    const { generateWeeklyLogbookPDF } = require('../services/pdfService');
    const bundle = await WeeklyLogbook.bundle(req.params.id);
    if (!bundle) return res.status(404).json({ message: 'Weekly Log Sheet Book not found' });

    if (user.role === 'student' && bundle.logbook.studentId !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (user.role !== 'student' && !canStaffAccess(user, bundle)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const pdf = await generateWeeklyLogbookPDF(bundle);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="weekly-logbook-${bundle.logbook.id}.pdf"`);
    res.send(pdf);
  } catch (error) {
    console.error('Error exporting weekly logbook PDF:', error);
    res.status(500).json({ message: 'Failed to export weekly logbook PDF', error: error.message });
  }
}

async function getSupervisorReview(req, res) {
  try {
    const { WeeklyLogbook } = require('../models');
    const bundle = await WeeklyLogbook.findTokenBundle(req.params.token);
    if (!bundle) {
      return res.status(404).json({ message: 'This review link is invalid, expired, already used, or unavailable.' });
    }
    res.json({ bundle });
  } catch (error) {
    console.error('Error loading supervisor weekly review:', error);
    res.status(500).json({ message: 'Failed to load review link', error: error.message });
  }
}

async function submitSupervisorReview(req, res) {
  try {
    const { WeeklyLogbook, User } = require('../models');
    const { createNotification } = require('../services/notificationService');
    const bundle = await WeeklyLogbook.findTokenBundle(req.params.token);
    if (!bundle) {
      return res.status(404).json({ message: 'This review link is invalid, expired, already used, or unavailable.' });
    }

    const result = await WeeklyLogbook.submitSupervisorReview(bundle, req.body, req.ip);
    await WeeklyLogbook.audit({
      logbookId: result.logbook.id,
      actorRole: 'supervisor',
      action: 'supervisor_review_submitted',
      metadata: { supervisorFullName: req.body.supervisorFullName },
      ipAddress: req.ip,
    });

    const student = await User.findByPk(result.logbook.studentId);
    const notifyStaff = async (userId) => {
      await createNotification({
        userId,
        type: 'weekly_logbook',
        title: 'Weekly Log Sheet Book ready for institutional review',
        message: `${student.firstName} ${student.lastName}'s Weekly Log Sheet Book has been acknowledged by the supervisor and is ready for review.`,
        relatedId: result.logbook.id,
        link: '/admin/weekly-logbooks',
        priority: 'high',
        actionRequired: true,
      });
    };

    const hods = await User.findAll({ where: { role: 'hod' } });
    for (const hod of hods) {
      if (!student || !isEmailVerifiedStudent(student) || !studentBelongsToHodDepartment(student, hod.department)) {
        continue;
      }
      await notifyStaff(hod.id);
    }

    const secretaries = await User.findAll({ where: { role: 'secutuary' } });
    for (const secretary of secretaries) {
      await notifyStaff(secretary.id);
    }

    res.status(201).json({ message: 'Supervisor acknowledgment submitted successfully' });
  } catch (error) {
    console.error('Error submitting supervisor weekly review:', error);
    res.status(error.status || 500).json({ message: error.message || 'Failed to submit supervisor review' });
  }
}

module.exports = {
  getMyLogbook,
  getLogbook,
  saveWeek,
  finalizeLogbook,
  resubmitLogbook,
  listStaffLogbooks,
  staffDecision,
  exportPdf,
  getSupervisorReview,
  submitSupervisorReview,
};
