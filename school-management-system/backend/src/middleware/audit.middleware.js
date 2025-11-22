const { AuditLog } = require('../models');

// Create audit log entry
const createAuditLog = async (userId, action, entityType, entityId, oldValue, newValue, req) => {
  try {
    await AuditLog.create({
      userId,
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('User-Agent')
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

// Middleware to automatically log actions
const auditMiddleware = (action, entityType) => {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
        const entityId = parsedBody?.data?.id || req.params.id;

        createAuditLog(
          req.userId,
          action,
          entityType,
          entityId,
          req.body?.oldValue,
          parsedBody?.data,
          req
        );
      }
      return originalSend.call(this, body);
    };

    next();
  };
};

module.exports = {
  createAuditLog,
  auditMiddleware
};
