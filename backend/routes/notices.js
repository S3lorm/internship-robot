const express = require('express');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');
const noticeController = require('../controllers/noticeController');

const router = express.Router();

// list can optionally use auth to tailor audience filtering
router.get('/', auth, noticeController.list);

// Static routes MUST come before parameterized /:id routes
// Endpoint for any logged in user to mark all notices as read
router.patch('/read-all', auth, noticeController.markAllAsRead);

router.get('/:id', auth, noticeController.getById);
router.post('/', auth, checkRole('admin'), noticeController.create);
router.patch('/:id', auth, checkRole('admin'), noticeController.update);
router.delete('/:id', auth, checkRole('admin'), noticeController.remove);

// Endpoint for any logged in user to mark a notice as read
router.patch('/:id/read', auth, noticeController.markAsRead);

module.exports = router;
