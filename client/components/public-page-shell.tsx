"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";

const footerLinks = [
  { href: "/about", label: "About Us" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/contact", label: "Contact" },
] as const;

type PublicPageShellProps = {
  title: string;
  description?: string;
  badge?: string;
  children: React.ReactNode;
};

export function PublicPageShell({
  title,
  description,
  badge = "RMU Internship Portal",
  children,
}: PublicPageShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-secondary/40 via-background to-background">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-32 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 24, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-[28%] h-80 w-80 rounded-full bg-accent/15 blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, -20, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-24 left-1/3 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
        animate={{ x: [0, 24, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
            <div className="flex h-11 w-[118px] items-center justify-center p-1 sm:h-12 sm:w-[132px]">
              <Image
                src="/rmu-logo.png"
                alt="RMU Logo"
                width={220}
                height={72}
                className="h-full w-full rounded-2xl object-contain drop-shadow-sm"
              />
            </div>
            <span className="hidden text-sm font-semibold text-foreground sm:inline">
              RMU Internship Portal
            </span>
          </Link>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-primary/25 bg-card/60 hover:border-primary/50 hover:bg-primary/5"
          >
            <Link href="/" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </Button>
        </div>
      </header>

      <main className="container relative z-10 mx-auto max-w-4xl flex-1 px-4 py-10 md:py-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {badge}
          </motion.span>
          <h1 className="mb-4 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl">
            {title}
          </h1>
          {description ? (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="max-w-2xl text-lg leading-relaxed text-muted-foreground"
            >
              {description}
            </motion.p>
          ) : null}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 h-1 w-24 origin-left rounded-full bg-gradient-to-r from-primary to-accent"
          />
        </motion.div>

        <div className="space-y-8">{children}</div>
      </main>

      <footer className="relative z-10 border-t border-border bg-gradient-to-r from-secondary/30 via-background to-secondary/20 py-10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Regional Maritime University
          </p>
          <nav
            className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-muted-foreground"
            aria-label="Footer"
          >
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
