// Supabase database models/helpers
// This replaces the Sequelize models

const supabase = require('../config/supabase');

// User model helpers
const User = {
  async findOne(where) {
    let query = supabase.from('user_profiles').select('*');

    if (where.email) {
      query = query.eq('email', where.email);
    }
    if (where.id) {
      query = query.eq('id', where.id);
    }
    if (where.emailVerificationToken) {
      query = query.eq('email_verification_token', where.emailVerificationToken);
    }
    if (where.passwordResetToken) {
      query = query.eq('password_reset_token', where.passwordResetToken);
    }
    if (where.studentId) {
      query = query.eq('student_id', where.studentId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }

    return data ? mapUserFromSupabase(data) : null;
  },

  async findAll(options = {}) {
    let query = supabase.from('user_profiles').select('*');

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
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map(mapUserFromSupabase);
  },

  async findAndCountAll(options = {}) {
    let query = supabase.from('user_profiles').select('*', { count: 'exact' });

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
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const rows = data.map(mapUserFromSupabase);
    return { rows, count: count || rows.length };
  },

  async count(options = {}) {
    let query = supabase.from('user_profiles').select('*', { count: 'exact', head: true });

    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        const mappedKey = mapKeyToSupabase(key);
        query = query.eq(mappedKey, value);
      });
    }

    const { count, error } = await query;

    if (error) throw error;

    return count || 0;
  },

  async create(userData) {
    // Generate UUID if not provided (for Express backend)
    const { v4: uuidv4 } = require('uuid');
    const userWithId = {
      ...userData,
      id: userData.id || uuidv4(),
    };

    const { data, error } = await supabase
      .from('user_profiles')
      .insert(mapUserToSupabase(userWithId))
      .select()
      .single();

    if (error) throw error;

    return mapUserFromSupabase(data);
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(mapUserToSupabase(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return mapUserFromSupabase(data);
  },
};

// Helper functions to map between Sequelize format and Supabase format
function mapUserFromSupabase(row) {
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    firstName: row.first_name,
    lastName: row.last_name,
    studentId: row.student_id,
    phone: row.phone,
    role: row.role,
    department: row.department,
    program: row.program,
    yearOfStudy: row.year_of_study,
    avatar: row.avatar,
    bio: row.bio,
    skills: row.skills || [],
    isActive: row.is_active,
    isEmailVerified: row.is_email_verified,
    emailVerificationToken: row.email_verification_token,
    emailVerificationExpires: row.email_verification_expires,
    passwordResetToken: row.password_reset_token,
    passwordResetExpires: row.password_reset_expires,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Sequelize methods
    toJSON() {
      const json = { ...this };
      delete json.password;
      return json;
    },
    async save() {
      return User.update(this.id, this);
    },
  };
}

function mapUserToSupabase(user) {
  const mapped = {};
  if (user.email !== undefined) mapped.email = user.email;
  if (user.password !== undefined) mapped.password = user.password;
  if (user.firstName !== undefined) mapped.first_name = user.firstName;
  if (user.lastName !== undefined) mapped.last_name = user.lastName;
  if (user.studentId !== undefined) mapped.student_id = user.studentId;
  if (user.phone !== undefined) mapped.phone = user.phone;
  if (user.role !== undefined) mapped.role = user.role;
  if (user.department !== undefined) mapped.department = user.department;
  if (user.program !== undefined) mapped.program = user.program;
  if (user.yearOfStudy !== undefined) mapped.year_of_study = user.yearOfStudy;
  if (user.avatar !== undefined) mapped.avatar = user.avatar;
  if (user.bio !== undefined) mapped.bio = user.bio;
  if (user.skills !== undefined) mapped.skills = user.skills;
  if (user.isActive !== undefined) mapped.is_active = user.isActive;
  if (user.isEmailVerified !== undefined) mapped.is_email_verified = user.isEmailVerified;
  if (user.emailVerificationToken !== undefined) mapped.email_verification_token = user.emailVerificationToken;
  if (user.emailVerificationExpires !== undefined) mapped.email_verification_expires = user.emailVerificationExpires;
  if (user.passwordResetToken !== undefined) mapped.password_reset_token = user.passwordResetToken;
  if (user.passwordResetExpires !== undefined) mapped.password_reset_expires = user.passwordResetExpires;
  return mapped;
}

