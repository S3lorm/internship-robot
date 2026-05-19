export type LevelFilter = "all" | "1" | "2" | "3" | "4" | "unknown";

export function formatStudentLevel(yearOfStudy?: number | string | null) {
  const year = yearOfStudy != null ? Number(yearOfStudy) : NaN;
  if (!year || Number.isNaN(year)) {
    return { yearOfStudy: null as number | null, level: null as number | null, levelLabel: "Unknown level" };
  }
  return {
    yearOfStudy: year,
    level: year * 100,
    levelLabel: `Level ${year * 100} (Year ${year})`,
  };
}

export function levelFilterLabel(filter: LevelFilter) {
  if (filter === "all") return "All levels";
  if (filter === "unknown") return "Unknown level";
  const year = Number(filter);
  return `Year ${year} · Level ${year * 100}`;
}

export function studentMatchesLevelFilter(
  yearOfStudy: number | string | null | undefined,
  filter: LevelFilter
) {
  if (filter === "all") return true;
  if (filter === "unknown") {
    const year = yearOfStudy != null ? Number(yearOfStudy) : NaN;
    return !year || Number.isNaN(year);
  }
  return String(yearOfStudy) === filter;
}
