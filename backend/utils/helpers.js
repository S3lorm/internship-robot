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

module.exports = { randomToken, validateStudentEmail };

