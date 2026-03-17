const Op = {
  in: 'in',
  gte: 'gte',
};

// Helper function to map camelCase to snake_case
function mapKeyToSupabase(key) {
  const mapping = {
    // User / Student specific
    studentId: 'student_id',
    userId: 'user_id',
    firstName: 'first_name',
    lastName: 'last_name',
    yearOfStudy: 'year_of_study',
    isEmailVerified: 'is_email_verified',
    emailVerificationToken: 'email_verification_token',
    emailVerificationExpires: 'email_verification_expires',
    passwordResetToken: 'password_reset_token',
    passwordResetExpires: 'password_reset_expires',
    
    // Internship/Application specific
    internshipId: 'internship_id',
    coverLetter: 'cover_letter',
    cvUrl: 'cv_url',
    
    // Admin / Reviewing specific
    reviewedBy: 'reviewed_by',
    reviewedAt: 'reviewed_at',
    postedBy: 'posted_by',
    postedAt: 'posted_at',
    createdBy: 'created_by',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    // Notice/Notification specific
    targetAudience: 'target_audience',
    isActive: 'is_active',
    expiresAt: 'expires_at',
    isRead: 'is_read',
    relatedId: 'related_id',
    actionRequired: 'action_required',
    actionUrl: 'action_url',
    
    // Evaluation/Logbook/Report specific
    evaluationType: 'evaluation_type',
    availableFrom: 'available_from',
    submissionUrl: 'submission_url',
    submissionDeadline: 'submission_deadline',
    submittedAt: 'submitted_at',
    reportType: 'report_type',
    actionType: 'action_type',
    isRequired: 'is_required',
    isCompleted: 'is_completed',
    completedAt: 'completed_at',
    dueDate: 'due_date',
    
    // Timing / Views
    appliedAt: 'applied_at',
    viewedAt: 'viewed_at',
    viewedBy: 'viewed_by',
    feedbackAcknowledgedAt: 'feedback_acknowledged_at',
    feedbackAcknowledgedBy: 'feedback_acknowledged_by',
    requiresAcknowledgment: 'requires_acknowledgment',
    acknowledgmentDeadline: 'acknowledgment_deadline',
    feedbackViewedAt: 'feedback_viewed_at',
    feedbackViewedBy: 'feedback_viewed_by',
    requiresFeedbackAcknowledgment: 'requires_feedback_acknowledgment',
  };
  return mapping[key] || key;
}

module.exports = {
  Op,
  mapKeyToSupabase,
};
