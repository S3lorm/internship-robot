const { StaffSignature, User } = require('../models');

function dataUrlToBuffer(dataUrl) {
  const match = String(dataUrl || '').match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
  if (!match) return null;
  return Buffer.from(match[2], 'base64');
}

function buildFallbackSignature(studentOrUser = {}) {
  const department = String(studentOrUser.department || '').trim() || 'Regional Maritime University';
  return {
    signerName: process.env.DEFAULT_HOD_SIGNATURE_NAME || 'Dr. Kwame Mensah',
    name: process.env.DEFAULT_HOD_SIGNATURE_NAME || 'Dr. Kwame Mensah',
    title: 'Head of Department',
    department,
    signatureDataUrl: null,
    imageBuffer: null,
    isGeneratedFallback: true,
    signatureText: process.env.DEFAULT_HOD_SIGNATURE_NAME || 'Dr. Kwame Mensah',
  };
}

function normalizeSignature(signature, fallback) {
  if (!signature) return fallback;
  const imageBuffer = dataUrlToBuffer(signature.signatureDataUrl);
  return {
    signerName: signature.signerName || fallback.signerName,
    name: signature.signerName || fallback.name,
    title: signature.title || fallback.title,
    department: signature.department || fallback.department,
    signatureDataUrl: signature.signatureDataUrl || null,
    imageBuffer,
    isGeneratedFallback: false,
    signatureText: signature.signerName || fallback.signatureText,
  };
}

async function resolveDepartmentSignature(studentOrUser = {}) {
  const fallback = buildFallbackSignature(studentOrUser);
  const department = String(studentOrUser.department || '').trim();
  if (!department) return fallback;

  const active = await StaffSignature.findActiveByDepartment(department);
  return normalizeSignature(active, fallback);
}

async function resolveSignatureForReviewer(reviewerId, studentOrUser = {}) {
  const fallback = buildFallbackSignature(studentOrUser);
  if (!reviewerId) return resolveDepartmentSignature(studentOrUser);

  const reviewer = await User.findByPk(reviewerId);
  if (!reviewer || reviewer.role === 'admin') return fallback;
  const mine = await StaffSignature.findMine(reviewer.id);
  return normalizeSignature(mine, {
    ...fallback,
    signerName: `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim() || fallback.signerName,
    name: `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim() || fallback.name,
    title: reviewer.originalRole === 'secutuary' || reviewer.role === 'secutuary' ? 'Secutuary' : 'Head of Department',
    department: reviewer.department || fallback.department,
    signatureText: `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim() || fallback.signatureText,
  });
}

function signatureSnapshot(signature) {
  return {
    signerName: signature.signerName || signature.name,
    title: signature.title,
    department: signature.department,
    signatureDataUrl: signature.signatureDataUrl || null,
    isGeneratedFallback: !!signature.isGeneratedFallback,
    signedAt: new Date().toISOString(),
  };
}

function signatureFromSnapshot(snapshot, fallbackSubject = {}) {
  if (!snapshot) return null;
  const fallback = buildFallbackSignature(fallbackSubject);
  const signatureDataUrl = snapshot.signatureDataUrl || null;
  const name = snapshot.signerName || fallback.signerName;
  return {
    signerName: name,
    name,
    title: snapshot.title || fallback.title,
    department: snapshot.department || fallback.department,
    signatureDataUrl,
    imageBuffer: dataUrlToBuffer(signatureDataUrl),
    isGeneratedFallback: !!snapshot.isGeneratedFallback,
    signatureText: name,
  };
}

function drawSignatureOnPdf(doc, signature, options = {}) {
  const width = options.width || 150;
  const height = options.height || 48;

  if (signature?.imageBuffer) {
    try {
      doc.image(signature.imageBuffer, { width, height, fit: [width, height] });
      return;
    } catch (error) {
      console.error('Could not render uploaded signature image:', error.message || error);
    }
  }

  doc
    .font('Helvetica-Oblique')
    .fontSize(options.fontSize || 20)
    .fillColor('#1f2937')
    .text(signature?.signatureText || signature?.name || 'Authorized Signature');
  doc.fillColor('#000000');
}

module.exports = {
  resolveDepartmentSignature,
  resolveSignatureForReviewer,
  signatureSnapshot,
  signatureFromSnapshot,
  drawSignatureOnPdf,
};
