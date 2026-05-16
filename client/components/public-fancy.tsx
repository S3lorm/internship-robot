"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: "easeOut" as const },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
};

export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={fadeUp}
      custom={delay}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-48px" }}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type FancyCardProps = {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  delay?: number;
  className?: string;
  accent?: "primary" | "accent" | "blend";
};

const accentMap = {
  primary: "from-primary to-primary/75",
  accent: "from-primary to-accent",
  blend: "from-primary via-primary to-accent",
};

export function FancyCard({
  icon: Icon,
  title,
  children,
  delay = 0,
  className,
  accent = "primary",
}: FancyCardProps) {
  return (
    <motion.div variants={fadeUp} custom={delay}>
      <Card
        className={cn(
          "group relative overflow-hidden border-primary/20 bg-card/80 backdrop-blur-sm transition-all duration-300",
          "hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10",
          className
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition-opacity duration-500 group-hover:opacity-40",
            accentMap[accent]
          )}
        />
        <CardContent className="relative p-6">
          <div className="mb-4 flex items-center gap-3">
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-primary-foreground shadow-lg shadow-primary/25",
                accentMap[accent]
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          </div>
          <div className="text-sm leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline">
            {children}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function PolicyStep({
  number,
  title,
  children,
  delay = 0,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div variants={fadeUp} custom={delay}>
      <div className="group relative flex gap-5 rounded-2xl border border-primary/20 bg-gradient-to-br from-card/95 to-secondary/30 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/35 hover:shadow-lg hover:shadow-primary/10">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground shadow-md shadow-primary/25">
          {number}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="mb-2 text-lg font-semibold text-foreground">{title}</h2>
          <div className="space-y-2 text-sm leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-primary hover:[&_a]:underline">
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function ContactCard({
  icon: Icon,
  title,
  children,
  delay = 0,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div variants={fadeUp} custom={delay} className="h-full">
      <Card className="group h-full overflow-hidden border-primary/20 bg-card/90 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/15">
        <CardContent className="relative flex h-full gap-4 p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30 transition-transform duration-300 group-hover:scale-110">
            <Icon className="h-5 w-5" />
          </div>
          <div className="relative min-w-0">
            <h2 className="font-semibold text-foreground">{title}</h2>
            <div className="mt-2 text-sm leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:transition-colors hover:[&_a]:text-primary/80">
              {children}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function BlueCtaBanner({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <FadeIn>
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-primary p-6 text-primary-foreground shadow-xl shadow-primary/25 md:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-primary-foreground/10 blur-2xl" />
        <h3 className="relative mb-2 text-lg font-semibold md:text-xl">{title}</h3>
        <div className="relative text-sm leading-relaxed text-primary-foreground/90 [&_a]:font-semibold [&_a]:text-primary-foreground [&_a]:underline-offset-4 hover:[&_a]:underline">
          {children}
        </div>
      </div>
    </FadeIn>
  );
}
