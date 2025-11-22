const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const subjectController = require('../controllers/subject.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');

router.use(authenticate);

// Create subject
router.post('/',
  authorize('principal', 'admin'),
  [body('name').notEmpty().trim()],
  handleValidationErrors,
  subjectController.createSubject
);

// Get all subjects
router.get('/', subjectController.getSubjects);

// Get subject by ID
router.get('/:id', subjectController.getSubject);

// Update subject
router.put('/:id', authorize('principal', 'admin'), subjectController.updateSubject);

// Delete subject
router.delete('/:id', authorize('principal', 'admin'), subjectController.deleteSubject);

// Update curriculum
router.patch('/:id/curriculum',
  authorize('principal', 'admin'),
  [body('curriculum').isObject()],
  handleValidationErrors,
  subjectController.updateCurriculum
);

module.exports = router;
