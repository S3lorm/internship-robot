const { runAllReminders } = require('../services/reminderService');
const { Evaluation, Logbook, Report, AdministrativeAction } = require('../models');
const { notifyEvaluationAvailable } = require('../services/reminderService');

// Manually trigger all reminders (Admin only)
async function triggerReminders(req, res) {
  try {
    const user = req.user;
    
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    await runAllReminders();
    
    res.json({ 
      message: 'Reminders triggered successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error triggering reminders:', error);
    res.status(500).json({ 
      message: 'Failed to trigger reminders', 
      error: error.message 
    });
  }
}

// Get upcoming deadlines for current user
async function getUpcomingDeadlines(req, res) {
  try {
    const user = req.user;
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get upcoming logbooks
    const logbooks = await Logbook.findAll({
      where: { studentId: user.id, status: 'pending' },
      order: [['submissionDeadline', 'ASC']],
    });

    // Get upcoming reports
    const reports = await Report.findAll({
      where: { studentId: user.id, status: 'pending' },
      order: [['submissionDeadline', 'ASC']],
    });

    // Get upcoming administrative actions
    const actions = await AdministrativeAction.findAll({
      where: { studentId: user.id, isCompleted: false, isRequired: true },
      order: [['dueDate', 'ASC']],
    });

    // Filter to only upcoming items (within 7 days)
    const upcomingLogbooks = logbooks.filter(l => {
      if (!l.submissionDeadline) return false;
      const deadline = new Date(l.submissionDeadline);
      return deadline <= sevenDaysFromNow && deadline >= now;
    });

    const upcomingReports = reports.filter(r => {
      if (!r.submissionDeadline) return false;
      const deadline = new Date(r.submissionDeadline);
      return deadline <= sevenDaysFromNow && deadline >= now;
    });

    const upcomingActions = actions.filter(a => {
      if (!a.dueDate) return false;
      const dueDate = new Date(a.dueDate);
      return dueDate <= sevenDaysFromNow && dueDate >= now;
    });

    res.json({
      logbooks: upcomingLogbooks,
      reports: upcomingReports,
      administrativeActions: upcomingActions,
    });
  } catch (error) {
    console.error('Error fetching upcoming deadlines:', error);
    res.status(500).json({ 
      message: 'Failed to fetch upcoming deadlines', 
      error: error.message 
    });
  }
}

// Get overdue items for current user
async function getOverdueItems(req, res) {
  try {
    const user = req.user;
    const now = new Date();

    // Get overdue logbooks
    const overdueLogbooks = await Logbook.findAll({
      where: { studentId: user.id, status: 'pending' },
      order: [['submissionDeadline', 'ASC']],
    });

    // Get overdue reports
    const overdueReports = await Report.findAll({
      where: { studentId: user.id, status: 'pending' },
      order: [['submissionDeadline', 'ASC']],
    });

    // Get overdue administrative actions
    const overdueActions = await AdministrativeAction.findAll({
      where: { studentId: user.id, isCompleted: false, isRequired: true },
      order: [['dueDate', 'ASC']],
    });

    // Filter to only overdue items
    const filteredLogbooks = overdueLogbooks.filter(l => {
      if (!l.submissionDeadline) return false;
      return new Date(l.submissionDeadline) < now;
    });

    const filteredReports = overdueReports.filter(r => {
      if (!r.submissionDeadline) return false;
      return new Date(r.submissionDeadline) < now;
    });

    const filteredActions = overdueActions.filter(a => {
      if (!a.dueDate) return false;
      return new Date(a.dueDate) < now;
    });

    res.json({
      logbooks: filteredLogbooks,
      reports: filteredReports,
      administrativeActions: filteredActions,
    });
  } catch (error) {
    console.error('Error fetching overdue items:', error);
    res.status(500).json({ 
      message: 'Failed to fetch overdue items', 
      error: error.message 
    });
  }
}

module.exports = {
  triggerReminders,
  getUpcomingDeadlines,
  getOverdueItems,
};


