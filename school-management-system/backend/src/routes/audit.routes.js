const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);
router.use(authorize('principal', 'admin'));

// Get audit logs
router.get('/', auditController.getAuditLogs);

// Get audit statistics
router.get('/stats', auditController.getAuditStats);

// Get audit log by ID
router.get('/:id', auditController.getAuditLog);

// Get entity audit logs
router.get('/entity/:entityType/:entityId', auditController.getEntityAuditLogs);

// Get user activity
router.get('/user/:userId', auditController.getUserActivity);

module.exports = router;
