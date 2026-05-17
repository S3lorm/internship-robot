/**
 * Deep-delete one user and related database records.
 *
 * Dry run:
 *   node scripts/delete-user-deep.js --email student@example.com
 *   node scripts/delete-user-deep.js --student-id BCE12345
 *   node scripts/delete-user-deep.js --id 00000000-0000-0000-0000-000000000000
 *
 * Delete:
 *   node scripts/delete-user-deep.js --email student@example.com --confirm-delete
 */
require('dotenv').config();
const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

function currentArgs() {
  return process.argv.slice(2);
}

function argValue(name) {
  const args = currentArgs();
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  return args[idx + 1] || null;
}

function hasFlag(name) {
  return currentArgs().includes(name);
}

function usage() {
  console.log(`
Usage:
  node scripts/delete-user-deep.js
  node scripts/delete-user-deep.js --email <email> [--confirm-delete]
  node scripts/delete-user-deep.js --student-id <studentId> [--confirm-delete]
  node scripts/delete-user-deep.js --id <uuid> [--confirm-delete]

Options:
  No arguments       Open the interactive IT user management menu.
  --confirm-delete   Actually delete records. Without this flag, the script only previews.

Examples:
  node scripts/delete-user-deep.js
  node scripts/delete-user-deep.js --email student@example.com
  node scripts/delete-user-deep.js --student-id BCE12345 --confirm-delete
`);
}

function isMissingSchemaError(error) {
  const text = `${error?.code || ''} ${error?.message || ''}`.toLowerCase();
  return (
    text.includes('42p01') ||
    text.includes('42703') ||
    text.includes('pgrst204') ||
    text.includes('pgrst205') ||
    text.includes('does not exist') ||
    text.includes('could not find')
  );
}

async function selectIds(table, column, value) {
  if (!value) return [];
  const { data, error } = await supabase.from(table).select('id').eq(column, value);
  if (error) {
    if (isMissingSchemaError(error)) {
      console.warn(`Skipping ${table}.${column}: ${error.message}`);
      return [];
    }
    throw new Error(`Failed reading ${table}.${column}: ${error.message}`);
  }
  return (data || []).map((row) => row.id).filter(Boolean);
}

async function selectIdsIn(table, column, values) {
  const list = (values || []).filter(Boolean);
  if (list.length === 0) return [];
  const { data, error } = await supabase.from(table).select('id').in(column, list);
  if (error) {
    if (isMissingSchemaError(error)) {
      console.warn(`Skipping ${table}.${column}: ${error.message}`);
      return [];
    }
    throw new Error(`Failed reading ${table}.${column}: ${error.message}`);
  }
  return (data || []).map((row) => row.id).filter(Boolean);
}

async function deleteByEq(summary, table, column, value, dryRun) {
  if (!value) return;
  const ids = await selectIds(table, column, value);
  summary.push({ table, column, count: ids.length });
  if (dryRun || ids.length === 0) return;

  const { error } = await supabase.from(table).delete().eq(column, value);
  if (error) {
    if (isMissingSchemaError(error)) {
      console.warn(`Skipping delete ${table}.${column}: ${error.message}`);
      return;
    }
    throw new Error(`Failed deleting from ${table}: ${error.message}`);
  }
}

async function deleteByIn(summary, table, column, values, dryRun) {
  const list = (values || []).filter(Boolean);
  if (list.length === 0) return;
  const ids = await selectIdsIn(table, column, list);
  summary.push({ table, column, count: ids.length });
  if (dryRun || ids.length === 0) return;

  const { error } = await supabase.from(table).delete().in(column, list);
  if (error) {
    if (isMissingSchemaError(error)) {
      console.warn(`Skipping delete ${table}.${column}: ${error.message}`);
      return;
    }
    throw new Error(`Failed deleting from ${table}: ${error.message}`);
  }
}

async function findUser() {
  const id = argValue('--id');
  const email = argValue('--email');
  const studentId = argValue('--student-id');

  if (!id && !email && !studentId) {
    usage();
    throw new Error('Provide one user identifier: --id, --email, or --student-id.');
  }

  let query = supabase
    .from('user_profiles')
    .select('id, email, first_name, last_name, student_id, role, department, program')
    .limit(2);

  if (id) query = query.eq('id', id);
  else if (email) query = query.ilike('email', String(email).trim());
  else query = query.eq('student_id', String(studentId).trim());

  const { data, error } = await query;
  if (error) throw new Error(`Failed looking up user: ${error.message}`);
  if (!data || data.length === 0) throw new Error('No matching user found.');
  if (data.length > 1) throw new Error('More than one user matched. Use --id instead.');
  return data[0];
}

