"use client";

import { use, useEffect, useState } from "react";
import { weeklyLogbooksApi } from "@/lib/api";
import type { WeeklyLogbookBundle } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

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
  const [form, setForm] = useState({
    supervisorFullName: "",
    supervisorRemark: "",
    supervisorRecommendation: "",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const result = await weeklyLogbooksApi.getSupervisorReview(token);
      if (result.error) {
        toast.error(result.error);
      } else {
        const nextBundle = (result.data as any).bundle as WeeklyLogbookBundle;
        setBundle(nextBundle);
        setForm((current) => ({
          ...current,
          supervisorFullName: nextBundle.placement?.supervisor_name || "",
        }));
      }
      setLoading(false);
    };
    void load();
  }, [token]);

  const submit = async () => {
    setSubmitting(true);
    const result = await weeklyLogbooksApi.submitSupervisorReview(token, form);
    if (result.error) {
      toast.error(result.error);
    } else {
      setSubmitted(true);
      toast.success("Supervisor acknowledgment submitted");
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
            <CardDescription>Your acknowledgment has been submitted. This secure link is now inactive.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (!bundle) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4">
        <Card>
          <CardHeader>
            <CardTitle>Review link unavailable</CardTitle>
            <CardDescription>This link is invalid, expired, already used, or unavailable.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const student = bundle.student || ({} as any);
  const placement = bundle.placement || {};

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card>
          <CardHeader className="text-center">
            <Badge className="mx-auto mb-2 w-fit" variant="secondary">
              <ShieldCheck className="mr-1 h-3.5 w-3.5" />
              Secure temporary review
            </Badge>
            <CardTitle className="text-2xl uppercase tracking-wide">Weekly Log Sheet Book</CardTitle>
            <CardDescription>Supervisor acknowledgment only. This is not the evaluation form.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div><span className="font-semibold">Student:</span> {student.firstName} {student.lastName}</div>
            <div><span className="font-semibold">Programme:</span> {student.program || "N/A"}</div>
            <div><span className="font-semibold">Organization:</span> {placement.organization_name || "N/A"}</div>
            <div><span className="font-semibold">Department / Office:</span> {placement.department_role || "N/A"}</div>
            <div><span className="font-semibold">Duration:</span> {placement.internship_start_date || "N/A"} to {placement.internship_end_date || "N/A"}</div>
          </CardContent>
        </Card>

        {bundle.entries.map((entry) => (
          <Card key={entry.id}>
            <CardHeader>
              <CardTitle>Week {entry.weekNumber}: {entry.weekBeginning} to {entry.weekEnding}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-muted">
                    <tr><th className="border p-2 text-left">Day</th><th className="border p-2 text-left">Date</th><th className="border p-2 text-left">Activities Undertaken</th></tr>
                  </thead>
                  <tbody>
                    {entry.activities.map((activity, index) => (
                      <tr key={`${entry.id}-${index}`}>
                        <td className="border p-2">{activity.day}</td>
                        <td className="border p-2">{activity.date}</td>
                        <td className="border p-2">{activity.activity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {entry.studentRemark && <p className="text-sm"><span className="font-semibold">Student remark:</span> {entry.studentRemark}</p>}
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle>Supervisor Remark</CardTitle>
            <CardDescription>You cannot edit student entries, dates, or activities.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name Confirmation</Label>
              <Input value={form.supervisorFullName} onChange={(e) => setForm({ ...form, supervisorFullName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Supervisor Remark</Label>
              <Textarea value={form.supervisorRemark} onChange={(e) => setForm({ ...form, supervisorRemark: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Optional Recommendation</Label>
              <Textarea value={form.supervisorRecommendation} onChange={(e) => setForm({ ...form, supervisorRecommendation: e.target.value })} />
            </div>
            <Button onClick={submit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Acknowledgment
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
