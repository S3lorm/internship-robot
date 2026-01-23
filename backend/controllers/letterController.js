const { User } = require('../models');
const auth = require('../middleware/auth');

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

function generateLetterHTML(user, internship = null) {
  const signature = programSignatures[user.program] || defaultSignature;
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const internshipDetails = internship ? `
    <p><strong>Internship Position:</strong> ${internship.title}</p>
    <p><strong>Company:</strong> ${internship.company}</p>
    <p><strong>Location:</strong> ${internship.location}</p>
    <p><strong>Duration:</strong> ${internship.duration}</p>
  ` : '';

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
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #000;
      padding-bottom: 20px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .university-name {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .address {
      font-size: 12px;
      margin-top: 10px;
    }
    .date {
      text-align: right;
      margin-bottom: 30px;
    }
    .recipient {
      margin-bottom: 30px;
    }
    .subject {
      font-weight: bold;
      margin-bottom: 20px;
      text-decoration: underline;
    }
    .content {
      text-align: justify;
      margin-bottom: 20px;
    }
    .content p {
      margin-bottom: 15px;
      text-indent: 30px;
    }
    .signature-section {
      margin-top: 50px;
    }
    .signature-line {
      border-top: 1px solid #000;
      width: 300px;
      margin-top: 60px;
    }
    .signature-name {
      margin-top: 5px;
      font-weight: bold;
    }
    .signature-title {
      font-size: 12px;
    }
    .footer {
      margin-top: 30px;
      font-size: 10px;
      text-align: center;
      color: #666;
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
    .print-button:hover {
      background: #1e3a8a;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">Print / Save as PDF</button>
  
  <div class="header">
    <div class="logo">RMU</div>
    <div class="university-name">REGIONAL MARITIME UNIVERSITY</div>
    <div class="address">
      P.O. Box GP 1115, Accra, Ghana<br>
      Tel: +233 302 712 775 | Email: info@rmu.edu.gh<br>
      Website: www.rmu.edu.gh
    </div>
  </div>

  <div class="date">
    ${currentDate}
  </div>

  <div class="recipient">
    <p>The Human Resources Manager</p>
    ${internship ? `<p>${internship.company}</p>` : '<p>[Company Name]</p>'}
    ${internship ? `<p>${internship.location}</p>` : '<p>[Company Address]</p>'}
  </div>

  <div class="subject">
    SUBJECT: RECOMMENDATION FOR INTERNSHIP PLACEMENT - ${user.firstName.toUpperCase()} ${user.lastName.toUpperCase()}
  </div>

  <div class="content">
    <p>
      I am writing to recommend <strong>${user.firstName} ${user.lastName}</strong>, 
      Student ID: <strong>${user.studentId || 'N/A'}</strong>, a ${user.yearOfStudy || 'N/A'}${getOrdinalSuffix(user.yearOfStudy)} 
      year student enrolled in the <strong>${user.program || 'N/A'}</strong> program at the Regional Maritime University.
    </p>

    ${internshipDetails}

    <p>
      ${user.firstName} ${user.lastName} has demonstrated exceptional academic performance and a strong commitment 
      to their studies. Throughout their time at the Regional Maritime University, they have shown dedication, 
      professionalism, and a genuine interest in gaining practical experience in the maritime industry.
    </p>

    <p>
      We believe that ${user.firstName} would be an excellent candidate for this internship opportunity. 
      Their academic background, combined with their enthusiasm and willingness to learn, makes them well-suited 
      for this position. We are confident that they will contribute positively to your organization while 
      gaining valuable industry experience.
    </p>

    <p>
      The Regional Maritime University fully supports this internship placement and will ensure that 
      ${user.firstName} maintains the highest standards of professionalism and academic excellence 
      throughout the internship period.
    </p>

    <p>
      We would be grateful if you could consider ${user.firstName}'s application for this internship 
      opportunity. Should you require any additional information, please do not hesitate to contact us.
    </p>

    <p>
      Thank you for considering our student for this valuable learning opportunity.
    </p>
  </div>

  <div class="signature-section">
    <p>Yours faithfully,</p>
    <div class="signature-line"></div>
    <div class="signature-name">${signature.name}</div>
    <div class="signature-title">${signature.title}</div>
    <div class="signature-title">${signature.department}</div>
    <div class="signature-title">Regional Maritime University</div>
  </div>

  <div class="footer">
    <p>This is an official document from the Regional Maritime University</p>
    <p>For verification, please contact: info@rmu.edu.gh</p>
  </div>

  <script>
    // Auto-print on load (optional - can be removed)
    // window.onload = function() {
    //   setTimeout(() => window.print(), 500);
    // };
  </script>
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

module.exports = {
  generateLetter,
  downloadLetter,
  programSignatures
};
