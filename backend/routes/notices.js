const express = require('express');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');
const noticeController = require('../controllers/noticeController');

const router = express.Router();

// list can optionally use auth to tailor audience filtering
router.get('/', auth, noticeController.list);
router.get('/:id', auth, noticeController.getById);
router.post('/', auth, checkRole('admin'), noticeController.create);
router.patch('/:id', auth, checkRole('admin'), noticeController.update);
router.delete('/:id', auth, checkRole('admin'), noticeController.remove);

module.exports = router;

