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
      doc.text('Yours faithfully,');
      doc.moveDown(2);

      // Try to load signature image
      const sigPath = signature.imagePath
        ? path.resolve(signature.imagePath)
        : path.join(__dirname, '..', 'public', 'signatures', 'default-signature.png');

      if (fs.existsSync(sigPath)) {
        try {
          doc.image(sigPath, { width: 150 });
          doc.moveDown(0.5);
        } catch (e) {
          // If image fails, silently continue with text signature
        }
      }

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

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      doc.text(`Verify this document at: ${frontendUrl}/verify`);
      doc.moveDown(0.3);
      doc.fontSize(8).fillColor('#666')
        .text('This is an official document from the Regional Maritime University. For verification, please contact: info@rmu.edu.gh');

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateOfficialLetterPDF };
