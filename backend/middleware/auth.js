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

    if (decoded.hod && decoded.hodDepartment) {
      const now = new Date().toISOString();
      req.user = {
        id: decoded.id,
        email: 'hod.portal@rmu.internal',
        firstName: 'Head of Department',
        lastName: decoded.hodDepartment,
        role: 'hod',
        department: decoded.hodDepartment,
        isEmailVerified: true,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      return next();
    }

    const user = await User.findOne({ id: decoded.id });
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account deactivated', deactivated: true });
    }

    // Remove password from user object
    delete user.password;

    // Build a normalized route string that works for nested routers.
    const routePath = `${req.baseUrl || ''}${req.path || ''}`;
    const fullPath = req.originalUrl || routePath;

    // For students, check email verification (except for auth routes and profile update)
    // Allow access to verify-email, resend-verification, and profile routes
    const allowedPaths = ['/auth/verify-email', '/auth/resend-verification', '/profile'];
    const isAllowedPath = allowedPaths.some(
      path => routePath.includes(path) || fullPath.includes(path)
    );

    if (user.role === 'student' && !user.isEmailVerified && !isAllowedPath) {
      return res.status(403).json({ 
        message: 'Please verify your email before accessing this resource.',
        requiresVerification: true 
      });
    }

    if (user.mustChangePassword) {
      const passwordChangeAllowedPaths = ['/auth/me', '/profile/password'];
      const canProceed = passwordChangeAllowedPaths.some(
        path => routePath.includes(path) || fullPath.includes(path)
      );
      if (!canProceed) {
        return res.status(403).json({
          message: 'Password update required before accessing this resource.',
          requiresPasswordChange: true,
        });
      }
    }

    // Treat "secutuary" as HOD-equivalent for route authorization and dashboards.
    if (user.role === 'secutuary') {
      user.originalRole = 'secutuary';
      user.role = 'hod';
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

