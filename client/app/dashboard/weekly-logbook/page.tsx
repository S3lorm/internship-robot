"use client";

import { useEffect, useMemo, useState } from "react";
import { weeklyLogbooksApi } from "@/lib/api";
import { entryToSheetValues, sheetHeaderFromBundle } from "@/lib/weekly-logbook-ui";
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [weekNumber, setWeekNumber] = useState(1);
  const [draft, setDraft] = useState<WeeklyLogSheetValues>({
    weekBeginning: "",
    weekEnding: "",
    studentRemark: "",
    activities: emptyWeeklyActivities(),
  });

  const editable = bundle ? editableStatuses.includes(bundle.logbook.status) : false;
  const nextWeek = useMemo(() => (bundle?.entries?.length || 0) + 1, [bundle]);
  const header = useMemo(() => (bundle ? sheetHeaderFromBundle(bundle) : null), [bundle]);

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    setWeekNumber(nextWeek);
  }, [nextWeek]);

  const load = async () => {
    setLoading(true);
    const result = await weeklyLogbooksApi.getMyCurrent();
    if (result.error) {
      toast.error(result.error);
    } else {
      setBundle((result.data as { bundle: WeeklyLogbookBundle }).bundle);
    }
    setLoading(false);
  };

  const saveWeek = async () => {
    if (!bundle) return;
    const hasActivity = draft.activities.some(
      (row) => row.activity.trim() || row.date.trim() || row.day.trim()
    );
    if (!draft.weekBeginning || !draft.weekEnding || !hasActivity) {
      toast.error("Week dates and at least one activity row are required.");
      return;
    }

    setSaving(true);
    const result = await weeklyLogbooksApi.saveWeek(bundle.logbook.id, {
      weekNumber,
      weekBeginning: draft.weekBeginning,
      weekEnding: draft.weekEnding,
      studentRemark: draft.studentRemark,
      activities: draft.activities,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Week ${weekNumber} saved`);
      setDraft({
        weekBeginning: "",
        weekEnding: "",
        studentRemark: "",
        activities: emptyWeeklyActivities(),
      });
      await load();
    }
    setSaving(false);
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
      setBundle((result.data as { bundle: WeeklyLogbookBundle }).bundle);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
            <BookOpen className="h-7 w-7 text-primary" />
            Weekly Log Sheet Book
          </h1>
          <p className="text-muted-foreground">
            Fill each weekly sheet during internship. Supervisor sections stay locked until you
            submit the complete book.
          </p>
        </div>
        <Badge
          className="w-fit capitalize"
          variant={bundle.logbook.status === "rejected" ? "destructive" : "secondary"}
        >
          {formatStatusLabel(bundle.logbook.status, "ongoing")}
        </Badge>
      </div>

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

      {editable && (
        <Card>
          <CardHeader>
            <CardTitle>New weekly sheet — Week {weekNumber}</CardTitle>
            <CardDescription>
              Match the official RMU form. Supervisor remark, name, and status fields are locked for
              you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <WeeklyLogSheet
              mode="student-edit"
              header={header}
              weekLabel={`Week ${weekNumber}`}
              values={draft}
              onChange={setDraft}
            />
            <div className="flex flex-wrap gap-3">
              <Button onClick={saveWeek} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save week {weekNumber}
              </Button>
              <Button
                variant="default"
                className="bg-primary"
                onClick={finalize}
                disabled={finalizing || bundle.entries.length === 0}
              >
                {finalizing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Submit book to supervisor
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {bundle.entries.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Saved weekly sheets</h2>
          {bundle.entries.map((entry) => (
            <WeeklyLogSheet
              key={entry.id}
              mode={locked ? "student-locked" : "student-locked"}
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
