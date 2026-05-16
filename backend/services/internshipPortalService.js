const { supabase } = require('../models/supabase');

const PORTAL_ROW_ID = 1;
const CLOSED_MESSAGE =
  'Internship request portal is currently closed due to ongoing semester activities.';
const OPEN_MESSAGE = 'Internship request portal is currently open.';

async function getPortalControlRow() {
  const { data, error } = await supabase
    .from('internship_portal_control')
    .select('id, status, updated_at, updated_by')
    .eq('id', PORTAL_ROW_ID)
    .maybeSingle();

  if (error) {
    if (
      error.code === '42P01' ||
      error.code === 'PGRST205' ||
      /does not exist|schema cache/i.test(error.message || '')
    ) {
      const err = new Error(
        'internship_portal_control table is missing. Run supabase/migrations/024_internship_portal_control.sql in Supabase SQL Editor, then NOTIFY pgrst reload schema.'
      );
      err.statusCode = 503;
      err.code = 'PORTAL_TABLE_MISSING';
      throw err;
    }
    throw error;
  }

  if (!data) {
    const { data: inserted, error: insErr } = await supabase
      .from('internship_portal_control')
      .insert({ id: PORTAL_ROW_ID, status: 'open' })
      .select()
      .single();
    if (insErr) throw insErr;
    return inserted;
  }

  return data;
}

async function getPortalStatusPayload() {
  const row = await getPortalControlRow();
  const status = String(row.status || 'open').toLowerCase() === 'closed' ? 'closed' : 'open';
  return {
    status,
    isOpen: status === 'open',
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    closedMessage: CLOSED_MESSAGE,
    openMessage: OPEN_MESSAGE,
  };
}

function isPortalOpenFromPayload(payload) {
  return payload?.isOpen === true || payload?.status === 'open';
}

async function assertPortalOpenForStudentRequest() {
  const payload = await getPortalStatusPayload();
  if (!isPortalOpenFromPayload(payload)) {
    const err = new Error(CLOSED_MESSAGE);
    err.statusCode = 403;
    err.code = 'PORTAL_CLOSED';
    throw err;
  }
  return payload;
}

async function setPortalStatus(status, adminUserId) {
  const normalized = String(status || '').toLowerCase() === 'closed' ? 'closed' : 'open';
  const { data, error } = await supabase
    .from('internship_portal_control')
    .upsert(
      {
        id: PORTAL_ROW_ID,
        status: normalized,
        updated_at: new Date().toISOString(),
        updated_by: adminUserId || null,
      },
      { onConflict: 'id' }
    )
    .select()
    .single();

  if (error) {
    if (
      error.code === 'PGRST205' ||
      /schema cache|does not exist/i.test(error.message || '')
    ) {
      const err = new Error(
        'internship_portal_control table is missing. Run migration 024 in Supabase SQL Editor.'
      );
      err.statusCode = 503;
      err.code = 'PORTAL_TABLE_MISSING';
      throw err;
    }
    throw error;
  }
  return getPortalStatusPayload();
}

module.exports = {
  CLOSED_MESSAGE,
  OPEN_MESSAGE,
  getPortalStatusPayload,
  assertPortalOpenForStudentRequest,
  setPortalStatus,
};
