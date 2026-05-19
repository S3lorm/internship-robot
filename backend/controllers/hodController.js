const { User, InternshipPlacement, LetterRequest } = require('../models');
const {
  studentBelongsToHodDepartment,
  groupStudentsByProgram,
  getInternshipStatusForStudent,
  getStudentProgramGroup,
} = require('../constants/departmentCatalog');
const { getPortalStatusPayload } = require('../services/internshipPortalService');

const PLACEMENT_SUBMISSION_GRACE_DAYS = 14;

function mapStudentLevel(yearOfStudy) {
  const year = yearOfStudy != null ? Number(yearOfStudy) : null;
  if (!year || Number.isNaN(year)) {
    return { yearOfStudy: null, level: null, levelLabel: 'Unknown level' };
  }
  return {
    yearOfStudy: year,
    level: year * 100,
    levelLabel: `Level ${year * 100} (Year ${year})`,
  };
}

function isInCurrentPortalCycle(createdAt, portalPayload) {
  if (!portalPayload?.isOpen || !portalPayload.updatedAt) return true;
  if (!createdAt) return false;
  const createdTime = new Date(createdAt).getTime();
  const portalTime = new Date(portalPayload.updatedAt).getTime();
  if (Number.isNaN(createdTime) || Number.isNaN(portalTime)) return true;
  return createdTime >= portalTime;
}

function isPlacementSubmissionGraceOver(portalPayload) {
  if (!portalPayload?.isOpen || !portalPayload.updatedAt) return false;
  const openedAt = new Date(portalPayload.updatedAt).getTime();
  if (Number.isNaN(openedAt)) return false;
  return Date.now() - openedAt >= PLACEMENT_SUBMISSION_GRACE_DAYS * 24 * 60 * 60 * 1000;
}

async function getDepartmentStudents(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'hod' || !user.department) {
      return res.status(403).json({ message: 'Department staff access only' });
    }

    const hodDepartment = user.department;
    const portalPayload = await getPortalStatusPayload();
    const placementGraceOver = isPlacementSubmissionGraceOver(portalPayload);

    const { rows: allStudents } = await User.findAndCountAll({
      where: { role: 'student', isActive: true, isEmailVerified: true },
      attributes: { exclude: ['password'] },
      limit: 5000,
      offset: 0,
      order: [['created_at', 'DESC']],
    });

    const students = allStudents.filter((s) => studentBelongsToHodDepartment(s, hodDepartment));

    const studentIds = students.map((s) => s.id);
    const placementsByStudent = new Map();
    const letterCountByStudent = new Map();
    const approvedLetterCountByStudent = new Map();
    const completedInternshipCountByStudent = new Map();
    const internshipCountByStudent = new Map();

    if (studentIds.length > 0) {
      const allPlacements = await InternshipPlacement.findAll({});
      for (const p of allPlacements) {
        if (!studentIds.includes(p.studentId)) continue;
        if (!isInCurrentPortalCycle(p.createdAt, portalPayload)) continue;
        if (!placementsByStudent.has(p.studentId)) placementsByStudent.set(p.studentId, []);
        placementsByStudent.get(p.studentId).push(p);
        if (p.status === 'approved') {
          internshipCountByStudent.set(p.studentId, (internshipCountByStudent.get(p.studentId) || 0) + 1);
          if (p.internshipEndDate) {
            const end = new Date(p.internshipEndDate);
            if (!Number.isNaN(end.getTime())) {
              end.setHours(23, 59, 59, 999);
              if (Date.now() > end.getTime()) {
                completedInternshipCountByStudent.set(
                  p.studentId,
                  (completedInternshipCountByStudent.get(p.studentId) || 0) + 1
                );
              }
            }
          }
        }
      }

      const allLetters = await LetterRequest.findAll({});
      for (const lr of allLetters) {
        if (!studentIds.includes(lr.studentId)) continue;
        const type = lr.requestType || 'general';
        if (type !== 'general' && type !== 'admin') continue;
        letterCountByStudent.set(lr.studentId, (letterCountByStudent.get(lr.studentId) || 0) + 1);
        if (lr.status === 'approved' && isInCurrentPortalCycle(lr.createdAt, portalPayload)) {
          approvedLetterCountByStudent.set(
            lr.studentId,
            (approvedLetterCountByStudent.get(lr.studentId) || 0) + 1
          );
        }
      }
    }

    const enriched = students.map((s) => {
      const placements = placementsByStudent.get(s.id) || [];
      const hasPlacementSubmission = placements.length > 0;
      const missedPlacementSubmission = placementGraceOver && !hasPlacementSubmission;
      const approvedLetterCount = approvedLetterCountByStudent.get(s.id) || 0;
      const internship = missedPlacementSubmission
        ? {
            status: 'not_on_internship',
            label: 'No placement submitted',
          }
        : hasPlacementSubmission
          ? getInternshipStatusForStudent(placements)
          : approvedLetterCount > 0
            ? {
                status: 'placement_window_open',
                label: 'Awaiting official placement submission',
            }
            : {
                status: 'letter_not_taken',
                label: 'No internship letter yet',
            };
      const levelInfo = mapStudentLevel(s.yearOfStudy);
      return {
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        studentId: s.studentId,
        email: s.email,
        phone: s.phone || null,
        department: s.department,
        program: s.program,
        programGroup: getStudentProgramGroup(s, hodDepartment),
        yearOfStudy: levelInfo.yearOfStudy,
        level: levelInfo.level,
        levelLabel: levelInfo.levelLabel,
        internshipStatus: internship.status,
        internshipLabel: internship.label,
        activePlacement: internship.organizationName
          ? {
              organizationName: internship.organizationName,
              internshipStartDate: internship.internshipStartDate,
              internshipEndDate: internship.internshipEndDate,
            }
          : null,
        letterRequestCount: letterCountByStudent.get(s.id) || 0,
        approvedLetterCount,
        hasTakenInternshipLetter: approvedLetterCount > 0,
        completedInternshipCount: completedInternshipCountByStudent.get(s.id) || 0,
        internshipCount: internshipCountByStudent.get(s.id) || 0,
        hasPlacementSubmission,
        missedPlacementSubmission,
        placementCategory: missedPlacementSubmission
          ? 'no_placement_submitted'
          : internship.status === 'internship_ended'
            ? 'internship_ended'
            : hasPlacementSubmission
              ? 'placement_submitted'
              : 'awaiting_submission_window',
      };
    });

    const groups = groupStudentsByProgram(enriched, hodDepartment).map((g) => ({
      program: g.program,
      prefixes: g.prefixes,
      students: g.students.sort((a, b) =>
        String(a.lastName || '').localeCompare(String(b.lastName || ''))
      ),
    }));

    const onInternship = enriched.filter((s) => s.internshipStatus === 'on_internship').length;
    const notOnInternship = enriched.filter((s) => s.missedPlacementSubmission).length;
    const placementPending = enriched.filter((s) => s.internshipStatus === 'placement_pending').length;
    const placementSubmitted = enriched.filter((s) => s.placementCategory === 'placement_submitted').length;
    const tookInternshipLetters = enriched.filter((s) => s.hasTakenInternshipLetter).length;
    const completedInternships = enriched.filter((s) => s.completedInternshipCount > 0).length;
    const levelBreakdown = enriched.reduce((acc, s) => {
      const key = s.yearOfStudy != null ? String(s.yearOfStudy) : 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return res.json({
      department: hodDepartment,
      summary: {
        totalStudents: enriched.length,
        levelBreakdown,
        tookInternshipLetters,
        completedInternships,
        placementSubmitted,
        onInternship,
        notOnInternship,
        placementPending,
        internshipEnded: enriched.filter((s) => s.internshipStatus === 'internship_ended').length,
        placementSubmissionGraceDays: PLACEMENT_SUBMISSION_GRACE_DAYS,
        placementSubmissionGraceOver: placementGraceOver,
        portalOpenedAt: portalPayload.updatedAt,
      },
      groups,
    });
  } catch (error) {
    console.error('getDepartmentStudents error:', error);
    return res.status(500).json({ message: 'Failed to load department students' });
  }
}

