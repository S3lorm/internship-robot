const { supabase } = require('./supabase');
const { mapKeyToSupabase } = require('./utils');

function mapEvaluationFromSupabase(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    internshipId: row.internship_id,
    placementId: row.placement_id,
    title: row.title,
    description: row.description,
    evaluationType: row.evaluation_type,
    isAvailable: row.is_available,
    availableFrom: row.available_from,
    deadline: row.deadline,
    submissionUrl: row.submission_url,
    viewedAt: row.viewed_at,
    viewedBy: row.viewed_by,
    feedbackAcknowledgedAt: row.feedback_acknowledged_at,
    feedbackAcknowledgedBy: row.feedback_acknowledged_by,
    requiresAcknowledgment: row.requires_acknowledgment,
    acknowledgmentDeadline: row.acknowledgment_deadline,
    supervisorName: row.supervisor_name,
    supervisorPosition: row.supervisor_position,
    supervisorDepartment: row.supervisor_department,
    workEthicRating: row.work_ethic_rating,
    communicationRating: row.communication_rating,
    technicalSkillsRating: row.technical_skills_rating,
    teamworkRating: row.teamwork_rating,
    punctualityRating: row.punctuality_rating,
    problemSolvingRating: row.problem_solving_rating,
    supervisorComments: row.supervisor_comments,
    finalRecommendation: row.final_recommendation,
    submittedAt: row.submitted_at,
    submittedByToken: row.submitted_by_token,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    toJSON() { return { ...this }; },
  };
}

function mapEvaluationToSupabase(evalObj) {
  const mapped = {};
  if (evalObj.studentId !== undefined) mapped.student_id = evalObj.studentId;
  if (evalObj.internshipId !== undefined) mapped.internship_id = evalObj.internshipId;
  if (evalObj.placementId !== undefined) mapped.placement_id = evalObj.placementId;
  if (evalObj.title !== undefined) mapped.title = evalObj.title;
  if (evalObj.description !== undefined) mapped.description = evalObj.description;
  if (evalObj.evaluationType !== undefined) mapped.evaluation_type = evalObj.evaluationType;
  if (evalObj.isAvailable !== undefined) mapped.is_available = evalObj.isAvailable;
  if (evalObj.availableFrom !== undefined) mapped.available_from = evalObj.availableFrom;
  if (evalObj.deadline !== undefined) mapped.deadline = evalObj.deadline;
  if (evalObj.submissionUrl !== undefined) mapped.submission_url = evalObj.submissionUrl;
  if (evalObj.viewedAt !== undefined) mapped.viewed_at = evalObj.viewedAt;
  if (evalObj.viewedBy !== undefined) mapped.viewed_by = evalObj.viewedBy;
  if (evalObj.feedbackAcknowledgedAt !== undefined) mapped.feedback_acknowledged_at = evalObj.feedbackAcknowledgedAt;
  if (evalObj.feedbackAcknowledgedBy !== undefined) mapped.feedback_acknowledged_by = evalObj.feedbackAcknowledgedBy;
  if (evalObj.requiresAcknowledgment !== undefined) mapped.requires_acknowledgment = evalObj.requiresAcknowledgment;
  if (evalObj.acknowledgmentDeadline !== undefined) mapped.acknowledgment_deadline = evalObj.acknowledgmentDeadline;
  if (evalObj.supervisorName !== undefined) mapped.supervisor_name = evalObj.supervisorName;
  if (evalObj.supervisorPosition !== undefined) mapped.supervisor_position = evalObj.supervisorPosition;
  if (evalObj.supervisorDepartment !== undefined) mapped.supervisor_department = evalObj.supervisorDepartment;
  if (evalObj.workEthicRating !== undefined) mapped.work_ethic_rating = evalObj.workEthicRating;
  if (evalObj.communicationRating !== undefined) mapped.communication_rating = evalObj.communicationRating;
  if (evalObj.technicalSkillsRating !== undefined) mapped.technical_skills_rating = evalObj.technicalSkillsRating;
  if (evalObj.teamworkRating !== undefined) mapped.teamwork_rating = evalObj.teamworkRating;
  if (evalObj.punctualityRating !== undefined) mapped.punctuality_rating = evalObj.punctualityRating;
  if (evalObj.problemSolvingRating !== undefined) mapped.problem_solving_rating = evalObj.problemSolvingRating;
  if (evalObj.supervisorComments !== undefined) mapped.supervisor_comments = evalObj.supervisorComments;
  if (evalObj.finalRecommendation !== undefined) mapped.final_recommendation = evalObj.finalRecommendation;
  if (evalObj.submittedAt !== undefined) mapped.submitted_at = evalObj.submittedAt;
  if (evalObj.submittedByToken !== undefined) mapped.submitted_by_token = evalObj.submittedByToken;
  if (evalObj.createdBy !== undefined) mapped.created_by = evalObj.createdBy;
  return mapped;
}

const Evaluation = {
  async findOne(options = {}) {
    let query = supabase.from('evaluations').select('*');
    const where = options.where || options;
    if (where && Object.keys(where).length > 0) {
      Object.entries(where).forEach(([key, value]) => {
        query = query.eq(mapKeyToSupabase(key), value);
      });
    }
    const { data, error } = await query.maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    
    return data ? mapEvaluationFromSupabase(data) : null;
  },

  async findAll(options = {}) {
    let query = supabase.from('evaluations').select('*');
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
    
    return data ? data.map(mapEvaluationFromSupabase) : [];
  },

  async create(evalData) {
    const { v4: uuidv4 } = require('uuid');
    const insertData = mapEvaluationToSupabase(evalData);
    if (!insertData.id) {
        insertData.id = evalData.id || uuidv4();
    }
    
    const { data, error } = await supabase
      .from('evaluations')
      .insert(insertData)
      .select()
      .single();
      
    if (error) throw error;
    return mapEvaluationFromSupabase(data);
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('evaluations')
      .update(mapEvaluationToSupabase(updates))
      .eq('id', id)
      .select()
      .maybeSingle();
      
    if (error) throw error;
    return data ? mapEvaluationFromSupabase(data) : null;
  },
};

module.exports = Evaluation;
