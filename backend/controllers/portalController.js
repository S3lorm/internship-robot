const {
  getPortalStatusPayload,
  setPortalStatus,
  CLOSED_MESSAGE,
} = require('../services/internshipPortalService');
const {
  notifyVerifiedStudentsPortalOpened,
  notifyVerifiedStudentsPortalClosed,
} = require('../services/portalNotificationService');

async function getStatus(req, res) {
  try {
    const payload = await getPortalStatusPayload();
    return res.json({ data: payload });
  } catch (err) {
    console.error('getPortalStatus:', err);
    if (err.code === 'PORTAL_TABLE_MISSING') {
      return res.status(503).json({
        message: err.message,
        code: err.code,
        setup: 'Run supabase/migrations/024_internship_portal_control.sql in your Supabase SQL Editor',
      });
    }
    return res.status(500).json({ message: 'Failed to load portal status' });
  }
}

async function updateStatus(req, res) {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can control the internship portal' });
    }

    const { status } = req.body;
    if (!status || !['open', 'closed'].includes(String(status).toLowerCase())) {
      return res.status(400).json({ message: 'Status must be "open" or "closed"' });
    }

    const normalized = String(status).toLowerCase();
    const previous = await getPortalStatusPayload();
    const payload = await setPortalStatus(status, req.user.id);

    let delivery = null;
    const statusChanged =
      (normalized === 'open' && previous.status === 'closed') ||
      (normalized === 'closed' && previous.status === 'open');

    if (statusChanged) {
      try {
        delivery =
          normalized === 'open'
            ? await notifyVerifiedStudentsPortalOpened()
            : await notifyVerifiedStudentsPortalClosed();
      } catch (notifyErr) {
        console.error('portal status notify:', notifyErr);
        delivery = { error: notifyErr.message };
      }
    }

    const response = {
      message:
        payload.isOpen
          ? 'Internship request portal is now open.'
          : 'Internship request portal is now closed.',
      data: payload,
    };

    if (delivery && !delivery.error) {
      response.delivery = delivery;
      response.message += ` Notified ${delivery.notificationsCreated} student(s); ${delivery.emailsSent} email(s) sent.`;
    } else if (delivery?.error) {
      response.deliveryWarning = `Portal is now ${normalized}, but some notifications could not be sent. Check server logs.`;
    }

    return res.json(response);
  } catch (err) {
    console.error('updatePortalStatus:', err);
    if (err.code === 'PORTAL_TABLE_MISSING' || err.code === 'PGRST205') {
      return res.status(503).json({
        message:
          'internship_portal_control table is missing. Run migration 024 in Supabase SQL Editor, then reload API schema.',
        code: 'PORTAL_TABLE_MISSING',
      });
    }
    return res.status(500).json({ message: 'Failed to update portal status' });
  }
}

module.exports = {
  getStatus,
  updateStatus,
  CLOSED_MESSAGE,
};
