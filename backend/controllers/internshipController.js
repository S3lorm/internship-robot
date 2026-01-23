const { Internship, User } = require('../models');
const { createNotification } = require('../services/notificationService');

function parsePagination(req) {
  const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
  const limit = req.query.limit ? Math.min(100, Math.max(1, Number(req.query.limit))) : 20;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

async function list(req, res) {
  const { page, limit, offset } = parsePagination(req);
  const where = {};
  if (req.query.status) where.status = req.query.status;
  if (req.query.type) where.type = req.query.type;

  const { rows, count } = await Internship.findAndCountAll({
    where,
    include: [{ model: User, as: 'poster', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    limit,
    offset,
    order: [['posted_at', 'DESC']],
  });
  return res.json({ data: rows, meta: { page, limit, total: count } });
}

async function getById(req, res) {
  const internship = await Internship.findByPk(req.params.id, {
    include: [{ model: User, as: 'poster', attributes: ['id', 'firstName', 'lastName', 'email'] }],
  });
  if (!internship) return res.status(404).json({ message: 'Internship not found' });
  return res.json({ internship });
}

async function create(req, res) {
  const payload = {
    title: req.body.title,
    company: req.body.company,
    location: req.body.location,
    type: req.body.type,
    duration: req.body.duration,
    description: req.body.description,
    requirements: req.body.requirements,
    responsibilities: req.body.responsibilities,
    stipend: req.body.stipend,
    deadline: req.body.deadline,
    slots: req.body.slots,
    status: req.body.status,
    postedBy: req.user.id,
  };

  const internship = await Internship.create(payload);

  // Optional: notify poster (or broadcast later)
  await createNotification({
    userId: req.user.id,
    type: 'new_internship',
    title: 'Internship posted',
    message: `You posted: ${internship.title}`,
    relatedId: internship.id,
  });

  return res.status(201).json({ message: 'Internship created', internship });
}

async function update(req, res) {
  const internship = await Internship.findByPk(req.params.id);
  if (!internship) return res.status(404).json({ message: 'Internship not found' });

  const allowed = [
    'title',
    'company',
    'location',
    'type',
    'duration',
    'description',
    'requirements',
    'responsibilities',
    'stipend',
    'deadline',
    'slots',
    'status',
  ];
  for (const k of allowed) {
    if (req.body[k] !== undefined) internship[k] = req.body[k];
  }
  await internship.save();

  return res.json({ message: 'Internship updated', internship });
}

async function remove(req, res) {
  const internship = await Internship.findByPk(req.params.id);
  if (!internship) return res.status(404).json({ message: 'Internship not found' });
  await internship.destroy();
  return res.json({ message: 'Internship deleted' });
}

async function updateStatus(req, res) {
  const internship = await Internship.findByPk(req.params.id);
  if (!internship) return res.status(404).json({ message: 'Internship not found' });
  internship.status = req.body.status;
  await internship.save();
  return res.json({ message: 'Status updated', internship });
}

module.exports = { list, getById, create, update, remove, updateStatus };

