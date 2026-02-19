const { supabase } = require('../models');
const { logActivity } = require('./activityLogService');

/**
 * Record document transmission
 */
async function recordDocumentTransmission({
  documentId,
  documentType,
  senderId,
  recipientType,
  recipientEmail,
  recipientName,
  transmissionMethod,
  metadata = {},
}) {
  try {
    const { data, error } = await supabase
      .from('document_transmissions')
      .insert({
        document_id: documentId,
        document_type: documentType,
        sender_id: senderId,
        recipient_type: recipientType,
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        transmission_method: transmissionMethod,
        status: 'pending',
        metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording document transmission:', error);
      return null;
    }

    // Log activity
    await logActivity({
      userId: senderId,
      actionType: 'document_transmit',
      resourceType: documentType,
      resourceId: documentId,
      description: `Document transmitted via ${transmissionMethod} to ${recipientEmail || recipientName}`,
      metadata: {
        transmissionId: data.id,
        recipientType,
        transmissionMethod,
      },
    });

    return data;
  } catch (error) {
    console.error('Error recording document transmission:', error);
    return null;
  }
}

/**
 * Update transmission status
 */
async function updateTransmissionStatus(transmissionId, status, metadata = {}) {
  try {
    const updateData = {
      status,
      ...metadata,
    };

    if (status === 'sent') {
      updateData.sent_at = new Date().toISOString();
    } else if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    } else if (status === 'opened') {
      updateData.opened_at = new Date().toISOString();
      updateData.open_count = supabase.raw('open_count + 1');
    }

    const { data, error } = await supabase
      .from('document_transmissions')
      .update(updateData)
      .eq('id', transmissionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating transmission status:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error updating transmission status:', error);
    return null;
  }
}

/**
 * Get document transmission history
 */
async function getDocumentTransmissions(documentType, documentId) {
  try {
    const { data, error } = await supabase
      .from('document_transmissions')
      .select('*')
      .eq('document_type', documentType)
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching document transmissions:', error);
    throw error;
  }
}

/**
 * Get user's transmission history
 */
async function getUserTransmissions(userId, options = {}) {
  try {
    let query = supabase
      .from('document_transmissions')
      .select('*')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.documentType) {
      query = query.eq('document_type', options.documentType);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user transmissions:', error);
    throw error;
  }
}

module.exports = {
  recordDocumentTransmission,
  updateTransmissionStatus,
  getDocumentTransmissions,
  getUserTransmissions,
};

