"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { dashboardApi, lettersApi } from "@/lib/api";
import { toast } from "sonner";
import type { Application, Internship, Notice, Notification, LetterRequest } from "@/types";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Bell,
  Eye,
  Loader2,
  Download,
  Printer,
  FileCheck2,
} from "lucide-react";

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

type ApplicationStats = {
  total: number;
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
  companyLettersCount: number;
  companyLettersEmailedCount?: number;
  companyLettersApprovedCount?: number;
  letterRequestsPendingCount?: number;
};

function getInternshipFromApplication(application: Application): Internship | undefined {
  return application.internship ?? application.Internship;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [letterRequests, setLetterRequests] = useState<LetterRequest[]>([]);
  const [applicationStats, setApplicationStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const dashboardResult = await dashboardApi.getStudentData();
        if (dashboardResult.error) {
          throw new Error(dashboardResult.error);
        }

        const data = dashboardResult.data?.data || dashboardResult.data;

        // Backend returns an assembled object matching the previous separate responses
        setApplications(Array.isArray(data?.applications) ? data.applications : []);
        setApplicationStats(
          data?.applicationStats &&
            typeof (data.applicationStats as ApplicationStats).total === 'number'
            ? (data.applicationStats as ApplicationStats)
            : null
        );
        setNotices(Array.isArray(data?.notices) ? data.notices : []);
        setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
        setLetterRequests(Array.isArray(data?.letterRequests) ? data.letterRequests : []);
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

  const stats = useMemo(() => {
    if (applicationStats) {
      return {
        total: applicationStats.total,
        pending: applicationStats.pending,
        underReview: applicationStats.underReview,
        approved: applicationStats.approved,
        rejected: applicationStats.rejected,
        lettersEmailedToCompany:
          applicationStats.companyLettersEmailedCount ?? applicationStats.companyLettersCount,
        lettersCompanyApproved: applicationStats.companyLettersApprovedCount ?? 0,
        letterRequestsPending: applicationStats.letterRequestsPendingCount ?? 0,
      };
    }
    return {
      total: applications.length,
      pending: applications.filter((a) => a.status === "pending").length,
      underReview: applications.filter((a) => a.status === "under_review").length,
      approved: applications.filter((a) => a.status === "approved").length,
      rejected: applications.filter((a) => a.status === "rejected").length,
      lettersEmailedToCompany: letterRequests.filter(
        (lr) => lr.requestType === "company" && lr.emailSent
      ).length,
      lettersCompanyApproved: letterRequests.filter(
        (lr) => lr.requestType === "company" && lr.status === "approved"
      ).length,
      letterRequestsPending: letterRequests.filter((lr) => lr.status === "pending").length,
    };
  }, [applicationStats, applications, letterRequests]);

  const unreadNotifications = useMemo(() => notifications.filter((n) => !n.isRead), [notifications]);
  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [notifications]
  );

  const activeNotices = useMemo(() => {
    const now = Date.now();
    return notices.filter((n: Notice & { expiresAt?: string }) => {
      if (!n.isActive) return false;
      const exp =
        (n as Notice & { expiresAt?: string }).expiresAt ||
        (n as Notice & { expiryDate?: string }).expiryDate;
      if (exp && new Date(exp).getTime() <= now) return false;
      if (n.targetDepartment && user?.department && n.targetDepartment !== user.department) {
        return false;
      }
      return true;
    });
  }, [notices, user?.department]);


  const handleDownloadLetter = async (id: string, ref?: string) => {
    try {
      const html = await lettersApi.downloadLetterPDF(id);
      const blob = new Blob([html], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Internship_Letter_${ref || id}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      toast.error(err.message || "Failed to download letter");
    }
  };

  const handleViewLetter = async (id: string) => {
    try {
      const html = await lettersApi.downloadLetterPDF(id);
      const blob = new Blob([html], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err: any) {
      toast.error(err.message || "Failed to view letter");
    }
  };

  const handlePrintLetter = async (id: string) => {
    try {
      const html = await lettersApi.downloadLetterPDF(id);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to prepare document for printing");
    }
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
      </div>
      {/* Available Documents */}
      {!loading && letterRequests.some(r => r.status === 'approved' && r.requestType === 'general') && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-blue-600" />
              Available Documents
            </CardTitle>
            <CardDescription>
              Your approved official documents ready for use.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {letterRequests
                .filter(r => r.status === 'approved' && r.requestType === 'general')
                .map(request => (
                  <div key={request.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background border rounded-xl gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm uppercase">General Internship Letter</p>
                        <p className="text-xs text-muted-foreground">Status: Approved</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewLetter(request.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadLetter(request.id, request.referenceNumber)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handlePrintLetter(request.id)}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Essentials and quick actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick actions</CardTitle>
            <CardDescription>Shortcuts to the pages you use most</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button asChild>
              <Link href="/dashboard/applications">My applications</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/letter-requests">Letter requests</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/notifications">Notifications</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/notices">Notices</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What needs attention</CardTitle>
            <CardDescription>Important items for your internship workflow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Unread notifications</p>
              <Badge variant={unreadNotifications.length > 0 ? "default" : "secondary"}>
                {unreadNotifications.length}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Applications in progress</p>
              <Badge variant={stats.pending + stats.underReview > 0 ? "default" : "secondary"}>
                {stats.pending + stats.underReview}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Pending letter requests</p>
              <Badge variant={stats.letterRequestsPending > 0 ? "default" : "secondary"}>
                {stats.letterRequestsPending}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Approved applications</p>
              <Badge variant="outline">{stats.approved}</Badge>
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

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* Recent Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent applications</CardTitle>
              <CardDescription>Internship listings you applied to</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/applications">View all</Link>
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
                  <Link href="/dashboard/internships">Internships directory (preview)</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.slice(0, 5).map((application) => {
                  const internship = getInternshipFromApplication(application);
                  const applied =
                    application.appliedAt ||
                    (application as Application & { createdAt?: string }).createdAt;
                  return (
                    <div
                      key={application.id}
                      className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        {getStatusIcon(application.status)}
                        <div className="min-w-0">
                          <p className="font-medium break-words">
                            {internship?.title || "Internship application"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {internship?.company || "—"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Applied{" "}
                            {applied
                              ? new Date(applied).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 self-start sm:self-auto">
                        {getStatusBadge(application.status)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications overview — full list, scrollable */}
        <Card className="lg:min-h-[320px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Notifications
                {unreadNotifications.length > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {unreadNotifications.length} unread
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {notifications.length} total
                {activeNotices.length > 0 ? ` · ${activeNotices.length} active notice${activeNotices.length !== 1 ? "s" : ""}` : ""}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/notifications">Open inbox</Link>
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
            ) : (
              <div className="space-y-4">
                {activeNotices.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Notices
                    </p>
                    {activeNotices.map((notice) => (
                      <Link
                        key={`notice-${notice.id}`}
                        href="/dashboard/notices"
                        className="group block rounded-lg border border-amber-300/40 bg-amber-50/50 p-3 transition-colors hover:bg-amber-100/60 dark:bg-amber-900/10 dark:hover:bg-amber-900/20"
                      >
                        <p className="font-semibold text-sm">{notice.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{notice.content}</p>
                      </Link>
                    ))}
                    <Separator />
                  </div>
                )}

                {sortedNotifications.length === 0 ? (
                  <div className="py-6 text-center">
                    <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[min(420px,55vh)] pr-3">
                    <div className="space-y-2">
                      {sortedNotifications.map((notification) => {
                        const href = "/dashboard/notifications";
                        return (
                          <Link
                            key={notification.id}
                            href={href}
                            className={`block rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
                              notification.isRead
                                ? "border-border bg-muted/20"
                                : "border-primary/25 bg-primary/5"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {!notification.isRead && (
                                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm">{notification.title}</p>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {new Date(notification.createdAt).toLocaleString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                  {notification.isRead ? " · Read" : ""}
                                </p>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
