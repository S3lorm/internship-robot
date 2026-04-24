const { Notice, User } = require('../models');
const { createNotification } = require('../services/notificationService');

function parsePagination(req) {
  const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
  const limit = req.query.limit ? Math.min(100, Math.max(1, Number(req.query.limit))) : 20;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * When a notice is scoped to a department, HODs in that department get an in-app
 * notification. Broad notices (no targetDepartment) do not fan out — HODs
 * already see department notices in their notices list; org-wide posts were
 * incorrectly notifying every HOD.
 */
async function notifyHodsForNewNotice(notice, excludeUserId = null) {
  if (!notice.targetDepartment) {
    return;
  }

  const where = { role: 'hod', department: notice.targetDepartment };

  const hods = await User.findAll({ where });
  const link = '/admin/notifications';
  const message = `New notice: ${notice.title}`;

  for (const hod of hods) {
    if (!hod.id || (excludeUserId && hod.id === excludeUserId)) continue;
    await createNotification({
      userId: hod.id,
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

  if (!manage) {
    if (!audience && req.user && req.user.role === 'student') {
      where.targetAudience = { in: ['all', 'students'] };
    }
    if (!audience && req.user && req.user.role === 'admin') {
      where.targetAudience = { in: ['all', 'admins'] };
    }
    if (req.user && req.user.role === 'hod') {
      where.targetDepartment = req.user.department;
    }
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
    if (req.user && req.user.role === 'student') {
      if (n.targetDepartment && n.targetDepartment !== req.user.department) return false;
    }
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
      await notifyHodsForNewNotice(notice, skipId);
    } catch (err) {
      console.error('notifyHodsForNewNotice:', err);
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

