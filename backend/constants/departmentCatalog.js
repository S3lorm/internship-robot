/**
 * Department ↔ program catalog (aligned with supabase/migrations/019_department_program_catalog.sql).
 * Used to scope HOD/Secretary visibility by student course/program, not department string alone.
 */

const DEPARTMENT_CATALOG = [
  {
    name: 'Marine Engineering Department',
    aliases: ['Marine Engineering'],
    programs: [
      { name: 'B.Sc. Marine Engineering', prefixes: ['BME'] },
      { name: 'Diploma in Marine Engineering', prefixes: ['DME'] },
      { name: 'B.Sc. Naval Architecture', prefixes: ['BNA'] },
      { name: 'B.Sc. Mechanical Engineering', prefixes: ['BMA'] },
    ],
  },
  {
    name: 'Computer Engineering Department',
    aliases: ['Computer Engineering', 'Computer Science'],
    programs: [
      { name: 'B.Sc. Marine Electrical & Electronics', prefixes: ['BEE'] },
      { name: 'Diploma in Marine Electrical & Electronics', prefixes: ['DEE'] },
      { name: 'B.Sc. Computer Engineering', prefixes: ['BCE'] },
    ],
  },
  {
    name: 'Information and Communications Technology Department',
    aliases: ['Information Technology', 'ICT'],
    programs: [
      { name: 'B.Sc. Information Technology', prefixes: ['BIT'] },
      { name: 'Diploma in Information Technology', prefixes: ['DIT'] },
      { name: 'B.Sc. Computer Science', prefixes: ['BCS'] },
    ],
  },
  {
    name: 'Nautical Science Department',
    aliases: ['Nautical Science'],
    programs: [
      { name: 'B.Sc. Nautical Science', prefixes: ['BNS'] },
      { name: 'Diploma in Nautical Science', prefixes: ['DNS'] },
    ],
  },
  {
    name: 'Department of Transport, Port & Shipping Administration',
    aliases: ['Transport', 'Port & Shipping Administration', 'Port and Shipping Administration'],
    programs: [
      { name: 'B.Sc. Logistics Management', prefixes: ['BLM'] },
      { name: 'B.Sc. Port & Shipping Administration', prefixes: ['BPS'] },
      { name: 'Diploma in Port & Shipping Administration', prefixes: ['DPS'] },
    ],
  },
];

