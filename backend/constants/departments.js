/** Departments that exist in the system (aligned with student registration). */
const REGISTRATION_DEPARTMENTS = [
  'Nautical Science',
  'Marine Engineering',
  'Computer Science',
  'Information Technology',
];

function normalizeDepartmentName(input) {
  if (input == null || typeof input !== 'string') return '';
  const t = input.trim();
  if (!t) return '';
  const exact = REGISTRATION_DEPARTMENTS.find((d) => d.toLowerCase() === t.toLowerCase());
  return exact || '';
}

module.exports = { REGISTRATION_DEPARTMENTS, normalizeDepartmentName };
