const { Notice, User } = require('../models');
const { createNotification } = require('../services/notificationService');
const NOTICE_AUDIENCES = ['all', 'students', 'admins', 'hod', 'secutuary'];

function parsePagination(req) {
  const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
  const limit = req.query.limit ? Math.min(100, Math.max(1, Number(req.query.limit))) : 20;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function noticeAudienceForUser(user) {
  if (!user) return null;
  if (user.role === 'student') return 'students';
  if (user.role === 'admin') return 'admins';
  if (user.role === 'hod' && user.originalRole === 'secutuary') return 'secutuary';
  if (user.role === 'hod') return 'hod';
  return null;
}

function canUserViewNotice(user, notice) {
  if (!user || !notice) return false;
  const audience = noticeAudienceForUser(user);
  if (!audience) return false;
  if (notice.targetAudience !== 'all' && notice.targetAudience !== audience) return false;
  if (notice.targetDepartment && user.role !== 'admin' && notice.targetDepartment !== user.department) return false;
  return true;
}

async function notifyUsersForNewNotice(notice, excludeUserId = null) {
  if (!notice?.id) return;

  const where = { isActive: true };
  if (notice.targetAudience === 'students') where.role = 'student';
  if (notice.targetAudience === 'admins') where.role = 'admin';
  if (notice.targetAudience === 'hod') where.role = 'hod';
  if (notice.targetAudience === 'secutuary') where.role = 'secutuary';

  const candidates = await User.findAll({ where });
  const recipients = notice.targetDepartment
    ? candidates.filter((u) => u.department === notice.targetDepartment)
    : candidates;

  const link = notice.targetAudience === 'students' ? '/dashboard/notices' : '/admin/notifications';
  const message = `New notice: ${notice.title}`;

  for (const recipient of recipients) {
    if (!recipient?.id || (excludeUserId && recipient.id === excludeUserId)) continue;
    await createNotification({
      userId: recipient.id,
      type: 'notice',
      title: 'New announcement',
      message,
      relatedId: notice.id,
      link,
    });
  }
}

async function list(req, res) {
  const { page, limit, offset } = parsePagination(req);
  const audience = req.query.audience;
  const manage = req.query.manage === '1' && req.user && req.user.role === 'admin';

  const where = {};
  if (!manage) {
    where.isActive = true;
  }
  if (audience) {
    where.targetAudience = audience;
  }

  const effectiveLimit = manage ? Math.min(500, Math.max(Number(req.query.limit) || 200, 50)) : limit;
  const effectiveOffset = manage ? 0 : offset;

  const { rows, count } = await Notice.findAndCountAll({
    where,
    include: [{ model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    limit: effectiveLimit,
    offset: effectiveOffset,
    order: [['created_at', 'DESC']],
  });

  const now = new Date();
  let filteredRows = rows.filter((n) => {
    if (n.expiresAt && new Date(n.expiresAt) <= now) return false;
    if (!manage && req.user && !canUserViewNotice(req.user, n)) return false;
    return true;
  });

  // Attach isRead status for the current user
  try {
    const { supabase } = require('../models/supabase');
    const userId = req.user && req.user.id;
    if (userId && filteredRows.length > 0 && req.user.role !== 'hod') {
      const noticeIds = filteredRows.map(n => n.id);
      const { data: readRecords } = await supabase
        .from('user_notice_reads')
        .select('notice_id')
        .eq('user_id', userId)
        .in('notice_id', noticeIds);

      const readSet = new Set((readRecords || []).map(r => r.notice_id));
      for (const notice of filteredRows) {
        notice.isRead = readSet.has(notice.id);
      }
    }
  } catch (err) {
    console.error('Error fetching notice read statuses:', err);
    // Continue without isRead — notices will default to unread
  }

  return res.json({ data: filteredRows, meta: { page, limit, total: filteredRows.length } });
}

async function getById(req, res) {
  const notice = await Notice.findByPk(req.params.id, {
    include: [{ model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'email'] }],
  });
  if (!notice) return res.status(404).json({ message: 'Notice not found' });
  if (
    req.user &&
    req.user.role === 'hod' &&
    notice.targetDepartment &&
    notice.targetDepartment !== req.user.department
  ) {
    return res.status(403).json({ message: 'Access denied' });
  }
  return res.json({ notice });
}

async function create(req, res) {
  let targetAudience = req.body.targetAudience || 'students';
  let targetDepartment = req.body.targetDepartment ?? null;
  let createdBy = req.user.id;

  if (req.user.role === 'hod') {
    targetAudience = 'students';
    targetDepartment = req.user.department;
    createdBy = null;
  }

  if (!NOTICE_AUDIENCES.includes(targetAudience)) {
    return res.status(400).json({ message: 'Invalid target audience.' });
  }

  const notice = await Notice.create({
    title: req.body.title,
    content: req.body.content,
    priority: req.body.priority,
    targetAudience,
    targetDepartment,
    isActive: req.body.isActive ?? true,
    expiresAt: req.body.expiresAt,
    createdBy,
  });

  if (req.user.role !== 'hod') {
    await createNotification({
      userId: req.user.id,
      type: 'notice',
      title: 'Notice created',
      message: `You created notice: ${notice.title}`,
      relatedId: notice.id,
    });
  }

  if (notice.isActive) {
    try {
      const skipId = req.user.role === 'hod' ? req.user.id : null;
      await notifyUsersForNewNotice(notice, skipId);
    } catch (err) {
      console.error('notifyUsersForNewNotice:', err);
    }
  }

  return res.status(201).json({ message: 'Notice created', notice });
}

async function update(req, res) {
  const notice = await Notice.findByPk(req.params.id);
  if (!notice) return res.status(404).json({ message: 'Notice not found' });

  const allowed = ['title', 'content', 'priority', 'targetAudience', 'targetDepartment', 'isActive', 'expiresAt'];
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
    if (req.user.role === 'hod') {
      return res.json({ message: 'Notice marked as read', isRead: true });
    }
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

async function markAllAsRead(req, res) {
  try {
    if (req.user.role === 'hod') {
      return res.json({ message: 'All notices marked as read' });
    }
    const { supabase } = require('../models/supabase');
    const userId = req.user.id;

    // Fetch all active notice IDs
    const { data: activeNotices, error: fetchError } = await supabase
      .from('notices')
      .select('id')
      .eq('is_active', true);

    if (fetchError) {
      console.error('Error fetching active notices:', fetchError);
      return res.status(500).json({ message: 'Failed to mark all notices as read' });
    }

    if (!activeNotices || activeNotices.length === 0) {
      return res.json({ message: 'No notices to mark as read' });
    }

    // Upsert all as read
    const records = activeNotices.map(n => ({
      user_id: userId,
      notice_id: n.id,
      read_at: new Date(),
    }));

    const { error } = await supabase
      .from('user_notice_reads')
      .upsert(records, { onConflict: 'user_id,notice_id' });

    if (error) {
      console.error('Error marking all notices as read:', error);
      return res.status(500).json({ message: 'Failed to mark all notices as read' });
    }

    return res.json({ message: 'All notices marked as read' });
  } catch (err) {
    console.error('Error in markAllAsRead:', err);
    return res.status(500).json({ message: 'Server error marking all notices as read' });
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  markAsRead,
  markAllAsRead,
};

