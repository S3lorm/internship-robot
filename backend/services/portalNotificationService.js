const transporter = require('../config/email');
const { User } = require('../models');
const { createNotification } = require('./notificationService');
const { OPEN_MESSAGE, CLOSED_MESSAGE } = require('./internshipPortalService');

const PORTAL_OPEN_TITLE = 'Internship request portal is open';
const PORTAL_OPEN_BODY =
  'The internship request portal is now open. You may submit internship letter requests and official placement registrations.';

const PORTAL_CLOSED_TITLE = 'Internship request portal is closed';
const PORTAL_CLOSED_BODY =
  'The internship request portal is now closed. New internship letter and placement requests cannot be submitted until it reopens.';

async function sendPortalStatusEmail(student, variant) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return { skipped: true, reason: 'smtp_not_configured' };
  }
  if (!student?.email) {
    return { skipped: true, reason: 'no_email' };
  }

  const isOpen = variant === 'open';
  const title = isOpen ? PORTAL_OPEN_TITLE : PORTAL_CLOSED_TITLE;
  const body = isOpen ? PORTAL_OPEN_BODY : PORTAL_CLOSED_BODY;
  const statusLine = isOpen ? OPEN_MESSAGE : CLOSED_MESSAGE;
  const statusColor = isOpen ? '#16a34a' : '#dc2626';
  const headerLabel = isOpen ? 'Portal opened' : 'Portal closed';
  const subject = isOpen
    ? 'RMU Internship Portal — Requests now open'
    : 'RMU Internship Portal — Requests now closed';

  const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
  const emailFrom = process.env.EMAIL_FROM || `"RMU Internship Portal" <${process.env.SMTP_USER}>`;
  const dashboardUrl = `${frontend}/dashboard`;

  await transporter.sendMail({
    from: emailFrom,
    to: student.email,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #0a1930; margin: 0; padding: 0;">
        <motionless style="background: linear-gradient(135deg, #0a1930 0%, #1d3557 100%); color: #fff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px;">RMU Internship Portal</h1>
          <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">${headerLabel}</p>
        </motionless>
        <motionless style="max-width: 600px; margin: 0 auto; padding: 24px; background: #f8fafc;">
          <h2 style="color: #1d3557; margin-top: 0;">${title}</h2>
          <p style="color: #334155;">${body}</p>
          <p style="color: ${statusColor}; font-weight: 600;">${statusLine}</p>
          <p style="margin-top: 24px;">
            <a href="${dashboardUrl}" style="display: inline-block; background: #4dabf7; color: #0a1930; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to dashboard</a>
          </p>
        </motionless>
        <p style="text-align: center; font-size: 12px; color: #64748b; padding: 16px;">Regional Maritime University — automated message</p>
      </body>
      </html>
    `.replace(/motionless/g, 'div'),
    text: `${title}\n\n${body}\n\n${statusLine}\n\nDashboard: ${dashboardUrl}`,
  });

  return { sent: true };
}

async function notifyVerifiedStudentsPortalStatus(variant) {
  const isOpen = variant === 'open';
  const title = isOpen ? PORTAL_OPEN_TITLE : PORTAL_CLOSED_TITLE;
  const body = isOpen ? PORTAL_OPEN_BODY : PORTAL_CLOSED_BODY;
  const link = isOpen ? '/dashboard/letter-requests' : '/dashboard';

  const students = await User.findAll({
    where: { role: 'student', isActive: true, isEmailVerified: true },
    limit: 5000,
  });

  let notificationsCreated = 0;
  let emailsSent = 0;
  let emailsFailed = 0;
  let notificationErrors = 0;

  for (const student of students) {
    if (!student?.id) continue;

    try {
      await createNotification({
        userId: student.id,
        type: 'portal',
        title,
        message: body,
        link,
        priority: 'high',
      });
      notificationsCreated += 1;
    } catch (err) {
      notificationErrors += 1;
      console.error(`Portal ${variant} notification failed for`, student.id, err.message);
    }

    try {
      const emailResult = await sendPortalStatusEmail(student, variant);
      if (emailResult.sent) emailsSent += 1;
    } catch (err) {
      emailsFailed += 1;
      console.error(`Portal ${variant} email failed for`, student.email, err.message);
    }
  }

  return {
    total: students.length,
    notificationsCreated,
    notificationErrors,
    emailsSent,
    emailsFailed,
    variant,
  };
}

async function notifyVerifiedStudentsPortalOpened() {
  return notifyVerifiedStudentsPortalStatus('open');
}

async function notifyVerifiedStudentsPortalClosed() {
  return notifyVerifiedStudentsPortalStatus('closed');
}

module.exports = {
  notifyVerifiedStudentsPortalOpened,
  notifyVerifiedStudentsPortalClosed,
  notifyVerifiedStudentsPortalStatus,
  PORTAL_OPEN_TITLE,
  PORTAL_OPEN_BODY,
  PORTAL_CLOSED_TITLE,
  PORTAL_CLOSED_BODY,
};
