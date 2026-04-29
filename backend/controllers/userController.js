const { User } = require('../models');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendTemporaryPasswordEmail } = require('../services/emailService');

function parsePagination(req) {
  const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
  const limit = req.query.limit ? Math.min(100, Math.max(1, Number(req.query.limit))) : 20;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

async function list(req, res) {
  const { page, limit, offset } = parsePagination(req);
  const where = {};
  if (req.user.role === 'hod' && req.user.department) {
    where.department = req.user.department;
  }
  if (req.query.role) where.role = req.query.role;
  if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';

  const { rows, count } = await User.findAndCountAll({
    where,
    attributes: { exclude: ['password'] },
    limit,
    offset,
    order: [['created_at', 'DESC']],
  });
  return res.json({ data: rows, meta: { page, limit, total: count } });
}

async function getById(req, res) {
  const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json({ user });
}

async function update(req, res) {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const allowed = [
    'firstName',
    'lastName',
    'phone',
    'department',
    'program',
    'yearOfStudy',
    'bio',
    'skills',
    'role',
  ];
  for (const k of allowed) {
    if (req.body[k] !== undefined) user[k] = req.body[k];
  }
  await user.save();

  const safeUser = user.toJSON();
  delete safeUser.password;
  return res.json({ message: 'User updated', user: safeUser });
}

async function updateStatus(req, res) {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.isActive = req.body.isActive === undefined ? !user.isActive : Boolean(req.body.isActive);
  await user.save();
  return res.json({ message: 'Status updated', isActive: user.isActive });
}

async function remove(req, res) {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  await user.destroy();
  return res.json({ message: 'User deleted' });
}

async function exportCsv(_req, res) {
  const users = await User.findAll({ attributes: { exclude: ['password'] } });
  const header = [
    'id',
    'email',
    'firstName',
    'lastName',
    'studentId',
    'phone',
    'role',
    'department',
    'program',
    'yearOfStudy',
    'isActive',
    'isEmailVerified',
    'created_at',
    'updated_at',
  ];
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = users.map((u) =>
    header
      .map((k) => {
        const key = k === 'created_at' ? 'created_at' : k === 'updated_at' ? 'updated_at' : k;
        return escape(u.get(key));
      })
      .join(',')
  );
  const csv = [header.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
  return res.send(csv);
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateTemporaryPassword() {
  // Keep it easy to type while still strong enough for one-time use.
  const alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '@#$%!';
  const all = alpha + digits + symbols;

  let password = '';
  password += alpha[crypto.randomInt(0, alpha.length)];
  password += alpha[crypto.randomInt(0, alpha.length)];
  password += digits[crypto.randomInt(0, digits.length)];
  password += symbols[crypto.randomInt(0, symbols.length)];
  for (let i = 0; i < 8; i += 1) {
    password += all[crypto.randomInt(0, all.length)];
  }
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

async function createStaff(req, res) {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);
    const firstName = String(req.body.firstName || '').trim();
    const lastName = String(req.body.lastName || '').trim();
    const department = String(req.body.department || '').trim();
    const role = String(req.body.role || '').trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'A valid email is required.' });
    }
    if (!firstName || !lastName) {
      return res.status(400).json({ message: 'First name and last name are required.' });
    }
    if (!department) {
      return res.status(400).json({ message: 'Department is required.' });
    }
    if (!['hod', 'secutuary'].includes(role)) {
      return res.status(400).json({ message: 'Role must be either hod or secutuary.' });
    }

    const existingActiveInDepartment = await User.findOne({
      where: {
        role,
        department,
        isActive: true,
      },
    });
    if (existingActiveInDepartment) {
      const roleLabel = role === 'hod' ? 'HOD' : 'Secutuary';
      return res.status(409).json({
        message: `An active ${roleLabel} already exists for ${department}. Deactivate the existing account before creating a new one.`,
      });
    }

    const existing = await User.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const created = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      department,
      isActive: true,
      isEmailVerified: true,
      mustChangePassword: true,
    });

    const safeUser = created.toJSON();
    delete safeUser.password;

    try {
      await sendTemporaryPasswordEmail(
        {
          ...safeUser,
          role,
          firstName,
        },
        temporaryPassword
      );
      return res.status(201).json({
        message: `Staff account created. Temporary password has been sent to ${normalizedEmail}.`,
        user: safeUser,
      });
    } catch (emailError) {
      console.error('Failed to send temporary password email:', emailError);
      return res.status(201).json({
        message:
          'Staff account created, but email delivery failed. Share this temporary password manually and ask the user to change it on first login.',
        user: safeUser,
        emailSent: false,
        temporaryPassword,
      });
    }
  } catch (error) {
    console.error('Error creating staff account:', error);
    const combined = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
    if (error?.code === '23505' || combined.includes('duplicate key') || combined.includes('unique constraint')) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    return res.status(500).json({ message: 'Failed to create staff account.' });
  }
}

module.exports = { list, getById, update, updateStatus, remove, exportCsv, createStaff };

