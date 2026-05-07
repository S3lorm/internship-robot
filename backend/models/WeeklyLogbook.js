const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('./supabase');

const EDITABLE_STATUSES = ['draft', 'ongoing', 'rejected'];
const FINAL_STATUSES = ['submitted_final', 'supervisor_reviewed', 'hod_approved'];

function mapLogbook(row) {
  if (!row) return null;
  return {
    id: row.id,
    studentId: row.student_id,
    placementId: row.placement_id,
    status: row.status,
    finalizedAt: row.finalized_at,
    supervisorReviewedAt: row.supervisor_reviewed_at,
    hodReviewedAt: row.hod_reviewed_at,
    hodReviewedBy: row.hod_reviewed_by,
    hodDecisionNote: row.hod_decision_note,
    archiveReference: row.archive_reference,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEntry(row) {
  if (!row) return null;
  return {
    id: row.id,
    logbookId: row.logbook_id,
    weekNumber: row.week_number,
    weekBeginning: row.week_beginning,
    weekEnding: row.week_ending,
    activities: Array.isArray(row.activities) ? row.activities : [],
    studentRemark: row.student_remark,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReview(row) {
  if (!row) return null;
  return {
    id: row.id,
    logbookId: row.logbook_id,
    supervisorFullName: row.supervisor_full_name,
    supervisorRemark: row.supervisor_remark,
    supervisorRecommendation: row.supervisor_recommendation,
    hodDecision: row.hod_decision,
    hodRemark: row.hod_remark,
    hodReviewedBy: row.hod_reviewed_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function tokenHash(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

async function getPlacement(placementId) {
  const { data, error } = await supabase
    .from('internship_placements')
    .select('*')
    .eq('id', placementId)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

async function getStudent(studentId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, email, student_id, department, program, level, phone')
    .eq('id', studentId)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    studentId: data.student_id,
    department: data.department,
    program: data.program,
    level: data.level,
    phone: data.phone,
  };
}

const WeeklyLogbook = {
  EDITABLE_STATUSES,
  FINAL_STATUSES,

  async findById(id) {
    const { data, error } = await supabase
      .from('weekly_logbooks')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return mapLogbook(data);
  },

  async findApprovedPlacementForStudent(studentId, placementId) {
    let query = supabase
      .from('internship_placements')
      .select('*')
      .eq('student_id', studentId)
      .eq('status', 'approved')
      .order('internship_end_date', { ascending: false })
      .limit(1);

    if (placementId) query = query.eq('id', placementId);

    const { data, error } = await query.maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async getOrCreateForPlacement(studentId, placementId) {
    const { data: existing, error: existingError } = await supabase
      .from('weekly_logbooks')
      .select('*')
      .eq('student_id', studentId)
      .eq('placement_id', placementId)
      .maybeSingle();
    if (existingError && existingError.code !== 'PGRST116') throw existingError;
    if (existing) return mapLogbook(existing);

    const { data, error } = await supabase
      .from('weekly_logbooks')
      .insert({
        id: uuidv4(),
        student_id: studentId,
        placement_id: placementId,
        status: 'ongoing',
      })
      .select()
      .single();
    if (error) throw error;
    return mapLogbook(data);
  },

  async listEntries(logbookId) {
    const { data, error } = await supabase
      .from('weekly_log_entries')
      .select('*')
      .eq('logbook_id', logbookId)
      .order('week_number', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapEntry);
  },

  async upsertEntry(logbook, payload) {
    if (!EDITABLE_STATUSES.includes(logbook.status)) {
      const err = new Error('This Weekly Log Sheet Book is locked.');
      err.status = 409;
      throw err;
    }

    const weekNumber = Number(payload.weekNumber);
    const activities = Array.isArray(payload.activities) ? payload.activities : [];
    if (!weekNumber || !payload.weekBeginning || !payload.weekEnding || activities.length === 0) {
      const err = new Error('Week number, week dates, and activities are required.');
      err.status = 400;
      throw err;
    }

    const cleanedActivities = activities
      .map((item) => ({
        day: String(item.day || '').trim(),
        date: String(item.date || '').trim(),
        activity: String(item.activity || '').trim(),
      }))
      .filter((item) => item.day || item.date || item.activity);

    if (cleanedActivities.length === 0) {
      const err = new Error('At least one activity row is required.');
      err.status = 400;
      throw err;
    }

    const row = {
      logbook_id: logbook.id,
      week_number: weekNumber,
      week_beginning: payload.weekBeginning,
      week_ending: payload.weekEnding,
      activities: cleanedActivities,
      student_remark: payload.studentRemark || null,
      updated_at: new Date().toISOString(),
    };

    const { data: existing, error: existingError } = await supabase
      .from('weekly_log_entries')
      .select('id')
      .eq('logbook_id', logbook.id)
      .eq('week_number', weekNumber)
      .maybeSingle();
    if (existingError && existingError.code !== 'PGRST116') throw existingError;

    const query = existing
      ? supabase.from('weekly_log_entries').update(row).eq('id', existing.id)
      : supabase.from('weekly_log_entries').insert({ id: uuidv4(), ...row });

    const { data, error } = await query.select().single();
    if (error) throw error;
    return mapEntry(data);
  },

  async finalize(logbook) {
    if (!EDITABLE_STATUSES.includes(logbook.status)) {
      const err = new Error('This Weekly Log Sheet Book has already been finalized.');
      err.status = 409;
      throw err;
    }

    const entries = await this.listEntries(logbook.id);
    if (entries.length === 0) {
      const err = new Error('At least one weekly entry is required before final submission.');
      err.status = 400;
      throw err;
    }

    const { data, error } = await supabase
      .from('weekly_logbooks')
      .update({
        status: 'submitted_final',
        finalized_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', logbook.id)
      .select()
      .single();
    if (error) throw error;
    return mapLogbook(data);
  },

  async createSupervisorToken(logbook) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('weekly_log_supervisor_tokens')
      .insert({
        id: uuidv4(),
        logbook_id: logbook.id,
        placement_id: logbook.placementId,
        student_id: logbook.studentId,
        token_hash: tokenHash(token),
        expires_at: expiresAt,
      })
      .select()
      .single();
    if (error) throw error;
    return { token, tokenRecord: data };
  },

  async findTokenBundle(rawToken) {
    const { data: token, error } = await supabase
      .from('weekly_log_supervisor_tokens')
      .select('*')
      .eq('token_hash', tokenHash(rawToken))
      .is('used_at', null)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    if (!token || new Date(token.expires_at) <= new Date()) return null;

    const logbook = await this.findById(token.logbook_id);
    if (!logbook || logbook.status !== 'submitted_final') return null;

    return this.bundle(logbook.id, { token });
  },

  async getReview(logbookId) {
    const { data, error } = await supabase
      .from('weekly_log_reviews')
      .select('*')
      .eq('logbook_id', logbookId)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return mapReview(data);
  },

  async submitSupervisorReview(bundle, payload, ipAddress) {
    const supervisorFullName = String(payload.supervisorFullName || '').trim();
    const supervisorRemark = String(payload.supervisorRemark || '').trim();
    const supervisorRecommendation = String(payload.supervisorRecommendation || '').trim();
    if (!supervisorFullName || !supervisorRemark) {
      const err = new Error('Supervisor name confirmation and remark are required.');
      err.status = 400;
      throw err;
    }

    const { data: review, error: reviewError } = await supabase
      .from('weekly_log_reviews')
      .insert({
        id: uuidv4(),
        logbook_id: bundle.logbook.id,
        supervisor_full_name: supervisorFullName,
        supervisor_remark: supervisorRemark,
        supervisor_recommendation: supervisorRecommendation || null,
        supervisor_ip: ipAddress || null,
      })
      .select()
      .single();
    if (reviewError) throw reviewError;

    const now = new Date().toISOString();
    const { error: tokenError } = await supabase
      .from('weekly_log_supervisor_tokens')
      .update({ used_at: now })
      .eq('id', bundle.token.id)
      .is('used_at', null);
    if (tokenError) throw tokenError;

    const { data: updatedLogbook, error: logbookError } = await supabase
      .from('weekly_logbooks')
      .update({
        status: 'supervisor_reviewed',
        supervisor_reviewed_at: now,
        updated_at: now,
      })
      .eq('id', bundle.logbook.id)
      .eq('status', 'submitted_final')
      .select()
      .single();
    if (logbookError) throw logbookError;
    return { logbook: mapLogbook(updatedLogbook), review: mapReview(review) };
  },

  async staffDecision(logbook, staffId, decision, remark) {
    if (!['approved', 'rejected'].includes(decision)) {
      const err = new Error('Invalid institutional decision.');
      err.status = 400;
      throw err;
    }
    if (logbook.status !== 'supervisor_reviewed') {
      const err = new Error('Only supervisor-reviewed logbooks can receive institutional approval.');
      err.status = 409;
      throw err;
    }

    const now = new Date().toISOString();
    const status = decision === 'approved' ? 'hod_approved' : 'rejected';

    const { error: reviewError } = await supabase
      .from('weekly_log_reviews')
      .update({
        hod_decision: decision,
        hod_remark: remark || null,
        hod_reviewed_by: staffId,
        updated_at: now,
      })
      .eq('logbook_id', logbook.id);
    if (reviewError) throw reviewError;

    const { data, error } = await supabase
      .from('weekly_logbooks')
      .update({
        status,
        hod_reviewed_at: now,
        hod_reviewed_by: staffId,
        hod_decision_note: remark || null,
        archive_reference: decision === 'approved' ? `WLB-${logbook.id.slice(0, 8).toUpperCase()}` : logbook.archiveReference,
        updated_at: now,
      })
      .eq('id', logbook.id)
      .select()
      .single();
    if (error) throw error;
    return mapLogbook(data);
  },

  async listForStaff(status) {
    let query = supabase
      .from('weekly_logbooks')
      .select('*')
      .order('updated_at', { ascending: false });
    if (status && status !== 'all') query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;

    const rows = [];
    for (const row of data || []) {
      rows.push(await this.bundle(row.id));
    }
    return rows;
  },

  async bundle(logbookId, extra = {}) {
    const logbook = await this.findById(logbookId);
    if (!logbook) return null;
    const [placement, student, entries, review] = await Promise.all([
      getPlacement(logbook.placementId),
      getStudent(logbook.studentId),
      this.listEntries(logbook.id),
      this.getReview(logbook.id),
    ]);
    return { logbook, placement, student, entries, review, ...extra };
  },

  async audit({ logbookId, actorId, actorRole, action, metadata = {}, ipAddress }) {
    const { error } = await supabase.from('weekly_log_audit_logs').insert({
      id: uuidv4(),
      logbook_id: logbookId,
      actor_id: actorId || null,
      actor_role: actorRole,
      action,
      metadata,
      ip_address: ipAddress || null,
    });
    if (error) console.error('Weekly logbook audit failed:', error.message || error);
  },
};

module.exports = WeeklyLogbook;
