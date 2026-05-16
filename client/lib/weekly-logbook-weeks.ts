import {
  WEEKLY_LOG_ACTIVITY_ROWS,
  toDateInputValue,
} from "@/components/weekly-log-sheet";
import type { WeeklyLogActivity } from "@/types";

export type ComputedWeekRange = {
  weekNumber: number;
  start: string;
  end: string;
};

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0);
}

function formatLocalIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

/** One internship week: start + (weekNumber - 1) * 7 days, end = start + 6 (capped at periodEnd). */
export function computeWeekRange(
  periodStart: string,
  weekNumber: number,
  periodEnd: string
): { start: string; end: string } | null {
  const ps = toDateInputValue(periodStart);
  const pe = toDateInputValue(periodEnd);
  if (!ps || !pe || ps > pe || weekNumber < 1) return null;

  const placementStart = parseLocalDate(ps);
  const placementEnd = parseLocalDate(pe);

  const weekStart = addDays(placementStart, (weekNumber - 1) * 7);
  if (weekStart > placementEnd) return null;

  let weekEnd = addDays(weekStart, 6);
  if (weekEnd > placementEnd) weekEnd = placementEnd;

  return {
    start: formatLocalIso(weekStart),
    end: formatLocalIso(weekEnd),
  };
}

export function countWeeksInPeriod(periodStart: string, periodEnd: string): number {
  const ps = toDateInputValue(periodStart);
  const pe = toDateInputValue(periodEnd);
  if (!ps || !pe || ps > pe) return 0;

  let count = 0;
  for (let w = 1; w <= 52; w += 1) {
    if (!computeWeekRange(ps, w, pe)) break;
    count = w;
  }
  return count;
}

/** How many week rows belong on one sheet page (max 5, fewer if internship is shorter). */
export function countWeeksOnPage(
  totalWeeks: number,
  firstWeekNumber: number,
  pageSize: number = WEEKLY_LOG_ACTIVITY_ROWS
): number {
  if (totalWeeks < 1 || firstWeekNumber < 1 || firstWeekNumber > totalWeeks) return 0;
  return Math.min(pageSize, totalWeeks - firstWeekNumber + 1);
}

export function computeWeekRangesForRows(
  periodStart: string,
  periodEnd: string,
  firstWeekNumber: number,
  rowCount: number = WEEKLY_LOG_ACTIVITY_ROWS
): ComputedWeekRange[] {
  const ranges: ComputedWeekRange[] = [];
  for (let i = 0; i < rowCount; i += 1) {
    const weekNumber = firstWeekNumber + i;
    const range = computeWeekRange(periodStart, weekNumber, periodEnd);
    if (!range) break;
    ranges.push({ weekNumber, start: range.start, end: range.end });
  }
  return ranges;
}

function ordinalDay(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[day % 10] || "th";
  return `${day}${suffix}`;
}

/** Matches the handwritten log sheet style (e.g. 14th July – 18th July). */
export function formatPaperDateRange(start: string, end: string): string {
  const formatOne = (iso: string, includeYear = false) => {
    const parsed = parseLocalDate(toDateInputValue(iso));
    if (Number.isNaN(parsed.getTime())) return iso;
    const month = parsed.toLocaleDateString("en-GB", { month: "long" });
    const year = parsed.getFullYear();
    const base = `${ordinalDay(parsed.getDate())} ${month}`;
    return includeYear ? `${base}, ${year}` : base;
  };
  const s = toDateInputValue(start);
  const e = toDateInputValue(end);
  if (!s && !e) return "";
  if (!s) return formatOne(e, true);
  if (!e) return formatOne(s, true);
  if (s === e) return formatOne(s, true);

  const startDate = parseLocalDate(s);
  const endDate = parseLocalDate(e);
  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  const sameMonth = sameYear && startDate.getMonth() === endDate.getMonth();

  if (sameMonth) {
    return `${ordinalDay(startDate.getDate())} – ${formatOne(e, true)}`;
  }
  if (sameYear) {
    return `${formatOne(s, false)} – ${formatOne(e, true)}`;
  }
  return `${formatOne(s, true)} – ${formatOne(e, true)}`;
}

export function formatWeekRangeLabel(start: string, end: string): string {
  const label = formatPaperDateRange(start, end);
  return label || "—";
}

/** First and last week dates on a sheet page (for header Week Beginning / Week Ending). */
export function computePageHeaderDates(
  periodStart: string,
  periodEnd: string,
  firstWeekNumber: number,
  pageSize: number = WEEKLY_LOG_ACTIVITY_ROWS
): { weekBeginning: string; weekEnding: string } {
  const totalWeeks = countWeeksInPeriod(periodStart, periodEnd);
  const rowsOnPage = countWeeksOnPage(totalWeeks, firstWeekNumber, pageSize);
  const first = computeWeekRange(periodStart, firstWeekNumber, periodEnd);
  if (!first || rowsOnPage < 1) return { weekBeginning: "", weekEnding: "" };

  let lastEnd = first.end;
  for (let i = 0; i < rowsOnPage; i += 1) {
    const range = computeWeekRange(periodStart, firstWeekNumber + i, periodEnd);
    if (range) lastEnd = range.end;
  }
  return { weekBeginning: first.start, weekEnding: lastEnd };
}

/** Set each row's `date` = week start, `day` = week end (preserves activity text). */
export function applyWeekRangesToActivities(
  periodStart: string,
  periodEnd: string,
  firstWeekNumber: number,
  existing: WeeklyLogActivity[],
  rowCount: number = WEEKLY_LOG_ACTIVITY_ROWS
): WeeklyLogActivity[] {
  const ranges = computeWeekRangesForRows(periodStart, periodEnd, firstWeekNumber, rowCount);
  const rows = [...existing];
  while (rows.length < rowCount) rows.push({ day: "", date: "", activity: "" });

  return rows.slice(0, rowCount).map((row, i) => {
    const range = ranges[i];
    if (!range) return { ...row, date: "", day: "" };
    return {
      ...row,
      date: range.start,
      day: range.end,
    };
  });
}

export function groupWeekNumbersIntoPages(
  totalWeeks: number,
  pageSize: number = WEEKLY_LOG_ACTIVITY_ROWS
): number[][] {
  const pages: number[][] = [];
  for (let w = 1; w <= totalWeeks; w += pageSize) {
    const page: number[] = [];
    for (let i = 0; i < pageSize && w + i <= totalWeeks; i += 1) {
      page.push(w + i);
    }
    pages.push(page);
  }
  return pages.length > 0 ? pages : [[1]];
}
