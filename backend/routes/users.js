const express = require('express');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');
const userController = require('../controllers/userController');

const router = express.Router();

router.use(auth, checkRole('admin'));

router.get('/', userController.list);
router.get('/:id', userController.getById);
router.patch('/:id', userController.update);
router.patch('/:id/status', userController.updateStatus);
router.delete('/:id', userController.remove);
router.post('/export', userController.exportCsv);

module.exports = router;