// Internship model helpers
const Internship = {
  async findByPk(id, options = {}) {
    const data = await this.findOne({ id });
    if (!data) return null;

    // Handle includes (joins) if needed
    if (options.include) {
      for (const include of options.include) {
        if (include.model === User && include.as === 'poster') {
          const user = await User.findOne({ id: data.postedBy });
          if (user) {
            data.poster = user;
          }
        }
      }
    }

    return data;
  },

  async findOne(where) {
    let query = supabase.from('internships').select('*');

    if (where.id) {
      query = query.eq('id', where.id);
    }
    if (where.postedBy) {
      query = query.eq('posted_by', where.postedBy);
    }
    if (where.status) {
      query = query.eq('status', where.status);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data ? mapInternshipFromSupabase(data) : null;
  },

  async findAndCountAll(options = {}) {
    const where = options.where || {};
    let query = supabase.from('internships').select('*', { count: 'exact' });

    // Apply where conditions
    Object.entries(where).forEach(([key, value]) => {
      const mappedKey = mapKeyToSupabase(key);
      if (value && typeof value === 'object' && value.in) {
        // Handle Op.in - value is { in: [...] }
        query = query.in(mappedKey, value.in);
      } else {
        query = query.eq(mappedKey, value);
      }
    });

    // Apply order
    if (options.order) {
      const [field, direction] = options.order[0];
      const mappedField = mapKeyToSupabase(field);
      query = query.order(mappedField, { ascending: direction === 'ASC' });
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    let rows = data.map(mapInternshipFromSupabase);

    // Handle includes
    if (options.include) {
      for (const include of options.include) {
        if (include.model === User && include.as === 'poster') {
          for (const row of rows) {
            const user = await User.findOne({ id: row.postedBy });
            if (user) {
              row.poster = user;
            }
          }
        }
      }
    }

    return { rows, count: count || rows.length };
  },

  async count(options = {}) {
    let query = supabase.from('internships').select('*', { count: 'exact', head: true });

    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        const mappedKey = mapKeyToSupabase(key);
        if (value && typeof value === 'object' && value.gte) {
          query = query.gte(mappedKey, value.gte);
        } else {
          query = query.eq(mappedKey, value);
        }
      });
    }

    const { count, error } = await query;

    if (error) throw error;

    return count || 0;
  },

  async findAll(options = {}) {
    let query = supabase.from('internships').select('*');

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
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map(mapInternshipFromSupabase);
  },

  async create(internshipData) {
    const { data, error } = await supabase
      .from('internships')
      .insert(mapInternshipToSupabase(internshipData))
      .select()
      .single();

    if (error) throw error;

    return mapInternshipFromSupabase(data);
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('internships')
      .update(mapInternshipToSupabase(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return mapInternshipFromSupabase(data);
  },

  async destroy(where) {
    let query = supabase.from('internships').delete();

    if (where.id) {
      query = query.eq('id', where.id);
    }

    const { error } = await query;

    if (error) throw error;

    return true;
  },

  // Sequelize compatibility method
  async destroy() {
    if (!this.id) throw new Error('Cannot destroy without id');
    const { error } = await supabase
      .from('internships')
      .delete()
      .eq('id', this.id);
    if (error) throw error;
    return true;
  },
};

// Application model helpers
const Application = {
  async findByPk(id, options = {}) {
    const data = await this.findOne({ id });
    if (!data) return null;

    // Handle includes
    if (options.include) {
      for (const include of options.include) {
        if (include.model === Internship) {
          const internship = await Internship.findOne({ id: data.internshipId });
          if (internship) data.internship = internship;
        }
        if (include.model === User) {
          if (include.as === 'student') {
            const student = await User.findOne({ id: data.studentId });
            if (student) data.student = student;
          }
          if (include.as === 'reviewer' && data.reviewedBy) {
            const reviewer = await User.findOne({ id: data.reviewedBy });
            if (reviewer) data.reviewer = reviewer;
          }
        }
      }
    }

    return data;
  },

  async findOne(where) {
    let query = supabase.from('applications').select('*');

    if (where.id) {
      query = query.eq('id', where.id);
    }
    if (where.studentId) {
      query = query.eq('student_id', where.studentId);
    }
    if (where.internshipId) {
      query = query.eq('internship_id', where.internshipId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data ? mapApplicationFromSupabase(data) : null;
  },

  async findAndCountAll(options = {}) {
    const where = options.where || {};
    let query = supabase.from('applications').select('*', { count: 'exact' });

    // Apply where conditions
    Object.entries(where).forEach(([key, value]) => {
      const mappedKey = mapKeyToSupabase(key);
      query = query.eq(mappedKey, value);
    });

    // Apply order
    if (options.order) {
      const [field, direction] = options.order[0];
      const mappedField = mapKeyToSupabase(field);
      query = query.order(mappedField, { ascending: direction === 'ASC' });
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    let rows = data.map(mapApplicationFromSupabase);

    // Handle includes
    if (options.include) {
      for (const include of options.include) {
        if (include.model === Internship) {
          for (const row of rows) {
            const internship = await Internship.findOne({ id: row.internshipId });
            if (internship) row.internship = internship;
          }
        }
        if (include.model === User) {
          if (include.as === 'student') {
            for (const row of rows) {
              const student = await User.findOne({ id: row.studentId });
              if (student) row.student = student;
            }
          }
          if (include.as === 'reviewer') {
            for (const row of rows) {
              if (row.reviewedBy) {
                const reviewer = await User.findOne({ id: row.reviewedBy });
                if (reviewer) row.reviewer = reviewer;
              }
            }
          }
        }
      }
    }

    return { rows, count: count || rows.length };
  },

  async findAll(options = {}) {
    let query = supabase.from('applications').select('*');

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
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map(mapApplicationFromSupabase);
  },

  async count(options = {}) {
    let query = supabase.from('applications').select('*', { count: 'exact', head: true });

    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        const mappedKey = mapKeyToSupabase(key);
        query = query.eq(mappedKey, value);
      });
    }

    const { count, error } = await query;

    if (error) throw error;

    return count || 0;
  },

  async create(applicationData) {
    const { data, error } = await supabase
      .from('applications')
      .insert(mapApplicationToSupabase(applicationData))
      .select()
      .single();

    if (error) throw error;

    return mapApplicationFromSupabase(data);
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('applications')
      .update(mapApplicationToSupabase(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return mapApplicationFromSupabase(data);
  },
};

// Notice model helpers
const Notice = {
  async findByPk(id, options = {}) {
    const data = await this.findOne({ id });
    if (!data) return null;

    // Handle includes
    if (options.include) {
      for (const include of options.include) {
        if (include.model === User && include.as === 'creator') {
          const user = await User.findOne({ id: data.createdBy });
          if (user) {
            data.creator = user;
          }
        }
      }
    }

    return data;
  },

  async findOne(where) {
    let query = supabase.from('notices').select('*');

    if (where.id) {
      query = query.eq('id', where.id);
    }
    if (where.createdBy) {
      query = query.eq('created_by', where.createdBy);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data ? mapNoticeFromSupabase(data) : null;
  },

  async findAndCountAll(options = {}) {
    const where = options.where || {};
    let query = supabase.from('notices').select('*', { count: 'exact' });

    // Apply where conditions
    Object.entries(where).forEach(([key, value]) => {
      const mappedKey = mapKeyToSupabase(key);
      if (value && typeof value === 'object' && value.in) {
        // Handle Op.in - value is { in: [...] }
        query = query.in(mappedKey, value.in);
      } else {
        query = query.eq(mappedKey, value);
      }
    });

    // Apply order
    if (options.order) {
      const [field, direction] = options.order[0];
      const mappedField = mapKeyToSupabase(field);
      query = query.order(mappedField, { ascending: direction === 'ASC' });
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    let rows = data.map(mapNoticeFromSupabase);

    // Handle includes
    if (options.include) {
      for (const include of options.include) {
        if (include.model === User && include.as === 'creator') {
          for (const row of rows) {
            const user = await User.findOne({ id: row.createdBy });
            if (user) {
              row.creator = user;
            }
          }
        }
      }
    }

    return { rows, count: count || rows.length };
  },

  async findAll(options = {}) {
    let query = supabase.from('notices').select('*');

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
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map(mapNoticeFromSupabase);
  },

  async count(options = {}) {
    let query = supabase.from('notices').select('*', { count: 'exact', head: true });

    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        const mappedKey = mapKeyToSupabase(key);
        query = query.eq(mappedKey, value);
      });
    }

    const { count, error } = await query;

    if (error) throw error;

    return count || 0;
  },

  async create(noticeData) {
    const { data, error } = await supabase
      .from('notices')
      .insert(mapNoticeToSupabase(noticeData))
      .select()
      .single();

    if (error) throw error;

    return mapNoticeFromSupabase(data);
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('notices')
      .update(mapNoticeToSupabase(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return mapNoticeFromSupabase(data);
  },

  async destroy(where) {
    let query = supabase.from('notices').delete();

    if (where.id) {
      query = query.eq('id', where.id);
    }

    const { error } = await query;

    if (error) throw error;

    return true;
  },
};

// Notification model helpers
const Notification = {
  async findOne(where) {
    let query = supabase.from('notifications').select('*');

    if (where.id) {
      query = query.eq('id', where.id);
    }
    if (where.userId) {
      query = query.eq('user_id', where.userId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data ? mapNotificationFromSupabase(data) : null;
  },

  async findAll(options = {}) {
    let query = supabase.from('notifications').select('*');

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
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map(mapNotificationFromSupabase);
  },

  async create(notificationData) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(mapNotificationToSupabase(notificationData))
      .select()
      .single();

    if (error) throw error;

    return mapNotificationFromSupabase(data);
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('notifications')
      .update(mapNotificationToSupabase(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return mapNotificationFromSupabase(data);
  },
};

// Helper function to map camelCase to snake_case
function mapKeyToSupabase(key) {
  const mapping = {
    studentId: 'student_id',
    internshipId: 'internship_id',
    coverLetter: 'cover_letter',
    cvUrl: 'cv_url',
    reviewedBy: 'reviewed_by',
    appliedAt: 'applied_at',
    reviewedAt: 'reviewed_at',
    postedBy: 'posted_by',
    postedAt: 'posted_at',
    targetAudience: 'target_audience',
    isActive: 'is_active',
    expiresAt: 'expires_at',
    createdBy: 'created_by',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    userId: 'user_id',
    isRead: 'is_read',
    relatedId: 'related_id',
    firstName: 'first_name',
    lastName: 'last_name',
    yearOfStudy: 'year_of_study',
    isEmailVerified: 'is_email_verified',
    emailVerificationToken: 'email_verification_token',
    emailVerificationExpires: 'email_verification_expires',
    passwordResetToken: 'password_reset_token',
    passwordResetExpires: 'password_reset_expires',
    actionRequired: 'action_required',
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
    actionUrl: 'action_url',
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

// Mapping functions
function mapInternshipFromSupabase(row) {
  const internship = {
    id: row.id,
    title: row.title,
    company: row.company,
    location: row.location,
    type: row.type,
    duration: row.duration,
    description: row.description,
    requirements: row.requirements || [],
    responsibilities: row.responsibilities || [],
    stipend: row.stipend,
    deadline: row.deadline,
    slots: row.slots,
    status: row.status,
    postedBy: row.posted_by,
    postedAt: row.posted_at,
    updatedAt: row.updated_at,
    toJSON() {
      return { ...this };
    },
    async save() {
      return Internship.update(this.id, this);
    },
    async destroy() {
      const { error } = await supabase
        .from('internships')
        .delete()
        .eq('id', this.id);
      if (error) throw error;
      return true;
    },
  };
  return internship;
}

function mapInternshipToSupabase(internship) {
  const mapped = {};
  if (internship.title !== undefined) mapped.title = internship.title;
  if (internship.company !== undefined) mapped.company = internship.company;
  if (internship.location !== undefined) mapped.location = internship.location;
  if (internship.type !== undefined) mapped.type = internship.type;
  if (internship.duration !== undefined) mapped.duration = internship.duration;
  if (internship.description !== undefined) mapped.description = internship.description;
  if (internship.requirements !== undefined) mapped.requirements = internship.requirements;
  if (internship.responsibilities !== undefined) mapped.responsibilities = internship.responsibilities;
  if (internship.stipend !== undefined) mapped.stipend = internship.stipend;
  if (internship.deadline !== undefined) mapped.deadline = internship.deadline;
  if (internship.slots !== undefined) mapped.slots = internship.slots;
  if (internship.status !== undefined) mapped.status = internship.status;
  if (internship.postedBy !== undefined) mapped.posted_by = internship.postedBy;
  if (internship.postedAt !== undefined) mapped.posted_at = internship.postedAt;
  return mapped;
}

function mapApplicationFromSupabase(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    internshipId: row.internship_id,
    coverLetter: row.cover_letter,
    cvUrl: row.cv_url,
    status: row.status,
    feedback: row.feedback,
    reviewedBy: row.reviewed_by,
    appliedAt: row.applied_at,
    reviewedAt: row.reviewed_at,
    toJSON() {
      return { ...this };
    },
    async save() {
      return Application.update(this.id, this);
    },
  };
}

function mapApplicationToSupabase(application) {
  const mapped = {};
  if (application.studentId !== undefined) mapped.student_id = application.studentId;
  if (application.internshipId !== undefined) mapped.internship_id = application.internshipId;
  if (application.coverLetter !== undefined) mapped.cover_letter = application.coverLetter;
  if (application.cvUrl !== undefined) mapped.cv_url = application.cvUrl;
  if (application.status !== undefined) mapped.status = application.status;
  if (application.feedback !== undefined) mapped.feedback = application.feedback;
  if (application.reviewedBy !== undefined) mapped.reviewed_by = application.reviewedBy;
  if (application.reviewedAt !== undefined) mapped.reviewed_at = application.reviewedAt;
  if (application.appliedAt !== undefined) mapped.applied_at = application.appliedAt;
  return mapped;
}

function mapNoticeFromSupabase(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    priority: row.priority,
    targetAudience: row.target_audience,
    isActive: row.is_active,
    expiresAt: row.expires_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    toJSON() {
      return { ...this };
    },
    async save() {
      return Notice.update(this.id, this);
    },
    async destroy() {
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', this.id);
      if (error) throw error;
      return true;
    },
  };
}

function mapNoticeToSupabase(notice) {
  const mapped = {};
  if (notice.title !== undefined) mapped.title = notice.title;
  if (notice.content !== undefined) mapped.content = notice.content;
  if (notice.priority !== undefined) mapped.priority = notice.priority;
  if (notice.targetAudience !== undefined) mapped.target_audience = notice.targetAudience;
  if (notice.isActive !== undefined) mapped.is_active = notice.isActive;
  if (notice.expiresAt !== undefined) mapped.expires_at = notice.expiresAt;
  if (notice.createdBy !== undefined) mapped.created_by = notice.createdBy;
  return mapped;
}

function mapNotificationFromSupabase(row) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    isRead: row.is_read,
    relatedId: row.related_id,
    link: row.link,
    priority: row.priority || 'medium',
    actionRequired: row.action_required || false,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    toJSON() {
      return { ...this };
    },
  };
}

function mapNotificationToSupabase(notification) {
  const mapped = {};
  if (notification.userId !== undefined) mapped.user_id = notification.userId;
  if (notification.type !== undefined) mapped.type = notification.type;
  if (notification.title !== undefined) mapped.title = notification.title;
  if (notification.message !== undefined) mapped.message = notification.message;
  if (notification.isRead !== undefined) mapped.is_read = notification.isRead;
  if (notification.relatedId !== undefined) mapped.related_id = notification.relatedId;
  if (notification.link !== undefined) mapped.link = notification.link;
  if (notification.priority !== undefined) mapped.priority = notification.priority;
  if (notification.actionRequired !== undefined) mapped.action_required = notification.actionRequired;
  if (notification.expiresAt !== undefined) mapped.expires_at = notification.expiresAt;
  if (notification.createdAt !== undefined) mapped.created_at = notification.createdAt;
  return mapped;
}

// Op replacement for Sequelize compatibility
const Op = {
  in: 'in',
  gte: 'gte',
};

// LetterRequest model helpers
const LetterRequest = {
  async findOne(where) {
    let query = supabase.from('letter_requests').select('*');

    if (where.id) {
      query = query.eq('id', where.id);
    }
    if (where.studentId) {
      query = query.eq('student_id', where.studentId);
    }
    if (where.status) {
      query = query.eq('status', where.status);
    }

    const { data, error } = await query.single();

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

    return data.map(mapLetterRequestFromSupabase);
  },

  async findByPk(id, options = {}) {
    const data = await this.findOne({ id });
    if (!data) return null;

    // Handle includes
    if (options.include) {
      for (const include of options.include) {
        if (include.model === User) {
          if (include.as === 'student') {
            const student = await User.findOne({ id: data.studentId });
            if (student) data.student = student;
          }
          if (include.as === 'reviewer' && data.reviewedBy) {
            const reviewer = await User.findOne({ id: data.reviewedBy });
            if (reviewer) data.reviewer = reviewer;
          }
        }
      }
    }

    return data;
  },

  async create(requestData) {
    const { v4: uuidv4 } = require('uuid');
    const requestWithId = {
      ...requestData,
      id: requestData.id || uuidv4(),
    };

    const { data, error } = await supabase
      .from('letter_requests')
      .insert(mapLetterRequestToSupabase(requestWithId))
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
      .single();

    if (error) throw error;

    return mapLetterRequestFromSupabase(data);
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

function mapLetterRequestFromSupabase(row) {
  return {
    id: row.id,
    studentId: row.student_id,
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

// Evaluation model helpers
const Evaluation = {
  async findOne(where) {
    let query = supabase.from('evaluations').select('*');
    if (where.id) query = query.eq('id', where.id);
    if (where.studentId) query = query.eq('student_id', where.studentId);
    const { data, error } = await query.single();
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
    return data.map(mapEvaluationFromSupabase);
  },
  async create(evalData) {
    const { v4: uuidv4 } = require('uuid');
    const { data, error } = await supabase
      .from('evaluations')
      .insert({ ...mapEvaluationToSupabase(evalData), id: evalData.id || uuidv4() })
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
      .single();
    if (error) throw error;
    return mapEvaluationFromSupabase(data);
  },
};

function mapEvaluationFromSupabase(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    internshipId: row.internship_id,
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
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    toJSON() { return { ...this }; },
  };
}

function mapEvaluationToSupabase(eval) {
  const mapped = {};
  if (eval.studentId !== undefined) mapped.student_id = eval.studentId;
  if (eval.internshipId !== undefined) mapped.internship_id = eval.internshipId;
  if (eval.title !== undefined) mapped.title = eval.title;
  if (eval.description !== undefined) mapped.description = eval.description;
  if (eval.evaluationType !== undefined) mapped.evaluation_type = eval.evaluationType;
  if (eval.isAvailable !== undefined) mapped.is_available = eval.isAvailable;
  if (eval.availableFrom !== undefined) mapped.available_from = eval.availableFrom;
  if (eval.deadline !== undefined) mapped.deadline = eval.deadline;
  if (eval.submissionUrl !== undefined) mapped.submission_url = eval.submissionUrl;
  if (eval.viewedAt !== undefined) mapped.viewed_at = eval.viewedAt;
  if (eval.viewedBy !== undefined) mapped.viewed_by = eval.viewedBy;
  if (eval.feedbackAcknowledgedAt !== undefined) mapped.feedback_acknowledged_at = eval.feedbackAcknowledgedAt;
  if (eval.feedbackAcknowledgedBy !== undefined) mapped.feedback_acknowledged_by = eval.feedbackAcknowledgedBy;
  if (eval.requiresAcknowledgment !== undefined) mapped.requires_acknowledgment = eval.requiresAcknowledgment;
  if (eval.acknowledgmentDeadline !== undefined) mapped.acknowledgment_deadline = eval.acknowledgmentDeadline;
  if (eval.createdBy !== undefined) mapped.created_by = eval.createdBy;
  return mapped;
}

// Logbook model helpers
const Logbook = {
  async findOne(where) {
    let query = supabase.from('logbooks').select('*');
    if (where.id) query = query.eq('id', where.id);
    if (where.studentId) query = query.eq('student_id', where.studentId);
    const { data, error } = await query.single();
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
    return data.map(mapLogbookFromSupabase);
  },
  async create(logbookData) {
    const { v4: uuidv4 } = require('uuid');
    const { data, error } = await supabase
      .from('logbooks')
      .insert({ ...mapLogbookToSupabase(logbookData), id: logbookData.id || uuidv4() })
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
      .single();
    if (error) throw error;
    return mapLogbookFromSupabase(data);
  },
};

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

// Report model helpers
const Report = {
  async findOne(where) {
    let query = supabase.from('reports').select('*');
    if (where.id) query = query.eq('id', where.id);
    if (where.studentId) query = query.eq('student_id', where.studentId);
    const { data, error } = await query.single();
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
    return data.map(mapReportFromSupabase);
  },
  async create(reportData) {
    const { v4: uuidv4 } = require('uuid');
    const { data, error } = await supabase
      .from('reports')
      .insert({ ...mapReportToSupabase(reportData), id: reportData.id || uuidv4() })
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
      .single();
    if (error) throw error;
    return mapReportFromSupabase(data);
  },
};

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

// AdministrativeAction model helpers
const AdministrativeAction = {
  async findOne(where) {
    let query = supabase.from('administrative_actions').select('*');
    if (where.id) query = query.eq('id', where.id);
    if (where.studentId) query = query.eq('student_id', where.studentId);
    const { data, error } = await query.single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapAdminActionFromSupabase(data) : null;
  },
  async findAll(options = {}) {
    let query = supabase.from('administrative_actions').select('*');
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
    return data.map(mapAdminActionFromSupabase);
  },
  async create(actionData) {
    const { v4: uuidv4 } = require('uuid');
    const { data, error } = await supabase
      .from('administrative_actions')
      .insert({ ...mapAdminActionToSupabase(actionData), id: actionData.id || uuidv4() })
      .select()
      .single();
    if (error) throw error;
    return mapAdminActionFromSupabase(data);
  },
  async update(id, updates) {
    const { data, error } = await supabase
      .from('administrative_actions')
      .update(mapAdminActionToSupabase(updates))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapAdminActionFromSupabase(data);
  },
};

function mapAdminActionFromSupabase(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    actionType: row.action_type,
    title: row.title,
    description: row.description,
    isRequired: row.is_required,
    isCompleted: row.is_completed,
    completedAt: row.completed_at,
    dueDate: row.due_date,
    actionUrl: row.action_url,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    toJSON() { return { ...this }; },
  };
}

function mapAdminActionToSupabase(action) {
  const mapped = {};
  if (action.studentId !== undefined) mapped.student_id = action.studentId;
  if (action.actionType !== undefined) mapped.action_type = action.actionType;
  if (action.title !== undefined) mapped.title = action.title;
  if (action.description !== undefined) mapped.description = action.description;
  if (action.isRequired !== undefined) mapped.is_required = action.isRequired;
  if (action.isCompleted !== undefined) mapped.is_completed = action.isCompleted;
  if (action.completedAt !== undefined) mapped.completed_at = action.completedAt;
  if (action.dueDate !== undefined) mapped.due_date = action.dueDate;
  if (action.actionUrl !== undefined) mapped.action_url = action.actionUrl;
  if (action.createdBy !== undefined) mapped.created_by = action.createdBy;
  return mapped;
}

module.exports = {
  User,
  Internship,
  Application,
  Notice,
  Notification,
  LetterRequest,
  Evaluation,
  Logbook,
  Report,
  AdministrativeAction,
  supabase, // Export supabase client for direct queries
  Op, // Export Op for compatibility
};

