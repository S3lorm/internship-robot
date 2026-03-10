const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

// GET /api/dashboard/student - Get consolidated dashboard data for student
router.get('/student', auth, dashboardController.getStudentDashboard);

module.exports = router;
