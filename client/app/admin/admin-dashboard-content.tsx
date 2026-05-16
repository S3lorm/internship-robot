"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { usersApi } from "@/lib/api";
import type { User } from "@/types";
import {
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  Shield,
  Bell,
  MapPinned,
  Settings2,
  Sparkles,
} from "lucide-react";
import {
  DashboardHero,
  DashboardPageShell,
  DashboardQuickLinkCard,
  DashboardSectionHeading,
  DashboardStatTile,
  DashboardStatsGrid,
  type DashboardStat,
} from "@/components/portal-dashboard-ui";

const quickLinks = [
  {
    href: "/admin/portal-management",
    title: "Internship portal",
    description: "Open or close student letter and placement requests.",
    icon: Settings2,
    accent: "from-blue-600 to-cyan-500",
  },
  {
    href: "/admin/users",
    title: "Users & HODs",
    description: "Manage accounts by department.",
    icon: Users,
    accent: "from-violet-600 to-indigo-500",
  },
  {
    href: "/admin/notices",
    title: "Notices",
    description: "Announcements for students and staff.",
    icon: Bell,
    accent: "from-amber-500 to-orange-500",
  },
  {
    href: "/admin/official-placement-management",
    title: "Official placements",
    description: "Stage 2 requests and approvals.",
    icon: MapPinned,
    accent: "from-emerald-600 to-teal-500",
    wide: true,
  },
] as const;

export function AdminDashboardContent() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const all: User[] = [];
        let page = 1;
        const limit = 100;
        for (;;) {
          const res = await usersApi.getAll({ page: String(page), limit: String(limit) });
          const body = (res as { data?: { data?: User[]; meta?: { total?: number } } }).data;
          const fetched =
            body?.data ||
            (res as { data?: { users?: User[] } }).data?.users ||
            (res as { users?: User[] }).users ||
            [];
          const total = body?.meta?.total ?? fetched.length;
          all.push(...fetched);
          if (all.length >= total || fetched.length === 0) break;
          page += 1;
          if (page > 100) break;
        }
        if (mounted) setUsers(all.filter((u) => u.role !== "admin"));
      } catch {
        if (mounted) setUsers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.isActive).length,
      inactive: users.filter((u) => !u.isActive).length,
      students: users.filter((u) => u.role === "student").length,
      hods: users.filter((u) => u.role === "hod").length,
      secutuaries: users.filter((u) => u.role === "secutuary").length,
    }),
    [users]
  );

  const statCards: DashboardStat[] = [
    {
      label: "Total accounts",
      value: loading ? 0 : stats.total,
      icon: Users,
      gradient: "from-blue-600 to-blue-400",
      glow: "hover:shadow-blue-500/15",
    },
    {
      label: "Active",
      value: loading ? 0 : stats.active,
      icon: UserCheck,
      gradient: "from-emerald-600 to-green-400",
      glow: "hover:shadow-emerald-500/15",
    },
    {
      label: "Inactive",
      value: loading ? 0 : stats.inactive,
      icon: UserX,
      gradient: "from-rose-500 to-red-400",
      glow: "hover:shadow-rose-500/15",
    },
    {
      label: "Students",
      value: loading ? 0 : stats.students,
      icon: GraduationCap,
      gradient: "from-violet-600 to-purple-400",
      glow: "hover:shadow-violet-500/15",
    },
    {
      label: "HODs",
      value: loading ? 0 : stats.hods,
      icon: Shield,
      gradient: "from-indigo-600 to-blue-500",
      glow: "hover:shadow-indigo-500/15",
    },
    {
      label: "Secretaries",
      value: loading ? 0 : stats.secutuaries,
      icon: Shield,
      gradient: "from-cyan-600 to-teal-400",
      glow: "hover:shadow-cyan-500/15",
    },
  ];

  const firstName = user?.firstName || "Admin";

  return (
    <DashboardPageShell>
      <DashboardHero
        badge={
          <>
            <Sparkles className="h-3.5 w-3.5" />
            Admin overview
          </>
        }
        title={`Welcome back, ${firstName}`}
        description="Portal control, user accounts, notices, and official placements — all in one place."
      />

      <section className="relative space-y-3">
        <DashboardSectionHeading
          title="User accounts"
          aside={
            !loading ? (
              <span className="text-xs text-muted-foreground">Excludes system administrators</span>
            ) : undefined
          }
        />
        <DashboardStatsGrid loading={loading} skeletonCount={6} columns="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statCards.map((stat, i) => (
            <DashboardStatTile key={stat.label} stat={stat} index={i} />
          ))}
        </DashboardStatsGrid>
      </section>

      <section className="relative space-y-3">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Quick actions
        </motion.h2>
        <motion.div
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
          }}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-2"
        >
          {quickLinks.map((link, i) => (
            <DashboardQuickLinkCard key={link.href} {...link} index={i + 2} />
          ))}
        </motion.div>
      </section>
    </DashboardPageShell>
  );
}
