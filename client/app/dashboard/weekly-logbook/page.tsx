"use client";

import { useEffect, useMemo, useState } from "react";
import { weeklyLogbooksApi } from "@/lib/api";
import { entryToSheetValues, sheetHeaderFromBundle } from "@/lib/weekly-logbook-ui";
import {
  buildWeekDraftsFromBundle,
  type WeeklyLogSchedule,
} from "@/lib/weekly-logbook-schedule";
import type { WeeklyLogbookBundle } from "@/types";
import {
  WeeklyLogSheet,
  emptyWeeklyActivities,
  type WeeklyLogSheetValues,
} from "@/components/weekly-log-sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatStatusLabel } from "@/lib/utils";
import { toast } from "sonner";
import { BookOpen, Loader2, Lock, Send } from "lucide-react";

const editableStatuses = ["draft", "ongoing", "rejected"];

export default function WeeklyLogbookPage() {
  const [bundle, setBundle] = useState<WeeklyLogbookBundle | null>(null);
  const [schedule, setSchedule] = useState<WeeklyLogSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingWeek, setSavingWeek] = useState<number | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [weekNumber, setWeekNumber] = useState(1);
  const [weekDrafts, setWeekDrafts] = useState<Record<number, WeeklyLogSheetValues>>({});
  const [draft, setDraft] = useState<WeeklyLogSheetValues>({
    weekBeginning: "",
    weekEnding: "",
    studentRemark: "",
    activities: emptyWeeklyActivities(),
  });

  const editable = bundle ? editableStatuses.includes(bundle.logbook.status) : false;
  const bypassAllWeeks = schedule?.bypassWeekSchedule === true;
  const header = useMemo(() => (bundle ? sheetHeaderFromBundle(bundle) : null), [bundle]);

  const nextWeek = useMemo(() => (bundle?.entries?.length || 0) + 1, [bundle]);
  const openWeekItem = useMemo(() => {
    if (!schedule || schedule.bypassWeekSchedule) return null;
    if (schedule.currentOpenWeek) {
      return schedule.weeks.find((w) => w.weekNumber === schedule.currentOpenWeek) || null;
    }
    return schedule.weeks.find((w) => w.isOpen) || null;
  }, [schedule]);

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!bundle || !schedule) return;
    if (schedule.bypassWeekSchedule) {
      setWeekDrafts(buildWeekDraftsFromBundle(bundle, schedule));
      return;
    }
    const targetWeek = openWeekItem?.weekNumber ?? nextWeek;
    setWeekNumber(targetWeek);
    const existing = bundle.entries.find((e) => e.weekNumber === targetWeek);
    if (existing) {
      setDraft(entryToSheetValues(existing));
    } else if (openWeekItem) {
      setDraft({
        weekBeginning: openWeekItem.weekBeginning,
        weekEnding: openWeekItem.weekEnding,
        studentRemark: "",
        activities: emptyWeeklyActivities(),
      });
    }
  }, [bundle, schedule, openWeekItem, nextWeek]);

  const load = async () => {
    setLoading(true);
    const result = await weeklyLogbooksApi.getMyCurrent();
    if (result.error) {
      toast.error(result.error);
    } else {
      const data = result.data as { bundle: WeeklyLogbookBundle; schedule?: WeeklyLogSchedule };
      setBundle(data.bundle);
      setSchedule(data.schedule || null);
    }
    setLoading(false);
  };

  const validateDraft = (values: WeeklyLogSheetValues) => {
    const hasActivity = values.activities.some(
      (row) => row.activity.trim() || row.date.trim() || row.day.trim()
    );
    return values.weekBeginning && values.weekEnding && hasActivity;
  };

  const saveWeekByNumber = async (targetWeek: number, values: WeeklyLogSheetValues) => {
    if (!bundle) return;
    if (!validateDraft(values)) {
      toast.error("Week dates and at least one activity row are required.");
      return;
    }

    setSavingWeek(targetWeek);
    const result = await weeklyLogbooksApi.saveWeek(bundle.logbook.id, {
      weekNumber: targetWeek,
      weekBeginning: values.weekBeginning,
      weekEnding: values.weekEnding,
      studentRemark: values.studentRemark,
      activities: values.activities,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Week ${targetWeek} saved`);
      await load();
    }
    setSavingWeek(null);
  };

  const saveCurrentWeek = async () => {
    await saveWeekByNumber(weekNumber, draft);
  };

  const finalize = async () => {
    if (!bundle) return;
    if (
      !confirm(
        "Submit the complete Weekly Log Sheet Book to your supervisor by email? Your entries and remarks will be locked and cannot be edited afterward."
      )
    ) {
      return;
    }
    setFinalizing(true);
    const result = await weeklyLogbooksApi.finalize(bundle.logbook.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Logbook sent to supervisor for remarks");
      const data = result.data as { bundle: WeeklyLogbookBundle };
      setBundle(data.bundle);
    }
    setFinalizing(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!bundle || !header) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Log Sheet Book</CardTitle>
          <CardDescription>
            No approved official placement is available. Complete your official placement approval
            first.
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
            {bypassAllWeeks
              ? "Testing mode: fill every weekly sheet now, then submit the complete book to your supervisor."
              : "Fill the weekly sheet for the current internship week. Supervisor fields unlock after you submit the book."}
          </p>
        </div>
        <Badge
          className="w-fit capitalize"
          variant={bundle.logbook.status === "rejected" ? "destructive" : "secondary"}
        >
          {formatStatusLabel(bundle.logbook.status, "ongoing")}
        </Badge>
      </div>

      {bypassAllWeeks && editable && (
        <Card className="border-blue-200 bg-blue-50/80 dark:border-blue-900 dark:bg-blue-950/30">
          <CardContent className="pt-6 text-sm text-blue-950 dark:text-blue-100">
            All {totalWeeks} week forms are open. Save each week, then use{" "}
            <strong>Submit book to supervisor</strong> so they can add remarks and send the book to
            HOD.
          </CardContent>
        </Card>
      )}

      {locked && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
          <CardContent className="flex items-start gap-3 pt-6 text-amber-950 dark:text-amber-100">
            <Lock className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">Your entries are locked</p>
              <p className="text-sm opacity-90">
                {bundle.logbook.status === "submitted_final"
                  ? "Awaiting supervisor remarks. You cannot change student fields or credentials."
                  : bundle.logbook.status === "supervisor_reviewed"
                    ? "With HOD / Secretary for institutional review and archiving."
                    : "This logbook is read-only."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {editable && bypassAllWeeks && schedule && (
        <div className="space-y-6">
          {schedule.weeks.map((week) => {
            const values = weekDrafts[week.weekNumber];
            if (!values) return null;
            const isSaving = savingWeek === week.weekNumber;
            const isSaved = bundle.entries.some((e) => e.weekNumber === week.weekNumber);

            return (
              <Card key={week.weekNumber}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle>Week {week.weekNumber}</CardTitle>
                    {isSaved && (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                        Saved
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    {week.weekBeginning && week.weekEnding
                      ? `${week.weekBeginning} — ${week.weekEnding}`
                      : "Enter week dates and daily activities"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <WeeklyLogSheet
                    mode="student-edit"
                    header={header}
                    weekLabel={`Week ${week.weekNumber}`}
                    values={values}
                    onChange={(next) =>
                      setWeekDrafts((prev) => ({ ...prev, [week.weekNumber]: next }))
                    }
                  />
                  <Button
                    onClick={() => void saveWeekByNumber(week.weekNumber, values)}
                    disabled={isSaving}
                  >
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save week {week.weekNumber}
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
                disabled={finalizing || savedWeekCount === 0}
              >
                {finalizing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Submit book to supervisor
              </Button>
              <p className="text-sm text-muted-foreground self-center">
                {savedWeekCount} of {totalWeeks} week{totalWeeks === 1 ? "" : "s"} saved
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {editable && !bypassAllWeeks && (
        <Card>
          <CardHeader>
            <CardTitle>
              {openWeekItem
                ? `Weekly sheet — Week ${openWeekItem.weekNumber}`
                : `New weekly sheet — Week ${weekNumber}`}
            </CardTitle>
            <CardDescription>
              {openWeekItem
                ? "Only the current calendar week is open for editing."
                : "No week is open right now based on your internship dates."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {openWeekItem ? (
              <>
                <WeeklyLogSheet
                  mode="student-edit"
                  header={header}
                  weekLabel={`Week ${weekNumber}`}
                  values={draft}
                  onChange={setDraft}
                />
                <div className="flex flex-wrap gap-3">
                  <Button onClick={saveCurrentWeek} disabled={savingWeek !== null}>
                    {savingWeek !== null && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save week {weekNumber}
                  </Button>
                  <Button
                    variant="default"
                    className="bg-primary"
                    onClick={finalize}
                    disabled={finalizing || savedWeekCount === 0}
                  >
                    {finalizing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Submit book to supervisor
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Check back when your internship reaches the next weekly period.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {locked && bundle.entries.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Submitted weekly sheets</h2>
          {bundle.entries.map((entry) => (
            <WeeklyLogSheet
              key={entry.id}
              mode="student-locked"
              header={header}
              weekLabel={`Week ${entry.weekNumber}`}
              values={entryToSheetValues(entry)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
