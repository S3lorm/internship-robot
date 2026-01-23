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
  await Notification.update({ isRead: true }, { where: { userId: req.user.id, isRead: false } });
  return res.json({ message: 'All marked as read' });
}

async function remove(req, res) {
  const n = await Notification.findByPk(req.params.id);
  if (!n) return res.status(404).json({ message: 'Notification not found' });
  if (n.userId !== req.user.id) return res.status(403).json({ message: 'Access denied' });
  await n.destroy();
  return res.json({ message: 'Notification deleted' });
}

module.exports = { list, markRead, markReadAll, remove };

