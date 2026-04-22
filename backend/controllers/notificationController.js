const { Notification } = require('../models');

async function list(req, res) {
  const notifications = await Notification.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
  });
  const now = Date.now();
  const active = notifications.filter((n) => {
    if (!n.expiresAt) return true;
    const t = new Date(n.expiresAt).getTime();
    return !Number.isNaN(t) && t > now;
  });
  return res.json({ data: active });
}

async function markRead(req, res) {
  const n = await Notification.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!n) return res.status(404).json({ message: 'Notification not found' });
  await Notification.update(n.id, { isRead: true });
  return res.json({ message: 'Marked as read' });
}

async function markReadAll(req, res) {
  try {
    const unreadNotifications = await Notification.findAll({
      where: { userId: req.user.id, isRead: false },
    });

    for (const n of unreadNotifications) {
      await Notification.update(n.id, { isRead: true });
    }

    return res.json({ message: 'All marked as read' });
  } catch (error) {
    console.error('Error in markReadAll:', error);
    return res.status(500).json({ message: 'Failed to mark all as read' });
  }
}

async function remove(req, res) {
  const n = await Notification.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!n) return res.status(404).json({ message: 'Notification not found' });
  await n.destroy();
  return res.json({ message: 'Notification deleted' });
}

module.exports = { list, markRead, markReadAll, remove };

