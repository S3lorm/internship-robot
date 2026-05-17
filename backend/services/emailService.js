const transporter = require('../config/email');
const { getWeeklyLogbookReviewUrl } = require('../utils/letterVerificationQr');

async function sendVerificationEmail(user, token, verificationCode) {
  // Check if SMTP is configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    const error = new Error('SMTP not configured. Please set SMTP_USER and SMTP_PASS in backend/.env');
    console.error('❌ Cannot send email:', error.message);
    throw error;
  }

  const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verificationUrl = `${frontend}/verify-email?token=${token}`;

  const emailFrom = process.env.EMAIL_FROM || `"RMU Internship Portal" <${process.env.SMTP_USER}>`;

  console.log(`📧 Attempting to send verification email to: ${user.email}`);
  console.log(`   From: ${emailFrom}`);
  console.log(`   SMTP Host: ${process.env.SMTP_HOST || 'not set'}`);

  try {
    const info = await transporter.sendMail({
      from: emailFrom,
      to: user.email,
      subject: 'Verify Your Email - RMU Internship Portal',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .button { display: inline-block; padding: 12px 24px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>RMU Internship Portal</h1>
            </div>
            <div class="content">
              <h2>Welcome, ${user.firstName}!</h2>
              <p>Thank you for registering with the Regional Maritime University Internship Portal.</p>
              <p>To complete your registration and access the dashboard, please verify your email address by clicking the button below:</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #1e40af;">${verificationUrl}</p>
              ${
                verificationCode
                  ? `<p style="margin-top: 20px;"><strong>Optional — verify with a code instead:</strong></p>
              <p>On the verification page, enter your email and this 6-digit code (expires in 24 hours, same as the link):</p>
              <div style="font-size: 28px; letter-spacing: 10px; font-weight: bold; padding: 16px; text-align: center; background: #e5e7eb; border-radius: 8px; margin: 12px 0;">${verificationCode}</div>`
                  : ''
              }
              <p><strong>Important:</strong> This verification link will expire in 24 hours.</p>
              <p>If you did not create an account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>Regional Maritime University Internship Portal</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to RMU Internship Portal
        
        Hi ${user.firstName},
        
        Thank you for registering with the Regional Maritime University Internship Portal.
        
        Please verify your email address by clicking the link below:
        ${verificationUrl}
        
        ${
          verificationCode
            ? `\nOptional — you can also verify on the website by entering your email and this 6-digit code: ${verificationCode}\n(same 24-hour expiry as the link.)\n`
            : ''
        }
        This link expires in 24 hours.
        
        If you did not create an account, please ignore this email.
      `,
    });

    console.log(`✅ Verification email sent successfully to ${user.email}`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response || 'No response'}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send verification email to ${user.email}`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Error Code: ${error.code || 'N/A'}`);
    console.error(`   Full Error:`, error);
    
    // Provide helpful error messages
    if (error.code === 'EAUTH') {
      console.error('   → Authentication failed. Check SMTP_USER and SMTP_PASS in backend/.env');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('   → Connection failed. Check SMTP_HOST and SMTP_PORT');
      console.error('   → Make sure the SMTP server is accessible from your network');
    } else if (error.code === 'ESOCKET') {
      console.error('   → Socket error. Check network/firewall settings');
    } else if (error.responseCode === 535) {
      console.error('   → Authentication failed. For Gmail, use App Password, not regular password');
    }
    
    throw error; // Re-throw so caller can handle it
  }
}

async function sendPasswordResetEmail(user, token) {
  const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${frontend}/reset-password?token=${token}`;
  const emailFrom = process.env.EMAIL_FROM || `"RMU Internship Portal" <${process.env.SMTP_USER || 'noreply@rmu.edu.gh'}>`;

  try {
    await transporter.sendMail({
      from: emailFrom,
      to: user.email,
      subject: 'Reset Your Password - RMU Internship Portal',
      html: `
        <h1>Password Reset</h1>
        <p>Hi ${user.firstName},</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>This link expires in 15 minutes.</p>
      `,
      text: `Hi ${user.firstName},\n\nClick this link to reset your password: ${resetUrl}\n\nThis link expires in 15 minutes.`,
    });
    console.log(`✅ Password reset email sent to ${user.email}`);
  } catch (error) {
    console.error(`❌ Failed to send password reset email to ${user.email}:`, error.message);
    throw error;
  }
}

async function sendPasswordResetOtp(user, otp) {
  const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${frontend}/reset-password?email=${encodeURIComponent(user.email)}`;

  const emailFrom = process.env.EMAIL_FROM || '"RMU Internship Portal" <noreply@rmu.edu.gh>';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .otp-box { font-size: 28px; letter-spacing: 8px; font-weight: bold; padding: 16px; text-align: center; background: #e5e7eb; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>RMU Internship Portal</h1></div>
        <div class="content">
          <h2>Password reset OTP</h2>
          <p>Hi ${user.firstName},</p>
          <p>Use this one-time code to reset your password:</p>
          <div class="otp-box">${otp}</div>
          <p>Enter this code on the reset password page. It expires in 15 minutes.</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset password</a>
          </p>
          <p>If you didn't request this, you can ignore this email.</p>
        </div>
        <div class="footer">Regional Maritime University Internship Portal</div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: emailFrom,
    to: user.email,
    subject: 'Your password reset code - RMU Internship Portal',
    html,
    text: `Hi ${user.firstName},\n\nYour password reset code is: ${otp}\n\nEnter it on the reset password page. It expires in 15 minutes.\n\n${resetUrl}\n\nIf you didn't request this, ignore this email.`,
  });
}

async function sendApplicationStatusEmail(user, application, internship) {
  const statusMessages = {
    approved: 'Congratulations! Your application has been approved.',
    rejected: 'We regret to inform you that your application was not successful.',
    under_review: 'Your application is now under review.',
    pending: 'Your application has been received and is pending review.',
  };
  const emailFrom = process.env.EMAIL_FROM || `"RMU Internship Portal" <${process.env.SMTP_USER || 'noreply@rmu.edu.gh'}>`;

  try {
    await transporter.sendMail({
      from: emailFrom,
      to: user.email,
      subject: `Application Update - ${internship.title}`,
      html: `
        <h1>Application Status Update</h1>
        <p>Hi ${user.firstName},</p>
        <p>${statusMessages[application.status] || 'Your application status was updated.'}</p>
        <p><strong>Position:</strong> ${internship.title}</p>
        <p><strong>Company:</strong> ${internship.company}</p>
        ${application.feedback ? `<p><strong>Feedback:</strong> ${application.feedback}</p>` : ''}
      `,
      text: `Hi ${user.firstName},\n\n${statusMessages[application.status] || 'Your application status was updated.'}\n\nPosition: ${internship.title}\nCompany: ${internship.company}${application.feedback ? `\nFeedback: ${application.feedback}` : ''}`,
    });
    console.log(`✅ Application status email sent to ${user.email}`);
  } catch (error) {
    console.error(`❌ Failed to send application status email to ${user.email}:`, error.message);
    throw error;
  }
}

async function sendTemporaryPasswordEmail(user, temporaryPassword) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    const error = new Error('SMTP not configured. Please set SMTP_USER and SMTP_PASS in backend/.env');
    console.error('Cannot send temporary password email:', error.message);
    throw error;
  }

  const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
  const loginUrl = `${frontend}/login`;
  const emailFrom = process.env.EMAIL_FROM || `"RMU Internship Portal" <${process.env.SMTP_USER}>`;
  const displayRole = user.role === 'secutuary' ? 'Secutuary' : 'Head of Department';

  await transporter.sendMail({
    from: emailFrom,
    to: user.email,
    subject: `Your ${displayRole} account temporary password - RMU Internship Portal`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .code-box { font-size: 22px; letter-spacing: 2px; font-weight: bold; padding: 14px; text-align: center; background: #e5e7eb; border-radius: 8px; margin: 16px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 5px; margin: 16px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>RMU Internship Portal</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.firstName || 'User'},</h2>
            <p>An administrator created your <strong>${displayRole}</strong> account.</p>
            <p>Use this temporary password to sign in:</p>
            <div class="code-box">${temporaryPassword}</div>
            <p><strong>Important:</strong> You will be required to change this temporary password immediately after login.</p>
            <p style="text-align: center;">
              <a href="${loginUrl}" class="button">Sign in now</a>
            </p>
            <p>If you did not expect this account, please contact the system administrator.</p>
          </div>
          <div class="footer">
            <p>Regional Maritime University Internship Portal</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hello ${user.firstName || 'User'},\n\nAn administrator created your ${displayRole} account.\n\nTemporary password: ${temporaryPassword}\n\nSign in here: ${loginUrl}\n\nYou will be required to change this temporary password immediately after login.\n\nIf you did not expect this account, contact the system administrator.`,
  });
}

async function sendWeeklyLogbookReviewEmail({ to, supervisorName, student, placement, token }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    const error = new Error('SMTP not configured. Please set SMTP_USER and SMTP_PASS in backend/.env');
    console.error('Cannot send weekly logbook review email:', error.message);
    throw error;
  }

  if (!to) {
    throw new Error('Supervisor email is required before sending a weekly logbook review link.');
  }

  const reviewUrl = getWeeklyLogbookReviewUrl(token);
  const emailFrom = process.env.EMAIL_FROM || `"RMU Internship Portal" <${process.env.SMTP_USER}>`;
  const studentName = `${student?.firstName || ''} ${student?.lastName || ''}`.trim() || 'the student';

  await transporter.sendMail({
    from: emailFrom,
    to,
    subject: 'Weekly Log Sheet Book Review Required',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #334155; }
          .container { max-width: 640px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0f766e; color: white; padding: 22px; text-align: center; }
          .content { padding: 22px; background-color: #f8fafc; }
          .button { display: inline-block; padding: 12px 20px; background-color: #0f766e; color: white; text-decoration: none; border-radius: 6px; margin: 18px 0; }
          .note { background: #ecfdf5; border-left: 4px solid #0f766e; padding: 12px; }
          .footer { text-align: center; padding: 18px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Weekly Log Sheet Book Review</h1>
          </div>
          <div class="content">
            <p>Dear ${supervisorName || 'Supervisor'},</p>
            <p>${studentName} has finalized a Weekly Log Sheet Book for institutional internship documentation.</p>
            <p><strong>Organization:</strong> ${placement?.organizationName || placement?.organization_name || 'N/A'}<br>
            <strong>Internship period:</strong> ${placement?.internshipStartDate || placement?.internship_start_date || 'N/A'} to ${placement?.internshipEndDate || placement?.internship_end_date || 'N/A'}</p>
            <p style="text-align:center"><a class="button" href="${reviewUrl}">Open secure review page</a></p>
            <p class="note">This link is temporary, one-time use, and only allows acknowledgment and remarks. It is not the supervisor evaluation form.</p>
            <p>Copy and paste this link if the button does not work:<br>${reviewUrl}</p>
          </div>
          <div class="footer">Regional Maritime University Internship Portal</div>
        </div>
      </body>
      </html>
    `,
    text: `Dear ${supervisorName || 'Supervisor'},\n\n${studentName} has finalized a Weekly Log Sheet Book.\n\nOpen the secure review page: ${reviewUrl}\n\nThis link is temporary, one-time use, and is not the supervisor evaluation form.`,
  });
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordResetOtp,
  sendApplicationStatusEmail,
  sendTemporaryPasswordEmail,
  sendWeeklyLogbookReviewEmail,
};

