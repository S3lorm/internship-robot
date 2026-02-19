"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { evaluationsApi } from "@/lib/api";
import {
  ClipboardCheck,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";
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
  viewedBy?: string;
  feedbackAcknowledgedAt?: string;
  feedbackAcknowledgedBy?: string;
  requiresAcknowledgment: boolean;
  acknowledgmentDeadline?: string;
  createdAt: string;
  updatedAt: string;
}

export default function EvaluationsPage() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await evaluationsApi.getAll();
      if (result.error) {
        throw new Error(result.error);
      }
      const evals = Array.isArray(result.data?.evaluations)
        ? result.data.evaluations
        : Array.isArray(result.data)
        ? result.data
        : [];
      setEvaluations(evals);
    } catch (err) {
      console.error("Error fetching evaluations:", err);
      setError(err instanceof Error ? err.message : "Failed to load evaluations");
    } finally {
      setLoading(false);
    }
  };

  const handleViewEvaluation = async (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    // Mark as viewed if not already viewed
    if (!evaluation.viewedAt) {
      try {
        await evaluationsApi.markAsViewed(evaluation.id);
        // Update local state
        setEvaluations((prev) =>
          prev.map((e) =>
            e.id === evaluation.id
              ? { ...e, viewedAt: new Date().toISOString(), viewedBy: user?.id }
              : e
          )
        );
      } catch (err) {
        console.error("Error marking evaluation as viewed:", err);
      }
    }
  };

  const handleAcknowledgeFeedback = async (evaluation: Evaluation) => {
    try {
      await evaluationsApi.acknowledgeFeedback(evaluation.id);
      toast.success("Feedback acknowledged successfully");
      // Update local state
      setEvaluations((prev) =>
        prev.map((e) =>
          e.id === evaluation.id
            ? {
                ...e,
                feedbackAcknowledgedAt: new Date().toISOString(),
                feedbackAcknowledgedBy: user?.id,
              }
            : e
        )
      );
      if (selectedEvaluation?.id === evaluation.id) {
        setSelectedEvaluation({
          ...evaluation,
          feedbackAcknowledgedAt: new Date().toISOString(),
          feedbackAcknowledgedBy: user?.id,
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to acknowledge feedback");
    }
  };

  const getStatusBadge = (evaluation: Evaluation) => {
    if (!evaluation.isAvailable) {
      return <Badge variant="secondary">Not Available</Badge>;
    }
    if (evaluation.deadline && new Date(evaluation.deadline) < new Date()) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    if (evaluation.feedbackAcknowledgedAt) {
      return <Badge variant="default" className="bg-green-600">Acknowledged</Badge>;
    }
    if (evaluation.viewedAt) {
      return <Badge variant="default">Viewed</Badge>;
    }
    return <Badge variant="default" className="bg-blue-600">New</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      final: "default",
      midterm: "secondary",
      initial: "outline",
    };
    return (
      <Badge variant={variants[type] || "default"} className="text-xs">
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchEvaluations}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          My Evaluations
        </h1>
        <p className="text-muted-foreground">
          View evaluation results and feedback from companies
        </p>
      </div>

      {evaluations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardCheck className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-lg mb-2">No evaluations yet</p>
            <p className="text-muted-foreground/70 text-sm">
              Your evaluation results will appear here once companies submit them.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {evaluations.map((evaluation) => (
            <Card
              key={evaluation.id}
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => handleViewEvaluation(evaluation)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{evaluation.title}</CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeBadge(evaluation.evaluationType)}
                      {getStatusBadge(evaluation)}
                    </div>
                  </div>
                </div>
                {evaluation.description && (
                  <CardDescription className="line-clamp-2">
                    {evaluation.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {evaluation.deadline && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Deadline: {new Date(evaluation.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {evaluation.viewedAt && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      <span>
                        Viewed: {new Date(evaluation.viewedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {evaluation.feedbackAcknowledgedAt && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        Acknowledged:{" "}
                        {new Date(evaluation.feedbackAcknowledgedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Evaluation Detail Dialog */}
      {selectedEvaluation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{selectedEvaluation.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    {getTypeBadge(selectedEvaluation.evaluationType)}
                    {getStatusBadge(selectedEvaluation)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedEvaluation(null)}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedEvaluation.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{selectedEvaluation.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedEvaluation.availableFrom && (
                  <div>
                    <h3 className="font-semibold mb-1 text-sm">Available From</h3>
                    <p className="text-muted-foreground text-sm">
                      {new Date(selectedEvaluation.availableFrom).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedEvaluation.deadline && (
                  <div>
                    <h3 className="font-semibold mb-1 text-sm">Deadline</h3>
                    <p className="text-muted-foreground text-sm">
                      {new Date(selectedEvaluation.deadline).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {selectedEvaluation.submissionUrl && (
                <div>
                  <Button asChild className="w-full">
                    <a
                      href={selectedEvaluation.submissionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Submission
                    </a>
                  </Button>
                </div>
              )}

              {selectedEvaluation.requiresAcknowledgment &&
                !selectedEvaluation.feedbackAcknowledgedAt && (
                  <div className="border-t pt-4">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                            Acknowledgment Required
                          </p>
                          <p className="text-sm text-yellow-700 dark:text-yellow-200 mt-1">
                            Please acknowledge that you have reviewed and understood the
                            evaluation feedback.
                          </p>
                          {selectedEvaluation.acknowledgmentDeadline && (
                            <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-2">
                              Deadline:{" "}
                              {new Date(
                                selectedEvaluation.acknowledgmentDeadline
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleAcknowledgeFeedback(selectedEvaluation)}
                      className="w-full"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Acknowledge Feedback
                    </Button>
                  </div>
                )}

              {selectedEvaluation.feedbackAcknowledgedAt && (
                <div className="border-t pt-4">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-900 dark:text-green-100">
                          Feedback Acknowledged
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-200">
                          Acknowledged on:{" "}
                          {new Date(
                            selectedEvaluation.feedbackAcknowledgedAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

