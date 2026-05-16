const express = require('express');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');
const portalController = require('../controllers/portalController');

const router = express.Router();

router.get('/status', auth, portalController.getStatus);
router.patch('/status', auth, checkRole('admin'), portalController.updateStatus);

module.exports = router;
