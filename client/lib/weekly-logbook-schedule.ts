import type { WeeklyLogSheetValues } from "@/components/weekly-log-sheet";
import { emptyWeeklyActivities, toDateInputValue } from "@/components/weekly-log-sheet";
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

export function buildWeekDraftsFromBundle(
  bundle: WeeklyLogbookBundle,
  schedule: WeeklyLogSchedule
): Record<number, WeeklyLogSheetValues> {
  const drafts: Record<number, WeeklyLogSheetValues> = {};
  const entryByWeek = new Map(bundle.entries.map((e) => [e.weekNumber, e]));

  for (const week of schedule.weeks) {
    const existing: WeeklyLogEntry | undefined = entryByWeek.get(week.weekNumber);
    if (existing) {
      drafts[week.weekNumber] = entryToSheetValues(existing);
    } else {
      drafts[week.weekNumber] = {
        weekBeginning: toDateInputValue(week.weekBeginning),
        weekEnding: toDateInputValue(week.weekEnding),
        studentRemark: "",
        activities: emptyWeeklyActivities(),
      };
    }
  }

  return drafts;
}
