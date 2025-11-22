const bcrypt = require('bcryptjs');
const { User, TeacherProfile, ParentProfile } = require('../models');
const { createAuditLog } = require('../middleware/audit.middleware');

// Create user (Principal only)
exports.createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, phone } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      phone
    });

    await createAuditLog(req.userId, 'CREATE_USER', 'User', user.id, null, user.toJSON(), req);

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json({
      message: 'User created successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// Get all users with pagination
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, isActive } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    if (search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'refreshToken'] },
      include: [
        { model: TeacherProfile, as: 'teacherProfile' },
        { model: ParentProfile, as: 'parentProfile' }
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
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

// Get single user
exports.getUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'refreshToken'] },
      include: [
        { model: TeacherProfile, as: 'teacherProfile' },
        { model: ParentProfile, as: 'parentProfile' }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ data: user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const oldValue = user.toJSON();
    const { firstName, lastName, phone, isActive, avatar } = req.body;

    await user.update({
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      phone: phone || user.phone,
      isActive: isActive !== undefined ? isActive : user.isActive,
      avatar: avatar || user.avatar
    });

    await createAuditLog(req.userId, 'UPDATE_USER', 'User', user.id, oldValue, user.toJSON(), req);

    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.refreshToken;

    res.json({
      message: 'User updated successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete user (soft delete - deactivate)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ isActive: false });
    await createAuditLog(req.userId, 'DELETE_USER', 'User', user.id, null, null, req);

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Generate credentials for user
exports.generateCredentials = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate random password
    const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await user.update({ password: hashedPassword });
    await createAuditLog(req.userId, 'GENERATE_CREDENTIALS', 'User', user.id, null, null, req);

    res.json({
      message: 'New credentials generated',
      data: {
        email: user.email,
        temporaryPassword: newPassword
      }
    });
  } catch (error) {
    console.error('Generate credentials error:', error);
    res.status(500).json({ error: 'Failed to generate credentials' });
  }
};
