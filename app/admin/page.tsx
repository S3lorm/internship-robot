"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Users,
  Briefcase,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Calendar,
} from "lucide-react"
import { mockApplications, mockInternships, mockUsers } from "@/lib/mock-data"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalInternships: 0,
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    activeInternships: 0,
  })
  const [recentApplications, setRecentApplications] = useState<typeof mockApplications>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      const students = mockUsers.filter(u => u.role === "student")
      const activeInternships = mockInternships.filter(i => i.status === "open")
      
      setStats({
        totalStudents: students.length,
        totalInternships: mockInternships.length,
        totalApplications: mockApplications.length,
        pendingApplications: mockApplications.filter(a => a.status === "pending").length,
        approvedApplications: mockApplications.filter(a => a.status === "approved").length,
        rejectedApplications: mockApplications.filter(a => a.status === "rejected").length,
        activeInternships: activeInternships.length,
      })
      
      setRecentApplications(mockApplications.slice(0, 5))
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const statCards = [
    {
      title: "Total Students",
      value: stats.totalStudents,
      change: "+12%",
      changeType: "positive",
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Active Internships",
      value: stats.activeInternships,
      change: "+5",
      changeType: "positive",
      icon: Briefcase,
      color: "bg-green-500",
    },
    {
      title: "Total Applications",
      value: stats.totalApplications,
      change: "+23%",
      changeType: "positive",
      icon: FileText,
      color: "bg-purple-500",
    },
    {
      title: "Pending Review",
      value: stats.pendingApplications,
      change: "-3",
      changeType: "negative",
      icon: Clock,
      color: "bg-amber-500",
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Welcome back, Admin!</h1>
              <p className="text-primary-foreground/80 mt-1">
                Here's what's happening with your internship portal today.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" asChild>
                <Link href="/admin/applications">Review Applications</Link>
              </Button>
              <Button variant="outline" size="sm" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link href="/admin/internships/new">Post Internship</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  stat.changeType === "positive" ? "text-green-600" : "text-red-600"
                }`}>
                  {stat.changeType === "positive" 
                    ? <ArrowUpRight className="h-4 w-4" />
                    : <ArrowDownRight className="h-4 w-4" />
                  }
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Application Status Overview */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Application Status Overview</CardTitle>
            <CardDescription>Distribution of application statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Approved", count: stats.approvedApplications, color: "bg-green-500", icon: CheckCircle2 },
                { label: "Pending", count: stats.pendingApplications, color: "bg-amber-500", icon: Clock },
                { label: "Under Review", count: mockApplications.filter(a => a.status === "under_review").length, color: "bg-blue-500", icon: AlertCircle },
                { label: "Rejected", count: stats.rejectedApplications, color: "bg-red-500", icon: XCircle },
              ].map((item) => {
                const percentage = stats.totalApplications > 0 
                  ? Math.round((item.count / stats.totalApplications) * 100) 
                  : 0
                
                return (
                  <div key={item.label} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg ${item.color}/10 flex items-center justify-center`}>
                      <item.icon className={`h-5 w-5 ${item.color.replace("bg-", "text-")}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{item.label}</span>
                        <span className="text-sm text-muted-foreground">{item.count} ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.color} rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>Latest student applications</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/applications">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentApplications.map((application) => {
                const student = mockUsers.find(u => u.id === application.studentId)
                const internship = mockInternships.find(i => i.id === application.internshipId)
                
                const statusConfig = {
                  pending: { color: "bg-amber-100 text-amber-800", label: "Pending" },
                  under_review: { color: "bg-blue-100 text-blue-800", label: "Reviewing" },
                  approved: { color: "bg-green-100 text-green-800", label: "Approved" },
                  rejected: { color: "bg-red-100 text-red-800", label: "Rejected" },
                }
                
                const status = statusConfig[application.status]
                
                return (
                  <div key={application.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {student?.firstName?.[0]}{student?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {student?.firstName} {student?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {internship?.title}
                      </p>
                    </div>
                    <Badge variant="outline" className={status.color}>
                      {status.label}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Internships */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Active Internships</CardTitle>
            <CardDescription>Currently open internship positions</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/internships">Manage All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockInternships.filter(i => i.status === "open").slice(0, 3).map((internship) => {
              const applicationCount = mockApplications.filter(a => a.internshipId === internship.id).length
              
              return (
                <div key={internship.id} className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{internship.title}</h4>
                      <p className="text-sm text-muted-foreground">{internship.company}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {applicationCount} applications
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(internship.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
