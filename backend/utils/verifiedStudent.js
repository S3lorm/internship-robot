/** Students who completed email verification — eligible for department lists and staff workflows. */
function isEmailVerifiedStudent(user) {
  return Boolean(user && user.role === 'student' && user.isEmailVerified === true);
}

module.exports = { isEmailVerifiedStudent };
