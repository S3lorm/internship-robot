const { getSecurityEvents, resolveSecurityEvent } = require('../services/securityService');
const { getAllActivityLogs, getUserActivityLogs, getResourceActivityLogs } = require('../services/activityLogService');
const { verifyDocument, getDocumentVerification } = require('../services/documentVerificationService');
const { getDocumentTransmissions, getUserTransmissions } = require('../services/documentTransmissionService');

// Get security events (Admin only)
async function getSecurityEventsController(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const {
      limit = 50,
      severity,
      eventType,
      resolved,
      startDate,
      endDate,
    } = req.query;

    const events = await getSecurityEvents({
      limit: parseInt(limit),
      severity,
      eventType,
      resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined,
      startDate,
      endDate,
    });

    res.json({ events });
  } catch (error) {
    console.error('Error fetching security events:', error);
    res.status(500).json({
      message: 'Failed to fetch security events',
      error: error.message,
    });
  }
}

// Resolve security event (Admin only)
async function resolveSecurityEventController(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.params;
    const event = await resolveSecurityEvent(id, user.id);

    res.json({
      message: 'Security event resolved',
      event,
    });
  } catch (error) {
    console.error('Error resolving security event:', error);
    res.status(500).json({
      message: 'Failed to resolve security event',
      error: error.message,
    });
  }
}

// Get activity logs
async function getActivityLogsController(req, res) {
  try {
    const user = req.user;

    // Students can only see their own logs
    if (user.role === 'student') {
      const {
        limit = 50,
        actionType,
        resourceType,
        startDate,
        endDate,
      } = req.query;

      const logs = await getUserActivityLogs(user.id, {
        limit: parseInt(limit),
        actionType,
        resourceType,
        startDate,
        endDate,
      });

      return res.json({ logs });
    }

    // Admins can see all logs
    if (user.role === 'admin') {
      const {
        limit = 100,
        userId,
        actionType,
        startDate,
        endDate,
      } = req.query;

      const logs = await getAllActivityLogs({
        limit: parseInt(limit),
        userId,
        actionType,
        startDate,
        endDate,
      });

      return res.json({ logs });
    }

    res.status(403).json({ message: 'Access denied' });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({
      message: 'Failed to fetch activity logs',
      error: error.message,
    });
  }
}

// Get resource activity logs
async function getResourceActivityLogsController(req, res) {
  try {
    const user = req.user;
    const { resourceType, resourceId } = req.params;

    // Students can only see logs for their own resources
    if (user.role === 'student') {
      // Verify ownership would be checked here
      // For now, allow access
    }

    const logs = await getResourceActivityLogs(resourceType, resourceId);

    res.json({ logs });
  } catch (error) {
    console.error('Error fetching resource activity logs:', error);
    res.status(500).json({
      message: 'Failed to fetch resource activity logs',
      error: error.message,
    });
  }
}

// Verify document (Public endpoint)
async function verifyDocumentController(req, res) {
  try {
    const { referenceNumber, verificationCode } = req.body;

    if (!referenceNumber || !verificationCode) {
      return res.status(400).json({
        message: 'Reference number and verification code are required',
      });
    }

    const result = await verifyDocument(referenceNumber, verificationCode);

    if (!result.isValid) {
      return res.status(404).json({
        isValid: false,
        message: result.error || 'Document not found or invalid',
      });
    }

    res.json({
      isValid: true,
      documentType: result.documentType,
      documentId: result.documentId,
      generatedAt: result.generatedAt,
      verificationCount: result.verificationCount,
    });
  } catch (error) {
    console.error('Error verifying document:', error);
    res.status(500).json({
      message: 'Failed to verify document',
      error: error.message,
    });
  }
}

// Get document verification details
async function getDocumentVerificationController(req, res) {
  try {
    const user = req.user;
    const { documentType, documentId } = req.params;

    const verification = await getDocumentVerification(documentType, documentId);

    if (!verification) {
      return res.status(404).json({ message: 'Verification record not found' });
    }

    // Students can only see their own document verifications
    if (user.role === 'student') {
      // Additional ownership check would be here
    }

    res.json({ verification });
  } catch (error) {
    console.error('Error fetching document verification:', error);
    res.status(500).json({
      message: 'Failed to fetch document verification',
      error: error.message,
    });
  }
}

// Get document transmissions
async function getDocumentTransmissionsController(req, res) {
  try {
    const user = req.user;
    const { documentType, documentId } = req.params;

    // Students can see transmissions of their own documents
    if (user.role === 'student') {
      // Ownership check would be here
    }

    const transmissions = await getDocumentTransmissions(documentType, documentId);

    res.json({ transmissions });
  } catch (error) {
    console.error('Error fetching document transmissions:', error);
    res.status(500).json({
      message: 'Failed to fetch document transmissions',
      error: error.message,
    });
  }
}

// Get user's transmission history
async function getUserTransmissionsController(req, res) {
  try {
    const user = req.user;
    const {
      limit = 50,
      documentType,
      status,
    } = req.query;

    // Users can only see their own transmissions
    const transmissions = await getUserTransmissions(user.id, {
      limit: parseInt(limit),
      documentType,
      status,
    });

    res.json({ transmissions });
  } catch (error) {
    console.error('Error fetching user transmissions:', error);
    res.status(500).json({
      message: 'Failed to fetch user transmissions',
      error: error.message,
    });
  }
}

module.exports = {
  getSecurityEventsController,
  resolveSecurityEventController,
  getActivityLogsController,
  getResourceActivityLogsController,
  verifyDocumentController,
  getDocumentVerificationController,
  getDocumentTransmissionsController,
  getUserTransmissionsController,
};


