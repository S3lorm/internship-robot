const { Notice, User } = require('../models');
const { supabase } = require('../models/supabase');
const { createNotification } = require('../services/notificationService');
const { emailNoticeToVerifiedStudents } = require('../services/noticeEmailService');
const NOTICE_AUDIENCES = ['all', 'students', 'admins', 'hod', 'secutuary', 'students_and_secretary'];

function isSecretaryUser(user) {
  return user?.role === 'secutuary' || (user?.role === 'hod' && user?.originalRole === 'secutuary');
}

function isHodOnlyUser(user) {
  return user?.role === 'hod' && user?.originalRole !== 'secutuary';
}

async function getNoticeRecipientUsers(notice) {
  const all = await User.findAll({ where: { isActive: true }, limit: 5000 });
  const audience = notice.targetAudience || 'students';

  let candidates = all;
  switch (audience) {
    case 'students':
      candidates = all.filter((u) => u.role === 'student');
      break;
    case 'hod':
      candidates = all.filter((u) => isHodOnlyUser(u));
      break;
    case 'secutuary':
      candidates = all.filter((u) => isSecretaryUser(u));
      break;
    case 'students_and_secretary':
      candidates = all.filter((u) => u.role === 'student' || isSecretaryUser(u));
      break;
    case 'admins':
      candidates = all.filter((u) => u.role === 'admin');
      break;
  }

  if (notice.targetDepartment) {
    candidates = candidates.filter((u) => u.department === notice.targetDepartment);
  }
  return candidates;
}
const PUBLISH_SCOPES = ['portal', 'homepage', 'both'];

function resolveAdminPublishPlacement(body, userRole) {
  if (userRole !== 'admin') {
    return { showOnHomepage: false, homepageOnly: false, publishScope: 'portal' };
  }

  let scope = String(body.publishScope || '').toLowerCase();
  if (!PUBLISH_SCOPES.includes(scope)) {
    if (body.homepageOnly === true) scope = 'homepage';
    else if (body.showOnHomepage === true) scope = 'both';
    else scope = 'portal';
  }

  if (scope === 'homepage') {
    return { showOnHomepage: true, homepageOnly: true, publishScope: 'homepage' };
  }
  if (scope === 'both') {
    return { showOnHomepage: true, homepageOnly: false, publishScope: 'both' };
  }
  return { showOnHomepage: false, homepageOnly: false, publishScope: 'portal' };
}

function shouldDeliverNoticeToStudentPortal(notice) {
  return Boolean(notice?.isActive) && !notice?.homepageOnly;
}

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
  if (notice.targetAudience === 'students_and_secretary') {
    if (user.role === 'admin') return true;
    if (user.role === 'student' || isSecretaryUser(user)) {
      if (notice.targetDepartment && user.role !== 'admin' && notice.targetDepartment !== user.department) {
        return false;
      }
      return true;
    }
    return false;
  }
  const audience = noticeAudienceForUser(user);
  if (!audience) return false;
  if (notice.targetAudience !== 'all' && notice.targetAudience !== audience) return false;
  if (notice.targetDepartment && user.role !== 'admin' && notice.targetDepartment !== user.department) return false;
  return true;
}

