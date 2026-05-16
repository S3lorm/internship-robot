/**
 * Apply internship_portal_control table (prints SQL if DDL cannot run remotely).
 * Run: node scripts/setup-portal-control.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { supabase } = require('../models/supabase');

const MIGRATION_PATH = path.join(__dirname, '..', '..', 'supabase', 'migrations', '024_internship_portal_control.sql');

async function tableExists() {
  const { error } = await supabase.from('internship_portal_control').select('id').limit(1);
  if (!error) return true;
  if (error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message || '')) {
    return false;
  }
  throw error;
}

async function seedRow() {
  const { error } = await supabase
    .from('internship_portal_control')
    .upsert({ id: 1, status: 'open', updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (error) throw error;
}

async function main() {
  const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');

  if (await tableExists()) {
    await seedRow();
    console.log('✅ internship_portal_control table exists and default row is set (open).');
    return;
  }

  console.log('❌ Table public.internship_portal_control is missing.\n');
  console.log('Run this SQL in Supabase → SQL Editor → New query:\n');
  console.log('---');
  console.log(sql.trim());
  console.log('---\n');
  console.log('Then re-run: node scripts/setup-portal-control.js');
  console.log('Or: node scripts/test-portal-system.js');
  process.exit(1);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
