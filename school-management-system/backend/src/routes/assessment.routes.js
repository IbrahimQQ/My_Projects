const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const assessmentController = require('../controllers/assessment.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');

router.use(authenticate);

// Create assessment
router.post('/',
  authorize('teacher', 'principal', 'admin'),
  [
    body('title').notEmpty().trim(),
    body('type').isIn(['quiz', 'test', 'midterm', 'final', 'assignment']),
    body('totalMarks').isInt({ min: 1 })
  ],
  handleValidationErrors,
  assessmentController.createAssessment
);

// Get all assessments
router.get('/', assessmentController.getAssessments);

// Get assessment by ID
router.get('/:id', assessmentController.getAssessment);

// Update assessment
router.put('/:id', authorize('teacher', 'principal', 'admin'), assessmentController.updateAssessment);

// Delete assessment
router.delete('/:id', authorize('teacher', 'principal', 'admin'), assessmentController.deleteAssessment);

// Record scores
router.post('/:id/scores',
  authorize('teacher'),
  [body('results').isArray()],
  handleValidationErrors,
  assessmentController.recordScores
);

// Get assessment results
router.get('/:id/results', assessmentController.getAssessmentResults);

// Get student result
router.get('/:assessmentId/results/:studentId', assessmentController.getStudentResult);

module.exports = router;
