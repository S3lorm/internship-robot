const { User } = require('../models');
const auth = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Pre-load the logo as base64 for HTML embedding to prevent relative path breakage
let crestBase64 = '';
try {
  const logoPath = path.join(__dirname, '../public/rmu-crest.png');
  const bitmap = fs.readFileSync(logoPath);
  crestBase64 = `data:image/png;base64,${bitmap.toString('base64')}`;
} catch (e) {
  console.error('Could not load crest logo for base64 HTML embedding:', e.message);
}

// Program-specific signatures
const programSignatures = {
  'BSc Marine Engineering': {
    name: 'Dr. [Name]',
    title: 'Head of Department',
    department: 'Marine Engineering',
    signature: '/signatures/marine-engineering.png' // Path to signature image
  },
  'BSc Nautical Science': {
    name: 'Dr. [Name]',
    title: 'Head of Department',
    department: 'Nautical Science',
    signature: '/signatures/nautical-science.png'
  },
  'BSc Port & Shipping Administration': {
    name: 'Dr. [Name]',
    title: 'Head of Department',
    department: 'Port & Shipping Administration',
    signature: '/signatures/port-shipping.png'
  },
  'BSc Maritime Safety & Security': {
    name: 'Dr. [Name]',
    title: 'Head of Department',
    department: 'Maritime Safety & Security',
    signature: '/signatures/maritime-safety.png'
  },
  'BSc Electrical/Electronic Engineering': {
    name: 'Dr. [Name]',
    title: 'Head of Department',
    department: 'Electrical/Electronic Engineering',
    signature: '/signatures/electrical-engineering.png'
  },
  'BSc Computer Science': {
    name: 'Dr. [Name]',
    title: 'Head of Department',
    department: 'Computer Science',
    signature: '/signatures/computer-science.png'
  },
  'Diploma in Maritime Studies': {
    name: 'Dr. [Name]',
    title: 'Head of Department',
    department: 'Maritime Studies',
    signature: '/signatures/maritime-studies.png'
  }
};

// Default signature if program not found
const defaultSignature = {
  name: 'Dr. [Name]',
  title: 'Dean of Academic Affairs',
  department: 'Regional Maritime University',
  signature: '/signatures/default.png'
};

