const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const notificationController = require('../controllers/notification.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');

router.use(authenticate);

// Create notification
router.post('/',
  authorize('principal', 'admin'),
  [
    body('title').notEmpty().trim(),
    body('message').notEmpty()
  ],
  handleValidationErrors,
  notificationController.createNotification
);

// Get all notifications (admin)
router.get('/all', authorize('principal', 'admin'), notificationController.getNotifications);

// Get user's notifications
router.get('/', notificationController.getUserNotifications);

// Send notification
router.post('/:id/send', authorize('principal', 'admin'), notificationController.sendNotification);

// Mark as read
router.patch('/:id/read', notificationController.markAsRead);

// Mark all as read
router.patch('/read-all', notificationController.markAllAsRead);

// Update notification
router.put('/:id', authorize('principal', 'admin'), notificationController.updateNotification);

// Delete notification
router.delete('/:id', authorize('principal', 'admin'), notificationController.deleteNotification);

module.exports = router;
