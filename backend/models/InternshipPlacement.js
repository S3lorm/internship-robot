const { supabase } = require('./supabase');
const { mapKeyToSupabase } = require('./utils');

function mapPlacementFromSupabase(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    generalRequestId: row.general_request_id,
    organizationName: row.organization_name,
    organizationAddress: row.organization_address,
    organizationEmail: row.organization_email,
    supervisorName: row.supervisor_name,
    supervisorPosition: row.supervisor_position,
    supervisorContact: row.supervisor_contact,
    internshipStartDate: row.internship_start_date,
    internshipEndDate: row.internship_end_date,
    departmentRole: row.department_role,
    status: row.status,
    adminNotes: row.admin_notes,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    officialLetterUrl: row.official_letter_url,
    officialLetterGeneratedAt: row.official_letter_generated_at,
    referenceNumber: row.reference_number,
    verificationCode: row.verification_code,
    evaluationStatus: row.evaluation_status || 'pending',
    evaluationSentAt: row.evaluation_sent_at,
    evaluationSubmittedAt: row.evaluation_submitted_at,
    midpointDate: row.midpoint_date,
    supervisorEmail: row.supervisor_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    toJSON() { return { ...this }; },
    async save() { return InternshipPlacement.update(this.id, this); },
    async destroy() { return InternshipPlacement.destroy(this.id); },
  };
}

function mapPlacementToSupabase(placement) {
  const mapped = {};
  if (placement.id !== undefined) mapped.id = placement.id;
  if (placement.studentId !== undefined) mapped.student_id = placement.studentId;
  if (placement.generalRequestId !== undefined) mapped.general_request_id = placement.generalRequestId;
  if (placement.organizationName !== undefined) mapped.organization_name = placement.organizationName;
  if (placement.organizationAddress !== undefined) mapped.organization_address = placement.organizationAddress;
  if (placement.organizationEmail !== undefined) mapped.organization_email = placement.organizationEmail;
  if (placement.supervisorName !== undefined) mapped.supervisor_name = placement.supervisorName;
  if (placement.supervisorPosition !== undefined) mapped.supervisor_position = placement.supervisorPosition;
  if (placement.supervisorContact !== undefined) mapped.supervisor_contact = placement.supervisorContact;
  if (placement.internshipStartDate !== undefined) mapped.internship_start_date = placement.internshipStartDate;
  if (placement.internshipEndDate !== undefined) mapped.internship_end_date = placement.internshipEndDate;
  if (placement.departmentRole !== undefined) mapped.department_role = placement.departmentRole;
  if (placement.status !== undefined) mapped.status = placement.status;
  if (placement.adminNotes !== undefined) mapped.admin_notes = placement.adminNotes;
  if (placement.reviewedBy !== undefined) mapped.reviewed_by = placement.reviewedBy;
  if (placement.reviewedAt !== undefined) mapped.reviewed_at = placement.reviewedAt;
  if (placement.officialLetterUrl !== undefined) mapped.official_letter_url = placement.officialLetterUrl;
  if (placement.officialLetterGeneratedAt !== undefined) mapped.official_letter_generated_at = placement.officialLetterGeneratedAt;
  if (placement.referenceNumber !== undefined) mapped.reference_number = placement.referenceNumber;
  if (placement.verificationCode !== undefined) mapped.verification_code = placement.verificationCode;
  if (placement.evaluationStatus !== undefined) mapped.evaluation_status = placement.evaluationStatus;
  if (placement.evaluationSentAt !== undefined) mapped.evaluation_sent_at = placement.evaluationSentAt;
  if (placement.evaluationSubmittedAt !== undefined) mapped.evaluation_submitted_at = placement.evaluationSubmittedAt;
  if (placement.midpointDate !== undefined) mapped.midpoint_date = placement.midpointDate;
  if (placement.supervisorEmail !== undefined) mapped.supervisor_email = placement.supervisorEmail;
  return mapped;
}

const InternshipPlacement = {
  async findOne(options = {}) {
    let query = supabase.from('internship_placements').select('*');
    const where = options.where || options;
    if (where && Object.keys(where).length > 0) {
      Object.entries(where).forEach(([key, value]) => {
        query = query.eq(mapKeyToSupabase(key), value);
      });
    }
    
    const { data, error } = await query.maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    
    return data ? mapPlacementFromSupabase(data) : null;
  },

  async findAll(options = {}) {
    let query = supabase.from('internship_placements').select('*');
    
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        const mappedKey = mapKeyToSupabase(key);
        query = query.eq(mappedKey, value);
      });
    }
    
    if (options.order) {
      const [field, direction] = options.order[0];
      query = query.order(mapKeyToSupabase(field), { ascending: direction === 'ASC' });
    } else {
      query = query.order('created_at', { ascending: false });
    }
    
    if (options.limit) query = query.limit(options.limit);
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data ? data.map(mapPlacementFromSupabase) : [];
  },

  async findByPk(id) {
    return this.findOne({ id });
  },

  async create(placementData) {
    const { v4: uuidv4 } = require('uuid');
    const insertData = mapPlacementToSupabase(placementData);
    if (!insertData.id) {
        insertData.id = uuidv4();
    }
    
    const { data, error } = await supabase
      .from('internship_placements')
      .insert(insertData)
      .select()
      .single();
      
    if (error) throw error;
    
    return mapPlacementFromSupabase(data);
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('internship_placements')
      .update(mapPlacementToSupabase(updates))
      .eq('id', id)
      .select()
      .maybeSingle();
      
    if (error) throw error;
    
    return data ? mapPlacementFromSupabase(data) : null;
  },

  async destroy(id) {
    const { error } = await supabase
      .from('internship_placements')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return true;
  },
};

module.exports = InternshipPlacement;
