"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { lettersApi, placementsApi } from "@/lib/api";
import type { LetterRequest, InternshipPlacement } from "@/types";
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Building2,
  Info,
  User as UserIcon,
  Lock,
  Unlock,
  Briefcase,
  Mail,
  Copy,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatPlacementLockDate,
  getPlacementFormLockState,
} from "@/lib/placement-form-lock";
import { usePortalStatus } from "@/hooks/use-portal-status";
import { PortalStatusBanner } from "@/components/portal-status-banner";
import { PORTAL_CLOSED_MESSAGE } from "@/lib/internship-portal";
import {
  internshipEndDateMin,
  todayInputDateMin,
  validateInternshipDateRange,
} from "@/lib/internship-date-validation";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
  modification_requested: { label: "Modifications Requested", color: "bg-blue-100 text-blue-800 border-blue-200", icon: AlertCircle },
};

function calculateSixWeeksEndDate(startDate: string): string {
  if (!startDate) return "";
  const start = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) return "";
  const end = new Date(start);
  end.setDate(end.getDate() + 42); // 6 weeks
  const year = end.getFullYear();
  const month = String(end.getMonth() + 1).padStart(2, "0");
  const day = String(end.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function LetterRequestsPage() {
  const { user } = useAuth();
  const { portal, loading: portalLoading, isOpen: portalOpen } = usePortalStatus();

  // Stage 1 state
  const [generalRequests, setGeneralRequests] = useState<LetterRequest[]>([]);
  const [isLoadingGeneral, setIsLoadingGeneral] = useState(true);
  const [isSubmittingGeneral, setIsSubmittingGeneral] = useState(false);
  const [selectedGeneralRequest, setSelectedGeneralRequest] = useState<LetterRequest | null>(null);
  const [generalForm, setGeneralForm] = useState({
    requestType: "general",
    internshipStartDate: "",
    internshipEndDate: "",
  });

  // Stage 2 state
  const [placements, setPlacements] = useState<InternshipPlacement[]>([]);
  const [approvedGeneralRequests, setApprovedGeneralRequests] = useState<any[]>([]);
  const [isSubmittingPlacement, setIsSubmittingPlacement] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState<string | null>(null);
  const [selectedPlacement, setSelectedPlacement] = useState<InternshipPlacement | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [placementForm, setPlacementForm] = useState({
    generalRequestId: "",
    organizationName: "",
    organizationAddress: "",
    organizationEmail: "",
    supervisorName: "",
    supervisorPosition: "",
    supervisorContact: "",
    internshipStartDate: "",
    internshipEndDate: "",
    departmentRole: "",
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoadingGeneral(true);
    try {
      // Load general requests
      const generalResult = await lettersApi.getRequests();
      if (generalResult.data) {
        const gRequests = (generalResult.data.requests || []).filter(
          (r: LetterRequest) => r.requestType === "general" || r.requestType === "admin"
        );
        setGeneralRequests(gRequests);
      }

      // Check for approved general requests and load placements
      try {
        const generalStatus = await lettersApi.checkGeneralApproval();
        if (generalStatus.data) {
          setApprovedGeneralRequests(generalStatus.data.approvedRequests || []);
          if (generalStatus.data.approvedRequests?.length === 1) {
            setPlacementForm((prev) => ({
              ...prev,
              generalRequestId: generalStatus.data.approvedRequests[0].id,
            }));
          }
        }
      } catch {
        // If checkGeneralApproval fails, just continue
      }

      try {
        const placementsResult = await placementsApi.getAll();
        if (placementsResult.data) {
          setPlacements(placementsResult.data.placements || []);
        }
      } catch {
        // If placements fail, just continue
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load data");
    } finally {
      setIsLoadingGeneral(false);
    }
  };

  // Derived state
  const hasPendingOrApprovedGeneral = generalRequests.some(
    (r) => r.status === "pending" || r.status === "approved"
  );
  const hasApprovedGeneral = generalRequests.some((r) => r.status === "approved");
  
  const placementFormLock = useMemo(
    () => getPlacementFormLockState(placements),
    [placements]
  );
  const minPlacementStartDate = todayInputDateMin();
  const minPlacementEndDate = internshipEndDateMin(placementForm.internshipStartDate);

  const portalClosed = !portalOpen;
  const stage1Locked = hasPendingOrApprovedGeneral || portalClosed;
  const stage2LockedByPlacement = placementFormLock.locked;
  const stage2Unlocked = hasApprovedGeneral && !stage2LockedByPlacement && portalOpen;

  const latestGeneralRequest = generalRequests.length > 0
    ? generalRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  // Stage 1 handlers
  const handleGeneralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (portalClosed) {
      toast.error(PORTAL_CLOSED_MESSAGE);
      return;
    }
    if (!generalForm.internshipStartDate) {
      toast.error("Please select your internship start date.");
      return;
    }
    if (!generalForm.internshipEndDate) {
      toast.error("Please select your internship end date.");
      return;
    }
    setIsSubmittingGeneral(true);
    try {
      const result = await lettersApi.createRequest(generalForm as any);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("General letter request submitted successfully!");
        setGeneralForm({ requestType: "general", internshipStartDate: "", internshipEndDate: "" });
        loadAllData();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit request");
    } finally {
      setIsSubmittingGeneral(false);
    }
  };

  // Stage 2 handlers
  const handlePlacementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (portalClosed) {
      toast.error(PORTAL_CLOSED_MESSAGE);
      return;
    }
    if (placementFormLock.locked) {
      toast.error("Official placement registration is locked.");
      return;
    }
    if (!placementForm.generalRequestId) {
      toast.error("Please select an approved general request to link this placement to.");
      return;
    }
    const dateError = validateInternshipDateRange(
      placementForm.internshipStartDate,
      placementForm.internshipEndDate
    );
    if (dateError) {
      toast.error(dateError);
      return;
    }
    setIsSubmittingPlacement(true);
    try {
      const result = await placementsApi.create(placementForm as any);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Official placement request submitted successfully!");
        setPlacementForm({
          generalRequestId: placementForm.generalRequestId,
          organizationName: "",
          organizationAddress: "",
          organizationEmail: "",
          supervisorName: "",
          supervisorPosition: "",
          supervisorContact: "",
          internshipStartDate: "",
          internshipEndDate: "",
          departmentRole: "",
        });
        loadAllData();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit placement");
    } finally {
      setIsSubmittingPlacement(false);
    }
  };

  const handleSendEmail = async (id: string, orgName: string) => {
    if (!confirm(`Send official letter and evaluation form to ${orgName}?`)) return;
    setIsSendingEmail(id);
    try {
      const result = await placementsApi.sendToOrganization(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Email sent successfully!");
        loadAllData();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send email");
    } finally {
      setIsSendingEmail(null);
    }
  };

  if (isLoadingGeneral) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl uppercase">
          Internship Letter Requests
        </h1>
        <p className="text-muted-foreground mt-1">
          Complete both stages to get your official internship documents.
        </p>
      </div>

      <PortalStatusBanner portal={portal} loading={portalLoading} />

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-blue-800 shadow-sm">
        <Info className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold">How the Two-Stage Process Works</h3>
          <ol className="list-decimal ml-5 mt-2 space-y-1 text-sm">
            <li><strong>Stage 1:</strong> Request a general introduction letter. Once approved by admin, use it to apply to companies.</li>
            <li><strong>Stage 2:</strong> After a company accepts you, register the official placement with their details. This is <strong>locked</strong> until Stage 1 is approved.</li>
          </ol>
        </div>
      </div>

      {/* ============================================ */}
      {/* STAGE 1: General Letter Request */}
      {/* ============================================ */}
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">1</div>
          <h2 className="text-xl font-bold">Stage 1: General Introduction Letter</h2>
          {stage1Locked && (
            <Badge variant="outline" className="ml-auto text-amber-700 border-amber-300 bg-amber-50">
              <Lock className="h-3 w-3 mr-1" />
              {latestGeneralRequest?.status === "pending" ? "Pending Approval" : "Approved"}
            </Badge>
          )}
        </div>

        <Card className={`border-muted shadow-sm ${stage1Locked ? "opacity-75" : ""}`}>
          <CardHeader className="bg-muted/30 border-b pb-4">
            <CardTitle className="text-base">
              {stage1Locked
                ? "Request Already Submitted"
                : "Submit General Letter Request"}
            </CardTitle>
            <CardDescription>
              {stage1Locked
                ? `Your request is currently "${latestGeneralRequest?.status}". You cannot submit another request until it is processed.`
                : "Provide your internship period details to receive a general introduction letter."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Show current request status if locked */}
            {stage1Locked && latestGeneralRequest && (
              <div className={`p-4 rounded-lg border mb-6 flex items-start gap-3 ${
                latestGeneralRequest.status === "approved"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : latestGeneralRequest.status === "rejected"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}>
                {latestGeneralRequest.status === "approved" ? (
                  <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
                ) : latestGeneralRequest.status === "rejected" ? (
                  <XCircle className="h-5 w-5 mt-0.5 shrink-0" />
                ) : (
                  <Clock className="h-5 w-5 mt-0.5 shrink-0" />
                )}
                <div>
                  <h4 className="font-semibold">
                    {latestGeneralRequest.status === "approved"
                      ? "Request Approved ✓"
                      : latestGeneralRequest.status === "rejected"
                      ? "Request Rejected"
                      : "Request Pending Review"}
                  </h4>
                  <p className="text-sm mt-1">
                    {latestGeneralRequest.status === "approved"
                      ? "Your general letter has been approved. You can now proceed to Stage 2 below to register your official placement."
                      : latestGeneralRequest.status === "rejected"
                      ? "Your request was rejected. Please check any admin notes and contact admin if needed."
                      : "Your request is being reviewed by the admin. You will be notified once it's approved."}
                  </p>
                  {latestGeneralRequest.status === "approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={async () => {
                        try {
                          const blob = await lettersApi.downloadLetterPDF(latestGeneralRequest.id);
                          if (!(blob instanceof Blob)) return;
                          const ref =
                            latestGeneralRequest.referenceNumber ||
                            latestGeneralRequest.id;
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `General_Introduction_Letter_${ref}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                          toast.success("General request letter downloaded as PDF");
                        } catch (error: any) {
                          toast.error(error.message || "Failed to download letter");
                        }
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                  )}
                  {latestGeneralRequest.internshipStartDate && latestGeneralRequest.internshipEndDate && (
                    <p className="text-xs mt-2 opacity-75">
                      Period: {new Date(latestGeneralRequest.internshipStartDate as string).toLocaleDateString()} - {new Date(latestGeneralRequest.internshipEndDate as string).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Form - disabled when locked */}
            <form onSubmit={handleGeneralSubmit} className="space-y-6">
              <fieldset disabled={stage1Locked} className={stage1Locked ? "pointer-events-none" : ""}>
                {/* Student Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                    <UserIcon className="h-5 w-5 text-blue-600" />
                    Student Information
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input value={`${user?.firstName} ${user?.lastName}`} disabled className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label>Student ID</Label>
                      <Input value={user?.studentId || "N/A"} disabled className="bg-muted" />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Program</Label>
                      <Input value={user?.program || "N/A"} disabled className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label>Year of Study</Label>
                      <Input value={user?.yearOfStudy ? `${user.yearOfStudy}${getOrdinalSuffix(user.yearOfStudy)} Year` : "N/A"} disabled className="bg-muted" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={user?.email || "N/A"} disabled className="bg-muted" />
                  </div>
                </div>

                {/* Internship Dates */}
                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Internship Period
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="internshipStartDate">Start Date <span className="text-destructive">*</span></Label>
                      <Input
                        id="internshipStartDate"
                        name="internshipStartDate"
                        type="date"
                        value={generalForm.internshipStartDate}
                        onChange={(e) =>
                          setGeneralForm((prev) => ({
                            ...prev,
                            internshipStartDate: e.target.value,
                            internshipEndDate: e.target.value
                              ? calculateSixWeeksEndDate(e.target.value)
                              : "",
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="internshipEndDate">End Date (Auto: 6 weeks) <span className="text-destructive">*</span></Label>
                      <Input
                        id="internshipEndDate"
                        name="internshipEndDate"
                        type="date"
                        value={generalForm.internshipEndDate}
                        onChange={(e) => setGeneralForm({ ...generalForm, internshipEndDate: e.target.value })}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        End date is auto-filled to 6 weeks from start date, but you can change it.
                      </p>
                    </div>
                  </div>
                </div>
              </fieldset>

              {!stage1Locked && (
                <div className="pt-4 flex justify-end gap-3 border-t">
                  <Button type="submit" disabled={isSubmittingGeneral} className="min-w-[150px]">
                    {isSubmittingGeneral ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Submit Request
                      </>
                    )}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* STAGE 2: Official Placement */}
      {/* ============================================ */}
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
            stage2Unlocked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>2</div>
          <h2 className={`text-xl font-bold ${!stage2Unlocked ? "text-muted-foreground" : ""}`}>
            Stage 2: Official Placement
          </h2>
          {stage2Unlocked ? (
            <Badge variant="outline" className="ml-auto text-green-700 border-green-300 bg-green-50">
              <Unlock className="h-3 w-3 mr-1" />
              Unlocked
            </Badge>
          ) : (
            <Badge variant="outline" className="ml-auto text-muted-foreground">
              <Lock className="h-3 w-3 mr-1" />
              {stage2LockedByPlacement
                ? placementFormLock.reason === "approved_active"
                  ? "Locked — Approved by staff"
                  : placementFormLock.reason === "pending_review"
                    ? "Locked — Awaiting review"
                    : placementFormLock.reason === "modification_requested"
                      ? "Locked — Changes requested"
                      : "Locked — Active placement"
                : "Locked — Stage 1 approval required"}
            </Badge>
          )}
        </div>

        <div className="space-y-6">
          {!hasApprovedGeneral ? (
            /* Locked state (needs Stage 1) */
            <Card className="border-dashed border-2 border-muted">
              <CardContent className="py-12 text-center">
                <Lock className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  Stage 2 is Locked
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  You need an approved Stage 1 general letter request before you can register an official placement. 
                  {!hasPendingOrApprovedGeneral && " Submit your Stage 1 request above to get started."}
                  {latestGeneralRequest?.status === "pending" && " Your Stage 1 request is currently pending approval."}
                </p>
              </CardContent>
            </Card>
          ) : stage2LockedByPlacement ? (
            /* Locked: pending review, approved by HOD/Secretary, or changes requested */
            <Card
              className={
                placementFormLock.reason === "approved_active"
                  ? "border-green-200 bg-green-50/40 dark:border-green-900 dark:bg-green-950/20"
                  : "border-amber-200 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20"
              }
            >
              <CardContent className="py-12 text-center">
                <Lock
                  className={`mx-auto h-12 w-12 mb-4 ${
                    placementFormLock.reason === "approved_active"
                      ? "text-green-500"
                      : "text-amber-500"
                  }`}
                />
                <h3
                  className={`text-lg font-medium mb-2 ${
                    placementFormLock.reason === "approved_active"
                      ? "text-green-900 dark:text-green-100"
                      : "text-amber-900 dark:text-amber-100"
                  }`}
                >
                  {placementFormLock.reason === "approved_active"
                    ? "Placement approved — registration locked"
                    : placementFormLock.reason === "pending_review"
                      ? "Placement awaiting HOD / Secretary review"
                      : placementFormLock.reason === "modification_requested"
                        ? "Placement needs changes"
                        : "Official placement locked"}
                </h3>
                <p
                  className={`text-sm max-w-md mx-auto ${
                    placementFormLock.reason === "approved_active"
                      ? "text-green-800 dark:text-green-200"
                      : "text-amber-800 dark:text-amber-200"
                  }`}
                >
                  {placementFormLock.reason === "approved_active"
                    ? "Your official placement was approved by HOD or Secretary. You cannot edit or submit another registration while this placement is active."
                    : placementFormLock.reason === "pending_review"
                      ? "You already submitted an official placement. Wait until HOD or Secretary approves or rejects it before registering another."
                      : placementFormLock.reason === "modification_requested"
                        ? "Staff requested changes on your placement. Resolve that request before registering another."
                        : "You cannot register another official placement at this time."}
                </p>
                {placementFormLock.placement && (
                  <div className="mt-6 mx-auto max-w-sm rounded-lg border bg-background/80 p-4 text-left text-sm">
                    <p className="font-semibold">{placementFormLock.placement.organizationName}</p>
                    {placementFormLock.placement.internshipStartDate &&
                      placementFormLock.placement.internshipEndDate && (
                        <p className="mt-1 text-muted-foreground">
                          {formatPlacementLockDate(placementFormLock.placement.internshipStartDate)} –{" "}
                          {formatPlacementLockDate(placementFormLock.placement.internshipEndDate)}
                        </p>
                      )}
                  </div>
                )}
                {placementFormLock.reason === "approved_active" &&
                  placementFormLock.unlockAfter && (
                    <p className="mt-4 text-sm text-green-800 dark:text-green-200">
                      New registration opens after your internship ends on{" "}
                      <strong>{formatPlacementLockDate(placementFormLock.unlockAfter)}</strong>.
                    </p>
                  )}
              </CardContent>
            </Card>
          ) : (
            /* Unlocked - show placement form */
            <Card className="border-muted shadow-sm">
              <CardHeader className="bg-muted/30 border-b pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Register Official Internship Placement
                </CardTitle>
                <CardDescription>
                  Provide the exact details of the organization where you will be doing your internship.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handlePlacementSubmit} className="space-y-8">
                  {/* Link to Stage 1 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Link to Approved Request
                    </h3>
                    <div className="space-y-2">
                      <Label>Select Approved General Request <span className="text-destructive">*</span></Label>
                      <Select
                        value={placementForm.generalRequestId}
                        onValueChange={(value) => setPlacementForm({ ...placementForm, generalRequestId: value })}
                        required
                      >
                        <SelectTrigger className="w-full md:w-[400px]">
                          <SelectValue placeholder="Select a request..." />
                        </SelectTrigger>
                        <SelectContent>
                          {approvedGeneralRequests.map((req) => (
                            <SelectItem key={req.id} value={req.id}>
                              Valid for: {req.internshipDuration} (Ref: {req.referenceNumber || "N/A"})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Organization Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      Organization Details
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="organizationName">Organization Name <span className="text-destructive">*</span></Label>
                        <Input
                          id="organizationName"
                          value={placementForm.organizationName}
                          onChange={(e) => setPlacementForm({ ...placementForm, organizationName: e.target.value })}
                          placeholder="e.g., Ghana Ports and Harbours Authority"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="organizationEmail">Official Contact Email <span className="text-destructive">*</span></Label>
                        <Input
                          id="organizationEmail"
                          type="email"
                          value={placementForm.organizationEmail}
                          onChange={(e) => setPlacementForm({ ...placementForm, organizationEmail: e.target.value })}
                          placeholder="hr@company.com"
                          required
                        />
                        <p className="text-xs text-amber-600 font-medium">⚠️ The official letter will be emailed here.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="organizationAddress">Physical Address</Label>
                      <Textarea
                        id="organizationAddress"
                        value={placementForm.organizationAddress}
                        onChange={(e) => setPlacementForm({ ...placementForm, organizationAddress: e.target.value })}
                        placeholder="Company's physical location..."
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>

                  {/* Supervisor Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                      <UserIcon className="h-5 w-5 text-blue-600" />
                      Supervisor / Contact Person
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="supervisorName">Supervisor Name <span className="text-destructive">*</span></Label>
                        <Input
                          id="supervisorName"
                          value={placementForm.supervisorName}
                          onChange={(e) => setPlacementForm({ ...placementForm, supervisorName: e.target.value })}
                          placeholder="e.g., Mr. John Doe"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supervisorPosition">Position / Title</Label>
                        <Input
                          id="supervisorPosition"
                          value={placementForm.supervisorPosition}
                          onChange={(e) => setPlacementForm({ ...placementForm, supervisorPosition: e.target.value })}
                          placeholder="e.g., HR Manager"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supervisorContact">Phone Number</Label>
                      <Input
                        id="supervisorContact"
                        type="tel"
                        value={placementForm.supervisorContact}
                        onChange={(e) => setPlacementForm({ ...placementForm, supervisorContact: e.target.value })}
                        placeholder="+233 XX XXX XXXX"
                      />
                    </div>
                  </div>

                  {/* Placement Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                      Placement Details
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="departmentRole">Assigned Department / Role</Label>
                      <Input
                        id="departmentRole"
                        value={placementForm.departmentRole}
                        onChange={(e) => setPlacementForm({ ...placementForm, departmentRole: e.target.value })}
                        placeholder="e.g., IT Support Intern"
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="placementStartDate">Confirmed Start Date <span className="text-destructive">*</span></Label>
                        <Input
                          id="placementStartDate"
                          type="date"
                          value={placementForm.internshipStartDate}
                          min={minPlacementStartDate}
                          onChange={(e) => {
                            const start = e.target.value;
                            setPlacementForm((prev) => {
                              const next = { ...prev, internshipStartDate: start };
                              if (next.internshipEndDate) {
                                const endMin = internshipEndDateMin(start);
                                if (next.internshipEndDate < endMin) next.internshipEndDate = "";
                              }
                              return next;
                            });
                          }}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="placementEndDate">Confirmed End Date <span className="text-destructive">*</span></Label>
                        <Input
                          id="placementEndDate"
                          type="date"
                          value={placementForm.internshipEndDate}
                          min={minPlacementEndDate}
                          disabled={!placementForm.internshipStartDate}
                          onChange={(e) =>
                            setPlacementForm({ ...placementForm, internshipEndDate: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setPlacementForm({
                          generalRequestId: placementForm.generalRequestId,
                          organizationName: "",
                          organizationAddress: "",
                          organizationEmail: "",
                          supervisorName: "",
                          supervisorPosition: "",
                          supervisorContact: "",
                          internshipStartDate: "",
                          internshipEndDate: "",
                          departmentRole: "",
                        })
                      }
                    >
                      Reset Form
                    </Button>
                    <Button type="submit" disabled={isSubmittingPlacement} className="min-w-[150px]">
                      {isSubmittingPlacement ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Register Placement
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Existing Placements */}
            {placements.length > 0 && (
              <Card className="border-muted shadow-sm">
                <CardHeader className="bg-muted/30 border-b">
                  <CardTitle className="text-base">My Placements ({placements.length})</CardTitle>
                  <CardDescription>Track your registered placements.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {placements.map((placement) => {
                      const status = statusConfig[placement.status] || statusConfig.pending;
                      const StatusIcon = status.icon;
                      return (
                        <div key={placement.id} className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border bg-card hover:bg-muted/10 transition-colors shadow-sm">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline" className={status.color}>
                                <StatusIcon className="h-3 w-3 mr-1.5" />
                                {status.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground ml-auto hidden md:inline-block">
                                {new Date(placement.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <h4 className="font-semibold text-base mb-1">{placement.organizationName}</h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5" /> {placement.organizationEmail}
                            </p>
                          </div>
                          <div className="flex items-center justify-end border-t md:border-t-0 pt-3 md:pt-0 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPlacement(placement)}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

      {/* General Request Detail Dialog */}
      <Dialog open={!!selectedGeneralRequest} onOpenChange={() => setSelectedGeneralRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedGeneralRequest && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between mb-2">
                  <DialogTitle>General Request Details</DialogTitle>
                  <Badge variant="outline" className={statusConfig[selectedGeneralRequest.status]?.color || ""}>
                    {statusConfig[selectedGeneralRequest.status]?.label || selectedGeneralRequest.status}
                  </Badge>
                </div>
                <DialogDescription>
                  Submitted on {new Date(selectedGeneralRequest.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {selectedGeneralRequest.internshipStartDate && (
                  <div className="bg-muted/20 p-4 rounded-lg border">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground block text-xs">Start Date</span>
                        <span className="font-medium">{new Date(selectedGeneralRequest.internshipStartDate as string).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs">End Date</span>
                        <span className="font-medium">{new Date(selectedGeneralRequest.internshipEndDate as string).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                )}
                {selectedGeneralRequest.adminNotes && (
                  <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg">
                    <h3 className="font-semibold flex items-center gap-2 text-amber-800 mb-2">
                      <AlertCircle className="h-4 w-4" />
                      Admin Notes
                    </h3>
                    <p className="text-sm text-amber-900 whitespace-pre-wrap">{selectedGeneralRequest.adminNotes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Placement Detail Dialog */}
      <Dialog open={!!selectedPlacement} onOpenChange={() => setSelectedPlacement(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedPlacement && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between mb-2">
                  <DialogTitle>Placement Details</DialogTitle>
                  <Badge variant="outline" className={statusConfig[selectedPlacement.status]?.color || ""}>
                    {statusConfig[selectedPlacement.status]?.label || selectedPlacement.status}
                  </Badge>
                </div>
                <DialogDescription>
                  Registered on {new Date(selectedPlacement.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2 text-muted-foreground border-b pb-1">
                      <Building2 className="h-4 w-4" /> Organization
                    </h3>
                    <div className="text-sm space-y-1.5 pl-1">
                      <p className="font-medium text-base">{selectedPlacement.organizationName}</p>
                      <p className="text-muted-foreground flex items-center gap-2"><Mail className="h-3 w-3" /> {selectedPlacement.organizationEmail}</p>
                      {selectedPlacement.organizationAddress && <p className="text-muted-foreground">{selectedPlacement.organizationAddress}</p>}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2 text-muted-foreground border-b pb-1">
                      <UserIcon className="h-4 w-4" /> Supervisor
                    </h3>
                    <div className="text-sm space-y-1.5 pl-1">
                      <p className="font-medium">{selectedPlacement.supervisorName}</p>
                      {selectedPlacement.supervisorPosition && <p className="text-muted-foreground text-xs">{selectedPlacement.supervisorPosition}</p>}
                      {selectedPlacement.supervisorContact && <p className="text-muted-foreground">{selectedPlacement.supervisorContact}</p>}
                    </div>
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg border">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    {selectedPlacement.departmentRole && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground block text-xs">Department/Role</span>
                        <span className="font-medium">{selectedPlacement.departmentRole}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground block text-xs">Start Date</span>
                      <span className="font-medium">
                        {selectedPlacement.internshipStartDate ? new Date(selectedPlacement.internshipStartDate).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">End Date</span>
                      <span className="font-medium">
                        {selectedPlacement.internshipEndDate ? new Date(selectedPlacement.internshipEndDate as string).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedPlacement.status === "approved" && selectedPlacement.referenceNumber && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-sm">Reference Number:</span>
                        <code className="ml-2 px-2 py-1 bg-background rounded font-mono text-xs border border-primary/20">
                          {selectedPlacement.referenceNumber}
                        </code>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedPlacement.referenceNumber!);
                          setCopiedCode(selectedPlacement.referenceNumber!);
                          setTimeout(() => setCopiedCode(null), 2000);
                          toast.success("Reference number copied!");
                        }}
                      >
                        {copiedCode === selectedPlacement.referenceNumber ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getOrdinalSuffix(num: number | string | undefined) {
  if (!num) return "";
  const n = typeof num === "string" ? parseInt(num) : num;
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}
