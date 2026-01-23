const express = require('express');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');
const { uploadCv } = require('../middleware/upload');
const applicationController = require('../controllers/applicationController');

const router = express.Router();

router.use(auth);

router.get('/', applicationController.list);
router.get('/my', checkRole('student'), applicationController.my);
router.get('/:id', applicationController.getById);
router.post('/', checkRole('student'), uploadCv.single('cv'), applicationController.submit);
router.patch('/:id/status', checkRole('admin'), applicationController.updateStatus);
router.post('/bulk-action', checkRole('admin'), applicationController.bulkAction);
router.post('/export', checkRole('admin'), applicationController.exportCsv);

module.exports = router;

