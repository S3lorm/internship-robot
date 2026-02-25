"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Building2,
  MapPin,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Briefcase,
} from "lucide-react"
import { Internship } from "@/types"
import { applicationsApi, internshipsApi } from "@/lib/api"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"
import Loading from "./loading"

const statusColors = {
  open: "bg-green-100 text-green-800 border-green-200",
  closed: "bg-gray-100 text-gray-800 border-gray-200",
  filled: "bg-blue-100 text-blue-800 border-blue-200",
}

const emptyInternship = {
  title: "",
  company: "",
  location: "",
  type: "full-time" as const,
  duration: "",
  description: "",
  requirements: [] as string[],
  responsibilities: [] as string[],
  deadline: "",
  slots: 1,
  stipend: "",
}

export default function InternshipsManagementPage() {
  const searchParams = useSearchParams()
  const [internships, setInternships] = useState<Internship[]>([])
  const [filteredInternships, setFilteredInternships] = useState<Internship[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [applications, setApplications] = useState<any[]>([])
  const [createDialog, setCreateDialog] = useState(false)
  const [editDialog, setEditDialog] = useState<{ open: boolean; internship: Internship | null }>({
    open: false,
    internship: null,
  })
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; internship: Internship | null }>({
    open: false,
    internship: null,
  })
  const [formData, setFormData] = useState(emptyInternship)
  const [requirementsInput, setRequirementsInput] = useState("")
  const [responsibilitiesInput, setResponsibilitiesInput] = useState("")

  useEffect(() => {
    async function fetchInternships() {
      try {
        setIsLoading(true)
        const [intsRes, appsRes] = await Promise.all([
          internshipsApi.getAll(),
          applicationsApi.getAll()
        ])

        const internshipsList = (intsRes as any).data?.data || (intsRes as any).data?.internships || (intsRes as any).internships || []
        const applicationsList = (appsRes as any).data?.data || (appsRes as any).data?.applications || (appsRes as any).applications || []

        setInternships(internshipsList)
        setFilteredInternships(internshipsList)
        setApplications(applicationsList)
      } catch (error) {
        toast.error("Failed to load internships")
      } finally {
        setIsLoading(false)
      }
    }

    fetchInternships()
  }, [])

  useEffect(() => {
    let filtered = internships

    if (searchQuery) {
      filtered = filtered.filter(
        (i) =>
          i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((i) => i.status === statusFilter)
    }

    setFilteredInternships(filtered)
  }, [searchQuery, statusFilter, internships])

  const handleCreate = () => {
    const newInternship: Internship = {
      id: `intern-${Date.now()}`,
      ...formData,
      requirements: requirementsInput.split("\n").filter((r) => r.trim()),
      responsibilities: responsibilitiesInput.split("\n").filter((r) => r.trim()),
      status: "open",
      postedAt: new Date().toISOString(),
      postedBy: "admin-1",
    }
    setInternships([newInternship, ...internships])
    setCreateDialog(false)
    setFormData(emptyInternship)
    setRequirementsInput("")
    setResponsibilitiesInput("")
    toast.success("Internship created successfully")
  }

  const handleEdit = () => {
    if (editDialog.internship) {
      setInternships((prev) =>
        prev.map((i) =>
          i.id === editDialog.internship?.id
            ? {
              ...i,
              ...formData,
              requirements: requirementsInput.split("\n").filter((r) => r.trim()),
              responsibilities: responsibilitiesInput.split("\n").filter((r) => r.trim()),
            }
            : i
        )
      )
      setEditDialog({ open: false, internship: null })
      setFormData(emptyInternship)
      setRequirementsInput("")
      setResponsibilitiesInput("")
      toast.success("Internship updated successfully")
    }
  }

  const handleDelete = () => {
    if (deleteDialog.internship) {
      setInternships((prev) => prev.filter((i) => i.id !== deleteDialog.internship?.id))
      setDeleteDialog({ open: false, internship: null })
      toast.success("Internship deleted successfully")
    }
  }

  const handleStatusChange = (internshipId: string, newStatus: Internship["status"]) => {
    setInternships((prev) =>
      prev.map((i) => (i.id === internshipId ? { ...i, status: newStatus } : i))
    )
    toast.success("Internship status updated")
  }

  const openEditDialog = (internship: Internship) => {
    setFormData({
      title: internship.title,
      company: internship.company,
      location: internship.location,
      type: internship.type,
      duration: internship.duration,
      description: internship.description,
      requirements: internship.requirements,
      responsibilities: internship.responsibilities || [],
      deadline: ((internship as any).deadline || internship.applicationDeadline || new Date().toISOString()).split("T")[0],
      slots: internship.slots || 1,
      stipend: internship.stipend || "",
    })
    setRequirementsInput((internship.requirements || []).join("\n"))
    setResponsibilitiesInput((internship.responsibilities || []).join("\n"))
    setEditDialog({ open: true, internship })
  }

  const stats = {
    total: internships.length,
    open: internships.filter((i) => i.status === "published").length,
    closed: internships.filter((i) => i.status === "closed").length,
    draft: internships.filter((i) => i.status === "draft").length,
    archived: internships.filter((i) => i.status === "archived").length,
  }

  const InternshipForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Job Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Marine Engineering Intern"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Company *</Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="e.g., Ghana Ports Authority"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Tema, Ghana"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select
            value={formData.type}
            onValueChange={(value: "full-time" | "part-time" | "remote") =>
              setFormData({ ...formData, type: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full-time">Full-time</SelectItem>
              <SelectItem value="part-time">Part-time</SelectItem>
              <SelectItem value="remote">Remote</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration">Duration *</Label>
          <Input
            id="duration"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            placeholder="e.g., 3 months"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slots">Available Slots *</Label>
          <Input
            id="slots"
            type="number"
            min={1}
            value={formData.slots}
            onChange={(e) => setFormData({ ...formData, slots: parseInt(e.target.value) || 1 })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deadline">Deadline *</Label>
          <Input
            id="deadline"
            type="date"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="stipend">Stipend (optional)</Label>
        <Input
          id="stipend"
          value={formData.stipend}
          onChange={(e) => setFormData({ ...formData, stipend: e.target.value })}
          placeholder="e.g., GHS 500/month"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the internship opportunity..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="requirements">Requirements (one per line)</Label>
        <Textarea
          id="requirements"
          value={requirementsInput}
          onChange={(e) => setRequirementsInput(e.target.value)}
          placeholder="Currently enrolled in a maritime program&#10;Strong communication skills&#10;Basic computer proficiency"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="responsibilities">Responsibilities (one per line)</Label>
        <Textarea
          id="responsibilities"
          value={responsibilitiesInput}
          onChange={(e) => setResponsibilitiesInput(e.target.value)}
          placeholder="Assist in daily port operations&#10;Support documentation processes&#10;Participate in safety training"
          rows={4}
        />
      </div>
    </div>
  )

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
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Internships", value: stats.total, icon: Briefcase, color: "bg-slate-500" },
          { label: "Open Positions", value: stats.open, icon: CheckCircle, color: "bg-green-500" },
          { label: "Closed", value: stats.closed, icon: XCircle, color: "bg-gray-500" },
          { label: "Filled", value: stats.filled, icon: Users, color: "bg-blue-500" },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
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
                placeholder="Search internships..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="filled">Filled</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={createDialog} onOpenChange={setCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Post Internship
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Post New Internship</DialogTitle>
                    <DialogDescription>
                      Create a new internship opportunity for students
                    </DialogDescription>
                  </DialogHeader>
                  <InternshipForm />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={!formData.title || !formData.company}>
                      Post Internship
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Internships Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredInternships.length === 0 ? (
          <Card className="col-span-full border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Internships Found</h3>
              <p className="text-muted-foreground mb-4">
                {internships.length === 0
                  ? "No internships have been posted yet."
                  : "No internships match your current filters."}
              </p>
              {internships.length === 0 && (
                <Button onClick={() => setCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Post First Internship
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredInternships.map((internship) => {
            const applicationCount = applications.filter(
              (a: any) => a.internshipId === internship.id
            ).length

            return (
              <Card key={internship.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{internship.title}</CardTitle>
                        <CardDescription>{internship.company}</CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openEditDialog(internship)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            handleStatusChange(internship.id, internship.status === "published" ? "closed" : "published")
                          }
                        >
                          {internship.status === "published" ? (
                            <>
                              <XCircle className="mr-2 h-4 w-4" />
                              Close Applications
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Reopen Applications
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteDialog({ open: true, internship })}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className={(statusColors as any)[internship.status] || "bg-gray-100"}>
                        {internship.status.charAt(0).toUpperCase() + internship.status.slice(1)}
                      </Badge>
                      <Badge variant="outline">{internship.type || "Internship"}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{internship.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{internship.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date((internship as any).deadline || internship.applicationDeadline || new Date()).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{applicationCount} applicants</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {internship.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, internship: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Internship</DialogTitle>
            <DialogDescription>Update the internship details</DialogDescription>
          </DialogHeader>
          <InternshipForm isEdit />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, internship: null })}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, internship: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Internship</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.internship?.title}"? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, internship: null })}>
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

function loading() {
  return null
}
