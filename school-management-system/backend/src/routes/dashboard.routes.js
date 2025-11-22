const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

// Principal dashboard
router.get('/principal', authorize('principal', 'admin'), dashboardController.getPrincipalDashboard);

// Teacher dashboard
router.get('/teacher', authorize('teacher'), dashboardController.getTeacherDashboard);

// Parent dashboard
router.get('/parent', authorize('parent'), dashboardController.getParentDashboard);

// Quick stats
router.get('/stats', dashboardController.getQuickStats);

module.exports = router;
