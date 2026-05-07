const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/weeklyLogbookController');

router.use(auth);

router.get('/my/current', controller.getMyLogbook);
router.get('/staff/reviews', controller.listStaffLogbooks);
router.get('/:id', controller.getLogbook);
router.post('/:id/weeks', controller.saveWeek);
router.post('/:id/finalize', controller.finalizeLogbook);
router.patch('/:id/institutional-review', controller.staffDecision);
router.get('/:id/pdf', controller.exportPdf);

module.exports = router;
