const { supabase } = require('./supabase');
const { mapKeyToSupabase } = require('./utils');

function mapReportFromSupabase(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    internshipId: row.internship_id,
    title: row.title,
    description: row.description,
    reportType: row.report_type,
    submissionDeadline: row.submission_deadline,
    submittedAt: row.submitted_at,
    submissionUrl: row.submission_url,
    status: row.status,
    feedback: row.feedback,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    feedbackViewedAt: row.feedback_viewed_at,
    feedbackViewedBy: row.feedback_viewed_by,
    feedbackAcknowledgedAt: row.feedback_acknowledged_at,
    feedbackAcknowledgedBy: row.feedback_acknowledged_by,
    requiresFeedbackAcknowledgment: row.requires_feedback_acknowledgment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    toJSON() { return { ...this }; },
  };
}

function mapReportToSupabase(report) {
  const mapped = {};
  if (report.studentId !== undefined) mapped.student_id = report.studentId;
  if (report.internshipId !== undefined) mapped.internship_id = report.internshipId;
  if (report.title !== undefined) mapped.title = report.title;
  if (report.description !== undefined) mapped.description = report.description;
  if (report.reportType !== undefined) mapped.report_type = report.reportType;
  if (report.submissionDeadline !== undefined) mapped.submission_deadline = report.submissionDeadline;
  if (report.submittedAt !== undefined) mapped.submitted_at = report.submittedAt;
  if (report.submissionUrl !== undefined) mapped.submission_url = report.submissionUrl;
  if (report.status !== undefined) mapped.status = report.status;
  if (report.feedback !== undefined) mapped.feedback = report.feedback;
  if (report.reviewedBy !== undefined) mapped.reviewed_by = report.reviewedBy;
  if (report.reviewedAt !== undefined) mapped.reviewed_at = report.reviewedAt;
  if (report.feedbackViewedAt !== undefined) mapped.feedback_viewed_at = report.feedbackViewedAt;
  if (report.feedbackViewedBy !== undefined) mapped.feedback_viewed_by = report.feedbackViewedBy;
  if (report.feedbackAcknowledgedAt !== undefined) mapped.feedback_acknowledged_at = report.feedbackAcknowledgedAt;
  if (report.feedbackAcknowledgedBy !== undefined) mapped.feedback_acknowledged_by = report.feedbackAcknowledgedBy;
  if (report.requiresFeedbackAcknowledgment !== undefined) mapped.requires_feedback_acknowledgment = report.requiresFeedbackAcknowledgment;
  return mapped;
}

const Report = {
  async findOne(options = {}) {
    let query = supabase.from('reports').select('*');
    const where = options.where || options;
    if (where && Object.keys(where).length > 0) {
      Object.entries(where).forEach(([key, value]) => {
        query = query.eq(mapKeyToSupabase(key), value);
      });
    }
    
    const { data, error } = await query.maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapReportFromSupabase(data) : null;
  },

  async findAll(options = {}) {
    let query = supabase.from('reports').select('*');
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        query = query.eq(mapKeyToSupabase(key), value);
      });
    }
    if (options.order) {
      const [field, direction] = options.order[0];
      query = query.order(mapKeyToSupabase(field), { ascending: direction === 'ASC' });
    }
    const { data, error } = await query;
    if (error) throw error;
    return data ? data.map(mapReportFromSupabase) : [];
  },

  async create(reportData) {
    const { v4: uuidv4 } = require('uuid');
    const insertData = mapReportToSupabase(reportData);
    if (!insertData.id) {
         insertData.id = reportData.id || uuidv4();
    }
    
    const { data, error } = await supabase
      .from('reports')
      .insert(insertData)
      .select()
      .single();
    if (error) throw error;
    return mapReportFromSupabase(data);
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('reports')
      .update(mapReportToSupabase(updates))
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ? mapReportFromSupabase(data) : null;
  },
};

module.exports = Report;
