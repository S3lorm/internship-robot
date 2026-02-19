const { logSecurityEvent, checkSuspiciousActivity } = require('../services/securityService');
const rateLimit = require('express-rate-limit');

/**
 * Enhanced role-based access control middleware
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      logSecurityEvent({
        eventType: 'unauthorized_access',
        severity: 'high',
        description: `Unauthenticated access attempt to ${req.method} ${req.path}`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        resourceType: getResourceType(req.path),
        resourceId: req.params.id,
      });

      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logSecurityEvent({
        eventType: 'permission_denied',
        userId: req.user.id,
        severity: 'medium',
        description: `User ${req.user.id} attempted to access ${req.method} ${req.path} without required role`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        resourceType: getResourceType(req.path),
        resourceId: req.params.id,
        metadata: {
          userRole: req.user.role,
          requiredRoles: allowedRoles,
        },
      });

      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
}

/**
 * Resource ownership check middleware
 */
function requireOwnership(resourceType, getResourceFn) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Admins can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    try {
      const resource = await getResourceFn(req.params.id);
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      // Check ownership
      const ownerField = resourceType === 'user' ? 'id' : 'studentId';
      if (resource[ownerField] !== req.user.id) {
        logSecurityEvent({
          eventType: 'unauthorized_access',
          userId: req.user.id,
          severity: 'high',
          description: `User attempted to access ${resourceType} ${req.params.id} without ownership`,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          resourceType,
          resourceId: req.params.id,
        });

        return res.status(403).json({ message: 'Access denied' });
      }

      next();
    } catch (error) {
      console.error('Error checking resource ownership:', error);
      res.status(500).json({ message: 'Error checking permissions' });
    }
  };
}

/**
 * Rate limiting middleware
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    await logSecurityEvent({
      eventType: 'rate_limit_exceeded',
      userId: req.user?.id,
      severity: 'medium',
      description: `Rate limit exceeded for ${req.ip}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.status(429).json({
      message: 'Too many requests, please try again later.',
    });
  },
});

/**
 * Strict rate limiting for sensitive operations
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 requests per window
  message: 'Too many requests, please try again later.',
  handler: async (req, res) => {
    await logSecurityEvent({
      eventType: 'rate_limit_exceeded',
      userId: req.user?.id,
      severity: 'high',
      description: `Strict rate limit exceeded for ${req.ip} on ${req.path}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      resourceType: getResourceType(req.path),
    });

    res.status(429).json({
      message: 'Too many requests, please try again later.',
    });
  },
});

/**
 * Helper function to get resource type
 */
function getResourceType(path) {
  if (path.includes('/letters')) return 'letter_request';
  if (path.includes('/evaluations')) return 'evaluation';
  if (path.includes('/logbooks')) return 'logbook';
  if (path.includes('/reports')) return 'report';
  if (path.includes('/applications')) return 'application';
  return 'system';
}

module.exports = {
  requireRole,
  requireOwnership,
  apiLimiter,
  strictLimiter,
};


