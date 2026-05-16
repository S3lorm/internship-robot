"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { toast } from "sonner";
import { placementsApi } from "@/lib/api";
import type { InternshipPlacement } from "@/types";
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
  Send,
  MapPin,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { getStudentProgramGroup, groupByProgram } from "@/lib/department-catalog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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
  const sorted = keys.filter((k) => k !== "Unassigned").sort((a, b) => a.localeCompare(b));
  if (keys.includes("Unassigned")) sorted.push("Unassigned");
  return sorted;
}

export default function InternshipTrackingPage() {
  const { user } = useAuth();
  const [placements, setPlacements] = useState<InternshipPlacement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlacement, setSelectedPlacement] = useState<InternshipPlacement | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [emailFilter, setEmailFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [adminNotes, setAdminNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "admin" && user.role !== "hod") return;
    void loadPlacements();
  }, [user]);

  const loadPlacements = async () => {
    setIsLoading(true);
    try {
      const result = await placementsApi.getTrackingData();
      if (result.error) {
        toast.error(result.error);
        setPlacements([]);
        return;
      }
      const payload = result.data as { trackingData?: InternshipPlacement[] };
      setPlacements(Array.isArray(payload?.trackingData) ? payload.trackingData : []);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to load placements");
      setPlacements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const isHodView = user?.role === "hod";

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

    if (statusFilter !== "all") {
      list = list.filter((p) => p.status === statusFilter);
    }

    if (emailFilter !== "all") {
      list = list.filter((p) => {
        if (emailFilter === "sent") return p.emailSent === true;
        if (emailFilter === "pending") return p.emailSent === false && p.status === "approved";
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.organizationName.toLowerCase().includes(q) ||
          p.organizationEmail?.toLowerCase().includes(q) ||
          p.student?.firstName?.toLowerCase().includes(q) ||
          p.student?.lastName?.toLowerCase().includes(q) ||
          p.student?.studentId?.toLowerCase().includes(q) ||
          p.student?.department?.toLowerCase().includes(q) ||
          (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q))
      );
    }

    return list;
  }, [placements, deptFilter, statusFilter, emailFilter, searchQuery]);

  const byDepartment = useMemo(() => {
    const map = new Map<string, InternshipPlacement[]>();
    for (const p of filteredPlacements) {
      const d = departmentKey(p);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(p);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return map;
  }, [filteredPlacements]);

  const orderedDepts = useMemo(() => sortDepts(Array.from(byDepartment.keys())), [byDepartment]);

  const hodProgramSections = useMemo(() => {
    if (!isHodView || !user?.department) return null;
    return groupByProgram(filteredPlacements, user.department, (p) => p.student || {});
  }, [filteredPlacements, isHodView, user?.department]);

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

  const handleUpdateStatus = async (status: InternshipPlacement['status']) => {
    if (!selectedPlacement) return;

    const notes = adminNotes.trim();
    if (status === "rejected" && !notes) {
      toast.error("A written reason is required when denying a placement request.");
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
      } else {
        if (status === "approved") {
          const sent = (result.data as { organizationEmailSent?: boolean })?.organizationEmailSent;
          const err = (result.data as { organizationEmailError?: string })?.organizationEmailError;
          if (sent) {
            toast.success("Approved. Official letter (PDF) and evaluation link were emailed to the organization.");
          } else if (err) {
            toast.success(`Approved, but the organization email could not be sent: ${err}`);
          } else {
            toast.success("Placement approved.");
          }
        } else {
          toast.success(`Placement ${status.replace("_", " ")} successfully`);
        }
        setSelectedPlacement(null);
        setAdminNotes("");
        loadPlacements();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResendEmail = async (id: string) => {
    if (!confirm("Are you sure you want to trigger sending the official letter and evaluation link to the organization again?")) {
      return;
    }

    setIsSendingEmail(id);
    try {
      const result = await placementsApi.sendToOrganization(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Documents sent to organization successfully");
        if (selectedPlacement?.id === id) {
          setSelectedPlacement(null); 
        }
        loadPlacements();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send email");
    } finally {
      setIsSendingEmail(null);
    }
  };

  const stats = useMemo(
    () => ({
      total: filteredPlacements.length,
      pending: filteredPlacements.filter((p) => p.status === "pending").length,
      approved: filteredPlacements.filter((p) => p.status === "approved").length,
      emailsSent: filteredPlacements.filter((p) => p.emailSent).length,
    }),
    [filteredPlacements]
  );

  if (!user || (user.role !== "admin" && user.role !== "hod")) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Official internship tracking</h1>
        <p className="mt-1 max-w-3xl text-muted-foreground">
          {isHodView
            ? "Stage 2 placement requests in your department, grouped by course. Use View for full detail and actions."
            : "Stage 2 placement requests across the institution, grouped by department. Use View for full detail and actions."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary">{stats.total} shown</Badge>
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">
            {stats.pending} pending
          </Badge>
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-900">
            {stats.approved} approved
          </Badge>
          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-900">
            {stats.emailsSent} emails sent
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters & search</CardTitle>
          <CardDescription>Refine the list, then open a row with View for full detail and actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search student, ID, department, company, email, or reference…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {!isHodView && (
                <Select value={deptFilter} onValueChange={setDeptFilter}>
                  <SelectTrigger className="w-full sm:w-[220px]">
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
              )}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="modification_requested">Changes requested</SelectItem>
                </SelectContent>
              </Select>
              <Select value={emailFilter} onValueChange={setEmailFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Email" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All email status</SelectItem>
                  <SelectItem value="sent">Email sent</SelectItem>
                  <SelectItem value="pending">Pending send</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-9 w-9 animate-spin text-primary" />
        </div>
      ) : filteredPlacements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="mx-auto mb-3 h-10 w-10 opacity-40" />
            {placements.length === 0
              ? "No official placement requests have been submitted yet."
              : "No placements match your filters."}
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" defaultValue={accordionDefault} className="space-y-2">
          {accordionSections.map(({ key, rows }) => (
            <AccordionItem key={key} value={key} className="rounded-lg border border-border/80 bg-card px-1">
              <AccordionTrigger className="px-3 py-3 text-left hover:no-underline">
                <div className="flex flex-1 items-center justify-between gap-2 pr-2">
                  <span className="font-semibold text-sm md:text-base">{key}</span>
                  <Badge variant="secondary" className="shrink-0">
                    {rows.length} request{rows.length === 1 ? "" : "s"}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="overflow-x-auto border-t">
                  <table className="w-full min-w-[880px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left text-xs font-medium text-muted-foreground">
                        <th className="p-2.5">Submitted</th>
                        <th className="p-2.5">Student</th>
                        <th className="p-2.5">{isHodView ? "ID / Course" : "ID / Program"}</th>
                        <th className="p-2.5">Organisation</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5 w-[88px]" />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((p) => {
                        const st = statusConfig[p.status];
                        const Ic = st.icon;
                        const dept = p.student?.department || "";
                        return (
                          <tr
                            key={p.id}
                            className="border-b border-border/50 transition-colors hover:bg-muted/20"
                          >
                            <td className="p-2.5 whitespace-nowrap text-xs text-muted-foreground">
                              {new Date(p.createdAt).toLocaleString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="p-2.5">
                              <span className="font-medium">
                                {p.student?.firstName} {p.student?.lastName}
                              </span>
                            </td>
                            <td className="p-2.5">
                              <div className="font-mono text-xs">{p.student?.studentId}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {isHodView && user?.department
                                  ? getStudentProgramGroup(p.student || {}, user.department)
                                  : getStudentProgramGroup(p.student || {}, dept) || p.student?.program || "—"}
                              </div>
                            </td>
                            <td className="p-2.5 max-w-[200px]">
                              <div className="font-medium truncate text-xs">{p.organizationName}</div>
                              {p.referenceNumber && (
                                <code className="text-[10px] text-muted-foreground">{p.referenceNumber}</code>
                              )}
                            </td>
                            <td className="p-2.5">
                              <div className="flex flex-col gap-1">
                                <Badge variant="outline" className={cn("w-fit gap-1 text-xs", st.className)}>
                                  <Ic className="h-3 w-3" />
                                  {st.label}
                                </Badge>
                                {p.status === "approved" && (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "w-fit text-[10px]",
                                      p.emailSent
                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                        : "bg-amber-50 text-amber-800 border-amber-200"
                                    )}
                                  >
                                    {p.emailSent ? "Email sent" : "Email pending"}
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-2.5">
                              <Button size="sm" variant="secondary" onClick={() => void openDetail(p)}>
                                <Eye className="mr-1 h-3.5 w-3.5" />
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

      {/* Review Dialog */}
      <Dialog
        open={!!selectedPlacement}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPlacement(null);
            setAdminNotes("");
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedPlacement && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl flex items-center gap-2">
                      Review Official Placement
                      {selectedPlacement.referenceNumber && (
                        <code className="text-xs font-mono font-normal ml-2 bg-muted/50 px-2 py-1 rounded border">
                          Ref: {selectedPlacement.referenceNumber}
                        </code>
                      )}
                    </DialogTitle>
                    <DialogDescription className="mt-1">
                      Submitted on {new Date(selectedPlacement.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </DialogDescription>
                  </div>
                  <Badge variant="outline" className={`${statusConfig[selectedPlacement.status].className} text-sm px-3 py-1`}>
                    {statusConfig[selectedPlacement.status].label}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Student Info */}
                  <div className="bg-muted/20 p-4 rounded-lg border">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-primary">
                      <User className="h-4 w-4" /> Student Profile
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-3">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="col-span-2 font-medium">{selectedPlacement.student?.firstName} {selectedPlacement.student?.lastName}</span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span className="text-muted-foreground">Student ID:</span>
                        <span className="col-span-2 font-medium">{selectedPlacement.student?.studentId}</span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span className="text-muted-foreground">Program:</span>
                        <span className="col-span-2">{selectedPlacement.student?.program}</span>
                      </div>
                       <div className="grid grid-cols-3">
                        <span className="text-muted-foreground">Department:</span>
                        <span className="col-span-2">{selectedPlacement.student?.department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Organization Info */}
                  <div className="bg-muted/20 p-4 rounded-lg border border-l-4 border-l-blue-500">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-700">
                      <Building2 className="h-5 w-5" /> Target Organization
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="mb-2 pb-2 border-b">
                        <p className="font-bold text-base mb-1">{selectedPlacement.organizationName}</p>
                        {selectedPlacement.organizationAddress && (
                           <p className="text-muted-foreground"><MapPin className="h-3 w-3 inline mr-1" />{selectedPlacement.organizationAddress}</p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-[100px_1fr] items-center">
                        <span className="text-muted-foreground"><Mail className="h-3.5 w-3.5 inline mr-1" />Email:</span>
                        <span className="font-medium text-blue-600">{selectedPlacement.organizationEmail}</span>
                      </div>
                      <p className="text-xs text-amber-600 italic">This email will receive the official letter and evaluation token.</p>
                      
                    </div>
                  </div>

                  {/* Supervisor Info */}
                   <div className="bg-muted/20 p-4 rounded-lg border">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-indigo-700">
                      <User className="h-4 w-4" /> Supervisor Contact
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-[100px_1fr]">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{selectedPlacement.supervisorName}</span>
                      </div>
                      {selectedPlacement.supervisorPosition && (
                        <div className="grid grid-cols-[100px_1fr]">
                          <span className="text-muted-foreground">Position:</span>
                          <span>{selectedPlacement.supervisorPosition}</span>
                        </div>
                      )}
                      {selectedPlacement.supervisorContact && (
                        <div className="grid grid-cols-[100px_1fr]">
                          <span className="text-muted-foreground">Contact:</span>
                          <span>{selectedPlacement.supervisorContact}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Internship Details */}
                  <div className="bg-muted/20 p-4 rounded-lg border border-l-4 border-l-green-500">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-700">
                      <Briefcase className="h-4 w-4" /> Placement Details
                    </h3>
                    <div className="space-y-3 text-sm">
                      {selectedPlacement.departmentRole && (
                        <div>
                           <span className="text-muted-foreground block text-xs">Role/Department</span>
                           <span className="font-medium block p-1.5 bg-background border rounded">{selectedPlacement.departmentRole}</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                           <span className="text-muted-foreground block text-xs">Start Date</span>
                           <span className="font-medium flex items-center gap-1.5 p-1.5 bg-background border rounded">
                             <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                             {selectedPlacement.internshipStartDate ? new Date(selectedPlacement.internshipStartDate).toLocaleDateString() : 'N/A'}
                           </span>
                        </div>
                        <div>
                           <span className="text-muted-foreground block text-xs">End Date</span>
                           <span className="font-medium flex items-center gap-1.5 p-1.5 bg-background border rounded">
                             <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                             {selectedPlacement.internshipEndDate ? new Date(selectedPlacement.internshipEndDate).toLocaleDateString() : 'N/A'}
                           </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Admin Notes History */}
                  {(selectedPlacement.adminNotes || selectedPlacement.status === 'modification_requested') && (
                    <div className={`p-4 rounded-lg border ${selectedPlacement.status === 'modification_requested' ? 'bg-indigo-50 border-indigo-200' : 'bg-muted/20'}`}>
                      <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4" /> Previous Admin Notes
                      </h3>
                      <p className="text-sm whitespace-pre-wrap">
                        {selectedPlacement.adminNotes || "Modifications requested."}
                      </p>
                    </div>
                  )}

                  {/* System & Delivery Status */}
                  {selectedPlacement.status === 'approved' && (
                     <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                        <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-800 text-sm">
                          <Send className="h-4 w-4" /> Delivery Status
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                            <span className="text-muted-foreground">Evaluation Token Valid:</span>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Yes, Token Generated</Badge>
                          </div>
                          
                          <div className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                            <span className="text-muted-foreground">Outbound Emails Sent:</span>
                             <Badge variant="outline" className={selectedPlacement.emailSent ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}>
                               {selectedPlacement.emailSent ? "Sent Successfully" : "Pending Send"}
                             </Badge>
                          </div>
                          
                          {selectedPlacement.lastEmailSentAt && (
                            <p className="text-xs text-center text-muted-foreground">
                              Last attempt: {new Date(selectedPlacement.lastEmailSentAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                     </div>
                  )}

                  {/* Action Forms (If Pending Review or Modification Requested) */}
                  {(selectedPlacement.status === "pending" || selectedPlacement.status === "modification_requested") && (
                    <div className="border-t pt-4 space-y-4">
                      <div>
                        <Label htmlFor="adminFeedback" className="text-sm font-semibold flex items-center gap-1">
                          Decision notes / reason
                          <span className="text-xs font-normal text-muted-foreground">
                            (Required to deny or request changes; optional when approving)
                          </span>
                        </Label>
                        <Textarea
                          id="adminFeedback"
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="If denying or requesting changes, state the reason clearly for the student."
                          className="mt-2 min-h-[100px]"
                        />
                      </div>
                    </div>
                  )}

                </div>
              </div>

              <DialogFooter className="mt-6 border-t pt-4 sm:justify-between items-center bg-muted/10 -mx-6 -mb-6 p-4 rounded-b-lg">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedPlacement(null);
                    setAdminNotes("");
                  }}
                >
                  Close Window
                </Button>
                
                <div className="flex flex-wrap gap-2 justify-end">
                  {selectedPlacement.status !== 'approved' && (
                    <>
                      <Button
                        variant="outline"
                        className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                        onClick={() => handleUpdateStatus("rejected")}
                        disabled={isUpdating || !adminNotes.trim()}
                      >
                        {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                        Reject
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
                        onClick={() => handleUpdateStatus("modification_requested")}
                        disabled={isUpdating || !adminNotes.trim()}
                      >
                         {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertCircle className="mr-2 h-4 w-4" />}
                        Request Mod
                      </Button>
                      
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleUpdateStatus("approved")}
                        disabled={isUpdating}
                      >
                         {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Approve & Prepare Delivery
                      </Button>
                    </>
                  )}
                  
                  {selectedPlacement.status === 'approved' && (
                     <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleResendEmail(selectedPlacement.id)}
                        disabled={isSendingEmail === selectedPlacement.id}
                      >
                         {isSendingEmail === selectedPlacement.id ? (
                           <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                         ) : (
                           <> <Send className="mr-2 h-4 w-4" /> Trigger Official Email to {selectedPlacement.organizationEmail.split('@')[0]}... </>
                         )}
                      </Button>
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
