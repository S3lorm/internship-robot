const express = require('express');
const router = express.Router();
const {
  getSupervisorReview,
  submitSupervisorReview,
} = require('../controllers/weeklyLogbookController');

router.get('/:token', getSupervisorReview);
router.post('/:token', submitSupervisorReview);

module.exports = router;
