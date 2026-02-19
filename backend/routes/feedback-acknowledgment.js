const express = require('express');
const auth = require('../middleware/auth');
const feedbackAcknowledgmentController = require('../controllers/feedbackAcknowledgmentController');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Logbook feedback acknowledgment
router.post('/logbooks/:id/view', feedbackAcknowledgmentController.markLogbookFeedbackViewed);
router.post('/logbooks/:id/acknowledge', feedbackAcknowledgmentController.acknowledgeLogbookFeedback);

// Report feedback acknowledgment
router.post('/reports/:id/view', feedbackAcknowledgmentController.markReportFeedbackViewed);
router.post('/reports/:id/acknowledge', feedbackAcknowledgmentController.acknowledgeReportFeedback);

module.exports = router;


