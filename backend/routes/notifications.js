const express = require('express');
const auth = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

router.use(auth);

router.get('/', notificationController.list);
router.patch('/:id/read', notificationController.markRead);
router.patch('/read-all', notificationController.markReadAll);
router.delete('/:id', notificationController.remove);

module.exports = router;

