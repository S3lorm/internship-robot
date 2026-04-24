const path = require('path');
const fs = require('fs');
const { User } = require('../models');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

function optionalSignatureImage(relativeUnderPublic) {
  if (!relativeUnderPublic) return undefined;
  const full = path.join(PUBLIC_DIR, relativeUnderPublic);
  return fs.existsSync(full) ? full : undefined;
}

/**
 * Template when a departmental HOD approved the official placement (Stage 2).
 * Replace env vars or add `public/signatures/official-placement-hod.png` for a scanned signature.
 */
function buildHodOfficialPlacementSignature(student) {
  const dept =
    student && student.department && String(student.department).trim()
      ? String(student.department).trim()
      : '[Department name]';
  return {
    name:
      process.env.OFFICIAL_PLACEMENT_HOD_SIGNATORY_NAME ||
      '[Head of Department — printed name]',
    title: 'Head of Department',
    department: dept,
    imagePath: optionalSignatureImage('signatures/official-placement-hod.png'),
  };
}

/**
 * Template when an institution administrator approved the official placement.
 * Replace env vars or add `public/signatures/official-placement-admin.png` for a scanned signature.
 */
function buildAdminOfficialPlacementSignature() {
  return {
    name:
      process.env.OFFICIAL_PLACEMENT_ADMIN_SIGNATORY_NAME ||
      '[Authorised signatory — e.g. Registrar]',
    title: 'For and on behalf of the University',
    department: 'Office of the Registrar — Internship coordination',
    imagePath: optionalSignatureImage('signatures/official-placement-admin.png'),
  };
}

/**
 * PDF footer uses the approving user's name when known; titles/lines follow HOD vs admin templates.
 */
async function resolveOfficialPlacementSignature(placement, student) {
  const hodBlock = buildHodOfficialPlacementSignature(student);
  const adminBlock = buildAdminOfficialPlacementSignature();

  if (!placement || !placement.reviewedBy) {
    return hodBlock;
  }

  try {
    const reviewer = await User.findOne({ id: placement.reviewedBy });
    if (!reviewer || !reviewer.role) {
      return hodBlock;
    }

    const printed = `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim();

    if (reviewer.role === 'admin') {
      return {
        ...adminBlock,
        name: printed || adminBlock.name,
      };
    }

    if (reviewer.role === 'hod') {
      return {
        ...hodBlock,
        name: printed || hodBlock.name,
      };
    }
  } catch (e) {
    console.error('resolveOfficialPlacementSignature:', e.message || e);
  }

  return hodBlock;
}

module.exports = {
  resolveOfficialPlacementSignature,
  buildHodOfficialPlacementSignature,
  buildAdminOfficialPlacementSignature,
};
