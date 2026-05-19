"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Archive, Users } from "lucide-react";

export function DepartmentStudentsNav({ archivedCount }: { archivedCount?: number }) {
  const pathname = usePathname();
  const onArchived = pathname.includes("/department-students/archived");

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/admin/department-students"
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
          !onArchived
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-muted-foreground hover:bg-muted"
        )}
      >
        <Users className="h-4 w-4" />
        Active students
      </Link>
      <Link
        href="/admin/department-students/archived"
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
          onArchived
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-muted-foreground hover:bg-muted"
        )}
      >
        <Archive className="h-4 w-4" />
        Archived students
        {archivedCount != null && archivedCount > 0 && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs tabular-nums",
              onArchived ? "bg-primary-foreground/20" : "bg-muted text-foreground"
            )}
          >
            {archivedCount}
          </span>
        )}
      </Link>
    </div>
  );
}
