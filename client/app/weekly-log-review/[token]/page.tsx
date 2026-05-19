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
import { WeeklyLogSheet, type WeeklyLogSheetValues } from "@/components/weekly-log-sheet";
import { SupervisorEvaluationCard } from "@/components/supervisor-evaluation-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Loader2, Lock, Send, ShieldCheck } from "lucide-react";

function entryByWeekNumber(bundle: WeeklyLogbookBundle, weekNumber: number) {
  return bundle.entries.find((e) => e.weekNumber === weekNumber);
}

function pageEvaluationValues(
  page: WeeklyLogPageDraft,
  bundle: WeeklyLogbookBundle,
  entryForms: Record<string, WeeklyLogSheetValues>
): Pick<WeeklyLogSheetValues, "supervisorRemark" | "supervisorName" | "supervisorStatus"> {
  for (let i = 0; i < page.weekCount; i += 1) {
    const entry = entryByWeekNumber(bundle, page.firstWeekNumber + i);
    if (!entry) continue;
    const form = entryForms[entry.id];
    if (form?.supervisorRemark || form?.supervisorName || form?.supervisorStatus) {
      return {
        supervisorRemark: form.supervisorRemark || "",
        supervisorName: form.supervisorName || "",
        supervisorStatus: form.supervisorStatus || "",
      };
    }
  }
  return { supervisorRemark: "", supervisorName: "", supervisorStatus: "" };
}

