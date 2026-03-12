const express = require('express');
const router = express.Router();
const placementController = require('../controllers/placementController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// Student creates an official placement (Stage 2)
router.post('/', placementController.createPlacement);

// Get all placements (students see their own, admins see all)
router.get('/', placementController.getPlacements);

// Admin tracking endpoint
router.get('/tracking', placementController.getTrackingData);

// Get a specific placement by ID
router.get('/:id', placementController.getPlacementById);

// Admin updates placement status (approve/reject/request modifications)
router.patch('/:id/status', placementController.updatePlacementStatus);

// Student sends official letter + eval form to organization
router.post('/:id/send-email', placementController.sendToOrganization);

// Download the generated official letter
router.get('/:id/download-letter', placementController.downloadOfficialLetter);

module.exports = router;
