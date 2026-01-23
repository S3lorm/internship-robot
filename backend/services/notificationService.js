const { Notification } = require('../models');

async function createNotification(payload) {
  return await Notification.create(payload);
}

module.exports = { createNotification };

