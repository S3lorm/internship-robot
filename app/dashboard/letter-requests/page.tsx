"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { lettersApi } from "@/lib/api";
import type { LetterRequest, LetterRequestFormData } from "@/types";
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
  ArrowRight,
  Info,
  User as UserIcon
} from "lucide-react";
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
};

export default function GeneralLetterRequestsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<LetterRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LetterRequest | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    requestType: "general",
    internshipStartDate: "",
    internshipEndDate: "",
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const result = await lettersApi.getRequests();
      if (result.data) {
        // Filter out non-general requests just in case
        const generalRequests = result.data.requests.filter((r: LetterRequest) => r.requestType === 'general' || r.requestType === 'admin');
        setRequests(generalRequests);
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
      const result = await lettersApi.createRequest(formData as any);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Letter request submitted successfully!");
        setFormData({
          requestType: "general",
          internshipStartDate: "",
          internshipEndDate: "",
        });
        loadRequests();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const approvedRequests = requests.filter((r) => r.status === "approved");

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl uppercase">
            General Internship Request
          </h1>
          <p className="text-muted-foreground mt-1">
            Request a general introduction letter to use when searching for internship opportunities.
          </p>
        </div>
        {approvedRequests.length > 0 && (
          <Button onClick={() => router.push('/dashboard/letter-requests/official')} className="shrink-0 bg-blue-700 hover:bg-blue-800">
            Proceed to Stage 2: Official Placement
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-blue-800 shadow-sm">
        <Info className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold">How the Two-Stage Process Works</h3>
          <ol className="list-decimal ml-5 mt-2 space-y-1 text-sm">
            <li><strong>Stage 1 (Current):</strong> Request a generic introduction letter. Once approved, use this letter to apply to various companies.</li>
            <li><strong>Stage 2 (Next):</strong> After a company accepts your application, submit an Official Placement request with their details to generate the final official letter and evaluation form.</li>
          </ol>
        </div>
      </div>

      <Tabs defaultValue="new" className="space-y-6">
        <TabsList className="bg-muted/50 w-full justify-start overflow-x-auto">
          <TabsTrigger value="new" className="data-[state=active]:bg-background">
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-background">
            <FileText className="mr-2 h-4 w-4" />
            My Requests ({requests.length})
          </TabsTrigger>
        </TabsList>

        {/* New Request Form */}
        <TabsContent value="new" className="mt-0">
          <Card className="border-muted shadow-sm">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle>Submit General Letter Request</CardTitle>
              <CardDescription>
                Provide details about your intended internship to receive a general introduction letter.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Student Information (Read-only from profile) */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                      <UserIcon className="h-5 w-5 text-blue-600" />
                      Student Information
                    </h3>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Student Full Name</Label>
                        <Input value={`${user?.firstName} ${user?.lastName}`} disabled className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>Student ID</Label>
                        <Input value={user?.studentId || "N/A"} disabled className="bg-muted" />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Department or Program</Label>
                        <Input value={user?.program || "N/A"} disabled className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>Academic Level or Year</Label>
                        <Input value={user?.yearOfStudy ? `${user.yearOfStudy}${getOrdinalSuffix(user.yearOfStudy)} Year` : "N/A"} disabled className="bg-muted" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Student Email</Label>
                      <Input value={user?.email || "N/A"} disabled className="bg-muted" />
                    </div>
                  </div>

                  {/* Internship Dates */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Internship Period
                    </h3>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="internshipStartDate">Internship Start Date <span className="text-destructive">*</span></Label>
                        <Input
                          id="internshipStartDate"
                          name="internshipStartDate"
                          type="date"
                          value={formData.internshipStartDate}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="internshipEndDate">Internship End Date <span className="text-destructive">*</span></Label>
                        <Input
                          id="internshipEndDate"
                          name="internshipEndDate"
                          type="date"
                          value={formData.internshipEndDate}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex gap-3 text-sm text-blue-800">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>
                      This letter will be <strong>generic</strong> and will not contain any organization details. 
                      You can use it to apply to multiple organizations.
                    </p>
                  </div>

                <div className="pt-4 flex justify-end gap-3 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        requestType: "general",
                        internshipStartDate: "",
                        internshipEndDate: "",
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

        {/* Requests History */}
        <TabsContent value="history" className="mt-0">
          <Card className="border-muted shadow-sm">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle>My General Requests</CardTitle>
              <CardDescription>
                Track the status of your general introduction letter requests.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <RequestsList requests={requests} isLoading={isLoading} onView={setSelectedRequest} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between mb-2">
                  <DialogTitle>General Request Details</DialogTitle>
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

              <div className="space-y-6 mt-4">
                {/* Status Notice */}
                {selectedRequest.status === 'approved' && (
                  <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-semibold">Request Approved</h4>
                      <p className="text-sm mt-1">
                        Your general introduction letter has been approved. You can download the PDF or you can now proceed to Stage 2 to register an official placement if a company has accepted you.
                      </p>
                      <Button size="sm" className="mt-3 bg-green-600 hover:bg-green-700 text-white" onClick={() => router.push('/dashboard/letter-requests/official')}>
                        Proceed to Stage 2
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {selectedRequest.status === 'rejected' && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-start gap-3">
                    <XCircle className="h-5 w-5 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-semibold">Request Rejected</h4>
                      <p className="text-sm mt-1">Please review the admin notes below and submit a new request if necessary.</p>
                    </div>
                  </div>
                )}

                {/* Internship Details */}
                <div className="bg-muted/20 p-4 rounded-lg border border-border">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Internship Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {selectedRequest.internshipStartDate && (
                      <div>
                        <span className="text-muted-foreground block text-xs">Start Date</span>
                        <span className="font-medium">{new Date(selectedRequest.internshipStartDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {selectedRequest.internshipEndDate && (
                      <div>
                        <span className="text-muted-foreground block text-xs">End Date</span>
                        <span className="font-medium">{new Date(selectedRequest.internshipEndDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>





                {/* Admin Notes */}
                {selectedRequest.adminNotes && (
                  <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg">
                    <h3 className="font-semibold flex items-center gap-2 text-amber-800 mb-2">
                      <AlertCircle className="h-4 w-4" />
                      Admin Notes
                    </h3>
                    <p className="text-sm text-amber-900 whitespace-pre-wrap">{selectedRequest.adminNotes}</p>
                  </div>
                )}

                {/* Document Information (If approved) */}
                {selectedRequest.status === 'approved' && (
                  <div className="flex justify-between items-center p-4 border rounded-lg bg-background">
                    <div>
                      <h4 className="font-semibold mb-1">Introduction Letter</h4>
                      <p className="text-sm text-muted-foreground">Download the general letter to attach to your applications.</p>
                    </div>
                    <Button onClick={async () => {
                      try {
                        const html = await lettersApi.downloadLetterPDF(selectedRequest.id);
                        const blob = new Blob([html], { type: "text/html" });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `General_Introduction_Letter.html`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                      } catch (error: any) {
                        toast.error(error.message || "Failed to download letter");
                      }
                    }}>
                      Download Letter
                    </Button>
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
}: {
  requests: LetterRequest[];
  isLoading: boolean;
  onView: (request: LetterRequest) => void;
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
      <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
        <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
        <h3 className="mb-2 text-lg font-medium text-foreground">No requests found</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          You haven't submitted any general letter requests yet. Create a new request to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const status = statusConfig[request.status];
        const StatusIcon = status.icon;

        return (
          <div key={request.id} className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border bg-card hover:bg-muted/20 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className={status.color}>
                  <StatusIcon className="h-3 w-3 mr-1.5" />
                  {status.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(request.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <h4 className="font-semibold text-base mb-1 uppercase">
                General Internship Request
              </h4>
              <p className="text-sm text-muted-foreground">
                Period: {request.internshipStartDate ? new Date(request.internshipStartDate).toLocaleDateString() : 'N/A'} - {request.internshipEndDate ? new Date(request.internshipEndDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            
            <div className="flex items-center justify-end md:justify-start gap-2 pt-2 md:pt-0 shrink-0">
              <Button variant="outline" size="sm" onClick={() => onView(request)}>
                View Details
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getOrdinalSuffix(num: number | string | undefined) {
  if (!num) return '';
  const n = typeof num === 'string' ? parseInt(num) : num;
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}
