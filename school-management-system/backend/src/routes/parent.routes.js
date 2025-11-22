const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const parentController = require('../controllers/parent.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');

router.use(authenticate);

// Create parent
router.post('/',
  authorize('principal', 'admin'),
  [
    body('email').isEmail().normalizeEmail(),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('relationship').isIn(['father', 'mother', 'guardian', 'other'])
  ],
  handleValidationErrors,
  parentController.createParent
);

// Get all parents
router.get('/', authorize('principal', 'admin'), parentController.getParents);

// Get parent by ID
router.get('/:id', authorize('principal', 'admin'), parentController.getParent);

// Update parent
router.put('/:id', authorize('principal', 'admin'), parentController.updateParent);

// Delete parent
router.delete('/:id', authorize('principal', 'admin'), parentController.deleteParent);

// Update permissions
router.patch('/:id/permissions',
  authorize('principal', 'admin'),
  parentController.updatePermissions
);

// Link students
router.post('/:id/students',
  authorize('principal', 'admin'),
  [body('studentIds').isArray()],
  handleValidationErrors,
  parentController.linkStudents
);

// Get child data (for parent app)
router.get('/children/:childId', authorize('parent'), parentController.getChildData);

module.exports = router;