function generateLetterHTML(user, internship = null, letterRequest = null) {
  const signature = programSignatures[user.program] || defaultSignature;
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const isGeneral = letterRequest && (letterRequest.requestType === 'general');

  // Use letter request details if provided, otherwise use internship details
  let internshipDetails = '';
  if (letterRequest) {
    if (isGeneral) {
      internshipDetails = `
        <p><strong>Internship Duration:</strong> ${letterRequest.internshipDuration}</p>
        ${letterRequest.internshipStartDate ? `<p><strong>Start Date:</strong> ${new Date(letterRequest.internshipStartDate).toLocaleDateString('en-GB')}</p>` : ''}
        ${letterRequest.internshipEndDate ? `<p><strong>End Date:</strong> ${new Date(letterRequest.internshipEndDate).toLocaleDateString('en-GB')}</p>` : ''}
      `;
    } else {
      internshipDetails = `
        <p><strong>Company/Organization:</strong> ${letterRequest.companyName}</p>
        ${letterRequest.companyAddress ? `<p><strong>Address:</strong> ${letterRequest.companyAddress}</p>` : ''}
        <p><strong>Internship Duration:</strong> ${letterRequest.internshipDuration}</p>
        ${letterRequest.internshipStartDate ? `<p><strong>Start Date:</strong> ${new Date(letterRequest.internshipStartDate).toLocaleDateString('en-GB')}</p>` : ''}
        ${letterRequest.internshipEndDate ? `<p><strong>End Date:</strong> ${new Date(letterRequest.internshipEndDate).toLocaleDateString('en-GB')}</p>` : ''}
        ${letterRequest.purpose ? `<p><strong>Purpose:</strong> ${letterRequest.purpose}</p>` : ''}
      `;
    }
  } else if (internship) {
    internshipDetails = `
      <p><strong>Internship Position:</strong> ${internship.title}</p>
      <p><strong>Company:</strong> ${internship.company}</p>
      <p><strong>Location:</strong> ${internship.location}</p>
      <p><strong>Duration:</strong> ${internship.duration}</p>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Internship Application Letter - ${user.firstName} ${user.lastName}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
    body {
      font-family: 'Times New Roman', serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.6;
      color: #000;
      background-color: #fcfbf5; /* Match paper color slightly */
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .logo {
      width: 100px;
      height: auto;
      margin-bottom: 10px;
    }
    .university-name {
      font-size: 22px;
      font-weight: bold;
      color: #2b547e; /* RMU Blue */
      margin-bottom: 5px;
    }
    .address {
      font-size: 11px;
      color: #000;
    }
    .meta-line {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .ref-col {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .ref-row {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .dots {
      border-bottom: 1px dotted #000;
      width: 250px;
      display: inline-block;
      height: 15px;
    }
    .subject {
      font-weight: bold;
      text-decoration: underline;
      margin-bottom: 20px;
      margin-top: 20px;
    }
    .content {
      text-align: justify;
      margin-bottom: 20px;
    }
    .content p {
      margin-bottom: 15px;
    }
    .signature-section {
      margin-top: 40px;
    }
    .signature-img {
      height: 60px;
      margin-top: 10px;
      margin-bottom: 5px;
    }
    .signature-name {
      font-weight: bold;
      text-transform: uppercase;
    }
    .signature-title {
      font-weight: bold;
    }
    .footer {
      margin-top: 50px;
      font-size: 11px;
      text-align: center;
      font-style: italic;
    }
    .member-states {
      font-weight: bold;
      font-style: normal;
    }
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      background: #1e40af;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">Print / Save as PDF</button>
  
  <div class="header">
    <img src="${crestBase64 || '/assets/rmu-crest.webp'}" alt="RMU Crest" class="logo" />
    <div class="university-name">Regional Maritime University</div>
    <div class="address" style="color: #000;">
      Post Office Box GP 1115, Accra, Ghana Tel: (+233 302) 712775 / 712343 / 718225. Fax: (+233 302) 712047. Registrar Tel/Fax: (+233 302) 714070
    </div>
  </div>

  <div class="meta-line">
    <div class="ref-col">
      <div class="ref-row">
        <span>MY REF:</span>
        <span style="font-weight: bold;">${letterRequest?.referenceNumber ? `RMU/${letterRequest.referenceNumber}` : 'RMU/50/57[852]/9'}</span>
      </div>
      <div class="ref-row mt-2">
        <span>YOUR REF:</span>
      </div>
      <div class="ref-col" style="margin-top: 15px; margin-left: 70px;">
        <span class="dots"></span>
        <span class="dots"></span>
        <span class="dots"></span>
        <span class="dots"></span>
      </div>
    </div>
    <div class="date-col" style="font-weight: bold;">
      ${currentDate}
    </div>
  </div>

  <div class="recipient">
    <p>Dear Sir/Madam,</p>
  </div>

  <div class="subject">
    ${isGeneral ? 'INDUSTRIAL ATTACHMENT' : 'RECOMMENDATION FOR INTERNSHIP PLACEMENT'}
  </div>

  <div class="content">
    <p>The Regional Maritime University presents its compliments to you.</p>

    <p>
      <strong>${user.firstName} ${user.lastName}</strong> is a ${user.yearOfStudy || 'N/A'}${getOrdinalSuffix(user.yearOfStudy)} year [Level ${user.yearOfStudy ? user.yearOfStudy * 100 : 'N/A'}] student of the University who is pursuing 
      ${user.program || 'N/A'} programme in the ${signature.department} Department.
    </p>

    <p>
      In fulfillment of the requirement for the programme, ${user.gender === 'female' ? 'she' : 'he'} has to undertake an industrial attachment.
    </p>

    <p>
      We would therefore be grateful if you could offer the above-mentioned student placement in your establishment 
      ${letterRequest?.internshipDuration ? `for a duration of ${letterRequest.internshipDuration}` : 'for the upcoming attachment period'}.
    </p>

    ${!isGeneral ? `
    <p>
      ${user.gender === 'female' ? 'She' : 'He'} is specifically recommended to <strong>${letterRequest.companyName}</strong> 
      ${letterRequest.purpose ? `for the purpose of ${letterRequest.purpose}` : ''}.
    </p>
    ` : ''}

    <p>
      The Regional Maritime University takes this opportunity to renew to you the assurance of its highest consideration.
    </p>

    <p>Thank you.</p>
  </div>

  <div class="signature-section">
    <p>Yours faithfully,</p>
    <!-- <img src="${signature.signature}" alt="Signature" class="signature-img" onerror="this.style.display='none';" /> -->
    <br><br>
    <div class="signature-name">${signature.name}</div>
    <div class="signature-title">[${signature.title.toUpperCase()} - ${signature.department}]</div>
  </div>

  ${letterRequest && letterRequest.verificationCode ? `
  <div style="margin-top: 40px; font-size: 11px;">
    <strong>Verification Code:</strong> ${letterRequest.verificationCode}<br>
    <em>This document can be verified online using the code above.</em>
  </div>
  ` : ''}

  <div class="footer">
    <div class="member-states">Member States: Cameroon, The Gambia, Ghana, Liberia, Sierra Leone</div>
    Email: university.registrar@rmu.edu.gh &nbsp;&nbsp;&nbsp; Website: www.rmu.edu.gh<br>
    In case of reply the number and date of this letter should be quoted.
  </div>
</body>
</html>
</body>
</html>
  `;
}

function getOrdinalSuffix(num) {
  if (!num) return '';
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

// Generate a real PDF buffer of the formal letter using pdfkit
async function generatePDFBuffer(user, letterRequest) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const signature = programSignatures[user.program] || defaultSignature;
      const currentDate = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const isGeneral = letterRequest && (letterRequest.requestType === 'general');

      // --- Header ---
      const path = require('path');
      const fs = require('fs');
      
      const logoPath = path.join(__dirname, '../public/rmu-crest.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, (doc.page.width - 100) / 2, 40, { width: 100 });
        doc.moveDown(5); // Adjust space after square logo
      } else {
        doc.moveDown(2);
      }
      
      doc.fontSize(22).font('Helvetica-Bold').fillColor('#2b547e').text('Regional Maritime University', { align: 'center' });
      doc.fontSize(9).font('Helvetica').fillColor('#000000')
        .text('Post Office Box GP 1115, Accra, Ghana Tel: (+233 302) 712775 / 712343 / 718225. Fax: (+233 302) 712047. Registrar Tel/Fax: (+233 302) 714070', { align: 'center' });
      doc.moveDown(1.5);

      // --- Meta Line (Refs and Date) ---
      const refY = doc.y;
      doc.fontSize(11).font('Helvetica').text('MY REF:', 50, refY);
      const myRef = letterRequest?.referenceNumber ? `RMU/${letterRequest.referenceNumber}` : 'RMU/50/57[852]/9';
      doc.font('Helvetica-Bold').text(myRef, 110, refY);
      
      doc.font('Helvetica-Bold').text(currentDate, 400, refY, { align: 'right', width: 145 });
      
      doc.font('Helvetica').text('YOUR REF:', 50, refY + 20);
      doc.text('...........................................................................', 120, refY + 40);
      doc.text('...........................................................................', 120, refY + 60);
      doc.text('...........................................................................', 120, refY + 80);
      doc.text('...........................................................................', 120, refY + 100);

      doc.moveDown(9);
      
      // --- Recipient ---
      doc.font('Helvetica').text('Dear Sir/Madam,', 50, doc.y);
      doc.moveDown(1.5);

      // --- Subject ---
      const subjectText = isGeneral ? 'INDUSTRIAL ATTACHMENT' : 'RECOMMENDATION FOR INTERNSHIP PLACEMENT';
      doc.font('Helvetica-Bold').text(subjectText, { underline: true });
      doc.moveDown(1);

      // --- Body ---
      doc.font('Helvetica').fontSize(11);

      doc.text('The Regional Maritime University presents its compliments to you.', { align: 'justify' });
      doc.moveDown(1);
      
      const genderPronoun = user.gender === 'female' ? 'she' : 'he';
      const capitalizedPronoun = user.gender === 'female' ? 'She' : 'He';
      const level = user.yearOfStudy ? user.yearOfStudy * 100 : 'N/A';

      doc.font('Helvetica-Bold').text(`${user.firstName} ${user.lastName}`, { continued: true })
         .font('Helvetica').text(` is a ${user.yearOfStudy || 'N/A'}${getOrdinalSuffix(user.yearOfStudy)} year [Level ${level}] student of the University who is pursuing ${user.program || 'N/A'} programme in the ${signature.department} Department.`, { align: 'justify' });
      doc.moveDown(1);

      doc.text(`In fulfillment of the requirement for the programme, ${genderPronoun} has to undertake an industrial attachment.`, { align: 'justify' });
      doc.moveDown(1);

      const durationText = letterRequest?.internshipDuration ? `for a duration of ${letterRequest.internshipDuration}` : 'for the upcoming attachment period';
      doc.text(`We would therefore be grateful if you could offer the above-mentioned student placement in your establishment ${durationText}.`, { align: 'justify' });
      doc.moveDown(1);

      if (!isGeneral && letterRequest) {
         doc.text(`${capitalizedPronoun} is specifically recommended to `, { continued: true })
            .font('Helvetica-Bold').text(`${letterRequest.companyName}`, { continued: true })
            .font('Helvetica').text(` ${letterRequest.purpose ? `for the purpose of ${letterRequest.purpose}` : ''}.`, { align: 'justify' });
         doc.moveDown(1);
      }

      doc.text('The Regional Maritime University takes this opportunity to renew to you the assurance of its highest consideration.', { align: 'justify' });
      doc.moveDown(1);

      doc.text('Thank you.');
      doc.moveDown(2);

      // --- Signature ---
      doc.text('Yours faithfully,');
      doc.moveDown(4);
      doc.font('Helvetica-Bold').text(signature.name);
      doc.font('Helvetica-Bold').text(`[${signature.title.toUpperCase()} - ${signature.department.toUpperCase()}]`);

      // --- Reference / Verification ---
      if (letterRequest && letterRequest.verificationCode) {
        doc.moveDown(2);
        doc.fontSize(9).font('Helvetica-Bold').text('Verification Code: ', { continued: true }).font('Helvetica').text(letterRequest.verificationCode);
        doc.font('Helvetica-Oblique').text('This document can be verified online using the code above.');
      }

      // --- Footer ---
      const pageHeight = doc.page.height;
      doc.fontSize(9).font('Helvetica-Bold').text('Member States: Cameroon, The Gambia, Ghana, Liberia, Sierra Leone', 0, pageHeight - 80, { align: 'center', width: doc.page.width });
      doc.font('Helvetica-Oblique').text('Email: university.registrar@rmu.edu.gh          Website: www.rmu.edu.gh', 0, pageHeight - 65, { align: 'center', width: doc.page.width });
      doc.text('In case of reply the number and date of this letter should be quoted.', 0, pageHeight - 50, { align: 'center', width: doc.page.width });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function generateLetter(req, res) {
  try {
    const user = req.user;
    const { internshipId } = req.query;

    if (!user || user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can generate letters' });
    }

    // Fetch user with latest data
    const fullUser = await User.findByPk(user.id);
    if (!fullUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If internshipId provided, fetch internship details
    let internship = null;
    if (internshipId) {
      const { Internship } = require('../models');
      internship = await Internship.findByPk(internshipId);
    }

    const html = generateLetterHTML(fullUser, internship);

    // Return HTML that can be rendered or converted to PDF
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error generating letter:', error);
    res.status(500).json({ message: 'Failed to generate letter', error: error.message });
  }
}

async function downloadLetter(req, res) {
  try {
    const user = req.user;
    const { internshipId, format = 'html' } = req.query;

    if (!user || user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can download letters' });
    }

    const fullUser = await User.findByPk(user.id);
    if (!fullUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    let internship = null;
    if (internshipId) {
      const { Internship } = require('../models');
      internship = await Internship.findByPk(internshipId);
    }

    const html = generateLetterHTML(fullUser, internship);

    if (format === 'html') {
      const filename = `Internship_Letter_${user.firstName}_${user.lastName}_${Date.now()}.html`;
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(html);
    } else {
      // For PDF, you would need a library like puppeteer or html-pdf
      // For now, return HTML which can be printed to PDF
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    }
  } catch (error) {
    console.error('Error downloading letter:', error);
    res.status(500).json({ message: 'Failed to download letter', error: error.message });
  }
}

// Letter Request Controllers
async function createRequest(req, res) {
  try {
    const user = req.user;
    const { LetterRequest } = require('../models');

    if (!user || user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can create letter requests' });
    }

    const {
      companyName,
      companyEmail,
      companyPhone,
      companyAddress,
      internshipDuration,
      internshipStartDate,
      internshipEndDate,
      purpose,
      category,
      additionalNotes,
      contactInfo,
      requestType,
    } = req.body;

    let finalDuration = internshipDuration;
    if (!finalDuration && internshipStartDate && internshipEndDate) {
      const start = new Date(internshipStartDate);
      const end = new Date(internshipEndDate);
      const weeks = Math.round((end - start) / (1000 * 60 * 60 * 24 * 7));
      const months = Math.round(weeks / 4);
      if (months >= 1) {
        finalDuration = `${months} month${months > 1 ? 's' : ''}`;
      } else if (weeks > 0) {
        finalDuration = `${weeks} week${weeks > 1 ? 's' : ''}`;
      } else {
        finalDuration = 'Less than a week';
      }
    }

    // Validation - general requests don't need company details
    const isGeneral = !requestType || requestType === 'general';
    if (isGeneral) {
      if (!finalDuration) {
        return res.status(400).json({
          message: 'Internship duration or start/end dates are required'
        });
      }
    } else {
      if (!companyName || !finalDuration || !purpose) {
        return res.status(400).json({
          message: 'Company name, internship duration/dates, and purpose are required'
        });
      }
    }

    const request = await LetterRequest.create({
      studentId: user.id,
      companyName: companyName || (isGeneral ? 'General Request' : ''),
      companyEmail,
      companyPhone,
      companyAddress,
      internshipDuration: finalDuration,
      internshipStartDate,
      internshipEndDate,
      purpose: purpose || (isGeneral ? 'General Internship Placement' : 'Internship Placement'),
      category,
      additionalNotes,
      contactInfo,
      requestType: isGeneral ? 'general' : requestType,
      status: 'pending',
    });


    // Create notification for admin
    const { createNotification } = require('../services/notificationService');
    const { User } = require('../models');
    const admins = await User.findAll({ where: { role: 'admin' } });

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'letter_request',
        title: 'New Letter Request',
        message: `${user.firstName} ${user.lastName} has requested an internship letter for ${companyName}`,
        relatedId: request.id,
      });
    }

    res.status(201).json({
      message: 'Letter request submitted successfully',
      request
    });
  } catch (error) {
    console.error('Error creating letter request:', error);
    res.status(500).json({
      message: 'Failed to create letter request',
      error: error.message
    });
  }
}

async function getRequests(req, res) {
  try {
    const user = req.user;
    const { LetterRequest } = require('../models');
    const { status } = req.query;

    let where = {};

    // Students can only see their own requests
    if (user.role === 'student') {
      where.studentId = user.id;
    }

    // Admins can filter by status
    if (status && user.role === 'admin') {
      where.status = status;
    }

    const requests = await LetterRequest.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    // Load related student and reviewer data
    const { User } = require('../models');
    for (const request of requests) {
      if (request.studentId) {
        const student = await User.findOne({ id: request.studentId });
        if (student) request.student = student;
      }
      if (request.reviewedBy) {
        const reviewer = await User.findOne({ id: request.reviewedBy });
        if (reviewer) request.reviewer = reviewer;
      }
    }

    res.json({ requests });
  } catch (error) {
    console.error('Error fetching letter requests:', error);
    res.status(500).json({
      message: 'Failed to fetch letter requests',
      error: error.message
    });
  }
}

async function getRequestById(req, res) {
  try {
    const user = req.user;
    const { LetterRequest } = require('../models');
    const { id } = req.params;

    const request = await LetterRequest.findByPk(id);

    // Load related student and reviewer data
    if (request) {
      const { User } = require('../models');
      if (request.studentId) {
        const student = await User.findOne({ id: request.studentId });
        if (student) request.student = student;
      }
      if (request.reviewedBy) {
        const reviewer = await User.findOne({ id: request.reviewedBy });
        if (reviewer) request.reviewer = reviewer;
      }
    }

    if (!request) {
      return res.status(404).json({ message: 'Letter request not found' });
    }

    // Students can only view their own requests
    if (user.role === 'student' && request.studentId !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ request });
  } catch (error) {
    console.error('Error fetching letter request:', error);
    res.status(500).json({
      message: 'Failed to fetch letter request',
      error: error.message
    });
  }
}

