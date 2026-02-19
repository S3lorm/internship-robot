const { Notification, User } = require('../models');
const { createNotification } = require('./notificationService');

/**
 * Send notification for evaluation availability
 */
async function notifyEvaluationAvailable(evaluation) {
  try {
    const student = await User.findOne({ id: evaluation.studentId });
    if (!student) return;

    await createNotification({
      userId: evaluation.studentId,
      type: 'evaluation_available',
      title: `New Evaluation Available: ${evaluation.title}`,
      message: evaluation.description || `A ${evaluation.evaluationType} evaluation is now available for you.`,
      link: `/dashboard/evaluations/${evaluation.id}`,
      priority: 'high',
      actionRequired: true,
      expiresAt: evaluation.deadline,
    });
  } catch (error) {
    console.error('Error sending evaluation notification:', error);
  }
}

/**
 * Send deadline reminders for logbooks
 */
async function sendLogbookDeadlineReminders() {
  try {
    const { Logbook } = require('../models');
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find logbooks with deadlines in 3 days
    const logbooks = await Logbook.findAll({
      where: {
        status: 'pending',
      },
    });

    for (const logbook of logbooks) {
      if (!logbook.submissionDeadline) continue;
      
      const deadline = new Date(logbook.submissionDeadline);
      const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

      // Send reminder 3 days before
      if (daysUntilDeadline === 3) {
        await createNotification({
          userId: logbook.studentId,
          type: 'logbook_deadline',
          title: `Logbook Deadline Reminder: ${logbook.title}`,
          message: `Your logbook "${logbook.title}" is due in 3 days. Please submit before the deadline.`,
          link: `/dashboard/logbooks/${logbook.id}`,
          priority: 'medium',
          actionRequired: true,
          expiresAt: logbook.submissionDeadline,
        });
      }

      // Send urgent reminder 1 day before
      if (daysUntilDeadline === 1) {
        await createNotification({
          userId: logbook.studentId,
          type: 'logbook_deadline',
          title: `⚠️ Urgent: Logbook Deadline Tomorrow`,
          message: `Your logbook "${logbook.title}" is due tomorrow. Please submit immediately.`,
          link: `/dashboard/logbooks/${logbook.id}`,
          priority: 'urgent',
          actionRequired: true,
          expiresAt: logbook.submissionDeadline,
        });
      }

      // Send overdue notification
      if (deadline < now && logbook.status === 'pending') {
        await createNotification({
          userId: logbook.studentId,
          type: 'deadline_reminder',
          title: `⚠️ Overdue: ${logbook.title}`,
          message: `Your logbook "${logbook.title}" is now overdue. Please submit as soon as possible.`,
          link: `/dashboard/logbooks/${logbook.id}`,
          priority: 'urgent',
          actionRequired: true,
        });
      }
    }
  } catch (error) {
    console.error('Error sending logbook deadline reminders:', error);
  }
}

/**
 * Send deadline reminders for reports
 */
async function sendReportDeadlineReminders() {
  try {
    const { Report } = require('../models');
    const now = new Date();

    const reports = await Report.findAll({
      where: {
        status: 'pending',
      },
    });

    for (const report of reports) {
      if (!report.submissionDeadline) continue;
      
      const deadline = new Date(report.submissionDeadline);
      const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

      // Send reminder 3 days before
      if (daysUntilDeadline === 3) {
        await createNotification({
          userId: report.studentId,
          type: 'report_deadline',
          title: `Report Deadline Reminder: ${report.title}`,
          message: `Your ${report.reportType} report "${report.title}" is due in 3 days. Please submit before the deadline.`,
          link: `/dashboard/reports/${report.id}`,
          priority: 'medium',
          actionRequired: true,
          expiresAt: report.submissionDeadline,
        });
      }

      // Send urgent reminder 1 day before
      if (daysUntilDeadline === 1) {
        await createNotification({
          userId: report.studentId,
          type: 'report_deadline',
          title: `⚠️ Urgent: Report Deadline Tomorrow`,
          message: `Your ${report.reportType} report "${report.title}" is due tomorrow. Please submit immediately.`,
          link: `/dashboard/reports/${report.id}`,
          priority: 'urgent',
          actionRequired: true,
          expiresAt: report.submissionDeadline,
        });
      }

      // Send overdue notification
      if (deadline < now && report.status === 'pending') {
        await createNotification({
          userId: report.studentId,
          type: 'deadline_reminder',
          title: `⚠️ Overdue: ${report.title}`,
          message: `Your ${report.reportType} report "${report.title}" is now overdue. Please submit as soon as possible.`,
          link: `/dashboard/reports/${report.id}`,
          priority: 'urgent',
          actionRequired: true,
        });
      }
    }
  } catch (error) {
    console.error('Error sending report deadline reminders:', error);
  }
}

