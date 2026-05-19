"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Archive, ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ArchivedStudent = {
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
  levelLabel: string;
  archivedAt?: string;
  isEmailVerified?: boolean;
};

type ProgramGroup = {
  program: string;
  prefixes: string[];
  students: ArchivedStudent[];
};

type ArchivedPayload = {
  department: string;
  summary: { totalArchived: number };
  groups: ProgramGroup[];
};

const LEVEL_FILTERS: LevelFilter[] = ["all", "1", "2", "3", "4", "unknown"];

function formatDate(date?: string) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ArchivedDepartmentStudentsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<ArchivedPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");

  useEffect(() => {
    if (user?.role !== "hod") return;
    void (async () => {
      setLoading(true);
      const res = await hodApi.getArchivedDepartmentStudents();
      if (res.data) setData(res.data as ArchivedPayload);
      setLoading(false);
    })();
  }, [user?.role, user?.department]);

  const filteredGroups = useMemo(() => {
    if (!data) return [];
    return data.groups
      .map((g) => ({
        ...g,
        students: g.students.filter((s) =>
          studentMatchesLevelFilter(s.yearOfStudy, levelFilter)
        ),
      }))
      .filter((g) => g.students.length > 0);
  }, [data, levelFilter]);

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/department-students"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to active students
          </Link>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Archived students</h1>
          <p className="mt-1 text-muted-foreground">
            Archived accounts in {data?.department || user.department}. Login credentials are listed
            for department records. Passwords cannot be retrieved after registration.
          </p>
        </div>
      </div>

      <DepartmentStudentsNav archivedCount={data?.summary.totalArchived} />

      {data && (
        <>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <Archive className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold tabular-nums">{data.summary.totalArchived}</p>
                <p className="text-sm text-muted-foreground">Archived student accounts</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            {LEVEL_FILTERS.map((key) => (
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
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {filteredGroups.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  No archived students match this level filter.
                </CardContent>
              </Card>
            ) : (
              filteredGroups.map((group) => (
                <Card key={group.program} className="border-border/60">
                  <CardHeader className="border-b bg-muted/20 pb-4">
                    <CardTitle className="text-base">{group.program}</CardTitle>
                    <CardDescription>
                      {group.students.length} archived student
                      {group.students.length !== 1 ? "s" : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Level</TableHead>
                            <TableHead>Login email</TableHead>
                            <TableHead>Student ID</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Archived</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.students.map((s) => (
                            <TableRow key={s.id}>
                              <TableCell>
                                <p className="font-medium">
                                  {s.firstName} {s.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">{s.programGroup}</p>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{s.levelLabel}</Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs">{s.email}</TableCell>
                              <TableCell className="font-mono text-xs">{s.studentId}</TableCell>
                              <TableCell className="text-sm">{s.phone || "—"}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(s.archivedAt)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
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
