const { supabase } = require('./supabase');
const { mapKeyToSupabase } = require('./utils');

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

const Application = {
  async findOne(options = {}) {
    let query = supabase.from('applications').select('*');

    const where = options.where || options;
    if (where && Object.keys(where).length > 0) {
      Object.entries(where).forEach(([key, value]) => {
        const mappedKey = mapKeyToSupabase(key);
        query = query.eq(mappedKey, value);
      });
    }

    const { data, error } = await query.maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    return data ? mapApplicationFromSupabase(data) : null;
  },

  async findAll(options = {}) {
    let query = supabase.from('applications').select('*, user_profiles!student_id(*), internships(*)');

    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        const mappedKey = mapKeyToSupabase(key);
        query = query.eq(mappedKey, value);
      });
    }

    // Always sort by applied_at desc by default unless specified
    if (options.order) {
        const [field, direction] = options.order[0];
        const mappedField = mapKeyToSupabase(field);
        query = query.order(mappedField, { ascending: direction === 'ASC' });
    } else {
        query = query.order('applied_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) throw error;

    return data ? data.map(row => {
      const app = mapApplicationFromSupabase(row);
      
      // Manual mapping of included models (User/Internship) to match Sequelize behavior
      if (row.user_profiles) {
         app.student = {
             id: row.user_profiles.id,
             firstName: row.user_profiles.first_name,
             lastName: row.user_profiles.last_name,
             email: row.user_profiles.email,
             department: row.user_profiles.department,
             level: row.user_profiles.level
         };
      }
      if (row.internships) {
          app.internship = {
              id: row.internships.id,
              title: row.internships.title,
              company: row.internships.company
          };
      }
      return app;
    }) : [];
  },

  async findAndCountAll(options = {}) {
    let query = supabase.from('applications').select('*, user_profiles!student_id(*), internships(*)', { count: 'exact' });

    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        const mappedKey = mapKeyToSupabase(key);
         if (value && typeof value === 'object' && value[Symbol.for('Op.in')]) {
             query = query.in(mappedKey, value[Symbol.for('Op.in')]);
         } else if (value && typeof value === 'object' && value[Symbol.for('Op.gte')]) {
             query = query.gte(mappedKey, value[Symbol.for('Op.gte')]);
         } else if (value && typeof value === 'object' && value.in !== undefined) {
             query = query.in(mappedKey, value.in);
         } else if (value && typeof value === 'object' && value.gte !== undefined) {
             query = query.gte(mappedKey, value.gte);
         } else {
             query = query.eq(mappedKey, value);
         }
      });
    }

    if (options.order) {
        const [field, direction] = options.order[0];
        const mappedField = mapKeyToSupabase(field);
        query = query.order(mappedField, { ascending: direction === 'ASC' });
    } else {
        query = query.order('applied_at', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, count, error } = await query;

    if (error) throw error;

    let rows = data ? data.map(row => {
      const app = mapApplicationFromSupabase(row);
      if (row.user_profiles) {
         app.student = {
             id: row.user_profiles.id,
             firstName: row.user_profiles.first_name,
             lastName: row.user_profiles.last_name,
             email: row.user_profiles.email,
             department: row.user_profiles.department,
             level: row.user_profiles.level
         };
      }
      if (row.internships) {
          app.internship = {
              id: row.internships.id,
              title: row.internships.title,
              company: row.internships.company
          };
      }
      return app;
    }) : [];

    return { rows, count: count || rows.length };
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
    const { v4: uuidv4 } = require('uuid');
    
    const insertData = mapApplicationToSupabase(applicationData);
    if (!insertData.id) {
        insertData.id = uuidv4();
    }
    
    const { data, error } = await supabase
      .from('applications')
      .insert(insertData)
      .select()
      .maybeSingle();

    if (error) throw error;

    return data ? mapApplicationFromSupabase(data) : null;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('applications')
      .update(mapApplicationToSupabase(updates))
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;

    return data ? mapApplicationFromSupabase(data) : null;
  },
};

module.exports = Application;
