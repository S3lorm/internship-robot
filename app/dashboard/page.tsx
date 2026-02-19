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
  mockRegionalCompanies,
} from "@/lib/mock-data";
import {
  applicationsApi,
  internshipsApi,
  noticesApi,
  notificationsApi,
} from "@/lib/api";
import type { Application, Internship, Notice, Notification } from "@/types";
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
} from "lucide-react";
import { DeadlinesWidget } from "@/components/deadlines-widget";

export default function DashboardPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
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
        // Backend returns { data: notices[], meta: {...} }
        setNotices(Array.isArray(noticesResult.data?.data) ? noticesResult.data.data : (Array.isArray(noticesResult.data) ? noticesResult.data : []));

        // Fetch notifications
        const notificationsResult = await notificationsApi.getAll();
        if (notificationsResult.error) {
          throw new Error(notificationsResult.error);
        }
        // Backend returns { data: notifications[] }
        setNotifications(Array.isArray(notificationsResult.data?.data) ? notificationsResult.data.data : (Array.isArray(notificationsResult.data) ? notificationsResult.data : []));
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
  };

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const activeNotices = notices.filter((n) => n.isActive);

  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const regions = useMemo(() => {
    const unique = [...new Set(mockRegionalCompanies.map((c) => c.region))];
    return unique.sort();
  }, []);
  const filteredCompanies = useMemo(() => {
    if (selectedRegion === "all") return mockRegionalCompanies;
    return mockRegionalCompanies.filter((c) => c.region === selectedRegion);
  }, [selectedRegion]);

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

      {/* Important Notice */}
      {!loading && activeNotices.length > 0 && (
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
            {loading ? (
              <div className="py-8 text-center">
                <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="py-8 text-center">
                <p className="text-destructive">{error}</p>
              </div>
            ) : unreadNotifications.length === 0 ? (
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

      {/* Companies by Region - Apply via Email */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Companies by Region</CardTitle>
            <CardDescription>
              Browse companies in your region and send your application via email
            </CardDescription>
          </div>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-[180px]">
              <MapPin className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All regions</SelectItem>
              {regions.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCompanies.map((company) => {
              const subject = encodeURIComponent(`Internship Application - ${user?.firstName} ${user?.lastName}`);
              const body = encodeURIComponent(
                `Dear Hiring Team,\n\nI am interested in applying for an internship position at ${company.name}.\n\nPlease find my details below:\nName: ${user?.firstName} ${user?.lastName}\nEmail: ${user?.email}\nStudent ID: ${user?.studentId || "N/A"}\nDepartment: ${user?.department || "N/A"}\n\nI look forward to hearing from you.\n\nBest regards`
              );
              const mailtoLink = `mailto:${company.email}?subject=${subject}&body=${body}`;
              return (
                <div
                  key={company.id}
                  className="flex flex-col rounded-lg border border-border p-4 transition-all hover:border-primary hover:shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {company.industry}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {company.region}
                    </span>
                  </div>
                  <h3 className="mb-1 font-medium text-foreground">
                    {company.name}
                  </h3>
                  <p className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {company.email}
                  </p>
                  <Button asChild size="sm" className="mt-auto w-full">
                    <a href={mailtoLink} target="_blank" rel="noopener noreferrer">
                      <Mail className="mr-2 h-4 w-4" />
                      Send Application via Email
                    </a>
                  </Button>
                </div>
              );
            })}
          </div>
          {filteredCompanies.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              No companies found in this region.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
