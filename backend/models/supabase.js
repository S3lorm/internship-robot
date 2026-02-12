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

  async create(userData) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(mapUserToSupabase(userData))
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
};

// Application model helpers
const Application = {
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
  };
  return mapping[key] || key;
}

// Mapping functions
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
  };
  return mapping[key] || key;
}

function mapInternshipFromSupabase(row) {
  return {
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
  };
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
  if (notification.createdAt !== undefined) mapped.created_at = notification.createdAt;
  return mapped;
}

module.exports = {
  User,
  Internship,
  Application,
  Notice,
  Notification,
  supabase, // Export supabase client for direct queries
};

