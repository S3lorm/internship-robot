"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { hodApi } from "@/lib/api";
import {
  type LevelFilter,
  levelFilterLabel,
  studentMatchesLevelFilter,
} from "@/lib/student-level";
import { DepartmentStudentsNav } from "@/components/department-students-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarCheck2, FileCheck2, FileText, Loader2, Users, UserX, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type DeptStudent = {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  email: string;
  phone?: string | null;
  program: string;
  programGroup: string;
  yearOfStudy?: number | null;
  level?: number | null;
  levelLabel?: string;
  internshipStatus: string;
  internshipLabel: string;
  activePlacement?: {
    organizationName: string;
    internshipStartDate?: string;
    internshipEndDate?: string;
  } | null;
  hasPlacementSubmission?: boolean;
  missedPlacementSubmission?: boolean;
  approvedLetterCount?: number;
  hasTakenInternshipLetter?: boolean;
  completedInternshipCount?: number;
  internshipCount?: number;
  placementCategory?:
    | "placement_submitted"
    | "no_placement_submitted"
    | "internship_ended"
    | "awaiting_submission_window";
};

type StudentFilter =
  | "all"
  | "letter_taken"
  | "placement_submitted"
  | "internship_ended"
  | "not_on_internship";

type ProgramGroup = {
  program: string;
  prefixes: string[];
  students: DeptStudent[];
};

type DeptPayload = {
  department: string;
  summary: {
    totalStudents: number;
    tookInternshipLetters?: number;
    completedInternships?: number;
    placementSubmitted?: number;
    onInternship: number;
    notOnInternship: number;
    placementPending: number;
    internshipEnded: number;
    placementSubmissionGraceDays?: number;
    placementSubmissionGraceOver?: boolean;
    portalOpenedAt?: string;
    levelBreakdown?: Record<string, number>;
  };
  groups: ProgramGroup[];
};

const LEVEL_FILTERS: LevelFilter[] = ["all", "1", "2", "3", "4", "unknown"];

function statusBadge(status: string, label: string) {
  if (status === "on_internship") {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100">
        {label}
      </Badge>
    );
  }
  if (status === "placement_pending") {
    return (
      <Badge className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
        {label}
      </Badge>
    );
  }
  if (status === "internship_ended") {
    return (
      <Badge className="border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100">
        {label}
      </Badge>
    );
  }
  if (status === "not_on_internship") {
    return (
      <Badge className="border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100">
        {label}
      </Badge>
    );
  }
  if (status === "placement_window_open") {
    return (
      <Badge className="border-purple-200 bg-purple-50 text-purple-900 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-100">
        {label}
      </Badge>
    );
  }
  if (status === "letter_not_taken") {
    return (
      <Badge className="border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
        {label}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      {label}
    </Badge>
  );
}

