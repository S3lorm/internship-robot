const config = require('../config/config');

function startOfDay(value) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateInput(value) {
  if (!value) return '';
  const d = startOfDay(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function placementStart(placement) {
  return placement?.internship_start_date || placement?.internshipStartDate || null;
}

function placementEnd(placement) {
  return placement?.internship_end_date || placement?.internshipEndDate || null;
}

function computeTotalWeeks(placement) {
  const startRaw = placementStart(placement);
  const endRaw = placementEnd(placement);
  if (!startRaw || !endRaw) return 6;

  const start = startOfDay(startRaw);
  const end = startOfDay(endRaw);
  if (end < start) return 1;

  const days = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  return Math.max(1, Math.min(52, Math.ceil(days / 7)));
}

function getWeekDateRange(placement, weekNumber) {
  const startRaw = placementStart(placement);
  const endRaw = placementEnd(placement);
  const week = Math.max(1, Number(weekNumber) || 1);

  if (!startRaw) {
    return { weekBeginning: '', weekEnding: '' };
  }

  const placementStartDay = startOfDay(startRaw);
  const weekBeginning = new Date(placementStartDay);
  weekBeginning.setDate(weekBeginning.getDate() + (week - 1) * 7);

  let weekEnding = new Date(weekBeginning);
  weekEnding.setDate(weekEnding.getDate() + 6);

  if (endRaw) {
    const placementEndDay = startOfDay(endRaw);
    if (weekEnding > placementEndDay) weekEnding = placementEndDay;
    if (weekBeginning > placementEndDay) weekBeginning = new Date(placementEndDay);
  }

  return {
    weekBeginning: toDateInput(weekBeginning),
    weekEnding: toDateInput(weekEnding),
  };
}

/** When false, only the calendar week that contains today may be saved. */
function isWeekScheduleBypassed() {
  return config.weeklyLogbookBypassWeekSchedule === true;
}

function isWeekOpenForEntry(placement, weekNumber) {
  if (isWeekScheduleBypassed()) return true;

  const startRaw = placementStart(placement);
  const endRaw = placementEnd(placement);
  if (!startRaw || !endRaw) return Number(weekNumber) === 1;

  const today = startOfDay(new Date());
  const placementStartDay = startOfDay(startRaw);
  const placementEndDay = startOfDay(endRaw);
  if (today < placementStartDay || today > placementEndDay) return false;

  const { weekBeginning, weekEnding } = getWeekDateRange(placement, weekNumber);
  if (!weekBeginning || !weekEnding) return false;

  const openStart = startOfDay(weekBeginning);
  const openEnd = startOfDay(weekEnding);
  return today >= openStart && today <= openEnd;
}

function getCurrentOpenWeekNumber(placement) {
  const total = computeTotalWeeks(placement);
  for (let w = 1; w <= total; w += 1) {
    if (isWeekOpenForEntry(placement, w)) return w;
  }
  return null;
}

function assertWeekEntryAllowed(placement, weekNumber) {
  if (isWeekOpenForEntry(placement, weekNumber)) return;
  const err = new Error(
    `Week ${weekNumber} is not open yet. You can only complete that week's log sheet during its calendar week.`
  );
  err.status = 403;
  throw err;
}

function buildWeeklyLogSchedule(placement) {
  const totalWeeks = computeTotalWeeks(placement);
  const bypassWeekSchedule = isWeekScheduleBypassed();
  const weeks = [];

  for (let weekNumber = 1; weekNumber <= totalWeeks; weekNumber += 1) {
    const range = getWeekDateRange(placement, weekNumber);
    weeks.push({
      weekNumber,
      weekBeginning: range.weekBeginning,
      weekEnding: range.weekEnding,
      isOpen: isWeekOpenForEntry(placement, weekNumber),
    });
  }

  return {
    bypassWeekSchedule,
    totalWeeks,
    currentOpenWeek: bypassWeekSchedule ? null : getCurrentOpenWeekNumber(placement),
    weeks,
  };
}

module.exports = {
  buildWeeklyLogSchedule,
  computeTotalWeeks,
  getWeekDateRange,
  isWeekOpenForEntry,
  assertWeekEntryAllowed,
  isWeekScheduleBypassed,
};
