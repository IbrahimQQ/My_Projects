const { User, Student, TeacherProfile, Class, School } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// Get all users across all schools (for superadmin)
exports.getAllUsers = async (req, res) => {
  try {
    const { schoolId, role, status, search, page = 1, limit = 50 } = req.query;

    const where = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (role && role !== 'all') {
      where.role = role;
    }

    if (status && status !== 'all') {
      where.isActive = status === 'active';
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      where,
      include: [
        {
          model: School,
          as: 'school',
          attributes: ['id', 'name', 'code']
        }
      ],
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        {
          model: School,
          as: 'school',
          attributes: ['id', 'name', 'code']
        }
      ],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};

// Create user (for superadmin)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, schoolId } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      schoolId
    });

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, schoolId, isActive } = req.body;

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ name, email, role, schoolId, isActive });

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json(userResponse);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

// Toggle user status
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ isActive: !user.isActive });

    res.json({ message: 'User status updated', isActive: user.isActive });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ message: 'Failed to toggle user status' });
  }
};

// Reset user password
exports.resetUserPassword = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate temporary password or send reset email
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await user.update({ password: hashedPassword });

    // In production, send email instead of returning password
    res.json({
      message: 'Password reset successful',
      temporaryPassword: tempPassword // Remove in production
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.destroy();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// Get platform-wide statistics
exports.getPlatformStats = async (req, res) => {
  try {
    const [
      totalSchools,
      activeSchools,
      totalStudents,
      totalTeachers,
      totalUsers
    ] = await Promise.all([
      School.count(),
      School.count({ where: { isActive: true } }),
      Student.count(),
      TeacherProfile.count(),
      User.count()
    ]);

    // Get schools by plan
    const schoolsByPlan = await School.findAll({
      attributes: ['plan', [require('sequelize').fn('COUNT', 'id'), 'count']],
      group: ['plan']
    });

    const planDistribution = {};
    schoolsByPlan.forEach(item => {
      planDistribution[item.plan] = parseInt(item.dataValues.count);
    });

    res.json({
      totalSchools,
      activeSchools,
      totalStudents,
      totalTeachers,
      totalUsers,
      planDistribution
    });
  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({ message: 'Failed to fetch platform statistics' });
  }
};

// Get storage statistics
exports.getStorageStats = async (req, res) => {
  try {
    // In production, this would query actual storage metrics
    const schools = await School.findAll({
      attributes: ['id', 'name', 'code', 'storageUsed', 'storageLimit']
    });

    const totalStorage = schools.reduce((acc, s) => acc + (s.storageLimit || 0), 0);
    const usedStorage = schools.reduce((acc, s) => acc + (s.storageUsed || 0), 0);

    res.json({
      totalCapacity: totalStorage,
      usedStorage,
      availableStorage: totalStorage - usedStorage,
      schools: schools.map(s => ({
        id: s.id,
        name: s.name,
        code: s.code,
        storage: s.storageUsed || 0,
        limit: s.storageLimit || 10
      }))
    });
  } catch (error) {
    console.error('Get storage stats error:', error);
    res.status(500).json({ message: 'Failed to fetch storage statistics' });
  }
};

// Get platform settings
exports.getSettings = async (req, res) => {
  try {
    // In production, these would be stored in a Settings table
    const settings = {
      platformName: 'SchoolSaaS',
      supportEmail: 'support@schoolsaas.com',
      defaultCurrency: 'USD',
      timezone: 'America/New_York',
      maintenanceMode: false,
      allowRegistration: true,
      trialDays: 30,
      defaultPlan: 'trial'
    };

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
};

// Update platform settings
exports.updateSettings = async (req, res) => {
  try {
    // In production, save to Settings table
    const settings = req.body;

    res.json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Failed to update settings' });
  }
};

// Get activity logs
exports.getLogs = async (req, res) => {
  try {
    const { type, schoolId, search, page = 1, limit = 50 } = req.query;

    // In production, this would query an ActivityLog table
    const logs = [
      { id: 1, type: 'auth', action: 'User Login', user: 'admin@platform.com', school: 'Platform', timestamp: new Date() }
    ];

    res.json({
      logs,
      pagination: {
        total: logs.length,
        page: parseInt(page),
        pages: 1
      }
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ message: 'Failed to fetch logs' });
  }
};

// Billing statistics
exports.getBillingStats = async (req, res) => {
  try {
    // In production, calculate from actual billing records
    const stats = {
      totalRevenue: 156780,
      monthlyRevenue: 12500,
      pendingPayments: 2390,
      overduePayments: 799
    };

    res.json(stats);
  } catch (error) {
    console.error('Get billing stats error:', error);
    res.status(500).json({ message: 'Failed to fetch billing statistics' });
  }
};
