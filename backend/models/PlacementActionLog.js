const { supabase } = require('./supabase');

function mapFromRow(row) {
  return {
    id: row.id,
    placementId: row.placement_id,
    actorId: row.actor_id,
    actorRole: row.actor_role,
    action: row.action,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    notes: row.notes,
    organizationEmailSent: row.organization_email_sent,
    createdAt: row.created_at,
  };
}

function mapToRow(data) {
  const m = {};
  if (data.id !== undefined) m.id = data.id;
  if (data.placementId !== undefined) m.placement_id = data.placementId;
  if (data.actorId !== undefined) m.actor_id = data.actorId;
  if (data.actorRole !== undefined) m.actor_role = data.actorRole;
  if (data.action !== undefined) m.action = data.action;
  if (data.previousStatus !== undefined) m.previous_status = data.previousStatus;
  if (data.newStatus !== undefined) m.new_status = data.newStatus;
  if (data.notes !== undefined) m.notes = data.notes;
  if (data.organizationEmailSent !== undefined) m.organization_email_sent = data.organizationEmailSent;
  return m;
}

const PlacementActionLog = {
  async findByPlacementId(placementId) {
    const { data, error } = await supabase
      .from('placement_action_logs')
      .select('*')
      .eq('placement_id', placementId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapFromRow);
  },

  async create(row) {
    const { v4: uuidv4 } = require('uuid');
    const insert = mapToRow({ ...row, id: row.id || uuidv4() });

    const { data, error } = await supabase
      .from('placement_action_logs')
      .insert(insert)
      .select()
      .single();

    if (error) throw error;
    return mapFromRow(data);
  },
};

module.exports = PlacementActionLog;
