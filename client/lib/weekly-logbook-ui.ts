import { WEEKLY_LOG_ACTIVITY_ROWS, toDateInputValue } from "@/components/weekly-log-sheet";
import type { WeeklyLogSheetHeader, WeeklyLogSheetValues } from "@/components/weekly-log-sheet";
import type { WeeklyLogEntry, WeeklyLogbookBundle } from "@/types";

export function sheetHeaderFromBundle(bundle: WeeklyLogbookBundle): WeeklyLogSheetHeader {
  const student = bundle.student || ({} as WeeklyLogbookBundle["student"]);
  const placement = bundle.placement || {};
  const department = student.department || "Industrial Training";

  return {
    studentName: `${student.firstName || ""} ${student.lastName || ""}`.trim() || "—",
    programme: student.program || "—",
    indexNo: student.studentId || "—",
    organizationName: placement.organization_name || "—",
    departmentOffice: placement.department_role || "—",
    departmentTitle: department.toLowerCase().startsWith("department")
      ? department
      : `Department of ${department}`,
  };
}

export function entryToSheetValues(entry: WeeklyLogEntry): WeeklyLogSheetValues {
  const activities = [...(entry.activities || [])];
  while (activities.length < WEEKLY_LOG_ACTIVITY_ROWS) {
    activities.push({ day: "", date: "", activity: "" });
  }

  return {
    weekBeginning: toDateInputValue(entry.weekBeginning),
    weekEnding: toDateInputValue(entry.weekEnding),
    activities: activities.slice(0, WEEKLY_LOG_ACTIVITY_ROWS),
    studentRemark: entry.studentRemark || "",
    supervisorRemark: entry.supervisorRemark,
    supervisorName: entry.supervisorName,
    supervisorStatus: entry.supervisorStatus,
  };
}
