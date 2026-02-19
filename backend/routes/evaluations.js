const express = require('express');
const auth = require('../middleware/auth');
const evaluationController = require('../controllers/evaluationController');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get all evaluations
router.get('/', evaluationController.getEvaluations);

// Get evaluation by ID
router.get('/:id', evaluationController.getEvaluationById);

// Mark evaluation as viewed
router.post('/:id/view', evaluationController.markEvaluationViewed);

// Acknowledge evaluation feedback
router.post('/:id/acknowledge', evaluationController.acknowledgeEvaluationFeedback);

// Create evaluation (Admin only)
router.post('/', evaluationController.createEvaluation);

// Update evaluation (Admin only)
router.patch('/:id', evaluationController.updateEvaluation);

module.exports = router;

