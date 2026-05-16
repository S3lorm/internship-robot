"use client";

import Image from "next/image";
import { Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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
  className?: string;
};

export function emptyWeeklyActivities(): WeeklyLogActivity[] {
  return Array.from({ length: WEEKLY_LOG_ACTIVITY_ROWS }, () => ({
    day: "",
    date: "",
    activity: "",
  }));
}

function formatDisplayDate(value: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function LockedHint({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      <Lock className="h-3 w-3" />
      {label}
    </span>
  );
}

function LabelRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[minmax(0,11rem)_1fr] sm:items-end">
      <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      <div>{children}</div>
    </div>
  );
}

export function WeeklyLogSheet({
  mode,
  header,
  values,
  onChange,
  weekLabel,
  className,
}: WeeklyLogSheetProps) {
  const studentEditable = mode === "student-edit";
  const supervisorEditable = mode === "supervisor";
  const studentLocked = mode === "student-locked" || mode === "supervisor" || mode === "readonly";
  const supervisorLocked = !supervisorEditable;

  const patch = (partial: Partial<WeeklyLogSheetValues>) => {
    onChange?.({ ...values, ...partial });
  };

  const patchActivity = (index: number, key: keyof WeeklyLogActivity, value: string) => {
    const activities = values.activities.map((row, i) =>
      i === index ? { ...row, [key]: value } : row
    );
    patch({ activities });
  };

  const rows = Array.from({ length: WEEKLY_LOG_ACTIVITY_ROWS }, (_, index) => {
    const activity = values.activities[index] || { day: "", date: "", activity: "" };
    return { index, activity };
  });

  const underlineInput =
    "h-8 border-0 border-b border-dashed border-foreground/50 rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0";
  const underlineTextarea =
    "min-h-[72px] resize-none border-0 border-b border-dashed border-foreground/50 rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0";

  return (
    <article
      className={cn(
        "relative mx-auto max-w-4xl overflow-hidden border-2 border-foreground bg-white text-foreground shadow-lg print:shadow-none",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[url('/logsheet.png')] bg-[length:92%] bg-[center_12%] bg-no-repeat opacity-[0.05]"
      />

      <div className="relative z-10 p-5 md:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex-1 text-center">
            <p className="text-sm font-bold tracking-wide md:text-base">
              REGIONAL MARITIME UNIVERSITY
            </p>
            <p className="mt-1 text-xs font-semibold uppercase md:text-sm">
              {header.departmentTitle}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase md:text-sm">
              Student &amp; Industrial Training Programme
            </p>
            <p className="mt-2 text-sm font-bold underline underline-offset-4 md:text-base">
              Weekly Log Sheet{weekLabel ? ` — ${weekLabel}` : ""}
            </p>
          </div>
          <div className="hidden h-16 w-16 shrink-0 sm:block">
            <Image
              src="/rmu-logo.png"
              alt="RMU"
              width={64}
              height={64}
              className="h-16 w-16 object-contain"
            />
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <LabelRow label="Name of Student">
            <p className="min-h-8 border-b border-dashed border-foreground/60 pb-1">
              {header.studentName || "—"}
            </p>
          </LabelRow>
          <LabelRow label="Programme">
            <p className="min-h-8 border-b border-dashed border-foreground/60 pb-1">
              {header.programme || "—"}
            </p>
          </LabelRow>
          <LabelRow label="Index No">
            <p className="min-h-8 border-b border-dashed border-foreground/60 pb-1">
              {header.indexNo || "—"}
            </p>
          </LabelRow>
          <LabelRow label="Name of Organisation">
            <p className="min-h-8 border-b border-dashed border-foreground/60 pb-1">
              {header.organizationName || "—"}
            </p>
          </LabelRow>
          <LabelRow label="Department/Office">
            <p className="min-h-8 border-b border-dashed border-foreground/60 pb-1">
              {header.departmentOffice || "—"}
            </p>
          </LabelRow>

          <div className="grid gap-3 sm:grid-cols-2">
            <LabelRow label="Week Beginning">
              {studentEditable ? (
                <Input
                  type="date"
                  value={values.weekBeginning}
                  onChange={(e) => patch({ weekBeginning: e.target.value })}
                  className={underlineInput}
                />
              ) : (
                <p className="min-h-8 border-b border-dashed border-foreground/60 pb-1">
                  {formatDisplayDate(values.weekBeginning) || "—"}
                </p>
              )}
            </LabelRow>
            <LabelRow label="Week Ending">
              {studentEditable ? (
                <Input
                  type="date"
                  value={values.weekEnding}
                  onChange={(e) => patch({ weekEnding: e.target.value })}
                  className={underlineInput}
                />
              ) : (
                <p className="min-h-8 border-b border-dashed border-foreground/60 pb-1">
                  {formatDisplayDate(values.weekEnding) || "—"}
                </p>
              )}
            </LabelRow>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto border-2 border-foreground">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-foreground bg-muted/40">
                <th className="w-[34%] border-r-2 border-foreground p-3 text-left font-bold uppercase">
                  Day/Date
                </th>
                <th className="p-3 text-left font-bold uppercase">Activities Undertaken</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ index, activity }) => (
                <tr key={index} className="border-b border-foreground/70 last:border-b-0">
                  <td className="border-r border-foreground/70 p-2 align-top">
                    {studentEditable ? (
                      <Input
                        value={activity.date || activity.day}
                        placeholder="e.g. 14th July – 18th July"
                        onChange={(e) => {
                          patchActivity(index, "date", e.target.value);
                          patchActivity(index, "day", "");
                        }}
                        className={underlineInput}
                      />
                    ) : (
                      <p className="min-h-8 whitespace-pre-wrap">
                        {activity.date || activity.day || "—"}
                      </p>
                    )}
                  </td>
                  <td className="p-2 align-top">
                    {studentEditable ? (
                      <Textarea
                        value={activity.activity}
                        onChange={(e) => patchActivity(index, "activity", e.target.value)}
                        className={underlineTextarea}
                      />
                    ) : (
                      <p className="min-h-8 whitespace-pre-wrap">{activity.activity || "—"}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase">Student&apos;s Remarks</span>
              {studentLocked && <LockedHint label="Locked" />}
            </div>
            {studentEditable ? (
              <Textarea
                value={values.studentRemark}
                onChange={(e) => patch({ studentRemark: e.target.value })}
                className={underlineTextarea}
              />
            ) : (
              <p className="min-h-[72px] border-b border-dashed border-foreground/60 pb-1 whitespace-pre-wrap">
                {values.studentRemark || "—"}
              </p>
            )}
          </div>

          <div className={cn(supervisorLocked && "rounded-lg bg-muted/30 p-3")}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase">Supervisor&apos;s Remarks</span>
              {supervisorLocked ? (
                <LockedHint label="Supervisor only" />
              ) : (
                <span className="text-[10px] font-medium uppercase text-primary">Fill below</span>
              )}
            </div>
            {supervisorEditable ? (
              <Textarea
                value={values.supervisorRemark || ""}
                onChange={(e) => patch({ supervisorRemark: e.target.value })}
                className={underlineTextarea}
              />
            ) : (
              <p className="min-h-[72px] border-b border-dashed border-foreground/60 pb-1 whitespace-pre-wrap">
                {values.supervisorRemark || "—"}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className={cn(supervisorLocked && "rounded-lg bg-muted/30 p-3")}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase">Name of Supervisor</span>
                {supervisorLocked && <LockedHint label="Supervisor only" />}
              </div>
              {supervisorEditable ? (
                <Input
                  value={values.supervisorName || ""}
                  onChange={(e) => patch({ supervisorName: e.target.value })}
                  className={underlineInput}
                />
              ) : (
                <p className="min-h-8 border-b border-dashed border-foreground/60 pb-1">
                  {values.supervisorName || "—"}
                </p>
              )}
            </div>
            <div className={cn(supervisorLocked && "rounded-lg bg-muted/30 p-3")}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase">Status</span>
                {supervisorLocked && <LockedHint label="Supervisor only" />}
              </div>
              {supervisorEditable ? (
                <Input
                  value={values.supervisorStatus || ""}
                  placeholder="e.g. Satisfactory"
                  onChange={(e) => patch({ supervisorStatus: e.target.value })}
                  className={underlineInput}
                />
              ) : (
                <p className="min-h-8 border-b border-dashed border-foreground/60 pb-1">
                  {values.supervisorStatus || "—"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
