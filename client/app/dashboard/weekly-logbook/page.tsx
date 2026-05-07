"use client";

import { useEffect, useMemo, useState } from "react";
import { weeklyLogbooksApi } from "@/lib/api";
import type { WeeklyLogbookBundle, WeeklyLogActivity } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatStatusLabel } from "@/lib/utils";
import { toast } from "sonner";
import { BookOpen, CalendarDays, FileCheck2, Loader2, Lock, Send } from "lucide-react";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function WeeklyLogbookPage() {
  const [bundle, setBundle] = useState<WeeklyLogbookBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [form, setForm] = useState({
    weekNumber: 1,
    weekBeginning: "",
    weekEnding: "",
    studentRemark: "",
    activities: days.map((day) => ({ day, date: "", activity: "" })),
  });

  const editable = bundle ? ["draft", "ongoing", "rejected"].includes(bundle.logbook.status) : false;
  const nextWeek = useMemo(() => (bundle?.entries?.length || 0) + 1, [bundle]);

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    setForm((current) => ({ ...current, weekNumber: nextWeek }));
  }, [nextWeek]);

  const load = async () => {
    setLoading(true);
    const result = await weeklyLogbooksApi.getMyCurrent();
    if (result.error) {
      toast.error(result.error);
    } else {
      setBundle((result.data as any).bundle);
    }
    setLoading(false);
  };

  const updateActivity = (index: number, key: keyof WeeklyLogActivity, value: string) => {
    setForm((current) => ({
      ...current,
      activities: current.activities.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    }));
  };

  const saveWeek = async () => {
    if (!bundle) return;
    setSaving(true);
    const result = await weeklyLogbooksApi.saveWeek(bundle.logbook.id, form);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Weekly entry saved");
      setForm({
        weekNumber: nextWeek + 1,
        weekBeginning: "",
        weekEnding: "",
        studentRemark: "",
        activities: days.map((day) => ({ day, date: "", activity: "" })),
      });
      await load();
    }
    setSaving(false);
  };

  const finalize = async () => {
    if (!bundle) return;
    if (!confirm("Finalize this Weekly Log Sheet Book? You cannot edit it after final submission.")) return;
    setFinalizing(true);
    const result = await weeklyLogbooksApi.finalize(bundle.logbook.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Weekly Log Sheet Book finalized and sent to supervisor");
      setBundle((result.data as any).bundle);
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

  if (!bundle) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Log Sheet Book</CardTitle>
          <CardDescription>No approved official placement is available for logbook creation.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const placement = bundle.placement || {};
  const student = bundle.student || ({} as any);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
            <BookOpen className="h-7 w-7 text-primary" />
            Weekly Log Sheet Book
          </h1>
          <p className="text-muted-foreground">
            Document weekly internship activities. This is not the supervisor evaluation form.
          </p>
        </div>
        <Badge className="w-fit capitalize" variant={bundle.logbook.status === "rejected" ? "destructive" : "secondary"}>
          {formatStatusLabel(bundle.logbook.status, "ongoing")}
        </Badge>
      </div>

      <Card className="print:shadow-none">
        <CardHeader className="text-center">
          <CardTitle className="uppercase tracking-wide">Weekly Log Sheet Book</CardTitle>
          <CardDescription>Internship / Industrial Training Documentation</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div><span className="font-semibold">Student:</span> {student.firstName} {student.lastName}</div>
          <div><span className="font-semibold">Student ID:</span> {student.studentId || "N/A"}</div>
          <div><span className="font-semibold">Programme:</span> {student.program || "N/A"}</div>
          <div><span className="font-semibold">Department:</span> {student.department || "N/A"}</div>
          <div><span className="font-semibold">Organization:</span> {placement.organization_name || "N/A"}</div>
          <div><span className="font-semibold">Office / Role:</span> {placement.department_role || "N/A"}</div>
          <div><span className="font-semibold">Supervisor:</span> {placement.supervisor_name || "N/A"}</div>
          <div><span className="font-semibold">Duration:</span> {placement.internship_start_date || "N/A"} to {placement.internship_end_date || "N/A"}</div>
        </CardContent>
      </Card>

      {!editable && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="flex items-center gap-3 pt-6 text-emerald-900">
            <Lock className="h-5 w-5" />
            This logbook is locked after final submission.
          </CardContent>
        </Card>
      )}

      {editable && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Weekly Entry
            </CardTitle>
            <CardDescription>Save drafts throughout the internship, then finalize at the end.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Week Number</Label>
                <Input type="number" min={1} value={form.weekNumber} onChange={(e) => setForm({ ...form, weekNumber: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Week Beginning</Label>
                <Input type="date" value={form.weekBeginning} onChange={(e) => setForm({ ...form, weekBeginning: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Week Ending</Label>
                <Input type="date" value={form.weekEnding} onChange={(e) => setForm({ ...form, weekEnding: e.target.value })} />
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="border p-3 text-left">Day</th>
                    <th className="border p-3 text-left">Date</th>
                    <th className="border p-3 text-left">Activities Undertaken</th>
                  </tr>
                </thead>
                <tbody>
                  {form.activities.map((activity, index) => (
                    <tr key={activity.day}>
                      <td className="border p-2"><Input value={activity.day} onChange={(e) => updateActivity(index, "day", e.target.value)} /></td>
                      <td className="border p-2"><Input type="date" value={activity.date} onChange={(e) => updateActivity(index, "date", e.target.value)} /></td>
                      <td className="border p-2"><Textarea value={activity.activity} onChange={(e) => updateActivity(index, "activity", e.target.value)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2">
              <Label>Student Remark</Label>
              <Textarea value={form.studentRemark} onChange={(e) => setForm({ ...form, studentRemark: e.target.value })} />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={saveWeek} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Weekly Draft
              </Button>
              <Button variant="destructive" onClick={finalize} disabled={finalizing || bundle.entries.length === 0}>
                {finalizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Finalize Weekly Log Sheet Book
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5" />
            Completed Weeks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {bundle.entries.length === 0 && <p className="text-muted-foreground">No weekly entries have been saved yet.</p>}
          {bundle.entries.map((entry) => (
            <div key={entry.id} className="rounded-xl border p-4">
              <h3 className="font-semibold">Week {entry.weekNumber}: {entry.weekBeginning} to {entry.weekEnding}</h3>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-muted">
                    <tr><th className="border p-2 text-left">Day</th><th className="border p-2 text-left">Date</th><th className="border p-2 text-left">Activity</th></tr>
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
              {entry.studentRemark && <p className="mt-3 text-sm"><span className="font-semibold">Student remark:</span> {entry.studentRemark}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
