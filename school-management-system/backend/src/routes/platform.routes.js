const express = require('express');
const router = express.Router();
const platformController = require('../controllers/platform.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

// All platform routes require superadmin authentication
router.use(authenticateToken);
router.use(authorizeRoles('superadmin'));

// User management
router.get('/users', platformController.getAllUsers);
router.get('/users/:id', platformController.getUserById);
router.post('/users', platformController.createUser);
router.put('/users/:id', platformController.updateUser);
router.patch('/users/:id/toggle-status', platformController.toggleUserStatus);
router.post('/users/:id/reset-password', platformController.resetUserPassword);
router.delete('/users/:id', platformController.deleteUser);

// Platform statistics
router.get('/stats', platformController.getPlatformStats);

// Storage management
router.get('/storage', platformController.getStorageStats);

// Settings
router.get('/settings', platformController.getSettings);
router.put('/settings', platformController.updateSettings);

// Activity logs
router.get('/logs', platformController.getLogs);

// Billing
router.get('/billing/stats', platformController.getBillingStats);

module.exports = router;
