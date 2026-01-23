const { Application, Internship, User } = require('../models');
const { sendApplicationStatusEmail } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');

function parsePagination(req) {
  const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
  const limit = req.query.limit ? Math.min(100, Math.max(1, Number(req.query.limit))) : 20;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

async function list(req, res) {
  const { page, limit, offset } = parsePagination(req);
  const where = {};
  if (req.user.role === 'student') where.studentId = req.user.id;
  if (req.query.status) where.status = req.query.status;

  const { rows, count } = await Application.findAndCountAll({
    where,
    include: [
      { model: Internship },
      { model: User, as: 'student', attributes: ['id', 'firstName', 'lastName', 'email', 'studentId'] },
      { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
    limit,
    offset,
    order: [['applied_at', 'DESC']],
  });
  return res.json({ data: rows, meta: { page, limit, total: count } });
}

async function my(req, res) {
  const apps = await Application.findAll({
    where: { studentId: req.user.id },
    include: [{ model: Internship }],
    order: [['applied_at', 'DESC']],
  });
  return res.json({ data: apps });
}

async function getById(req, res) {
  const app = await Application.findByPk(req.params.id, {
    include: [
      { model: Internship },
      { model: User, as: 'student', attributes: ['id', 'firstName', 'lastName', 'email', 'studentId'] },
      { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
  });
  if (!app) return res.status(404).json({ message: 'Application not found' });
  if (req.user.role === 'student' && app.studentId !== req.user.id) return res.status(403).json({ message: 'Access denied' });
  return res.json({ application: app });
}

async function submit(req, res) {
  const { internshipId, coverLetter } = req.body;
  const studentId = req.user.id;

  const internship = await Internship.findByPk(internshipId);
  if (!internship || internship.status !== 'open') return res.status(400).json({ message: 'Internship not available' });
  if (new Date(internship.deadline) < new Date()) return res.status(400).json({ message: 'Application deadline has passed' });

  const existing = await Application.findOne({ where: { studentId, internshipId } });
  if (existing) return res.status(400).json({ message: 'You have already applied' });

  const application = await Application.create({
    studentId,
    internshipId,
    coverLetter,
    cvUrl: req.file ? req.file.path : null,
    status: 'pending',
  });

  return res.status(201).json({ message: 'Application submitted successfully', application });
}

async function updateStatus(req, res) {
  const { status, feedback } = req.body;
  const application = await Application.findByPk(req.params.id, {
    include: [
      { model: User, as: 'student' },
      { model: Internship },
    ],
  });
  if (!application) return res.status(404).json({ message: 'Application not found' });

  application.status = status;
  application.feedback = feedback;
  application.reviewedBy = req.user.id;
  application.reviewedAt = new Date();
  await application.save();

  try {
    await sendApplicationStatusEmail(application.student, application, application.Internship);
  } catch (_e) {
    // ignore
  }

  await createNotification({
    userId: application.studentId,
    type: 'application_status',
    title: 'Application Status Updated',
    message: `Your application for ${application.Internship.title} has been ${status}`,
    relatedId: application.id,
  });

  return res.json({ message: 'Application status updated', application });
}

async function bulkAction(req, res) {
  const { ids, status, feedback } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'ids is required' });

  const apps = await Application.findAll({
    where: { id: ids },
    include: [{ model: User, as: 'student' }, { model: Internship }],
  });

  for (const a of apps) {
    a.status = status;
    if (feedback !== undefined) a.feedback = feedback;
    a.reviewedBy = req.user.id;
    a.reviewedAt = new Date();
    await a.save();
    await createNotification({
      userId: a.studentId,
      type: 'application_status',
      title: 'Application Status Updated',
      message: `Your application for ${a.Internship.title} has been ${status}`,
      relatedId: a.id,
    });
  }

  return res.json({ message: 'Bulk action completed', updated: apps.length });
}

async function exportCsv(_req, res) {
  const apps = await Application.findAll({ include: [{ model: Internship }, { model: User, as: 'student' }] });
  const header = ['id', 'studentId', 'internshipId', 'status', 'appliedAt', 'reviewedAt'];
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = apps.map((a) => header.map((k) => escape(a.get(k))).join(','));
  const csv = [header.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="applications.csv"');
  return res.send(csv);
}

module.exports = { list, my, getById, submit, updateStatus, bulkAction, exportCsv };

