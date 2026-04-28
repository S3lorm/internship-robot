const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function getDepartments() {
  const { data, error } = await supabase
    .from('departments')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function chooseDepartment(rl) {
  const departments = await getDepartments();
  if (!departments.length) {
    throw new Error('No departments found. Run the department migration first.');
  }

  console.log('\nAvailable departments:');
  departments.forEach((dept, idx) => {
    console.log(`  ${idx + 1}) ${dept.name}`);
  });

  while (true) {
    const raw = await rl.question('\nChoose department number: ');
    const idx = Number(raw);
    if (Number.isInteger(idx) && idx >= 1 && idx <= departments.length) {
      return departments[idx - 1].name;
    }
    console.log('Invalid choice. Please enter one of the listed numbers.');
  }
}

async function upsertStaff({ role, department, email, password, firstName, lastName }) {
  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    throw new Error('Invalid email format.');
  }
  if (!password || String(password).length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const hashed = await bcrypt.hash(String(password), 10);

  const { data: existing, error: findError } = await supabase
    .from('user_profiles')
    .select('id, role')
    .eq('email', normalizedEmail)
    .maybeSingle();
  if (findError) throw findError;

  const payload = {
    email: normalizedEmail,
    password: hashed,
    first_name: firstName,
    last_name: lastName,
    role,
    department,
    is_active: true,
    is_email_verified: true,
  };

  if (existing) {
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update(payload)
      .eq('id', existing.id);
    if (updateError) throw updateError;
    return { created: false, id: existing.id };
  }

  const { data: inserted, error: insertError } = await supabase
    .from('user_profiles')
    .insert({ id: uuidv4(), ...payload })
    .select('id')
    .single();
  if (insertError) throw insertError;
  return { created: true, id: inserted.id };
}

async function listHods() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, email, first_name, last_name, department, is_active')
    .eq('role', 'hod')
    .order('department', { ascending: true })
    .order('last_name', { ascending: true });
  if (error) throw error;

  if (!data || !data.length) {
    console.log('\nNo HOD accounts found.');
    return;
  }

  console.log('\nHOD accounts:');
  data.forEach((u, i) => {
    console.log(
      `${i + 1}. ${u.first_name || ''} ${u.last_name || ''} | ${u.email} | ${u.department || '—'} | ${u.is_active ? 'ACTIVE' : 'INACTIVE'}`
    );
  });
}

async function setHodPassword(rl) {
  const email = normalizeEmail(await rl.question('HOD email: '));
  const newPassword = await rl.question('New password (min 6 chars): ');
  if (newPassword.length < 6) {
    console.log('Password too short.');
    return;
  }

  const { data: user, error: findError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('email', email)
    .eq('role', 'hod')
    .maybeSingle();
  if (findError) throw findError;
  if (!user) {
    console.log('No HOD account found for that email.');
    return;
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  const { error } = await supabase
    .from('user_profiles')
    .update({ password: hashed })
    .eq('id', user.id);
  if (error) throw error;
  console.log('HOD password updated.');
}

async function setHodStatus(rl, active) {
  const email = normalizeEmail(await rl.question('HOD email: '));
  const { data: user, error: findError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('email', email)
    .eq('role', 'hod')
    .maybeSingle();
  if (findError) throw findError;
  if (!user) {
    console.log('No HOD account found for that email.');
    return;
  }

  const { error } = await supabase
    .from('user_profiles')
    .update({ is_active: active })
    .eq('id', user.id);
  if (error) throw error;
  console.log(`HOD account ${active ? 'activated' : 'deactivated'}.`);
}

async function createHod(rl) {
  const department = await chooseDepartment(rl);
  const email = await rl.question('HOD email: ');
  const password = await rl.question('HOD password: ');
  const firstName = (await rl.question('First name [Head]: ')).trim() || 'Head';
  const lastName = (await rl.question('Last name [of Department]: ')).trim() || 'of Department';

  const result = await upsertStaff({
    role: 'hod',
    department,
    email,
    password,
    firstName,
    lastName,
  });

  console.log(result.created ? 'HOD account created.' : 'Existing account updated to HOD.');
}

async function createSecutuary(rl) {
  const department = await chooseDepartment(rl);
  const email = await rl.question('Secutuary email: ');
  const password = await rl.question('Secutuary password: ');
  const firstName = (await rl.question('First name [Secutuary]: ')).trim() || 'Secutuary';
  const lastName = (await rl.question('Last name [User]: ')).trim() || 'User';

  const result = await upsertStaff({
    role: 'secutuary',
    department,
    email,
    password,
    firstName,
    lastName,
  });

  console.log(result.created ? 'Secutuary account created.' : 'Existing account updated to secutuary.');
}

async function main() {
  const rl = readline.createInterface({ input, output });
  try {
    while (true) {
      console.log('\n=== RBAC Staff Manager ===');
      console.log('1) List departments (from DB)');
      console.log('2) List all HOD accounts');
      console.log('3) Create/Update HOD account');
      console.log('4) Set HOD password');
      console.log('5) Activate HOD account');
      console.log('6) Deactivate HOD account');
      console.log('7) Create/Update secutuary account');
      console.log('0) Exit');

      const choice = (await rl.question('\nChoose action: ')).trim();
      if (choice === '0') break;

      try {
        if (choice === '1') {
          const departments = await getDepartments();
          console.log('\nDepartments:');
          departments.forEach((d, i) => console.log(`${i + 1}. ${d.name}`));
        } else if (choice === '2') {
          await listHods();
        } else if (choice === '3') {
          await createHod(rl);
        } else if (choice === '4') {
          await setHodPassword(rl);
        } else if (choice === '5') {
          await setHodStatus(rl, true);
        } else if (choice === '6') {
          await setHodStatus(rl, false);
        } else if (choice === '7') {
          await createSecutuary(rl);
        } else {
          console.log('Unknown option.');
        }
      } catch (err) {
        console.error('Operation failed:', err.message || err);
      }
    }
  } finally {
    if (!rl.closed) {
      rl.close();
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err.message || err);
  process.exit(1);
});
