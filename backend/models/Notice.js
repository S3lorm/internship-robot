const { supabase } = require('./supabase');
const { mapKeyToSupabase } = require('./utils');

function mapNoticeFromSupabase(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    priority: row.priority,
    targetAudience: row.target_audience,
    isActive: row.is_active,
    isRead: row.isRead || false,
    expiresAt: row.expires_at,
    createdBy: row.created_by,
    publishDate: row.created_at,
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

const Notice = {
  async findOne(options = {}) {
    let query = supabase.from('notices').select('*');

    const where = options.where || options;
    if (where && Object.keys(where).length > 0) {
      Object.entries(where).forEach(([key, value]) => {
        const mappedKey = mapKeyToSupabase(key);
        query = query.eq(mappedKey, value);
      });
    }

    const { data, error } = await query.maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data ? mapNoticeFromSupabase(data) : null;
  },

  async findByPk(id) {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .eq('id', id)
      .maybeSingle();
      
    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapNoticeFromSupabase(data) : null;
  },

  async findAll(options = {}) {
    let query = supabase.from('notices').select('*');

    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        const mappedKey = mapKeyToSupabase(key);
         if (value && typeof value === 'object' && value[Symbol.for('Op.in')]) {
             query = query.in(mappedKey, value[Symbol.for('Op.in')]);
         } else if (value && typeof value === 'object' && value[Symbol.for('Op.gte')]) {
             query = query.gte(mappedKey, value[Symbol.for('Op.gte')]);
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

    return data ? data.map(mapNoticeFromSupabase) : [];
  },

  async create(noticeData) {
    const { v4: uuidv4 } = require('uuid');
    
    const insertData = mapNoticeToSupabase(noticeData);
    if (!insertData.id) {
        insertData.id = uuidv4();
    }
    
    const { data, error } = await supabase
      .from('notices')
      .insert(insertData)
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
};

module.exports = Notice;
