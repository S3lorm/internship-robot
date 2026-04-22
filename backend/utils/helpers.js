const crypto = require('crypto');

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function validateStudentEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  const studentEmailRegex = /^[a-z0-9._%+-]+@st\.rmu\.edu\.gh$/;
  return studentEmailRegex.test(normalized);
}

/** Six-digit numeric code (100000–999999) for optional email verification */
function generateEmailVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

module.exports = { randomToken, validateStudentEmail, generateEmailVerificationCode };

