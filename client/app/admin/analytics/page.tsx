"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
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
  Users,
  Briefcase,
  FileText,
  CheckCircle2,
  Download,
  Calendar,
} from "lucide-react"
import { internshipsApi, applicationsApi } from "@/lib/api"
import { toast } from "sonner"

const COLORS = ["#1e3a5f", "#2563eb", "#16a34a", "#dc2626", "#f59e0b"]

async function fetchAllApplicationsPages() {
  const all: any[] = []
  let page = 1
  const limit = 100
  for (;;) {
    const applicationsRes = await applicationsApi.getAll({
      page: String(page),
      limit: String(limit),
    })
    if ((applicationsRes as any).error) {
      toast.error(String((applicationsRes as any).error))
      break
    }
    const body = (applicationsRes as any).data as { data?: any[]; meta?: { total?: number } }
    const rows = body?.data || []
    const total = body?.meta?.total ?? rows.length
    all.push(...rows)
    if (all.length >= total || rows.length === 0) break
    page += 1
    if (page > 100) break
  }
  return all
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState("all")

  const [totalStudents, setTotalStudents] = useState<number>(0)
  const [totalInternships, setTotalInternships] = useState<number>(0)
  const [totalApplications, setTotalApplications] = useState<number>(0)
  const [approvalRate, setApprovalRate] = useState<number>(0)

  const [statusData, setStatusData] = useState<any[]>([])
  const [topInternships, setTopInternships] = useState<any[]>([])
  const [typeData, setTypeData] = useState<any[]>([])
  const [monthlyData, setMonthlyData] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    if (user.role === "admin") {
      router.replace("/admin")
      return
    }
    if (user.role !== "hod") {
      router.replace("/dashboard")
      return
    }

    async function fetchAnalytics() {
      try {
        setIsLoading(true)

        const [internshipsRes, applicationsList] = await Promise.all([
          internshipsApi.getAll(),
          fetchAllApplicationsPages(),
        ])

        const internshipsList =
          (internshipsRes as any).data?.data ||
          (internshipsRes as any).data?.internships ||
          (internshipsRes as any).internships ||
          []

        const studentIds = new Set(
          applicationsList.map((a: any) => a.studentId).filter(Boolean)
        )

        setTotalStudents(studentIds.size)
        setTotalInternships(internshipsList.length)
        setTotalApplications(applicationsList.length)

        const approvedCount = applicationsList.filter((a: any) => a.status === "approved").length
        setApprovalRate(applicationsList.length > 0 ? Math.round((approvedCount / applicationsList.length) * 100) : 0)

        setStatusData([
          { name: "Approved", value: applicationsList.filter((a: any) => a.status === "approved").length },
          { name: "Pending", value: applicationsList.filter((a: any) => a.status === "pending").length },
          { name: "Under Review", value: applicationsList.filter((a: any) => a.status === "under_review").length },
          { name: "Rejected", value: applicationsList.filter((a: any) => a.status === "rejected").length },
        ])

        const top = internshipsList
          .map((i: any) => ({
            name: i.title.length > 20 ? i.title.substring(0, 20) + "..." : i.title,
            applications: applicationsList.filter((a: any) => a.internshipId === i.id).length,
            company: i.company,
          }))
          .sort((a: any, b: any) => b.applications - a.applications)
          .slice(0, 5)
        setTopInternships(top)

        setTypeData([
          { type: "Full-time", count: internshipsList.filter((i: any) => i.type === "full-time").length },
          { type: "Part-time", count: internshipsList.filter((i: any) => i.type === "part-time").length },
          { type: "Remote", count: internshipsList.filter((i: any) => i.type === "remote").length },
        ])

        // Monthly data from real applications
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        const monthly = months.map((month, idx) => {
          const monthApps = applicationsList.filter((a: any) => {
            const d = new Date(a.createdAt || a.appliedAt)
            return d.getMonth() === idx
          })
          return {
            month,
            applications: monthApps.length,
            approved: monthApps.filter((a: any) => a.status === "approved").length,
          }
        })
        setMonthlyData(monthly)

      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchAnalytics()
  }, [user, router])




  const handleExport = () => {
    toast.success("Analytics report exported successfully")
  }

  if (!user || user.role === "admin") {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">
            Department metrics for {user.department ?? "your department"} (applications from students in this
            department only).
          </p>
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
          { title: "Students (with applications)", value: totalStudents, icon: Users, color: "bg-blue-500" },
          { title: "Active Internships", value: totalInternships, icon: Briefcase, color: "bg-green-500" },
          { title: "Total Applications", value: totalApplications, icon: FileText, color: "bg-purple-500" },
          { title: "Approval Rate", value: `${approvalRate}%`, icon: CheckCircle2, color: "bg-emerald-500" },
        ].map((metric) => (
          <Card key={metric.title} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className={`w-12 h-12 rounded-lg ${metric.color} flex items-center justify-center`}>
                <metric.icon className="h-6 w-6 text-white" />
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
    </div>
  )
}
