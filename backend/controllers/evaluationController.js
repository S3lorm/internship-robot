const { Evaluation } = require('../models');
const { createNotification } = require('../services/notificationService');
const { notifyEvaluationAvailable } = require('../services/reminderService');

// Get all evaluations for current user
async function getEvaluations(req, res) {
  try {
    const user = req.user;
    let where = {};

    // Students can only see their own evaluations
    if (user.role === 'student') {
      where.studentId = user.id;
    }

    const evaluations = await Evaluation.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

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
      await createNotification({
        userId: evaluation.createdBy || user.id, // Notify creator/admin
        type: 'system',
        title: 'Evaluation Feedback Acknowledged',
        message: `Student has acknowledged feedback for evaluation: ${evaluation.title}`,
        priority: 'low',
      });
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

// Create evaluation (Admin only)
async function createEvaluation(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
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
    if (evaluation.isAvailable) {
      await notifyEvaluationAvailable(evaluation);
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
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.params;
    const evaluation = await Evaluation.findOne({ id });
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    const updates = req.body;
    const wasAvailable = evaluation.isAvailable;
    const updated = await Evaluation.update(id, updates);

    // Send notification if evaluation just became available
    if (!wasAvailable && updated.isAvailable) {
      await notifyEvaluationAvailable(updated);
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


