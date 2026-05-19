const express = require('express');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');
const hodController = require('../controllers/hodController');

const router = express.Router();

router.use(auth);
router.get('/department-students', checkRole('hod'), hodController.getDepartmentStudents);
router.get(
  '/department-students/archived',
  checkRole('hod'),
  hodController.getArchivedDepartmentStudents
);
router.patch(
  '/department-students/:id/archive',
  checkRole('hod'),
  hodController.archiveDepartmentStudent
);

module.exports = router;
