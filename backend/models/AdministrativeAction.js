const { supabase } = require('./supabase');
const { mapKeyToSupabase } = require('./utils');

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

const AdministrativeAction = {
  async findOne(options = {}) {
    let query = supabase.from('administrative_actions').select('*');
    const where = options.where || options;
    if (where && Object.keys(where).length > 0) {
      Object.entries(where).forEach(([key, value]) => {
        query = query.eq(mapKeyToSupabase(key), value);
      });
    }
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
    return data ? data.map(mapAdminActionFromSupabase) : [];
  },

  async create(actionData) {
    const { v4: uuidv4 } = require('uuid');
    const insertData = mapAdminActionToSupabase(actionData);
    if (!insertData.id) {
        insertData.id = actionData.id || uuidv4();
    }
    
    const { data, error } = await supabase
      .from('administrative_actions')
      .insert(insertData)
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
      .maybeSingle();
    if (error) throw error;
    return data ? mapAdminActionFromSupabase(data) : null;
  },
};

module.exports = AdministrativeAction;