/**
 * Send notifications for missing administrative actions
 */
async function sendAdministrativeActionReminders() {
  try {
    const { AdministrativeAction } = require('../models');
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const actions = await AdministrativeAction.findAll({
      where: {
        isCompleted: false,
        isRequired: true,
      },
    });

    for (const action of actions) {
      if (!action.dueDate) continue;
      
      const dueDate = new Date(action.dueDate);
      const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

      // Send reminder 3 days before due date
      if (daysUntilDue === 3) {
        await createNotification({
          userId: action.studentId,
          type: 'admin_action_required',
          title: `Action Required: ${action.title}`,
          message: action.description || `You have a required administrative action due in 3 days.`,
          link: action.actionUrl || `/dashboard/actions/${action.id}`,
          priority: 'high',
          actionRequired: true,
          expiresAt: action.dueDate,
        });
      }

      // Send urgent reminder 1 day before
      if (daysUntilDue === 1) {
        await createNotification({
          userId: action.studentId,
          type: 'admin_action_required',
          title: `⚠️ Urgent: Action Required Tomorrow`,
          message: `Your required action "${action.title}" is due tomorrow. Please complete it immediately.`,
          link: action.actionUrl || `/dashboard/actions/${action.id}`,
          priority: 'urgent',
          actionRequired: true,
          expiresAt: action.dueDate,
        });
      }

      // Send overdue notification
      if (dueDate < now) {
        await createNotification({
          userId: action.studentId,
          type: 'admin_action_required',
          title: `⚠️ Overdue: ${action.title}`,
          message: `Your required action "${action.title}" is now overdue. Please complete it immediately.`,
          link: action.actionUrl || `/dashboard/actions/${action.id}`,
          priority: 'urgent',
          actionRequired: true,
        });
      }
    }
  } catch (error) {
    console.error('Error sending administrative action reminders:', error);
  }
}

/**
 * Send notification for request decisions (letter requests, applications, etc.)
 */
async function notifyRequestDecision(request, decision) {
  try {
    const notificationTitle = decision === 'approved' 
      ? 'Request Approved' 
      : decision === 'rejected'
      ? 'Request Rejected'
      : 'Request Status Updated';

    const notificationMessage = decision === 'approved'
      ? `Your request has been approved.`
      : decision === 'rejected'
      ? `Your request has been rejected.`
      : `Your request status has been updated.`;

    await createNotification({
      userId: request.studentId,
      type: 'letter_request',
      title: notificationTitle,
      message: notificationMessage,
      link: `/dashboard/letter-requests?view=${request.id}`,
      priority: decision === 'approved' ? 'high' : 'medium',
      actionRequired: decision === 'approved',
    });
  } catch (error) {
    console.error('Error sending request decision notification:', error);
  }
}

/**
 * Run all reminder checks (to be called by cron job)
 */
async function runAllReminders() {
  console.log('Running reminder checks...');
  await sendLogbookDeadlineReminders();
  await sendReportDeadlineReminders();
  await sendAdministrativeActionReminders();
  console.log('Reminder checks completed.');
}

module.exports = {
  notifyEvaluationAvailable,
  sendLogbookDeadlineReminders,
  sendReportDeadlineReminders,
  sendAdministrativeActionReminders,
  notifyRequestDecision,
  runAllReminders,
};

