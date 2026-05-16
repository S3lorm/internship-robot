/** @deprecated Use departmentCatalog — kept for imports that expect REGISTRATION_DEPARTMENTS */
const { DEPARTMENT_CATALOG, resolveCatalogDepartment, studentBelongsToHodDepartment, departmentMatch } =
  require('./departmentCatalog');

const REGISTRATION_DEPARTMENTS = DEPARTMENT_CATALOG.flatMap((d) => [d.name, ...(d.aliases || [])]).filter(
  (v, i, a) => a.indexOf(v) === i
);

function normalizeDepartmentName(input) {
  const dept = resolveCatalogDepartment(input);
  if (dept) return dept.name;
  if (input == null || typeof input !== 'string') return '';
  return input.trim();
}

module.exports = {
  REGISTRATION_DEPARTMENTS,
  normalizeDepartmentName,
  studentBelongsToHodDepartment,
  departmentMatch,
};
