const { supabase } = require('./supabase');
const { mapKeyToSupabase } = require('./utils');

function mapEmailLogFromSupabase(row) {
  return {
    id: row.id,
    placementId: row.placement_id,
    studentId: row.student_id,
    recipientEmail: row.recipient_email,
    subject: row.subject,
    sentDate: row.sent_date,
    deliveryStatus: row.delivery_status,
    tokenId: row.token_id,
    attachments: row.attachments,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    toJSON() { return { ...this }; },
  };
}

const EmailLog = {
  async create(logData) {
    const { v4: uuidv4 } = require('uuid');
    const { data, error } = await supabase
      .from('email_logs')
      .insert({
        id: logData.id || uuidv4(),
        placement_id: logData.placementId,
        student_id: logData.studentId,
        recipient_email: logData.recipientEmail,
        subject: logData.subject,
        delivery_status: logData.deliveryStatus || 'sent',
        token_id: logData.tokenId,
        attachments: logData.attachments,
        error_message: logData.errorMessage,
      })
      .select()
      .single();
    if (error) throw error;
    return mapEmailLogFromSupabase(data);
  },

  async findAll(options = {}) {
    let query = supabase.from('email_logs').select('*');
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        const mappedKey = mapKeyToSupabase(key);
        query = query.eq(mappedKey, value);
      });
    }
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    return data ? data.map(mapEmailLogFromSupabase) : [];
  },

  async findByPlacement(placementId) {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('placement_id', placementId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ? data.map(mapEmailLogFromSupabase) : [];
  },
};

module.exports = EmailLog;
