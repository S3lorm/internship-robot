"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardCheck } from "lucide-react";
import type { WeeklyLogSheetValues } from "@/components/weekly-log-sheet";

type SupervisorEvaluationCardProps = {
  pageLabel: string;
  values: Pick<
    WeeklyLogSheetValues,
    "supervisorRemark" | "supervisorName" | "supervisorStatus"
  >;
  onChange: (values: Partial<WeeklyLogSheetValues>) => void;
};

export function SupervisorEvaluationCard({
  pageLabel,
  values,
  onChange,
}: SupervisorEvaluationCardProps) {
  return (
    <Card className="border-emerald-200 bg-linear-to-b from-emerald-50/90 to-white shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base leading-snug">Supervisor evaluation</CardTitle>
            <CardDescription className="wrap-break-word leading-snug">{pageLabel}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`remark-${pageLabel}`}>Supervisor&apos;s remarks *</Label>
          <Textarea
            id={`remark-${pageLabel}`}
            value={values.supervisorRemark || ""}
            onChange={(e) => onChange({ supervisorRemark: e.target.value })}
            placeholder="Comment on the student's performance for this page…"
            rows={4}
            className="resize-y bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`name-${pageLabel}`}>Name of supervisor *</Label>
          <Input
            id={`name-${pageLabel}`}
            value={values.supervisorName || ""}
            onChange={(e) => onChange({ supervisorName: e.target.value })}
            placeholder="Full name"
            className="bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`status-${pageLabel}`}>Status *</Label>
          <Input
            id={`status-${pageLabel}`}
            value={values.supervisorStatus || ""}
            onChange={(e) => onChange({ supervisorStatus: e.target.value })}
            placeholder="e.g. Satisfactory, Good, Needs improvement"
            className="bg-white"
          />
        </div>
      </CardContent>
    </Card>
  );
}
