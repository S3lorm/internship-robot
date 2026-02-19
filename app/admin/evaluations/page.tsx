"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ClipboardCheck,
  Plus,
  Search,
  Eye,
  Edit,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { evaluationsApi, usersApi, internshipsApi } from "@/lib/api";
import { toast } from "sonner";

interface Evaluation {
  id: string;
  studentId: string;
  internshipId?: string;
  title: string;
  description?: string;
  evaluationType: string;
  isAvailable: boolean;
  availableFrom?: string;
  deadline?: string;
  submissionUrl?: string;
  viewedAt?: string;
  feedbackAcknowledgedAt?: string;
  requiresAcknowledgment: boolean;
  acknowledgmentDeadline?: string;
  createdAt: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentId?: string;
}

interface Internship {
  id: string;
  title: string;
  company: string;
}

export default function EvaluationsManagementPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [formData, setFormData] = useState({
    studentId: "",
    internshipId: "",
    title: "",
    description: "",
    evaluationType: "final",
    isAvailable: false,
    availableFrom: "",
    deadline: "",
    submissionUrl: "",
    requiresAcknowledgment: true,
    acknowledgmentDeadline: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [evalsResult, studentsResult, internshipsResult] = await Promise.all([
        evaluationsApi.getAll(),
        usersApi.getAll({ role: "student" }),
        internshipsApi.getAll(),
      ]);

      if (evalsResult.error) throw new Error(evalsResult.error);
      if (studentsResult.error) throw new Error(studentsResult.error);
      if (internshipsResult.error) throw new Error(internshipsResult.error);

      const evals = Array.isArray(evalsResult.data?.evaluations)
        ? evalsResult.data.evaluations
        : Array.isArray(evalsResult.data)
        ? evalsResult.data
        : [];
      setEvaluations(evals);

      const studs = Array.isArray(studentsResult.data?.data)
        ? studentsResult.data.data
        : Array.isArray(studentsResult.data)
        ? studentsResult.data
        : [];
      setStudents(studs);

      const ints = Array.isArray(internshipsResult.data?.data)
        ? internshipsResult.data.data
        : Array.isArray(internshipsResult.data)
        ? internshipsResult.data
        : [];
      setInternships(ints);
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const filteredEvaluations = evaluations.filter((eval) => {
    const matchesSearch =
      !searchQuery ||
      eval.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eval.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || eval.evaluationType === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleCreate = async () => {
    try {
      const result = await evaluationsApi.create(formData);
      if (result.error) throw new Error(result.error);
      toast.success("Evaluation created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create evaluation");
    }
  };

  const handleUpdate = async () => {
    if (!selectedEvaluation) return;
    try {
      const result = await evaluationsApi.update(selectedEvaluation.id, formData);
      if (result.error) throw new Error(result.error);
      toast.success("Evaluation updated successfully");
      setIsEditDialogOpen(false);
      setSelectedEvaluation(null);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update evaluation");
    }
  };

  const handleEdit = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setFormData({
      studentId: evaluation.studentId,
      internshipId: evaluation.internshipId || "",
      title: evaluation.title,
      description: evaluation.description || "",
      evaluationType: evaluation.evaluationType,
      isAvailable: evaluation.isAvailable,
      availableFrom: evaluation.availableFrom
        ? new Date(evaluation.availableFrom).toISOString().split("T")[0]
        : "",
      deadline: evaluation.deadline
        ? new Date(evaluation.deadline).toISOString().split("T")[0]
        : "",
      submissionUrl: evaluation.submissionUrl || "",
      requiresAcknowledgment: evaluation.requiresAcknowledgment,
      acknowledgmentDeadline: evaluation.acknowledgmentDeadline
        ? new Date(evaluation.acknowledgmentDeadline).toISOString().split("T")[0]
        : "",
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      studentId: "",
      internshipId: "",
      title: "",
      description: "",
      evaluationType: "final",
      isAvailable: false,
      availableFrom: "",
      deadline: "",
      submissionUrl: "",
      requiresAcknowledgment: true,
      acknowledgmentDeadline: "",
    });
  };

  const getStudentName = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : "Unknown";
  };

  const getStatusBadge = (evaluation: Evaluation) => {
    if (!evaluation.isAvailable) {
      return <Badge variant="secondary">Not Available</Badge>;
    }
    if (evaluation.feedbackAcknowledgedAt) {
      return <Badge className="bg-green-600">Acknowledged</Badge>;
    }
    if (evaluation.viewedAt) {
      return <Badge>Viewed</Badge>;
    }
    return <Badge className="bg-blue-600">New</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Evaluations Management
          </h1>
          <p className="text-muted-foreground">
            Create and manage student evaluations from companies
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Evaluation
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search evaluations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="initial">Initial</SelectItem>
                <SelectItem value="midterm">Midterm</SelectItem>
                <SelectItem value="final">Final</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Evaluations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Evaluations</CardTitle>
          <CardDescription>
            {filteredEvaluations.length} evaluation{filteredEvaluations.length !== 1 ? "s" : ""}{" "}
            found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEvaluations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ClipboardCheck className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No evaluations found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvaluations.map((evaluation) => (
                  <TableRow key={evaluation.id}>
                    <TableCell className="font-medium">{evaluation.title}</TableCell>
                    <TableCell>{getStudentName(evaluation.studentId)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {evaluation.evaluationType.charAt(0).toUpperCase() +
                          evaluation.evaluationType.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(evaluation)}</TableCell>
                    <TableCell>
                      {evaluation.deadline
                        ? new Date(evaluation.deadline).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(evaluation)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Evaluation</DialogTitle>
            <DialogDescription>
              Create a new evaluation for a student from a company
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Student</label>
              <Select
                value={formData.studentId}
                onValueChange={(value) => setFormData({ ...formData, studentId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName} ({student.studentId || student.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Internship (Optional)</label>
              <Select
                value={formData.internshipId}
                onValueChange={(value) => setFormData({ ...formData, internshipId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select internship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {internships.map((internship) => (
                    <SelectItem key={internship.id} value={internship.id}>
                      {internship.title} - {internship.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Evaluation title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Evaluation description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Evaluation Type</label>
                <Select
                  value={formData.evaluationType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, evaluationType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="initial">Initial</SelectItem>
                    <SelectItem value="midterm">Midterm</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Available From</label>
                <Input
                  type="date"
                  value={formData.availableFrom}
                  onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Deadline</label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Acknowledgment Deadline</label>
                <Input
                  type="date"
                  value={formData.acknowledgmentDeadline}
                  onChange={(e) =>
                    setFormData({ ...formData, acknowledgmentDeadline: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Submission URL (Optional)</label>
              <Input
                value={formData.submissionUrl}
                onChange={(e) => setFormData({ ...formData, submissionUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isAvailable"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="isAvailable" className="text-sm font-medium">
                Make available immediately
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requiresAcknowledgment"
                checked={formData.requiresAcknowledgment}
                onChange={(e) =>
                  setFormData({ ...formData, requiresAcknowledgment: e.target.checked })
                }
                className="rounded"
              />
              <label htmlFor="requiresAcknowledgment" className="text-sm font-medium">
                Require acknowledgment
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Evaluation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Evaluation</DialogTitle>
            <DialogDescription>Update evaluation details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Evaluation Type</label>
                <Select
                  value={formData.evaluationType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, evaluationType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="initial">Initial</SelectItem>
                    <SelectItem value="midterm">Midterm</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Available From</label>
                <Input
                  type="date"
                  value={formData.availableFrom}
                  onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Deadline</label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Acknowledgment Deadline</label>
                <Input
                  type="date"
                  value={formData.acknowledgmentDeadline}
                  onChange={(e) =>
                    setFormData({ ...formData, acknowledgmentDeadline: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Submission URL</label>
              <Input
                value={formData.submissionUrl}
                onChange={(e) => setFormData({ ...formData, submissionUrl: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editIsAvailable"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="editIsAvailable" className="text-sm font-medium">
                Make available
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editRequiresAcknowledgment"
                checked={formData.requiresAcknowledgment}
                onChange={(e) =>
                  setFormData({ ...formData, requiresAcknowledgment: e.target.checked })
                }
                className="rounded"
              />
              <label htmlFor="editRequiresAcknowledgment" className="text-sm font-medium">
                Require acknowledgment
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Evaluation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

