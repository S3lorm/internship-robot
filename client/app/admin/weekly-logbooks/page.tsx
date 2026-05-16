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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatStatusLabel } from "@/lib/utils";
import { entryToSheetValues, sheetHeaderFromBundle } from "@/lib/weekly-logbook-ui";
import { WeeklyLogSheet } from "@/components/weekly-log-sheet";
import { toast } from "sonner";
import { BookOpen, Download, Eye, Loader2 } from "lucide-react";

const statuses = ["supervisor_reviewed", "hod_approved", "rejected", "submitted_final", "all"];

export default function WeeklyLogbooksAdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<WeeklyLogbookBundle[]>([]);
  const [status, setStatus] = useState("supervisor_reviewed");
  const [loading, setLoading] = useState(true);
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
    void load();
  }, [user, status, router]);

  const load = async () => {
    setLoading(true);
    const result = await weeklyLogbooksApi.listForStaff(status);
    if (result.error) {
      toast.error(result.error);
    } else {
      setItems((result.data as { logbooks: WeeklyLogbookBundle[] }).logbooks || []);
    }
    setLoading(false);
  };

  const stats = useMemo(
    () => ({
      total: items.length,
      pending: items.filter((item) => item.logbook.status === "supervisor_reviewed").length,
      approved: items.filter((item) => item.logbook.status === "hod_approved").length,
    }),
    [items]
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
      toast.success(decision === "approved" ? "Logbook approved and archived" : "Logbook rejected");
      setSelected(null);
      setRemark("");
      await load();
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
            <BookOpen className="h-7 w-7 text-primary" />
            Logbook
          </h1>
          <p className="text-muted-foreground">
            Review supervisor-acknowledged logbooks. HOD and Secretary can approve and archive records.
          </p>
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((item) => (
              <SelectItem key={item} value={item}>
                {formatStatusLabel(item)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{stats.total}</CardTitle>
            <CardDescription>Visible records</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{stats.pending}</CardTitle>
            <CardDescription>Awaiting approval</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{stats.approved}</CardTitle>
            <CardDescription>Approved records</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Institutional Review Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No logbooks found for this status.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left">Student</th>
                    <th className="p-3 text-left">Organization</th>
                    <th className="p-3 text-left">Weeks</th>
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
                      <td className="p-3">
                        <Badge variant="secondary" className="capitalize">
                          {formatStatusLabel(item.logbook.status)}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="secondary" onClick={() => setSelected(item)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openPdf(item.logbook.id)}>
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
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Logbook review</DialogTitle>
            <DialogDescription>
              Official RMU logbook — read-only for institutional review.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-6">
              {selected.entries.map((entry) => (
                <WeeklyLogSheet
                  key={entry.id}
                  mode="readonly"
                  header={sheetHeaderFromBundle(selected)}
                  weekLabel={`Week ${entry.weekNumber}`}
                  values={entryToSheetValues(entry)}
                />
              ))}

              {selected.review?.supervisorRecommendation && (
                <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                  <p className="font-semibold">Overall supervisor recommendation</p>
                  <p className="mt-2">{selected.review.supervisorRecommendation}</p>
                </div>
              )}

              {selected.logbook.archiveReference && (
                <p className="text-sm text-muted-foreground">
                  Archive reference:{" "}
                  <span className="font-mono font-medium">{selected.logbook.archiveReference}</span>
                </p>
              )}

              {selected.logbook.status === "supervisor_reviewed" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Institutional remark</label>
                  <Textarea value={remark} onChange={(e) => setRemark(e.target.value)} />
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            {selected?.logbook.status === "supervisor_reviewed" ? (
              <>
                <Button variant="destructive" onClick={() => decide("rejected")} disabled={submitting}>
                  Reject
                </Button>
                <Button onClick={() => decide("approved")} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Approve and Archive
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
