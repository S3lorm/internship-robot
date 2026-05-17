"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { DashboardStatsSection } from "@/components/dashboard-stats-section";
import {
  DashboardAnimatedCard,
  DashboardHero,
  DashboardPageShell,
} from "@/components/portal-dashboard-ui";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { dashboardApi, lettersApi } from "@/lib/api";
import { usePortalStatus } from "@/hooks/use-portal-status";
import { PortalStatusBanner } from "@/components/portal-status-banner";
import { toast } from "sonner";
import type { Application, Notice, Notification, LetterRequest, InternshipPlacement } from "@/types";
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
  Building2,
  MapPin,
} from "lucide-react";

const getStatusIcon = (status: string) => {
  switch (status) {
    case "approved":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "rejected":
      return <XCircle className="h-4 w-4 text-red-600" />;
    case "under_review":
    case "modification_requested":
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
    modification_requested: "outline",
  };
  const labels: Record<string, string> = {
    pending: "Pending",
    under_review: "Under Review",
    approved: "Approved",
    rejected: "Rejected",
    modification_requested: "Modifications requested",
  };
  return (
    <Badge variant={variants[status] || "secondary"}>
      {labels[status] || status.replace(/_/g, " ")}
    </Badge>
  );
};

const formatPlacementDates = (start?: string, end?: string) => {
  if (!start && !end) return "Dates not set";
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  return start ? fmt(start) : end ? fmt(end) : "Dates not set";
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

export default function DashboardPage() {
  const { user } = useAuth();
  const { portal, loading: portalLoading } = usePortalStatus();
  const [applications, setApplications] = useState<Application[]>([]);
  const [placements, setPlacements] = useState<InternshipPlacement[]>([]);
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
        setPlacements(Array.isArray(data?.placements) ? data.placements : []);
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

  useEffect(() => {
    const onNotificationsUpdated = () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    };
    window.addEventListener("notifications-updated", onNotificationsUpdated);
    return () => window.removeEventListener("notifications-updated", onNotificationsUpdated);
  }, []);

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
  const previewNotifications = useMemo(
    () => sortedNotifications.slice(0, 3),
    [sortedNotifications]
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


  const handleDownloadLetter = async (id: string, ref?: string, isGeneral?: boolean) => {
    try {
      const blob = await lettersApi.downloadLetterPDF(id);
      if (!(blob instanceof Blob)) return;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = isGeneral
        ? `General_Introduction_Letter_${ref || id}.pdf`
        : `Internship_Letter_${ref || id}.pdf`;
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
      const blob = await lettersApi.downloadLetterPDF(id);
      if (!(blob instanceof Blob)) return;
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      toast.error(err.message || "Failed to view letter");
    }
  };

  const handlePrintLetter = async (id: string) => {
    try {
      const html = await lettersApi.downloadLetterPDF(id, { format: "html" });
      if (typeof html !== "string") return;
      const printWindow = window.open("", "_blank");
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
    <DashboardPageShell className="space-y-6">
      <DashboardHero
        badge={
          <>
            <Sparkles className="h-3.5 w-3.5" />
            Student dashboard
          </>
        }
        title={`Welcome back, ${user?.firstName || "Student"}`}
        description="Your internship letters, logbook, applications, and updates — all in one place."
      />

      <PortalStatusBanner portal={portal} loading={portalLoading} />

      <DashboardStatsSection
        stats={stats}
        unreadNotifications={unreadNotifications.length}
        activeNoticesCount={activeNotices.length}
        loading={loading}
      />

      {/* Available Documents */}
      {!loading && letterRequests.some(r => r.status === 'approved' && r.requestType === 'general') && (
        <DashboardAnimatedCard index={1}>
          <Card className="border-0 bg-transparent shadow-none">
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDownloadLetter(request.id, request.referenceNumber, true)
                        }
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
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
        </DashboardAnimatedCard>
      )}

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <DashboardAnimatedCard index={2} className="h-full">
          <Card className="h-full border-0 bg-transparent shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Official placement
              </CardTitle>
              <CardDescription>Stage 2 placement requests you have submitted</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/letter-requests/official">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">
                <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Loading placements...</p>
              </div>
            ) : error ? (
              <div className="py-8 text-center">
                <p className="text-destructive">{error}</p>
              </div>
            ) : placements.length === 0 ? (
              <div className="py-8 text-center">
                <Building2 className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">No official placement requests yet</p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href="/dashboard/letter-requests/official">Request official placement</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {placements.slice(0, 5).map((placement) => (
                    <div
                      key={placement.id}
                      className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        {getStatusIcon(placement.status)}
                        <div className="min-w-0">
                          <p className="font-medium break-words">
                            {placement.organizationName || "Organisation"}
                          </p>
                          {placement.departmentRole && (
                            <p className="text-sm text-muted-foreground">
                              Role: {placement.departmentRole}
                            </p>
                          )}
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {formatPlacementDates(
                              placement.internshipStartDate,
                              placement.internshipEndDate
                            )}
                          </p>
                          {placement.supervisorName && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Supervisor: {placement.supervisorName}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            Submitted{" "}
                            {placement.createdAt
                              ? new Date(placement.createdAt).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 self-start sm:self-auto">
                        {getStatusBadge(placement.status)}
                      </div>
                    </div>
                ))}
              </div>
            )}
          </CardContent>
          </Card>
        </DashboardAnimatedCard>

        <DashboardAnimatedCard index={3} className="h-full lg:min-h-[320px]">
          <Card className="h-full border-0 bg-transparent shadow-none lg:min-h-[320px]">
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
                {notifications.length > 3
                  ? `Showing latest 3 of ${notifications.length}`
                  : notifications.length > 0
                    ? `${notifications.length} recent`
                    : "Your latest updates"}
              </CardDescription>
            </div>
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
                {previewNotifications.length === 0 ? (
                  <div className="py-6 text-center">
                    <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {previewNotifications.map((notification) => (
                        <Link
                          key={notification.id}
                          href="/dashboard/notifications"
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
                      ))}
                    </div>
                    {notifications.length > 0 && (
                      <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                        <Link href="/dashboard/notifications">View more</Link>
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
          </Card>
        </DashboardAnimatedCard>
      </div>

    </DashboardPageShell>
  );
}
