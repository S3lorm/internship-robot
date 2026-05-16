"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dashboardFadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export const dashboardStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export function DashboardPageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative space-y-8 pb-4", className)}>
      {children}
    </div>
  );
}

export function DashboardHero({
  badge,
  title,
  description,
  action,
  chips,
}: {
  badge: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  chips?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-sidebar-border bg-sidebar p-6 text-sidebar-foreground shadow-md md:p-8"
    >
      <div className="relative flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-sidebar-border/80 bg-sidebar-accent/60 px-3 py-1 text-xs font-medium text-sidebar-foreground/90">
              {badge}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-sidebar-foreground md:text-3xl">{title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-sidebar-foreground/80 md:text-base">{description}</p>
            {chips ? <div className="mt-3 flex flex-wrap gap-2">{chips}</div> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </div>
    </motion.div>
  );
}

export type DashboardStat = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  href?: string;
  gradient?: string;
  glow?: string;
};

export function DashboardStatTile({
  stat,
  index = 0,
}: {
  stat: DashboardStat;
  index?: number;
}) {
  const Icon = stat.icon;
  const inner = (
    <div
      className={cn(
        "group rounded-xl border border-border bg-card p-4 shadow-sm",
        "transition-colors duration-200 hover:bg-muted/40",
        stat.href && "cursor-pointer"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">{stat.value}</p>
          <p className="text-xs text-muted-foreground">{stat.label}</p>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div variants={dashboardFadeUp} custom={index}>
      {stat.href ? <Link href={stat.href}>{inner}</Link> : inner}
    </motion.div>
  );
}

export function DashboardSectionHeading({
  title,
  subtitle,
  aside,
  delay = 0.15,
}: {
  title: string;
  subtitle?: string;
  aside?: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className="flex items-center justify-between gap-2"
    >
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {aside}
    </motion.div>
  );
}

export function DashboardStatsGrid({
  loading,
  skeletonCount = 4,
  children,
  columns = "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
}: {
  loading?: boolean;
  skeletonCount?: number;
  children: React.ReactNode;
  columns?: string;
}) {
  if (loading) {
    return (
      <div className={cn("grid gap-3", columns)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="h-[88px] animate-pulse rounded-xl bg-muted/60" />
        ))}
      </div>
    );
  }
  return (
    <motion.div
      variants={dashboardStagger}
      initial="hidden"
      animate="visible"
      className={cn("grid gap-3", columns)}
    >
      {children}
    </motion.div>
  );
}

export function DashboardQuickLinkCard({
  href,
  title,
  description,
  icon: Icon,
  accent: _accent,
  wide,
  index = 0,
  label = "Open",
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent?: string;
  wide?: boolean;
  index?: number;
  label?: string;
}) {
  return (
    <motion.div variants={dashboardFadeUp} custom={index} className={wide ? "md:col-span-2" : undefined}>
      <Card
        className={cn(
          "group h-full border-border bg-card shadow-sm",
          "transition-colors duration-200 hover:bg-muted/30"
        )}
      >
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icon className="h-4 w-4" />
            </span>
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Button asChild variant="outline" size="sm" className="group/btn">
            <Link href={href}>
              {label}
              <span className="ml-1.5 inline-block transition-transform group-hover/btn:translate-x-0.5">→</span>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DashboardAnimatedCard({
  children,
  className,
  index = 0,
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
}) {
  return (
    <motion.div variants={dashboardFadeUp} custom={index}>
      <Card
        className={cn(
          "border-border bg-card shadow-sm",
          "transition-colors duration-200 hover:bg-muted/20",
          className
        )}
      >
        {children}
      </Card>
    </motion.div>
  );
}
