const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');

const jwtConfig = require('../config/jwt');
const { User } = require('../models');
const { randomToken, validateStudentEmail } = require('../utils/helpers');
const { sendVerificationEmail, sendPasswordResetEmail, sendPasswordResetOtp } = require('../services/emailService');

function signToken(user) {
  return jwt.sign({ id: user.id }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
}

const registerValidators = [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
];

async function register(req, res) {
  const { email, password, firstName, lastName, studentId, phone, department, program, yearOfStudy } = req.body;

  if (!validateStudentEmail(email)) {
    return res.status(400).json({ message: 'Only @st.rmu.edu.gh email addresses are allowed' });
  }

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    return res.status(400).json({ message: 'Email already in use' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const token = randomToken(24);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  let user;
  try {
    user = await User.create({
      email,
      password: hashed,
      firstName,
      lastName,
      studentId,
      phone,
      department,
      program,
      yearOfStudy,
      role: 'student',
      isEmailVerified: false,
      emailVerificationToken: token,
      emailVerificationExpires: expires,
    });
  } catch (err) {
    console.error('[Register] Error creating user:', err);
    return res.status(500).json({ message: 'Server error during registration' });
  }

  let emailSent = false;
  let emailError = null;
  try {
    await sendVerificationEmail(user, token);
    emailSent = true;
  } catch (error) {
    emailError = error.message;
    console.error('❌ Failed to send verification email during registration:', error.message);
    console.error('   User can still register and resend verification email later');
    // Log the error but still allow registration
  }

  const responseMessage = emailSent 
    ? 'Registered successfully. Please check your email to verify your account.' 
    : emailError && emailError.includes('not configured')
    ? 'Registered successfully, but email could not be sent (SMTP not configured). Please contact support or use the resend verification feature.'
    : 'Registered successfully. Please verify your email. If you did not receive the email, you can resend it from the verification page.';
  
  return res.status(201).json({ 
    message: responseMessage,
    emailSent,
    emailError: emailError || undefined
  });
}

const loginValidators = [body('email').isEmail(), body('password').notEmpty()];

async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user || !user.isActive) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  // For students, check email verification
  if (user.role === 'student' && !user.isEmailVerified) {
    return res.status(403).json({ 
      message: 'Please verify your email before logging in. Check your inbox for the verification link.',
      requiresVerification: true 
    });
  }

  const token = signToken(user);
  const safeUser = user.toJSON();
  delete safeUser.password;

  return res.json({ token, user: safeUser });
}

async function me(req, res) {
  return res.json({ user: req.user });
}

const verifyEmailValidators = [body('token').notEmpty()];

async function verifyEmail(req, res) {
  try {
    const { token } = req.body;
    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) return res.status(400).json({ message: 'Invalid or expired verification token.' });

    if (user.isEmailVerified) {
      return res.json({ message: 'Email already verified. You can log in.' });
    }

    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      return res.status(400).json({ message: 'Verification token has expired. Please request a new one.' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    return res.json({ message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    console.error('Error verifying email:', error);
    return res.status(500).json({ message: 'An error occurred while verifying your email. Please try again.' });
  }
}

const resendVerificationValidators = [body('email').isEmail()];

async function resendVerification(req, res) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'If that email exists, a verification link was sent.' });
    if (user.isEmailVerified) return res.json({ message: 'Email already verified. You can log in.' });

    const token = randomToken(24);
    user.emailVerificationToken = token;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    try {
      await sendVerificationEmail(user, token);
    } catch (emailError) {
      console.error('Failed to resend verification email:', emailError.message);
      return res.status(500).json({ 
        message: 'Failed to send verification email. Please try again later.' 
      });
    }

    return res.json({ message: 'Verification email sent successfully. Please check your inbox.' });
  } catch (error) {
    console.error('Error in resend verification:', error);
    return res.status(500).json({ message: 'An error occurred. Please try again.' });
  }
}

const forgotPasswordValidators = [body('email').isEmail()];

async function forgotPassword(req, res) {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.json({ message: 'If that email exists, a reset code was sent.' });

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  user.passwordResetToken = otp;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  try {
    await sendPasswordResetOtp(user, otp);
  } catch (err) {
    console.error('Failed to send password reset OTP email:', err.message);
  }

  return res.json({ message: 'If that email exists, a reset code was sent.' });
}

const resetPasswordValidators = [
  body('email').isEmail(),
  body('token').isLength({ min: 6, max: 6 }),
  body('password').isLength({ min: 6 }),
];

async function resetPassword(req, res) {
  const { email, token, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Invalid request' });
  if (user.passwordResetToken !== token) return res.status(400).json({ message: 'Invalid or expired code' });

  if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
    return res.status(400).json({ message: 'Code expired. Please request a new one.' });
  }

  user.password = await bcrypt.hash(password, 10);
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  return res.json({ message: 'Password reset successful' });
}

async function logout(_req, res) {
  // JWT is stateless; implement token blacklist if needed
  return res.json({ message: 'Logged out' });
}

module.exports = {
  registerValidators,
  register,
  loginValidators,
  login,
  verifyEmailValidators,
  verifyEmail,
  resendVerificationValidators,
  resendVerification,
  forgotPasswordValidators,
  forgotPassword,
  resetPasswordValidators,
  resetPassword,
  me,
  logout,
};

