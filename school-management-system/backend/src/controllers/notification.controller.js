const { Notification, UserNotification, User, Student, ParentProfile } = require('../models');
const { createAuditLog } = require('../middleware/audit.middleware');

// Create notification
exports.createNotification = async (req, res) => {
  try {
    const {
      title, message, type, priority, targetAudience, targetIds, scheduledAt
    } = req.body;

    const notification = await Notification.create({
      title,
      message,
      type,
      priority,
      targetAudience,
      targetIds: targetIds || [],
      scheduledAt,
      createdBy: req.userId,
      status: scheduledAt ? 'scheduled' : 'draft'
    });

    await createAuditLog(req.userId, 'CREATE_NOTIFICATION', 'Notification', notification.id, null, notification.toJSON(), req);

    res.status(201).json({
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
};

// Send notification
exports.sendNotification = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Determine recipients based on target audience
    let recipients = [];

    if (notification.targetAudience === 'all') {
      recipients = await User.findAll({ where: { isActive: true } });
    } else if (notification.targetAudience === 'teachers') {
      recipients = await User.findAll({ where: { role: 'teacher', isActive: true } });
    } else if (notification.targetAudience === 'parents') {
      recipients = await User.findAll({ where: { role: 'parent', isActive: true } });
    } else if (notification.targetAudience === 'specific' && notification.targetIds.length > 0) {
      recipients = await User.findAll({ where: { id: notification.targetIds, isActive: true } });
    }

    // Create user notifications
    for (const user of recipients) {
      await UserNotification.create({
        userId: user.id,
        notificationId: notification.id
      });

      // Send push notification if user has FCM token
      if (user.fcmToken) {
        // In production, implement FCM push notification here
        console.log(`Would send push to ${user.email}`);
      }
    }

    // Update notification status
    await notification.update({
      status: 'sent',
      sentAt: new Date()
    });

    // Emit real-time notification via Socket.io
    const io = req.app.get('io');
    if (io) {
      recipients.forEach(user => {
        io.to(`user-${user.id}`).emit('notification', notification);
      });
    }

    await createAuditLog(req.userId, 'SEND_NOTIFICATION', 'Notification', notification.id, null, { recipientCount: recipients.length }, req);

    res.json({
      message: `Notification sent to ${recipients.length} recipients`,
      data: notification
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
};

// Get all notifications (admin/principal)
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const { count, rows } = await Notification.findAndCountAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ],
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
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
};

// Get user's notifications
exports.getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const offset = (page - 1) * limit;

    const where = { userId: req.userId };
    if (unreadOnly === 'true') where.isRead = false;

    const { count, rows } = await UserNotification.findAndCountAll({
      where,
      include: [{ model: Notification }],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    const unreadCount = await UserNotification.count({
      where: { userId: req.userId, isRead: false }
    });

    res.json({
      data: rows,
      unreadCount,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get user notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const userNotification = await UserNotification.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!userNotification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await userNotification.update({
      isRead: true,
      readAt: new Date()
    });

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    await UserNotification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId: req.userId, isRead: false } }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await UserNotification.destroy({ where: { notificationId: notification.id } });
    await notification.destroy();

    await createAuditLog(req.userId, 'DELETE_NOTIFICATION', 'Notification', req.params.id, null, null, req);

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

// Update notification
exports.updateNotification = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.status === 'sent') {
      return res.status(400).json({ error: 'Cannot update sent notification' });
    }

    const { title, message, type, priority, targetAudience, targetIds, scheduledAt } = req.body;

    await notification.update({
      title: title || notification.title,
      message: message || notification.message,
      type: type || notification.type,
      priority: priority || notification.priority,
      targetAudience: targetAudience || notification.targetAudience,
      targetIds: targetIds || notification.targetIds,
      scheduledAt: scheduledAt || notification.scheduledAt
    });

    res.json({
      message: 'Notification updated successfully',
      data: notification
    });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
};
