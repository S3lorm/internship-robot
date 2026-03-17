const { supabase } = require('./supabase');
const { mapKeyToSupabase } = require('./utils');

// Mapping functions
function mapUserFromSupabase(row) {
  const user = {
    id: row.id,
    email: row.email,
    password: row.password,
    role: row.role,
    firstName: row.first_name,
    lastName: row.last_name,
    indexNumber: row.index_number,
    referenceNumber: row.reference_number,
    department: row.department,
    level: row.level,
    yearOfStudy: row.year_of_study,
    classOf: row.class_of,
    phone: row.phone,
    isActive: row.is_active !== undefined ? row.is_active : true,
    isEmailVerified: row.is_email_verified || false,
    emailVerificationToken: row.email_verification_token,
    emailVerificationExpires: row.email_verification_expires,
    passwordResetToken: row.password_reset_token,
    passwordResetExpires: row.password_reset_expires,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    toJSON() {
      const values = { ...this };
      delete values.password;
      return values;
    },
    async save() {
      // Create a plain object for updates, omitting methods
      const updateData = {};
      Object.keys(this).forEach((key) => {
        if (typeof this[key] !== 'function' && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
          updateData[key] = this[key];
        }
      });
      return User.update(this.id, updateData);
    },
  };
  return user;
}

function mapUserToSupabase(user) {
  const mapped = {};
  if (user.email !== undefined) mapped.email = user.email;
  if (user.password !== undefined) mapped.password = user.password;
  if (user.role !== undefined) mapped.role = user.role;
  if (user.firstName !== undefined) mapped.first_name = user.firstName;
  if (user.lastName !== undefined) mapped.last_name = user.lastName;
  if (user.indexNumber !== undefined) mapped.index_number = user.indexNumber;
  if (user.referenceNumber !== undefined) mapped.reference_number = user.referenceNumber;
  if (user.department !== undefined) mapped.department = user.department;
  if (user.level !== undefined) mapped.level = user.level;
  if (user.yearOfStudy !== undefined) mapped.year_of_study = user.yearOfStudy;
  if (user.classOf !== undefined) mapped.class_of = user.classOf;
  if (user.phone !== undefined) mapped.phone = user.phone;
  if (user.isActive !== undefined) mapped.is_active = user.isActive;
  if (user.isEmailVerified !== undefined) mapped.is_email_verified = user.isEmailVerified;
  if (user.emailVerificationToken !== undefined) mapped.email_verification_token = user.emailVerificationToken;
  if (user.emailVerificationExpires !== undefined) mapped.email_verification_expires = user.emailVerificationExpires;
  if (user.passwordResetToken !== undefined) mapped.password_reset_token = user.passwordResetToken;
  if (user.passwordResetExpires !== undefined) mapped.password_reset_expires = user.passwordResetExpires;
  return mapped;
}

// User object with Model-like methods
const User = {
  async findOne(options = {}) {
    let query = supabase.from('user_profiles').select('*');

    const where = options.where || options;
    if (where && Object.keys(where).length > 0) {
      Object.entries(where).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          console.warn(`Attempted to use IN operator for ${key}, which is not fully supported in this simple wrapper. Using the first value.`);
          query = query.eq(mapKeyToSupabase(key), value[0]);
        } else {
          query = query.eq(mapKeyToSupabase(key), value);
        }
      });
    }

    const { data, error } = await query.maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('User.findOne unexpected error:', error);
      throw error;
    }

    return data ? mapUserFromSupabase(data) : null;
  },

  async findByPk(id) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('User.findByPk error:', error);
      throw error; // Changed from null to throw for real errors
    }

    return data ? mapUserFromSupabase(data) : null; // explicitly return null when not found
  },

  async create(userData) {
    const { v4: uuidv4 } = require('uuid');

    const insertData = mapUserToSupabase(userData);
    if (!insertData.id) {
        insertData.id = uuidv4();
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .insert(insertData)
      .select()
      .maybeSingle();

    if (error) {
      console.error('User.create error:', error);
      throw error;
    }

    return data ? mapUserFromSupabase(data) : null;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(mapUserToSupabase(updates))
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('User.update error:', error);
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
       query = query.range(options.offset, options.offset + (options.limit || 10) -1 );
    }

    const { data, error } = await query;
    if (error) {
       throw error;
    }

    return data ? data.map(mapUserFromSupabase) : [];
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
        query = query.range(options.offset, options.offset + (options.limit || 10) -1 );
    }

    const { data, error, count } = await query;

    if (error) throw error;

    let rows = data ? data.map(mapUserFromSupabase) : [];
    
    return { rows, count: count || rows.length };
  }
};

module.exports = User;
