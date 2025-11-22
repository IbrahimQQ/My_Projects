const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const academicYearController = require('../controllers/academicYear.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');

router.use(authenticate);

// Create academic year
router.post('/',
  authorize('principal', 'admin'),
  [
    body('name').notEmpty().trim(),
    body('startDate').isISO8601(),
    body('endDate').isISO8601()
  ],
  handleValidationErrors,
  academicYearController.createAcademicYear
);

// Get all academic years
router.get('/', academicYearController.getAcademicYears);

// Get current academic year
router.get('/current', academicYearController.getCurrentAcademicYear);

// Get academic year by ID
router.get('/:id', academicYearController.getAcademicYear);

// Update academic year
router.put('/:id', authorize('principal', 'admin'), academicYearController.updateAcademicYear);

// Delete academic year
router.delete('/:id', authorize('principal', 'admin'), academicYearController.deleteAcademicYear);

// Create term
router.post('/:id/terms',
  authorize('principal', 'admin'),
  [
    body('name').notEmpty().trim(),
    body('startDate').isISO8601(),
    body('endDate').isISO8601()
  ],
  handleValidationErrors,
  academicYearController.createTerm
);

// Update term
router.put('/:id/terms/:termId', authorize('principal', 'admin'), academicYearController.updateTerm);

// Delete term
router.delete('/:id/terms/:termId', authorize('principal', 'admin'), academicYearController.deleteTerm);

module.exports = router;
