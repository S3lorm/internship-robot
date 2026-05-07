const { StaffSignature } = require('../models');

function requireStaff(user) {
  return user && user.role === 'hod';
}

async function getMine(req, res) {
  try {
    if (!requireStaff(req.user)) {
      return res.status(403).json({ message: 'Only HOD/Secretary users can manage signatures.' });
    }

    const signature = await StaffSignature.findMine(req.user.id);
    res.json({ signature });
  } catch (error) {
    console.error('Error loading staff signature:', error);
    res.status(500).json({ message: 'Failed to load signature', error: error.message });
  }
}

async function saveMine(req, res) {
  try {
    if (!requireStaff(req.user)) {
      return res.status(403).json({ message: 'Only HOD/Secretary users can manage signatures.' });
    }

    const signature = await StaffSignature.upsertMine(req.user, req.body || {});
    res.json({ message: 'Digital signature saved', signature });
  } catch (error) {
    console.error('Error saving staff signature:', error);
    res.status(error.status || 500).json({ message: error.message || 'Failed to save signature' });
  }
}

module.exports = { getMine, saveMine };
