import type { WeeklyLogSheetValues } from "@/components/weekly-log-sheet";
import {
  WEEKLY_LOG_ACTIVITY_ROWS,
  emptyWeeklyActivities,
  toDateInputValue,
} from "@/components/weekly-log-sheet";
import {
  applyWeekRangesToActivities,
  groupWeekNumbersIntoPages,
} from "@/lib/weekly-logbook-weeks";
import type { WeeklyLogEntry, WeeklyLogbookBundle } from "@/types";
import { entryToSheetValues } from "@/lib/weekly-logbook-ui";

export type WeeklyLogWeekScheduleItem = {
  weekNumber: number;
  weekBeginning: string;
  weekEnding: string;
  isOpen: boolean;
};

export type WeeklyLogSchedule = {
  bypassWeekSchedule: boolean;
  totalWeeks: number;
  currentOpenWeek: number | null;
  weeks: WeeklyLogWeekScheduleItem[];
};

export type WeeklyLogPageDraft = {
  pageNumber: number;
  firstWeekNumber: number;
  /** Number of week rows on this page (1–5). */
  weekCount: number;
  values: WeeklyLogSheetValues;
};

function placementPeriod(bundle: WeeklyLogbookBundle): {
  start: string;
  end: string;
} {
  const placement = bundle.placement || {};
  return {
    start: toDateInputValue(
      placement.internship_start_date || placement.internshipStartDate
    ),
    end: toDateInputValue(placement.internship_end_date || placement.internshipEndDate),
  };
}

function buildPageValues(
  bundle: WeeklyLogbookBundle,
  periodStart: string,
  periodEnd: string,
  firstWeekNumber: number,
  weekCount: number,
  entryByWeek: Map<number, WeeklyLogEntry>
): WeeklyLogSheetValues {
  const activities = emptyWeeklyActivities();

  for (let i = 0; i < weekCount; i += 1) {
    const weekNum = firstWeekNumber + i;
    const existing = entryByWeek.get(weekNum);
    if (existing) {
      const sheet = entryToSheetValues(existing);
      activities[i] = {
        date: sheet.weekBeginning || sheet.activities[0]?.date || "",
        day: sheet.weekEnding || sheet.activities[0]?.day || "",
        activity:
          sheet.activities.map((a) => a.activity.trim()).filter(Boolean).join("\n\n") ||
          sheet.activities[0]?.activity ||
          "",
      };
    }
  }

  const withDates =
    periodStart && periodEnd
      ? applyWeekRangesToActivities(
          periodStart,
          periodEnd,
          firstWeekNumber,
          activities,
          weekCount
        )
      : activities.slice(0, weekCount);

  for (let i = 0; i < weekCount; i += 1) {
    const existing = entryByWeek.get(firstWeekNumber + i);
    if (existing && withDates[i]) {
      withDates[i] = {
        ...withDates[i],
        activity:
          existing.activities.map((a) => a.activity.trim()).filter(Boolean).join("\n\n") ||
          withDates[i].activity,
      };
    }
  }

  return {
    weekBeginning: periodStart,
    weekEnding: periodEnd,
    studentRemark: "",
    activities: withDates.slice(0, weekCount),
  };
}

export function buildPageDraftsFromBundle(
  bundle: WeeklyLogbookBundle,
  schedule: WeeklyLogSchedule
): WeeklyLogPageDraft[] {
  const { start: periodStart, end: periodEnd } = placementPeriod(bundle);
  const entryByWeek = new Map(bundle.entries.map((e) => [e.weekNumber, e]));
  const pageWeekGroups = groupWeekNumbersIntoPages(schedule.totalWeeks);

  return pageWeekGroups.map((weekNums, index) => {
    const firstWeekNumber = weekNums[0] ?? 1;
    const weekCount = weekNums.length;
    return {
      pageNumber: index + 1,
      firstWeekNumber,
      weekCount,
      values: buildPageValues(
        bundle,
        periodStart,
        periodEnd,
        firstWeekNumber,
        weekCount,
        entryByWeek
      ),
    };
  });
}

/** @deprecated Use buildPageDraftsFromBundle */
export function buildWeekDraftsFromBundle(
  bundle: WeeklyLogbookBundle,
  schedule: WeeklyLogSchedule
): Record<number, WeeklyLogSheetValues> {
  const drafts: Record<number, WeeklyLogSheetValues> = {};
  for (const page of buildPageDraftsFromBundle(bundle, schedule)) {
    for (let w = 0; w < page.weekCount; w += 1) {
      const weekNumber = page.firstWeekNumber + w;
      const row = page.values.activities[w];
      if (!row?.date) continue;
      drafts[weekNumber] = {
        weekBeginning: row.date,
        weekEnding: row.day,
        studentRemark: page.values.studentRemark,
        activities: [
          { date: row.date, day: row.day, activity: row.activity },
          ...emptyWeeklyActivities().slice(1),
        ],
      };
    }
  }
  return drafts;
}
