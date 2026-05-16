const { User, InternshipPlacement, LetterRequest } = require('../models');
const {
  studentBelongsToHodDepartment,
  groupStudentsByProgram,
  getInternshipStatusForStudent,
  getStudentProgramGroup,
} = require('../constants/departmentCatalog');

async function getDepartmentStudents(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'hod' || !user.department) {
      return res.status(403).json({ message: 'Department staff access only' });
    }

    const hodDepartment = user.department;

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

    if (studentIds.length > 0) {
      const allPlacements = await InternshipPlacement.findAll({});
      for (const p of allPlacements) {
        if (!studentIds.includes(p.studentId)) continue;
        if (!placementsByStudent.has(p.studentId)) placementsByStudent.set(p.studentId, []);
        placementsByStudent.get(p.studentId).push(p);
      }

      const allLetters = await LetterRequest.findAll({});
      for (const lr of allLetters) {
        if (!studentIds.includes(lr.studentId)) continue;
        const type = lr.requestType || 'general';
        if (type !== 'general' && type !== 'admin') continue;
        letterCountByStudent.set(lr.studentId, (letterCountByStudent.get(lr.studentId) || 0) + 1);
      }
    }

    const enriched = students.map((s) => {
      const placements = placementsByStudent.get(s.id) || [];
      const internship = getInternshipStatusForStudent(placements);
      return {
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        studentId: s.studentId,
        email: s.email,
        department: s.department,
        program: s.program,
        programGroup: getStudentProgramGroup(s, hodDepartment),
        yearOfStudy: s.yearOfStudy,
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
    const notOnInternship = enriched.filter((s) => s.internshipStatus === 'not_on_internship').length;
    const placementPending = enriched.filter((s) => s.internshipStatus === 'placement_pending').length;

    return res.json({
      department: hodDepartment,
      summary: {
        totalStudents: enriched.length,
        onInternship,
        notOnInternship,
        placementPending,
        internshipEnded: enriched.filter((s) => s.internshipStatus === 'internship_ended').length,
      },
      groups,
    });
  } catch (error) {
    console.error('getDepartmentStudents error:', error);
    return res.status(500).json({ message: 'Failed to load department students' });
  }
}

module.exports = {
  getDepartmentStudents,
};
