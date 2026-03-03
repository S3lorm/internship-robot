const { Notification } = require('../models');

async function list(req, res) {
  const notifications = await Notification.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
  });
  return res.json({ data: notifications });
}

async function markRead(req, res) {
  const n = await Notification.findByPk(req.params.id);
  if (!n) return res.status(404).json({ message: 'Notification not found' });
  if (n.userId !== req.user.id) return res.status(403).json({ message: 'Access denied' });
  n.isRead = true;
  await n.save();
  return res.json({ message: 'Marked as read' });
}

async function markReadAll(req, res) {
  try {
    const unreadNotifications = await Notification.findAll({
      where: { userId: req.user.id, isRead: false }
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
  const n = await Notification.findByPk(req.params.id);
  if (!n) return res.status(404).json({ message: 'Notification not found' });
  if (n.userId !== req.user.id) return res.status(403).json({ message: 'Access denied' });
  await n.destroy();
  return res.json({ message: 'Notification deleted' });
}

module.exports = { list, markRead, markReadAll, remove };

