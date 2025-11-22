const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  handleValidationErrors,
  authController.login
);

// Refresh token
router.post('/refresh-token',
  [body('refreshToken').notEmpty()],
  handleValidationErrors,
  authController.refreshToken
);

// Logout
router.post('/logout', authenticate, authController.logout);

// Get current user
router.get('/me', authenticate, authController.getCurrentUser);

// Change password
router.post('/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 })
  ],
  handleValidationErrors,
  authController.changePassword
);

// Request password reset
router.post('/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  handleValidationErrors,
  authController.requestPasswordReset
);

// Reset password
router.post('/reset-password',
  [
    body('token').notEmpty(),
    body('newPassword').isLength({ min: 8 })
  ],
  handleValidationErrors,
  authController.resetPassword
);

// Update FCM token
router.post('/fcm-token',
  authenticate,
  [body('fcmToken').notEmpty()],
  handleValidationErrors,
  authController.updateFcmToken
);

module.exports = router;
