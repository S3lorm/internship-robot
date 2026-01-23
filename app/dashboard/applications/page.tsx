"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Building2, 
  Calendar, 
  Clock, 
  Search,
  Eye,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight
} from "lucide-react"
import { Application, Internship } from "@/types"
import { mockApplications, mockInternships } from "@/lib/mock-data"
import { useSearchParams } from "next/navigation"
import Loading from "./loading"

const statusConfig = {
  pending: { label: "Pending Review", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
  under_review: { label: "Under Review", color: "bg-blue-100 text-blue-800 border-blue-200", icon: AlertCircle },
  approved: { label: "Approved", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
}

export default function ApplicationsPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [applications, setApplications] = useState<(Application & { internship?: Internship })[]>([])
  const [filteredApplications, setFilteredApplications] = useState<(Application & { internship?: Internship })[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      const userApplications = mockApplications
        .filter(app => app.studentId === user?.id)
        .map(app => ({
          ...app,
          internship: mockInternships.find(i => i.id === app.internshipId)
        }))
      setApplications(userApplications)
      setFilteredApplications(userApplications)
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [user?.id])

  useEffect(() => {
    let filtered = applications

    if (searchQuery) {
      filtered = filtered.filter(app => 
        app.internship?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.internship?.company.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(app => app.status === statusFilter)
    }

    setFilteredApplications(filtered)
  }, [searchQuery, statusFilter, applications])

  const getStatusCounts = () => {
    return {
      all: applications.length,
      pending: applications.filter(a => a.status === "pending").length,
      under_review: applications.filter(a => a.status === "under_review").length,
      approved: applications.filter(a => a.status === "approved").length,
      rejected: applications.filter(a => a.status === "rejected").length,
    }
  }

  const counts = getStatusCounts()

  if (isLoading) {
    return <Loading />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Applications</h1>
        <p className="text-muted-foreground mt-1">
          Track and manage your internship applications
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total", count: counts.all, color: "bg-slate-100 text-slate-800" },
          { label: "Pending", count: counts.pending, color: "bg-amber-100 text-amber-800" },
          { label: "Under Review", count: counts.under_review, color: "bg-blue-100 text-blue-800" },
          { label: "Approved", count: counts.approved, color: "bg-green-100 text-green-800" },
          { label: "Rejected", count: counts.rejected, color: "bg-red-100 text-red-800" },
        ].map(stat => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${stat.color} mb-2`}>
                <span className="text-lg font-bold">{stat.count}</span>
              </div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by company or position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Applications Found</h3>
            <p className="text-muted-foreground mb-4">
              {applications.length === 0 
                ? "You haven't applied to any internships yet."
                : "No applications match your current filters."}
            </p>
            {applications.length === 0 && (
              <Button asChild>
                <Link href="/dashboard/internships">Browse Internships</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map(application => {
            const status = statusConfig[application.status]
            const StatusIcon = status.icon

            return (
              <Card key={application.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Company Logo */}
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-7 w-7 text-primary" />
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {application.internship?.title}
                        </h3>
                        <Badge variant="outline" className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm mb-2">
                        {application.internship?.company} • {application.internship?.location}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Applied: {new Date(application.appliedAt).toLocaleDateString()}
                        </span>
                        {application.reviewedAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Reviewed: {new Date(application.reviewedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {application.feedback && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Feedback:</span> {application.feedback}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 lg:flex-shrink-0">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/internships/${application.internshipId}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Link>
                      </Button>
                      {application.cvUrl && (
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Timeline View for detailed tracking */}
      {filteredApplications.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Application Timeline</CardTitle>
            <CardDescription>Track the progress of your most recent application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Timeline */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              
              {[
                { label: "Application Submitted", date: filteredApplications[0]?.appliedAt, completed: true },
                { label: "Under Review", date: filteredApplications[0]?.status !== "pending" ? filteredApplications[0]?.reviewedAt : null, completed: filteredApplications[0]?.status !== "pending" },
                { label: "Decision Made", date: filteredApplications[0]?.status === "approved" || filteredApplications[0]?.status === "rejected" ? filteredApplications[0]?.reviewedAt : null, completed: filteredApplications[0]?.status === "approved" || filteredApplications[0]?.status === "rejected" },
              ].map((step, index) => (
                <div key={index} className="relative pl-10 pb-6 last:pb-0">
                  <div className={`absolute left-2 w-5 h-5 rounded-full border-2 ${step.completed ? "bg-primary border-primary" : "bg-background border-muted-foreground"}`}>
                    {step.completed && <CheckCircle2 className="h-4 w-4 text-primary-foreground" />}
                  </div>
                  <div>
                    <p className={`font-medium ${step.completed ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.label}
                    </p>
                    {step.date && (
                      <p className="text-sm text-muted-foreground">
                        {new Date(step.date).toLocaleDateString("en-US", { 
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
