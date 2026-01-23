"use client";

import Link from "next/link";
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
  ChevronRight,
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Anchor className="h-5 w-5 text-primary-foreground" />
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
      <section className="relative overflow-hidden border-b border-border bg-secondary/30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0001_1px,transparent_1px),linear-gradient(to_bottom,#0001_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Badge
              variant="secondary"
              className="mb-6 gap-1.5 px-3 py-1 text-sm"
            >
              <Ship className="h-3.5 w-3.5" />
              Regional Maritime University
            </Badge>
            <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Launch Your Maritime Career with the Right Internship
            </h1>
            <p className="mb-8 text-pretty text-lg text-muted-foreground md:text-xl">
              Discover internship opportunities from leading maritime companies.
              Apply, track your progress, and take the first step towards your
              professional journey.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
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
                className="w-full sm:w-auto bg-transparent"
              >
                <Link href="#internships">Browse Internships</Link>
              </Button>
            </div>
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
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground md:text-3xl">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
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
              {latestNotices.map((notice) => (
                <Card
                  key={notice.id}
                  className={`transition-shadow hover:shadow-md ${notice.isPinned ? "border-primary/50" : ""}`}
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
              Featured Opportunities
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Explore our latest internship openings from top maritime companies
              and organizations.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredInternships.map((internship) => (
              <Card
                key={internship.id}
                className="group transition-all hover:shadow-lg"
              >
                <CardContent className="p-6">
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
                    <Button variant="ghost" size="sm" asChild className="group">
                      <Link href={isAuthenticated ? `/dashboard/internships/${internship.id}` : "/login"}>
                        Apply
                        <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              About the Portal
            </h2>
            <p className="mb-8 text-muted-foreground">
              The RMU Internship Portal is designed to streamline the internship
              application process for students at Regional Maritime University.
              Our platform connects students with leading maritime companies,
              providing valuable opportunities for professional development.
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Easy Application",
                  description:
                    "Submit applications with your CV and cover letter in just a few clicks.",
                },
                {
                  title: "Track Progress",
                  description:
                    "Monitor the status of all your applications in one convenient dashboard.",
                },
                {
                  title: "Stay Informed",
                  description:
                    "Receive notifications about new opportunities and application updates.",
                },
              ].map((feature) => (
                <div key={feature.title} className="text-left">
                  <h3 className="mb-2 font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Anchor className="h-4 w-4 text-primary-foreground" />
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
