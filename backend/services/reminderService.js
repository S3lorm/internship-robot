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
  await checkMidpointEvaluations();
  await sendEvaluationReminders();
  console.log('Reminder checks completed.');
}

/**
 * Check for placements that have reached their midpoint date.
 * Sends evaluation email to supervisor and notifies student.
 */
async function checkMidpointEvaluations() {
  try {
    const { InternshipPlacement, EvaluationToken, User: UserModel } = require('../models');
    const transporter = require('../config/email');

    const today = new Date().toISOString().split('T')[0];

    // Find approved placements where midpoint is today and eval hasn't been sent
    const placements = await InternshipPlacement.findAll({
      where: { status: 'approved', evaluationStatus: 'pending' },
    });

    for (const placement of placements) {
      if (!placement.midpointDate || placement.midpointDate > today) continue;

      // Get evaluation token
      const tokens = await EvaluationToken.findByPlacement(placement.id);
      const token = tokens.find(t => t.usedStatus === 'unused');
      if (!token) continue;

      // Get student info
      const student = await UserModel.findOne({ id: placement.studentId });
      if (!student) continue;

      const recipientEmail = placement.supervisorEmail || placement.organizationEmail;
      if (!recipientEmail) continue;

      // Build evaluation URL
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const evaluationUrl = `${frontendUrl}/evaluate/${token.tokenHash}`;

      const emailFrom = process.env.EMAIL_FROM || `"RMU Internship Portal" <${process.env.SMTP_USER || 'noreply@rmu.edu.gh'}>`;

      try {
        await transporter.sendMail({
          from: emailFrom,
          to: recipientEmail,
          subject: `Internship Midterm Evaluation Request for ${student.firstName} ${student.lastName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #1e3a5f; color: white; padding: 20px; text-align: center;">
                <h2>Internship Midterm Evaluation</h2>
                <p>Regional Maritime University</p>
              </div>
              <div style="padding: 20px;">
                <p>Dear ${placement.supervisorName || 'Supervisor'},</p>
                <p>We hope this message finds you well. As we have reached the midpoint of the internship period, we kindly request your evaluation of our student's performance.</p>
                <div style="background: #f8f9fa; border-left: 4px solid #1e3a5f; padding: 15px; margin: 15px 0;">
                  <strong>Student:</strong> ${student.firstName} ${student.lastName}<br>
                  <strong>Organization:</strong> ${placement.organizationName}<br>
                  <strong>Department:</strong> ${placement.departmentRole || 'N/A'}
                </div>
                <p>Please complete the evaluation form using the secure link below:</p>
                <p style="text-align: center;">
                  <a href="${evaluationUrl}" style="display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Complete Evaluation Form</a>
                </p>
                <p><strong>Please note:</strong> This link is valid for 7 days and can only be used once.</p>
                <p>Thank you for your partnership in developing the next generation of professionals.</p>
                <p>Best regards,<br>Regional Maritime University<br>Internship Coordination Office</p>
              </div>
            </div>
          `,
        });

        // Update placement status
        await InternshipPlacement.update(placement.id, {
          evaluationStatus: 'sent',
          evaluationSentAt: new Date().toISOString(),
        });

        // Notify student
        await createNotification({
          userId: placement.studentId,
          type: 'evaluation',
          title: 'Midterm Evaluation Sent to Supervisor',
          message: `The internship midterm evaluation form has been sent to your supervisor at ${placement.organizationName}. Please inform your supervisor and assist them if necessary.`,
          relatedId: placement.id,
        });

        console.log(`📧 Midpoint evaluation email sent for placement ${placement.id}`);
      } catch (emailErr) {
        console.error(`Failed to send midpoint eval email for placement ${placement.id}:`, emailErr.message);
      }
    }
  } catch (error) {
    console.error('Error checking midpoint evaluations:', error);
  }
}

/**
 * Send reminder emails for evaluations that haven't been submitted after 5 days.
 * Mark as overdue if the token has expired (7 days).
 */
async function sendEvaluationReminders() {
  try {
    const { InternshipPlacement, EvaluationToken, User: UserModel } = require('../models');
    const transporter = require('../config/email');

    const placements = await InternshipPlacement.findAll({
      where: { evaluationStatus: 'sent' },
    });

    const now = new Date();

    for (const placement of placements) {
      if (!placement.evaluationSentAt) continue;

      const sentAt = new Date(placement.evaluationSentAt);
      const daysSinceSent = Math.floor((now - sentAt) / (1000 * 60 * 60 * 24));

      // Send reminder at day 5
      if (daysSinceSent === 5) {
        const recipientEmail = placement.supervisorEmail || placement.organizationEmail;
        if (!recipientEmail) continue;

        const student = await UserModel.findOne({ id: placement.studentId });
        const tokens = await EvaluationToken.findByPlacement(placement.id);
        const token = tokens.find(t => t.usedStatus === 'unused');

        if (!token) continue;

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const evaluationUrl = `${frontendUrl}/evaluate/${token.tokenHash}`;
        const emailFrom = process.env.EMAIL_FROM || `"RMU Internship Portal" <${process.env.SMTP_USER || 'noreply@rmu.edu.gh'}>`;

        try {
          await transporter.sendMail({
            from: emailFrom,
            to: recipientEmail,
            subject: `Reminder: Internship Evaluation Pending - ${student ? student.firstName + ' ' + student.lastName : 'Student'}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #dc3545; color: white; padding: 20px; text-align: center;">
                  <h2>⏰ Evaluation Reminder</h2>
                </div>
                <div style="padding: 20px;">
                  <p>Dear ${placement.supervisorName || 'Supervisor'},</p>
                  <p>This is a friendly reminder that the midterm evaluation for <strong>${student ? student.firstName + ' ' + student.lastName : 'the intern'}</strong> at <strong>${placement.organizationName}</strong> is still pending.</p>
                  <p><strong>The evaluation link will expire in 2 days.</strong> Please complete it at your earliest convenience:</p>
                  <p style="text-align: center;">
                    <a href="${evaluationUrl}" style="display: inline-block; padding: 12px 30px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Complete Evaluation Now</a>
                  </p>
                  <p>Thank you for your cooperation.</p>
                  <p>Best regards,<br>Regional Maritime University</p>
                </div>
              </div>
            `,
          });
          console.log(`📧 Evaluation reminder sent for placement ${placement.id}`);
        } catch (emailErr) {
          console.error(`Failed to send eval reminder for placement ${placement.id}:`, emailErr.message);
        }
      }

      // Mark as overdue after 7 days
      if (daysSinceSent >= 7) {
        await InternshipPlacement.update(placement.id, {
          evaluationStatus: 'overdue',
        });
        console.log(`⚠️ Placement ${placement.id} evaluation marked as overdue`);
      }
    }
  } catch (error) {
    console.error('Error sending evaluation reminders:', error);
  }
}

module.exports = {
  notifyEvaluationAvailable,
  sendLogbookDeadlineReminders,
  sendReportDeadlineReminders,
  sendAdministrativeActionReminders,
  notifyRequestDecision,
  runAllReminders,
  checkMidpointEvaluations,
  sendEvaluationReminders,
};