async function getArchivedDepartmentStudents(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'hod' || !user.department) {
      return res.status(403).json({ message: 'Department staff access only' });
    }

    const hodDepartment = user.department;
    const { rows: allStudents } = await User.findAndCountAll({
      where: { role: 'student', isActive: false },
      limit: 5000,
      offset: 0,
      order: [['updated_at', 'DESC']],
    });

    const students = allStudents
      .filter((s) => studentBelongsToHodDepartment(s, hodDepartment))
      .map((s) => {
        const levelInfo = mapStudentLevel(s.yearOfStudy);
        return {
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          studentId: s.studentId,
          email: s.email,
          phone: s.phone || null,
          program: s.program,
          programGroup: getStudentProgramGroup(s, hodDepartment),
          yearOfStudy: levelInfo.yearOfStudy,
          level: levelInfo.level,
          levelLabel: levelInfo.levelLabel,
          archivedAt: s.updatedAt,
          isEmailVerified: s.isEmailVerified,
        };
      });

    const groups = groupStudentsByProgram(students, hodDepartment).map((g) => ({
      program: g.program,
      prefixes: g.prefixes,
      students: g.students.sort((a, b) =>
        String(a.lastName || '').localeCompare(String(b.lastName || ''))
      ),
    }));

    return res.json({
      department: hodDepartment,
      summary: { totalArchived: students.length },
      groups,
    });
  } catch (error) {
    console.error('getArchivedDepartmentStudents error:', error);
    return res.status(500).json({ message: 'Failed to load archived students' });
  }
}

async function archiveDepartmentStudent(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'hod' || !user.department) {
      return res.status(403).json({ message: 'Department staff access only' });
    }

    const student = await User.findByPk(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }
    if (!studentBelongsToHodDepartment(student, user.department)) {
      return res.status(403).json({ message: 'Student is not in your department' });
    }
    if (!student.isActive) {
      return res.status(400).json({ message: 'Student is already archived' });
    }

    student.isActive = false;
    await student.save();

    const levelInfo = mapStudentLevel(student.yearOfStudy);
    const safe = student.toJSON();
    return res.json({
      message: 'Student account archived',
      student: {
        id: safe.id,
        firstName: safe.firstName,
        lastName: safe.lastName,
        studentId: safe.studentId,
        email: safe.email,
        phone: safe.phone || null,
        program: safe.program,
        yearOfStudy: levelInfo.yearOfStudy,
        level: levelInfo.level,
        levelLabel: levelInfo.levelLabel,
        archivedAt: safe.updatedAt,
      },
    });
  } catch (error) {
    console.error('archiveDepartmentStudent error:', error);
    return res.status(500).json({ message: 'Failed to archive student' });
  }
}

module.exports = {
  getDepartmentStudents,
  getArchivedDepartmentStudents,
  archiveDepartmentStudent,
};
