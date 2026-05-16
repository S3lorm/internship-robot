const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

/**
 * Generates an official internship placement letter as a PDF buffer.
 * @param {Object} placement - The placement record
 * @param {Object} student - The student user record
 * @param {Object} signature - Signature info { name, title, department, imagePath? }
 * @returns {Buffer} PDF buffer
 */
async function generateOfficialLetterPDF(placement, student, signature) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 60 });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const currentDate = new Date().toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      });

      // -- UNIVERSITY CREST (school logo) --
      const logoPath = path.join(__dirname, '..', 'public', 'rmu-crest.png');
      if (fs.existsSync(logoPath)) {
        try {
          const logoWidth = 88;
          doc.image(logoPath, (doc.page.width - logoWidth) / 2, doc.y, { width: logoWidth });
          doc.moveDown(5.2);
        } catch {
          doc.moveDown(0.5);
        }
      }

      // -- HEADER --
      doc.fontSize(20).font('Helvetica-Bold').text('REGIONAL MARITIME UNIVERSITY', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').text(
        'P.O. Box GP 1115, Accra, Ghana | Tel: +233 302 712 775 | Email: info@rmu.edu.gh',
        { align: 'center' }
      );
      doc.moveDown(0.5);
      doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke('#1e3a5f');
      doc.moveDown(1);

      // -- DATE --
      doc.fontSize(11).font('Helvetica').text(currentDate, { align: 'right' });
      doc.moveDown(1.5);

      // -- RECIPIENT --
      doc.font('Helvetica').fontSize(11);
      doc.text(placement.supervisorName || 'The Supervisor');
      if (placement.supervisorPosition) doc.text(placement.supervisorPosition);
      doc.text(placement.organizationName);
      if (placement.organizationAddress) doc.text(placement.organizationAddress);
      doc.moveDown(1.5);

      // -- SUBJECT --
      doc.font('Helvetica-Bold').fontSize(11)
        .text(`SUBJECT: OFFICIAL INTERNSHIP PLACEMENT - ${student.firstName.toUpperCase()} ${student.lastName.toUpperCase()}`, {
          underline: true,
        });
      doc.moveDown(1);

      // -- BODY --
      doc.font('Helvetica').fontSize(11);
      doc.text(
        `Dear ${placement.supervisorName || 'Sir/Madam'},`,
        { lineGap: 4 }
      );
      doc.moveDown(0.8);

      doc.text(
        `I am writing to officially confirm the internship placement of ${student.firstName} ${student.lastName}, ` +
        `Student ID: ${student.studentId || 'N/A'}, a student enrolled in the ${student.program || 'N/A'} ` +
        `program at the Regional Maritime University, with your esteemed organization.`,
        { lineGap: 4 }
      );
      doc.moveDown(0.8);

      // Placement details
      doc.font('Helvetica-Bold').text('Placement Details:', { lineGap: 2 });
      doc.font('Helvetica');
      doc.text(`Organization: ${placement.organizationName}`);
      doc.text(`Department/Role: ${placement.departmentRole || 'N/A'}`);
      if (placement.internshipStartDate) {
        doc.text(`Start Date: ${new Date(placement.internshipStartDate).toLocaleDateString('en-GB')}`);
      }
      if (placement.internshipEndDate) {
        doc.text(`End Date: ${new Date(placement.internshipEndDate).toLocaleDateString('en-GB')}`);
      }
      doc.moveDown(0.8);

      doc.text(
        'The university fully endorses this placement and requests your kind cooperation in supervising and ' +
        'mentoring the student during the internship period. An evaluation form will be provided separately ' +
        'to assess the student\'s performance at the midpoint of the internship.',
        { lineGap: 4 }
      );
      doc.moveDown(0.8);

      doc.text(
        `We are confident that ${student.firstName} will demonstrate professionalism, diligence, and a strong ` +
        'work ethic during the internship. The university remains available for any support or clarification ' +
        'you may require.',
        { lineGap: 4 }
      );
      doc.moveDown(0.8);

      doc.text('Thank you for your partnership in developing the next generation of professionals.');
      doc.moveDown(1.5);

      // -- SIGNATURE --
      const { drawSignatureOnPdf } = require('./staffSignatureService');
      doc.text('Yours faithfully,');
      doc.moveDown(0.8);
      drawSignatureOnPdf(doc, signature, { width: 150, height: 48, fontSize: 20 });
      doc.moveDown(0.7);

      doc.moveTo(doc.x, doc.y).lineTo(doc.x + 200, doc.y).stroke();
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').text(signature.name);
      doc.font('Helvetica').fontSize(10);
      doc.text(signature.title);
      doc.text(signature.department);
      doc.text('Regional Maritime University');

      doc.moveDown(1.5);

      // -- VERIFICATION FOOTER --
      doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke('#ccc');
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica');
      doc.text(`Document ID: ${placement.referenceNumber || 'N/A'}`, { continued: true });
      doc.text(`     Verification Code: ${placement.verificationCode || 'N/A'}`);
      doc.moveDown(0.3);

      const { getLetterVerifyUrl } = require('../utils/letterVerificationQr');
      const verifyUrl = placement.verificationCode
        ? getLetterVerifyUrl(placement.verificationCode)
        : `${require('../config/config').publicAppUrl}/verify`;
      doc.text(`Verify this document at: ${verifyUrl}`);
      doc.moveDown(0.3);
      doc.fontSize(8).fillColor('#666')
        .text('This is an official document from the Regional Maritime University. For verification, please contact: info@rmu.edu.gh');

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function generateWeeklyLogbookPDF(bundle) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 48 });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const student = bundle.student || {};
      const placement = bundle.placement || {};
      const logbook = bundle.logbook || {};
      const review = bundle.review || {};

      const drawHeader = () => {
        const logoPath = path.join(__dirname, '..', 'public', 'rmu-crest.png');
        if (fs.existsSync(logoPath)) {
          try {
            doc.image(logoPath, (doc.page.width - 58) / 2, doc.y, { width: 58 });
            doc.moveDown(3.8);
          } catch {
            doc.moveDown(0.5);
          }
        }
        doc.fontSize(15).font('Helvetica-Bold').text('REGIONAL MARITIME UNIVERSITY', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(12).text('WEEKLY LOG SHEET BOOK', { align: 'center' });
        doc.moveDown(0.4);
        doc.fontSize(9).font('Helvetica').text('Internship / Industrial Training Documentation', { align: 'center' });
        doc.moveDown(0.8);
        doc.moveTo(48, doc.y).lineTo(547, doc.y).stroke('#1f2937');
        doc.moveDown(0.8);
      };

      const line = (label, value) => {
        doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
        doc.font('Helvetica').text(value || 'N/A');
      };

      drawHeader();
      doc.fontSize(10);
      line('Student', `${student.firstName || ''} ${student.lastName || ''}`.trim());
      line('Student ID', student.studentId);
      line('Programme', student.program);
      line('Department', student.department);
      line('Organization', placement.organization_name);
      line('Department / Office', placement.department_role);
      line('Supervisor', placement.supervisor_name);
      line('Internship Duration', `${placement.internship_start_date || 'N/A'} to ${placement.internship_end_date || 'N/A'}`);
      line('Status', String(logbook.status || '').replace(/_/g, ' '));
      doc.moveDown();

      for (const entry of bundle.entries || []) {
        if (doc.y > 650) {
          doc.addPage();
          drawHeader();
        }
        doc.fontSize(11).font('Helvetica-Bold').text(`Week ${entry.weekNumber}: ${entry.weekBeginning} to ${entry.weekEnding}`);
        doc.moveDown(0.4);
        doc.fontSize(9);
        for (const activity of entry.activities || []) {
          doc.font('Helvetica-Bold').text(`${activity.day || ''} ${activity.date || ''}`.trim() || 'Day', { continued: true });
          doc.font('Helvetica').text(` - ${activity.activity || ''}`);
        }
        doc.moveDown(0.3);
        line('Student Remark', entry.studentRemark);
        line('Supervisor Remark', entry.supervisorRemark);
        line('Supervisor Name', entry.supervisorName);
        line('Supervisor Status', entry.supervisorStatus);
        doc.moveDown(0.7);
      }

      doc.addPage();
      drawHeader();
      doc.fontSize(12).font('Helvetica-Bold').text('Supervisor Acknowledgment');
      doc.moveDown(0.5);
      doc.fontSize(10);
      line('Confirmed Name', review.supervisorFullName);
      line('Remark', review.supervisorRemark);
      line('Recommendation', review.supervisorRecommendation);
      line('Reviewed At', logbook.supervisorReviewedAt);
      doc.moveDown();
      doc.fontSize(12).font('Helvetica-Bold').text('Institutional Approval');
      doc.moveDown(0.5);
      doc.fontSize(10);
      line('Decision', review.hodDecision || (logbook.status === 'hod_approved' ? 'approved' : 'pending'));
      line('HOD / Secretary Remark', review.hodRemark || logbook.hodDecisionNote);
      line('Approved / Reviewed At', logbook.hodReviewedAt);
      line('Archive Reference', logbook.archiveReference);
      doc.moveDown(1.5);
      doc.fontSize(8).fillColor('#64748b').text('This official record documents weekly internship activities and supervisor acknowledgment only. Evaluation and grading are handled separately.', { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateOfficialLetterPDF, generateWeeklyLogbookPDF };
