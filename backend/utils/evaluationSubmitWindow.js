const config = require('../config/config');

const SUBMIT_WINDOW_DAYS = 14;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Days from today (start of day) until internship end (start of day); negative if ended. */
function getDaysUntilInternshipEnd(placement) {
  if (!placement?.internshipEndDate) return null;
  const today = startOfDay(new Date());
  const endDate = startOfDay(placement.internshipEndDate);
  return Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** Supervisors may submit only within SUBMIT_WINDOW_DAYS before internship end (unless bypassed). */
function isEvaluationSubmitWindowOpen(placement) {
  if (config.evaluationBypassSubmitWindow) return true;
  const daysUntilEnd = getDaysUntilInternshipEnd(placement);
  if (daysUntilEnd === null) return true;
  return daysUntilEnd <= SUBMIT_WINDOW_DAYS;
}

module.exports = {
  SUBMIT_WINDOW_DAYS,
  getDaysUntilInternshipEnd,
  isEvaluationSubmitWindowOpen,
};
