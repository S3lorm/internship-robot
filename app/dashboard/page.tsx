"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  mockApplications,
  mockInternships,
  mockNotices,
  mockNotifications,
} from "@/lib/mock-data";
import {
  Briefcase,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Bell,
  Calendar,
  TrendingUp,
  Eye,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  // Get user's applications
  const myApplications = mockApplications.filter(
    (app) => app.studentId === user?.id
  );

  const stats = {
    total: myApplications.length,
    pending: myApplications.filter((a) => a.status === "pending").length,
    underReview: myApplications.filter((a) => a.status === "under_review").length,
    approved: myApplications.filter((a) => a.status === "approved").length,
    rejected: myApplications.filter((a) => a.status === "rejected").length,
  };

  const unreadNotifications = mockNotifications.filter((n) => !n.isRead);
  const recentInternships = mockInternships.slice(0, 3);
  const activeNotices = mockNotices.filter((n) => n.isActive && n.isPinned);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "under_review":
        return <Eye className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      under_review: "default",
      approved: "default",
      rejected: "destructive",
    };
    const labels: Record<string, string> = {
      pending: "Pending",
      under_review: "Under Review",
      approved: "Approved",
      rejected: "Rejected",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your internship applications and opportunities.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/internships">
            Browse Internships
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Email Verification Warning */}
      {user && !user.isEmailVerified && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div className="flex-1">
              <p className="font-medium text-yellow-800">
                Please verify your email address
              </p>
              <p className="text-sm text-yellow-700">
                Check your inbox for the verification link to access all features.
              </p>
            </div>
            <Button variant="outline" size="sm" className="border-yellow-300 hover:bg-yellow-100 bg-transparent">
              Resend Email
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Important Notice */}
      {activeNotices.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-start gap-3 p-4">
            <Bell className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">{activeNotices[0].title}</p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {activeNotices[0].content}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Applications</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending + stats.underReview}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.approved}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockInternships.length}</p>
              <p className="text-sm text-muted-foreground">Open Positions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Application Progress */}
      {stats.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Application Progress</CardTitle>
            <CardDescription>
              Track the status of your internship applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">
                  {stats.approved + stats.rejected} of {stats.total} resolved
                </span>
              </div>
              <Progress
                value={((stats.approved + stats.rejected) / stats.total) * 100}
                className="h-2"
              />
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <span>Pending: {stats.pending}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span>Under Review: {stats.underReview}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span>Approved: {stats.approved}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span>Rejected: {stats.rejected}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Applications</CardTitle>
              <CardDescription>Your latest internship applications</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/applications">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {myApplications.length === 0 ? (
              <div className="py-8 text-center">
                <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">No applications yet</p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/dashboard/internships">Browse available internships</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {myApplications.slice(0, 3).map((application) => (
                  <div
                    key={application.id}
                    className="flex items-start justify-between rounded-lg border border-border p-4"
                  >
                    <div className="flex items-start gap-3">
                      {getStatusIcon(application.status)}
                      <div>
                        <p className="font-medium">
                          {application.internship?.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {application.internship?.company}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Applied{" "}
                          {new Date(application.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(application.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Notifications</CardTitle>
              <CardDescription>
                {unreadNotifications.length} unread notifications
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/notifications">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {unreadNotifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">No new notifications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {unreadNotifications.slice(0, 4).map((notification) => (
                  <Link
                    key={notification.id}
                    href={notification.link || "#"}
                    className="block rounded-lg border border-border p-3 transition-colors hover:bg-muted"
                  >
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Opportunities */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Latest Opportunities</CardTitle>
            <CardDescription>
              New internships matching your profile
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/internships">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {recentInternships.map((internship) => (
              <Link
                key={internship.id}
                href={`/dashboard/internships/${internship.id}`}
                className="group rounded-lg border border-border p-4 transition-all hover:border-primary hover:shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {internship.category}
                  </Badge>
                  {internship.isRemote && (
                    <Badge variant="outline" className="text-xs">
                      Remote
                    </Badge>
                  )}
                </div>
                <h3 className="mb-1 font-medium group-hover:text-primary">
                  {internship.title}
                </h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  {internship.company}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {internship.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(internship.applicationDeadline).toLocaleDateString(
                      "en-GB",
                      { day: "numeric", month: "short" }
                    )}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
