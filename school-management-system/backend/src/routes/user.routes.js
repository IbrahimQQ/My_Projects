const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');

// All routes require authentication
router.use(authenticate);

// Create user (principal/admin only)
router.post('/',
  authorize('principal', 'admin'),
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('role').isIn(['principal', 'teacher', 'parent', 'accountant', 'admin'])
  ],
  handleValidationErrors,
  userController.createUser
);

// Get all users
router.get('/', authorize('principal', 'admin'), userController.getUsers);

// Get user by ID
router.get('/:id', authorize('principal', 'admin'), userController.getUser);

// Update user
router.put('/:id', authorize('principal', 'admin'), userController.updateUser);

// Delete user
router.delete('/:id', authorize('principal', 'admin'), userController.deleteUser);

// Generate new credentials
router.post('/:userId/generate-credentials',
  authorize('principal', 'admin'),
  userController.generateCredentials
);

module.exports = router;
