const { supabase } = require('./supabase');
const { mapKeyToSupabase } = require('./utils');

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
    async save() {
      return Notification.update(this.id, this);
    },
    async destroy() {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', this.id);
      if (error) throw error;
      return true;
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

const Notification = {
  async findOne(options = {}) {
    let query = supabase.from('notifications').select('*');

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

    return data ? mapNotificationFromSupabase(data) : null;
  },

  async findAndCountAll(options = {}) {
    const where = options.where || {};
    let query = supabase.from('notifications').select('*', { count: 'exact' });

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

    let rows = data ? data.map(mapNotificationFromSupabase) : [];

    return { rows, count: count || rows.length };
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

    return data ? data.map(mapNotificationFromSupabase) : [];
  },

  async create(notificationData) {
    const { v4: uuidv4 } = require('uuid');
    
    const insertData = mapNotificationToSupabase(notificationData);
    if (!insertData.id) {
        insertData.id = uuidv4();
    }
    
    const { data, error } = await supabase
      .from('notifications')
      .insert(insertData)
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

module.exports = Notification;
