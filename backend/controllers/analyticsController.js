const { Op } = require('sequelize');
const { User, Internship, Application, Notice } = require('../models');

async function dashboard(req, res) {
  const [users, internships, applications, notices] = await Promise.all([
    User.count(),
    Internship.count(),
    Application.count(),
    Notice.count(),
  ]);
  return res.json({ users, internships, applications, notices });
}

async function applications(req, res) {
  const byStatus = await Application.findAll({
    attributes: ['status', [Application.sequelize.fn('COUNT', '*'), 'count']],
    group: ['status'],
  });
  return res.json({ byStatus });
}

async function internships(req, res) {
  const byStatus = await Internship.findAll({
    attributes: ['status', [Internship.sequelize.fn('COUNT', '*'), 'count']],
    group: ['status'],
  });
  const upcomingDeadlines = await Internship.findAll({
    where: { deadline: { [Op.gte]: new Date() } },
    order: [['deadline', 'ASC']],
    limit: 10,
  });
  return res.json({ byStatus, upcomingDeadlines });
}

async function users(req, res) {
  const byRole = await User.findAll({
    attributes: ['role', [User.sequelize.fn('COUNT', '*'), 'count']],
    group: ['role'],
  });
  return res.json({ byRole });
}

module.exports = { dashboard, applications, internships, users };

