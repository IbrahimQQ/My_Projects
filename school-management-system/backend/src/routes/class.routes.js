const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const classController = require('../controllers/class.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');

router.use(authenticate);

// Create class
router.post('/',
  authorize('principal', 'admin'),
  [
    body('name').notEmpty().trim(),
    body('grade').notEmpty().trim()
  ],
  handleValidationErrors,
  classController.createClass
);

// Get all classes
router.get('/', classController.getClasses);

// Get class by ID
router.get('/:id', classController.getClass);

// Update class
router.put('/:id', authorize('principal', 'admin'), classController.updateClass);

// Delete class
router.delete('/:id', authorize('principal', 'admin'), classController.deleteClass);

// Get class schedule
router.get('/:id/schedule', classController.getClassSchedule);

// Get class students
router.get('/:id/students', classController.getClassStudents);

module.exports = router;
