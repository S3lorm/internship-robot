"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Bell,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  AlertCircle,
  Info,
  CheckCircle2,
  Megaphone,
} from "lucide-react"
import { Notice } from "@/types"
import { noticesApi } from "@/lib/api"
import { toast } from "sonner"

const priorityConfig = {
  low: { label: "Low", color: "bg-slate-100 text-slate-800 border-slate-200", icon: Info },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Bell },
  high: { label: "High", color: "bg-amber-100 text-amber-800 border-amber-200", icon: AlertCircle },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-800 border-red-200", icon: Megaphone },
}

const emptyNotice = {
  title: "",
  content: "",
  priority: "medium" as Notice["priority"],
  targetAudience: "all" as Notice["targetAudience"],
  expiresAt: "",
  isActive: true,
}

export default function NoticesManagementPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [createDialog, setCreateDialog] = useState(false)
  const [editDialog, setEditDialog] = useState<{ open: boolean; notice: Notice | null }>({
    open: false,
    notice: null,
  })
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; notice: Notice | null }>({
    open: false,
    notice: null,
  })
  const [formData, setFormData] = useState(emptyNotice)

  const fetchNotices = async () => {
    try {
      setIsLoading(true)
      const res = await noticesApi.getAll()
      const fetchedNotices = (res as any).data?.data || (res as any).data?.notices || (res as any).notices || []
      setNotices(fetchedNotices)
    } catch (error) {
      toast.error("Failed to load notices")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotices()
  }, [])

  const handleCreate = async () => {
    try {
      const newNoticePayload = {
        ...formData,
        expiresAt: formData.expiresAt || undefined,
      }
      await noticesApi.create(newNoticePayload)
      setCreateDialog(false)
      setFormData(emptyNotice)
      toast.success("Notice created successfully")
      fetchNotices()
    } catch (error) {
      toast.error("Failed to create notice")
    }
  }

  const handleEdit = async () => {
    if (editDialog.notice) {
      try {
        const payload = {
          ...formData,
          expiresAt: formData.expiresAt || undefined,
        }
        await noticesApi.update(editDialog.notice.id, payload)
        setEditDialog({ open: false, notice: null })
        setFormData(emptyNotice)
        toast.success("Notice updated successfully")
        fetchNotices()
      } catch (error) {
        toast.error("Failed to update notice")
      }
    }
  }

  const handleDelete = async () => {
    if (deleteDialog.notice) {
      try {
        await noticesApi.delete(deleteDialog.notice.id)
        setDeleteDialog({ open: false, notice: null })
        toast.success("Notice deleted successfully")
        fetchNotices()
      } catch (error) {
        toast.error("Failed to delete notice")
      }
    }
  }

  const handleToggleActive = async (noticeId: string, currentStatus: boolean) => {
    try {
      // Optimistic upate
      setNotices((prev) =>
        prev.map((n) => (n.id === noticeId ? { ...n, isActive: !currentStatus } : n))
      )

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/notices/${noticeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('rmu_token')}`,
        },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (!response.ok) {
        throw new Error("Failed");
      }

      toast.success("Notice status updated")
    } catch (e: any) {
      toast.error("Failed to update notice status")
      fetchNotices() // revert
    }
  }

  const openEditDialog = (notice: Notice) => {
    setFormData({
      title: notice.title,
      content: notice.content,
      priority: notice.priority,
      targetAudience: notice.targetAudience,
      expiresAt: (notice as any).expiresAt ? (notice as any).expiresAt.split("T")[0] : "",
      isActive: notice.isActive,
    })
    setEditDialog({ open: true, notice })
  }

  const NoticeForm = () => (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Internship Application Period Opens"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Enter the notice content..."
          rows={5}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(value: Notice["priority"]) =>
              setFormData({ ...formData, priority: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="audience">Target Audience</Label>
          <Select
            value={formData.targetAudience}
            onValueChange={(value: Notice["targetAudience"]) =>
              setFormData({ ...formData, targetAudience: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="students">Students Only</SelectItem>
              <SelectItem value="admins">Admins Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expiresAt">Expiration Date (optional)</Label>
        <Input
          id="expiresAt"
          type="date"
          value={formData.expiresAt}
          onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Leave empty for no expiration
        </p>
      </div>

      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
        <div>
          <Label htmlFor="isActive">Publish Immediately</Label>
          <p className="text-sm text-muted-foreground">
            Make this notice visible to users right away
          </p>
        </div>
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-muted animate-pulse rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  const activeNotices = notices.filter((n) => n.isActive)
  const inactiveNotices = notices.filter((n) => !n.isActive)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notices & Announcements</h1>
          <p className="text-muted-foreground">
            Manage announcements and notifications for students
          </p>
        </div>
        <Dialog open={createDialog} onOpenChange={setCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Notice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Notice</DialogTitle>
              <DialogDescription>
                Create an announcement to notify students about important updates
              </DialogDescription>
            </DialogHeader>
            <NoticeForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!formData.title || !formData.content}>
                Create Notice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{notices.length}</p>
                <p className="text-sm text-muted-foreground">Total Notices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{activeNotices.length}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <EyeOff className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{inactiveNotices.length}</p>
                <p className="text-sm text-muted-foreground">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Megaphone className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {(notices.filter((n) => (n.priority as any) === "urgent" && n.isActive) || []).length}
                </p>
                <p className="text-sm text-muted-foreground">Urgent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notices List */}
      {notices.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Notices Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first notice to inform students about important updates.
            </p>
            <Button onClick={() => setCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Notice
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {notices.map((notice) => {
            const priority = priorityConfig[(notice.priority as keyof typeof priorityConfig)] || priorityConfig["medium"]
            const PriorityIcon = priority.icon
            const isExpired = (notice as any).expiresAt && new Date((notice as any).expiresAt) < new Date()

            return (
              <Card
                key={notice.id}
                className={`border-0 shadow-sm ${!notice.isActive || isExpired ? "opacity-60" : ""}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${priority.color.split(" ")[0]}`}
                      >
                        <PriorityIcon className={`h-5 w-5 ${priority.color.split(" ")[1]}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{notice.title}</CardTitle>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant="outline" className={priority.color}>
                            {priority.label}
                          </Badge>
                          <Badge variant="outline">
                            {notice.targetAudience === "all"
                              ? "All Users"
                              : notice.targetAudience === "students"
                                ? "Students"
                                : "Admins"}
                          </Badge>
                          {!notice.isActive && (
                            <Badge variant="outline" className="bg-gray-100 text-gray-800">
                              Draft
                            </Badge>
                          )}
                          {isExpired && (
                            <Badge variant="outline" className="bg-red-100 text-red-800">
                              Expired
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(notice)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(notice.id, notice.isActive)}>
                          {notice.isActive ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Publish
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteDialog({ open: true, notice })}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">{notice.content}</p>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Created: {new Date((notice as any).createdAt || notice.createdAt || new Date()).toLocaleDateString()}
                    </span>
                    {(notice as any).expiresAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Expires: {new Date((notice as any).expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, notice: null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Notice</DialogTitle>
            <DialogDescription>Update the notice details</DialogDescription>
          </DialogHeader>
          <NoticeForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, notice: null })}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, notice: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Notice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.notice?.title}"? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, notice: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
