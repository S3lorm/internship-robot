"use client";

import { useEffect, useMemo, useState } from "react";
import { weeklyLogbooksApi } from "@/lib/api";
import { entryToSheetValues, sheetHeaderFromBundle } from "@/lib/weekly-logbook-ui";
import {
  buildPageDraftsFromBundle,
  type WeeklyLogPageDraft,
  type WeeklyLogSchedule,
} from "@/lib/weekly-logbook-schedule";
import { computeWeekRange, countWeeksInPeriod } from "@/lib/weekly-logbook-weeks";
import type { WeeklyLogbookBundle } from "@/types";
import { WeeklyLogSheet, type WeeklyLogSheetValues } from "@/components/weekly-log-sheet";
import { formatWeekRangeLabel } from "@/lib/weekly-logbook-weeks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatStatusLabel } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  Send,
} from "lucide-react";
import { usePortalStatus } from "@/hooks/use-portal-status";
import { PORTAL_CLOSED_MESSAGE } from "@/lib/internship-portal";

const editableStatuses = ["draft", "ongoing", "rejected"];
const noCurrentPlacementMessage = "No approved official placement was found for this student.";

export default function WeeklyLogbookPage() {
  const { portal, loading: portalLoading } = usePortalStatus();
  const [bundle, setBundle] = useState<WeeklyLogbookBundle | null>(null);
  const [schedule, setSchedule] = useState<WeeklyLogSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingWeek, setSavingWeek] = useState<number | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [pageDrafts, setPageDrafts] = useState<WeeklyLogPageDraft[]>([]);
  const [sendSuccess, setSendSuccess] = useState<{
    email: string;
    resent?: boolean;
  } | null>(null);

  const editable = bundle ? editableStatuses.includes(bundle.logbook.status) : false;
  const isRejected = bundle?.logbook.status === "rejected";
  const awaitingSupervisor = bundle?.logbook.status === "submitted_final";
  const bypassAllWeeks = schedule?.bypassWeekSchedule === true;
  const header = useMemo(() => (bundle ? sheetHeaderFromBundle(bundle) : null), [bundle]);

  const placementPeriod = useMemo(() => {
    if (!bundle?.placement) return { start: "", end: "" };
    const p = bundle.placement;
    return {
      start: p.internship_start_date || p.internshipStartDate || "",
      end: p.internship_end_date || p.internshipEndDate || "",
    };
  }, [bundle]);

  const editableWeekNumbers = useMemo(() => {
    if (!schedule) return [];
    if (schedule.bypassWeekSchedule) {
      return schedule.weeks.map((w) => w.weekNumber);
    }
    return schedule.weeks.filter((w) => w.isOpen).map((w) => w.weekNumber);
  }, [schedule]);

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!bundle) return;
    if (schedule) {
      setPageDrafts(buildPageDraftsFromBundle(bundle, schedule));
      return;
    }
    const { start, end } = placementPeriod;
    if (!start || !end) {
      setPageDrafts([]);
      return;
    }
    const totalWeeksFromPlacement = countWeeksInPeriod(start, end);
    if (totalWeeksFromPlacement < 1) {
      setPageDrafts([]);
      return;
    }
    setPageDrafts(
      buildPageDraftsFromBundle(bundle, {
        bypassWeekSchedule: false,
        totalWeeks: totalWeeksFromPlacement,
        currentOpenWeek: null,
        weeks: [],
      })
    );
  }, [bundle, schedule, placementPeriod]);

  const load = async () => {
    setLoading(true);
    const result = await weeklyLogbooksApi.getMyCurrent();
    if (result.error) {
      setBundle(null);
      setSchedule(null);
      if (result.error !== noCurrentPlacementMessage) {
        toast.error(result.error);
      }
    } else {
      const data = result.data as { bundle: WeeklyLogbookBundle; schedule?: WeeklyLogSchedule };
      setBundle(data.bundle);
      setSchedule(data.schedule || null);
    }
    setLoading(false);
  };

  const saveLogPage = async (page: WeeklyLogPageDraft) => {
    if (!bundle) return;
    const ps = page.values.weekBeginning;
    const pe = page.values.weekEnding;
    if (!ps || !pe) {
      toast.error("Internship starting and ending dates are required.");
      return;
    }

    const toSave: { weekNumber: number; values: WeeklyLogSheetValues }[] = [];
    for (let i = 0; i < page.values.activities.length; i += 1) {
      const weekNumber = page.firstWeekNumber + i;
      const row = page.values.activities[i];
      if (!editableWeekNumbers.includes(weekNumber)) continue;
      if (!row.activity.trim() || !row.date || !row.day) continue;

      const range = computeWeekRange(ps, weekNumber, pe);
      toSave.push({
        weekNumber,
        values: {
          weekBeginning: range?.start || row.date,
          weekEnding: range?.end || row.day,
          studentRemark: page.values.studentRemark,
          activities: [{ date: row.date, day: row.day, activity: row.activity }],
        },
      });
    }

    if (toSave.length === 0) {
      toast.error("Enter activities for at least one open week on this page.");
      return;
    }

    setSavingWeek(page.pageNumber);
    for (const item of toSave) {
      const result = await weeklyLogbooksApi.saveWeek(bundle.logbook.id, {
        weekNumber: item.weekNumber,
        weekBeginning: item.values.weekBeginning,
        weekEnding: item.values.weekEnding,
        studentRemark: item.values.studentRemark,
        activities: item.values.activities,
      });
      if (result.error) {
        toast.error(`Week ${item.weekNumber}: ${result.error}`);
        setSavingWeek(null);
        return;
      }
    }
    toast.success(`Saved ${toSave.length} week(s) on page ${page.pageNumber}`);
    await load();
    setSavingWeek(null);
  };

  const finalize = async () => {
    if (!bundle) return;
    const confirmMessage = isRejected
      ? "Resubmit your revised Weekly Log Sheet Book to your supervisor? A new secure hosted review link will be emailed. Your book will be locked again until they respond."
      : "Submit the complete Weekly Log Sheet Book to your supervisor by email? Your entries and remarks will be locked and cannot be edited afterward.";
    if (!confirm(confirmMessage)) return;

    setFinalizing(true);
    const result = isRejected
      ? await weeklyLogbooksApi.resubmit(bundle.logbook.id)
      : await weeklyLogbooksApi.finalize(bundle.logbook.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        isRejected
          ? "Logbook resubmitted — supervisor will receive a new review link"
          : "Logbook sent to supervisor for remarks"
      );
      const data = result.data as { bundle: WeeklyLogbookBundle };
      setBundle(data.bundle);
      await load();
    }
    setFinalizing(false);
  };

  const resubmitToSupervisor = async () => {
    if (!bundle) return;
    if (
      !confirm(
        "Send a new supervisor review email? The previous link will stop working and a fresh hosted review page will be emailed to your supervisor."
      )
    ) {
      return;
    }
    setResubmitting(true);
    const result = await weeklyLogbooksApi.resubmit(bundle.logbook.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      const data = result.data as { bundle: WeeklyLogbookBundle; supervisorEmail?: string };
      setBundle(data.bundle);
      if (data.supervisorEmail) {
        setSendSuccess({ email: data.supervisorEmail, resent: true });
      }
      toast.success("New supervisor review link sent by email");
    }
    setResubmitting(false);
  };

  if (loading || portalLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!portal.isOpen) {
    return (
      <div className="relative min-h-[60vh]">
        <div className="pointer-events-none select-none space-y-6 blur-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
                <BookOpen className="h-7 w-7 text-primary" />
                Weekly Log Sheet Book
              </h1>
              <p className="text-muted-foreground">
                Fill in your weekly log sheet after your official placement has been approved.
              </p>
            </div>
            <Badge variant="secondary">Locked</Badge>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Weekly log sheets</CardTitle>
              <CardDescription>
                Your logbook will be available when the internship portal opens and your current
                official placement is approved.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-8 rounded bg-muted" />
              <div className="h-24 rounded bg-muted" />
              <div className="h-8 w-40 rounded bg-muted" />
            </CardContent>
          </Card>
        </div>
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <Card className="w-full max-w-xl border-red-200 bg-background/95 text-center shadow-xl">
            <CardContent className="py-10">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-700">
                <AlertCircle className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold text-red-950">Internship Portal Closed</h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-red-800">
                {portal.closedMessage || PORTAL_CLOSED_MESSAGE}
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                When the admin opens the portal again, this page will show your Weekly Log Sheet
                Book after HOD or Secretary approval of your current official placement.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!bundle || !header) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Log Sheet Book</CardTitle>
          <CardDescription>
            Your Weekly Log Sheet Book will appear here after HOD or Secretary approves your
            current official placement.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const locked = !editable;
  const savedWeekCount = bundle.entries.length;
  const totalWeeks = schedule?.totalWeeks ?? (savedWeekCount || 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
            <BookOpen className="h-7 w-7 text-primary" />
            Weekly Log Sheet Book
          </h1>
          <p className="text-muted-foreground">
            Fill in your weekly log sheet like the official RMU form: five weeks per page with
            day/date ranges and activities. Save each page, then submit the book to your
            supervisor.
          </p>
        </div>
        <Badge
          className="w-fit capitalize"
          variant={bundle.logbook.status === "rejected" ? "destructive" : "secondary"}
        >
          {formatStatusLabel(bundle.logbook.status, "ongoing")}
        </Badge>
      </div>

      {editable && placementPeriod.start && placementPeriod.end && (
        <Card className="border-blue-200 bg-blue-50/80 dark:border-blue-900 dark:bg-blue-950/30">
          <CardContent className="pt-6 text-sm text-blue-950 dark:text-blue-100">
            Internship period:{" "}
            <strong>
              {formatWeekRangeLabel(placementPeriod.start, placementPeriod.end)}
            </strong>
            . {totalWeeks} week{totalWeeks === 1 ? "" : "s"} total
            {!bypassAllWeeks && editableWeekNumbers.length === 1
              ? ` — you can edit week ${editableWeekNumbers[0]} now`
              : ""}
            .
          </CardContent>
        </Card>
      )}

      {sendSuccess && (awaitingSupervisor || bundle.logbook.status === "submitted_final") && (
        <Card className="border-emerald-300 bg-emerald-50 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/40">
          <CardContent className="flex items-start gap-4 pt-6">
            <CheckCircle2 className="mt-0.5 h-8 w-8 shrink-0 text-emerald-600" />
            <div className="space-y-1">
              <p className="font-semibold text-emerald-950 dark:text-emerald-100">
                {sendSuccess.resent
                  ? "Supervisor review link sent successfully"
                  : "Weekly log sheet book sent successfully"}
              </p>
              <p className="flex items-center gap-2 text-sm text-emerald-900/90 dark:text-emerald-100/90">
                <Mail className="h-4 w-4 shrink-0" />
                A secure hosted review link was emailed to{" "}
                <span className="font-medium">{sendSuccess.email}</span>.
              </p>
              <p className="text-sm text-emerald-800/80 dark:text-emerald-200/80">
                Your entries are locked until the supervisor completes their evaluation. After
                that, the book will appear on the HOD / Secretary logbook page for approval and
                archiving.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {locked && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
          <CardContent className="flex flex-col gap-4 pt-6 text-amber-950 dark:text-amber-100 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">Your entries are locked</p>
                <p className="text-sm opacity-90">
                  {awaitingSupervisor
                    ? "Awaiting supervisor remarks on the hosted review page. You cannot change student fields until they respond."
                    : bundle.logbook.status === "supervisor_reviewed"
                      ? "With HOD / Secretary for institutional review and archiving."
                      : "This logbook is read-only."}
                </p>
              </div>
            </div>
            {awaitingSupervisor && (
              <Button
                variant="outline"
                className="shrink-0 border-amber-300 bg-white"
                onClick={() => void resubmitToSupervisor()}
                disabled={resubmitting}
              >
                {resubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Resend supervisor email
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {editable && schedule && pageDrafts.length > 0 && (
        <div className="space-y-6">
          {pageDrafts.map((page) => {
            const lastWeekOnPage = page.firstWeekNumber + page.weekCount - 1;
            const weekLabel =
              page.weekCount === 1
                ? `Week ${page.firstWeekNumber}`
                : `Weeks ${page.firstWeekNumber}–${lastWeekOnPage}`;
            const isSaving = savingWeek === page.pageNumber;
            const pageWeekNumbers = Array.from(
              { length: page.weekCount },
              (_, i) => page.firstWeekNumber + i
            );
            const savedOnPage = pageWeekNumbers.filter((wn) =>
              bundle.entries.some((e) => e.weekNumber === wn)
            ).length;
            const openOnPage = pageWeekNumbers.filter((wn) =>
              editableWeekNumbers.includes(wn)
            ).length;

            return (
              <Card key={page.pageNumber}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle>
                      Weekly log sheet — Page {page.pageNumber} ({weekLabel})
                    </CardTitle>
                    {savedOnPage > 0 && (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                        {savedOnPage} week{savedOnPage === 1 ? "" : "s"} saved
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    Matches the official log sheet: Day/Date and Activities Undertaken columns,
                    with week ranges filled in automatically.
                    {!bypassAllWeeks && openOnPage === 0
                      ? " No weeks on this page are open for editing yet."
                      : !bypassAllWeeks && openOnPage < pageWeekNumbers.length
                        ? ` You can edit ${openOnPage} open week${openOnPage === 1 ? "" : "s"} on this page.`
                        : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <WeeklyLogSheet
                    mode="student-edit"
                    header={header}
                    weekLabel={weekLabel}
                    values={page.values}
                    firstWeekNumber={page.firstWeekNumber}
                    weekCount={page.weekCount}
                    lockPeriodDates={Boolean(placementPeriod.start && placementPeriod.end)}
                    editableWeekNumbers={editableWeekNumbers}
                    onChange={(next) =>
                      setPageDrafts((prev) =>
                        prev.map((p) =>
                          p.pageNumber === page.pageNumber ? { ...p, values: next } : p
                        )
                      )
                    }
                  />
                  <Button
                    onClick={() => void saveLogPage(page)}
                    disabled={isSaving || openOnPage === 0}
                  >
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save page {page.pageNumber}
                  </Button>
                </CardContent>
              </Card>
            );
          })}

          <Card>
            <CardContent className="flex flex-wrap gap-3 pt-6">
              <Button
                variant="default"
                className="bg-primary"
                onClick={finalize}
                disabled={finalizing || resubmitting || savedWeekCount === 0}
              >
                {finalizing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : isRejected ? (
                  <RefreshCw className="mr-2 h-4 w-4" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isRejected ? "Resubmit to supervisor" : "Submit book to supervisor"}
              </Button>
              <p className="text-sm text-muted-foreground self-center">
                {savedWeekCount} of {totalWeeks} week{totalWeeks === 1 ? "" : "s"} saved
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {editable && (!schedule || pageDrafts.length === 0) && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Weekly sheets could not be generated. Ensure your official placement has internship
              starting and ending dates set.
            </p>
          </CardContent>
        </Card>
      )}

      {locked && pageDrafts.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Submitted weekly log sheets</h2>
          {pageDrafts.map((page) => {
            const lastWeekOnPage = page.firstWeekNumber + page.weekCount - 1;
            const weekLabel =
              page.weekCount === 1
                ? `Week ${page.firstWeekNumber}`
                : `Weeks ${page.firstWeekNumber}–${lastWeekOnPage}`;

            return (
              <WeeklyLogSheet
                key={page.pageNumber}
                mode="student-locked"
                header={header}
                weekLabel={`Page ${page.pageNumber} (${weekLabel})`}
                values={page.values}
                firstWeekNumber={page.firstWeekNumber}
                weekCount={page.weekCount}
                lockPeriodDates={Boolean(placementPeriod.start && placementPeriod.end)}
              />
            );
          })}
        </div>
      )}

      {locked && pageDrafts.length === 0 && bundle.entries.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Submitted weekly sheets</h2>
          {bundle.entries.map((entry) => {
            const sheetValues = entryToSheetValues(entry);
            return (
              <WeeklyLogSheet
                key={entry.id}
                mode="student-locked"
                header={header}
                weekLabel={`Week ${entry.weekNumber}`}
                values={{
                  ...sheetValues,
                  weekBeginning: placementPeriod.start || sheetValues.weekBeginning,
                  weekEnding: placementPeriod.end || sheetValues.weekEnding,
                }}
                firstWeekNumber={entry.weekNumber}
                weekCount={1}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
