/** Client mirror of backend/constants/departmentCatalog.js for UI grouping */

export type CatalogProgram = { name: string; prefixes: string[] };

export type CatalogDepartment = {
  name: string;
  aliases: string[];
  programs: CatalogProgram[];
};

export const DEPARTMENT_CATALOG: CatalogDepartment[] = [
  {
    name: "Marine Engineering Department",
    aliases: ["Marine Engineering"],
    programs: [
      { name: "B.Sc. Marine Engineering", prefixes: ["BME"] },
      { name: "Diploma in Marine Engineering", prefixes: ["DME"] },
      { name: "B.Sc. Naval Architecture", prefixes: ["BNA"] },
      { name: "B.Sc. Mechanical Engineering", prefixes: ["BMA"] },
    ],
  },
  {
    name: "Computer Engineering Department",
    aliases: ["Computer Engineering", "Computer Science"],
    programs: [
      { name: "B.Sc. Marine Electrical & Electronics", prefixes: ["BEE"] },
      { name: "Diploma in Marine Electrical & Electronics", prefixes: ["DEE"] },
      { name: "B.Sc. Computer Engineering", prefixes: ["BCE"] },
    ],
  },
  {
    name: "Information and Communications Technology Department",
    aliases: ["Information Technology", "ICT"],
    programs: [
      { name: "B.Sc. Information Technology", prefixes: ["BIT"] },
      { name: "Diploma in Information Technology", prefixes: ["DIT"] },
      { name: "B.Sc. Computer Science", prefixes: ["BCS"] },
    ],
  },
  {
    name: "Nautical Science Department",
    aliases: ["Nautical Science"],
    programs: [
      { name: "B.Sc. Nautical Science", prefixes: ["BNS"] },
      { name: "Diploma in Nautical Science", prefixes: ["DNS"] },
    ],
  },
  {
    name: "Department of Transport, Port & Shipping Administration",
    aliases: ["Transport", "Port & Shipping Administration"],
    programs: [
      { name: "B.Sc. Logistics Management", prefixes: ["BLM"] },
      { name: "B.Sc. Port & Shipping Administration", prefixes: ["BPS"] },
      { name: "Diploma in Port & Shipping Administration", prefixes: ["DPS"] },
    ],
  },
];

function norm(s: string) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function studentIdPrefix(studentId?: string) {
  const u = String(studentId ?? "")
    .toUpperCase()
    .replace(/\s/g, "");
  const m = u.match(/^([A-Z]{2,4})/);
  return m ? m[1] : "";
}

function findCatalogDepartment(input?: string) {
  const n = norm(input || "");
  if (!n) return null;
  for (const dept of DEPARTMENT_CATALOG) {
    if (norm(dept.name) === n) return dept;
    for (const alias of dept.aliases) {
      if (norm(alias) === n) return dept;
    }
  }
  return null;
}

export function getStudentProgramGroup(
  student: { program?: string; studentId?: string },
  hodDepartment?: string
): string {
  const dept = findCatalogDepartment(hodDepartment);
  if (!dept) {
    return student.program?.trim() || studentIdPrefix(student.studentId) || "Other";
  }
  const progNorm = norm(student.program || "");
  const matchByName = dept.programs.find((p) => norm(p.name) === progNorm);
  if (matchByName) return matchByName.name;
  const prefix = studentIdPrefix(student.studentId);
  if (prefix) {
    const matchByPrefix = dept.programs.find((p) => p.prefixes.includes(prefix));
    if (matchByPrefix) return matchByPrefix.name;
  }
  return student.program?.trim() || prefix || "Other";
}

export function groupByProgram<T extends { program?: string; studentId?: string }>(
  items: T[],
  hodDepartment: string,
  getStudent: (item: T) => { program?: string; studentId?: string }
): { program: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  const dept = findCatalogDepartment(hodDepartment);
  if (dept) {
    for (const p of dept.programs) map.set(p.name, []);
  }
  map.set("Other", []);

  for (const item of items) {
    const key = getStudentProgramGroup(getStudent(item), hodDepartment);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }

  const out: { program: string; items: T[] }[] = [];
  if (dept) {
    for (const p of dept.programs) {
      const items = map.get(p.name) || [];
      if (items.length > 0) out.push({ program: p.name, items });
    }
  }
  const other = map.get("Other") || [];
  if (other.length > 0) out.push({ program: "Other", items: other });
  return out;
}
