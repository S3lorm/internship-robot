"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Briefcase,
  FileText,
  CheckCircle2,
  Loader2,
  ArrowRight,
  MapPinned,
  Building2,
  Sparkles,
} from "lucide-react";
import {
  DashboardHero,
  DashboardPageShell,
  DashboardQuickLinkCard,
  DashboardSectionHeading,
  DashboardStatTile,
  DashboardStatsGrid,
  dashboardStagger,
  type DashboardStat,
} from "@/components/portal-dashboard-ui";
import { motion } from "framer-motion";
import { lettersApi, placementsApi } from "@/lib/api";
import type { LetterRequest, InternshipPlacement } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { getStudentProgramGroup, groupByProgram } from "@/lib/department-catalog";

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

export default function HOD() {
  const { user } = useAuth();
  const isSecutuary = user?.role === "hod" && user?.originalRole === "secutuary";
  const roleHeading = isSecutuary ? "Secutuary" : "Head of department";
  const roleOverviewTitle = isSecutuary ? "Secutuary overview" : "Department overview";
  const [hodLoading, setHodLoading] = useState(false);
  const [letterRequests, setLetterRequests] = useState<LetterRequest[]>([]);
  const [placementRows, setPlacementRows] = useState<any[]>([]);

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

  const hodPlacementsSorted = useMemo(() => {
    return [...placementRows].sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    ) as InternshipPlacement[];
  }, [placementRows]);

  const placementsByProgram = useMemo(() => {
    if (!user?.department) return [];
    return groupByProgram(hodPlacementsSorted, user.department, (p) => p.student || {});
  }, [hodPlacementsSorted, user?.department]);

  const hodMetrics = useMemo(() => {
    const reqs = letterRequests;
    const total = reqs.length;
    const approved = reqs.filter((r) => r.status === "approved").length;
    const pending = reqs.filter((r) => r.status === "pending").length;
    const rejected = reqs.filter((r) => r.status === "rejected").length;
    const studentIds = new Set(reqs.map((r) => r.studentId).filter(Boolean));
    const placementPending = placementRows.filter((p) => p.status === "pending").length;
    const placementApproved = placementRows.filter((p) => p.status === "approved").length;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    const byProgram: Record<string, { total: number; pending: number }> = {};
    const dept = user?.department || "";
    for (const r of reqs) {
      const p = getStudentProgramGroup(r.student || {}, dept);
      if (!byProgram[p]) byProgram[p] = { total: 0, pending: 0 };
      byProgram[p].total += 1;
      if (r.status === "pending") byProgram[p].pending += 1;
    }

    return {
      activeStudents: studentIds.size,
      placementTotal: placementRows.length,
      placementPending,
      placementApproved,
      totalLetterRequests: total,
      approvalRate,
      pending,
      rejected,
      byProgram,
    };
  }, [letterRequests, placementRows, user?.department]);

  const pendingToAction = useMemo(
    () => letterRequests.filter((r) => r.status === "pending").slice(0, 12),
    [letterRequests]
  );

  const hodStatCards: DashboardStat[] = [
    {
      label: "Active students",
      value: hodMetrics.activeStudents,
      icon: Users,
      gradient: "from-blue-600 to-blue-400",
      glow: "hover:shadow-blue-500/15",
      href: "/admin/department-students",
    },
    {
      label: "Official placements",
      value: hodMetrics.placementTotal,
      icon: Briefcase,
      gradient: "from-emerald-600 to-teal-400",
      glow: "hover:shadow-emerald-500/15",
      href: "/admin/official-placement-management",
    },
    {
      label: "Internship letters",
      value: hodMetrics.totalLetterRequests,
      icon: FileText,
      gradient: "from-violet-600 to-purple-400",
      glow: "hover:shadow-violet-500/15",
      href: "/admin/letter-requests",
    },
    {
      label: "Approval rate",
      value: `${hodMetrics.approvalRate}%`,
      icon: CheckCircle2,
      gradient: "from-amber-500 to-orange-400",
      glow: "hover:shadow-amber-500/15",
    },
  ];

  return (
    <DashboardPageShell>
      <DashboardHero
        badge={
          <>
            <Sparkles className="h-3.5 w-3.5" />
            {roleHeading}
          </>
        }
        title={roleOverviewTitle}
        description="Letter activity, review queue, and Stage 2 official placements for your department — all in one place."
        chips={
          <span className="inline-flex items-center gap-2 rounded-full border border-sidebar-border/80 bg-sidebar-accent/60 px-3 py-1 text-sm font-medium text-sidebar-foreground/90">
            <Building2 className="h-3.5 w-3.5 opacity-90" />
            {user?.department}
          </span>
        }
        action={
          <Button asChild variant="default">
            <Link href="/admin/department-students">
              Students by course
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <section className="relative space-y-3">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Quick actions
        </motion.h2>
        <motion.div
          variants={dashboardStagger}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-3"
        >
          <DashboardQuickLinkCard
            href="/admin/letter-requests"
            title="Letter requests"
            description="Review and approve Stage 1 internship letters."
            icon={FileText}
            accent="from-violet-600 to-indigo-500"
            index={0}
          />
          <DashboardQuickLinkCard
            href="/admin/department-students"
            title="Department students"
            description="Roster grouped by course with internship status."
            icon={Users}
            accent="from-blue-600 to-cyan-500"
            index={1}
          />
          <DashboardQuickLinkCard
            href="/admin/official-placement-management"
            title="Official placements"
            description="Stage 2 requests — approve and email organisations."
            icon={MapPinned}
            accent="from-emerald-600 to-teal-500"
            index={2}
          />
        </motion.div>
      </section>

      {hodLoading ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/20 py-12">
          <Loader2 className="h-9 w-9 animate-spin text-primary/50" />
          <p className="text-sm text-muted-foreground">Loading department data…</p>
        </div>
      ) : (
        <>
          <section className="relative space-y-3">
            <DashboardSectionHeading
              title="At a glance"
              subtitle="Key figures for this department"
            />
            <DashboardStatsGrid loading={false} skeletonCount={4}>
              {hodStatCards.map((stat, i) => (
                <DashboardStatTile key={stat.label} stat={stat} index={i} />
              ))}
            </DashboardStatsGrid>
            <p className="text-xs text-muted-foreground">
              Placements: {hodMetrics.placementPending} pending · {hodMetrics.placementApproved} approved
              {" · "}
              Letters: {hodMetrics.pending} pending · {hodMetrics.rejected} rejected
            </p>
          </section>

          <div>
            <h2 className="text-sm font-semibold text-foreground">Letters &amp; students</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Stage 1 request distribution and your review queue</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Card className="overflow-hidden border-border/60 shadow-sm">
                <CardHeader className="space-y-1.5 border-b border-border/50 bg-muted/20 pb-4 sm:flex sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <div>
                      <CardTitle className="text-base">By course / programme</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Letter requests grouped by student course
                      </CardDescription>
                  </div>
                  <Button variant="secondary" size="sm" className="shrink-0 shadow-none" asChild>
                    <Link href="/admin/letter-requests">Manage all</Link>
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[min(24rem,55vh)] space-y-0 overflow-y-auto p-3">
                    {Object.keys(hodMetrics.byProgram).length === 0 ? (
                      <p className="px-2 py-6 text-center text-sm text-muted-foreground">No letter requests yet.</p>
                    ) : (
                      Object.entries(hodMetrics.byProgram)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([prefix, v]) => {
                          const pct = v.total > 0 ? Math.round((v.pending / v.total) * 100) : 0;
                          return (
                            <div key={prefix} className="border-b border-border/40 last:border-0">
                              <div className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-muted/40 sm:px-3">
                                <div className="min-w-0">
                                  <span className="text-sm font-semibold tracking-tight text-foreground">
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
                <Link href="/admin/official-placement-management">
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
                  <div className="space-y-6">
                    {placementsByProgram.map((group) => (
                      <div key={group.program}>
                        <h4 className="mb-2 text-sm font-semibold text-foreground">{group.program}</h4>
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
                              {group.items.slice(0, 8).map((p, i) => (
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
                                      className={cn(
                                        "capitalize shadow-none",
                                        placementStatusBadgeClass(p.status as string)
                                      )}
                                    >
                                      {String(p.status).replace("_", " ")}
                                    </Badge>
                                  </td>
                                  <td
                                    className="max-w-[200px] truncate p-3 align-top"
                                    title={p.organizationName}
                                  >
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
                      </div>
                    ))}
                  </div>
                  {hodPlacementsSorted.length > 8 && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Preview by course. Open the full list for all {hodPlacementsSorted.length} requests.
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </DashboardPageShell>
  );
}
