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

// Letter Request Routes
router.post('/requests', letterController.createRequest);
router.get('/requests', letterController.getRequests);
router.get('/requests/:id', letterController.getRequestById);
router.patch('/requests/:id', letterController.updateRequest); // Update request details (Admin only)
router.patch('/requests/:id/status', letterController.updateRequestStatus);
router.get('/requests/:id/download', letterController.downloadLetterPDF);
router.patch('/requests/:id/mark-email-sent', letterController.markEmailSent);

module.exports = router;
