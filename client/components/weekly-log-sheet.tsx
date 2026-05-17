"use client";

import Image from "next/image";
import { Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  applyWeekRangesToActivities,
  computePageHeaderDates,
  computeWeekRangesForRows,
  countWeeksInPeriod,
  countWeeksOnPage,
  formatPaperDateRange,
} from "@/lib/weekly-logbook-weeks";
import type { WeeklyLogActivity } from "@/types";

export const WEEKLY_LOG_ACTIVITY_ROWS = 5;

export type WeeklyLogSheetMode =
  | "student-edit"
  | "student-locked"
  | "supervisor"
  | "readonly";

export type WeeklyLogSheetHeader = {
  studentName: string;
  programme: string;
  indexNo: string;
  organizationName: string;
  departmentOffice: string;
  departmentTitle: string;
};

export type WeeklyLogSheetValues = {
  weekBeginning: string;
  weekEnding: string;
  activities: WeeklyLogActivity[];
  studentRemark: string;
  supervisorRemark?: string;
  supervisorName?: string;
  supervisorStatus?: string;
};

type WeeklyLogSheetProps = {
  mode: WeeklyLogSheetMode;
  header: WeeklyLogSheetHeader;
  values: WeeklyLogSheetValues;
  onChange?: (values: WeeklyLogSheetValues) => void;
  weekLabel?: string;
  firstWeekNumber?: number;
  weekCount?: number;
  lockPeriodDates?: boolean;
  editableWeekNumbers?: number[];
  /** When false, hides supervisor remark/name/status (e.g. separate evaluation card). */
  showSupervisorSection?: boolean;
  className?: string;
};

export function emptyWeeklyActivities(): WeeklyLogActivity[] {
  return Array.from({ length: WEEKLY_LOG_ACTIVITY_ROWS }, () => ({
    day: "",
    date: "",
    activity: "",
  }));
}

export function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  const trimmed = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const iso = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return "";
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDisplayDate(value: string) {
  if (!value) return "";
  const iso = toDateInputValue(value);
  const parsed = iso ? new Date(`${iso}T12:00:00`) : new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function LockedHint({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[9px] font-semibold uppercase tracking-wide text-neutral-500">
      <Lock className="h-3 w-3 shrink-0" aria-hidden />
      {label}
    </span>
  );
}

function RemarkBlock({
  label,
  hint,
  locked,
  editable,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  hint?: React.ReactNode;
  locked?: boolean;
  editable: boolean;
  value: string;
  onChange?: (value: string) => void;
  rows?: number;
}) {
  const lineClass =
    "min-h-[3.25rem] w-full resize-none rounded-none border border-dashed border-black/60 bg-white px-2 py-1.5 text-sm leading-relaxed text-black shadow-none focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black/20";

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-black">{label}</span>
        {hint}
        {locked && <LockedHint label="Locked" />}
      </div>
      {editable ? (
        <Textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={lineClass}
          rows={rows}
        />
      ) : (
        <p className="min-h-[3.25rem] border border-dashed border-black/60 bg-white px-2 py-1.5 whitespace-pre-wrap text-sm leading-relaxed">
          {value || "\u00a0"}
        </p>
      )}
    </div>
  );
}

function FieldLine({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-black">
        {label}:
      </span>
      {children ?? (
        <span className="min-h-[1.35rem] flex-1 border-b border-dotted border-black/70 pb-0.5 text-sm font-medium text-black">
          {value || "\u00a0"}
        </span>
      )}
    </div>
  );
}