function studentSheetValues(
  page: WeeklyLogPageDraft,
  bundle: WeeklyLogbookBundle
): WeeklyLogSheetValues {
  const base = { ...page.values };
  return {
    ...base,
    supervisorRemark: undefined,
    supervisorName: undefined,
    supervisorStatus: undefined,
  };
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

  const updatePageEvaluation = (page: WeeklyLogPageDraft, partial: Partial<WeeklyLogSheetValues>) => {
    setEntryForms((current) => {
      const next = { ...current };
      for (let i = 0; i < page.weekCount; i += 1) {
        const entry = entryByWeekNumber(bundle!, page.firstWeekNumber + i);
        if (!entry) continue;
        next[entry.id] = {
          ...(next[entry.id] || entryToSheetValues(entry)),
          ...partial,
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
    const studentName = bundle
      ? `${bundle.student?.firstName || ""} ${bundle.student?.lastName || ""}`.trim()
      : "";
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 sm:py-16">
        <div className="w-full max-w-md">
          <Card className="overflow-hidden border-emerald-200 shadow-xl">
            <div className="bg-emerald-600 px-6 py-10 text-center text-white">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                <CheckCircle2 className="h-9 w-9" aria-hidden />
              </div>
              <h1 className="text-xl font-bold sm:text-2xl">Review submitted successfully</h1>
              <p className="mt-2 text-sm text-emerald-50 sm:text-base">
                Your supervisor evaluation has been saved.
              </p>
            </div>
            <CardContent className="space-y-4 p-6 text-sm leading-relaxed text-slate-700">
              {studentName ? (
                <p className="text-pretty wrap-break-word">
                  The weekly log sheet book for{' '}
                  <span className="font-semibold text-slate-900">{studentName}</span> has been forwarded
                  to the student&apos;s department HOD and the Secretary for institutional review.
                </p>
              ) : (
                <p className="text-pretty wrap-break-word">
                  The weekly log sheet book has been forwarded to the department HOD and Secretary for
                  institutional review.
                </p>
              )}
              <ul className="list-inside list-disc space-y-1 text-slate-600">
                <li>This secure review link is now inactive.</li>
                <li>You cannot change your submission from this page.</li>
                <li>The institution will approve or return the book after review.</li>
              </ul>
              <p className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-center text-slate-600">
                You may safely close this browser tab.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (!bundle || !header) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-100 px-4 py-12">
        <Card className="w-full max-w-lg min-w-0 border-slate-200 shadow-lg">
          <CardHeader className="min-w-0 space-y-3 text-center sm:text-left">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 sm:mx-0">
              <AlertCircle className="h-7 w-7" aria-hidden />
            </div>
            <CardTitle className="text-xl leading-snug wrap-break-word">
              Review link unavailable
            </CardTitle>
            <CardDescription className="text-base leading-relaxed wrap-break-word text-pretty text-muted-foreground">
              This link is invalid, expired, already used, or unavailable.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-600 wrap-break-word sm:text-left">
              Ask the student or university for a new supervisor review email if you still need to
              complete this review.
            </p>
          </CardContent>
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
      <div className="mx-auto max-w-5xl min-w-0 space-y-6">
        <Card className="min-w-0 overflow-visible shadow-sm">
          <CardHeader className="space-y-2 px-4 pt-6 text-center sm:px-6">
            <Badge className="mx-auto mb-1 w-fit" variant="secondary">
              <ShieldCheck className="mr-1 h-3.5 w-3.5 shrink-0" />
              <span className="wrap-break-word text-left">
                Supervisor review — hosted portal
              </span>
            </Badge>
            <CardTitle className="text-xl leading-snug">Weekly Log Sheet Book</CardTitle>
            <CardDescription className="mx-auto max-w-lg wrap-break-word text-pretty">
              Review each page below, then complete the evaluation cards and submit.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950 sm:mx-6 sm:mb-6">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p className="min-w-0 wrap-break-word text-pretty">
              Student activities and remarks are locked. Complete the evaluation card on each page,
              then confirm your details at the bottom.
            </p>
          </CardContent>
        </Card>

        {pageDrafts.map((page) => {
          const lastWeek = page.firstWeekNumber + page.weekCount - 1;
          const weekLabel =
            page.weekCount === 1
              ? `Week ${page.firstWeekNumber}`
              : `Weeks ${page.firstWeekNumber}–${lastWeek}`;
          const pageLabel = `Page ${page.pageNumber} (${weekLabel})`;

          return (
            <div key={page.pageNumber} className="space-y-4">
              <Card className="min-w-0 overflow-x-auto border-slate-200 shadow-sm">
                <CardHeader className="border-b bg-slate-50 px-4 py-3 sm:px-6">
                  <CardTitle className="wrap-break-word text-sm font-semibold leading-snug">
                    Student log — {pageLabel}
                  </CardTitle>
                  <CardDescription className="wrap-break-word leading-snug">
                    Read-only weekly activities and student remarks
                  </CardDescription>
                </CardHeader>
                <CardContent className="min-w-0 p-3 sm:p-6">
                  <WeeklyLogSheet
                    mode="student-locked"
                    header={header}
                    weekLabel={pageLabel}
                    values={studentSheetValues(page, bundle)}
                    firstWeekNumber={page.firstWeekNumber}
                    weekCount={page.weekCount}
                    lockPeriodDates={hasPlacementDates}
                    showSupervisorSection={false}
                  />
                </CardContent>
              </Card>

              <SupervisorEvaluationCard
                pageLabel={pageLabel}
                values={pageEvaluationValues(page, bundle, entryForms)}
                onChange={(partial) => updatePageEvaluation(page, partial)}
              />
            </div>
          );
        })}

        <Card className="min-w-0 border-primary/20 shadow-md">
          <CardHeader className="space-y-1 px-4 pt-6 sm:px-6">
            <CardTitle className="flex flex-wrap items-center gap-2 text-lg leading-snug">
              <Send className="h-5 w-5 shrink-0 text-primary" aria-hidden />
              <span className="wrap-break-word">Final supervisor confirmation</span>
            </CardTitle>
            <CardDescription className="wrap-break-word text-pretty leading-relaxed">
              Used for the institutional record and forwarded to HOD / Secretary.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Confirmed supervisor full name *</Label>
              <Input
                value={supervisorFullName}
                onChange={(e) => setSupervisorFullName(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Overall recommendation (optional)</Label>
              <Textarea
                value={supervisorRecommendation}
                onChange={(e) => setSupervisorRecommendation(e.target.value)}
                placeholder="Summary comment for the institution…"
                rows={3}
                className="resize-y bg-white"
              />
            </div>
            <Button onClick={submit} disabled={submitting} size="lg" className="w-full sm:w-auto">
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Submit supervisor review
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