function norm(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function studentIdPrefix(studentId) {
  const u = String(studentId ?? '')
    .toUpperCase()
    .replace(/\s/g, '');
  const m = u.match(/^([A-Z]{2,4})/);
  return m ? m[1] : '';
}

function findCatalogDepartment(input) {
  const n = norm(input);
  if (!n) return null;
  for (const dept of DEPARTMENT_CATALOG) {
    if (norm(dept.name) === n) return dept;
    for (const alias of dept.aliases || []) {
      if (norm(alias) === n) return dept;
    }
    if (n.includes('marine eng') && dept.name.includes('Marine Engineering')) return dept;
    if (n.includes('nautical') && dept.name.includes('Nautical Science')) return dept;
    if (
      (n.includes('information') || n.includes('ict')) &&
      dept.name.includes('Information and Communications')
    ) {
      return dept;
    }
    if (n.includes('computer eng') && dept.name.includes('Computer Engineering')) return dept;
    if (n.includes('transport') || n.includes('port') || n.includes('shipping') || n.includes('logistics')) {
      if (dept.name.includes('Transport')) return dept;
    }
  }
  return null;
}

function findProgramInDepartment(dept, { program, studentId }) {
  if (!dept) return null;
  const progNorm = norm(program);
  if (progNorm) {
    const byName = dept.programs.find((p) => norm(p.name) === progNorm);
    if (byName) return byName;
  }
  const prefix = studentIdPrefix(studentId);
  if (prefix) {
    return dept.programs.find((p) => (p.prefixes || []).includes(prefix)) || null;
  }
  return null;
}

function resolveCatalogDepartment(input) {
  return findCatalogDepartment(input);
}

function getProgramsForDepartment(departmentInput) {
  const dept = findCatalogDepartment(departmentInput);
  return dept ? dept.programs : [];
}

function studentBelongsToHodDepartment(student, hodDepartment) {
  if (!student || !hodDepartment) return false;
  const dept = findCatalogDepartment(hodDepartment);
  if (!dept) {
    return norm(student.department) === norm(hodDepartment);
  }
  if (norm(student.department) === norm(dept.name)) return true;
  for (const alias of dept.aliases || []) {
    if (norm(student.department) === norm(alias)) return true;
  }
  if (findProgramInDepartment(dept, student)) return true;
  return false;
}

function departmentMatch(studentDepartment, hodDepartment) {
  return studentBelongsToHodDepartment(
    { department: studentDepartment, program: '', studentId: '' },
    hodDepartment
  );
}

function getStudentProgramGroup(student, hodDepartment) {
  const dept = findCatalogDepartment(hodDepartment);
  if (!dept) {
    return student?.program?.trim() || studentIdPrefix(student?.studentId) || 'Other';
  }
  const match = findProgramInDepartment(dept, student || {});
  if (match) return match.name;
  if (student?.program?.trim()) return student.program.trim();
  const prefix = studentIdPrefix(student?.studentId);
  return prefix || 'Other';
}

function endOfPlacementDay(dateStr) {
  const end = new Date(dateStr);
  if (Number.isNaN(end.getTime())) return null;
  end.setHours(23, 59, 59, 999);
  return end;
}

function isApprovedPlacementActive(placement) {
  if (!placement || placement.status !== 'approved') return false;
  if (!placement.internshipEndDate) return true;
  const end = endOfPlacementDay(placement.internshipEndDate);
  return end ? Date.now() <= end.getTime() : true;
}

function getInternshipStatusForStudent(placements) {
  const list = Array.isArray(placements) ? placements : [];
  const active = list.find((p) => isApprovedPlacementActive(p));
  if (active) {
    return {
      status: 'on_internship',
      label: 'On internship',
      placementId: active.id,
      organizationName: active.organizationName,
      internshipStartDate: active.internshipStartDate,
      internshipEndDate: active.internshipEndDate,
    };
  }
  const pending = list.find((p) => p.status === 'pending' || p.status === 'modification_requested');
  if (pending) {
    return {
      status: 'placement_pending',
      label: 'Placement awaiting review',
      placementId: pending.id,
      organizationName: pending.organizationName,
      internshipStartDate: pending.internshipStartDate,
      internshipEndDate: pending.internshipEndDate,
    };
  }
  const approved = list
    .filter((p) => p.status === 'approved')
    .sort((a, b) => new Date(b.internshipEndDate || b.updatedAt || 0) - new Date(a.internshipEndDate || a.updatedAt || 0));
  if (approved.length > 0) {
    const latest = approved[0];
    return {
      status: 'internship_ended',
      label: 'Internship completed',
      placementId: latest.id,
      organizationName: latest.organizationName,
      internshipStartDate: latest.internshipStartDate,
      internshipEndDate: latest.internshipEndDate,
    };
  }
  if (list.some((p) => p.status === 'rejected')) {
    return { status: 'not_on_internship', label: 'Not on internship' };
  }
  return { status: 'not_on_internship', label: 'Not on internship' };
}

function groupStudentsByProgram(students, hodDepartment) {
  const dept = findCatalogDepartment(hodDepartment);
  const groups = new Map();

  if (dept) {
    for (const prog of dept.programs) {
      groups.set(prog.name, { program: prog.name, prefixes: [...(prog.prefixes || [])], students: [] });
    }
  }
  groups.set('Other', { program: 'Other', prefixes: [], students: [] });

  for (const student of students) {
    const key = getStudentProgramGroup(student, hodDepartment);
    if (!groups.has(key)) {
      groups.set(key, { program: key, prefixes: [], students: [] });
    }
    groups.get(key).students.push(student);
  }

  const ordered = [];
  if (dept) {
    for (const prog of dept.programs) {
      const g = groups.get(prog.name);
      if (g) ordered.push(g);
    }
  }
  const other = groups.get('Other');
  if (other && other.students.length > 0) ordered.push(other);
  for (const [name, g] of groups) {
    if (dept?.programs.some((p) => p.name === name)) continue;
    if (name === 'Other') continue;
    if (g.students.length > 0) ordered.push(g);
  }

  return ordered;
}

module.exports = {
  DEPARTMENT_CATALOG,
  resolveCatalogDepartment,
  getProgramsForDepartment,
  studentBelongsToHodDepartment,
  departmentMatch,
  getStudentProgramGroup,
  studentIdPrefix,
  isApprovedPlacementActive,
  getInternshipStatusForStudent,
  groupStudentsByProgram,
};