async function updateRequestStatus(req, res) {
  try {
    const user = req.user;
    const { LetterRequest } = require('../models');
    const { id } = req.params;
    const { status, adminNotes, sendEmail } = req.body;

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await LetterRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({ message: 'Letter request not found' });
    }

    const updateData = {
      status,
      adminNotes,
      reviewedBy: user.id,
      reviewedAt: new Date().toISOString(),
    };

    // If approved, generate PDF
    if (status === 'approved' && !request.pdfUrl) {
      try {
        const pdfData = await generateLetterPDF(request);
        updateData.pdfUrl = pdfData.url;
        updateData.pdfGeneratedAt = new Date().toISOString();
      } catch (pdfError) {
        console.error('Error generating PDF:', pdfError);
        // Continue with approval even if PDF generation fails
      }
    }

    const updated = await LetterRequest.update(id, updateData);

    // Create notification for student
    const { createNotification } = require('../services/notificationService');
    const isGeneral = request.requestType === 'general';
    
    let notificationTitle = '';
    let notificationMessage = '';
    
    if (status === 'approved') {
      notificationTitle = isGeneral ? 'General Internship Letter Approved' : 'Letter Request Approved - PDF Ready';
      notificationMessage = isGeneral 
        ? "Your General Internship Letter has been approved and is now available for viewing, download, and printing."
        : `Your internship letter request for ${request.companyName} has been approved. Your PDF letter is now available for download. Reference: ${request.referenceNumber || 'N/A'}`;
    } else if (status === 'rejected') {
      notificationTitle = 'Letter Request Rejected';
      notificationMessage = isGeneral
        ? "Your General Internship Letter request has been rejected."
        : `Your internship letter request for ${request.companyName} has been rejected.`;
    }

    await createNotification({
      userId: request.studentId,
      type: 'letter_request',
      title: notificationTitle,
      message: notificationMessage,
      relatedId: request.id,
      link: status === 'approved' ? `/dashboard/letter-requests?view=${request.id}` : undefined,
    });

    // Send email notification to student if requested and approved
    if (status === 'approved' && sendEmail !== false) {
      try {
        await sendLetterEmailNotification(request, updated);
      } catch (emailError) {
        console.error('Error sending student email notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Send formal letter PDF to company email if approved and companyEmail exists
    if (status === 'approved' && request.companyEmail) {
      try {
        const { User } = require('../models');
        const student = await User.findOne({ id: request.studentId });
        if (student) {
          const pdfBuffer = await generatePDFBuffer(student, request);
          const transporter = require('../config/email');
          const emailFrom = process.env.EMAIL_FROM || `"RMU Internship Portal" <${process.env.SMTP_USER || 'noreply@rmu.edu.gh'}>`;

          await transporter.sendMail({
            from: emailFrom,
            to: request.companyEmail,
            subject: `Internship Application - ${student.firstName} ${student.lastName}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: #1e3a5f; color: white; padding: 24px 20px; text-align: center; }
                  .header img { max-width: 120px; height: auto; display: block; margin: 0 auto 14px; background: rgba(255,255,255,0.95); padding: 8px; border-radius: 8px; }
                  .content { padding: 20px; background: #f9f9f9; }
                  .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    ${crestBase64 ? `<img src="${crestBase64}" alt="Regional Maritime University" />` : ''}
                    <h1 style="margin:0;font-size:22px;">Internship Application</h1>
                    <p style="margin:10px 0 0;font-size:13px;opacity:0.95;">Regional Maritime University</p>
                  </div>
                  <div class="content">
                    <p>Dear Human Resources Manager,</p>
                    <p>Please find attached the official internship recommendation letter for <strong>${student.firstName} ${student.lastName}</strong> from the Regional Maritime University.</p>
                    <p>This student is highly recommended for an internship position at your reputable organization.</p>
                    <p>The letter can be verified using the reference number and verification code provided within the document.</p>
                    <p>Best regards,<br>Regional Maritime University</p>
                  </div>
                  <div class="footer">
                    <p>This is an automated message. Please do not reply directly to this email.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
            text: `Dear Human Resources Manager,\n\nPlease find attached the official internship recommendation letter for ${student.firstName} ${student.lastName} from the Regional Maritime University.\n\nBest regards,\nRegional Maritime University`,
            attachments: [
              {
                filename: `Internship_Letter_${student.firstName}_${student.lastName}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
              }
            ]
          });

          await LetterRequest.update(id, {
            emailSent: true,
            emailSentAt: new Date().toISOString(),
          });

          // Notify student that letter was sent to company
          await createNotification({
            userId: request.studentId,
            type: 'letter_request',
            title: 'Letter Sent to Company',
            message: `Your approved internship letter has been sent to ${request.companyName} (${request.companyEmail}).`,
            relatedId: request.id,
          });
        }
      } catch (companyEmailError) {
        console.error('Error sending letter to company:', companyEmailError);
        // Don't fail the request if company email fails
      }
    }

    res.json({
      message: 'Request status updated successfully',
      request: updated
    });
  } catch (error) {
    console.error('Error updating letter request status:', error);
    res.status(500).json({
      message: 'Failed to update request status',
      error: error.message
    });
  }
}