function formatDate(date?: string) {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DepartmentStudentsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DeptPayload | null>(null);
  const [archivedCount, setArchivedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StudentFilter>("all");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [archiveTarget, setArchiveTarget] = useState<DeptStudent | null>(null);
  const [archiving, setArchiving] = useState(false);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    const [activeRes, archivedRes] = await Promise.all([
      hodApi.getDepartmentStudents(),
      hodApi.getArchivedDepartmentStudents(),
    ]);
    if (activeRes.data) setData(activeRes.data as DeptPayload);
    if (archivedRes.data) {
      const archived = archivedRes.data as { summary?: { totalArchived?: number } };
      setArchivedCount(archived.summary?.totalArchived ?? 0);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user?.role !== "hod") return;
    void loadStudents();
  }, [user?.role, user?.department, loadStudents]);

  const filteredGroups = useMemo(() => {
    if (!data) return [];
    return data.groups
      .map((g) => ({
        ...g,
        students: g.students.filter((s) => {
          if (!studentMatchesLevelFilter(s.yearOfStudy, levelFilter)) return false;
          if (filter === "letter_taken") return s.hasTakenInternshipLetter === true;
          if (filter === "placement_submitted") return s.placementCategory === "placement_submitted";
          if (filter === "internship_ended") return s.internshipStatus === "internship_ended";
          if (filter === "not_on_internship") return s.missedPlacementSubmission === true;
          return true;
        }),
      }))
      .filter((g) => g.students.length > 0);
  }, [data, filter, levelFilter]);

  const handleArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    const res = await hodApi.archiveDepartmentStudent(archiveTarget.id);
    setArchiving(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(
      `${archiveTarget.firstName} ${archiveTarget.lastName} archived. View credentials under Archived students.`
    );
    setArchiveTarget(null);
    void loadStudents();
  };

  if (user?.role !== "hod") return null;

  if (loading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Department students</h1>
        <p className="mt-1 text-muted-foreground">
          All registered students in {data?.department || user.department}, grouped by course and
          filterable by level. Internship status is based on approved official placements.
        </p>
      </div>

      <DepartmentStudentsNav archivedCount={archivedCount} />

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold tabular-nums">{data.summary.totalStudents}</p>
                  <p className="text-sm text-muted-foreground">Registered students</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <FileText className="h-8 w-8 text-sky-600" />
                <div>
                  <p className="text-2xl font-bold tabular-nums">
                    {data.summary.tookInternshipLetters || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Took internship letters</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <FileCheck2 className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold tabular-nums">
                    {data.summary.placementSubmitted ?? data.summary.onInternship}
                  </p>
                  <p className="text-sm text-muted-foreground">Submitted official placement</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <CalendarCheck2 className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold tabular-nums">
                    {data.summary.completedInternships ?? data.summary.internshipEnded}
                  </p>
                  <p className="text-sm text-muted-foreground">Internship completed</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <UserX className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold tabular-nums">{data.summary.notOnInternship}</p>
                  <p className="text-sm text-muted-foreground">No placement submitted</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {!data.summary.placementSubmissionGraceOver && (
            <Card className="border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/30">
              <CardContent className="py-4 text-sm text-blue-900 dark:text-blue-100">
                The “No placement after 2 weeks” list becomes active after the internship portal
                has been open for {data.summary.placementSubmissionGraceDays || 14} days. Students
                are listed there only if they have not submitted any official placement request in
                the current cycle.
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Filter by level</p>
            <div className="flex flex-wrap gap-2">
              {LEVEL_FILTERS.map((key) => {
                const count =
                  key === "all"
                    ? data.summary.totalStudents
                    : data.summary.levelBreakdown?.[key] ??
                      (key === "unknown"
                        ? data.summary.levelBreakdown?.unknown ?? 0
                        : 0);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLevelFilter(key)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                      levelFilter === key
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {levelFilterLabel(key)}
                    {key !== "all" && count > 0 && (
                      <span className="ml-1.5 tabular-nums opacity-80">({count})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Internship status</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "All students"],
                  ["letter_taken", "Took internship letter"],
                  ["placement_submitted", "Submitted official placement"],
                  ["internship_ended", "Internship completed"],
                  ["not_on_internship", "No placement submitted"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                    filter === key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {filteredGroups.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  No students match the selected filters.
                </CardContent>
              </Card>
            ) : (
              filteredGroups.map((group) => (
                <Card key={group.program} className="border-border/60">
                  <CardHeader className="border-b bg-muted/20 pb-4">
                    <CardTitle className="text-base">{group.program}</CardTitle>
                    <CardDescription>
                      {group.students.length} student{group.students.length !== 1 ? "s" : ""}
                      {group.prefixes.length > 0 && (
                        <span className="ml-2 font-mono text-xs">({group.prefixes.join(", ")})</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {group.students.map((s) => (
                        <div
                          key={s.id}
                          className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">
                                {s.firstName} {s.lastName}
                              </p>
                              <Badge variant="secondary" className="text-xs">
                                {s.levelLabel || "Unknown level"}
                              </Badge>
                            </div>
                            <p className="font-mono text-xs text-muted-foreground">{s.studentId}</p>
                            <p className="text-xs text-muted-foreground">{s.email}</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <Badge variant="outline" className="text-xs">
                                Letters: {s.approvedLetterCount || 0}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Internships: {s.internshipCount || 0}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Completed: {s.completedInternshipCount || 0}
                              </Badge>
                            </div>
                            {s.activePlacement?.organizationName && (
                              <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                                <p>{s.activePlacement.organizationName}</p>
                                {(s.activePlacement.internshipStartDate ||
                                  s.activePlacement.internshipEndDate) && (
                                  <p>
                                    {formatDate(s.activePlacement.internshipStartDate) || "Start N/A"}{" "}
                                    - {formatDate(s.activePlacement.internshipEndDate) || "End N/A"}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                            {statusBadge(s.internshipStatus, s.internshipLabel)}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => setArchiveTarget(s)}
                            >
                              <Archive className="h-3.5 w-3.5" />
                              Archive account
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      <Dialog
        open={!!archiveTarget}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive student account</DialogTitle>
            <DialogDescription>
              {archiveTarget
                ? `Archive ${archiveTarget.firstName} ${archiveTarget.lastName} (${archiveTarget.studentId})? They will be removed from the active list. Login email and student ID will remain visible on the Archived students page.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveTarget(null)} disabled={archiving}>
              Cancel
            </Button>
            <Button onClick={() => void handleArchive()} disabled={archiving}>
              {archiving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Archiving…
                </>
              ) : (
                "Archive account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
