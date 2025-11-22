/**
 * School Management Controller
 *
 * Platform-level operations for managing school tenants.
 * Only accessible by superadmin users.
 */

const { School, User, Student, TeacherProfile } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

// Get all schools (superadmin only)
exports.getAllSchools = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, plan, isActive } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (plan) where.plan = plan;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const { count, rows } = await School.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    // Get stats for each school
    const schoolsWithStats = await Promise.all(rows.map(async (school) => {
      const [studentCount, teacherCount, userCount] = await Promise.all([
        Student.count({ where: { schoolId: school.id } }),
        TeacherProfile.count({ where: { schoolId: school.id } }),
        User.count({ where: { schoolId: school.id } })
      ]);

      return {
        ...school.toJSON(),
        stats: {
          students: studentCount,
          teachers: teacherCount,
          users: userCount
        }
      };
    }));

    res.json({
      data: schoolsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get all schools error:', error);
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
};

// Get school by ID
exports.getSchoolById = async (req, res) => {
  try {
    const { id } = req.params;

    const school = await School.findByPk(id);
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    // Get detailed stats
    const [studentCount, teacherCount, userCount] = await Promise.all([
      Student.count({ where: { schoolId: id } }),
      TeacherProfile.count({ where: { schoolId: id } }),
      User.count({ where: { schoolId: id } })
    ]);

    res.json({
      data: {
        ...school.toJSON(),
        stats: {
          students: studentCount,
          teachers: teacherCount,
          users: userCount,
          utilizationStudents: `${studentCount}/${school.maxStudents}`,
          utilizationTeachers: `${teacherCount}/${school.maxTeachers}`
        }
      }
    });
  } catch (error) {
    console.error('Get school error:', error);
    res.status(500).json({ error: 'Failed to fetch school' });
  }
};

// Create new school (onboarding)
exports.createSchool = async (req, res) => {
  try {
    const {
      name,
      code,
      subdomain,
      email,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      plan,
      maxStudents,
      maxTeachers,
      subscriptionMonths,
      // Admin user details
      adminEmail,
      adminPassword,
      adminFirstName,
      adminLastName
    } = req.body;

    // Validate unique constraints
    const existing = await School.findOne({
      where: {
        [Op.or]: [
          { code: code.toUpperCase() },
          { subdomain: subdomain?.toLowerCase() },
          { email }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'School code, subdomain, or email already exists' });
    }

    // Calculate subscription dates
    const subscriptionStartDate = new Date();
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + (subscriptionMonths || 1));

    // Create school
    const school = await School.create({
      name,
      code: code.toUpperCase(),
      subdomain: subdomain?.toLowerCase(),
      email,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      plan: plan || 'trial',
      maxStudents: maxStudents || 100,
      maxTeachers: maxTeachers || 20,
      subscriptionStartDate,
      subscriptionEndDate,
      isActive: true,
      settings: {
        gradingScale: 'percentage',
        attendanceTracking: true,
        parentPortal: true
      },
      features: {
        accounting: plan !== 'basic',
        messaging: true,
        reportCards: true,
        questionBank: true,
        onlineAssessments: ['premium', 'enterprise'].includes(plan)
      }
    });

    // Create admin user for the school
    if (adminEmail && adminPassword) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await User.create({
        email: adminEmail,
        password: hashedPassword,
        firstName: adminFirstName || 'School',
        lastName: adminLastName || 'Admin',
        role: 'admin',
        schoolId: school.id,
        isActive: true
      });
    }

    res.status(201).json({
      data: school,
      message: 'School created successfully'
    });
  } catch (error) {
    console.error('Create school error:', error);
    res.status(500).json({ error: 'Failed to create school' });
  }
};

// Update school
exports.updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const school = await School.findByPk(id);
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    // Prevent changing code if it would conflict
    if (updates.code && updates.code !== school.code) {
      const existing = await School.findOne({ where: { code: updates.code.toUpperCase() } });
      if (existing) {
        return res.status(400).json({ error: 'School code already exists' });
      }
      updates.code = updates.code.toUpperCase();
    }

    await school.update(updates);

    res.json({
      data: school,
      message: 'School updated successfully'
    });
  } catch (error) {
    console.error('Update school error:', error);
    res.status(500).json({ error: 'Failed to update school' });
  }
};

