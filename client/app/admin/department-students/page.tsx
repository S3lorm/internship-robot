"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { hodApi } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Briefcase, UserX } from "lucide-react";
import { cn } from "@/lib/utils";

type DeptStudent = {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  email: string;
  program: string;
  programGroup: string;
  yearOfStudy?: string;
  internshipStatus: string;
  internshipLabel: string;
  activePlacement?: { organizationName: string } | null;
};

type ProgramGroup = {
  program: string;
  prefixes: string[];
  students: DeptStudent[];
};

type DeptPayload = {
  department: string;
  summary: {
    totalStudents: number;
    onInternship: number;
    notOnInternship: number;
    placementPending: number;
    internshipEnded: number;
  };
  groups: ProgramGroup[];
};

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
  return (
    <Badge variant="outline" className="text-muted-foreground">
      {label}
    </Badge>
  );
}

export default function DepartmentStudentsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DeptPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "on_internship" | "not_on_internship">("all");

  useEffect(() => {
    if (user?.role !== "hod") return;
    void (async () => {
      setLoading(true);
      const res = await hodApi.getDepartmentStudents();
      if (res.data) setData(res.data as DeptPayload);
      setLoading(false);
    })();
  }, [user?.role, user?.department]);

  const filteredGroups = useMemo(() => {
    if (!data) return [];
    return data.groups
      .map((g) => ({
        ...g,
        students: g.students.filter((s) => {
          if (filter === "on_internship") return s.internshipStatus === "on_internship";
          if (filter === "not_on_internship")
            return s.internshipStatus === "not_on_internship" || s.internshipStatus === "internship_ended";
          return true;
        }),
      }))
      .filter((g) => g.students.length > 0);
  }, [data, filter]);

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
          All registered students in {data?.department || user.department}, grouped by course. Internship status is
          based on approved official placements.
        </p>
      </div>

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
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
                <Briefcase className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold tabular-nums">{data.summary.onInternship}</p>
                  <p className="text-sm text-muted-foreground">On internship</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <UserX className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold tabular-nums">{data.summary.notOnInternship}</p>
                  <p className="text-sm text-muted-foreground">Not on internship</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All students"],
                ["on_internship", "On internship"],
                ["not_on_internship", "Not on internship"],
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

          <div className="space-y-6">
            {filteredGroups.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  No students match this filter.
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
                          className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="font-medium">
                              {s.firstName} {s.lastName}
                            </p>
                            <p className="font-mono text-xs text-muted-foreground">{s.studentId}</p>
                            {s.activePlacement?.organizationName && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {s.activePlacement.organizationName}
                              </p>
                            )}
                          </div>
                          {statusBadge(s.internshipStatus, s.internshipLabel)}
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
    </div>
  );
}
