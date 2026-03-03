"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  mockTrendingNews,
} from "@/lib/mock-data";
import {
  applicationsApi,
  internshipsApi,
  noticesApi,
  notificationsApi,
  lettersApi,
} from "@/lib/api";
import type { Application, Internship, Notice, Notification, LetterRequest } from "@/types";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Bell,
  TrendingUp,
  Eye,
  MapPin,
  Mail,
  Loader2,
  Newspaper,
  ExternalLink,
} from "lucide-react";
import { DeadlinesWidget } from "@/components/deadlines-widget";

export default function DashboardPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [letterRequests, setLetterRequests] = useState<LetterRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch applications
        const appsResult = await applicationsApi.getMyApplications();
        if (appsResult.error) {
          throw new Error(appsResult.error);
        }
        // Backend returns { data: applications[] }
        setApplications(Array.isArray(appsResult.data?.data) ? appsResult.data.data : (Array.isArray(appsResult.data) ? appsResult.data : []));

        // Fetch internships
        const internshipsResult = await internshipsApi.getAll();
        if (internshipsResult.error) {
          throw new Error(internshipsResult.error);
        }
        // Backend returns { data: internships[], meta: {...} }
        setInternships(Array.isArray(internshipsResult.data?.data) ? internshipsResult.data.data : (Array.isArray(internshipsResult.data) ? internshipsResult.data : []));

        // Fetch notices
        const noticesResult = await noticesApi.getAll({ isActive: "true" });
        if (noticesResult.error) {
          throw new Error(noticesResult.error);
        }
        const rawNotices = Array.isArray(noticesResult.data?.data) ? noticesResult.data.data : (Array.isArray(noticesResult.data) ? noticesResult.data : []);
        setNotices(rawNotices);

        // Fetch notifications
        const notificationsResult = await notificationsApi.getAll();
        if (notificationsResult.error) {
          throw new Error(notificationsResult.error);
        }
        const rawNotifications = Array.isArray(notificationsResult.data?.data) ? notificationsResult.data.data : (Array.isArray(notificationsResult.data) ? notificationsResult.data : []);
        setNotifications(rawNotifications);

        // Fetch letter requests
        const letterRequestsResult = await lettersApi.getRequests();
        if (!letterRequestsResult.error && letterRequestsResult.data) {
          setLetterRequests(letterRequestsResult.data.requests || []);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchData();
    }
  }, [user]);

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    underReview: applications.filter((a) => a.status === "under_review").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    lettersSentToCompany: letterRequests.filter((lr) => lr.requestType === "company").length,
  };

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const activeNotices = notices.filter((n: any) => n.isActive && !n.isRead);



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
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="mt-2 text-muted-foreground">
            Here&apos;s an overview of your internship applications and opportunities.
          </p>
        </div>
        <Button asChild size="lg" className="shadow-md">
          <Link href="/dashboard/internships">
            Browse Internships
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>



      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Applications</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <p className="text-2xl font-bold">{stats.pending + stats.underReview}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <p className="text-2xl font-bold">{internships.length}</p>
                  <p className="text-sm text-muted-foreground">Open Positions</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
              <Mail className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <p className="text-2xl font-bold">{stats.lettersSentToCompany}</p>
                  <p className="text-sm text-muted-foreground">Letters Sent</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Application Progress */}
      {!loading && stats.total > 0 && (
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
                value={stats.total > 0 ? ((stats.approved + stats.rejected) / stats.total) * 100 : 0}
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
            {loading ? (
              <div className="py-8 text-center">
                <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Loading applications...</p>
              </div>
            ) : error ? (
              <div className="py-8 text-center">
                <p className="text-destructive">{error}</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="py-8 text-center">
                <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">No applications yet</p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/dashboard/internships">Browse available internships</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.slice(0, 3).map((application) => {
                  const internship = internships.find((i) => i.id === application.internshipId);
                  return (
                    <div
                      key={application.id}
                      className="flex items-start justify-between rounded-lg border border-border p-4"
                    >
                      <div className="flex items-start gap-3">
                        {getStatusIcon(application.status)}
                        <div>
                          <p className="font-medium">
                            {internship?.title || "Unknown Internship"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {internship?.company || "Unknown Company"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Applied{" "}
                            {new Date(application.appliedAt || application.createdAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(application.status)}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Notifications
                {(unreadNotifications.length > 0 || activeNotices.length > 0) && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-primary text-primary-foreground animate-pulse">
                    {unreadNotifications.length + activeNotices.length} new
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {unreadNotifications.length + activeNotices.length} unread notification{(unreadNotifications.length + activeNotices.length) !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/notifications">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">
                <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="py-8 text-center">
                <p className="text-destructive">{error}</p>
              </div>
            ) : unreadNotifications.length === 0 && activeNotices.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">No new notifications</p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/dashboard/notifications">View all notifications</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Important Notices as previews */}
                {activeNotices.slice(0, 2).map((notice) => (
                  <Link
                    key={`notice-${notice.id}`}
                    href="/dashboard/notifications"
                    className="group block rounded-lg border border-amber-300/40 bg-amber-50/50 dark:bg-amber-900/10 p-3 transition-all hover:bg-amber-100/60 dark:hover:bg-amber-900/20 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-2">
                      <Bell className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                          {notice.title}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notice.content}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}

                {/* Unread Notifications */}
                {unreadNotifications.slice(0, 4).map((notification) => (
                  <Link
                    key={notification.id}
                    href="/dashboard/notifications"
                    className="group block rounded-lg border border-primary/20 bg-primary/5 p-3 transition-all hover:bg-primary/10 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary animate-pulse" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {notification.message}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(notification.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
                {unreadNotifications.length > 4 && (
                  <Button variant="ghost" size="sm" className="w-full text-primary" asChild>
                    <Link href="/dashboard/notifications">
                      +{unreadNotifications.length - 4} more notifications
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily News of Trending Companies in Ghana */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary" />
              Daily News: Trending Companies in Ghana
            </CardTitle>
            <CardDescription>
              Stay updated with the latest news from top maritime and logistics companies in Ghana
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 selection:bg-primary/10">
            {mockTrendingNews.map((news) => (
              <div
                key={news.id}
                className="group flex flex-col rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="secondary" className="font-medium text-primary">
                    {news.company}
                  </Badge>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(news.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span>{news.readTime}</span>
                  </div>
                </div>

                <h3 className="mb-2 font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
                  {news.headline}
                </h3>

                <p className="mb-4 text-sm text-muted-foreground flex-grow">
                  {news.summary}
                </p>

                <Button variant="ghost" size="sm" className="mt-auto w-full justify-between" asChild>
                  <a href={news.url || "#"} target="_blank" rel="noopener noreferrer">
                    Read full article
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            ))}
          </div>
          {mockTrendingNews.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Newspaper className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">
                No trending news available at the moment.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
