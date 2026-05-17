const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');

const jwtConfig = require('../config/jwt');
const { User } = require('../models');
const { normalizeDepartmentName } = require('../constants/departments');
const { randomToken, validateStudentEmail, generateEmailVerificationCode } = require('../utils/helpers');
const { sendVerificationEmail, sendPasswordResetEmail, sendPasswordResetOtp } = require('../services/emailService');

function signToken(user) {
  return jwt.sign({ id: user.id }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
}

function hodPlaceholderId(department) {
  const h = crypto.createHash('sha256').update(department).digest('hex').slice(0, 12);
  return `00000000-0000-4000-8000-${h}`;
}

function signHodToken(department) {
  const id = hodPlaceholderId(department);
  return jwt.sign(
    { id, hod: true, hodDepartment: department },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );
}

function buildHodUser(department) {
  const now = new Date().toISOString();
  return {
    id: hodPlaceholderId(department),
    email: 'hod.portal@rmu.internal',
    firstName: 'Head of Department',
    lastName: department,
    role: 'hod',
    department,
    isEmailVerified: true,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}

async function getRegistrationCatalog(_req, res) {
  try {
    const { supabase } = require('../models');
    const { data, error } = await supabase
      .from('departments')
      .select('id,name,is_active,department_programs(program_name,index_prefix,is_active)')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('getRegistrationCatalog departments query failed:', error);
      return res.status(500).json({ message: 'Failed to load registration catalog' });
    }

    const departments = (data || []).map((row) => {
      const groupedPrograms = new Map();
      for (const p of row.department_programs || []) {
        if (!p || p.is_active === false) continue;
        const existing = groupedPrograms.get(p.program_name) || new Set();
        existing.add(String(p.index_prefix || '').trim().toUpperCase());
        groupedPrograms.set(p.program_name, existing);
      }

      const programs = Array.from(groupedPrograms.entries())
        .map(([name, prefixSet]) => ({
          name,
          prefixes: Array.from(prefixSet).filter(Boolean).sort(),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return {
        name: row.name,
        programs,
      };
    });

    return res.json({ departments });
  } catch (err) {
    console.error('getRegistrationCatalog unexpected error:', err);
    return res.status(500).json({ message: 'Failed to load registration catalog' });
  }
}

const registerValidators = [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
];

async function register(req, res) {
  const { email, password, firstName, lastName, studentId, phone, department, program, yearOfStudy } = req.body;

  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!validateStudentEmail(normalizedEmail)) {
    return res.status(400).json({ message: 'Only @st.rmu.edu.gh email addresses are allowed' });
  }

  const existing = await User.findOne({ where: { email: normalizedEmail } });
  if (existing) {
    return res.status(400).json({ message: 'Email already in use' });
  }

  const normalizedStudentId = studentId != null ? String(studentId).trim() : '';
  if (normalizedStudentId) {
    const existingStudent = await User.findOne({ where: { studentId: normalizedStudentId } });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student ID already registered' });
    }
  }

  const hashed = await bcrypt.hash(password, 10);
  const token = randomToken(24);
  const verificationCode = generateEmailVerificationCode();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  let user;
  try {
    user = await User.create({
      email: normalizedEmail,
      password: hashed,
      firstName,
      lastName,
      studentId: normalizedStudentId || undefined,
      phone,
      department,
      program,
      yearOfStudy,
      role: 'student',
      isEmailVerified: false,
      emailVerificationToken: token,
      emailVerificationExpires: expires,
      emailVerificationCode: verificationCode,
    });
  } catch (err) {
    console.error('[Register] Error creating user:', err);
    const code = err && err.code;
    const msg = (err && err.message) || String(err);
    const details = (err && err.details) || '';

    if (code === '23505' || /duplicate key|unique constraint/i.test(msg + details)) {
      if (/email|user_profiles_email/i.test(msg + details)) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      if (/student_id|student id/i.test(msg + details)) {
        return res.status(400).json({ message: 'Student ID already registered' });
      }
      return res.status(400).json({ message: 'This email or student ID is already registered.' });
    }

    const devHint =
      process.env.NODE_ENV === 'development'
        ? ` (${msg})`
        : '';
    return res.status(500).json({ message: `Server error during registration${devHint}` });
  }

  let emailSent = false;
  let emailError = null;
  try {
    await sendVerificationEmail(user, token, verificationCode);
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
  if (safeUser.role === 'secutuary') {
    safeUser.originalRole = 'secutuary';
    safeUser.role = 'hod';
  }

  return res.json({
    token,
    user: safeUser,
    requiresPasswordChange: Boolean(safeUser.mustChangePassword),
  });
}

const loginHodValidators = [body('department').notEmpty(), body('password').notEmpty()];

async function loginHod(req, res) {
  const department = normalizeDepartmentName(req.body.department);
  if (!department) {
    return res.status(400).json({ message: 'Unknown or invalid department name.' });
  }

  const expectedPassword = process.env.HOD_DEFAULT_PASSWORD || '123456789@10';
  if (req.body.password !== expectedPassword) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = signHodToken(department);
  const user = buildHodUser(department);
  return res.json({ token, user });
}

async function me(req, res) {
  return res.json({ user: req.user });
}

const verifyEmailValidators = [];

async function verifyEmail(req, res) {
  try {
    const rawToken = req.body.token;
    const rawCode = req.body.code;
    const rawEmail = req.body.email;

    const hasToken = rawToken != null && String(rawToken).trim().length > 0;
    const normalizedEmail =
      typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
    const codeDigits =
      typeof rawCode === 'string'
        ? rawCode.replace(/\D/g, '').slice(0, 6)
        : String(rawCode != null ? rawCode : '')
            .replace(/\D/g, '')
            .slice(0, 6);
    const hasCodePair = normalizedEmail.length > 0 && codeDigits.length === 6;

    if (!hasToken && !hasCodePair) {
      return res.status(400).json({
        message:
          'Open the verification link from your email, or enter your email and the 6-digit code we sent you.',
      });
    }

    let user;
    if (hasToken) {
      user = await User.findOne({ emailVerificationToken: String(rawToken).trim() });
    } else {
      if (!validateStudentEmail(normalizedEmail)) {
        return res.status(400).json({ message: 'Only @st.rmu.edu.gh addresses can use this verification.' });
      }
      user = await User.findOne({
        email: normalizedEmail,
        emailVerificationCode: codeDigits,
      });
    }

    if (!user) {
      return res.status(400).json({
        message: hasToken
          ? 'Invalid or expired verification token.'
          : 'Invalid email or code, or the code has expired. Request a new verification email.',
      });
    }

    if (user.isEmailVerified) {
      return res.json({ message: 'Email already verified. You can log in.' });
    }

    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      return res.status(400).json({ message: 'Verification has expired. Please request a new one.' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    user.emailVerificationCode = null;
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
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.json({ message: 'If that email exists, a verification link was sent.' });
    if (user.isEmailVerified) return res.json({ message: 'Email already verified. You can log in.' });

    const token = randomToken(24);
    const verificationCode = generateEmailVerificationCode();
    user.emailVerificationToken = token;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.emailVerificationCode = verificationCode;
    await user.save();

    try {
      await sendVerificationEmail(user, token, verificationCode);
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

const checkEmailForPasswordResetValidators = [body('email').isEmail()];

async function checkEmailForPasswordReset(req, res) {
  try {
    const normalizedEmail =
      typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const user = await User.findOne({ where: { email: normalizedEmail } });
    return res.json({ exists: Boolean(user) });
  } catch (error) {
    console.error('Error in checkEmailForPasswordReset:', error);
    return res.status(500).json({ message: 'An unexpected server error occurred. Please try again later.' });
  }
}

const forgotPasswordValidators = [body('email').isEmail()];

async function forgotPassword(req, res) {
  try {
    const normalizedEmail =
      typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : req.body.email;
    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user) {
      // Security: return success even if user doesn't exist to prevent email enumeration
      return res.json({ message: 'If that email exists, a reset code was sent.' });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.passwordResetToken = otp;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    try {
      await sendPasswordResetOtp(user, otp);
      return res.json({ message: 'If that email exists, a reset code was sent.' });
    } catch (err) {
      console.error('Failed to send password reset OTP email:', err.message);
      return res.status(500).json({ 
        message: 'Failed to send the reset code email due to a server error. Please try again later.' 
      });
    }
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    return res.status(500).json({ message: 'An unexpected server error occurred. Please try again later.' });
  }
}

const resetPasswordValidators = [
  body('email').isEmail(),
  body('token').isLength({ min: 6, max: 6 }),
  body('password').isLength({ min: 6 }),
];

async function resetPassword(req, res) {
  const { email, token, password } = req.body;
  const normalizedEmail =
    typeof email === 'string' ? email.trim().toLowerCase() : email;
  const user = await User.findOne({ where: { email: normalizedEmail } });
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
  getRegistrationCatalog,
  registerValidators,
  register,
  loginValidators,
  login,
  loginHodValidators,
  loginHod,
  verifyEmailValidators,
  verifyEmail,
  resendVerificationValidators,
  resendVerification,
  checkEmailForPasswordResetValidators,
  checkEmailForPasswordReset,
  forgotPasswordValidators,
  forgotPassword,
  resetPasswordValidators,
  resetPassword,
  me,
  logout,
};

