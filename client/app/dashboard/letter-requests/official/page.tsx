"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { placementsApi, lettersApi } from "@/lib/api";
import type { InternshipPlacement, LetterRequest } from "@/types";
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Plus,
  Copy,
  Check,
  Building2,
  ArrowLeft,
  Briefcase,
  Mail,
  User,
  Info,
  Lock,
} from "lucide-react";
import {
  formatPlacementLockDate,
  getPlacementFormLockState,
} from "@/lib/placement-form-lock";
import {
  internshipEndDateMin,
  todayInputDateMin,
  validateInternshipDateRange,
} from "@/lib/internship-date-validation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

const statusConfig = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
  modification_requested: { label: "Modifications Requested", color: "bg-blue-100 text-blue-800 border-blue-200", icon: AlertCircle },
};

export default function OfficialPlacementsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [placements, setPlacements] = useState<InternshipPlacement[]>([]);
  const [approvedGeneralRequests, setApprovedGeneralRequests] = useState<any[]>([]);
  const [hasApprovedGeneral, setHasApprovedGeneral] = useState<boolean | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<InternshipPlacement | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("new");

  const [formData, setFormData] = useState({
    generalRequestId: "",
    organizationName: "",
    organizationAddress: "",
    organizationEmail: "",
    supervisorName: "",
    supervisorEmail: "",
    supervisorPosition: "",
    supervisorContact: "",
    internshipStartDate: "",
    internshipEndDate: "",
    departmentRole: "",
  });

  const formLock = useMemo(() => getPlacementFormLockState(placements), [placements]);
  const minStartDate = todayInputDateMin();
  const minEndDate = internshipEndDateMin(formData.internshipStartDate);

  useEffect(() => {
    checkPrerequisitesAndLoadData();
  }, []);

  useEffect(() => {
    if (formLock.locked && activeTab === "new") {
      setActiveTab("history");
    }
  }, [formLock.locked, activeTab]);

  const checkPrerequisitesAndLoadData = async () => {
    setIsLoading(true);
    try {
      // 1. Check if they have an approved Stage 1 request
      const generalStatus = await lettersApi.checkGeneralApproval();
      
      if (generalStatus.data) {
        setHasApprovedGeneral(generalStatus.data.hasApprovedGeneral);
        setApprovedGeneralRequests(generalStatus.data.approvedRequests || []);
        
        // Auto-select the general request if there's only one
        if (generalStatus.data.approvedRequests?.length === 1) {
          setFormData(prev => ({
            ...prev,
            generalRequestId: generalStatus.data.approvedRequests[0].id
          }));
        }
      }

      // 2. Load their existing placements
      const result = await placementsApi.getAll();
      if (result.data) {
        setPlacements(result.data.placements || []);
        
        // If they have existing placements, default to history tab
        if (result.data.placements?.length > 0) {
          setActiveTab("history");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "internshipStartDate" && next.internshipEndDate) {
        const endMin = internshipEndDateMin(value);
        if (next.internshipEndDate < endMin) {
          next.internshipEndDate = "";
        }
      }
      return next;
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formLock.locked) {
      toast.error("Official placement registration is locked for your current internship.");
      return;
    }
    if (!formData.generalRequestId) {
      toast.error("Please select an approved general request to link this placement to.");
      return;
    }

    const dateError = validateInternshipDateRange(
      formData.internshipStartDate,
      formData.internshipEndDate
    );
    if (dateError) {
      toast.error(dateError);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await placementsApi.create(formData as any);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Official placement request submitted successfully!");
        setFormData({
          generalRequestId: formData.generalRequestId, // keep the selection
          organizationName: "",
          organizationAddress: "",
          organizationEmail: "",
          supervisorName: "",
          supervisorEmail: "",
          supervisorPosition: "",
          supervisorContact: "",
          internshipStartDate: "",
          internshipEndDate: "",
          departmentRole: "",
        });
        checkPrerequisitesAndLoadData();
        setActiveTab("history");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 cursor-pointer text-muted-foreground hover:text-foreground transition-colors" onClick={() => router.push('/dashboard/letter-requests')}>
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Stage 1</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" />
            Stage 2: Official Placement
          </h1>
          <p className="text-muted-foreground mt-1">
            Register your confirmed internship placement to generate official documents and evaluation forms for the company.
          </p>
        </div>
      </div>

      {hasApprovedGeneral === false ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-5 w-5" />
              Prerequisite Required
            </CardTitle>
            <CardDescription className="text-amber-700/80 mt-2 text-base">
              You must have an <strong>Approved General Letter Request (Stage 1)</strong> before you can register an official placement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-900 mb-6">
              The official placement process is strictly for registering an internship with a specific company <span className="underline font-semibold">after</span> you have utilized your general introduction letter to secure a spot.
            </p>
            <Button onClick={() => router.push('/dashboard/letter-requests')} className="bg-amber-600 hover:bg-amber-700 text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to Stage 1: General Requests
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 w-full justify-start overflow-x-auto">
            <TabsTrigger
              value="new"
              className="data-[state=active]:bg-background"
              disabled={formLock.locked}
            >
              {formLock.locked ? (
                <Lock className="mr-2 h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Register Placement
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-background">
              <Briefcase className="mr-2 h-4 w-4" />
              My Placements ({placements.length})
            </TabsTrigger>
          </TabsList>

          {/* New Request Form */}
          <TabsContent value="new" className="mt-0">
            {formLock.locked ? (
              <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
                    <Lock className="h-5 w-5" />
                    Registration locked
                  </CardTitle>
                  <CardDescription className="text-amber-800/90 dark:text-amber-200/80">
                    {formLock.reason === "pending_review"
                      ? "You have a placement request awaiting HOD or Secretary review. You cannot register another until it is approved or rejected."
                      : formLock.reason === "modification_requested"
                        ? "Your placement needs changes from staff review. Resolve that request before registering another official placement."
                        : "Your official placement was approved by HOD or Secretary. Registration is locked while this placement is active."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formLock.placement && (
                    <div className="rounded-xl border border-amber-200/80 bg-background/80 p-4 text-sm dark:border-amber-800">
                      <p className="font-semibold text-foreground">
                        {formLock.placement.organizationName}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        {formLock.placement.departmentRole || "Internship placement"}
                      </p>
                      {formLock.placement.internshipStartDate && formLock.placement.internshipEndDate && (
                        <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatPlacementLockDate(formLock.placement.internshipStartDate)} –{" "}
                          {formatPlacementLockDate(formLock.placement.internshipEndDate)}
                        </p>
                      )}
                    </div>
                  )}
                  {formLock.reason === "approved_active" && formLock.unlockAfter && (
                    <p className="text-sm text-amber-900 dark:text-amber-100">
                      You can register a new placement after your internship ends on{" "}
                      <strong>{formatPlacementLockDate(formLock.unlockAfter)}</strong>.
                    </p>
                  )}
                  <Button variant="outline" onClick={() => setActiveTab("history")}>
                    View my placements
                  </Button>
                </CardContent>
              </Card>
            ) : (
            <Card className="border-muted shadow-sm">
              <CardHeader className="bg-muted/30 border-b pb-4">
                <CardTitle>Register Official Internship Placement</CardTitle>
                <CardDescription>
                  Provide the exact details of the organization where you will be doing your internship.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-8">
                  
                  {/* Link to Stage 1 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Link to Approved Request
                    </h3>

                    <div className="space-y-2">
                      <Label htmlFor="generalRequestId">
                        Select Approved General Request <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.generalRequestId}
                        onValueChange={(value) => handleSelectChange("generalRequestId", value)}
                        required
                      >
                        <SelectTrigger className="w-full md:w-[400px]">
                          <SelectValue placeholder="Select a request..." />
                        </SelectTrigger>
                        <SelectContent>
                          {approvedGeneralRequests.map((req) => (
                            <SelectItem key={req.id} value={req.id}>
                              Valid for: {req.internshipDuration} (Ref: {req.referenceNumber || 'N/A'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs mt-1 text-blue-600 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                         This links your placement to your initial application context.
                      </p>
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
                        <Label htmlFor="organizationName">
                          Organization Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="organizationName"
                          name="organizationName"
                          value={formData.organizationName}
                          onChange={handleChange}
                          placeholder="e.g., Ghana Ports and Harbours Authority"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="organizationEmail">
                          Official Contact Email <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="organizationEmail"
                          name="organizationEmail"
                          type="email"
                          value={formData.organizationEmail}
                          onChange={handleChange}
                          placeholder="hr@company.com"
                          required
                        />
                        <p className="text-xs text-amber-600 mt-1 font-medium">⚠️ Critical: The official letter & eval form will be emailed here.</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="organizationAddress">Physical Address</Label>
                      <Textarea
                        id="organizationAddress"
                        name="organizationAddress"
                        value={formData.organizationAddress}
                        onChange={handleChange}
                        placeholder="Company's physical location..."
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>

                  {/* Supervisor Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                      <User className="h-5 w-5 text-blue-600" />
                      Supervisor / Contact Person Details
                    </h3>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="supervisorName">
                          Supervisor Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="supervisorName"
                          name="supervisorName"
                          value={formData.supervisorName}
                          onChange={handleChange}
                          placeholder="e.g., Mr. John Doe"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supervisorPosition">
                          Supervisor Position/Title
                        </Label>
                        <Input
                          id="supervisorPosition"
                          name="supervisorPosition"
                          value={formData.supervisorPosition}
                          onChange={handleChange}
                          placeholder="e.g., HR Manager or Senior Engineer"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supervisorEmail">
                          Supervisor Email
                        </Label>
                        <Input
                          id="supervisorEmail"
                          name="supervisorEmail"
                          type="email"
                          value={formData.supervisorEmail}
                          onChange={handleChange}
                          placeholder="supervisor@company.com"
                        />
                        <p className="text-xs text-muted-foreground">
                          Used later for Weekly Log Sheet Book acknowledgment links.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="supervisorContact">Supervisor Phone Number</Label>
                      <Input
                        id="supervisorContact"
                        name="supervisorContact"
                        type="tel"
                        value={formData.supervisorContact}
                        onChange={handleChange}
                        placeholder="+233 XX XXX XXXX"
                      />
                    </div>
                  </div>

                  {/* Placement Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                      Actual Placement Details
                    </h3>

                    <div className="space-y-2">
                      <Label htmlFor="departmentRole">
                        Assigned Department / Role
                      </Label>
                      <Input
                        id="departmentRole"
                        name="departmentRole"
                        value={formData.departmentRole}
                        onChange={handleChange}
                        placeholder="e.g., IT Support Intern, Electrical Division"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="internshipStartDate">Confirmed Start Date <span className="text-destructive">*</span></Label>
                        <Input
                          id="internshipStartDate"
                          name="internshipStartDate"
                          type="date"
                          value={formData.internshipStartDate}
                          onChange={handleChange}
                          min={minStartDate}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Must be today or a future date.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="internshipEndDate">Confirmed End Date <span className="text-destructive">*</span></Label>
                        <Input
                          id="internshipEndDate"
                          name="internshipEndDate"
                          type="date"
                          value={formData.internshipEndDate}
                          onChange={handleChange}
                          min={minEndDate}
                          required
                          disabled={!formData.internshipStartDate}
                        />
                        <p className="text-xs text-muted-foreground">
                          {formData.internshipStartDate
                            ? "Must be on or after the start date and not in the past."
                            : "Select a start date first."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setFormData({
                          generalRequestId: formData.generalRequestId,
                          organizationName: "",
                          organizationAddress: "",
                          organizationEmail: "",
                          supervisorName: "",
                          supervisorEmail: "",
                          supervisorPosition: "",
                          supervisorContact: "",
                          internshipStartDate: "",
                          internshipEndDate: "",
                          departmentRole: "",
                        });
                      }}
                    >
                      Reset Form
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
                      {isSubmitting ? (
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
          </TabsContent>

          {/* Requests History */}
          <TabsContent value="history" className="mt-0">
            <Card className="border-muted shadow-sm">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle>My Placements</CardTitle>
                <CardDescription>
                  Track your official placements and send required documents to companies.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <PlacementsList 
                  placements={placements} 
                  onView={setSelectedPlacement} 
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedPlacement} onOpenChange={() => setSelectedPlacement(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedPlacement && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between mb-2">
                  <DialogTitle>Placement Details</DialogTitle>
                  <Badge variant="outline" className={statusConfig[selectedPlacement.status].color}>
                    {statusConfig[selectedPlacement.status].label}
                  </Badge>
                </div>
                <DialogDescription>
                  Registered on {new Date(selectedPlacement.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                
                {/* Admin Status Header */}
                {selectedPlacement.status === 'approved' && !selectedPlacement.emailSent && (
                  <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Placement approved
                    </h4>
                    <p className="text-sm">
                      Your official placement has been approved. The university will send the official letter and evaluation form to <strong>{selectedPlacement.organizationEmail}</strong> when processing is complete.
                    </p>

                  </div>
                )}

                {selectedPlacement.status === 'approved' && selectedPlacement.emailSent && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2 mb-1">
                      <Mail className="h-5 w-5" />
                      Documents Sent to Organization
                    </h4>
                    <p className="text-sm">
                      The official university letter and evaluation link were successfully sent to {selectedPlacement.organizationEmail}.
                    </p>
                    {selectedPlacement.lastEmailSentAt && (
                      <p className="text-xs mt-2 text-blue-700/70">
                        Date Sent: {new Date(selectedPlacement.lastEmailSentAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {selectedPlacement.status === 'modification_requested' && selectedPlacement.adminNotes && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5" />
                      Modifications Required
                    </h4>
                    <p className="text-sm whitespace-pre-wrap">{selectedPlacement.adminNotes}</p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Organization Info */}
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2 text-muted-foreground border-b pb-1">
                      <Building2 className="h-4 w-4" />
                      Organization
                    </h3>
                    <div className="text-sm space-y-1.5 pl-1">
                      <p className="font-medium text-base">{selectedPlacement.organizationName}</p>
                      <p className="text-muted-foreground flex items-center gap-2"><Mail className="h-3 w-3" /> {selectedPlacement.organizationEmail}</p>
                      {selectedPlacement.organizationAddress && <p className="text-muted-foreground mt-2">{selectedPlacement.organizationAddress}</p>}
                    </div>
                  </div>

                  {/* Supervisor Info */}
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2 text-muted-foreground border-b pb-1">
                      <User className="h-4 w-4" />
                      Supervisor
                    </h3>
                    <div className="text-sm space-y-1.5 pl-1">
                      <p className="font-medium">{selectedPlacement.supervisorName}</p>
                      {selectedPlacement.supervisorPosition && <p className="text-muted-foreground text-xs">{selectedPlacement.supervisorPosition}</p>}
                      {selectedPlacement.supervisorContact && <p className="text-muted-foreground">{selectedPlacement.supervisorContact}</p>}
                    </div>
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg border">
                  <h3 className="font-semibold flex items-center gap-2 mb-3 text-sm text-foreground">
                    <Briefcase className="h-4 w-4" />
                    Internship Assignment
                  </h3>
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
                        {selectedPlacement.internshipStartDate ? new Date(selectedPlacement.internshipStartDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">End Date</span>
                      <span className="font-medium">
                        {selectedPlacement.internshipEndDate ? new Date(selectedPlacement.internshipEndDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Document Information (If approved) */}
                {selectedPlacement.status === 'approved' && selectedPlacement.referenceNumber && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <h3 className="font-semibold flex items-center gap-2 mb-3 text-sm">
                      <FileText className="h-4 w-4" />
                      Document Tracking ID
                    </h3>
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

function PlacementsList({
  placements,
  onView,
}: {
  placements: InternshipPlacement[];
  onView: (placement: InternshipPlacement) => void;
}) {

  if (placements.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
        <Briefcase className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
        <h3 className="mb-2 text-lg font-medium text-foreground">No placements found</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          You haven't registered any official placements yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {placements.map((placement) => {
        const status = statusConfig[placement.status];
        const StatusIcon = status.icon;

        return (
          <div key={placement.id} className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border bg-card hover:bg-muted/10 transition-colors shadow-sm">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className={status.color}>
                  <StatusIcon className="h-3 w-3 mr-1.5 text-current" />
                  {status.label}
                </Badge>
                {placement.status === 'approved' && placement.emailSent && (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Check className="h-3 w-3 mr-1" />
                    Emails Sent
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground ml-auto hidden md:inline-block">
                  {new Date(placement.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h4 className="font-semibold text-base mb-1">
                {placement.organizationName}
              </h4>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-2">
                <Mail className="h-3.5 w-3.5" /> {placement.organizationEmail}
              </p>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> 
                  <span className="truncate max-w-[150px]">{placement.supervisorName}</span>
                </span>
                {placement.internshipStartDate && placement.internshipEndDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> 
                    {new Date(placement.internshipStartDate).toLocaleDateString(undefined, {month:'short', year:'numeric'})} - {new Date(placement.internshipEndDate).toLocaleDateString(undefined, {month:'short', year:'numeric'})}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-end border-t md:border-t-0 pt-3 md:pt-0 shrink-0">
              <Button variant="outline" size="sm" onClick={() => onView(placement)}>
                'View Details'
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
