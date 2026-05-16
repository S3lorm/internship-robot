const express = require('express');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');
const hodController = require('../controllers/hodController');

const router = express.Router();

router.use(auth);
router.get('/department-students', checkRole('hod'), hodController.getDepartmentStudents);

module.exports = router;
