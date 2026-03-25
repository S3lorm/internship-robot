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
  Star,
  User,
  MessageSquare,
  Award,
} from "lucide-react";
import { evaluationsApi, usersApi, internshipsApi } from "@/lib/api";
import { toast } from "sonner";

interface Evaluation {
  id: string;
  studentId: string;
  internshipId?: string;
  placementId?: string;
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
  // Supervisor evaluation fields
  supervisorName?: string;
  supervisorPosition?: string;
  supervisorDepartment?: string;
  workEthicRating?: number;
  communicationRating?: number;
  technicalSkillsRating?: number;
  teamworkRating?: number;
  punctualityRating?: number;
  problemSolvingRating?: number;
  supervisorComments?: string;
  finalRecommendation?: string;
  submittedAt?: string;
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
  const [recommendationFilter, setRecommendationFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [reviewEvaluation, setReviewEvaluation] = useState<Evaluation | null>(null);
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

      const evals = Array.isArray((evalsResult as any).data?.evaluations)
        ? (evalsResult as any).data.evaluations
        : Array.isArray((evalsResult as any).data)
          ? (evalsResult as any).data
          : [];
      setEvaluations(evals);

      const studs = Array.isArray((studentsResult as any).data?.data)
        ? (studentsResult as any).data.data
        : Array.isArray((studentsResult as any).data)
          ? (studentsResult as any).data
          : [];
      setStudents(studs);

      const ints = Array.isArray((internshipsResult as any).data?.data)
        ? (internshipsResult as any).data.data
        : Array.isArray((internshipsResult as any).data)
          ? (internshipsResult as any).data
          : [];
      setInternships(ints);
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Removed filteredEvaluations from here, moved to line 348 to prevent ReferenceError (getStudentName used before initialization)

  const handleCreate = async () => {
    try {
      const payload = { ...formData };
      // Sanitize empty strings to pass Postgres constraints (UUIDs and Dates)
      if (!payload.internshipId) (payload as any).internshipId = null;
      if (!payload.availableFrom) (payload as any).availableFrom = null;
      if (!payload.deadline) (payload as any).deadline = null;
      if (!payload.acknowledgmentDeadline) (payload as any).acknowledgmentDeadline = null;

      const result = await evaluationsApi.create(payload);
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
      const payload = { ...formData };
      // Sanitize empty strings to pass Postgres constraints (UUIDs and Dates)
      if (!payload.internshipId) (payload as any).internshipId = null;
      if (!payload.availableFrom) (payload as any).availableFrom = null;
      if (!payload.deadline) (payload as any).deadline = null;
      if (!payload.acknowledgmentDeadline) (payload as any).acknowledgmentDeadline = null;

      const result = await evaluationsApi.update(selectedEvaluation.id, payload);
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

  const handleReview = (evaluation: Evaluation) => {
    setReviewEvaluation(evaluation);
    setIsReviewDialogOpen(true);
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
    if (evaluation.submittedAt) {
      return <Badge className="bg-green-600">Submitted</Badge>;
    }
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

  const hasSubmittedScores = (evaluation: Evaluation) => {
    return evaluation.submittedAt && evaluation.workEthicRating !== undefined && evaluation.workEthicRating !== null;
  };

  // Rating bar component
  const RatingBar = ({ label, rating }: { label: string; rating: number | undefined }) => {
    const value = rating || 0;
    const percentage = (value / 5) * 100;
    const getColor = (val: number) => {
      if (val >= 4) return "bg-green-500";
      if (val >= 3) return "bg-yellow-500";
      if (val >= 2) return "bg-orange-500";
      return "bg-red-500";
    };

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-semibold flex items-center gap-1">
            {value}/5
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getColor(value)}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const filteredEvaluations = evaluations.filter((evaluation) => {
    const studentName = getStudentName(evaluation.studentId).toLowerCase();
    const supervisorName = (evaluation.supervisorName || "").toLowerCase();
    
    // Find internship safely
    let companyName = "";
    if (evaluation.internshipId) {
      const internship = internships.find((i) => i.id === evaluation.internshipId);
      if (internship) companyName = internship.company.toLowerCase();
    }

    const searchLower = searchQuery.toLowerCase();

    const matchesSearch =
      !searchQuery ||
      evaluation.title.toLowerCase().includes(searchLower) ||
      (evaluation.description?.toLowerCase().includes(searchLower) ?? false) ||
      studentName.includes(searchLower) ||
      supervisorName.includes(searchLower) ||
      companyName.includes(searchLower) ||
      (evaluation.supervisorComments?.toLowerCase().includes(searchLower) ?? false);

    const matchesType = typeFilter === "all" || evaluation.evaluationType === typeFilter;
    
    let matchesRecommendation = true;
    if (recommendationFilter !== "all") {
      if (recommendationFilter === "pending") {
        matchesRecommendation = !evaluation.finalRecommendation;
      } else {
        matchesRecommendation = evaluation.finalRecommendation === recommendationFilter;
      }
    }

    return matchesSearch && matchesType && matchesRecommendation;
  });

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
            Create and manage student evaluations from supervisors
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
                placeholder="Search by student, company, or comments..."
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
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="final">Final</SelectItem>
              </SelectContent>
            </Select>
            <Select value={recommendationFilter} onValueChange={setRecommendationFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Recommendation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Recommendations</SelectItem>
                <SelectItem value="Excellent">Excellent</SelectItem>
                <SelectItem value="Good">Good</SelectItem>
                <SelectItem value="Average">Average</SelectItem>
                <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
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
                  <TableHead>Supervisor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell max-w-[250px]">Compliments/Comments</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvaluations.map((evaluation) => (
                  <TableRow key={evaluation.id}>
                    <TableCell className="font-medium">{evaluation.title}</TableCell>
                    <TableCell>{getStudentName(evaluation.studentId)}</TableCell>
                    <TableCell>{evaluation.supervisorName || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {evaluation.evaluationType.charAt(0).toUpperCase() +
                          evaluation.evaluationType.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[250px] truncate" title={evaluation.supervisorComments || "No comments"}>
                      {evaluation.supervisorComments ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground cursor-help">
                          <MessageSquare className="h-3 w-3 shrink-0 text-primary" />
                          <span className="truncate">{evaluation.supervisorComments}</span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(evaluation)}</TableCell>
                    <TableCell>
                      {evaluation.submittedAt
                        ? new Date(evaluation.submittedAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {hasSubmittedScores(evaluation) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReview(evaluation)}
                            title="Review evaluation scores"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(evaluation)}
                          title="Edit evaluation"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Evaluation Review
            </DialogTitle>
            <DialogDescription>
              {reviewEvaluation?.title}
            </DialogDescription>
          </DialogHeader>

          {reviewEvaluation && (
            <div className="space-y-6">
              {/* Supervisor Info */}
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Supervisor Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name</span>
                      <p className="font-medium">{reviewEvaluation.supervisorName || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Position</span>
                      <p className="font-medium">{reviewEvaluation.supervisorPosition || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Department</span>
                      <p className="font-medium">{reviewEvaluation.supervisorDepartment || "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Student Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Student
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{getStudentName(reviewEvaluation.studentId)}</p>
                  {reviewEvaluation.submittedAt && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Submitted on {new Date(reviewEvaluation.submittedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Ratings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    Performance Ratings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <RatingBar label="Work Ethic" rating={reviewEvaluation.workEthicRating} />
                    <RatingBar label="Communication" rating={reviewEvaluation.communicationRating} />
                    <RatingBar label="Technical Skills" rating={reviewEvaluation.technicalSkillsRating} />
                    <RatingBar label="Teamwork" rating={reviewEvaluation.teamworkRating} />
                    <RatingBar label="Punctuality" rating={reviewEvaluation.punctualityRating} />
                    <RatingBar label="Problem Solving" rating={reviewEvaluation.problemSolvingRating} />

                    {/* Average */}
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Overall Average</span>
                        <span className="text-lg font-bold text-primary">
                          {(() => {
                            const ratings = [
                              reviewEvaluation.workEthicRating,
                              reviewEvaluation.communicationRating,
                              reviewEvaluation.technicalSkillsRating,
                              reviewEvaluation.teamworkRating,
                              reviewEvaluation.punctualityRating,
                              reviewEvaluation.problemSolvingRating,
                            ].filter((r): r is number => r !== undefined && r !== null);
                            if (ratings.length === 0) return "N/A";
                            const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
                            return `${avg.toFixed(1)}/5`;
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comments */}
              {reviewEvaluation.supervisorComments && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Supervisor Comments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                      {reviewEvaluation.supervisorComments}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Final Recommendation */}
              {reviewEvaluation.finalRecommendation && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Final Recommendation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge
                      className={
                        reviewEvaluation.finalRecommendation.toLowerCase().includes("excellent") ||
                        reviewEvaluation.finalRecommendation.toLowerCase().includes("outstanding")
                          ? "bg-green-600 text-white text-sm px-3 py-1"
                          : reviewEvaluation.finalRecommendation.toLowerCase().includes("good")
                          ? "bg-blue-600 text-white text-sm px-3 py-1"
                          : reviewEvaluation.finalRecommendation.toLowerCase().includes("satisfactory")
                          ? "bg-yellow-600 text-white text-sm px-3 py-1"
                          : "bg-gray-600 text-white text-sm px-3 py-1"
                      }
                    >
                      {reviewEvaluation.finalRecommendation}
                    </Badge>
                  </CardContent>
                </Card>
              )}

              {/* Acknowledgment Status */}
              <div className="text-sm text-muted-foreground border-t pt-4">
                {reviewEvaluation.feedbackAcknowledgedAt ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Student acknowledged on{" "}
                    {new Date(reviewEvaluation.feedbackAcknowledgedAt).toLocaleDateString()}
                  </div>
                ) : reviewEvaluation.viewedAt ? (
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Student viewed on{" "}
                    {new Date(reviewEvaluation.viewedAt).toLocaleDateString()}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Student has not viewed yet
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        <DialogContent className="max-w-md">
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
                rows={2}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="editIsAvailable" className="text-sm font-medium">
                  Available
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
                  Requires Acknowledgment
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
