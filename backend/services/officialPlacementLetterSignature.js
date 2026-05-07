const {
  resolveDepartmentSignature,
  resolveSignatureForReviewer,
} = require('./staffSignatureService');

/**
 * PDF footer uses the approving user's name when known; titles/lines follow HOD vs admin templates.
 */
async function resolveOfficialPlacementSignature(placement, student) {
  if (!placement || !placement.reviewedBy) {
    return resolveDepartmentSignature(student);
  }

  try {
    return await resolveSignatureForReviewer(placement.reviewedBy, student);
  } catch (e) {
    console.error('resolveOfficialPlacementSignature:', e.message || e);
  }

  return resolveDepartmentSignature(student);
}

module.exports = {
  resolveOfficialPlacementSignature,
};
