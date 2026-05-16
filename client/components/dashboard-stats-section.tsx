"use client";

import { motion } from "framer-motion";
import {
  Bell,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  DashboardSectionHeading,
  DashboardStatTile,
  DashboardStatsGrid,
  type DashboardStat,
} from "@/components/portal-dashboard-ui";

export type DashboardStatsData = {
  total: number;
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
  letterRequestsPending: number;
};

type DashboardStatsSectionProps = {
  stats: DashboardStatsData;
  unreadNotifications: number;
  activeNoticesCount: number;
  loading: boolean;
};

const ease = [0.22, 1, 0.36, 1] as const;

export function DashboardStatsSection({
  stats,
  unreadNotifications,
  activeNoticesCount,
  loading,
}: DashboardStatsSectionProps) {
  const inProgress = stats.pending + stats.underReview;
  const resolved = stats.approved + stats.rejected;
  const progressPct = stats.total > 0 ? (resolved / stats.total) * 100 : 0;

  const statCards: DashboardStat[] = [
    {
      label: "Unread alerts",
      value: unreadNotifications,
      icon: Bell,
      gradient: "from-blue-600 to-cyan-500",
      glow: "hover:shadow-blue-500/15",
      href: "/dashboard/notifications",
    },
    {
      label: "In progress",
      value: inProgress,
      icon: Clock,
      gradient: "from-amber-500 to-orange-400",
      glow: "hover:shadow-amber-500/15",
      href: "/dashboard/applications",
    },
    {
      label: "Letter requests",
      value: stats.letterRequestsPending,
      icon: FileText,
      gradient: "from-violet-600 to-indigo-500",
      glow: "hover:shadow-violet-500/15",
      href: "/dashboard/letter-requests",
    },
    {
      label: "Approved",
      value: stats.approved,
      icon: CheckCircle2,
      gradient: "from-emerald-600 to-teal-400",
      glow: "hover:shadow-emerald-500/15",
      href: "/dashboard/applications",
    },
  ];

  if (loading) {
    return (
      <section className="relative space-y-3">
        <DashboardSectionHeading title="Your overview" subtitle="Loading internship summary…" />
        <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  return (
    <section className="relative space-y-4">
      <DashboardSectionHeading
        title="Your overview"
        subtitle="Tap a card to jump straight to what matters."
        aside={
          stats.total > 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, ease }}
              className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-1.5"
            >
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground sm:text-sm">
                {Math.round(progressPct)}% resolved
              </span>
            </motion.div>
          ) : undefined
        }
      />

      {!loading && activeNoticesCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {activeNoticesCount} active notice{activeNoticesCount !== 1 ? "s" : ""} on your dashboard
        </p>
      )}

      <DashboardStatsGrid loading={false} skeletonCount={4} columns="sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat, i) => (
          <DashboardStatTile key={stat.label} stat={stat} index={i} />
        ))}
      </DashboardStatsGrid>

      {stats.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.55, ease }}
          className="rounded-xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <p className="font-semibold text-foreground">Application pipeline</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {resolved} of {stats.total} resolved
            </p>
          </div>
          <Progress value={progressPct} className="mb-4 h-2.5" />
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {[
              { label: "Pending", value: stats.pending, dot: "bg-amber-500" },
              { label: "Under review", value: stats.underReview, dot: "bg-blue-500" },
              { label: "Approved", value: stats.approved, dot: "bg-emerald-500" },
              { label: "Rejected", value: stats.rejected, dot: "bg-red-500" },
            ].map((row, i) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.06, ease }}
                className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2"
              >
                <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", row.dot)} />
                <span className="text-muted-foreground">{row.label}</span>
                <span className="ml-auto font-semibold tabular-nums">{row.value}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </section>
  );
}
