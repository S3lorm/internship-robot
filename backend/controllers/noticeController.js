const { Notice, User, Op } = require('../models');
const { createNotification } = require('../services/notificationService');

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
    where.targetAudience = { in: ['all', 'students'] };
  }
  if (!audience && req.user && req.user.role === 'admin') {
    where.targetAudience = { in: ['all', 'admins'] };
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

async function markAsRead(req, res) {
  try {
    const { supabase } = require('../models/supabase');
    const noticeId = req.params.id;
    const userId = req.user.id;

    // Check if notice exists
    const notice = await Notice.findByPk(noticeId);
    if (!notice) return res.status(404).json({ message: 'Notice not found' });

    // Insert read record (ignores if already exists due to unique constraint in Supabase)
    const { error } = await supabase
      .from('user_notice_reads')
      .upsert({ user_id: userId, notice_id: noticeId, read_at: new Date() }, { onConflict: 'user_id,notice_id' });

    if (error) {
      console.error('Error marking notice as read in Supabase:', error);
      return res.status(500).json({ message: 'Failed to mark notice as read' });
    }

    return res.json({ message: 'Notice marked as read', isRead: true });
  } catch (err) {
    console.error('Error in markAsRead:', err);
    return res.status(500).json({ message: 'Server error marking notice as read' });
  }
}

module.exports = { list, getById, create, update, remove, markAsRead };

