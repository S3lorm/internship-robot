const express = require('express');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/security');
const securityController = require('../controllers/securityController');

const router = express.Router();

// Public endpoint for document verification
router.post('/verify-document', securityController.verifyDocumentController);

// All other routes require authentication
router.use(auth);

// Activity logs
router.get('/activity-logs', securityController.getActivityLogsController);
router.get('/activity-logs/:resourceType/:resourceId', securityController.getResourceActivityLogsController);

// Document verification (authenticated)
router.get('/verification/:documentType/:documentId', securityController.getDocumentVerificationController);

// Document transmissions
router.get('/transmissions/:documentType/:documentId', securityController.getDocumentTransmissionsController);
router.get('/transmissions', securityController.getUserTransmissionsController);

// Security events (Admin only)
router.get('/security-events', requireRole('admin'), securityController.getSecurityEventsController);
router.patch('/security-events/:id/resolve', requireRole('admin'), securityController.resolveSecurityEventController);

module.exports = router;


