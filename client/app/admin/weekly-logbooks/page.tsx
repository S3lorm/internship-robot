"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { weeklyLogbooksApi } from "@/lib/api";
import type { WeeklyLogbookBundle } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatStatusLabel } from "@/lib/utils";
import { sheetHeaderFromBundle } from "@/lib/weekly-logbook-ui";
import { buildPageDraftsFromBundle } from "@/lib/weekly-logbook-schedule";
import { countWeeksInPeriod } from "@/lib/weekly-logbook-weeks";
import { WeeklyLogSheet } from "@/components/weekly-log-sheet";
import { toast } from "sonner";
import { Archive, BookOpen, ClipboardList, Download, Eye, Loader2 } from "lucide-react";

type StaffTab = "review" | "archive";

function pageDraftsForBundle(bundle: WeeklyLogbookBundle) {
  const placement = bundle.placement || {};
  const start = placement.internship_start_date || placement.internshipStartDate || "";
  const end = placement.internship_end_date || placement.internshipEndDate || "";
  const totalWeeks = countWeeksInPeriod(start, end) || bundle.entries.length || 1;
  return buildPageDraftsFromBundle(bundle, {
    bypassWeekSchedule: true,
    totalWeeks,
    currentOpenWeek: null,
    weeks: [],
  });
}

