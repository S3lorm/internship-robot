const express = require('express');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

router.use(auth, checkRole('admin'));

router.get('/dashboard', analyticsController.dashboard);
router.get('/applications', analyticsController.applications);
router.get('/internships', analyticsController.internships);
router.get('/users', analyticsController.users);

module.exports = router;

