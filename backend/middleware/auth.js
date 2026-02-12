const jwt = require('jsonwebtoken');
const { User } = require('../models');
const jwtConfig = require('../config/jwt');

module.exports = async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, jwtConfig.secret);
    const user = await User.findOne({ id: decoded.id });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Remove password from user object
    delete user.password;

    // TEMPORARILY DISABLED: Email verification check for testing
    // For students, check email verification (except for auth routes and profile update)
    // Allow access to verify-email, resend-verification, and profile update routes
    // const allowedPaths = ['/auth/verify-email', '/auth/resend-verification', '/profile'];
    // const isAllowedPath = allowedPaths.some(path => req.path.includes(path));
    
    // if (user.role === 'student' && !user.isEmailVerified && !isAllowedPath) {
    //   return res.status(403).json({ 
    //     message: 'Please verify your email before accessing this resource.',
    //     requiresVerification: true 
    //   });
    // }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

