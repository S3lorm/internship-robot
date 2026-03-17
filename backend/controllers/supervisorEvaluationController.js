const crypto = require('crypto');

/**
 * Public controller for supervisor evaluation form.
 * Supervisors access this via secure token links — no login required.
 */

// GET /api/evaluate/:token - Load the evaluation form data
async function getEvaluationForm(req, res) {
  try {
    const { token } = req.params;
    const { EvaluationToken, InternshipPlacement, User, Evaluation } = require('../models');

    // Find the token
    const evalToken = await EvaluationToken.findByToken(token);
    if (!evalToken) {
      return res.status(404).json({ message: 'Invalid evaluation link. This link may be incorrect.' });
    }

    // Check if already used
    if (evalToken.usedStatus === 'used') {
      return res.status(400).json({ message: 'This evaluation has already been submitted. Thank you!' });
    }

    // Check expiry
    if (evalToken.expiresAt && new Date(evalToken.expiresAt) < new Date()) {
      return res.status(410).json({ message: 'This evaluation link has expired. Please contact the university for a new link.' });
    }

    // Load placement data
    const placement = await InternshipPlacement.findByPk(evalToken.placementId);
    if (!placement) {
      return res.status(404).json({ message: 'Placement not found.' });
    }

    // Load student data
    const student = await User.findByPk(placement.studentId);

    res.json({
      placement: {
        organizationName: placement.organizationName,
        departmentRole: placement.departmentRole,
        internshipStartDate: placement.internshipStartDate,
        internshipEndDate: placement.internshipEndDate,
      },
      student: student ? {
        firstName: student.firstName,
        lastName: student.lastName,
        program: student.program,
        department: student.department,
      } : null,
      tokenValid: true,
    });
  } catch (error) {
    console.error('Error loading evaluation form:', error);
    res.status(500).json({ message: 'Failed to load evaluation form', error: error.message });
  }
}

// POST /api/evaluate/:token - Submit the evaluation
async function submitEvaluation(req, res) {
  try {
    const { token } = req.params;
    const { EvaluationToken, InternshipPlacement, Evaluation, User } = require('../models');

    // Find and validate the token
    const evalToken = await EvaluationToken.findByToken(token);
    if (!evalToken) {
      return res.status(404).json({ message: 'Invalid evaluation link.' });
    }
    if (evalToken.usedStatus === 'used') {
      return res.status(400).json({ message: 'This evaluation has already been submitted.' });
    }
    if (evalToken.expiresAt && new Date(evalToken.expiresAt) < new Date()) {
      return res.status(410).json({ message: 'This evaluation link has expired.' });
    }

    const {
      supervisorName,
      supervisorPosition,
      supervisorDepartment,
      workEthicRating,
      communicationRating,
      technicalSkillsRating,
      teamworkRating,
      punctualityRating,
      problemSolvingRating,
      supervisorComments,
      finalRecommendation,
    } = req.body;

    // Validate required fields
    const ratings = [workEthicRating, communicationRating, technicalSkillsRating, teamworkRating, punctualityRating, problemSolvingRating];
    if (!supervisorName || ratings.some(r => r === undefined || r === null || r < 1 || r > 5)) {
      return res.status(400).json({
        message: 'Please fill in all required fields. All ratings must be between 1 and 5.',
      });
    }

    if (!['Excellent', 'Good', 'Average', 'Needs Improvement'].includes(finalRecommendation)) {
      return res.status(400).json({ message: 'Invalid final recommendation value.' });
    }

    // Load placement
    const placement = await InternshipPlacement.findByPk(evalToken.placementId);
    if (!placement) {
      return res.status(404).json({ message: 'Placement not found.' });
    }

    // Create the evaluation record
    const evaluation = await Evaluation.create({
      studentId: placement.studentId,
      placementId: placement.id,
      title: `Supervisor Evaluation - ${placement.organizationName}`,
      evaluationType: 'supervisor_midterm',
      isAvailable: true,
      supervisorName,
      supervisorPosition,
      supervisorDepartment,
      workEthicRating: parseInt(workEthicRating),
      communicationRating: parseInt(communicationRating),
      technicalSkillsRating: parseInt(technicalSkillsRating),
      teamworkRating: parseInt(teamworkRating),
      punctualityRating: parseInt(punctualityRating),
      problemSolvingRating: parseInt(problemSolvingRating),
      supervisorComments,
      finalRecommendation,
      submittedAt: new Date().toISOString(),
      submittedByToken: evalToken.id,
      requiresAcknowledgment: true,
    });

    // Mark token as used
    await EvaluationToken.markUsed(evalToken.id);

    // Update placement evaluation status
    await InternshipPlacement.update(placement.id, {
      evaluationStatus: 'submitted',
      evaluationSubmittedAt: new Date().toISOString(),
    });

    // Notify the student
    const { createNotification } = require('../services/notificationService');
    await createNotification({
      userId: placement.studentId,
      type: 'evaluation',
      title: 'Supervisor Evaluation Submitted',
      message: `Your supervisor at ${placement.organizationName} has submitted the midterm evaluation. Please review it on your dashboard.`,
      relatedId: evaluation.id,
    });

    res.status(201).json({
      message: 'Evaluation submitted successfully. Thank you for your feedback!',
      evaluation: {
        id: evaluation.id,
        submittedAt: evaluation.submittedAt,
      },
    });
  } catch (error) {
    console.error('Error submitting evaluation:', error);
    res.status(500).json({ message: 'Failed to submit evaluation', error: error.message });
  }
}

module.exports = { getEvaluationForm, submitEvaluation };
