const fs = require('fs');
const path = require('path');
const { StaffSignature, User } = require('../models');
const { studentBelongsToHodDepartment, resolveCatalogDepartment } = require('../constants/departmentCatalog');

function dataUrlToBuffer(dataUrl) {
  const match = String(dataUrl || '').match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
  if (!match) return null;
  const format = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], 'base64');
  if (format === 'webp') return null;
  return buffer;
}

let hodTemplateCache = null;

/** HOD/Secretary template image (PNG for PDF; also used in HTML letters). */
function loadHodSecretaryTemplate() {
  if (hodTemplateCache) return hodTemplateCache;

  const pngPath = path.join(__dirname, '../public/hod-secretary-template.png');
  const webpPaths = [
    path.join(__dirname, '../public/signatures/hod-secretary-template.webp'),
    path.join(__dirname, '../../client/public/bold-capitals-signaturely.webp'),
  ];

  if (fs.existsSync(pngPath)) {
    const buffer = fs.readFileSync(pngPath);
    hodTemplateCache = {
      imageBuffer: buffer,
      signatureDataUrl: `data:image/png;base64,${buffer.toString('base64')}`,
    };
    return hodTemplateCache;
  }

  for (const webpPath of webpPaths) {
    if (!fs.existsSync(webpPath)) continue;
    const buffer = fs.readFileSync(webpPath);
    hodTemplateCache = {
      imageBuffer: null,
      signatureDataUrl: `data:image/webp;base64,${buffer.toString('base64')}`,
    };
    return hodTemplateCache;
  }

  hodTemplateCache = { imageBuffer: null, signatureDataUrl: null };
  return hodTemplateCache;
}

function applyTemplateImage(signature) {
  const template = loadHodSecretaryTemplate();
  if (!signature) return signature;
  if (signature.imageBuffer || signature.signatureDataUrl) return signature;

  return {
    ...signature,
    signatureDataUrl: template.signatureDataUrl,
    imageBuffer: template.imageBuffer,
    isGeneratedFallback: false,
  };
}

function buildFallbackSignature(studentOrUser = {}) {
  const department = String(studentOrUser.department || '').trim() || 'Regional Maritime University';
  const template = loadHodSecretaryTemplate();
  const base = {
    signerName: process.env.DEFAULT_HOD_SIGNATURE_NAME || 'Dr. Kwame Mensah',
    name: process.env.DEFAULT_HOD_SIGNATURE_NAME || 'Dr. Kwame Mensah',
    title: 'Head of Department',
    department,
    signatureDataUrl: template.signatureDataUrl,
    imageBuffer: template.imageBuffer,
    isGeneratedFallback: !template.signatureDataUrl && !template.imageBuffer,
    signatureText: process.env.DEFAULT_HOD_SIGNATURE_NAME || 'Dr. Kwame Mensah',
  };
  return base;
}

function normalizeSignature(signature, fallback) {
  if (!signature) return fallback;

  let imageBuffer = dataUrlToBuffer(signature.signatureDataUrl);
  let signatureDataUrl = signature.signatureDataUrl || null;

  if (!imageBuffer && !signatureDataUrl) {
    const template = loadHodSecretaryTemplate();
    imageBuffer = template.imageBuffer;
    signatureDataUrl = template.signatureDataUrl;
  } else if (!imageBuffer && signatureDataUrl) {
    const template = loadHodSecretaryTemplate();
    if (template.imageBuffer) imageBuffer = template.imageBuffer;
  }

  return {
    signerName: signature.signerName || fallback.signerName,
    name: signature.signerName || fallback.name,
    title: signature.title || fallback.title,
    department: signature.department || fallback.department,
    signatureDataUrl,
    imageBuffer,
    isGeneratedFallback: false,
    signatureText: signature.signerName || fallback.signatureText,
  };
}

