const { Evaluation, User } = require('../models');

// Get all evaluations for current user
async function getEvaluations(req, res) {
  try {
    const user = req.user;
    let where = {};

    // Students can only see their own evaluations
    if (user.role === 'student') {
      where.studentId = user.id;
    }

    let evaluations = await Evaluation.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    if (user.role === 'hod') {
      const filtered = [];
      for (const ev of evaluations) {
        const st = await User.findByPk(ev.studentId);
        if (st && st.department === user.department) {
          filtered.push(ev);
        }
      }
      evaluations = filtered;
    }

    res.json({ evaluations });
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    res.status(500).json({
      message: 'Failed to fetch evaluations',
      error: error.message,
    });
  }
}

// Get evaluation by ID
async function getEvaluationById(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    const evaluation = await Evaluation.findOne({ id });
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    // Students can only view their own evaluations
    if (user.role === 'student' && evaluation.studentId !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (user.role === 'hod') {
      const st = await User.findByPk(evaluation.studentId);
      if (!st || st.department !== user.department) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({ evaluation });
  } catch (error) {
    console.error('Error fetching evaluation:', error);
    res.status(500).json({
      message: 'Failed to fetch evaluation',
      error: error.message,
    });
  }
}

// Mark evaluation as viewed
async function markEvaluationViewed(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    const evaluation = await Evaluation.findOne({ id });
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    // Students can only mark their own evaluations as viewed
    if (user.role === 'student' && evaluation.studentId !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only update if not already viewed
    if (!evaluation.viewedAt) {
      await Evaluation.update(id, {
        viewedAt: new Date().toISOString(),
        viewedBy: user.id,
      });
    }

    res.json({ message: 'Evaluation marked as viewed' });
  } catch (error) {
    console.error('Error marking evaluation as viewed:', error);
    res.status(500).json({
      message: 'Failed to mark evaluation as viewed',
      error: error.message,
    });
  }
}

// Acknowledge evaluation feedback
async function acknowledgeEvaluationFeedback(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    const evaluation = await Evaluation.findOne({ id });
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    // Students can only acknowledge their own evaluations
    if (user.role === 'student' && evaluation.studentId !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if acknowledgment is required
    if (!evaluation.requiresAcknowledgment) {
      return res.status(400).json({ message: 'This evaluation does not require acknowledgment' });
    }

    // Only update if not already acknowledged
    if (!evaluation.feedbackAcknowledgedAt) {
      await Evaluation.update(id, {
        feedbackAcknowledgedAt: new Date().toISOString(),
        feedbackAcknowledgedBy: user.id,
      });

      // Create notification for admin (optional)
      try {
        const { createNotification } = require('../services/notificationService');
        await createNotification({
          userId: evaluation.createdBy || user.id, // Notify creator/admin
          type: 'system',
          title: 'Evaluation Feedback Acknowledged',
          message: `Student have acknowledged feedback for evaluation: ${evaluation.title}`,
          relatedId: evaluation.id,
          priority: 'low',
        });
      } catch (notifyErr) {
        console.error('Error sending acknowledgment notification:', notifyErr);
        // Don't fail the whole request if notification fails
      }
    }

    res.json({ message: 'Evaluation feedback acknowledged successfully' });
  } catch (error) {
    console.error('Error acknowledging evaluation feedback:', error);
    res.status(500).json({
      message: 'Failed to acknowledge evaluation feedback',
      error: error.message,
    });
  }
}

// Create evaluation (system admin only — HOD/org flow uses company email links)
async function createEvaluation(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({
        message:
          user.role === 'hod'
            ? 'Evaluations are created when the host organization submits via the link sent to the company email; manual creation is not available here.'
            : 'Access denied',
      });
    }

    const {
      studentId,
      internshipId,
      title,
      description,
      evaluationType,
      isAvailable,
      availableFrom,
      deadline,
      submissionUrl,
      requiresAcknowledgment,
      acknowledgmentDeadline,
    } = req.body;

    const evaluation = await Evaluation.create({
      studentId,
      internshipId,
      title,
      description,
      evaluationType: evaluationType || 'final',
      isAvailable: isAvailable || false,
      availableFrom,
      deadline,
      submissionUrl,
      requiresAcknowledgment: requiresAcknowledgment !== false, // Default true
      acknowledgmentDeadline,
      createdBy: user.id,
    });

    // Send notification if evaluation is immediately available
    if (evaluation && evaluation.isAvailable) {
      try {
        const { notifyEvaluationAvailable } = require('../services/reminderService');
        await notifyEvaluationAvailable(evaluation);
      } catch (notifyErr) {
        console.error('Error sending availability notification:', notifyErr);
      }
    }

    res.status(201).json({
      message: 'Evaluation created successfully',
      evaluation,
    });
  } catch (error) {
    console.error('Error creating evaluation:', error);
    res.status(500).json({
      message: 'Failed to create evaluation',
      error: error.message,
    });
  }
}

// Update evaluation (Admin only)
async function updateEvaluation(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'hod') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;
    const evaluation = await Evaluation.findOne({ id });
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    if (user.role === 'hod') {
      const st = await User.findByPk(evaluation.studentId);
      if (!st || st.department !== user.department) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const updates = req.body;
    const wasAvailable = evaluation.isAvailable;
    const updated = await Evaluation.update(id, updates);

    // Send notification if evaluation just became available
    if (updated && !wasAvailable && updated.isAvailable) {
      try {
        const { notifyEvaluationAvailable } = require('../services/reminderService');
        await notifyEvaluationAvailable(updated);
      } catch (notifyErr) {
        console.error('Error sending update notification:', notifyErr);
      }
    }

    res.json({
      message: 'Evaluation updated successfully',
      evaluation: updated,
    });
  } catch (error) {
    console.error('Error updating evaluation:', error);
    res.status(500).json({
      message: 'Failed to update evaluation',
      error: error.message,
    });
  }
}

module.exports = {
  getEvaluations,
  getEvaluationById,
  markEvaluationViewed,
  acknowledgeEvaluationFeedback,
  createEvaluation,
  updateEvaluation,
};


