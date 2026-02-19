const { supabase } = require('../models');
const crypto = require('crypto');

/**
 * Log user activity for audit trail
 */
async function logActivity({
  userId,
  actionType,
  resourceType,
  resourceId,
  description,
  ipAddress,
  userAgent,
  metadata = {},
}) {
  try {
    const { data, error } = await supabase.rpc('log_activity', {
      p_user_id: userId,
      p_action_type: actionType,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_description: description,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
      p_metadata: metadata,
    });

    if (error) {
      console.error('Error logging activity:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error logging activity:', error);
    return null;
  }
}

/**
 * Get activity logs for a user
 */
async function getUserActivityLogs(userId, options = {}) {
  try {
    let query = supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.actionType) {
      query = query.eq('action_type', options.actionType);
    }

    if (options.resourceType) {
      query = query.eq('resource_type', options.resourceType);
    }

    if (options.startDate) {
      query = query.gte('created_at', options.startDate);
    }

    if (options.endDate) {
      query = query.lte('created_at', options.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    throw error;
  }
}

/**
 * Get activity logs for a resource
 */
async function getResourceActivityLogs(resourceType, resourceId) {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching resource activity logs:', error);
    throw error;
  }
}

/**
 * Get all activity logs (admin only)
 */
async function getAllActivityLogs(options = {}) {
  try {
    let query = supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.userId) {
      query = query.eq('user_id', options.userId);
    }

    if (options.actionType) {
      query = query.eq('action_type', options.actionType);
    }

    if (options.startDate) {
      query = query.gte('created_at', options.startDate);
    }

    if (options.endDate) {
      query = query.lte('created_at', options.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching all activity logs:', error);
    throw error;
  }
}

module.exports = {
  logActivity,
  getUserActivityLogs,
  getResourceActivityLogs,
  getAllActivityLogs,
};


