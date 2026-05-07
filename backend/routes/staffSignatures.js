const express = require('express');
const auth = require('../middleware/auth');
const controller = require('../controllers/staffSignatureController');

const router = express.Router();

router.use(auth);
router.get('/me', controller.getMine);
router.put('/me', controller.saveMine);

module.exports = router;
