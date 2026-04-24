"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockInternships, mockNotices } from "@/lib/mock-data";
import {
  Anchor,
  Ship,
  GraduationCap,
  Briefcase,
  FileText,
  Users,
  ArrowRight,
  Clock,
  MapPin,
  Calendar,
  Bell,
} from "lucide-react";

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  const featuredInternships = mockInternships.slice(0, 3);
  const latestNotices = mockNotices.filter((n) => n.isActive).slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 items-center justify-center rounded-lg bg-white p-1 shadow-sm">
              <Image src="/rmu-logo.png" alt="RMU Logo" width={120} height={30} className="object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-none text-foreground">
                RMU
              </span>
              <span className="text-xs text-muted-foreground">
                Internship Portal
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="#internships"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Internships
            </Link>
            <Link
              href="#about"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              About
            </Link>
            <Link
              href="#notices"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Notices
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button asChild>
                <Link href={user?.role === "admin" ? "/admin" : "/dashboard"}>
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Register</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/assets/rmu-campus.jpg"
            alt="RMU Campus"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        </div>
        <div className="container relative mx-auto px-4 py-24 md:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge
                variant="secondary"
                className="mb-6 gap-1.5 bg-white/15 backdrop-blur-sm border-white/20 px-3 py-1 text-sm text-white"
              >
                <Ship className="h-3.5 w-3.5" />
                Regional Maritime University
              </Badge>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-6 text-balance text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl drop-shadow-lg"
            >
              Internship Letters, HOD Approval, and Placement Tracking in One Portal
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-8 text-pretty text-lg text-white/80 md:text-xl drop-shadow"
            >
              From requesting your internship introduction letter to receiving HOD
              approval and confirming your official company placement, the RMU
              Internship Portal makes every step clear, fast, and trackable.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link href="/register">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:text-white"
              >
                <Link href="#internships">View Partner Companies</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-border bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { label: "Active Internships", value: "12+", icon: Briefcase },
              { label: "Partner Companies", value: "25+", icon: Users },
              { label: "Students Placed", value: "500+", icon: GraduationCap },
              { label: "Success Rate", value: "92%", icon: FileText },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground md:text-3xl">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Notices */}
      {latestNotices.length > 0 && (
        <section id="notices" className="border-b border-border bg-secondary/20 py-12">
          <div className="container mx-auto px-4">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">
                  Latest Announcements
                </h2>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {latestNotices.map((notice, i) => (
                <motion.div
                  key={notice.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                >
                <Card
                  className={`transition-shadow hover:shadow-md h-full ${notice.isPinned ? "border-primary/50" : ""}`}
                >
                  <CardContent className="p-5">
                    <div className="mb-2 flex items-start justify-between gap-4">
                      <h3 className="font-semibold text-foreground">
                        {notice.title}
                      </h3>
                      {notice.isPinned && (
                        <Badge variant="secondary" className="shrink-0">
                          Pinned
                        </Badge>
                      )}
                    </div>
                    <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                      {notice.content}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(notice.publishDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </CardContent>
                </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Internships */}
      <section id="internships" className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-bold text-foreground">
              Partner Companies & Internship Opportunities
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Browse companies where RMU students can intern and prepare your
              letter request and placement details in advance.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredInternships.map((internship, i) => (
              <motion.div
                key={internship.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="h-full"
              >
              <Card
                className="group transition-all hover:shadow-lg h-full"
              >
                <CardContent className="p-6">
                  <div className="relative mb-4 h-36 overflow-hidden rounded-lg border border-border/60">
                    <Image
                      src={internship.coverImage ?? "/placeholder.jpg"}
                      alt={`${internship.company} — internship opportunity`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
                    <p className="absolute bottom-2 left-3 text-xs font-medium text-white/90">
                      {internship.company}
                    </p>
                  </div>
                  <div className="mb-4 flex items-start justify-between">
                    <Badge variant="secondary">{internship.category}</Badge>
                    {internship.isRemote && (
                      <Badge variant="outline">Remote</Badge>
                    )}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground group-hover:text-primary">
                    {internship.title}
                  </h3>
                  <p className="mb-4 text-sm font-medium text-muted-foreground">
                    {internship.company}
                  </p>
                  <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                    {internship.description}
                  </p>
                  <div className="mb-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {internship.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {internship.duration}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {internship.slots - internship.applicationsCount > 0
                          ? internship.slots - internship.applicationsCount
                          : 0}
                      </span>{" "}
                      slots remaining
                    </div>
                    <span className="text-xs font-medium text-primary/90">
                      {isAuthenticated ? "Track via dashboard" : "Sign in to continue"}
                    </span>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button variant="outline" size="lg" asChild>
              <Link href={isAuthenticated ? "/dashboard/internships" : "/login"}>
                View All Internships
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="border-t border-border bg-secondary/20 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-4 text-3xl font-bold text-foreground"
            >
              About the Portal
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8 text-muted-foreground"
            >
              The RMU Internship Portal supports the full internship workflow for
              students: discover partner companies, request internship letters, get
              HOD decisions, and complete official placement confirmation for your
              chosen organization.
            </motion.p>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Request Letter Easily",
                  description:
                    "Students submit internship letter requests online and track status updates from their dashboard.",
                },
                {
                  title: "HOD Review Workflow",
                  description:
                    "HODs can review, approve, or reject requests with clear notes and notifications.",
                },
                {
                  title: "Official Placement Support",
                  description:
                    "After letter approval, students submit official placement details and the system handles follow-up communication.",
                },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.2 }}
                  className="text-left"
                >
                  <h3 className="mb-2 font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-primary py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-primary-foreground">
            Ready to Start Your Journey?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-primary-foreground/80">
            Register with your RMU student email to access all internship
            opportunities and start building your maritime career today.
          </p>
          <Button
            size="lg"
            variant="secondary"
            asChild
            className="bg-background text-foreground hover:bg-background/90"
          >
            <Link href="/register">
              Create Your Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-10 items-center justify-center rounded-lg bg-white p-1 shadow-sm">
                <Image src="/rmu-logo.png" alt="RMU Logo" width={100} height={25} className="object-contain" />
              </div>
              <span className="font-semibold text-foreground">
                RMU Internship Portal
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-foreground">
                Terms of Service
              </Link>
              <Link href="#" className="hover:text-foreground">
                Contact
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Regional Maritime University
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
