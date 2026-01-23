const crypto = require('crypto');

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function validateStudentEmail(email) {
  const studentEmailRegex = /^[a-zA-Z0-9._%+-]+@st\.rmu\.edu\.gh$/;
  return studentEmailRegex.test(email);
}

module.exports = { randomToken, validateStudentEmail };

