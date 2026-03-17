const express = require('express');
const router = express.Router();
const { getEvaluationForm, submitEvaluation } = require('../controllers/supervisorEvaluationController');

// Public routes — no authentication required
// Supervisors access these via secure token links sent by email

// GET /api/evaluate/:token - Load evaluation form data
router.get('/:token', getEvaluationForm);

// POST /api/evaluate/:token - Submit the evaluation
router.post('/:token', submitEvaluation);

module.exports = router;
