const { User } = require('../models');

function parsePagination(req) {
  const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
  const limit = req.query.limit ? Math.min(100, Math.max(1, Number(req.query.limit))) : 20;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

async function list(req, res) {
  const { page, limit, offset } = parsePagination(req);
  const where = {};
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

module.exports = { list, getById, update, updateStatus, remove, exportCsv };

