"use client";

import React, { useState, useEffect } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { lettersApi } from "@/lib/api";
import type { LetterRequest, LetterRequestFormData } from "@/types";
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
  AlertCircle,
  Loader2,
  Plus,
  Eye,
  Download,
  Copy,
  Check,
  Bell,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const statusConfig = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
};

export default function LetterRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LetterRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LetterRequest | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [formData, setFormData] = useState<LetterRequestFormData>({
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    internshipDuration: "",
    internshipStartDate: "",
    internshipEndDate: "",
    purpose: "",
    category: "",
    additionalNotes: "",
  });

  useEffect(() => {
    loadRequests();
  }, []);

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await lettersApi.createRequest(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Letter request submitted successfully!");
        setFormData({
          companyName: "",
          companyEmail: "",
          companyPhone: "",
          companyAddress: "",
          internshipDuration: "",
          internshipStartDate: "",
          internshipEndDate: "",
          purpose: "",
          category: "",
          additionalNotes: "",
        });
        loadRequests();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const rejectedRequests = requests.filter((r) => r.status === "rejected");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Internship Letter Requests
        </h1>
        <p className="text-muted-foreground">
          Request official internship letters for your applications
        </p>
      </div>

      <Tabs defaultValue="new" className="space-y-6">
        <TabsList>
          <TabsTrigger value="new">
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </TabsTrigger>
          <TabsTrigger value="all">
            All Requests ({requests.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedRequests.length})
          </TabsTrigger>
        </TabsList>

        {/* New Request Form */}
        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle>Submit Letter Request</CardTitle>
              <CardDescription>
                Fill in the details below to request an official internship letter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Company Information
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="companyName">
                      Company/Organization Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="e.g., Ghana Ports and Harbours Authority"
                      required
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="companyEmail">Company Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="companyEmail"
                          name="companyEmail"
                          type="email"
                          value={formData.companyEmail}
                          onChange={handleChange}
                          placeholder="hr@company.com"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyPhone">Company Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="companyPhone"
                          name="companyPhone"
                          type="tel"
                          value={formData.companyPhone}
                          onChange={handleChange}
                          placeholder="+233 XX XXX XXXX"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">Company Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        id="companyAddress"
                        name="companyAddress"
                        value={formData.companyAddress}
                        onChange={handleChange}
                        placeholder="Company address..."
                        className="pl-10 min-h-[80px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Internship Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Internship Details
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="internshipDuration">
                      Internship Duration <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="internshipDuration"
                      name="internshipDuration"
                      value={formData.internshipDuration}
                      onChange={handleChange}
                      placeholder="e.g., 3 months, 6 months, 1 year"
                      required
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="internshipStartDate">Start Date</Label>
                      <Input
                        id="internshipStartDate"
                        name="internshipStartDate"
                        type="date"
                        value={formData.internshipStartDate}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="internshipEndDate">End Date</Label>
                      <Input
                        id="internshipEndDate"
                        name="internshipEndDate"
                        type="date"
                        value={formData.internshipEndDate}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Purpose and Category */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Purpose & Category
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="purpose">
                      Purpose <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="purpose"
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleChange}
                      placeholder="Describe the purpose of the internship and what you hope to achieve..."
                      className="min-h-[100px]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Internship Category</Label>
                    <Select
                      value={formData.category || ""}
                      onValueChange={(value) => handleSelectChange("category", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="marine-engineering">Marine Engineering</SelectItem>
                        <SelectItem value="nautical-science">Nautical Science</SelectItem>
                        <SelectItem value="port-shipping">Port & Shipping Administration</SelectItem>
                        <SelectItem value="maritime-safety">Maritime Safety & Security</SelectItem>
                        <SelectItem value="electrical-engineering">Electrical/Electronic Engineering</SelectItem>
                        <SelectItem value="computer-science">Computer Science</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additionalNotes">Additional Notes</Label>
                    <Textarea
                      id="additionalNotes"
                      name="additionalNotes"
                      value={formData.additionalNotes}
                      onChange={handleChange}
                      placeholder="Any additional information or special requirements..."
                      className="min-h-[80px]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        companyName: "",
                        companyEmail: "",
                        companyPhone: "",
                        companyAddress: "",
                        internshipDuration: "",
                        internshipStartDate: "",
                        internshipEndDate: "",
                        purpose: "",
                        category: "",
                        additionalNotes: "",
                      });
                    }}
                  >
                    Clear
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
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
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests List */}
        <TabsContent value="all">
          <RequestsList requests={requests} isLoading={isLoading} onView={setSelectedRequest} onRefresh={loadRequests} />
        </TabsContent>

        <TabsContent value="pending">
          <RequestsList requests={pendingRequests} isLoading={isLoading} onView={setSelectedRequest} onRefresh={loadRequests} />
        </TabsContent>

        <TabsContent value="approved">
          <RequestsList requests={approvedRequests} isLoading={isLoading} onView={setSelectedRequest} onRefresh={loadRequests} />
        </TabsContent>

        <TabsContent value="rejected">
          <RequestsList requests={rejectedRequests} isLoading={isLoading} onView={setSelectedRequest} onRefresh={loadRequests} />
        </TabsContent>
      </Tabs>

      {/* Request Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>Letter Request Details</DialogTitle>
                  <Badge variant="outline" className={statusConfig[selectedRequest.status].color}>
                    {statusConfig[selectedRequest.status].label}
                  </Badge>
                </div>
                <DialogDescription>
                  Submitted on {new Date(selectedRequest.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
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
                      <p><span className="font-medium">Start Date:</span> {new Date(selectedRequest.internshipStartDate).toLocaleDateString()}</p>
                    )}
                    {selectedRequest.internshipEndDate && (
                      <p><span className="font-medium">End Date:</span> {new Date(selectedRequest.internshipEndDate).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>

                {/* Purpose */}
                <div>
                  <h3 className="font-semibold mb-3">Purpose</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedRequest.purpose}</p>
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
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedRequest.additionalNotes}</p>
                  </div>
                )}

                {/* Reference Number & Verification Code */}
                {(selectedRequest.referenceNumber || selectedRequest.verificationCode) && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Document Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      {selectedRequest.referenceNumber && (
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">Reference Number:</span>
                            <code className="ml-2 px-2 py-1 bg-background rounded font-mono text-xs">
                              {selectedRequest.referenceNumber}
                            </code>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedRequest.referenceNumber);
                              setCopiedCode(selectedRequest.referenceNumber);
                              setTimeout(() => setCopiedCode(null), 2000);
                              toast.success("Reference number copied!");
                            }}
                          >
                            {copiedCode === selectedRequest.referenceNumber ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                      {selectedRequest.verificationCode && (
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">Verification Code:</span>
                            <code className="ml-2 px-2 py-1 bg-background rounded font-mono text-xs">
                              {selectedRequest.verificationCode}
                            </code>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedRequest.verificationCode!);
                              setCopiedCode(selectedRequest.verificationCode!);
                              setTimeout(() => setCopiedCode(null), 2000);
                              toast.success("Verification code copied!");
                            }}
                          >
                            {copiedCode === selectedRequest.verificationCode ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Use these codes to verify the authenticity of this document.
                      </p>
                    </div>
                  </div>
                )}

                {/* PDF Download Section */}
                {selectedRequest.status === "approved" && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2 flex items-center gap-2 text-green-800">
                          <CheckCircle2 className="h-5 w-5" />
                          Letter Ready for Download
                        </h3>
                        <p className="text-sm text-green-700 mb-3">
                          Your internship letter has been approved and is ready for download.
                        </p>
                        {selectedRequest.downloadCount !== undefined && selectedRequest.downloadCount > 0 && (
                          <p className="text-xs text-green-600">
                            Downloaded {selectedRequest.downloadCount} time{selectedRequest.downloadCount !== 1 ? "s" : ""}
                            {selectedRequest.lastDownloadedAt && (
                              <> • Last downloaded: {new Date(selectedRequest.lastDownloadedAt).toLocaleDateString()}</>
                            )}
                          </p>
                        )}
                        {selectedRequest.emailSent && (
                          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            Email notification sent
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={async () => {
                          if (!selectedRequest.id) return;
                          setIsDownloading(selectedRequest.id);
                          try {
                            const html = await lettersApi.downloadLetterPDF(selectedRequest.id);
                            // Open in new window for printing
                            const printWindow = window.open("", "_blank");
                            if (printWindow) {
                              printWindow.document.write(html);
                              printWindow.document.close();
                              printWindow.onload = () => {
                                printWindow.print();
                              };
                            }
                            toast.success("Letter opened for download/printing");
                            loadRequests(); // Refresh to update download count
                          } catch (error: any) {
                            toast.error(error.message || "Failed to download letter");
                          } finally {
                            setIsDownloading(null);
                          }
                        }}
                        disabled={isDownloading === selectedRequest.id}
                        className="flex-1"
                      >
                        {isDownloading === selectedRequest.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            Download / Print PDF
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {selectedRequest.adminNotes && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Admin Notes
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedRequest.adminNotes}</p>
                  </div>
                )}

                {selectedRequest.reviewedAt && (
                  <div className="text-xs text-muted-foreground">
                    Reviewed on {new Date(selectedRequest.reviewedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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

function RequestsList({ 
  requests, 
  isLoading, 
  onView,
  onRefresh
}: { 
  requests: LetterRequest[]; 
  isLoading: boolean;
  onView: (request: LetterRequest) => void;
  onRefresh?: () => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="mb-2 text-lg font-medium">No requests found</h3>
          <p className="text-muted-foreground">
            You haven't submitted any letter requests yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const status = statusConfig[request.status];
        const StatusIcon = status.icon;
        const isApproved = request.status === "approved";
        const hasNewPDF = isApproved && request.pdfUrl && !request.emailSent;

        return (
          <Card 
            key={request.id} 
            className={`hover:shadow-md transition-shadow ${
              hasNewPDF ? "border-green-300 bg-green-50/50" : ""
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{request.companyName}</h3>
                    <Badge variant="outline" className={status.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                    {hasNewPDF && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                        <Bell className="h-3 w-3 mr-1" />
                        PDF Ready
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {request.referenceNumber && (
                      <p>
                        <span className="font-medium">Ref:</span>{" "}
                        <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                          {request.referenceNumber}
                        </code>
                      </p>
                    )}
                    <p><span className="font-medium">Duration:</span> {request.internshipDuration}</p>
                    <p><span className="font-medium">Purpose:</span> {request.purpose.substring(0, 100)}
                      {request.purpose.length > 100 ? "..." : ""}</p>
                    {isApproved && request.downloadCount !== undefined && request.downloadCount > 0 && (
                      <p className="text-xs">
                        <span className="font-medium">Downloads:</span> {request.downloadCount}
                      </p>
                    )}
                    <p className="text-xs mt-2">
                      Submitted: {new Date(request.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {isApproved && (
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          const html = await lettersApi.downloadLetterPDF(request.id);
                          const printWindow = window.open("", "_blank");
                          if (printWindow) {
                            printWindow.document.write(html);
                            printWindow.document.close();
                            printWindow.onload = () => {
                              printWindow.print();
                            };
                          }
                          toast.success("Letter opened for download/printing");
                          onRefresh?.(); // Refresh to update download count
                        } catch (error: any) {
                          toast.error(error.message || "Failed to download letter");
                        }
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => onView(request)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

