const { Notice, User } = require('../models');
const { createNotification } = require('../services/notificationService');
const { Op } = require('sequelize');

function parsePagination(req) {
  const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
  const limit = req.query.limit ? Math.min(100, Math.max(1, Number(req.query.limit))) : 20;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

async function list(req, res) {
  const { page, limit, offset } = parsePagination(req);
  const where = { isActive: true };
  const audience = req.query.audience;
  if (audience) where.targetAudience = audience;

  // Students shouldn't see admin-only; admins shouldn't see students-only if they filter; default is 'all'
  if (!audience && req.user && req.user.role === 'student') {
    where.targetAudience = { [Op.in]: ['all', 'students'] };
  }
  if (!audience && req.user && req.user.role === 'admin') {
    where.targetAudience = { [Op.in]: ['all', 'admins'] };
  }

  const { rows, count } = await Notice.findAndCountAll({
    where,
    include: [{ model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    limit,
    offset,
    order: [['created_at', 'DESC']],
  });
  return res.json({ data: rows, meta: { page, limit, total: count } });
}

async function getById(req, res) {
  const notice = await Notice.findByPk(req.params.id, {
    include: [{ model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'email'] }],
  });
  if (!notice) return res.status(404).json({ message: 'Notice not found' });
  return res.json({ notice });
}

async function create(req, res) {
  const notice = await Notice.create({
    title: req.body.title,
    content: req.body.content,
    priority: req.body.priority,
    targetAudience: req.body.targetAudience,
    isActive: req.body.isActive ?? true,
    expiresAt: req.body.expiresAt,
    createdBy: req.user.id,
  });

  await createNotification({
    userId: req.user.id,
    type: 'notice',
    title: 'Notice created',
    message: `You created notice: ${notice.title}`,
    relatedId: notice.id,
  });

  return res.status(201).json({ message: 'Notice created', notice });
}

async function update(req, res) {
  const notice = await Notice.findByPk(req.params.id);
  if (!notice) return res.status(404).json({ message: 'Notice not found' });

  const allowed = ['title', 'content', 'priority', 'targetAudience', 'isActive', 'expiresAt'];
  for (const k of allowed) {
    if (req.body[k] !== undefined) notice[k] = req.body[k];
  }
  await notice.save();
  return res.json({ message: 'Notice updated', notice });
}

async function remove(req, res) {
  const notice = await Notice.findByPk(req.params.id);
  if (!notice) return res.status(404).json({ message: 'Notice not found' });
  await notice.destroy();
  return res.json({ message: 'Notice deleted' });
}

module.exports = { list, getById, create, update, remove };

