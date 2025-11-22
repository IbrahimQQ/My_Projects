const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/school.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Platform-level routes (superadmin only)
router.get('/platform/stats', authorize('superadmin'), schoolController.getPlatformStats);
router.get('/', authorize('superadmin'), schoolController.getAllSchools);
router.post('/', authorize('superadmin'), schoolController.createSchool);
router.get('/:id', authorize('superadmin', 'admin'), schoolController.getSchoolById);
router.put('/:id', authorize('superadmin'), schoolController.updateSchool);
router.post('/:id/extend-subscription', authorize('superadmin'), schoolController.extendSubscription);
router.post('/:id/toggle-status', authorize('superadmin'), schoolController.toggleSchoolStatus);

// School's own dashboard (for school admin)
router.get('/my/dashboard', authorize('admin', 'principal'), schoolController.getSchoolDashboard);

module.exports = router;
