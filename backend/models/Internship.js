const { supabase } = require('./supabase');
const { mapKeyToSupabase } = require('./utils');

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

const Internship = {
  async findAndCountAll(options = {}) {
    let query = supabase.from('internships').select('*', { count: 'exact' });

    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        const mappedKey = mapKeyToSupabase(key);
        if (value && typeof value === 'object' && value[Symbol.for('Op.in')]) {
             query = query.in(mappedKey, value[Symbol.for('Op.in')]);
         } else {
             query = query.eq(mappedKey, value);
         }
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

    return {
      rows: data ? data.map(mapInternshipFromSupabase) : [],
      count: count || (data ? data.length : 0),
    };
  },

  async findAll(options = {}) {
    let query = supabase.from('internships').select('*');

    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        const mappedKey = mapKeyToSupabase(key);
         if (value && typeof value === 'object' && value[Symbol.for('Op.in')]) {
             query = query.in(mappedKey, value[Symbol.for('Op.in')]);
         } else {
             query = query.eq(mappedKey, value);
         }
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

    const { data, error } = await query;

    if (error) throw error;

    return data ? data.map(mapInternshipFromSupabase) : [];
  },

  async findByPk(id) {
    const { data, error } = await supabase
      .from('internships')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    return data ? mapInternshipFromSupabase(data) : null;
  },

  async create(internshipData) {
    const { v4: uuidv4 } = require('uuid');
    
    const insertData = mapInternshipToSupabase(internshipData);
    if(!insertData.id) {
        insertData.id = uuidv4();
    }
    
    const { data, error } = await supabase
      .from('internships')
      .insert(insertData)
      .select()
      .maybeSingle();

    if (error) throw error;

    return data ? mapInternshipFromSupabase(data) : null;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('internships')
      .update(mapInternshipToSupabase(updates))
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;

    return data ? mapInternshipFromSupabase(data) : null;
  },
};

module.exports = Internship;
