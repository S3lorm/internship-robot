const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

try {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream('test-crest.pdf'));
  const logoPath = path.join(__dirname, 'public/rmu-crest.png');
  console.log('Testing logo:', logoPath);
  doc.image(logoPath, 0, 0, { width: 100 });
  doc.end();
  console.log('PDF rendered successfully.');
} catch (e) {
  console.error('Error rendering PDF:', e.message);
}