async function notifyUsersForNewNotice(notice, excludeUserId = null) {
  if (!notice?.id) return;

  const recipients = await getNoticeRecipientUsers(notice);
  const studentAudiences = ['students', 'students_and_secretary', 'all'];
  const link = studentAudiences.includes(notice.targetAudience)
    ? '/dashboard/notices'
    : '/admin/notifications';
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

/** Public homepage: active announcements created by system admins only. */
async function listPublicHomepage(req, res) {
  try {
    const limit = Math.min(10, Math.max(1, Number(req.query.limit) || 4));

    const { data: adminUsers, error: adminErr } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('role', 'admin');

    if (adminErr) throw adminErr;

    const adminIds = (adminUsers || []).map((u) => u.id).filter(Boolean);
    if (adminIds.length === 0) {
      return res.json({ data: [] });
    }

    let query = supabase
      .from('notices')
      .select('*')
      .eq('is_active', true)
      .in('created_by', adminIds)
      .in('target_audience', ['all', 'students'])
      .order('created_at', { ascending: false })
      .limit(Math.max(limit * 3, 12));

    query = query.eq('show_on_homepage', true);

    let { data, error } = await query;

    if (error && /show_on_homepage|column/i.test(error.message || '')) {
      const fallback = await supabase
        .from('notices')
        .select('*')
        .eq('is_active', true)
        .in('created_by', adminIds)
        .in('target_audience', ['all', 'students'])
        .order('created_at', { ascending: false })
        .limit(Math.max(limit * 3, 12));
      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;

    const now = new Date();
    const rows = (data || [])
      .filter((n) => !n.expires_at || new Date(n.expires_at) > now)
      .slice(0, limit)
      .map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        priority: row.priority,
        targetAudience: row.target_audience,
        targetDepartment: row.target_department || null,
        isActive: row.is_active,
        showOnHomepage: row.show_on_homepage === true,
        homepageOnly: row.homepage_only === true,
        expiresAt: row.expires_at,
        publishDate: row.created_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

    return res.json({ data: rows });
  } catch (err) {
    console.error('listPublicHomepage:', err);
    return res.status(500).json({ message: 'Failed to load announcements' });
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
    if (!manage && n.homepageOnly) return false;
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

  const placement = resolveAdminPublishPlacement(req.body, req.user.role);

  const notice = await Notice.create({
    title: req.body.title,
    content: req.body.content,
    priority: req.body.priority,
    targetAudience,
    targetDepartment,
    isActive: req.body.isActive ?? true,
    showOnHomepage: placement.showOnHomepage,
    homepageOnly: placement.homepageOnly,
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

  if (shouldDeliverNoticeToStudentPortal(notice)) {
    try {
      const skipId = req.user.role === 'hod' ? req.user.id : null;
      await notifyUsersForNewNotice(notice, skipId);
    } catch (err) {
      console.error('notifyUsersForNewNotice:', err);
    }
    if (req.user.role === 'admin') {
      try {
        const emailStats = await emailNoticeToVerifiedStudents(notice);
        return res.status(201).json({
          message: 'Notice created',
          notice,
          emailDelivery: emailStats,
        });
      } catch (err) {
        console.error('emailNoticeToVerifiedStudents:', err);
      }
    }
  }

  const scopeLabel =
    notice.homepageOnly ? 'homepage' : notice.showOnHomepage ? 'homepage and student portal' : 'student portal';
  return res.status(201).json({
    message: `Notice published to ${scopeLabel}.`,
    notice,
  });
}

async function update(req, res) {
  const notice = await Notice.findByPk(req.params.id);
  if (!notice) return res.status(404).json({ message: 'Notice not found' });

  const wasActive = notice.isActive;
  const allowed = [
    'title',
    'content',
    'priority',
    'targetAudience',
    'targetDepartment',
    'isActive',
    'expiresAt',
  ];
  if (req.user.role === 'admin' && req.body.publishScope !== undefined) {
    const placement = resolveAdminPublishPlacement(req.body, 'admin');
    notice.showOnHomepage = placement.showOnHomepage;
    notice.homepageOnly = placement.homepageOnly;
  } else if (req.user.role === 'admin') {
    allowed.push('showOnHomepage', 'homepageOnly');
  }
  for (const k of allowed) {
    if (req.body[k] !== undefined) notice[k] = req.body[k];
  }
  if (notice.homepageOnly) {
    notice.showOnHomepage = true;
  }
  if (!notice.showOnHomepage) {
    notice.homepageOnly = false;
  }
  await notice.save();

  let emailDelivery = null;
  if (req.user.role === 'admin' && shouldDeliverNoticeToStudentPortal(notice) && notice.isActive && !wasActive) {
    try {
      await notifyUsersForNewNotice(notice, req.user.id);
      emailDelivery = await emailNoticeToVerifiedStudents(notice);
    } catch (err) {
      console.error('notice publish notify/email:', err);
    }
  }

  return res.json({ message: 'Notice updated', notice, emailDelivery });
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
  listPublicHomepage,
  list,
  getById,
  create,
  update,
  remove,
  markAsRead,
  markAllAsRead,
};

