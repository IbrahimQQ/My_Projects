const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const attendanceController = require('../controllers/attendance.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');

router.use(authenticate);

// Mark attendance
router.post('/',
  authorize('teacher'),
  [
    body('classId').notEmpty(),
    body('date').isISO8601(),
    body('records').isArray()
  ],
  handleValidationErrors,
  attendanceController.markAttendance
);

// Get class attendance
router.get('/class', authorize('principal', 'admin', 'teacher'), attendanceController.getClassAttendance);

// Get student attendance
router.get('/student/:studentId', authorize('principal', 'admin', 'teacher', 'parent'), attendanceController.getStudentAttendance);

// Get attendance summary
router.get('/summary', authorize('principal', 'admin', 'teacher'), attendanceController.getAttendanceSummary);

// Get today's attendance for teacher
router.get('/today', authorize('teacher'), attendanceController.getTodayAttendance);

// Update attendance record
router.put('/:id', authorize('teacher', 'principal', 'admin'), attendanceController.updateAttendance);

// Delete attendance record
router.delete('/:id', authorize('principal', 'admin'), attendanceController.deleteAttendance);

module.exports = router;
