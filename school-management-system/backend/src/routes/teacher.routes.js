const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const teacherController = require('../controllers/teacher.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');

router.use(authenticate);

// Create teacher (principal only)
router.post('/',
  authorize('principal', 'admin'),
  [
    body('email').isEmail().normalizeEmail(),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim()
  ],
  handleValidationErrors,
  teacherController.createTeacher
);

// Get all teachers
router.get('/', authorize('principal', 'admin'), teacherController.getTeachers);

// Get teacher by ID
router.get('/:id', authorize('principal', 'admin', 'teacher'), teacherController.getTeacher);

// Update teacher
router.put('/:id', authorize('principal', 'admin'), teacherController.updateTeacher);

// Delete teacher
router.delete('/:id', authorize('principal', 'admin'), teacherController.deleteTeacher);

// Get teacher workload
router.get('/:id/workload', authorize('principal', 'admin', 'teacher'), teacherController.getTeacherWorkload);

// Assign subjects to teacher
router.post('/:id/subjects',
  authorize('principal', 'admin'),
  [body('subjectIds').isArray()],
  handleValidationErrors,
  teacherController.assignSubjects
);

module.exports = router;
