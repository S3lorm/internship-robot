const { supabase } = require('../models');
const { logActivity } = require('./activityLogService');

/**
 * Log security event
 */
async function logSecurityEvent({
  eventType,
  userId,
  severity,
  description,
  ipAddress,
  userAgent,
  resourceType,
  resourceId,
  metadata = {},
}) {
  try {
    const { data, error } = await supabase.rpc('log_security_event', {
      p_event_type: eventType,
      p_user_id: userId,
      p_severity: severity,
      p_description: description,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_metadata: metadata,
    });

    if (error) {
      console.error('Error logging security event:', error);
      return null;
    }

    // Also log as activity for audit trail
    await logActivity({
      userId: userId || 'system',
      actionType: 'system_event',
      resourceType: resourceType || 'system',
      resourceId: resourceId,
      description: `Security Event: ${description}`,
      ipAddress,
      userAgent,
      metadata: {
        eventType,
        severity,
        ...metadata,
      },
    });

    return data;
  } catch (error) {
    console.error('Error logging security event:', error);
    return null;
  }
}

/**
 * Get security events
 */
async function getSecurityEvents(options = {}) {
  try {
    let query = supabase
      .from('security_events')
      .select('*')
      .order('created_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.severity) {
      query = query.eq('severity', options.severity);
    }

    if (options.eventType) {
      query = query.eq('event_type', options.eventType);
    }

    if (options.resolved !== undefined) {
      query = query.eq('resolved', options.resolved);
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
    console.error('Error fetching security events:', error);
    throw error;
  }
}

/**
 * Resolve security event
 */
async function resolveSecurityEvent(eventId, resolvedBy) {
  try {
    const { data, error } = await supabase
      .from('security_events')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error resolving security event:', error);
    throw error;
  }
}

/**
 * Check for suspicious activity patterns
 */
async function checkSuspiciousActivity(userId, ipAddress, actionType) {
  try {
    // Check for multiple failed attempts
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('security_events')
      .select('*')
      .eq('event_type', 'failed_login')
      .or(`user_id.eq.${userId},ip_address.eq.${ipAddress}`)
      .gte('created_at', oneHourAgo);

    if (error) throw error;

    // If more than 5 failed attempts in last hour, flag as suspicious
    if (data && data.length >= 5) {
      await logSecurityEvent({
        eventType: 'suspicious_activity',
        userId,
        severity: 'high',
        description: `Multiple failed login attempts detected (${data.length} in last hour)`,
        ipAddress,
        metadata: {
          attemptCount: data.length,
          actionType,
        },
      });

      return {
        isSuspicious: true,
        reason: 'Multiple failed attempts',
        attemptCount: data.length,
      };
    }

    return {
      isSuspicious: false,
    };
  } catch (error) {
    console.error('Error checking suspicious activity:', error);
    return {
      isSuspicious: false,
      error: error.message,
    };
  }
}

module.exports = {
  logSecurityEvent,
  getSecurityEvents,
  resolveSecurityEvent,
  checkSuspiciousActivity,
};

