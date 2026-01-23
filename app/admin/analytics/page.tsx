"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  FileText,
  CheckCircle2,
  Download,
  Calendar,
} from "lucide-react"
import { mockApplications, mockInternships, mockUsers } from "@/lib/mock-data"
import { toast } from "sonner"

const COLORS = ["#1e3a5f", "#2563eb", "#16a34a", "#dc2626", "#f59e0b"]

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState("all")

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Calculate analytics data
  const totalStudents = mockUsers.filter((u) => u.role === "student").length
  const totalInternships = mockInternships.length
  const totalApplications = mockApplications.length
  const approvalRate = Math.round(
    (mockApplications.filter((a) => a.status === "approved").length / totalApplications) * 100
  )

  // Application status distribution
  const statusData = [
    { name: "Approved", value: mockApplications.filter((a) => a.status === "approved").length },
    { name: "Pending", value: mockApplications.filter((a) => a.status === "pending").length },
    { name: "Under Review", value: mockApplications.filter((a) => a.status === "under_review").length },
    { name: "Rejected", value: mockApplications.filter((a) => a.status === "rejected").length },
  ]

  // Applications by month (simulated data)
  const monthlyData = [
    { month: "Jan", applications: 12, approved: 8 },
    { month: "Feb", applications: 19, approved: 12 },
    { month: "Mar", applications: 25, approved: 18 },
    { month: "Apr", applications: 32, approved: 22 },
    { month: "May", applications: 28, approved: 20 },
    { month: "Jun", applications: 45, approved: 35 },
  ]

  // Top internships by applications
  const topInternships = mockInternships
    .map((i) => ({
      name: i.title.length > 20 ? i.title.substring(0, 20) + "..." : i.title,
      applications: mockApplications.filter((a) => a.internshipId === i.id).length,
      company: i.company,
    }))
    .sort((a, b) => b.applications - a.applications)
    .slice(0, 5)

  // Applications by type
  const typeData = [
    {
      type: "Full-time",
      count: mockInternships.filter((i) => i.type === "full-time").length,
    },
    {
      type: "Part-time",
      count: mockInternships.filter((i) => i.type === "part-time").length,
    },
    {
      type: "Remote",
      count: mockInternships.filter((i) => i.type === "remote").length,
    },
  ]

  const handleExport = () => {
    toast.success("Analytics report exported successfully")
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track internship portal performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Total Students",
            value: totalStudents,
            change: "+12%",
            trend: "up",
            icon: Users,
            color: "bg-blue-500",
          },
          {
            title: "Active Internships",
            value: mockInternships.filter((i) => i.status === "open").length,
            change: "+5",
            trend: "up",
            icon: Briefcase,
            color: "bg-green-500",
          },
          {
            title: "Total Applications",
            value: totalApplications,
            change: "+23%",
            trend: "up",
            icon: FileText,
            color: "bg-purple-500",
          },
          {
            title: "Approval Rate",
            value: `${approvalRate}%`,
            change: "+5%",
            trend: "up",
            icon: CheckCircle2,
            color: "bg-emerald-500",
          },
        ].map((metric) => (
          <Card key={metric.title} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-lg ${metric.color} flex items-center justify-center`}>
                  <metric.icon className="h-6 w-6 text-white" />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm ${
                    metric.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {metric.trend === "up" ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {metric.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-foreground">{metric.value}</p>
                <p className="text-sm text-muted-foreground">{metric.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Applications Over Time */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Applications Over Time</CardTitle>
            <CardDescription>Monthly applications and approvals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-sm" />
                  <YAxis className="text-sm" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    stroke="#1e3a5f"
                    strokeWidth={2}
                    name="Applications"
                  />
                  <Line
                    type="monotone"
                    dataKey="approved"
                    stroke="#16a34a"
                    strokeWidth={2}
                    name="Approved"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Application Status Distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
            <CardDescription>Distribution of application statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Internships */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Top Internships</CardTitle>
            <CardDescription>Most applied internship positions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topInternships} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-sm" />
                  <YAxis dataKey="name" type="category" width={120} className="text-sm" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value, name, props) => [
                      `${value} applications`,
                      props.payload.company,
                    ]}
                  />
                  <Bar dataKey="applications" fill="#1e3a5f" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Internship Types */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Internship Types</CardTitle>
            <CardDescription>Distribution by work type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="type" className="text-sm" />
                  <YAxis className="text-sm" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} name="Internships" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Average Processing Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">3.2 days</p>
            <p className="text-sm text-muted-foreground mt-1">From submission to decision</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Most Active Company</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-foreground">Ghana Ports Authority</p>
            <p className="text-sm text-muted-foreground mt-1">15 internship positions posted</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Student Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">78%</p>
            <p className="text-sm text-muted-foreground mt-1">Students with at least one application</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
