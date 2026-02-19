const { Logbook, Report } = require('../models');
const { createNotification } = require('../services/notificationService');

// Acknowledge logbook feedback
async function acknowledgeLogbookFeedback(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    const logbook = await Logbook.findOne({ id });
    if (!logbook) {
      return res.status(404).json({ message: 'Logbook not found' });
    }

    // Students can only acknowledge their own logbook feedback
    if (user.role === 'student' && logbook.studentId !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if feedback exists
    if (!logbook.feedback) {
      return res.status(400).json({ message: 'No feedback available to acknowledge' });
    }

    // Check if acknowledgment is required
    if (!logbook.requiresFeedbackAcknowledgment) {
      return res.status(400).json({ message: 'This logbook does not require feedback acknowledgment' });
    }

    // Mark as viewed if not already viewed
    if (!logbook.feedbackViewedAt) {
      await Logbook.update(id, {
        feedbackViewedAt: new Date().toISOString(),
        feedbackViewedBy: user.id,
      });
    }

    // Only update acknowledgment if not already acknowledged
    if (!logbook.feedbackAcknowledgedAt) {
      await Logbook.update(id, {
        feedbackAcknowledgedAt: new Date().toISOString(),
        feedbackAcknowledgedBy: user.id,
      });

      // Notify reviewer
      if (logbook.reviewedBy) {
        await createNotification({
          userId: logbook.reviewedBy,
          type: 'system',
          title: 'Logbook Feedback Acknowledged',
          message: `Student has acknowledged feedback for logbook: ${logbook.title}`,
          priority: 'low',
        });
      }
    }

    res.json({ message: 'Logbook feedback acknowledged successfully' });
  } catch (error) {
    console.error('Error acknowledging logbook feedback:', error);
    res.status(500).json({
      message: 'Failed to acknowledge logbook feedback',
      error: error.message,
    });
  }
}

// Acknowledge report feedback
async function acknowledgeReportFeedback(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    const report = await Report.findOne({ id });
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Students can only acknowledge their own report feedback
    if (user.role === 'student' && report.studentId !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if feedback exists
    if (!report.feedback) {
      return res.status(400).json({ message: 'No feedback available to acknowledge' });
    }

    // Check if acknowledgment is required
    if (!report.requiresFeedbackAcknowledgment) {
      return res.status(400).json({ message: 'This report does not require feedback acknowledgment' });
    }

    // Mark as viewed if not already viewed
    if (!report.feedbackViewedAt) {
      await Report.update(id, {
        feedbackViewedAt: new Date().toISOString(),
        feedbackViewedBy: user.id,
      });
    }

    // Only update acknowledgment if not already acknowledged
    if (!report.feedbackAcknowledgedAt) {
      await Report.update(id, {
        feedbackAcknowledgedAt: new Date().toISOString(),
        feedbackAcknowledgedBy: user.id,
      });

      // Notify reviewer
      if (report.reviewedBy) {
        await createNotification({
          userId: report.reviewedBy,
          type: 'system',
          title: 'Report Feedback Acknowledged',
          message: `Student has acknowledged feedback for report: ${report.title}`,
          priority: 'low',
        });
      }
    }

    res.json({ message: 'Report feedback acknowledged successfully' });
  } catch (error) {
    console.error('Error acknowledging report feedback:', error);
    res.status(500).json({
      message: 'Failed to acknowledge report feedback',
      error: error.message,
    });
  }
}

// Mark logbook feedback as viewed
async function markLogbookFeedbackViewed(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    const logbook = await Logbook.findOne({ id });
    if (!logbook) {
      return res.status(404).json({ message: 'Logbook not found' });
    }

    if (user.role === 'student' && logbook.studentId !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!logbook.feedbackViewedAt) {
      await Logbook.update(id, {
        feedbackViewedAt: new Date().toISOString(),
        feedbackViewedBy: user.id,
      });
    }

    res.json({ message: 'Logbook feedback marked as viewed' });
  } catch (error) {
    console.error('Error marking logbook feedback as viewed:', error);
    res.status(500).json({
      message: 'Failed to mark logbook feedback as viewed',
      error: error.message,
    });
  }
}

// Mark report feedback as viewed
async function markReportFeedbackViewed(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    const report = await Report.findOne({ id });
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (user.role === 'student' && report.studentId !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!report.feedbackViewedAt) {
      await Report.update(id, {
        feedbackViewedAt: new Date().toISOString(),
        feedbackViewedBy: user.id,
      });
    }

    res.json({ message: 'Report feedback marked as viewed' });
  } catch (error) {
    console.error('Error marking report feedback as viewed:', error);
    res.status(500).json({
      message: 'Failed to mark report feedback as viewed',
      error: error.message,
    });
  }
}

module.exports = {
  acknowledgeLogbookFeedback,
  acknowledgeReportFeedback,
  markLogbookFeedbackViewed,
  markReportFeedbackViewed,
};

