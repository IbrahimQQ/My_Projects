const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const multer = require('multer');
const studentController = require('../controllers/student.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');

const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

// Create student
router.post('/',
  authorize('principal', 'admin'),
  [
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim()
  ],
  handleValidationErrors,
  studentController.createStudent
);

// Get all students
router.get('/', authorize('principal', 'admin', 'teacher'), studentController.getStudents);

// Export students
router.get('/export', authorize('principal', 'admin'), studentController.exportStudents);

// Bulk import students
router.post('/import',
  authorize('principal', 'admin'),
  upload.single('file'),
  studentController.bulkImport
);

// Get student by ID
router.get('/:id', authorize('principal', 'admin', 'teacher', 'parent'), studentController.getStudent);

// Update student
router.put('/:id', authorize('principal', 'admin'), studentController.updateStudent);

// Archive student
router.post('/:id/archive', authorize('principal', 'admin'), studentController.archiveStudent);

// Get student performance
router.get('/:id/performance', authorize('principal', 'admin', 'teacher', 'parent'), studentController.getStudentPerformance);

// Assign parent to student
router.post('/:id/parent',
  authorize('principal', 'admin'),
  [body('parentId').notEmpty()],
  handleValidationErrors,
  studentController.assignParent
);

// Enroll student in subjects
router.post('/:id/subjects',
  authorize('principal', 'admin'),
  [body('subjectIds').isArray()],
  handleValidationErrors,
  studentController.enrollInSubjects
);

module.exports = router;
