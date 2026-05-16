/**
 * Delete student accounts that never verified their email.
 * Related rows cascade via FK ON DELETE CASCADE where configured.
 *
 * Usage: node backend/scripts/purge-unverified-students.js
 *        node backend/scripts/purge-unverified-students.js --dry-run
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const supabase = require('../config/supabase');

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, email, first_name, last_name, student_id, created_at')
    .eq('role', 'student')
    .eq('is_email_verified', false);

  if (error) {
    console.error('Failed to list unverified students:', error.message);
    process.exit(1);
  }

  const rows = data || [];
  console.log(`Found ${rows.length} unverified student account(s).`);

  if (rows.length === 0) {
    console.log('Nothing to remove.');
    return;
  }

  for (const row of rows) {
    console.log(
      `  - ${row.email} (${row.first_name || ''} ${row.last_name || ''}, ${row.student_id || 'no id'})`
    );
  }

  if (dryRun) {
    console.log('\nDry run — no accounts deleted. Run without --dry-run to purge.');
    return;
  }

  const ids = rows.map((r) => r.id);
  const { error: delError } = await supabase.from('user_profiles').delete().in('id', ids);

  if (delError) {
    console.error('Delete failed:', delError.message);
    process.exit(1);
  }

  console.log(`\nRemoved ${ids.length} unverified student account(s) from the system.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
