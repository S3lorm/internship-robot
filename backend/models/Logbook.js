const { supabase } = require('./supabase');
const { mapKeyToSupabase } = require('./utils');

function mapLogbookFromSupabase(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    internshipId: row.internship_id,
    title: row.title,
    description: row.description,
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

function mapLogbookToSupabase(logbook) {
  const mapped = {};
  if (logbook.studentId !== undefined) mapped.student_id = logbook.studentId;
  if (logbook.internshipId !== undefined) mapped.internship_id = logbook.internshipId;
  if (logbook.title !== undefined) mapped.title = logbook.title;
  if (logbook.description !== undefined) mapped.description = logbook.description;
  if (logbook.submissionDeadline !== undefined) mapped.submission_deadline = logbook.submissionDeadline;
  if (logbook.submittedAt !== undefined) mapped.submitted_at = logbook.submittedAt;
  if (logbook.submissionUrl !== undefined) mapped.submission_url = logbook.submissionUrl;
  if (logbook.status !== undefined) mapped.status = logbook.status;
  if (logbook.feedback !== undefined) mapped.feedback = logbook.feedback;
  if (logbook.reviewedBy !== undefined) mapped.reviewed_by = logbook.reviewedBy;
  if (logbook.reviewedAt !== undefined) mapped.reviewed_at = logbook.reviewedAt;
  if (logbook.feedbackViewedAt !== undefined) mapped.feedback_viewed_at = logbook.feedbackViewedAt;
  if (logbook.feedbackViewedBy !== undefined) mapped.feedback_viewed_by = logbook.feedbackViewedBy;
  if (logbook.feedbackAcknowledgedAt !== undefined) mapped.feedback_acknowledged_at = logbook.feedbackAcknowledgedAt;
  if (logbook.feedbackAcknowledgedBy !== undefined) mapped.feedback_acknowledged_by = logbook.feedbackAcknowledgedBy;
  if (logbook.requiresFeedbackAcknowledgment !== undefined) mapped.requires_feedback_acknowledgment = logbook.requiresFeedbackAcknowledgment;
  return mapped;
}

const Logbook = {
  async findOne(options = {}) {
    let query = supabase.from('logbooks').select('*');
    const where = options.where || options;
    if (where && Object.keys(where).length > 0) {
      Object.entries(where).forEach(([key, value]) => {
        query = query.eq(mapKeyToSupabase(key), value);
      });
    }
    
    const { data, error } = await query.maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapLogbookFromSupabase(data) : null;
  },

  async findAll(options = {}) {
    let query = supabase.from('logbooks').select('*');
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
    return data ? data.map(mapLogbookFromSupabase): [];
  },

  async create(logbookData) {
    const { v4: uuidv4 } = require('uuid');
    const insertData = mapLogbookToSupabase(logbookData);
    if (!insertData.id) {
        insertData.id = logbookData.id || uuidv4();
    }

    const { data, error } = await supabase
      .from('logbooks')
      .insert(insertData)
      .select()
      .single();
    if (error) throw error;
    return mapLogbookFromSupabase(data);
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('logbooks')
      .update(mapLogbookToSupabase(updates))
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ? mapLogbookFromSupabase(data) : null;
  },
};

module.exports = Logbook;
