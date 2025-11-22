const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

// Generate student report
router.get('/student', authorize('principal', 'admin', 'teacher', 'parent'), reportController.generateStudentReport);

// Generate class report
router.get('/class', authorize('principal', 'admin', 'teacher'), reportController.generateClassReport);

// Generate attendance report
router.get('/attendance', authorize('principal', 'admin', 'teacher'), reportController.generateAttendanceReport);

// Generate custom report
router.post('/custom', authorize('principal', 'admin'), reportController.generateCustomReport);

module.exports = router;
