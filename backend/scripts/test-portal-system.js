/**
 * Smoke test: internship portal control + HTTP API
 * Run: node scripts/test-portal-system.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const {
  getPortalStatusPayload,
  setPortalStatus,
  assertPortalOpenForStudentRequest,
  CLOSED_MESSAGE,
} = require('../services/internshipPortalService');

const API = process.env.API_URL || 'http://localhost:5000/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@rmu.edu.gh';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@2024';

async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login failed (${email}): ${data.message || res.status}`);
  return data.token;
}

async function api(method, path, token, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function run() {
  const results = [];
  const pass = (name, detail) => results.push({ name, ok: true, detail });
  const fail = (name, detail) => results.push({ name, ok: false, detail });

  // 1) Service layer + DB table
  try {
    const initial = await getPortalStatusPayload();
    if (!initial.status || typeof initial.isOpen !== 'boolean') {
      fail('DB: getPortalStatusPayload', 'Invalid payload shape');
    } else {
      pass('DB: getPortalStatusPayload', `status=${initial.status}`);
    }

    await setPortalStatus('closed', null);
    const closed = await getPortalStatusPayload();
    if (closed.status !== 'closed' || closed.isOpen) {
      fail('DB: setPortalStatus(closed)', JSON.stringify(closed));
    } else {
      pass('DB: setPortalStatus(closed)', 'ok');
    }

    let blocked = false;
    try {
      await assertPortalOpenForStudentRequest();
    } catch (e) {
      blocked = e.code === 'PORTAL_CLOSED' && e.message === CLOSED_MESSAGE;
    }
    if (!blocked) fail('DB: assertPortalOpen when closed', 'Should throw PORTAL_CLOSED');
    else pass('DB: assertPortalOpen when closed', 'blocked correctly');

    await setPortalStatus('open', null);
    await assertPortalOpenForStudentRequest();
    pass('DB: setPortalStatus(open)', 'ok');
  } catch (e) {
    fail('DB layer', e.message);
    if (/does not exist|42P01/i.test(e.message || '')) {
      fail('Migration', 'Run supabase/migrations/024_internship_portal_control.sql');
    }
  }

  // 2) HTTP API
  try {
    const noAuth = await api('GET', '/portal/status', null);
    if (noAuth.status !== 401) fail('API: unauthenticated', `expected 401, got ${noAuth.status}`);
    else pass('API: unauthenticated', '401 as expected');
  } catch (e) {
    fail('API: reach server', e.message);
  }

  try {
    const adminToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
    pass('API: admin login', ADMIN_EMAIL);

    const get1 = await api('GET', '/portal/status', adminToken);
    if (get1.status !== 200 || !get1.data?.data?.status) {
      fail('API: GET /portal/status', JSON.stringify(get1.data));
    } else pass('API: GET /portal/status', get1.data.data.status);

    const patchClose = await api('PATCH', '/portal/status', adminToken, { status: 'closed' });
    if (patchClose.status !== 200 || patchClose.data?.data?.isOpen !== false) {
      fail('API: PATCH close', JSON.stringify(patchClose.data));
    } else pass('API: PATCH close', 'portal closed');

    const patchOpen = await api('PATCH', '/portal/status', adminToken, { status: 'open' });
    if (patchOpen.status !== 200 || patchOpen.data?.data?.isOpen !== true) {
      fail('API: PATCH open', JSON.stringify(patchOpen.data));
    } else pass('API: PATCH open', 'portal open');

    // restore open for dev
    await setPortalStatus('open', null);
  } catch (e) {
    fail('API: admin flow', e.message);
  }

  console.log('\n=== Portal system smoke test ===\n');
  let failed = 0;
  for (const r of results) {
    const icon = r.ok ? 'PASS' : 'FAIL';
    console.log(`${icon}  ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
    if (!r.ok) failed += 1;
  }
  console.log(`\n${results.length - failed}/${results.length} passed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
