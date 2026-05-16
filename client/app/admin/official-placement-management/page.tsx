"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { placementsApi } from "@/lib/api";
import type { InternshipPlacement } from "@/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Briefcase,
  Building2,
  Mail,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Eye,
  Search,
  MapPin,
  Send,
  History,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getStudentProgramGroup, groupByProgram } from "@/lib/department-catalog";

const statusConfig: Record<
  InternshipPlacement["status"],
  { label: string; className: string; icon: typeof Clock }
> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-900 border-amber-200", icon: Clock },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-900 border-emerald-200", icon: CheckCircle2 },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-900 border-red-200", icon: XCircle },
  modification_requested: {
    label: "Changes requested",
    className: "bg-blue-100 text-blue-900 border-blue-200",
    icon: AlertCircle,
  },
};

function departmentKey(p: InternshipPlacement) {
  return p.student?.department?.trim() || "Unassigned";
}

function sortDepts(keys: string[]) {
  const u = keys.filter((k) => k !== "Unassigned").sort((a, b) => a.localeCompare(b));
  if (keys.includes("Unassigned")) u.push("Unassigned");
  return u;
}

const STALE_MS = 14 * 24 * 60 * 60 * 1000;

export default function OfficialPlacementManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isDepartmentRole = user?.role === "hod";
  const canAccessPage = user?.role === "admin" || isDepartmentRole;
  const [placements, setPlacements] = useState<InternshipPlacement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlacement, setSelectedPlacement] = useState<InternshipPlacement | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyStalePending, setOnlyStalePending] = useState(false);

  const [adminNotes, setAdminNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState<string | null>(null);

  useEffect(() => {
    if (user && !canAccessPage) {
      router.replace("/admin");
    }
  }, [user, router, canAccessPage]);

  const loadPlacements = async () => {
    setIsLoading(true);
    try {
      const result = await placementsApi.getTrackingData();
      if (result.data) {
        setPlacements((result.data as { trackingData?: InternshipPlacement[] }).trackingData || []);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load placements");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canAccessPage) void loadPlacements();
  }, [canAccessPage]);

  const departmentOptions = useMemo(() => {
    const s = new Set<string>();
    for (const p of placements) s.add(departmentKey(p));
    return sortDepts(Array.from(s));
  }, [placements]);

  const filteredPlacements = useMemo(() => {
    let list = [...placements];

    if (deptFilter !== "all") {
      list = list.filter((p) => departmentKey(p) === deptFilter);
    }

    if (statusFilter === "approved") list = list.filter((p) => p.status === "approved");
    else if (statusFilter === "pending") list = list.filter((p) => p.status === "pending");
    else if (statusFilter === "rejected") list = list.filter((p) => p.status === "rejected");
    else if (statusFilter === "not_approved") {
      list = list.filter((p) => p.status === "rejected" || p.status === "modification_requested");
    } else if (statusFilter === "modification_requested") {
      list = list.filter((p) => p.status === "modification_requested");
    }

    if (onlyStalePending) {
      const now = Date.now();
      list = list.filter((p) => {
        if (p.status !== "pending") return false;
        const t = new Date(p.createdAt).getTime();
        return now - t > STALE_MS;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.organizationName.toLowerCase().includes(q) ||
          p.organizationEmail.toLowerCase().includes(q) ||
          (p.organizationAddress && p.organizationAddress.toLowerCase().includes(q)) ||
          p.student?.firstName?.toLowerCase().includes(q) ||
          p.student?.lastName?.toLowerCase().includes(q) ||
          p.student?.studentId?.toLowerCase().includes(q) ||
          p.student?.department?.toLowerCase().includes(q) ||
          (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q))
      );
    }

    return list;
  }, [placements, deptFilter, statusFilter, searchQuery, onlyStalePending]);

  const byDepartment = useMemo(() => {
    const map = new Map<string, InternshipPlacement[]>();
    for (const p of filteredPlacements) {
      const d = departmentKey(p);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(p);
    }
    for (const arr of map.values()) {
      arr.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return map;
  }, [filteredPlacements]);

  const orderedDepts = useMemo(() => sortDepts(Array.from(byDepartment.keys())), [byDepartment]);

  const hodProgramSections = useMemo(() => {
    if (!isDepartmentRole || !user?.department) return null;
    return groupByProgram(filteredPlacements, user.department, (p) => p.student || {});
  }, [filteredPlacements, isDepartmentRole, user?.department]);

  const accordionSections = useMemo(() => {
    if (hodProgramSections && hodProgramSections.length > 0) {
      return hodProgramSections.map((g) => ({ key: g.program, rows: g.items }));
    }
    return orderedDepts.map((dept) => ({ key: dept, rows: byDepartment.get(dept) || [] }));
  }, [hodProgramSections, orderedDepts, byDepartment]);

  const accordionDefault = useMemo(
    () => accordionSections.map((s) => s.key),
    [accordionSections]
  );

  const openDetail = async (p: InternshipPlacement) => {
    setDetailLoading(true);
    setSelectedPlacement(p);
    setAdminNotes("");
    try {
      const res = await placementsApi.getById(p.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      const pl = (res.data as { placement?: InternshipPlacement })?.placement;
      if (pl) setSelectedPlacement(pl);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateStatus = async (status: InternshipPlacement["status"]) => {
    if (!selectedPlacement) return;
    const notes = adminNotes.trim();
    if (status === "rejected" && !notes) {
      toast.error("A written reason is required when rejecting a placement request.");
      return;
    }
    if (status === "modification_requested" && !notes) {
      toast.error("Explain what the student must change before requesting modifications.");
      return;
    }

    setIsUpdating(true);
    try {
      const result = await placementsApi.updateStatus(
        selectedPlacement.id,
        status,
        notes || undefined
      );
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (status === "approved") {
        const sent = (result.data as { organizationEmailSent?: boolean })?.organizationEmailSent;
        const err = (result.data as { organizationEmailError?: string })?.organizationEmailError;
        if (sent) {
          toast.success("Approved. Official letter and evaluation link were emailed to the organization.");
        } else if (err) {
          toast.success(`Approved, but the organization email could not be sent: ${err}`);
        } else {
          toast.success("Placement updated.");
        }
      } else {
        toast.success(`Status updated: ${status.replace(/_/g, " ")}`);
      }
      setSelectedPlacement(null);
      setAdminNotes("");
      void loadPlacements();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResendEmail = async (id: string) => {
    if (!confirm("Send the official letter and evaluation link to the organization again?")) return;
    setIsSendingEmail(id);
    try {
      const result = await placementsApi.sendToOrganization(id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Documents sent to the organization.");
        if (selectedPlacement?.id === id) {
          const r = await placementsApi.getById(id);
          const pl = (r.data as { placement?: InternshipPlacement })?.placement;
          if (pl) setSelectedPlacement(pl);
        }
        void loadPlacements();
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setIsSendingEmail(null);
    }
  };

  if (!user || !canAccessPage) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Official placement management</h1>
        <p className="mt-1 max-w-3xl text-muted-foreground">
          {isDepartmentRole
            ? "Department visibility of Stage 2 official placement requests. Approve, reject, or request changes. On approval, the same organisation email (PDF + evaluation link) is sent and actions are recorded for audit."
            : "System-wide visibility of Stage 2 official placement requests. Approve, reject, or request changes. On approval, the same organisation email (PDF + evaluation link) is sent as for HOD decisions. Actions are recorded for audit."}
        </p>
      </div>


      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters &amp; search</CardTitle>
          <CardDescription>Refine the list, then open a row for full detail and actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search student, ID, department, company, email, address, or reference…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departmentOptions.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending (needs action)</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="modification_requested">Changes requested</SelectItem>
                  <SelectItem value="not_approved">Not approved (rejected + changes)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="stale"
              checked={onlyStalePending}
              onCheckedChange={(c) => setOnlyStalePending(c === true)}
            />
            <label htmlFor="stale" className="text-sm text-muted-foreground leading-none">
              Show only long-pending requests (pending over 14 days) — &quot;ignored&quot; queue
            </label>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-9 w-9 animate-spin text-primary" />
        </div>
      ) : filteredPlacements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="mx-auto mb-3 h-10 w-10 opacity-40" />
            No official placement requests match your filters.
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" defaultValue={accordionDefault} className="space-y-2">
          {accordionSections.map(({ key, rows }) => (
              <AccordionItem key={key} value={key} className="rounded-lg border border-border/80 bg-card px-1">
                <AccordionTrigger className="px-3 py-3 text-left hover:no-underline">
                  <div className="flex flex-1 items-center justify-between gap-2 pr-2">
                    <span className="font-semibold">{key}</span>
                    <Badge variant="secondary" className="shrink-0">
                      {rows.length} request{rows.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="overflow-x-auto border-t">
                    <table className="w-full min-w-[900px] text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40 text-left text-xs font-medium text-muted-foreground">
                          <th className="p-3">Requested</th>
                          <th className="p-3">Student</th>
                          <th className="p-3">{isDepartmentRole ? "ID / Course" : "ID / Dept"}</th>
                          <th className="p-3">Organisation</th>
                          <th className="p-3">Contact</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 w-[100px]"> </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((p) => {
                          const st = statusConfig[p.status];
                          const Ic = st.icon;
                          return (
                            <tr
                              key={p.id}
                              className="border-b border-border/50 transition-colors hover:bg-muted/20"
                            >
                              <td className="p-3 whitespace-nowrap text-muted-foreground">
                                {new Date(p.createdAt).toLocaleString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>
                              <td className="p-3">
                                {p.student?.firstName} {p.student?.lastName}
                              </td>
                              <td className="p-3">
                                <div className="font-mono text-xs">{p.student?.studentId}</div>
                                <div className="text-xs text-muted-foreground">{isDepartmentRole && user?.department
                                    ? getStudentProgramGroup(p.student || {}, user.department)
                                    : p.student?.department || "—"}</div>
                              </td>
                              <td className="p-3 max-w-[180px]">
                                <div className="font-medium truncate" title={p.organizationName}>
                                  {p.organizationName}
                                </div>
                                {p.referenceNumber && (
                                  <code className="text-[11px] text-muted-foreground">{p.referenceNumber}</code>
                                )}
                              </td>
                              <td className="p-3 max-w-[200px]">
                                <div className="flex items-center gap-1.5 text-xs truncate" title={p.organizationEmail}>
                                  <Mail className="h-3.5 w-3.5 shrink-0" />
                                  {p.organizationEmail}
                                </div>
                                {p.organizationAddress && (
                                  <div
                                    className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground line-clamp-2"
                                    title={p.organizationAddress}
                                  >
                                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                    {p.organizationAddress}
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                <Badge
                                  variant="outline"
                                  className={cn("shrink-0 gap-1", st.className)}
                                >
                                  <Ic className="h-3 w-3" />
                                  {st.label}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <Button size="sm" variant="secondary" onClick={() => void openDetail(p)}>
                                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                                  View
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>
          ))}
        </Accordion>
      )}

      <Dialog
        open={!!selectedPlacement}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPlacement(null);
            setAdminNotes("");
          }
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
          {selectedPlacement && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">Placement detail</DialogTitle>
                <DialogDescription>
                  Reference {selectedPlacement.referenceNumber || "—"} · Submitted{" "}
                  {new Date(selectedPlacement.createdAt).toLocaleString("en-GB")}
                </DialogDescription>
              </DialogHeader>

              {detailLoading && (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2 min-w-0">
                <Card className="border bg-muted/20">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" /> Student
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm pt-0 min-w-0">
                    <p className="break-words">
                      <span className="text-muted-foreground">Name: </span>
                      {selectedPlacement.student?.firstName} {selectedPlacement.student?.lastName}
                    </p>
                    <p className="break-all">
                      <span className="text-muted-foreground">ID: </span>
                      {selectedPlacement.student?.studentId}
                    </p>
                    <p className="break-words">
                      <span className="text-muted-foreground">Department: </span>
                      {selectedPlacement.student?.department || "—"}
                    </p>
                    <p className="break-words">
                      <span className="text-muted-foreground">Program: </span>
                      {selectedPlacement.student?.program || "—"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border bg-muted/20">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> Company
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm pt-0 min-w-0">
                    <p className="font-medium break-words">{selectedPlacement.organizationName}</p>
                    <p className="flex items-center gap-2 text-blue-600 dark:text-blue-400 break-all">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      {selectedPlacement.organizationEmail}
                    </p>
                    {selectedPlacement.organizationAddress && (
                      <p className="text-muted-foreground text-xs break-words">
                        <MapPin className="h-3.5 w-3.5 inline mr-1" />
                        {selectedPlacement.organizationAddress}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="md:col-span-2 border bg-muted/20">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <History className="h-4 w-4" /> Action history (audit)
                    </CardTitle>
                    <CardDescription>Who changed status, when, and whether the org email was sent on approval.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 min-w-0">
                    {selectedPlacement.actionLogs && selectedPlacement.actionLogs.length > 0 ? (
                      <ul className="space-y-2 text-sm max-h-48 overflow-y-auto">
                        {selectedPlacement.actionLogs.map((log) => (
                          <li
                            key={log.id}
                            className="rounded-md border border-border/60 bg-background/80 px-3 py-2"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-1">
                              <span className="font-medium">
                                {log.newStatus?.replace(/_/g, " ")}
                                {log.previousStatus
                                  ? ` (from ${String(log.previousStatus).replace(/_/g, " ")})`
                                  : null}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(log.createdAt).toLocaleString("en-GB")}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 break-words">
                              {log.actor
                                ? `${log.actor.firstName} ${log.actor.lastName} (${log.actorRole})`
                                : `User ${log.actorId || "—"}`}
                              {log.organizationEmailSent === true && " · organisation email sent"}
                              {log.organizationEmailSent === false && " · organisation email not sent (see logs)"}
                            </div>
                            {log.notes && (
                              <p className="text-xs mt-1 whitespace-pre-wrap break-words border-t border-border/40 pt-1">
                                {log.notes}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No actions logged yet (legacy requests before audit).</p>
                    )}
                  </CardContent>
                </Card>

                  {(selectedPlacement.status === "pending" ||
                    selectedPlacement.status === "modification_requested") && (
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="decision-notes">Notes (required to reject or request changes)</Label>
                    <Textarea
                      id="decision-notes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Visible to the student for rejections and modification requests."
                      className="min-h-[100px]"
                    />
                  </div>
                )}

                {selectedPlacement.status === "approved" && (
                  <div className="md:col-span-2 flex items-center justify-between flex-wrap gap-2 rounded-md border p-3 bg-blue-50/50 dark:bg-blue-950/20">
                    <div className="text-sm text-muted-foreground">
                      {selectedPlacement.emailSent
                        ? "An email with the official PDF and evaluation link was sent to the company."
                        : "Approval is recorded; you can send or resend the company email if needed."}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => void handleResendEmail(selectedPlacement.id)}
                      disabled={isSendingEmail === selectedPlacement.id}
                    >
                      {isSendingEmail === selectedPlacement.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-1.5" />
                          {selectedPlacement.emailSent ? "Resend to company" : "Send to company"}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between sm:items-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSelectedPlacement(null);
                    setAdminNotes("");
                  }}
                >
                  Close
                </Button>
                <div className="flex flex-wrap justify-end gap-2">
                  {(selectedPlacement.status === "pending" ||
                    selectedPlacement.status === "modification_requested") && (
                    <>
                      <Button
                        variant="outline"
                        className="text-destructive border-destructive/30"
                        disabled={isUpdating}
                        onClick={() => void handleUpdateStatus("rejected")}
                      >
                        Reject
                      </Button>
                      <Button disabled={isUpdating} onClick={() => void handleUpdateStatus("approved")}>
                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve & notify company"}
                      </Button>
                    </>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
