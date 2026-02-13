const { User, Internship, Application, Notice, Op } = require('../models');

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
  // Get all applications and group by status
  const allApplications = await Application.findAll({});
  const byStatus = {};
  
  allApplications.forEach(app => {
    if (!byStatus[app.status]) {
      byStatus[app.status] = 0;
    }
    byStatus[app.status]++;
  });
  
  // Convert to array format
  const byStatusArray = Object.entries(byStatus).map(([status, count]) => ({
    status,
    count,
  }));
  
  return res.json({ byStatus: byStatusArray });
}

async function internships(req, res) {
  // Get all internships and group by status
  const allInternships = await Internship.findAll({});
  const byStatus = {};
  
  allInternships.forEach(internship => {
    if (!byStatus[internship.status]) {
      byStatus[internship.status] = 0;
    }
    byStatus[internship.status]++;
  });
  
  // Convert to array format
  const byStatusArray = Object.entries(byStatus).map(([status, count]) => ({
    status,
    count,
  }));
  
  // Get upcoming deadlines
  const now = new Date();
  const upcomingDeadlines = allInternships
    .filter(internship => new Date(internship.deadline) >= now)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 10);
  
  return res.json({ byStatus: byStatusArray, upcomingDeadlines });
}

async function users(req, res) {
  // Get all users and group by role
  const allUsers = await User.findAll({});
  const byRole = {};
  
  allUsers.forEach(user => {
    if (!byRole[user.role]) {
      byRole[user.role] = 0;
    }
    byRole[user.role]++;
  });
  
  // Convert to array format
  const byRoleArray = Object.entries(byRole).map(([role, count]) => ({
    role,
    count,
  }));
  
  return res.json({ byRole: byRoleArray });
}

module.exports = { dashboard, applications, internships, users };

