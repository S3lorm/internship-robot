const express = require('express');
const auth = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');
const profileController = require('../controllers/profileController');

const router = express.Router();

router.use(auth);

router.get('/', profileController.get);
router.patch('/', profileController.update);
router.patch('/password', profileController.changePassword);
router.post('/avatar', uploadAvatar.single('avatar'), profileController.uploadAvatar);
router.delete('/avatar', profileController.removeAvatar);
router.get('/preferences', profileController.getPreferences);
router.patch('/preferences', profileController.updatePreferences);

module.exports = router;

