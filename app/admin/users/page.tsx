"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Search,
  MoreVertical,
  UserCheck,
  UserX,
  Trash2,
  Mail,
  Download,
  Filter,
  Users,
  UserPlus,
  Shield,
} from "lucide-react"
import { User } from "@/types"
import { usersApi } from "@/lib/api"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Loading from "./loading"

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  })
  const searchParams = useSearchParams()

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const res = await usersApi.getAll()
      const fetchedUsers = (res as any).data?.data || (res as any).data?.users || (res as any).users || []
      setUsers(fetchedUsers)
    } catch (error) {
      toast.error("Failed to fetch users")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    let filtered = users

    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.studentId?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    if (statusFilter !== "all") {
      const isActive = statusFilter === "active"
      filtered = filtered.filter((user) => user.isActive === isActive)
    }

    setFilteredUsers(filtered)
  }, [searchQuery, roleFilter, statusFilter, users])

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      // Optimistic update
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, isActive: !currentStatus } : user
        )
      )

      await usersApi.updateStatus(userId, !currentStatus)
      toast.success("User status updated successfully")
    } catch (e) {
      toast.error("Failed to update status")
      fetchUsers() // revert
    }
  }

  const handleDeleteUser = async () => {
    if (deleteDialog.user) {
      try {
        await usersApi.delete(deleteDialog.user.id)
        setUsers((prev) => prev.filter((user) => user.id !== deleteDialog.user?.id))
        toast.success("User deleted successfully")
        setDeleteDialog({ open: false, user: null })
      } catch (error) {
        toast.error("Failed to delete user")
      }
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      toast.error("Please select users first")
      return
    }

    // Fallback: Currently APIs don't easily support bulk operations
    try {
      for (const id of selectedUsers) {
        if (action === "activate" || action === "deactivate") {
          await usersApi.updateStatus(id, action === "activate")
        } else if (action === "delete") {
          await usersApi.delete(id)
        }
      }

      switch (action) {
        case "activate":
          toast.success(`${selectedUsers.length} users activated`)
          break
        case "deactivate":
          toast.success(`${selectedUsers.length} users deactivated`)
          break
        case "delete":
          toast.success(`${selectedUsers.length} users deleted`)
          break
      }
      fetchUsers()
      setSelectedUsers([])
    } catch (error) {
      toast.error("Bulk action failed")
      fetchUsers()
    }
  }

  const handleExport = () => {
    const csvContent = [
      ["ID", "Name", "Email", "Student ID", "Role", "Status", "Created At"].join(","),
      ...filteredUsers.map((user) =>
        [
          user.id,
          `${user.firstName} ${user.lastName}`,
          user.email,
          user.studentId || "N/A",
          user.role,
          user.isActive ? "Active" : "Inactive",
          new Date((user as any).createdAt || new Date()).toLocaleDateString(),
        ].join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    toast.success("Users exported successfully")
  }

  const stats = {
    total: users.length,
    students: users.filter((u) => u.role === "student").length,
    admins: users.filter((u) => u.role === "admin").length,
    active: users.filter((u) => u.isActive).length,
    inactive: users.filter((u) => !u.isActive).length,
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
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Total Users", value: stats.total, icon: Users, color: "bg-blue-500" },
            { label: "Students", value: stats.students, icon: UserPlus, color: "bg-green-500" },
            { label: "Administrators", value: stats.admins, icon: Shield, color: "bg-purple-500" },
            { label: "Active Users", value: stats.active, icon: UserCheck, color: "bg-emerald-500" },
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
                  placeholder="Search by name, email, or student ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
              <div className="mt-4 flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">
                  {selectedUsers.length} user(s) selected
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction("activate")}>
                    <UserCheck className="h-4 w-4 mr-1" />
                    Activate
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction("deactivate")}>
                    <UserX className="h-4 w-4 mr-1" />
                    Deactivate
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleBulkAction("delete")}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              Manage user accounts and permissions
            </CardDescription>
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
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(filteredUsers.map((u) => u.id))
                          } else {
                            setSelectedUsers([])
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No users found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/30">
                        <TableCell>
                          <input
                            type="checkbox"
                            className="rounded border-border"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.id])
                              } else {
                                setSelectedUsers(selectedUsers.filter((id) => id !== user.id))
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={user.avatar || ""} />
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {user.firstName?.[0]}
                                {user.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.studentId || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-800 border-purple-200"
                                : "bg-blue-100 text-blue-800 border-blue-200"
                            }
                          >
                            {user.role === "admin" ? "Admin" : "Student"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              user.isActive
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-gray-100 text-gray-800 border-gray-200"
                            }
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date((user as any).createdAt || new Date()).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(user.id, user.isActive || false)}>
                                {user.isActive ? (
                                  <>
                                    <UserX className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteDialog({ open: true, user })}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, user: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {deleteDialog.user?.firstName} {deleteDialog.user?.lastName}?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog({ open: false, user: null })}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Suspense>
  )
}
