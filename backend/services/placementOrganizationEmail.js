/**
 * Send the official placement PDF (with university crest) and supervisor evaluation link
 * to the host organization's email. Used after Stage-2 approval and for manual resend.
 */
const path = require('path');
const fs = require('fs');

let crestBase64Cache;
function getCrestBase64() {
  if (crestBase64Cache !== undefined) return crestBase64Cache;
  try {
    const logoPath = path.join(__dirname, '../public/rmu-crest.png');
    const bitmap = fs.readFileSync(logoPath);
    crestBase64Cache = `data:image/png;base64,${bitmap.toString('base64')}`;
  } catch {
    crestBase64Cache = '';
  }
  return crestBase64Cache;
}

function buildMailHtml(placement, student, evaluationUrl) {
  const crest = getCrestBase64();
  return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1e3a5f; color: white; padding: 24px 20px; text-align: center; }
            .header img { max-width: 110px; height: auto; display: block; margin: 0 auto 12px; background: rgba(255,255,255,0.95); padding: 8px; border-radius: 8px; }
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
              ${crest ? `<img src="${crest}" alt="Regional Maritime University" />` : ''}
              <h1 style="margin:0;font-size:20px;">Regional Maritime University</h1>
              <h2 style="margin:8px 0 0;font-size:16px;font-weight:normal;opacity:0.95;">Official Internship Placement</h2>
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

              <p>Please find <strong>attached</strong> the official internship letter (PDF) bearing the university crest and verification details.</p>

              ${evaluationUrl ? `
              <div class="eval-box">
                <h3>Student Evaluation Form</h3>
                <p>Please evaluate the student's performance using the secure form below during the <strong>final two weeks</strong> of the internship (the form only accepts submissions in that window). You may open this link anytime to confirm it works. This link is unique to this placement and must not be shared with the student.</p>
                <p style="text-align: center;">
                  <a href="${evaluationUrl}" class="button" style="background: #28a745; color: white;">Complete Evaluation Form</a>
                </p>
                <p><small><em>This is a secure link. Please keep it confidential.</em></small></p>
              </div>
              ` : ''}

              <p>If you have any questions, please contact the university administration.</p>

              <p>Best regards,<br>Regional Maritime University<br>Internship Coordination Office</p>
            </div>
            <div class="footer">
              <p>This is an official communication from Regional Maritime University</p>
              <p>For verification: info@rmu.edu.gh</p>
            </div>
          </div>
        </body>
        </html>
      `;
}

function buildMailText(placement, student, evaluationUrl) {
  return `
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

Attached: official internship letter (PDF).

${evaluationUrl ? `Evaluation form (keep confidential): ${evaluationUrl}` : ''}

Best regards,
Regional Maritime University
`.trim();
}

/**
 * @returns {{ ok: true, placement: object } | { ok: false, error: string }}
 */
async function sendOfficialLetterAndEvaluationToOrganization(placementId) {
  const { InternshipPlacement, EvaluationToken, EmailLog, User: UserModel } = require('../models');
  const { generateOfficialLetterPDF } = require('./pdfService');

  const placement = await InternshipPlacement.findByPk(placementId);
  if (!placement) {
    return { ok: false, error: 'Placement not found' };
  }
  if (placement.status !== 'approved') {
    return { ok: false, error: 'Placement must be approved before emailing the organization' };
  }
  const orgEmail = (placement.organizationEmail || '').trim();
  if (!orgEmail) {
    return { ok: false, error: 'No organization email on file for this placement' };
  }

  const student = await UserModel.findOne({ id: placement.studentId });
  if (!student) {
    return { ok: false, error: 'Student not found' };
  }

  const tokens = await EvaluationToken.findByPlacement(placementId);
  const token = tokens.length > 0 ? tokens[0] : null;

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const evaluationUrl = token ? `${frontendUrl}/evaluate/${token.tokenHash}` : null;

  const transporter = require('../config/email');
  const emailFrom = process.env.EMAIL_FROM || `"RMU Internship Portal" <${process.env.SMTP_USER || 'noreply@rmu.edu.gh'}>`;

  const mailOptions = {
    from: emailFrom,
    to: orgEmail,
    subject: `Official Internship Placement - ${student.firstName} ${student.lastName} | Regional Maritime University`,
    html: buildMailHtml(placement, student, evaluationUrl),
    text: buildMailText(placement, student, evaluationUrl),
  };

  try {
    const signature = require('../controllers/letterController').programSignatures[student.program] || {
      name: 'Dr. [Name]',
      title: 'Dean of Academic Affairs',
      department: 'Regional Maritime University',
    };
    const pdfBuffer = await generateOfficialLetterPDF(placement, student, signature);
    mailOptions.attachments = [
      {
        filename: `Official_Letter_${placement.referenceNumber || placement.id}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ];
  } catch (pdfErr) {
    console.error('⚠️ PDF generation failed, sending email without attachment:', pdfErr.message);
  }

  await transporter.sendMail(mailOptions);

  await EmailLog.create({
    placementId: placementId,
    studentId: placement.studentId,
    recipientEmail: orgEmail,
    subject: mailOptions.subject,
    deliveryStatus: 'sent',
    tokenId: token?.id,
    attachments: { officialLetter: true, evaluationForm: !!evaluationUrl },
  });

  await InternshipPlacement.update(placementId, {
    evaluationStatus: 'sent',
    evaluationSentAt: new Date().toISOString(),
  });

  const fresh = await InternshipPlacement.findByPk(placementId);

  return { ok: true, placement: fresh };
}

module.exports = {
  sendOfficialLetterAndEvaluationToOrganization,
};
