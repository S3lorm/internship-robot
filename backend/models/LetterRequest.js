const { supabase } = require('./supabase');
const { mapKeyToSupabase } = require('./utils');
const User = require('./User'); // Pre-imported for includes

function mapLetterRequestFromSupabase(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    requestType: row.request_type || 'general',
    companyName: row.company_name,
    companyEmail: row.company_email,
    companyPhone: row.company_phone,
    companyAddress: row.company_address,
    internshipDuration: row.internship_duration,
    internshipStartDate: row.internship_start_date,
    internshipEndDate: row.internship_end_date,
    purpose: row.purpose,
    category: row.category,
    additionalNotes: row.additional_notes,
    contactInfo: row.contact_info,
    status: row.status,
    adminNotes: row.admin_notes,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    referenceNumber: row.reference_number,
    verificationCode: row.verification_code,
    pdfUrl: row.pdf_url,
    pdfGeneratedAt: row.pdf_generated_at,
    emailSent: row.email_sent,
    emailSentAt: row.email_sent_at,
    downloadCount: row.download_count,
    lastDownloadedAt: row.last_downloaded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    toJSON() {
      return { ...this };
    },
    async save() {
      return LetterRequest.update(this.id, this);
    },
    async destroy() {
      return LetterRequest.destroy(this.id);
    },
  };
}

function mapLetterRequestToSupabase(request) {
  const mapped = {};
  if (request.studentId !== undefined) mapped.student_id = request.studentId;
  if (request.requestType !== undefined) mapped.request_type = request.requestType;
  if (request.companyName !== undefined) mapped.company_name = request.companyName;
  if (request.companyEmail !== undefined) mapped.company_email = request.companyEmail;
  if (request.companyPhone !== undefined) mapped.company_phone = request.companyPhone;
  if (request.companyAddress !== undefined) mapped.company_address = request.companyAddress;
  if (request.internshipDuration !== undefined) mapped.internship_duration = request.internshipDuration;
  if (request.internshipStartDate !== undefined) mapped.internship_start_date = request.internshipStartDate;
  if (request.internshipEndDate !== undefined) mapped.internship_end_date = request.internshipEndDate;
  if (request.purpose !== undefined) mapped.purpose = request.purpose;
  if (request.category !== undefined) mapped.category = request.category;
  if (request.additionalNotes !== undefined) mapped.additional_notes = request.additionalNotes;
  if (request.contactInfo !== undefined) mapped.contact_info = request.contactInfo;
  if (request.status !== undefined) mapped.status = request.status;
  if (request.adminNotes !== undefined) mapped.admin_notes = request.adminNotes;
  if (request.reviewedBy !== undefined) mapped.reviewed_by = request.reviewedBy;
  if (request.reviewedAt !== undefined) mapped.reviewed_at = request.reviewedAt;
  if (request.referenceNumber !== undefined) mapped.reference_number = request.referenceNumber;
  if (request.verificationCode !== undefined) mapped.verification_code = request.verificationCode;
  if (request.pdfUrl !== undefined) mapped.pdf_url = request.pdfUrl;
  if (request.pdfGeneratedAt !== undefined) mapped.pdf_generated_at = request.pdfGeneratedAt;
  if (request.emailSent !== undefined) mapped.email_sent = request.emailSent;
  if (request.emailSentAt !== undefined) mapped.email_sent_at = request.emailSentAt;
  if (request.downloadCount !== undefined) mapped.download_count = request.downloadCount;
  if (request.lastDownloadedAt !== undefined) mapped.last_downloaded_at = request.lastDownloadedAt;
  return mapped;
}

const LetterRequest = {
  async findOne(options = {}) {
    let query = supabase.from('letter_requests').select('*');

    const where = options.where || options;
    if (where && Object.keys(where).length > 0) {
      Object.entries(where).forEach(([key, value]) => {
        query = query.eq(mapKeyToSupabase(key), value);
      });
    }

    const { data, error } = await query.maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data ? mapLetterRequestFromSupabase(data) : null;
  },

  async findAll(options = {}) {
    let query = supabase.from('letter_requests').select('*');

    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        const mappedKey = mapKeyToSupabase(key);
        query = query.eq(mappedKey, value);
      });
    }

    if (options.order) {
      const [field, direction] = options.order[0];
      const mappedField = mapKeyToSupabase(field);
      query = query.order(mappedField, { ascending: direction === 'ASC' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data ? data.map(mapLetterRequestFromSupabase) : [];
  },

  async findAndCountAll(options = {}) {
    let query = supabase.from('letter_requests').select('*', { count: 'exact' });

    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        const mappedKey = mapKeyToSupabase(key);
        query = query.eq(mappedKey, value);
      });
    }

    if (options.order) {
      const [field, direction] = options.order[0];
      const mappedField = mapKeyToSupabase(field);
      query = query.order(mappedField, { ascending: direction === 'ASC' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return { rows: data ? data.map(mapLetterRequestFromSupabase) : [], count: count || (data ? data.length : 0) };
  },

  async findByPk(id, options = {}) {
    const data = await this.findOne({ id });
    if (!data) return null;

    // Handle includes for relation resolving
    if (options.include) {
      for (const include of options.include) {
        if (include.model === User || include.model.name === 'User') {
          if (include.as === 'student') {
            const student = await User.findOne({ where: { id: data.studentId } });
            if (student) data.student = student;
          }
          if (include.as === 'reviewer' && data.reviewedBy) {
            const reviewer = await User.findOne({ where: { id: data.reviewedBy } });
            if (reviewer) data.reviewer = reviewer;
          }
        }
      }
    }

    return data;
  },

  async create(requestData) {
    const { v4: uuidv4 } = require('uuid');

    // Pre-generate reference_number and verification_code in JS
    const now = new Date();
    const datePart = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    const pattern = `LR-${datePart}-%`;

    const { data: existingRefs } = await supabase
      .from('letter_requests')
      .select('reference_number')
      .like('reference_number', pattern);

    let seqNum = 1;
    if (existingRefs && existingRefs.length > 0) {
      const nums = existingRefs
        .map(r => {
          const match = r.reference_number?.match(/(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => !isNaN(n));
      seqNum = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
    }

    const referenceNumber = `LR-${datePart}-${String(seqNum).padStart(5, '0')}`;

    let verificationCode;
    let isUnique = false;
    while (!isUnique) {
      verificationCode = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
      const { data: existing } = await supabase
        .from('letter_requests')
        .select('id')
        .eq('verification_code', verificationCode)
        .maybeSingle();
      isUnique = !existing;
    }

    const requestWithId = {
      ...requestData,
      id: requestData.id || uuidv4(),
      referenceNumber,
      verificationCode,
    };

    const mappedData = mapLetterRequestToSupabase(requestWithId);

    const { data, error } = await supabase
      .from('letter_requests')
      .insert(mappedData)
      .select()
      .single();

    if (error) throw error;

    return mapLetterRequestFromSupabase(data);
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('letter_requests')
      .update(mapLetterRequestToSupabase(updates))
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;

    return data ? mapLetterRequestFromSupabase(data) : null;
  },

  async destroy(id) {
    const { error } = await supabase
      .from('letter_requests')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },
};

module.exports = LetterRequest;
