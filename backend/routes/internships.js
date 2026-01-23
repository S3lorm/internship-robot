const express = require('express');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');
const internshipController = require('../controllers/internshipController');

const router = express.Router();

router.get('/', internshipController.list);
router.get('/:id', internshipController.getById);
router.post('/', auth, checkRole('admin'), internshipController.create);
router.patch('/:id', auth, checkRole('admin'), internshipController.update);
router.delete('/:id', auth, checkRole('admin'), internshipController.remove);
router.patch('/:id/status', auth, checkRole('admin'), internshipController.updateStatus);

module.exports = router;

