"use client";

import React, { useState, useEffect } from "react";
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
import { lettersApi } from "@/lib/api";
import type { LetterRequest } from "@/types";
import {
  FileText,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  Search,
  Filter,
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
  pending: { label: "Pending", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
};

export default function AdminLetterRequestsPage() {
  const [requests, setRequests] = useState<LetterRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LetterRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LetterRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    let filtered = requests;

    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.student?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.student?.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  }, [requests, statusFilter, searchQuery]);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const result = await lettersApi.getRequests();
      if (result.data) {
        setRequests(result.data.requests || []);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (status: "approved" | "rejected") => {
    if (!selectedRequest) return;

    setIsUpdating(true);
    try {
      const sendEmail = (document.getElementById("sendEmail") as HTMLInputElement)?.checked ?? true;
      const result = await lettersApi.updateRequestStatus(
        selectedRequest.id,
        status,
        adminNotes || undefined,
        sendEmail
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Request ${status} successfully${status === "approved" ? " - PDF generated" : ""}`);
        setSelectedRequest(null);
        setAdminNotes("");
        loadRequests();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update request");
    } finally {
      setIsUpdating(false);
    }
  };

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Letter Request Management
        </h1>
        <p className="text-muted-foreground">
          Review and manage internship letter requests from students
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Requests</p>
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
              <p className="text-sm text-muted-foreground">Pending</p>
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
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.rejected}</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
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
                placeholder="Search by company or student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-medium">No requests found</h3>
            <p className="text-muted-foreground">
              {requests.length === 0
                ? "No letter requests have been submitted yet."
                : "No requests match your current filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const status = statusConfig[request.status];
            const StatusIcon = status.icon;

            return (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{request.companyName}</h3>
                        <Badge variant="outline" className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground mb-3">
                        <p>
                          <span className="font-medium">Student:</span> {request.student?.firstName}{" "}
                          {request.student?.lastName} ({request.student?.studentId})
                        </p>
                        <p>
                          <span className="font-medium">Duration:</span> {request.internshipDuration}
                        </p>
                        <p>
                          <span className="font-medium">Purpose:</span>{" "}
                          {request.purpose.substring(0, 100)}
                          {request.purpose.length > 100 ? "..." : ""}
                        </p>
                        <p className="text-xs mt-2">
                          Submitted: {new Date(request.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>Review Letter Request</DialogTitle>
                  <Badge variant="outline" className={statusConfig[selectedRequest.status].color}>
                    {statusConfig[selectedRequest.status].label}
                  </Badge>
                </div>
                <DialogDescription>
                  Request from {selectedRequest.student?.firstName}{" "}
                  {selectedRequest.student?.lastName} - Submitted on{" "}
                  {new Date(selectedRequest.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Student Info */}
                <div>
                  <h3 className="font-semibold mb-3">Student Information</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Name:</span> {selectedRequest.student?.firstName}{" "}
                      {selectedRequest.student?.lastName}
                    </p>
                    <p>
                      <span className="font-medium">Student ID:</span> {selectedRequest.student?.studentId}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span> {selectedRequest.student?.email}
                    </p>
                    <p>
                      <span className="font-medium">Program:</span> {selectedRequest.student?.program}
                    </p>
                    <p>
                      <span className="font-medium">Department:</span> {selectedRequest.student?.department}
                    </p>
                  </div>
                </div>

                {/* Company Info */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Company Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedRequest.companyName}</p>
                    {selectedRequest.companyEmail && (
                      <p><span className="font-medium">Email:</span> {selectedRequest.companyEmail}</p>
                    )}
                    {selectedRequest.companyPhone && (
                      <p><span className="font-medium">Phone:</span> {selectedRequest.companyPhone}</p>
                    )}
                    {selectedRequest.companyAddress && (
                      <p><span className="font-medium">Address:</span> {selectedRequest.companyAddress}</p>
                    )}
                  </div>
                </div>

                {/* Internship Details */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Internship Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Duration:</span> {selectedRequest.internshipDuration}</p>
                    {selectedRequest.internshipStartDate && (
                      <p>
                        <span className="font-medium">Start Date:</span>{" "}
                        {new Date(selectedRequest.internshipStartDate).toLocaleDateString()}
                      </p>
                    )}
                    {selectedRequest.internshipEndDate && (
                      <p>
                        <span className="font-medium">End Date:</span>{" "}
                        {new Date(selectedRequest.internshipEndDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Purpose */}
                <div>
                  <h3 className="font-semibold mb-3">Purpose</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedRequest.purpose}
                  </p>
                </div>

                {selectedRequest.category && (
                  <div>
                    <h3 className="font-semibold mb-3">Category</h3>
                    <Badge variant="secondary">{selectedRequest.category}</Badge>
                  </div>
                )}

                {selectedRequest.additionalNotes && (
                  <div>
                    <h3 className="font-semibold mb-3">Additional Notes</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedRequest.additionalNotes}
                    </p>
                  </div>
                )}

                {selectedRequest.adminNotes && (
                  <div>
                    <h3 className="font-semibold mb-3">Previous Admin Notes</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedRequest.adminNotes}
                    </p>
                  </div>
                )}

                {/* Reference Number & Verification Code */}
                {(selectedRequest.referenceNumber || selectedRequest.verificationCode) && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <h3 className="font-semibold mb-3">Document Information</h3>
                    <div className="space-y-2 text-sm">
                      {selectedRequest.referenceNumber && (
                        <p>
                          <span className="font-medium">Reference Number:</span>{" "}
                          <code className="px-2 py-1 bg-background rounded font-mono text-xs">
                            {selectedRequest.referenceNumber}
                          </code>
                        </p>
                      )}
                      {selectedRequest.verificationCode && (
                        <p>
                          <span className="font-medium">Verification Code:</span>{" "}
                          <code className="px-2 py-1 bg-background rounded font-mono text-xs">
                            {selectedRequest.verificationCode}
                          </code>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* PDF Status */}
                {selectedRequest.status === "approved" && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <h3 className="font-semibold mb-2 text-green-800">PDF Status</h3>
                    <div className="space-y-2 text-sm">
                      {selectedRequest.pdfUrl ? (
                        <>
                          <p className="text-green-700">
                            <CheckCircle2 className="inline h-4 w-4 mr-1" />
                            PDF generated successfully
                          </p>
                          {selectedRequest.pdfGeneratedAt && (
                            <p className="text-xs text-green-600">
                              Generated: {new Date(selectedRequest.pdfGeneratedAt).toLocaleDateString()}
                            </p>
                          )}
                          {selectedRequest.downloadCount !== undefined && (
                            <p className="text-xs text-green-600">
                              Downloaded {selectedRequest.downloadCount} time{selectedRequest.downloadCount !== 1 ? "s" : ""}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-amber-700">
                          <AlertCircle className="inline h-4 w-4 mr-1" />
                          PDF generation pending
                        </p>
                      )}
                      {selectedRequest.emailSent ? (
                        <p className="text-xs text-green-600">
                          <Mail className="inline h-3 w-3 mr-1" />
                          Email notification sent
                          {selectedRequest.emailSentAt && (
                            <> on {new Date(selectedRequest.emailSentAt).toLocaleDateString()}</>
                          )}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Email notification not sent
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                {selectedRequest.status === "pending" && (
                  <div>
                    <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                    <Textarea
                      id="adminNotes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add any notes or feedback for the student..."
                      className="mt-2 min-h-[100px]"
                    />
                  </div>
                )}

                {/* Email Notification Option */}
                {selectedRequest.status === "pending" && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="sendEmail"
                      defaultChecked={true}
                      className="rounded"
                    />
                    <Label htmlFor="sendEmail" className="text-sm font-normal cursor-pointer">
                      Send email notification when approved
                    </Label>
                  </div>
                )}
              </div>

              <DialogFooter>
                {selectedRequest.status === "pending" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedRequest(null);
                        setAdminNotes("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        const sendEmail = (document.getElementById("sendEmail") as HTMLInputElement)?.checked ?? true;
                        handleUpdateStatus("rejected");
                      }}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        const sendEmail = (document.getElementById("sendEmail") as HTMLInputElement)?.checked ?? true;
                        handleUpdateStatus("approved");
                      }}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Approve & Generate PDF
                        </>
                      )}
                    </Button>
                  </>
                )}
                {selectedRequest.status !== "pending" && (
                  <Button onClick={() => setSelectedRequest(null)}>Close</Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