// Generate PDF from letter request
async function generateLetterPDF(request) {
  const { User } = require('../models');
  const student = await User.findOne({ id: request.studentId });

  if (!student) {
    throw new Error('Student not found');
  }

  // Generate HTML letter
  const html = generateLetterHTML(student, null, request);

  // Create document verification record for security and integrity
  if (request.referenceNumber && request.verificationCode) {
    const { createDocumentVerification } = require('../services/documentVerificationService');
    await createDocumentVerification({
      documentType: 'letter',
      documentId: request.id,
      referenceNumber: request.referenceNumber,
      verificationCode: request.verificationCode,
      content: html,
      generatedBy: request.reviewedBy || student.id,
      metadata: {
        companyName: request.companyName,
        studentId: request.studentId,
        studentName: `${student.firstName} ${student.lastName}`,
      },
    });
  }

  const { v4: uuidv4 } = require('uuid');
  const filename = `letter_${request.referenceNumber || request.id}_${Date.now()}.html`;

  return {
    url: `/api/letters/requests/${request.id}/download`,
    filename: filename,
  };
}

// Send email notification to student when letter is approved
async function sendLetterEmailNotification(request, updatedRequest) {
  const transporter = require('../config/email');
  const { User } = require('../models');
  const student = await User.findOne({ id: request.studentId });

  if (!student || !student.email) {
    throw new Error('Student email not found');
  }

  const emailFrom = process.env.EMAIL_FROM || `"RMU Internship Portal" <${process.env.SMTP_USER || 'noreply@rmu.edu.gh'}>`;

  const mailOptions = {
    from: emailFrom,
    to: student.email,
    subject: `Internship Letter Approved - ${request.referenceNumber || 'Reference'}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e3a5f; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #1e3a5f; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #1e3a5f; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Internship Letter Approved</h1>
          </div>
          <div class="content">
            <p>Dear ${student.firstName} ${student.lastName},</p>
            
            <p>Your internship letter request has been <strong>approved</strong> and is now available for download.</p>
            
            <div class="info-box">
              <h3>Request Details</h3>
              <p><strong>Reference Number:</strong> ${request.referenceNumber || 'N/A'}</p>
              <p><strong>Verification Code:</strong> ${request.verificationCode || 'N/A'}</p>
              <p><strong>Company:</strong> ${request.companyName}</p>
              <p><strong>Duration:</strong> ${request.internshipDuration}</p>
            </div>
            
            <p>You can download your letter from your dashboard:</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/letter-requests?view=${request.id}" class="button">
              Download Letter
            </a>
            
            <p>If you have any questions, please contact the administration office.</p>
            
            <p>Best regards,<br>RMU Internship Portal</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Dear ${student.firstName} ${student.lastName},

      Your internship letter request has been approved and is now available for download.

      Reference Number: ${request.referenceNumber || 'N/A'}
      Verification Code: ${request.verificationCode || 'N/A'}
      Company: ${request.companyName}
      Duration: ${request.internshipDuration}

      Download your letter: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/letter-requests?view=${request.id}

      Best regards,
      RMU Internship Portal
    `,
  };

  await transporter.sendMail(mailOptions);
}

