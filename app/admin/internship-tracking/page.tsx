"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
  Filter,
  Check,
  Send,
  MoreVertical,
  MapPin
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const statusConfig = {
  pending: { label: "Pending Review", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
  modification_requested: { label: "Modifications Requested", color: "bg-blue-100 text-blue-800 border-blue-200", icon: AlertCircle },
};

export default function InternshipTrackingPage() {
  const [placements, setPlacements] = useState<InternshipPlacement[]>([]);
  const [filteredPlacements, setFilteredPlacements] = useState<InternshipPlacement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlacement, setSelectedPlacement] = useState<InternshipPlacement | null>(null);
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [emailFilter, setEmailFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [adminNotes, setAdminNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState<string | null>(null);

  useEffect(() => {
    loadPlacements();
  }, []);

  useEffect(() => {
    let filtered = placements;

    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }
    
    if (emailFilter !== "all") {
      filtered = filtered.filter((p) => {
        if (emailFilter === "sent") return p.emailSent === true;
        if (emailFilter === "pending") return p.emailSent === false && p.status === 'approved';
        return true;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.organizationName.toLowerCase().includes(q) ||
          p.student?.firstName?.toLowerCase().includes(q) ||
          p.student?.lastName?.toLowerCase().includes(q) ||
          p.student?.studentId?.toLowerCase().includes(q) ||
          (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q))
      );
    }

    setFilteredPlacements(filtered);
  }, [placements, statusFilter, emailFilter, searchQuery]);

  const loadPlacements = async () => {
    setIsLoading(true);
    try {
      const result = await placementsApi.getTrackingData();
      if (result.data) {
        setPlacements(result.data.trackingData || []);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load placements");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (status: InternshipPlacement['status']) => {
    if (!selectedPlacement) return;
    
    if (status === 'modification_requested' && !adminNotes) {
      toast.error("Notes are required when requesting modifications.");
      return;
    }

    setIsUpdating(true);
    try {
      const result = await placementsApi.updateStatus(
        selectedPlacement.id,
        status,
        adminNotes || undefined
      );
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Placement ${status.replace('_', ' ')} successfully`);
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

  const stats = {
    total: placements.length,
    pending: placements.filter((p) => p.status === "pending").length,
    approved: placements.filter((p) => p.status === "approved").length,
    emailsSent: placements.filter((p) => p.emailSent).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl flex items-center gap-2">
          <Briefcase className="h-7 w-7 text-primary" />
          Stage 2: Official Internship Tracking
        </h1>
        <p className="text-muted-foreground mt-1">
          Review, approve, and track official placements representing confirmed internship locations. Upon approval, official letters and unique evaluation tokens are generated.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Placements</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending Review</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.approved}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.emailsSent}</p>
              <p className="text-sm text-muted-foreground">Outbound Emails</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search organization, student name, ID, or Reference Code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="modification_requested">Needs Changes</SelectItem>
                </SelectContent>
              </Select>
              <Select value={emailFilter} onValueChange={setEmailFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Email Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Email Status</SelectItem>
                  <SelectItem value="sent">Email Sent</SelectItem>
                  <SelectItem value="pending">Pending Send</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredPlacements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-medium">No placements found</h3>
            <p className="text-muted-foreground">
              {placements.length === 0
                ? "No official intern placement requests have been submitted by students yet."
                : "No placements match your current search and filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredPlacements.map((placement) => {
            const status = statusConfig[placement.status];
            const StatusIcon = status.icon;

            return (
              <Card key={placement.id} className="hover:border-primary/50 transition-colors border-l-4" style={{ 
                borderLeftColor: placement.status === 'approved' ? (placement.emailSent ? '#3b82f6' : '#22c55e') : 
                                  placement.status === 'pending' ? '#f59e0b' : 
                                  placement.status === 'modification_requested' ? '#6366f1' : '#ef4444' 
              }}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge variant="outline" className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1 text-current" />
                          {status.label}
                        </Badge>
                        {placement.status === 'approved' && (
                           <Badge variant={placement.emailSent ? "secondary" : "destructive"} className={placement.emailSent ? "bg-blue-50 text-blue-700" : ""}>
                             <Mail className="h-3 w-3 mr-1"/>
                             {placement.emailSent ? "Email Sent" : "Pending Send"}
                           </Badge>
                        )}
                        {placement.referenceNumber && (
                          <code className="text-xs font-mono bg-muted/50 px-1.5 py-0.5 rounded border ml-auto md:ml-2">
                             Ref: {placement.referenceNumber}
                          </code>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-base mb-1 truncate max-w-[300px]" title={placement.organizationName}>
                        {placement.organizationName}
                      </h3>
                      
                      <div className="space-y-1 mt-3 text-sm">
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4 shrink-0" />
                          <span className="font-medium text-foreground">{placement.student?.firstName} {placement.student?.lastName}</span>
                          <span className="text-xs">({placement.student?.studentId})</span>
                        </p>
                        <p className="flex items-center gap-2 text-muted-foreground truncate w-full" title={placement.organizationEmail}>
                          <Mail className="h-4 w-4 shrink-0" />
                          {placement.organizationEmail}
                        </p>
                        <p className="flex items-center gap-2 text-muted-foreground truncate w-full">
                          <Briefcase className="h-4 w-4 shrink-0" />
                          {placement.departmentRole || 'General Placement'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 shrink-0 ml-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        onClick={() => setSelectedPlacement(placement)}
                      >
                        <Eye className="mr-1.5 h-4 w-4" />
                        Review
                      </Button>
                      
                      {placement.status === 'approved' && (
                        <Button
                          variant={placement.emailSent ? "outline" : "default"}
                          size="sm"
                          disabled={isSendingEmail === placement.id}
                          onClick={() => handleResendEmail(placement.id)}
                          className={placement.emailSent ? "" : "bg-blue-600 hover:bg-blue-700"}
                        >
                          {isSendingEmail === placement.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="mr-1.5 h-3.5 w-3.5" />
                              {placement.emailSent ? "Resend Email" : "Send Email"}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
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
                  <Badge variant="outline" className={`${statusConfig[selectedPlacement.status].color} text-sm px-3 py-1`}>
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
                          Action Feedback / Notes
                          <span className="text-xs font-normal text-muted-foreground">(Required for modifications, optional for others)</span>
                        </Label>
                        <Textarea
                          id="adminFeedback"
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Provide feedback on why it's rejected, or what needs modification..."
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
                        disabled={isUpdating}
                      >
                        {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                        Reject
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
                        onClick={() => handleUpdateStatus("modification_requested")}
                        disabled={isUpdating || (!adminNotes && selectedPlacement.status !== 'modification_requested')}
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