// Extend subscription
exports.extendSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { months, plan } = req.body;

    const school = await School.findByPk(id);
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    // Calculate new end date
    const currentEnd = school.subscriptionEndDate ? new Date(school.subscriptionEndDate) : new Date();
    const newEnd = new Date(Math.max(currentEnd, new Date()));
    newEnd.setMonth(newEnd.getMonth() + (months || 1));

    const updates = { subscriptionEndDate: newEnd };
    if (plan) {
      updates.plan = plan;
      // Update features based on plan
      updates.features = {
        accounting: plan !== 'basic',
        messaging: true,
        reportCards: true,
        questionBank: true,
        onlineAssessments: ['premium', 'enterprise'].includes(plan)
      };
    }

    await school.update(updates);

    res.json({
      data: school,
      message: `Subscription extended to ${newEnd.toISOString().split('T')[0]}`
    });
  } catch (error) {
    console.error('Extend subscription error:', error);
    res.status(500).json({ error: 'Failed to extend subscription' });
  }
};

// Toggle school active status
exports.toggleSchoolStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const school = await School.findByPk(id);
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    await school.update({ isActive: !school.isActive });

    res.json({
      data: school,
      message: `School ${school.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Toggle school status error:', error);
    res.status(500).json({ error: 'Failed to update school status' });
  }
};

// Get school dashboard (for school's own admin)
exports.getSchoolDashboard = async (req, res) => {
  try {
    const schoolId = req.schoolId;

    const school = await School.findByPk(schoolId);
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    const [studentCount, teacherCount, userCount] = await Promise.all([
      Student.count({ where: { schoolId } }),
      TeacherProfile.count({ where: { schoolId } }),
      User.count({ where: { schoolId } })
    ]);

    // Days until subscription expires
    const daysUntilExpiry = school.subscriptionEndDate
      ? Math.ceil((new Date(school.subscriptionEndDate) - new Date()) / (1000 * 60 * 60 * 24))
      : null;

    res.json({
      data: {
        school: {
          name: school.name,
          plan: school.plan,
          logo: school.logo
        },
        subscription: {
          plan: school.plan,
          startDate: school.subscriptionStartDate,
          endDate: school.subscriptionEndDate,
          daysRemaining: daysUntilExpiry,
          isExpiringSoon: daysUntilExpiry !== null && daysUntilExpiry <= 30
        },
        usage: {
          students: {
            current: studentCount,
            max: school.maxStudents,
            percentage: Math.round((studentCount / school.maxStudents) * 100)
          },
          teachers: {
            current: teacherCount,
            max: school.maxTeachers,
            percentage: Math.round((teacherCount / school.maxTeachers) * 100)
          },
          users: userCount
        },
        features: school.features,
        settings: school.settings
      }
    });
  } catch (error) {
    console.error('Get school dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch school dashboard' });
  }
};

// Platform statistics (superadmin)
exports.getPlatformStats = async (req, res) => {
  try {
    const [
      totalSchools,
      activeSchools,
      totalStudents,
      totalTeachers,
      schoolsByPlan
    ] = await Promise.all([
      School.count(),
      School.count({ where: { isActive: true } }),
      Student.count(),
      TeacherProfile.count(),
      School.findAll({
        attributes: ['plan', [require('sequelize').fn('COUNT', '*'), 'count']],
        group: ['plan']
      })
    ]);

    // Schools expiring soon
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringSoon = await School.count({
      where: {
        isActive: true,
        subscriptionEndDate: {
          [Op.between]: [new Date(), thirtyDaysFromNow]
        }
      }
    });

    res.json({
      data: {
        schools: {
          total: totalSchools,
          active: activeSchools,
          inactive: totalSchools - activeSchools,
          expiringSoon
        },
        users: {
          totalStudents,
          totalTeachers
        },
        byPlan: schoolsByPlan.reduce((acc, item) => {
          acc[item.plan] = parseInt(item.getDataValue('count'));
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({ error: 'Failed to fetch platform statistics' });
  }
};
