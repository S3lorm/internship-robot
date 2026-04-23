"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Users,
  Briefcase,
  FileText,
  CheckCircle2,
  Bell,
  Loader2,
  ArrowRight,
  MapPinned,
  Building2,
} from "lucide-react";
import { lettersApi, placementsApi } from "@/lib/api";
import type { LetterRequest, InternshipPlacement } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

function letterStudentPrefix(r: LetterRequest): string {
  const sid = r.student?.studentId || "";
  const u = sid.toUpperCase().replace(/\s/g, "");
  const m = u.match(/^([A-Z]{2,4})/);
  return m ? m[1] : "Other";
}

function departmentKey(studentDepartment: string | undefined | null) {
  const t = studentDepartment?.trim();
  return t && t.length > 0 ? t : "Unassigned";
}

function sortDepartmentKeys(keys: string[]) {
  const rest = keys.filter((k) => k !== "Unassigned").sort((a, b) => a.localeCompare(b));
  if (keys.includes("Unassigned")) rest.push("Unassigned");
  return rest;
}

function placementStatusBadgeClass(status: string | undefined) {
  const s = String(status ?? "")
    .toLowerCase()
    .replace(/_/g, " ");
  if (s === "pending") {
    return "border-amber-200/90 bg-amber-50 text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100";
  }
  if (s === "approved") {
    return "border-emerald-200/90 bg-emerald-50 text-emerald-950 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100";
  }
  if (s === "rejected" || s === "denied") {
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }
  return "border-border bg-muted/60 text-foreground";
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [hodLoading, setHodLoading] = useState(false);
  const [letterRequests, setLetterRequests] = useState<LetterRequest[]>([]);
  const [placementRows, setPlacementRows] = useState<any[]>([]);

  const [adminLoading, setAdminLoading] = useState(false);
  const [adminLetterRequests, setAdminLetterRequests] = useState<LetterRequest[]>([]);

  useEffect(() => {
    if (user?.role !== "hod" || !user.department) return;

    async function loadHod() {
      setHodLoading(true);
      try {
        const [lrRes, trRes] = await Promise.all([
          lettersApi.getRequests(),
          placementsApi.getTrackingData(),
        ]);

        const reqs = (lrRes as any).data?.requests || (lrRes as any).requests || [];
        setLetterRequests(Array.isArray(reqs) ? reqs : []);

        const track = (trRes as any).data?.trackingData || [];
        setPlacementRows(Array.isArray(track) ? track : []);
      } catch {
        toast.error("Failed to load department dashboard");
      } finally {
        setHodLoading(false);
      }
    }

    void loadHod();
  }, [user?.role, user?.department]);

  useEffect(() => {
    if (user?.role !== "admin") return;

    async function loadAdmin() {
      setAdminLoading(true);
      try {
        const lrRes = await lettersApi.getRequests();
        const reqs = (lrRes as any).data?.requests || (lrRes as any).requests || [];
        setAdminLetterRequests(Array.isArray(reqs) ? reqs : []);
      } catch {
        toast.error("Failed to load letter requests by department");
      } finally {
        setAdminLoading(false);
      }
    }

    void loadAdmin();
  }, [user?.role]);

  const lettersByDepartment = useMemo(() => {
    const map = new Map<string, LetterRequest[]>();
    for (const r of adminLetterRequests) {
      const d = departmentKey(r.student?.department);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(r);
    }
    return map;
  }, [adminLetterRequests]);

  const adminDepartmentKeysOrdered = useMemo(
    () => sortDepartmentKeys(Array.from(lettersByDepartment.keys())),
    [lettersByDepartment]
  );

  const hodPlacementsSorted = useMemo(() => {
    return [...placementRows].sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    ) as InternshipPlacement[];
  }, [placementRows]);

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
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-linear-to-br from-primary/8 via-card to-card shadow-sm">
          <div
            className="pointer-events-none absolute -right-8 -top-20 h-56 w-56 rounded-full bg-primary/12 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full bg-accent/10 blur-2xl"
            aria-hidden
          />
          <div className="relative p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/90">Head of department</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Department overview</h1>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-sm font-medium text-primary"
                title="Your scope"
              >
                <Building2 className="h-3.5 w-3.5 opacity-80" />
                {user.department}
              </span>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Letter activity, review queue, and Stage 2 official placements for your department — all in one place.
            </p>
          </div>
        </div>

        {hodLoading ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/20 py-12">
            <Loader2 className="h-9 w-9 animate-spin text-primary/50" />
            <p className="text-sm text-muted-foreground">Loading department data…</p>
          </div>
        ) : (
          <>
            <div>
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">At a glance</h2>
                  <p className="text-sm text-muted-foreground">Key figures for this department</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="border-border/60 shadow-sm transition-shadow duration-200 hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1.5">
                        <p className="text-sm font-medium text-muted-foreground">Active students</p>
                        <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
                          {hodMetrics.activeStudents}
                        </p>
                        <p className="text-xs leading-relaxed text-muted-foreground/90">
                          With letter activity in your department
                        </p>
                      </div>
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Users className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/60 shadow-sm transition-shadow duration-200 hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1.5">
                        <p className="text-sm font-medium text-muted-foreground">Ongoing placements</p>
                        <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
                          {hodMetrics.ongoingPlacements}
                        </p>
                        <p className="text-xs leading-relaxed text-muted-foreground/90">
                          Approved official placements (Stage 2)
                        </p>
                      </div>
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Briefcase className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/60 shadow-sm transition-shadow duration-200 hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1.5">
                        <p className="text-sm font-medium text-muted-foreground">Internship letters</p>
                        <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
                          {hodMetrics.totalLetterRequests}
                        </p>
                        <p className="text-xs text-muted-foreground/90">
                          {hodMetrics.pending} pending · {hodMetrics.rejected} rejected
                        </p>
                      </div>
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/60 shadow-sm transition-shadow duration-200 hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1.5">
                        <p className="text-sm font-medium text-muted-foreground">Letter approval rate</p>
                        <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
                          {hodMetrics.approvalRate}%
                        </p>
                        <p className="text-xs text-muted-foreground/90">Approved of all letter requests</p>
                      </div>
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-foreground">Letters &amp; students</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Stage 1 request distribution and your review queue</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Card className="overflow-hidden border-border/60 shadow-sm">
                  <CardHeader className="space-y-1.5 border-b border-border/50 bg-muted/20 pb-4 sm:flex sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                    <div>
                      <CardTitle className="text-base">By programme ID</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Grouped by student ID prefix (e.g. BIT, DIT)
                      </CardDescription>
                    </div>
                    <Button variant="secondary" size="sm" className="shrink-0 shadow-none" asChild>
                      <Link href="/admin/letter-requests">Manage all</Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[min(24rem,55vh)] space-y-0 overflow-y-auto p-3">
                      {Object.keys(hodMetrics.byPrefix).length === 0 ? (
                        <p className="px-2 py-6 text-center text-sm text-muted-foreground">No letter requests yet.</p>
                      ) : (
                        Object.entries(hodMetrics.byPrefix)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([prefix, v]) => {
                            const pct = v.total > 0 ? Math.round((v.pending / v.total) * 100) : 0;
                            return (
                              <div
                                key={prefix}
                                className="border-b border-border/40 last:border-0"
                              >
                                <div className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-muted/40 sm:px-3">
                                  <div className="min-w-0">
                                    <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
                                      {prefix}
                                    </span>
                                    {v.pending > 0 && (
                                      <span className="ml-2 inline-flex text-xs text-amber-700/90 dark:text-amber-200/90">
                                        {v.pending} pending
                                      </span>
                                    )}
                                  </div>
                                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                                    {v.total} total
                                  </span>
                                </div>
                                {v.total > 0 && (
                                  <div className="px-3 pb-2">
                                    <div
                                      className="relative h-1.5 w-full overflow-hidden rounded-full bg-border/55"
                                      title={`${v.pending} pending of ${v.total} total`}
                                    >
                                      {pct > 0 && (
                                        <div
                                          className="absolute left-0 top-0 h-full rounded-l-full bg-amber-500/50 dark:bg-amber-400/35"
                                          style={{ width: `${pct}%` }}
                                        />
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 border-l-4 border-l-amber-500/35 shadow-sm dark:border-l-amber-500/30">
                  <CardHeader>
                    <CardTitle className="text-base">Pending review</CardTitle>
                    <CardDescription className="text-sm">
                      Approve or reject in the full queue if anything was missed or denied in error.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {pendingToAction.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-border/70 bg-muted/10 px-4 py-8 text-center text-sm text-muted-foreground">
                        You&apos;re all caught up — no pending letter requests.
                      </p>
                    ) : (
                      pendingToAction.map((r) => (
                        <div
                          key={r.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-card px-3 py-2.5 text-sm shadow-sm transition-shadow hover:shadow"
                        >
                          <div className="min-w-0">
                            <span className="font-medium text-foreground">
                              {r.student?.firstName} {r.student?.lastName}
                            </span>
                            <span className="ml-2 font-mono text-xs text-muted-foreground">{r.student?.studentId}</span>
                          </div>
                          <Button size="sm" variant="secondary" className="shrink-0" asChild>
                            <Link href="/admin/letter-requests">Open queue</Link>
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="overflow-hidden border-border/60 bg-linear-to-b from-card to-muted/20 shadow-sm">
              <div className="h-0.5 bg-linear-to-r from-primary/40 via-accent/30 to-primary/20" />
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 rounded-md border border-primary/15 bg-primary/5 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-primary/90">
                    <MapPinned className="h-3.5 w-3.5" />
                    Stage 2
                  </div>
                  <CardTitle className="flex items-center gap-2.5 text-xl">
                    <span>Official placement requests</span>
                  </CardTitle>
                  <CardDescription className="max-w-2xl text-sm leading-relaxed">
                    When you approve, the official letter and supervisor evaluation link are emailed to the
                    organisation. For actions and full history, use{" "}
                    <span className="font-medium text-foreground/90">Official placements</span>.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  className="h-9 shrink-0 border border-primary/15 bg-primary/5 text-primary shadow-none hover:bg-primary/10"
                  variant="outline"
                  asChild
                >
                  <Link href="/admin/internship-tracking">
                    Open full list
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <Separator className="bg-border/60" />
              <CardContent className="pt-6">
                {hodPlacementsSorted.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border/80 bg-background/50 px-4 py-10 text-center text-sm text-muted-foreground">
                    No official placement requests yet for your department.
                  </p>
                ) : (
                  <>
                    <p className="mb-4 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {hodPlacementsSorted.filter((p) => p.status === "pending").length} pending
                      </span>{" "}
                      · {hodPlacementsSorted.length} total
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-border/60 bg-card shadow-inner">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/60 bg-primary/4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <th className="p-3 font-medium">Student</th>
                            <th className="p-3 font-medium">Status</th>
                            <th className="p-3 font-medium">Organisation</th>
                            <th className="p-3 font-medium">Ref</th>
                          </tr>
                        </thead>
                        <tbody>
                          {hodPlacementsSorted.slice(0, 20).map((p, i) => (
                            <tr
                              key={p.id}
                              className={cn(
                                "border-b border-border/40 last:border-0",
                                i % 2 === 0 ? "bg-card" : "bg-muted/15"
                              )}
                            >
                              <td className="p-3 align-top">
                                <div className="font-medium text-foreground">
                                  {p.student?.firstName} {p.student?.lastName}
                                </div>
                                <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                                  {p.student?.studentId}
                                </div>
                              </td>
                              <td className="p-3 align-top">
                                <Badge
                                  variant="outline"
                                  className={cn("capitalize shadow-none", placementStatusBadgeClass(p.status as string))}
                                >
                                  {String(p.status).replace("_", " ")}
                                </Badge>
                              </td>
                              <td className="max-w-[200px] truncate p-3 align-top" title={p.organizationName}>
                                {p.organizationName}
                              </td>
                              <td className="p-3 font-mono text-xs align-top text-muted-foreground">
                                {p.referenceNumber || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {hodPlacementsSorted.length > 20 && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Showing 20 of {hodPlacementsSorted.length}. Open the full list for the complete list.
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm bg-linear-to-r from-primary to-primary/80 text-primary-foreground">
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

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Internship letter requests by department
              </CardTitle>
              <CardDescription>
                All Stage 1 general letter requests, grouped by the student&apos;s registered department. Official
                placements (Stage 2) are managed on each HOD&apos;s dashboard and in Official placements.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/letter-requests">Open letter queue</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/official-placement-management">Official placement management (all depts.)</Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {adminLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : adminDepartmentKeysOrdered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No letter requests in the system yet.</p>
          ) : (
            <Accordion type="multiple" className="w-full">
              {adminDepartmentKeysOrdered.map((dept) => {
                const letters = lettersByDepartment.get(dept)!;
                const lPending = letters.filter((l) => l.status === "pending").length;
                return (
                  <AccordionItem key={dept} value={dept} className="border rounded-lg px-3 mb-2">
                    <AccordionTrigger className="text-left hover:no-underline py-3 text-sm sm:text-base">
                      <div className="flex flex-1 flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pr-2">
                        <span className="font-semibold">{dept}</span>
                        <span className="text-xs sm:text-sm text-muted-foreground font-normal">
                          {letters.length} letter request{letters.length === 1 ? "" : "s"}
                          {lPending > 0 ? ` · ${lPending} pending` : ""}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="overflow-x-auto rounded-md border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                            <tr>
                              <th className="p-2 font-medium">Student</th>
                              <th className="p-2 font-medium">Type</th>
                              <th className="p-2 font-medium">Status</th>
                              <th className="p-2 font-medium">Company / purpose</th>
                            </tr>
                          </thead>
                          <tbody>
                            {letters.slice(0, 20).map((r) => (
                              <tr key={r.id} className="border-t">
                                <td className="p-2">
                                  {r.student?.firstName} {r.student?.lastName}
                                  <br />
                                  <span className="text-xs text-muted-foreground">{r.student?.studentId}</span>
                                </td>
                                <td className="p-2 capitalize">{r.requestType}</td>
                                <td className="p-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {r.status}
                                  </Badge>
                                </td>
                                <td className="p-2 max-w-[200px] truncate" title={r.companyName || r.purpose}>
                                  {r.companyName || r.purpose}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {letters.length > 20 && (
                          <p className="p-2 text-xs text-muted-foreground border-t">
                            Showing 20 of {letters.length}. Open the full queue for the rest.
                          </p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
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