function LogbookTable({
  items,
  loading,
  emptyMessage,
  onView,
  onPdf,
  showArchiveRef,
}: {
  items: WeeklyLogbookBundle[];
  loading: boolean;
  emptyMessage: string;
  onView: (item: WeeklyLogbookBundle) => void;
  onPdf: (id: string) => void;
  showArchiveRef?: boolean;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (items.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">{emptyMessage}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="p-3 text-left">Student</th>
            <th className="p-3 text-left">Organization</th>
            <th className="p-3 text-left">Weeks</th>
            {showArchiveRef && <th className="p-3 text-left">Archive ref.</th>}
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.logbook.id} className="border-b">
              <td className="p-3">
                <div className="font-medium">
                  {item.student?.firstName} {item.student?.lastName}
                </div>
                <div className="text-muted-foreground">
                  {item.student?.studentId || item.student?.department}
                </div>
              </td>
              <td className="p-3">{item.placement?.organization_name || "N/A"}</td>
              <td className="p-3">{item.entries.length}</td>
              {showArchiveRef && (
                <td className="p-3 font-mono text-xs">
                  {item.logbook.archiveReference || "—"}
                </td>
              )}
              <td className="p-3">
                <Badge variant="secondary" className="capitalize">
                  {formatStatusLabel(item.logbook.status)}
                </Badge>
              </td>
              <td className="p-3">
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => onView(item)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onPdf(item.logbook.id)}>
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function WeeklyLogbooksAdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<StaffTab>("review");
  const [reviewItems, setReviewItems] = useState<WeeklyLogbookBundle[]>([]);
  const [archiveItems, setArchiveItems] = useState<WeeklyLogbookBundle[]>([]);
  const [loadingReview, setLoadingReview] = useState(true);
  const [loadingArchive, setLoadingArchive] = useState(true);
  const [selected, setSelected] = useState<WeeklyLogbookBundle | null>(null);
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.role === "admin") {
      router.replace("/admin");
      return;
    }
    if (user.role !== "hod") return;
    void loadReview();
    void loadArchive();
  }, [user, router]);

  const loadReview = async () => {
    setLoadingReview(true);
    const result = await weeklyLogbooksApi.listForStaff("supervisor_reviewed");
    if (result.error) toast.error(result.error);
    else setReviewItems((result.data as { logbooks: WeeklyLogbookBundle[] }).logbooks || []);
    setLoadingReview(false);
  };

  const loadArchive = async () => {
    setLoadingArchive(true);
    const result = await weeklyLogbooksApi.listForStaff("hod_approved");
    if (result.error) toast.error(result.error);
    else setArchiveItems((result.data as { logbooks: WeeklyLogbookBundle[] }).logbooks || []);
    setLoadingArchive(false);
  };

  const refreshAll = async () => {
    await Promise.all([loadReview(), loadArchive()]);
  };

  const selectedPages = useMemo(
    () => (selected ? pageDraftsForBundle(selected) : []),
    [selected]
  );

  const decide = async (decision: "approved" | "rejected") => {
    if (!selected) return;
    if (decision === "rejected" && !remark.trim()) {
      toast.error("A rejection reason is required.");
      return;
    }
    setSubmitting(true);
    const result = await weeklyLogbooksApi.institutionalReview(
      selected.logbook.id,
      decision,
      remark.trim()
    );
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        decision === "approved"
          ? "Logbook approved and moved to archive"
          : "Logbook rejected — student can revise and resubmit"
      );
      setSelected(null);
      setRemark("");
      await refreshAll();
    }
    setSubmitting(false);
  };

  const openPdf = async (id: string) => {
    const response = await fetch(weeklyLogbooksApi.pdfUrl(id), {
      headers:
        typeof window !== "undefined" && localStorage.getItem("rmu_token")
          ? { Authorization: `Bearer ${localStorage.getItem("rmu_token")}` }
          : undefined,
    });
    if (!response.ok) {
      toast.error("Failed to open PDF export");
      return;
    }
    const blob = await response.blob();
    window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer");
  };

  if (!user || user.role !== "hod") return null;

  const header = selected ? sheetHeaderFromBundle(selected) : null;
  const isArchiveView = selected?.logbook.status === "hod_approved";
  const canDecide = selected?.logbook.status === "supervisor_reviewed";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
          <BookOpen className="h-7 w-7 text-primary" />
          Logbook
        </h1>
        <p className="text-muted-foreground">
          Review supervisor-acknowledged logbooks, then approve and archive approved records.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5 text-amber-600" />
              {reviewItems.length}
            </CardTitle>
            <CardDescription>Awaiting HOD / Secretary review</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Archive className="h-5 w-5 text-emerald-600" />
              {archiveItems.length}
            </CardTitle>
            <CardDescription>Approved and archived</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as StaffTab)}>
        <TabsList>
          <TabsTrigger value="review" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Review queue
            {reviewItems.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {reviewItems.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="archive" className="gap-2">
            <Archive className="h-4 w-4" />
            Archive
            {archiveItems.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {archiveItems.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Supervisor-reviewed logbooks</CardTitle>
              <CardDescription>
                Logbooks appear here after a supervisor submits their evaluation. Department HODs
                only see students from their department; the Secretary sees all departments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LogbookTable
                items={reviewItems}
                loading={loadingReview}
                emptyMessage="No logbooks awaiting institutional review for your department."
                onView={setSelected}
                onPdf={openPdf}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archive" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Logbook archive</CardTitle>
              <CardDescription>
                Approved logbooks with archive references. Records remain available for PDF
                export.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LogbookTable
                items={archiveItems}
                loading={loadingArchive}
                emptyMessage="No archived logbooks yet."
                onView={setSelected}
                onPdf={openPdf}
                showArchiveRef
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isArchiveView ? "Archived logbook" : "Institutional logbook review"}
            </DialogTitle>
            <DialogDescription>
              {selected?.student?.firstName} {selected?.student?.lastName} — official RMU weekly log
              sheet book
            </DialogDescription>
          </DialogHeader>
          {selected && header && (
            <div className="space-y-6">
              {selected.review?.supervisorRecommendation && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Overall supervisor recommendation</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-sm">
                    {selected.review.supervisorRecommendation}
                  </CardContent>
                </Card>
              )}

              {selectedPages.length > 0
                ? selectedPages.map((page) => {
                    const lastWeek = page.firstWeekNumber + page.weekCount - 1;
                    const weekLabel =
                      page.weekCount === 1
                        ? `Week ${page.firstWeekNumber}`
                        : `Weeks ${page.firstWeekNumber}–${lastWeek}`;
                    return (
                      <WeeklyLogSheet
                        key={page.pageNumber}
                        mode="readonly"
                        header={header}
                        weekLabel={`Page ${page.pageNumber} (${weekLabel})`}
                        values={page.values}
                        firstWeekNumber={page.firstWeekNumber}
                        weekCount={page.weekCount}
                        lockPeriodDates
                      />
                    );
                  })
                : selected.entries.map((entry) => (
                    <WeeklyLogSheet
                      key={entry.id}
                      mode="readonly"
                      header={header}
                      weekLabel={`Week ${entry.weekNumber}`}
                      values={{
                        weekBeginning: entry.weekBeginning,
                        weekEnding: entry.weekEnding,
                        studentRemark: entry.studentRemark || "",
                        supervisorRemark: entry.supervisorRemark,
                        supervisorName: entry.supervisorName,
                        supervisorStatus: entry.supervisorStatus,
                        activities: entry.activities,
                      }}
                      firstWeekNumber={entry.weekNumber}
                      weekCount={1}
                    />
                  ))}

              {selected.logbook.archiveReference && (
                <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
                  Archive reference:{" "}
                  <span className="font-mono font-semibold">
                    {selected.logbook.archiveReference}
                  </span>
                </p>
              )}

              {canDecide && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Institutional remark</label>
                  <Textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Optional for approval; required if rejecting"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            {canDecide ? (
              <>
                <Button variant="destructive" onClick={() => decide("rejected")} disabled={submitting}>
                  Reject
                </Button>
                <Button onClick={() => decide("approved")} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Approve and archive
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={() => selected && openPdf(selected.logbook.id)}>
                Open PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
