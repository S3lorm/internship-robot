"use client";

import { use, useEffect, useMemo, useState } from "react";
import { weeklyLogbooksApi } from "@/lib/api";
import { entryToSheetValues, sheetHeaderFromBundle } from "@/lib/weekly-logbook-ui";
import {
  buildPageDraftsFromBundle,
  type WeeklyLogPageDraft,
} from "@/lib/weekly-logbook-schedule";
import { countWeeksInPeriod } from "@/lib/weekly-logbook-weeks";
import type { WeeklyLogbookBundle } from "@/types";
import {
  WeeklyLogSheet,
  type WeeklyLogSheetValues,
} from "@/components/weekly-log-sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Lock, ShieldCheck } from "lucide-react";

function entryByWeekNumber(bundle: WeeklyLogbookBundle, weekNumber: number) {
  return bundle.entries.find((e) => e.weekNumber === weekNumber);
}

function pageValuesWithSupervisorForms(
  page: WeeklyLogPageDraft,
  bundle: WeeklyLogbookBundle,
  entryForms: Record<string, WeeklyLogSheetValues>
): WeeklyLogSheetValues {
  const base = { ...page.values };
  for (let i = 0; i < page.weekCount; i += 1) {
    const entry = entryByWeekNumber(bundle, page.firstWeekNumber + i);
    if (!entry) continue;
    const form = entryForms[entry.id];
    if (!form) continue;
    if (form.supervisorRemark) base.supervisorRemark = form.supervisorRemark;
    if (form.supervisorName) base.supervisorName = form.supervisorName;
    if (form.supervisorStatus) base.supervisorStatus = form.supervisorStatus;
  }
  return base;
}

export default function WeeklyLogSupervisorReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [bundle, setBundle] = useState<WeeklyLogbookBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [supervisorFullName, setSupervisorFullName] = useState("");
  const [supervisorRecommendation, setSupervisorRecommendation] = useState("");
  const [entryForms, setEntryForms] = useState<Record<string, WeeklyLogSheetValues>>({});

  const header = useMemo(() => (bundle ? sheetHeaderFromBundle(bundle) : null), [bundle]);

  const pageDrafts = useMemo(() => {
    if (!bundle) return [];
    const placement = bundle.placement || {};
    const start =
      placement.internship_start_date || placement.internshipStartDate || "";
    const end = placement.internship_end_date || placement.internshipEndDate || "";
    const totalWeeks =
      countWeeksInPeriod(start, end) || bundle.entries.length || 1;
    return buildPageDraftsFromBundle(bundle, {
      bypassWeekSchedule: true,
      totalWeeks,
      currentOpenWeek: null,
      weeks: [],
    });
  }, [bundle]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const result = await weeklyLogbooksApi.getSupervisorReview(token);
      if (result.error) {
        toast.error(result.error);
      } else {
        const nextBundle = (result.data as { bundle: WeeklyLogbookBundle }).bundle;
        setBundle(nextBundle);
        setSupervisorFullName(nextBundle.placement?.supervisor_name || "");
        const forms: Record<string, WeeklyLogSheetValues> = {};
        for (const entry of nextBundle.entries) {
          forms[entry.id] = {
            ...entryToSheetValues(entry),
            supervisorName: entry.supervisorName || nextBundle.placement?.supervisor_name || "",
            supervisorRemark: entry.supervisorRemark || "",
            supervisorStatus: entry.supervisorStatus || "",
          };
        }
        setEntryForms(forms);
      }
      setLoading(false);
    };
    void load();
  }, [token]);

  const updatePageSupervisorFields = (page: WeeklyLogPageDraft, values: WeeklyLogSheetValues) => {
    setEntryForms((current) => {
      const next = { ...current };
      for (let i = 0; i < page.weekCount; i += 1) {
        const entry = entryByWeekNumber(bundle!, page.firstWeekNumber + i);
        if (!entry) continue;
        next[entry.id] = {
          ...(next[entry.id] || entryToSheetValues(entry)),
          supervisorRemark: values.supervisorRemark,
          supervisorName: values.supervisorName,
          supervisorStatus: values.supervisorStatus,
        };
      }
      return next;
    });
  };

  const submit = async () => {
    if (!bundle) return;
    const entryReviews = bundle.entries.map((entry) => {
      const form = entryForms[entry.id];
      return {
        entryId: entry.id,
        weekNumber: entry.weekNumber,
        supervisorRemark: form?.supervisorRemark || "",
        supervisorName: form?.supervisorName || supervisorFullName,
        supervisorStatus: form?.supervisorStatus || "",
      };
    });

    setSubmitting(true);
    const result = await weeklyLogbooksApi.submitSupervisorReview(token, {
      supervisorFullName,
      supervisorRecommendation,
      entryReviews,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      setSubmitted(true);
      toast.success("Supervisor section submitted to RMU for review");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (submitted) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <CardTitle>Thank you</CardTitle>
            <CardDescription>
              Your remarks have been recorded. This secure link is now inactive and the logbook
              has been forwarded to the HOD and Secretary for review.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (!bundle || !header) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4">
        <Card>
          <CardHeader>
            <CardTitle>Review link unavailable</CardTitle>
            <CardDescription>
              This link is invalid, expired, already used, or unavailable.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const placement = bundle.placement || {};
  const hasPlacementDates = Boolean(
    (placement.internship_start_date || placement.internshipStartDate) &&
      (placement.internship_end_date || placement.internshipEndDate)
  );

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card>
          <CardHeader className="text-center">
            <Badge className="mx-auto mb-2 w-fit" variant="secondary">
              <ShieldCheck className="mr-1 h-3.5 w-3.5" />
              Supervisor review — hosted portal
            </Badge>
            <CardTitle className="text-xl">Weekly Log Sheet Book</CardTitle>
            <CardDescription>
              Student entries are locked. Complete the supervisor remark, name, and status on
              each sheet (official log book layout).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              You cannot edit student activities, dates, credentials, or student remarks. Those
              fields were locked when the student submitted this book.
            </p>
          </CardContent>
        </Card>

        {pageDrafts.map((page) => {
          const lastWeek = page.firstWeekNumber + page.weekCount - 1;
          const weekLabel =
            page.weekCount === 1
              ? `Week ${page.firstWeekNumber}`
              : `Weeks ${page.firstWeekNumber}–${lastWeek}`;

          return (
            <WeeklyLogSheet
              key={page.pageNumber}
              mode="supervisor"
              header={header}
              weekLabel={`Page ${page.pageNumber} (${weekLabel})`}
              values={pageValuesWithSupervisorForms(page, bundle, entryForms)}
              firstWeekNumber={page.firstWeekNumber}
              weekCount={page.weekCount}
              lockPeriodDates={hasPlacementDates}
              onChange={(values) => updatePageSupervisorFields(page, values)}
            />
          );
        })}

        <Card>
          <CardHeader>
            <CardTitle>Final supervisor confirmation</CardTitle>
            <CardDescription>Used for the institutional record and email trail.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Confirmed supervisor full name</Label>
              <Input
                value={supervisorFullName}
                onChange={(e) => setSupervisorFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Overall recommendation (optional)</Label>
              <Textarea
                value={supervisorRecommendation}
                onChange={(e) => setSupervisorRecommendation(e.target.value)}
              />
            </div>
            <Button onClick={submit} disabled={submitting} className="w-full sm:w-auto">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit supervisor section
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
