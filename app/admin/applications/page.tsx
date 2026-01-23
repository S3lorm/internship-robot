"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  Download,
  FileText,
  Building2,
  Calendar,
  Mail,
  Phone,
  GraduationCap,
} from "lucide-react"
import { Application, Internship, User } from "@/types"
import { mockApplications, mockInternships, mockUsers } from "@/lib/mock-data"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Loading from "./loading"

const statusConfig = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
  under_review: { label: "Under Review", color: "bg-blue-100 text-blue-800 border-blue-200", icon: AlertCircle },
  approved: { label: "Approved", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
}

type ApplicationWithDetails = Application & {
  student?: User
  internship?: Internship
}

export default function ApplicationsManagementPage() {
  const searchParams = useSearchParams()
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([])
  const [filteredApplications, setFilteredApplications] = useState<ApplicationWithDetails[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedApplications, setSelectedApplications] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [reviewSheet, setReviewSheet] = useState<{ open: boolean; application: ApplicationWithDetails | null }>({
    open: false,
    application: null,
  })
  const [feedbackDialog, setFeedbackDialog] = useState<{
    open: boolean
    application: ApplicationWithDetails | null
    action: "approve" | "reject" | null
  }>({
    open: false,
    application: null,
    action: null,
  })
  const [feedback, setFeedback] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => {
      const appsWithDetails = mockApplications.map((app) => ({
        ...app,
        student: mockUsers.find((u) => u.id === app.studentId),
        internship: mockInternships.find((i) => i.id === app.internshipId),
      }))
      setApplications(appsWithDetails)
      setFilteredApplications(appsWithDetails)
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    let filtered = applications

    if (searchQuery) {
      filtered = filtered.filter(
        (app) =>
          app.student?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          `${app.student?.firstName} ${app.student?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.internship?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.internship?.company.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter)
    }

    setFilteredApplications(filtered)
  }, [searchQuery, statusFilter, applications])

  const handleStatusUpdate = (applicationId: string, newStatus: Application["status"], feedbackText?: string) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? { ...app, status: newStatus, feedback: feedbackText, reviewedAt: new Date().toISOString() }
          : app
      )
    )
    toast.success(`Application ${newStatus === "approved" ? "approved" : "rejected"} successfully`)
    setFeedbackDialog({ open: false, application: null, action: null })
    setFeedback("")
  }

  const handleBulkAction = (action: "approve" | "reject") => {
    if (selectedApplications.length === 0) {
      toast.error("Please select applications first")
      return
    }

    setApplications((prev) =>
      prev.map((app) =>
        selectedApplications.includes(app.id)
          ? { ...app, status: action === "approve" ? "approved" : "rejected", reviewedAt: new Date().toISOString() }
          : app
      )
    )
    toast.success(`${selectedApplications.length} applications ${action === "approve" ? "approved" : "rejected"}`)
    setSelectedApplications([])
  }

  const handleExport = () => {
    const csvContent = [
      ["ID", "Student", "Email", "Internship", "Company", "Status", "Applied At", "Reviewed At"].join(","),
      ...filteredApplications.map((app) =>
        [
          app.id,
          `${app.student?.firstName} ${app.student?.lastName}`,
          app.student?.email,
          app.internship?.title,
          app.internship?.company,
          app.status,
          new Date(app.appliedAt).toLocaleDateString(),
          app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : "N/A",
        ].join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `applications-export-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    toast.success("Applications exported successfully")
  }

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    underReview: applications.filter((a) => a.status === "under_review").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          {[
            { label: "Total", value: stats.total, color: "bg-slate-500" },
            { label: "Pending", value: stats.pending, color: "bg-amber-500" },
            { label: "Under Review", value: stats.underReview, color: "bg-blue-500" },
            { label: "Approved", value: stats.approved, color: "bg-green-500" },
            { label: "Rejected", value: stats.rejected, color: "bg-red-500" },
          ].map((stat) => (
            <Card key={stat.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-12 rounded-full ${stat.color}`} />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters & Actions */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student, internship, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedApplications.length > 0 && (
              <div className="mt-4 flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">
                  {selectedApplications.length} application(s) selected
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-green-600 bg-transparent" onClick={() => handleBulkAction("approve")}>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Approve All
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 bg-transparent" onClick={() => handleBulkAction("reject")}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject All
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>All Applications</CardTitle>
            <CardDescription>Review and manage student applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        className="rounded border-border"
                        checked={selectedApplications.length === filteredApplications.length && filteredApplications.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedApplications(filteredApplications.map((a) => a.id))
                          } else {
                            setSelectedApplications([])
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Internship</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No applications found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredApplications.map((application) => {
                      const status = statusConfig[application.status]
                      const StatusIcon = status.icon

                      return (
                        <TableRow key={application.id} className="hover:bg-muted/30">
                          <TableCell>
                            <input
                              type="checkbox"
                              className="rounded border-border"
                              checked={selectedApplications.includes(application.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedApplications([...selectedApplications, application.id])
                                } else {
                                  setSelectedApplications(selectedApplications.filter((id) => id !== application.id))
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                  {application.student?.firstName?.[0]}
                                  {application.student?.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-foreground">
                                  {application.student?.firstName} {application.student?.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">{application.student?.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{application.internship?.title}</p>
                              <p className="text-sm text-muted-foreground">{application.internship?.company}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(application.appliedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={status.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setReviewSheet({ open: true, application })}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {(application.status === "pending" || application.status === "under_review") && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-green-600"
                                    onClick={() =>
                                      setFeedbackDialog({ open: true, application, action: "approve" })
                                    }
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600"
                                    onClick={() =>
                                      setFeedbackDialog({ open: true, application, action: "reject" })
                                    }
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Review Sheet */}
        <Sheet open={reviewSheet.open} onOpenChange={(open) => setReviewSheet({ open, application: null })}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Application Details</SheetTitle>
              <SheetDescription>
                Review the application and supporting documents
              </SheetDescription>
            </SheetHeader>

            {reviewSheet.application && (
              <div className="mt-6 space-y-6">
                {/* Student Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Student Information
                  </h3>
                  <div className="grid gap-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {reviewSheet.application.student?.firstName?.[0]}
                          {reviewSheet.application.student?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">
                          {reviewSheet.application.student?.firstName} {reviewSheet.application.student?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {reviewSheet.application.student?.studentId}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{reviewSheet.application.student?.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{reviewSheet.application.student?.phone || "Not provided"}</span>
                    </div>
                  </div>
                </div>

                {/* Internship Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Internship Details
                  </h3>
                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium text-foreground">{reviewSheet.application.internship?.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {reviewSheet.application.internship?.company} • {reviewSheet.application.internship?.location}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Deadline: {new Date(reviewSheet.application.internship?.deadline || "").toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Cover Letter */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Cover Letter
                  </h3>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {reviewSheet.application.coverLetter || "No cover letter provided."}
                    </p>
                  </div>
                </div>

                {/* Documents */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Attached Documents</h3>
                  {reviewSheet.application.cvUrl && (
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Download className="h-4 w-4 mr-2" />
                      Download CV / Resume
                    </Button>
                  )}
                </div>

                {/* Status */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Application Status</h3>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={statusConfig[reviewSheet.application.status].color}
                    >
                      {statusConfig[reviewSheet.application.status].label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Applied on {new Date(reviewSheet.application.appliedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {reviewSheet.application.feedback && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium text-foreground mb-1">Feedback:</p>
                      <p className="text-sm text-muted-foreground">{reviewSheet.application.feedback}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {(reviewSheet.application.status === "pending" ||
                  reviewSheet.application.status === "under_review") && (
                  <div className="flex gap-3 pt-4 border-t border-border">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setReviewSheet({ open: false, application: null })
                        setFeedbackDialog({ open: true, application: reviewSheet.application, action: "approve" })
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        setReviewSheet({ open: false, application: null })
                        setFeedbackDialog({ open: true, application: reviewSheet.application, action: "reject" })
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Feedback Dialog */}
        <Dialog
          open={feedbackDialog.open}
          onOpenChange={(open) => {
            setFeedbackDialog({ open, application: null, action: null })
            setFeedback("")
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {feedbackDialog.action === "approve" ? "Approve Application" : "Reject Application"}
              </DialogTitle>
              <DialogDescription>
                {feedbackDialog.action === "approve"
                  ? "Confirm approval and optionally add feedback for the student."
                  : "Please provide a reason for rejection."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Feedback {feedbackDialog.action === "reject" && <span className="text-destructive">*</span>}
                </label>
                <Textarea
                  placeholder={
                    feedbackDialog.action === "approve"
                      ? "Congratulations! Your application has been approved..."
                      : "Please provide a reason for rejection..."
                  }
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="mt-2"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setFeedbackDialog({ open: false, application: null, action: null })
                  setFeedback("")
                }}
              >
                Cancel
              </Button>
              <Button
                className={feedbackDialog.action === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
                variant={feedbackDialog.action === "reject" ? "destructive" : "default"}
                onClick={() => {
                  if (feedbackDialog.action === "reject" && !feedback.trim()) {
                    toast.error("Please provide a reason for rejection")
                    return
                  }
                  if (feedbackDialog.application) {
                    handleStatusUpdate(
                      feedbackDialog.application.id,
                      feedbackDialog.action === "approve" ? "approved" : "rejected",
                      feedback
                    )
                  }
                }}
              >
                {feedbackDialog.action === "approve" ? "Approve" : "Reject"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Suspense>
  )
}