async function findUserByPrompt(rl) {
  console.log('\nFind user by:');
  console.log('1) Email');
  console.log('2) Student ID');
  console.log('3) User UUID');
  const choice = (await rl.question('Choose lookup method: ')).trim();

  let query = supabase
    .from('user_profiles')
    .select('id, email, first_name, last_name, student_id, role, department, program, is_active, is_email_verified, created_at')
    .limit(2);

  if (choice === '1') {
    const email = (await rl.question('Email: ')).trim();
    query = query.ilike('email', email);
  } else if (choice === '2') {
    const studentId = (await rl.question('Student ID: ')).trim();
    query = query.eq('student_id', studentId);
  } else if (choice === '3') {
    const id = (await rl.question('User UUID: ')).trim();
    query = query.eq('id', id);
  } else {
    console.log('Unknown lookup method.');
    return null;
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed looking up user: ${error.message}`);
  if (!data || data.length === 0) {
    console.log('No matching user found.');
    return null;
  }
  if (data.length > 1) {
    console.log('More than one user matched. Use the UUID lookup.');
    return null;
  }
  return data[0];
}

function printUser(user) {
  console.log(`\n${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed user');
  console.log(`  ID:         ${user.id}`);
  console.log(`  Email:      ${user.email || 'N/A'}`);
  console.log(`  Student ID: ${user.student_id || 'N/A'}`);
  console.log(`  Role:       ${user.role || 'N/A'}`);
  console.log(`  Department: ${user.department || 'N/A'}`);
  console.log(`  Program:    ${user.program || 'N/A'}`);
  console.log(`  Active:     ${user.is_active === false ? 'No' : 'Yes'}`);
  console.log(`  Verified:   ${user.is_email_verified ? 'Yes' : 'No'}`);
}

async function listUsers(rl) {
  const role = (await rl.question('Role filter (student/admin/hod/secutuary or blank for all): ')).trim();
  const search = (await rl.question('Search email/name/student ID (blank for none): ')).trim().toLowerCase();

  let query = supabase
    .from('user_profiles')
    .select('id, email, first_name, last_name, student_id, role, department, is_active, is_email_verified, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (role) query = query.eq('role', role);

  const { data, error } = await query;
  if (error) throw new Error(`Failed listing users: ${error.message}`);

  const rows = (data || []).filter((u) => {
    if (!search) return true;
    return [
      u.email,
      u.first_name,
      u.last_name,
      u.student_id,
      u.department,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });

  if (rows.length === 0) {
    console.log('\nNo users found.');
    return;
  }

  console.log(`\nUsers (${rows.length}, max 100 shown):`);
  rows.forEach((u, i) => {
    console.log(
      `${i + 1}. ${u.first_name || ''} ${u.last_name || ''} | ${u.email || 'no email'} | ${u.student_id || 'no student id'} | ${u.role || 'no role'} | ${u.is_active === false ? 'INACTIVE' : 'ACTIVE'} | ${u.is_email_verified ? 'VERIFIED' : 'UNVERIFIED'}`
    );
  });
}

async function viewUserDetails(rl) {
  const user = await findUserByPrompt(rl);
  if (!user) return;
  printUser(user);

  const summary = [];
  const userId = user.id;
  const placementIds = await selectIds('internship_placements', 'student_id', userId);
  const weeklyLogbookIds = await selectIds('weekly_logbooks', 'student_id', userId);
  await deleteByEq(summary, 'applications', 'student_id', userId, true);
  await deleteByEq(summary, 'internship_requests', 'student_id', userId, true);
  await deleteByEq(summary, 'letter_requests', 'student_id', userId, true);
  await deleteByEq(summary, 'internship_placements', 'student_id', userId, true);
  await deleteByEq(summary, 'weekly_logbooks', 'student_id', userId, true);
  await deleteByIn(summary, 'weekly_log_entries', 'logbook_id', weeklyLogbookIds, true);
  await deleteByIn(summary, 'placement_action_logs', 'placement_id', placementIds, true);
  await deleteByEq(summary, 'notifications', 'user_id', userId, true);

  console.log('\nRelated record counts:');
  for (const item of summary.filter((row) => row.count > 0)) {
    console.log(`  - ${item.table}: ${item.count}`);
  }
}

async function changeUserPassword(rl) {
  const user = await findUserByPrompt(rl);
  if (!user) return;
  printUser(user);

  const password = await rl.question('\nNew password (min 6 chars): ');
  if (!password || password.length < 6) {
    console.log('Password too short.');
    return;
  }

  const confirm = (await rl.question(`Change password for ${user.email}? Type YES: `)).trim();
  if (confirm !== 'YES') {
    console.log('Cancelled.');
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({ password: hashed, must_change_password: true })
    .eq('id', user.id);
  if (profileError) throw new Error(`Failed updating profile password: ${profileError.message}`);

  const { error: authError } = await supabase.auth.admin.updateUserById(user.id, { password });
  if (authError) {
    console.warn(`Profile password updated, but Supabase Auth password update failed: ${authError.message}`);
  }
  console.log('Password updated.');
}

async function setUserActive(rl, isActive) {
  const user = await findUserByPrompt(rl);
  if (!user) return;
  printUser(user);

  const confirm = (await rl.question(`${isActive ? 'Activate' : 'Deactivate'} this user? Type YES: `)).trim();
  if (confirm !== 'YES') {
    console.log('Cancelled.');
    return;
  }

  const { error } = await supabase
    .from('user_profiles')
    .update({ is_active: isActive })
    .eq('id', user.id);
  if (error) throw new Error(`Failed updating user status: ${error.message}`);
  console.log(`User ${isActive ? 'activated' : 'deactivated'}.`);
}

async function verifyUserEmail(rl) {
  const user = await findUserByPrompt(rl);
  if (!user) return;
  printUser(user);

  const confirm = (await rl.question('Mark this user email as verified? Type YES: ')).trim();
  if (confirm !== 'YES') {
    console.log('Cancelled.');
    return;
  }

  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      is_email_verified: true,
      email_verification_token: null,
      email_verification_code: null,
      email_verification_expires: null,
    })
    .eq('id', user.id);
  if (profileError) throw new Error(`Failed verifying profile email: ${profileError.message}`);

  const { error: authError } = await supabase.auth.admin.updateUserById(user.id, {
    email_confirm: true,
  });
  if (authError) {
    console.warn(`Profile verified, but Supabase Auth email confirmation failed: ${authError.message}`);
  }
  console.log('Email marked as verified.');
}

async function runDeepDeleteForUser(user, dryRun) {
  const originalArgs = process.argv;
  process.argv = [
    originalArgs[0],
    originalArgs[1],
    '--id',
    user.id,
    ...(dryRun ? [] : ['--confirm-delete']),
  ];
  try {
    await runDeepDelete();
  } finally {
    process.argv = originalArgs;
  }
}

async function interactiveDeleteUser(rl) {
  const user = await findUserByPrompt(rl);
  if (!user) return;
  printUser(user);

  console.log('\nPreviewing related records first...');
  await runDeepDeleteForUser(user, true);

  const confirm = (await rl.question('\nPermanently delete this user and related records? Type DELETE: ')).trim();
  if (confirm !== 'DELETE') {
    console.log('Cancelled.');
    return;
  }
  await runDeepDeleteForUser(user, false);
}

async function runMenu() {
  const rl = readline.createInterface({ input, output });
  try {
    while (true) {
      console.log('\n=== IT User Management ===');
      console.log('1) List users and roles');
      console.log('2) View one user and related record counts');
      console.log('3) Change user password');
      console.log('4) Activate user');
      console.log('5) Deactivate user');
      console.log('6) Mark email as verified');
      console.log('7) Deep-delete user and all details');
      console.log('8) Show command-line delete help');
      console.log('0) Exit');

      const choice = (await rl.question('\nChoose action: ')).trim();
      if (choice === '0') break;

      try {
        if (choice === '1') await listUsers(rl);
        else if (choice === '2') await viewUserDetails(rl);
        else if (choice === '3') await changeUserPassword(rl);
        else if (choice === '4') await setUserActive(rl, true);
        else if (choice === '5') await setUserActive(rl, false);
        else if (choice === '6') await verifyUserEmail(rl);
        else if (choice === '7') await interactiveDeleteUser(rl);
        else if (choice === '8') usage();
        else console.log('Unknown option.');
      } catch (error) {
        console.error(`Operation failed: ${error.message}`);
      }
    }
  } finally {
    if (!rl.closed) rl.close();
  }
}

async function runDeepDelete() {
  if (hasFlag('--help') || hasFlag('-h')) {
    usage();
    return;
  }

  const dryRun = !hasFlag('--confirm-delete');
  const user = await findUser();
  const userId = user.id;

  console.log('\nTarget user:');
  console.log(`  ID:         ${user.id}`);
  console.log(`  Name:       ${user.first_name || ''} ${user.last_name || ''}`.trim());
  console.log(`  Email:      ${user.email || 'N/A'}`);
  console.log(`  Student ID: ${user.student_id || 'N/A'}`);
  console.log(`  Role:       ${user.role || 'N/A'}`);

  const summary = [];

  const placementIds = await selectIds('internship_placements', 'student_id', userId);
  const weeklyLogbookIds = await selectIds('weekly_logbooks', 'student_id', userId);
  const letterRequestIds = await selectIds('letter_requests', 'student_id', userId);
  const evaluationIds = await selectIds('evaluations', 'student_id', userId);
  const legacyLogbookIds = await selectIds('logbooks', 'student_id', userId);
  const reportIds = await selectIds('reports', 'student_id', userId);

  await deleteByIn(summary, 'weekly_log_audit_logs', 'logbook_id', weeklyLogbookIds, dryRun);
  await deleteByIn(summary, 'weekly_log_reviews', 'logbook_id', weeklyLogbookIds, dryRun);
  await deleteByIn(summary, 'weekly_log_supervisor_tokens', 'logbook_id', weeklyLogbookIds, dryRun);
  await deleteByIn(summary, 'weekly_log_entries', 'logbook_id', weeklyLogbookIds, dryRun);
  await deleteByEq(summary, 'weekly_logbooks', 'student_id', userId, dryRun);

  await deleteByIn(summary, 'placement_action_logs', 'placement_id', placementIds, dryRun);
  await deleteByIn(summary, 'email_logs', 'placement_id', placementIds, dryRun);
  await deleteByIn(summary, 'evaluation_tokens', 'placement_id', placementIds, dryRun);
  await deleteByIn(summary, 'evaluations', 'placement_id', placementIds, dryRun);
  await deleteByEq(summary, 'internship_placements', 'student_id', userId, dryRun);

  await deleteByIn(summary, 'document_verification', 'document_id', [
    ...letterRequestIds,
    ...placementIds,
    ...evaluationIds,
    ...legacyLogbookIds,
    ...reportIds,
  ], dryRun);
  await deleteByEq(summary, 'document_verification', 'generated_by', userId, dryRun);
  await deleteByIn(summary, 'document_transmissions', 'document_id', [
    ...letterRequestIds,
    ...placementIds,
    ...evaluationIds,
    ...legacyLogbookIds,
    ...reportIds,
  ], dryRun);
  await deleteByEq(summary, 'document_transmissions', 'sender_id', userId, dryRun);

  await deleteByEq(summary, 'applications', 'student_id', userId, dryRun);
  await deleteByEq(summary, 'internship_requests', 'student_id', userId, dryRun);
  await deleteByEq(summary, 'letter_requests', 'student_id', userId, dryRun);
  await deleteByEq(summary, 'evaluations', 'student_id', userId, dryRun);
  await deleteByEq(summary, 'logbooks', 'student_id', userId, dryRun);
  await deleteByEq(summary, 'reports', 'student_id', userId, dryRun);
  await deleteByEq(summary, 'administrative_actions', 'student_id', userId, dryRun);

  await deleteByEq(summary, 'notifications', 'user_id', userId, dryRun);
  await deleteByEq(summary, 'user_notice_reads', 'user_id', userId, dryRun);
  await deleteByEq(summary, 'user_preferences', 'user_id', userId, dryRun);
  await deleteByEq(summary, 'activity_logs', 'user_id', userId, dryRun);
  await deleteByEq(summary, 'security_events', 'user_id', userId, dryRun);
  await deleteByEq(summary, 'staff_signatures', 'user_id', userId, dryRun);

  await deleteByEq(summary, 'internships', 'posted_by', userId, dryRun);
  await deleteByEq(summary, 'notices', 'created_by', userId, dryRun);

  summary.push({ table: 'user_profiles', column: 'id', count: 1 });
  if (!dryRun) {
    const { error: profileError } = await supabase.from('user_profiles').delete().eq('id', userId);
    if (profileError) throw new Error(`Failed deleting user profile: ${profileError.message}`);

    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) {
      console.warn(`Profile deleted, but Supabase Auth delete failed: ${authError.message}`);
    } else {
      summary.push({ table: 'auth.users', column: 'id', count: 1 });
    }
  }

  console.log(`\n${dryRun ? 'Dry run summary' : 'Delete summary'}:`);
  for (const item of summary.filter((row) => row.count > 0)) {
    console.log(`  - ${item.table}: ${item.count} row(s) via ${item.column}`);
  }

  if (dryRun) {
    console.log('\nNo records were deleted. Re-run with --confirm-delete to permanently remove them.');
  } else {
    console.log('\nUser and related records were deleted.');
  }
}

async function main() {
  if (currentArgs().length === 0) {
    await runMenu();
    return;
  }
  await runDeepDelete();
}

main().catch((error) => {
  console.error(`\nDelete failed: ${error.message}`);
  process.exit(1);
});
