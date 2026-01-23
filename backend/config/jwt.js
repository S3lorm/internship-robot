module.exports = {
  secret: process.env.JWT_SECRET || 'changeme_in_env',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshExpiresIn: '30d',
};

