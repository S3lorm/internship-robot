const transporter = require('../config/email');
const { User } = require('../models');

async function sendNoticeEmailToStudent(student, notice) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP not configured — skipping notice email to', student.email);
    return { skipped: true, reason: 'smtp_not_configured' };
  }

  const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
  const emailFrom = process.env.EMAIL_FROM || `"RMU Internship Portal" <${process.env.SMTP_USER}>`;
  const safeTitle = String(notice.title || 'Announcement').replace(/</g, '&lt;');
  const safeBody = String(notice.content || '')
    .replace(/</g, '&lt;')
    .replace(/\n/g, '<br/>');

  await transporter.sendMail({
    from: emailFrom,
    to: student.email,
    subject: `RMU Internship Portal — ${notice.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #0a1930; margin: 0; padding: 0;">
        <motionless style="background: linear-gradient(135deg, #0a1930 0%, #1d3557 100%); color: #fff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px;">RMU Internship Portal</h1>
          <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Official announcement</p>
        </motionless>
        <motionless style="max-width: 600px; margin: 0 auto; padding: 24px; background: #f8fafc;">
          <h2 style="color: #1d3557; margin-top: 0;">${safeTitle}</h2>
          <motionless style="color: #334155;">${safeBody}</motionless>
          <p style="margin-top: 24px;">
            <a href="${frontend}/dashboard/notices" style="display: inline-block; background: #4dabf7; color: #0a1930; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">View in portal</a>
          </p>
        </motionless>
        <p style="text-align: center; font-size: 12px; color: #64748b; padding: 16px;">Regional Maritime University — automated message</p>
      </body>
      </html>
    `.replace(/motionless/g, 'div'),
    text: `${notice.title}\n\n${notice.content}\n\nView notices: ${frontend}/dashboard/notices`,
  });

  return { sent: true };
}

async function emailNoticeToVerifiedStudents(notice) {
  if (!notice?.isActive) return { sent: 0, skipped: 0 };
  const audience = notice.targetAudience || 'students';
  if (!['students', 'all', 'students_and_secretary'].includes(audience)) {
    return { sent: 0, skipped: 0, reason: 'audience_not_students' };
  }

  const students = await User.findAll({
    where: { role: 'student', isActive: true, isEmailVerified: true },
    limit: 5000,
  });

  let recipients = students;
  if (notice.targetDepartment) {
    recipients = students.filter(
      (s) => String(s.department || '').trim() === String(notice.targetDepartment).trim()
    );
  }

  let sent = 0;
  let failed = 0;
  for (const student of recipients) {
    if (!student?.email) continue;
    try {
      await sendNoticeEmailToStudent(student, notice);
      sent += 1;
    } catch (err) {
      failed += 1;
      console.error('Notice email failed for', student.email, err.message);
    }
  }

  return { sent, failed, total: recipients.length };
}

module.exports = {
  sendNoticeEmailToStudent,
  emailNoticeToVerifiedStudents,
};