export function WeeklyLogSheet({
  mode,
  header,
  values,
  onChange,
  weekLabel,
  firstWeekNumber = 1,
  weekCount: weekCountProp,
  lockPeriodDates = false,
  editableWeekNumbers,
  showSupervisorSection = true,
  className,
}: WeeklyLogSheetProps) {
  const studentEditable = mode === "student-edit";
  const supervisorEditable = mode === "supervisor";
  const studentLocked = mode === "student-locked" || mode === "supervisor" || mode === "readonly";
  const supervisorLocked = !supervisorEditable;
  const periodLocked = lockPeriodDates && studentEditable;

  const patch = (partial: Partial<WeeklyLogSheetValues>) => {
    onChange?.({ ...values, ...partial });
  };

  const patchActivityRow = (index: number, partial: Partial<WeeklyLogActivity>) => {
    const activities = values.activities.map((row, i) =>
      i === index ? { ...row, ...partial } : row
    );
    patch({ activities });
  };

  const periodStart = toDateInputValue(values.weekBeginning);
  const periodEnd = toDateInputValue(values.weekEnding);
  const totalWeeks = countWeeksInPeriod(periodStart, periodEnd);
  const rowsOnPage =
    weekCountProp ??
    (countWeeksOnPage(totalWeeks, firstWeekNumber) || values.activities.length || 1);

  const patchPeriodRange = (
    partial: Partial<Pick<WeeklyLogSheetValues, "weekBeginning" | "weekEnding">>
  ) => {
    const next = { ...values, ...partial };
    const ps = toDateInputValue(next.weekBeginning);
    const pe = toDateInputValue(next.weekEnding);
    if (ps && pe && ps <= pe) {
      const count =
        weekCountProp ??
        (countWeeksInPeriod(ps, pe) > 0
          ? countWeeksOnPage(countWeeksInPeriod(ps, pe), firstWeekNumber)
          : next.activities.length || 1);
      next.activities = applyWeekRangesToActivities(
        ps,
        pe,
        firstWeekNumber,
        next.activities,
        count
      );
    }
    onChange?.(next);
  };

  const pageHeader = computePageHeaderDates(periodStart, periodEnd, firstWeekNumber);

  const weekRanges = computeWeekRangesForRows(
    periodStart,
    periodEnd,
    firstWeekNumber,
    rowsOnPage
  );

  const rows = weekRanges.map((range, index) => {
    const activity = values.activities[index] || { day: "", date: "", activity: "" };
    const start = toDateInputValue(activity.date) || range.start;
    const end = toDateInputValue(activity.day) || range.end;
    return {
      index,
      activity,
      weekNumber: range.weekNumber,
      start,
      end,
    };
  });

  const underlineInput =
    "h-9 w-full border-0 border-b border-dotted border-black/80 rounded-none bg-transparent px-0 text-sm text-black shadow-none focus-visible:border-black focus-visible:ring-0";
  const activityInput =
    "min-h-[4.5rem] w-full resize-none border-0 bg-transparent p-0 text-sm leading-relaxed text-black shadow-none placeholder:text-black/40 focus-visible:ring-0";

  return (
    <article
      className={cn(
        "logsheet-paper relative mx-auto w-full max-w-[820px] bg-white font-serif text-black shadow-md print:max-w-none print:shadow-none",
        className
      )}
    >
      <div className="border border-black p-6 md:p-8">
        <header className="relative mb-5 border-b border-black/20 pb-4">
          <div className="absolute right-0 top-0 h-14 w-14 sm:h-16 sm:w-16">
            <Image
              src="/rmu-logo.png"
              alt="Regional Maritime University"
              width={64}
              height={64}
              className="h-full w-full object-contain"
              priority
            />
          </div>

          <div className="pr-16 text-center">
            <p className="text-base font-bold uppercase tracking-wide md:text-lg">
              Regional Maritime University
            </p>
            <p className="mt-0.5 text-xs font-bold uppercase md:text-sm">
              {header.departmentTitle}
            </p>
            <p className="text-xs font-bold uppercase md:text-sm">
              Student &amp; Industrial Training Programme
            </p>
            <h2 className="mt-2 text-sm font-bold underline underline-offset-[3px] md:text-base">
              Weekly Log Sheet
              {weekLabel ? (
                <span className="block text-[10px] font-semibold no-underline">{weekLabel}</span>
              ) : null}
            </h2>
          </div>
        </header>

        <section className="space-y-2.5 text-sm">
          <FieldLine label="Name of Student" value={header.studentName || "—"} />
          <FieldLine label="Programme" value={header.programme || "—"} />
          <FieldLine label="Index No" value={header.indexNo || "—"} />
          <FieldLine label="Name of Organisation" value={header.organizationName || "—"} />
          <FieldLine label="Department/Office" value={header.departmentOffice || "—"} />

          <div className="grid gap-2 pt-1 sm:grid-cols-2">
            <FieldLine label="Week Beginning">
              {studentEditable && !periodLocked ? (
                <Input
                  type="date"
                  value={toDateInputValue(values.weekBeginning)}
                  onChange={(e) => patchPeriodRange({ weekBeginning: e.target.value })}
                  className={cn(underlineInput, "flex-1 [color-scheme:light]")}
                />
              ) : (
                <span className="min-h-[1.35rem] flex-1 border-b border-dotted border-black/70 pb-0.5 text-sm font-medium">
                  {pageHeader.weekBeginning
                    ? formatPaperDateRange(
                        pageHeader.weekBeginning,
                        pageHeader.weekBeginning
                      )
                    : "—"}
                </span>
              )}
            </FieldLine>
            <FieldLine label="Week Ending">
              {studentEditable && !periodLocked ? (
                <Input
                  type="date"
                  value={toDateInputValue(values.weekEnding)}
                  onChange={(e) => patchPeriodRange({ weekEnding: e.target.value })}
                  className={cn(underlineInput, "flex-1 [color-scheme:light]")}
                />
              ) : (
                <span className="min-h-[1.35rem] flex-1 border-b border-dotted border-black/70 pb-0.5 text-sm font-medium">
                  {pageHeader.weekEnding
                    ? formatPaperDateRange(pageHeader.weekEnding, pageHeader.weekEnding)
                    : "—"}
                </span>
              )}
            </FieldLine>
          </div>
        </section>

        <div className="mt-5 overflow-x-auto border border-black">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-[38%] border-b border-r border-black bg-white px-2 py-2 text-center text-[11px] font-bold uppercase">
                  Day / Date
                </th>
                <th className="border-b border-black bg-white px-2 py-2 text-center text-[11px] font-bold uppercase">
                  Activities Undertaken
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ index, activity, weekNumber, start, end }) => {
                const dateLabel =
                  start && end
                    ? formatPaperDateRange(start, end)
                    : start || end
                      ? formatPaperDateRange(start || end, end || start)
                      : "";
                const rowEditable =
                  studentEditable &&
                  (!editableWeekNumbers || editableWeekNumbers.includes(weekNumber));

                return (
                  <tr key={index} className="border-b border-black last:border-b-0">
                    <td className="border-r border-black align-top px-2 py-2">
                      <p className="min-h-[4.5rem] text-sm font-medium leading-snug">
                        {dateLabel || "\u00a0"}
                      </p>
                    </td>
                    <td className="align-top px-2 py-2">
                      {rowEditable ? (
                        <Textarea
                          value={activity.activity}
                          onChange={(e) =>
                            patchActivityRow(index, { activity: e.target.value })
                          }
                          placeholder="List activities for this week…"
                          className={activityInput}
                          rows={4}
                        />
                      ) : (
                        <p className="min-h-[4.5rem] whitespace-pre-wrap text-sm leading-relaxed">
                          {activity.activity || "\u00a0"}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <footer className="mt-6 space-y-5 border-t border-black/20 pt-5 text-sm">
          <RemarkBlock
            label="Student's Remarks"
            locked={studentLocked}
            editable={studentEditable}
            value={values.studentRemark}
            onChange={(v) => patch({ studentRemark: v })}
            rows={3}
          />

          {showSupervisorSection && (
            <>
          <RemarkBlock
            label="Supervisor's Remarks"
            locked={studentLocked}
            editable={supervisorEditable}
            value={values.supervisorRemark || ""}
            onChange={(v) => patch({ supervisorRemark: v })}
            hint={
              supervisorLocked ? (
                <LockedHint label="Supervisor only" />
              ) : (
                <span className="whitespace-nowrap text-[9px] font-semibold uppercase tracking-wide text-primary">
                  Fill below
                </span>
              )
            }
            rows={3}
          />

          <div className="space-y-4">
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wide text-black">
                  Name of Supervisor
                </span>
                {supervisorLocked && <LockedHint label="Supervisor only" />}
              </div>
              {supervisorEditable ? (
                <Input
                  value={values.supervisorName || ""}
                  onChange={(e) => patch({ supervisorName: e.target.value })}
                  className={underlineInput}
                />
              ) : (
                <p className="min-h-[2rem] border-b border-dotted border-black/80 pb-1 text-sm">
                  {values.supervisorName || "\u00a0"}
                </p>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wide text-black">
                  Status
                </span>
                {supervisorLocked && <LockedHint label="Supervisor only" />}
              </div>
              {supervisorEditable ? (
                <Input
                  value={values.supervisorStatus || ""}
                  placeholder="e.g. Satisfactory"
                  onChange={(e) => patch({ supervisorStatus: e.target.value })}
                  className={cn(underlineInput, "max-w-md")}
                />
              ) : (
                <p className="min-h-[2rem] max-w-md border-b border-dotted border-black/80 pb-1 text-sm">
                  {values.supervisorStatus || "\u00a0"}
                </p>
              )}
            </div>
          </div>
            </>
          )}
        </footer>
      </div>
    </article>
  );
}
