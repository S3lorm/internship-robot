"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Bell,
  Search,
  Calendar,
  AlertCircle,
  Info,
  Megaphone,
  ChevronRight,
} from "lucide-react"
import { Notice } from "@/types"
import { noticesApi } from "@/lib/api"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

const priorityConfig = {
  low: { label: "General", color: "bg-slate-100 text-slate-800 border-slate-200", icon: Info },
  medium: { label: "Important", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Bell },
  high: { label: "High Priority", color: "bg-amber-100 text-amber-800 border-amber-200", icon: AlertCircle },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-800 border-red-200", icon: Megaphone },
}

const Loading = () => null;

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [filteredNotices, setFilteredNotices] = useState<Notice[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setIsLoading(true);
      const result = await noticesApi.getAll({ isActive: "true" });
      if (result.error) {
        throw new Error(result.error);
      }
      const noticesData = Array.isArray(result.data?.data)
        ? result.data.data
        : Array.isArray(result.data?.notices)
        ? result.data.notices
        : Array.isArray(result.data)
        ? result.data
        : [];
      
      // Filter notices for students (all or students-targeted) and active
      const studentNotices = noticesData.filter(
        (n: Notice) =>
          n.isActive &&
          (n.targetAudience === "all" || n.targetAudience === "students") &&
          (!n.expiresAt || new Date(n.expiresAt) > new Date())
      );
      setNotices(studentNotices);
      setFilteredNotices(studentNotices);
    } catch (err) {
      console.error("Error fetching notices:", err);
      setError(err instanceof Error ? err.message : "Failed to load notices");
      setNotices([]);
      setFilteredNotices([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = notices

    if (searchQuery) {
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((n) => n.priority === priorityFilter)
    }

    setFilteredNotices(filtered)
  }, [searchQuery, priorityFilter, notices])

  // Sort notices: urgent first, then by date
  const sortedNotices = [...filteredNotices].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const urgentNotices = sortedNotices.filter((n) => n.priority === "urgent")

  return (
    <Suspense fallback={<Loading />}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">{error}</p>
          <Button onClick={fetchNotices}>Try Again</Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notices & Announcements</h1>
            <p className="text-muted-foreground mt-1">
              Stay updated with important announcements and deadlines
            </p>
          </div>

          {/* Urgent Notice Banner */}
          {urgentNotices.length > 0 && (
            <Card className="border-0 shadow-sm bg-red-50 border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Megaphone className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-800">Urgent Announcement</h3>
                    <p className="text-sm text-red-700 mt-1">{urgentNotices[0].title}</p>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-red-700 mt-1"
                      onClick={() => setSelectedNotice(urgentNotices[0])}
                    >
                      Read more <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search notices..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Important</SelectItem>
                    <SelectItem value="low">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notices List */}
          {sortedNotices.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Notices</h3>
                <p className="text-muted-foreground">
                  {notices.length === 0
                    ? "There are no announcements at this time."
                    : "No notices match your current filters."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedNotices.map((notice) => {
                const priority = priorityConfig[notice.priority]
                const PriorityIcon = priority.icon

                return (
                  <Card
                    key={notice.id}
                    className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedNotice(notice)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${priority.color.split(" ")[0]}`}
                        >
                          <PriorityIcon className={`h-6 w-6 ${priority.color.split(" ")[1]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{notice.title}</h3>
                            <Badge variant="outline" className={priority.color}>
                              {priority.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {notice.content}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(notice.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                            {notice.expiresAt && (
                              <span className="flex items-center gap-1">
                                Expires: {new Date(notice.expiresAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Notice Detail Dialog */}
          <Dialog open={!!selectedNotice} onOpenChange={() => setSelectedNotice(null)}>
            <DialogContent className="max-w-lg">
              {selectedNotice && (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="outline"
                        className={priorityConfig[selectedNotice.priority].color}
                      >
                        {priorityConfig[selectedNotice.priority].label}
                      </Badge>
                    </div>
                    <DialogTitle>{selectedNotice.title}</DialogTitle>
                    <DialogDescription>
                      Posted on{" "}
                      {new Date(selectedNotice.createdAt).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="prose prose-sm max-w-none">
                      <p className="text-foreground whitespace-pre-wrap">{selectedNotice.content}</p>
                    </div>
                    {selectedNotice.expiresAt && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Note:</span> This notice expires on{" "}
                          {new Date(selectedNotice.expiresAt).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}
    </Suspense>
  )
}
