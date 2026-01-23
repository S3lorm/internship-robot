const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/register', authController.registerValidators, validate, authController.register);
router.post('/login', authController.loginValidators, validate, authController.login);
router.post('/logout', auth, authController.logout);
router.post('/verify-email', authController.verifyEmailValidators, validate, authController.verifyEmail);
router.post(
  '/resend-verification',
  authController.resendVerificationValidators,
  validate,
  authController.resendVerification
);
router.post('/forgot-password', authController.forgotPasswordValidators, validate, authController.forgotPassword);
router.post('/reset-password', authController.resetPasswordValidators, validate, authController.resetPassword);
router.get('/me', auth, authController.me);

module.exports = router;

