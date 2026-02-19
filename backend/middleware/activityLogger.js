const { logActivity } = require('../services/activityLogService');

/**
 * Middleware to automatically log API requests
 */
function activityLogger(req, res, next) {
  // Skip logging for health checks and static files
  if (
    req.path === '/api/health' ||
    req.path.startsWith('/uploads') ||
    req.path.startsWith('/signatures')
  ) {
    return next();
  }

  // Log after response is sent
  res.on('finish', async () => {
    if (!req.user) return; // Skip if not authenticated

    const actionType = getActionType(req.method, req.path);
    const resourceType = getResourceType(req.path);
    const resourceId = req.params.id || req.body.id || null;

    const description = `${req.method} ${req.path} - ${res.statusCode}`;

    await logActivity({
      userId: req.user.id,
      actionType,
      resourceType,
      resourceId,
      description,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      metadata: {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
      },
    });
  });

  next();
}

/**
 * Determine action type from request
 */
function getActionType(method, path) {
  if (path.includes('/login')) return 'login';
  if (path.includes('/logout')) return 'logout';
  if (path.includes('/download')) return 'document_download';
  if (path.includes('/generate') || path.includes('/create')) return 'document_generate';
  if (path.includes('/view') || method === 'GET') return 'document_view';
  if (path.includes('/acknowledge')) return 'evaluation_acknowledge';
  if (path.includes('/submit')) return 'logbook_submit';
  if (method === 'POST') return 'request_create';
  if (method === 'PATCH' || method === 'PUT') {
    if (path.includes('/approve')) return 'request_approve';
    if (path.includes('/reject')) return 'request_reject';
    return 'request_update';
  }
  return 'admin_action';
}

/**
 * Determine resource type from path
 */
function getResourceType(path) {
  if (path.includes('/letters') || path.includes('/letter')) return 'letter_request';
  if (path.includes('/evaluations') || path.includes('/evaluation')) return 'evaluation';
  if (path.includes('/logbooks') || path.includes('/logbook')) return 'logbook';
  if (path.includes('/reports') || path.includes('/report')) return 'report';
  if (path.includes('/applications') || path.includes('/application')) return 'application';
  if (path.includes('/internships') || path.includes('/internship')) return 'internship';
  if (path.includes('/users') || path.includes('/user')) return 'user';
  return 'system';
}

module.exports = activityLogger;

