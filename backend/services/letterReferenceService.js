const supabase = require('../config/supabase');
const { resolveCatalogDepartment } = require('../constants/departmentCatalog');

const FIXED_PREFIX = 'RMU';
const FIXED_MIDDLE = '1223';

/** Fallback when DB column is not seeded yet */
const DEPARTMENT_REF_CODE_FALLBACK = {
  'Marine Engineering Department': '01',
  'Computer Engineering Department': '02',
  'Information and Communications Technology Department': '03',
  'Nautical Science Department': '04',
  'Department of Transport, Port & Shipping Administration': '05',
};

function padDeptCode(code) {
  const digits = String(code ?? '')
    .replace(/\D/g, '')
    .slice(-2);
  if (digits.length >= 2) return digits.padStart(2, '0').slice(-2);
  const raw = String(code ?? '')
    .trim()
    .toUpperCase()
    .slice(0, 2);
  if (raw.length === 2) return raw;
  return '00';
}

async function resolveDepartmentRefCode(studentDepartment) {
  const catalogDept = resolveCatalogDepartment(studentDepartment);
  const deptName = catalogDept?.name || studentDepartment;

  if (deptName) {
    const { data: row } = await supabase
      .from('departments')
      .select('letter_reference_dept_code, name')
      .eq('name', deptName)
      .maybeSingle();

    if (row?.letter_reference_dept_code) {
      return padDeptCode(row.letter_reference_dept_code);
    }
  }

  if (deptName && DEPARTMENT_REF_CODE_FALLBACK[deptName]) {
    return DEPARTMENT_REF_CODE_FALLBACK[deptName];
  }

  for (const [name, code] of Object.entries(DEPARTMENT_REF_CODE_FALLBACK)) {
    if (deptName && name.toLowerCase().includes(String(deptName).toLowerCase().slice(0, 12))) {
      return code;
    }
  }

  return '00';
}

async function getNextSequenceForDept(deptCode) {
  const pattern = `${FIXED_PREFIX}/${deptCode}/${FIXED_MIDDLE}/%`;
  const { data: existingRefs } = await supabase
    .from('letter_requests')
    .select('reference_number')
    .like('reference_number', pattern);

  let seqNum = 1;
  if (existingRefs?.length) {
    const nums = existingRefs
      .map((r) => {
        const match = String(r.reference_number || '').match(/\/([0-9]{2})$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !Number.isNaN(n) && n > 0);
    seqNum = (nums.length ? Math.max(...nums) : 0) + 1;
  }

  if (seqNum > 99) seqNum = 1;
  return String(seqNum).padStart(2, '0');
}

/**
 * Full reference e.g. RMU/05/1223/98
 */
async function generateLetterReferenceNumber(studentDepartment) {
  const deptCode = await resolveDepartmentRefCode(studentDepartment);
  const seq = await getNextSequenceForDept(deptCode);
  return `${FIXED_PREFIX}/${deptCode}/${FIXED_MIDDLE}/${seq}`;
}

function formatLetterRefDisplay(referenceNumber) {
  if (!referenceNumber) return `${FIXED_PREFIX}/00/${FIXED_MIDDLE}/00`;
  const ref = String(referenceNumber).trim();
  if (ref.startsWith(`${FIXED_PREFIX}/`)) return ref;
  return ref;
}

function isLegacyLetterReference(referenceNumber) {
  if (!referenceNumber) return true;
  const ref = String(referenceNumber).trim();
  return !ref.startsWith(`${FIXED_PREFIX}/`);
}

/** Upgrade a single letter request from legacy LR-* to RMU/{dept}/1223/{seq}. */
async function ensureLetterRequestReference(letterRequest, studentDepartment) {
  if (!letterRequest?.id || !isLegacyLetterReference(letterRequest.referenceNumber)) {
    return letterRequest;
  }

  const newRef = await generateLetterReferenceNumber(studentDepartment);
  const oldRef = letterRequest.referenceNumber;

  if (oldRef) {
    await supabase
      .from('document_verification')
      .update({ reference_number: newRef })
      .eq('document_type', 'letter')
      .eq('document_id', letterRequest.id)
      .eq('reference_number', oldRef);
  }

  const { error } = await supabase
    .from('letter_requests')
    .update({ reference_number: newRef })
    .eq('id', letterRequest.id);

  if (error) throw error;

  return { ...letterRequest, referenceNumber: newRef };
}

/**
 * Reassign RMU-format references for all legacy letter requests (and sync document_verification).
 */
async function backfillLegacyLetterReferences({ dryRun = false } = {}) {
  const { data: rows, error } = await supabase
    .from('letter_requests')
    .select('id, reference_number, student_id, created_at')
    .order('created_at', { ascending: true });

  if (error) throw error;

  const legacy = (rows || []).filter((r) => isLegacyLetterReference(r.reference_number));
  if (!legacy.length) {
    return { updated: 0, skipped: 0, dryRun };
  }

  const studentIds = [...new Set(legacy.map((r) => r.student_id).filter(Boolean))];
  const { data: students } = await supabase
    .from('user_profiles')
    .select('id, department')
    .in('id', studentIds);

  const deptByStudent = new Map((students || []).map((s) => [s.id, s.department]));

  let updated = 0;
  const planned = [];

  for (const row of legacy) {
    const studentDepartment = deptByStudent.get(row.student_id);
    const newRef = await generateLetterReferenceNumber(studentDepartment);
    planned.push({ id: row.id, oldRef: row.reference_number, newRef });

    if (!dryRun) {
      if (row.reference_number) {
        await supabase
          .from('document_verification')
          .update({ reference_number: newRef })
          .eq('document_type', 'letter')
          .eq('document_id', row.id)
          .eq('reference_number', row.reference_number);
      }

      const { error: updateError } = await supabase
        .from('letter_requests')
        .update({ reference_number: newRef })
        .eq('id', row.id);

      if (updateError) throw updateError;
      updated += 1;
    }
  }

  return { updated: dryRun ? 0 : updated, planned: dryRun ? planned : undefined, dryRun };
}

module.exports = {
  FIXED_PREFIX,
  FIXED_MIDDLE,
  generateLetterReferenceNumber,
  formatLetterRefDisplay,
  resolveDepartmentRefCode,
  isLegacyLetterReference,
  ensureLetterRequestReference,
  backfillLegacyLetterReferences,
};