// Download PDF endpoint
async function downloadLetterPDF(req, res) {
  try {
    const user = req.user;
    const { LetterRequest } = require('../models');
    const { id } = req.params;

    const request = await LetterRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({ message: 'Letter request not found' });
    }

    // Students can only download their own letters
    if (user.role === 'student' && request.studentId !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only approved requests can be downloaded
    if (request.status !== 'approved') {
      return res.status(400).json({ message: 'Letter not yet approved' });
    }

    // Generate letter HTML
    const { User } = require('../models');
    const student = await User.findOne({ id: request.studentId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const html = generateLetterHTML(student, null, request);

    // Log document download
    const { logActivity } = require('../services/activityLogService');
    const { recordDocumentTransmission } = require('../services/documentTransmissionService');

    await logActivity({
      userId: user.id,
      actionType: 'document_download',
      resourceType: 'letter_request',
      resourceId: id,
      description: `Downloaded letter PDF: ${request.referenceNumber || request.id}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      metadata: {
        referenceNumber: request.referenceNumber,
        verificationCode: request.verificationCode,
      },
    });

    // Record document transmission
    await recordDocumentTransmission({
      documentId: id,
      documentType: 'letter',
      senderId: user.id,
      recipientType: user.role === 'student' ? 'student' : 'admin',
      recipientEmail: user.email,
      recipientName: `${user.firstName} ${user.lastName}`,
      transmissionMethod: 'download',
      metadata: {
        referenceNumber: request.referenceNumber,
        verificationCode: request.verificationCode,
      },
    });

    // Increment download count
    await LetterRequest.update(id, {
      downloadCount: (request.downloadCount || 0) + 1,
      lastDownloadedAt: new Date().toISOString(),
    });

    // Return HTML (can be printed to PDF by browser)
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="Internship_Letter_${request.referenceNumber || request.id}.html"`);
    res.send(html);
  } catch (error) {
    console.error('Error downloading letter PDF:', error);
    res.status(500).json({
      message: 'Failed to download letter',
      error: error.message
    });
  }
}

// View Letter HTML endpoint
async function viewLetterHTML(req, res) {
  try {
    const user = req.user;
    const { LetterRequest } = require('../models');
    const { id } = req.params;

    const request = await LetterRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({ message: 'Letter request not found' });
    }

    // Students can only view their own letters
    if (user.role === 'student' && request.studentId !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only approved requests can be viewed
    if (request.status !== 'approved') {
      return res.status(400).json({ message: 'Letter not yet approved' });
    }

    // Generate letter HTML
    const { User } = require('../models');
    const student = await User.findOne({ id: request.studentId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const html = generateLetterHTML(student, null, request);

    // Return HTML (inline)
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', 'inline');
    res.send(html);
  } catch (error) {
    console.error('Error viewing letter HTML:', error);
    res.status(500).json({
      message: 'Failed to view letter',
      error: error.message
    });
  }
}

// Mark email as sent (for tracking purposes)
async function markEmailSent(req, res) {
  try {
    const user = req.user;
    const { LetterRequest } = require('../models');
    const { id } = req.params;

    const request = await LetterRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({ message: 'Letter request not found' });
    }

    // Students can only mark their own requests
    if (user.role === 'student' && request.studentId !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update email sent status
    const updated = await LetterRequest.update(id, {
      emailSent: true,
      emailSentAt: new Date().toISOString(),
    });

    res.json({
      message: 'Email status updated successfully',
      request: updated
    });
  } catch (error) {
    console.error('Error marking email as sent:', error);
    res.status(500).json({
      message: 'Failed to update email status',
      error: error.message
    });
  }
}

// Update letter request details (Admin only - before approval)
async function updateRequest(req, res) {
  try {
    const user = req.user;
    const { LetterRequest } = require('../models');
    const { id } = req.params;
    const {
      companyName,
      companyEmail,
      companyPhone,
      companyAddress,
      internshipDuration,
      internshipStartDate,
      internshipEndDate,
      purpose,
      category,
      additionalNotes,
    } = req.body;

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const request = await LetterRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({ message: 'Letter request not found' });
    }

    // Only allow editing if status is pending
    if (request.status !== 'pending') {
      return res.status(400).json({
        message: 'Cannot edit request that has already been approved or rejected'
      });
    }

    const updateData = {};
    if (companyName !== undefined) updateData.companyName = companyName;
    if (companyEmail !== undefined) updateData.companyEmail = companyEmail;
    if (companyPhone !== undefined) updateData.companyPhone = companyPhone;
    if (companyAddress !== undefined) updateData.companyAddress = companyAddress;
    if (internshipDuration !== undefined) updateData.internshipDuration = internshipDuration;
    if (internshipStartDate !== undefined) updateData.internshipStartDate = internshipStartDate;
    if (internshipEndDate !== undefined) updateData.internshipEndDate = internshipEndDate;
    if (purpose !== undefined) updateData.purpose = purpose;
    if (category !== undefined) updateData.category = category;
    if (additionalNotes !== undefined) updateData.additionalNotes = additionalNotes;

    const updated = await LetterRequest.update(id, updateData);

    res.json({
      message: 'Request updated successfully',
      request: updated
    });
  } catch (error) {
    console.error('Error updating letter request:', error);
    res.status(500).json({
      message: 'Failed to update request',
      error: error.message
    });
  }
}

// Check if student has an approved general request
async function checkGeneralApproval(req, res) {
  try {
    const user = req.user;
    const { LetterRequest } = require('../models');

    if (!user || user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can check approval status' });
    }

    const requests = await LetterRequest.findAll({
      where: { studentId: user.id, status: 'approved' },
    });

    // Filter for general requests
    const approvedGeneral = requests.filter(r => r.requestType === 'general' || r.requestType === 'admin');

    res.json({
      hasApprovedGeneral: approvedGeneral.length > 0,
      approvedRequests: approvedGeneral.map(r => ({
        id: r.id,
        referenceNumber: r.referenceNumber,
        internshipDuration: r.internshipDuration,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error checking general approval:', error);
    res.status(500).json({ message: 'Failed to check approval status', error: error.message });
  }
}

module.exports = {
  generateLetter,
  downloadLetter,
  programSignatures,
  createRequest,
  getRequests,
  getRequestById,
  updateRequest,
  updateRequestStatus,
  downloadLetterPDF,
  viewLetterHTML,
  markEmailSent,
  checkGeneralApproval,
};