function hodDisplayName(user) {
  return `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
}

function hodTitle(user) {
  if (user?.originalRole === 'secutuary' || user?.role === 'secutuary') return 'Secutuary';
  return 'Head of Department';
}

function canonicalDepartmentName(departmentInput, hodUser = null) {
  const catalog = resolveCatalogDepartment(departmentInput || hodUser?.department);
  return catalog?.name || hodUser?.department || departmentInput || '';
}

/** Find the HOD account responsible for a student's department. */
async function findDepartmentHodUser(studentOrUser = {}) {
  const department = String(studentOrUser.department || '').trim();
  if (!department) return null;

  const studentStub = {
    department,
    program: studentOrUser.program || '',
    studentId: studentOrUser.studentId || '',
  };

  const hods = await User.findAll({ where: { role: 'hod', isActive: true } });
  const match = hods.find((hod) => studentBelongsToHodDepartment(studentStub, hod.department));
  return match || null;
}

async function resolveDepartmentSignature(studentOrUser = {}) {
  const fallback = buildFallbackSignature(studentOrUser);
  const department = String(studentOrUser.department || '').trim();
  if (!department) return applyTemplateImage(fallback);

  const hodUser = await findDepartmentHodUser(studentOrUser);
  const deptLabel = canonicalDepartmentName(department, hodUser) || department;

  let active = await StaffSignature.findActiveByDepartmentFlexible(department);
  if (!active && hodUser) {
    active = await StaffSignature.findMine(hodUser.id);
  }

  const hodName = hodUser ? hodDisplayName(hodUser) : '';
  const baseFallback = {
    ...fallback,
    signerName: hodName || active?.signerName || fallback.signerName,
    name: hodName || active?.signerName || fallback.name,
    signatureText: hodName || active?.signerName || fallback.signatureText,
    title: hodUser ? hodTitle(hodUser) : 'Head of Department',
    department: deptLabel || department,
  };

  if (active) {
    const normalized = normalizeSignature(active, baseFallback);
    if (hodName) {
      normalized.signerName = hodName;
      normalized.name = hodName;
      normalized.signatureText = hodName;
    }
    normalized.department = deptLabel || normalized.department;
    normalized.title = hodUser ? hodTitle(hodUser) : normalized.title;
    return applyTemplateImage(normalized);
  }

  if (hodUser && hodName) {
    return applyTemplateImage({
      ...baseFallback,
      isGeneratedFallback: !baseFallback.signatureDataUrl && !baseFallback.imageBuffer,
    });
  }

  return applyTemplateImage(fallback);
}

async function resolveSignatureForReviewer(reviewerId, studentOrUser = {}) {
  if (!reviewerId) return resolveDepartmentSignature(studentOrUser);

  const reviewer = await User.findByPk(reviewerId);
  if (!reviewer || reviewer.role === 'admin') {
    return resolveDepartmentSignature(studentOrUser);
  }

  const fallback = buildFallbackSignature(studentOrUser);
  const reviewerName = hodDisplayName(reviewer);
  const deptLabel =
    canonicalDepartmentName(studentOrUser.department, reviewer) ||
    reviewer.department ||
    fallback.department;

  const mine = await StaffSignature.findMine(reviewer.id);
  const normalized = normalizeSignature(mine, {
    ...fallback,
    signerName: reviewerName || mine?.signerName || fallback.signerName,
    name: reviewerName || mine?.signerName || fallback.name,
    title: hodTitle(reviewer),
    department: deptLabel,
    signatureText: reviewerName || mine?.signerName || fallback.signatureText,
  });

  if (reviewerName) {
    normalized.signerName = reviewerName;
    normalized.name = reviewerName;
    normalized.signatureText = reviewerName;
  }
  normalized.department = deptLabel;
  normalized.title = hodTitle(reviewer);

  return applyTemplateImage(normalized);
}

/**
 * Resolve signature for a letter using reviewer (if any) or the student's department HOD.
 */
async function resolveLetterSignatureForRequest(studentOrUser = {}, letterRequest = null) {
  const reviewerId = letterRequest?.reviewedBy || null;
  if (reviewerId) {
    return resolveSignatureForReviewer(reviewerId, studentOrUser);
  }
  return resolveDepartmentSignature(studentOrUser);
}

/** Use snapshot image when present; keep signer name/title aligned with current department HOD. */
async function resolveLetterSignatureWithSnapshot(studentOrUser = {}, letterRequest = null) {
  const live = await resolveLetterSignatureForRequest(studentOrUser, letterRequest);
  if (!letterRequest?.signatureSnapshot) return live;

  const fromSnapshot = signatureFromSnapshot(letterRequest.signatureSnapshot, studentOrUser);
  if (!fromSnapshot) return live;

  return applyTemplateImage({
    ...fromSnapshot,
    signerName: live.signerName,
    name: live.name,
    signatureText: live.signatureText,
    title: live.title,
    department: live.department,
    signatureDataUrl: fromSnapshot.signatureDataUrl || live.signatureDataUrl,
    imageBuffer: fromSnapshot.imageBuffer || live.imageBuffer,
    isGeneratedFallback: fromSnapshot.isGeneratedFallback && live.isGeneratedFallback,
  });
}

function signatureSnapshot(signature) {
  const template = loadHodSecretaryTemplate();
  return {
    signerName: signature.signerName || signature.name,
    title: signature.title,
    department: signature.department,
    signatureDataUrl: signature.signatureDataUrl || template.signatureDataUrl || null,
    isGeneratedFallback: !!signature.isGeneratedFallback,
    signedAt: new Date().toISOString(),
  };
}

function signatureFromSnapshot(snapshot, fallbackSubject = {}) {
  if (!snapshot) return null;
  const fallback = buildFallbackSignature(fallbackSubject);
  const template = loadHodSecretaryTemplate();
  const signatureDataUrl = snapshot.signatureDataUrl || template.signatureDataUrl || null;
  let imageBuffer = dataUrlToBuffer(signatureDataUrl);
  if (!imageBuffer && template.imageBuffer) imageBuffer = template.imageBuffer;

  const name = snapshot.signerName || fallback.signerName;
  return {
    signerName: name,
    name,
    title: snapshot.title || fallback.title,
    department: snapshot.department || fallback.department,
    signatureDataUrl,
    imageBuffer,
    isGeneratedFallback: !!snapshot.isGeneratedFallback,
    signatureText: name,
  };
}

function drawSignatureOnPdf(doc, signature, options = {}) {
  const width = options.width || 150;
  const height = options.height || 48;
  const sig = applyTemplateImage(signature || {});

  if (sig?.imageBuffer) {
    try {
      doc.image(sig.imageBuffer, { width, height, fit: [width, height] });
      return;
    } catch (error) {
      console.error('Could not render signature image on PDF:', error.message || error);
    }
  }

  doc
    .font('Helvetica-Oblique')
    .fontSize(options.fontSize || 20)
    .fillColor('#1f2937')
    .text(sig?.signatureText || sig?.name || 'Authorized Signature');
  doc.fillColor('#000000');
}

module.exports = {
  resolveDepartmentSignature,
  resolveSignatureForReviewer,
  resolveLetterSignatureForRequest,
  resolveLetterSignatureWithSnapshot,
  findDepartmentHodUser,
  signatureSnapshot,
  signatureFromSnapshot,
  drawSignatureOnPdf,
  loadHodSecretaryTemplate,
};
