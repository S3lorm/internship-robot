const express = require('express');
const auth = require('../middleware/auth');
const reminderController = require('../controllers/reminderController');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get upcoming deadlines for current user
router.get('/upcoming', reminderController.getUpcomingDeadlines);

// Get overdue items for current user
router.get('/overdue', reminderController.getOverdueItems);

// Manually trigger reminders (Admin only)
router.post('/trigger', reminderController.triggerReminders);

module.exports = router;

