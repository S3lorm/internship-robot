const express = require('express');
const auth = require('../middleware/auth');
const letterController = require('../controllers/letterController');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Generate letter (returns HTML)
router.get('/generate', letterController.generateLetter);

// Download letter
router.get('/download', letterController.downloadLetter);

// Get available signatures (for admin to manage)
router.get('/signatures', (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  res.json({ signatures: letterController.programSignatures });
});

module.exports = router;
