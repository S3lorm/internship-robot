const express = require('express');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');
const evaluationController = require('../controllers/evaluationController');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get all evaluations
router.get('/', evaluationController.getEvaluations);

// Get evaluation by ID
router.get('/:id', evaluationController.getEvaluationById);

// Mark evaluation as viewed
router.patch('/:id/view', evaluationController.markEvaluationViewed);

// Acknowledge evaluation feedback
router.patch('/:id/acknowledge', evaluationController.acknowledgeEvaluationFeedback);

// Create evaluation (system admin only)
router.post('/', checkRole('admin'), evaluationController.createEvaluation);

// Update evaluation (admin or HOD in same department as student)
router.patch('/:id', evaluationController.updateEvaluation);

module.exports = router;


