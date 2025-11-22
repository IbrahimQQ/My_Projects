const { AuditLog, User } = require('../models');
const { Op } = require('sequelize');

// Get audit logs
exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, action, entityType, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (userId) where.userId = userId;
    if (action) where.action = { [Op.iLike]: `%${action}%` };
    if (entityType) where.entityType = entityType;
    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [startDate, endDate] };
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'role'] }],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
};

// Get audit log by id
exports.getAuditLog = async (req, res) => {
  try {
    const log = await AuditLog.findByPk(req.params.id, {
      include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'role'] }]
    });

    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    res.json({ data: log });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ error: 'Failed to get audit log' });
  }
};

// Get audit logs for entity
exports.getEntityAuditLogs = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    const logs = await AuditLog.findAll({
      where: { entityType, entityId },
      include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'role'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ data: logs });
  } catch (error) {
    console.error('Get entity audit logs error:', error);
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
};

// Get user activity
exports.getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    const logs = await AuditLog.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({ data: logs });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ error: 'Failed to get user activity' });
  }
};

// Get audit statistics
exports.getAuditStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [startDate, endDate] };
    }

    // Actions by type
    const actionStats = await AuditLog.findAll({
      where,
      attributes: [
        'action',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['action'],
      raw: true
    });

    // Actions by entity type
    const entityStats = await AuditLog.findAll({
      where,
      attributes: [
        'entityType',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['entityType'],
      raw: true
    });

    // Most active users
    const userStats = await AuditLog.findAll({
      where,
      attributes: [
        'userId',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      include: [{ model: User, attributes: ['firstName', 'lastName', 'email'] }],
      group: ['userId', 'User.id', 'User.first_name', 'User.last_name', 'User.email'],
      order: [[require('sequelize').literal('count'), 'DESC']],
      limit: 10,
      raw: true
    });

    res.json({
      data: {
        actionStats,
        entityStats,
        userStats
      }
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ error: 'Failed to get audit statistics' });
  }
};
