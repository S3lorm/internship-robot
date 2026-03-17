const { supabase } = require('./supabase');

function mapEvalTokenFromSupabase(row) {
  return {
    id: row.id,
    placementId: row.placement_id,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    usedAt: row.used_at,
    usedStatus: row.used_status,
    toJSON() { return { ...this }; },
  };
}

const EvaluationToken = {
  async create(tokenData) {
    const { v4: uuidv4 } = require('uuid');
    // Default expiry: 7 days from now
    const expiresAt = tokenData.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('evaluation_tokens')
      .insert({
        id: tokenData.id || uuidv4(),
        placement_id: tokenData.placementId,
        token_hash: tokenData.tokenHash,
        expires_at: expiresAt,
        used_status: tokenData.usedStatus || 'unused',
      })
      .select()
      .single();
    if (error) throw error;
    return mapEvalTokenFromSupabase(data);
  },

  async findByToken(tokenHash) {
    const { data, error } = await supabase
      .from('evaluation_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapEvalTokenFromSupabase(data) : null;
  },

  async findByPlacement(placementId) {
    const { data, error } = await supabase
      .from('evaluation_tokens')
      .select('*')
      .eq('placement_id', placementId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ? data.map(mapEvalTokenFromSupabase) : [];
  },

  async markUsed(id) {
    const { data, error } = await supabase
      .from('evaluation_tokens')
      .update({ used_status: 'used', used_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapEvalTokenFromSupabase(data);
  },
};

module.exports = EvaluationToken;
