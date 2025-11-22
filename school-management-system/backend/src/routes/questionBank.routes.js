const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const questionBankController = require('../controllers/questionBank.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');

router.use(authenticate);

// Create question
router.post('/',
  authorize('teacher', 'principal', 'admin'),
  [
    body('type').isIn(['mcq', 'theory', 'essay', 'short_answer', 'true_false']),
    body('question').notEmpty()
  ],
  handleValidationErrors,
  questionBankController.createQuestion
);

// Get questions
router.get('/', questionBankController.getQuestions);

// Get question statistics
router.get('/stats', questionBankController.getQuestionStats);

// Get topics and chapters for subject
router.get('/subject/:subjectId/topics', questionBankController.getTopicsAndChapters);

// Bulk create questions
router.post('/bulk',
  authorize('teacher', 'principal', 'admin'),
  [body('questions').isArray()],
  handleValidationErrors,
  questionBankController.bulkCreateQuestions
);

// Get question by ID
router.get('/:id', questionBankController.getQuestion);

// Update question
router.put('/:id', authorize('teacher', 'principal', 'admin'), questionBankController.updateQuestion);

// Delete question
router.delete('/:id', authorize('teacher', 'principal', 'admin'), questionBankController.deleteQuestion);

module.exports = router;
