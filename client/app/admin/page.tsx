"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Briefcase,
  FileText,
  CheckCircle2,
  BarChart3,
  ClipboardCheck,
  Bell,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { lettersApi, placementsApi, evaluationsApi } from "@/lib/api";
import type { LetterRequest } from "@/types";
import { toast } from "sonner";

function letterStudentPrefix(r: LetterRequest): string {
  const sid = r.student?.studentId || "";
  const u = sid.toUpperCase().replace(/\s/g, "");
  const m = u.match(/^([A-Z]{2,4})/);
  return m ? m[1] : "Other";
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [hodLoading, setHodLoading] = useState(false);
  const [letterRequests, setLetterRequests] = useState<LetterRequest[]>([]);
  const [placementRows, setPlacementRows] = useState<any[]>([]);
  const [evaluationCount, setEvaluationCount] = useState(0);

  useEffect(() => {
    if (user?.role !== "hod" || !user.department) return;

    async function loadHod() {
      setHodLoading(true);
      try {
        const [lrRes, trRes, evRes] = await Promise.all([
          lettersApi.getRequests(),
          placementsApi.getTrackingData(),
          evaluationsApi.getAll(),
        ]);

        const reqs = (lrRes as any).data?.requests || (lrRes as any).requests || [];
        setLetterRequests(Array.isArray(reqs) ? reqs : []);

        const track = (trRes as any).data?.trackingData || [];
        setPlacementRows(Array.isArray(track) ? track : []);

        const evs = (evRes as any).data?.evaluations || [];
        setEvaluationCount(Array.isArray(evs) ? evs.length : 0);
      } catch {
        toast.error("Failed to load department dashboard");
      } finally {
        setHodLoading(false);
      }
    }

    void loadHod();
  }, [user?.role, user?.department]);

  const hodMetrics = useMemo(() => {
    const reqs = letterRequests;
    const total = reqs.length;
    const approved = reqs.filter((r) => r.status === "approved").length;
    const pending = reqs.filter((r) => r.status === "pending").length;
    const rejected = reqs.filter((r) => r.status === "rejected").length;
    const studentIds = new Set(reqs.map((r) => r.studentId).filter(Boolean));
    const ongoing = placementRows.filter((p) => p.status === "approved").length;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    const byPrefix: Record<string, { total: number; pending: number }> = {};
    for (const r of reqs) {
      const p = letterStudentPrefix(r);
      if (!byPrefix[p]) byPrefix[p] = { total: 0, pending: 0 };
      byPrefix[p].total += 1;
      if (r.status === "pending") byPrefix[p].pending += 1;
    }

    return {
      activeStudents: studentIds.size,
      ongoingPlacements: ongoing,
      totalLetterRequests: total,
      approvalRate,
      pending,
      rejected,
      byPrefix,
    };
  }, [letterRequests, placementRows]);

  const pendingToAction = useMemo(
    () => letterRequests.filter((r) => r.status === "pending").slice(0, 12),
    [letterRequests]
  );

  if (user?.role === "hod") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Department overview</h1>
          <p className="text-muted-foreground mt-1">
            {user.department} — analytics, letter requests, placements, and evaluations for your department only.
          </p>
        </div>

        {hodLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Active students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{hodMetrics.activeStudents}</p>
                  <p className="text-xs text-muted-foreground mt-1">Students with letter activity in your department</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Ongoing placements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{hodMetrics.ongoingPlacements}</p>
                  <p className="text-xs text-muted-foreground mt-1">Approved official placements (Stage 2)</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Internship letters requested
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{hodMetrics.totalLetterRequests}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {hodMetrics.pending} pending · {hodMetrics.rejected} rejected
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Letter approval rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{hodMetrics.approvalRate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Approved ÷ all letter requests</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Letter requests by programme ID</CardTitle>
                    <CardDescription>Grouped by student ID prefix (e.g. BIT, DIT)</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/letter-requests">Manage all</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.keys(hodMetrics.byPrefix).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No requests yet.</p>
                    ) : (
                      Object.entries(hodMetrics.byPrefix)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([prefix, v]) => (
                          <div
                            key={prefix}
                            className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                          >
                            <span className="font-medium">{prefix}</span>
                            <span className="text-muted-foreground">
                              {v.pending} pending / {v.total} total
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pending review</CardTitle>
                  <CardDescription>
                    Approve or reject from the full queue if anything was missed or denied in error.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pendingToAction.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No pending letter requests.</p>
                  ) : (
                    pendingToAction.map((r) => (
                      <div
                        key={r.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                      >
                        <div>
                          <span className="font-medium">
                            {r.student?.firstName} {r.student?.lastName}
                          </span>
                          <span className="text-muted-foreground ml-2">{r.student?.studentId}</span>
                        </div>
                        <Button size="sm" variant="secondary" asChild>
                          <Link href="/admin/letter-requests">Open queue</Link>
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/admin/analytics">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Detailed analytics
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/internship-tracking">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Internship tracking
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/evaluations">
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Evaluations ({evaluationCount})
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/notifications">
                  <Bell className="mr-2 h-4 w-4" />
                  Department notices
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">System administration</h1>
              <p className="text-primary-foreground/85 mt-1 max-w-xl">
                Manage students and heads of department by department, broadcast notices, and review internship
                applications. Department-level tools live on each HOD&apos;s dashboard.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Users &amp; HODs
            </CardTitle>
            <CardDescription>Filter by department, activate or deactivate accounts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/users">
                Open user management
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Applications
            </CardTitle>
            <CardDescription>Approve or deny internship applications across the institution.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/applications">
                Review applications
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5" />
              Notices
            </CardTitle>
            <CardDescription>Broadcast announcements to students or departments.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/notices">
                Manage notices
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
