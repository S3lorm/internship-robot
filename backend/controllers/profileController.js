const bcrypt = require('bcryptjs');
const path = require('path');
const { User } = require('../models');
const { safeUnlink } = require('../services/fileService');

async function get(req, res) {
  return res.json({ user: req.user });
}

async function update(req, res) {
  const user = await User.findByPk(req.user.id);
  const allowed = ['firstName', 'lastName', 'phone', 'department', 'program', 'yearOfStudy', 'bio', 'skills'];
  for (const k of allowed) {
    if (req.body[k] !== undefined) user[k] = req.body[k];
  }
  await user.save();
  const safe = user.toJSON();
  delete safe.password;
  return res.json({ message: 'Profile updated', user: safe });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findByPk(req.user.id);
  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) return res.status(400).json({ message: 'Current password is incorrect' });
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  return res.json({ message: 'Password updated' });
}

async function uploadAvatar(req, res) {
  const user = await User.findByPk(req.user.id);
  if (user.avatar) safeUnlink(path.resolve(user.avatar));
  user.avatar = req.file.path;
  await user.save();
  const safe = user.toJSON();
  delete safe.password;
  return res.json({ message: 'Avatar uploaded', user: safe });
}

async function removeAvatar(req, res) {
  const user = await User.findByPk(req.user.id);
  if (user.avatar) safeUnlink(path.resolve(user.avatar));
  user.avatar = null;
  await user.save();
  return res.json({ message: 'Avatar removed' });
}

module.exports = { get, update, changePassword, uploadAvatar, removeAvatar };

