const bcrypt = require('bcryptjs');
const { User, ParentProfile, Student, Class, Subject, Attendance, AssessmentResult, Assessment } = require('../models');
const { createAuditLog } = require('../middleware/audit.middleware');

// Create parent account
exports.createParent = async (req, res) => {
  try {
    const {
      email, password, firstName, lastName, phone,
      relationship, occupation, address, emergencyContact,
      studentIds, canViewGrades, canViewAttendance, canViewAssessments, canMessageTeachers
    } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Generate password if not provided
    const userPassword = password || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
    const hashedPassword = await bcrypt.hash(userPassword, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role: 'parent'
    });

    const parentProfile = await ParentProfile.create({
      userId: user.id,
      relationship,
      occupation,
      address,
      emergencyContact,
      canViewGrades: canViewGrades !== undefined ? canViewGrades : true,
      canViewAttendance: canViewAttendance !== undefined ? canViewAttendance : true,
      canViewAssessments: canViewAssessments !== undefined ? canViewAssessments : true,
      canMessageTeachers: canMessageTeachers !== undefined ? canMessageTeachers : true
    });

    // Link to students if provided
    if (studentIds && studentIds.length > 0) {
      const students = await Student.findAll({
        where: { id: studentIds }
      });
      await parentProfile.setChildren(students);
    }

    await createAuditLog(req.userId, 'CREATE_PARENT', 'Parent', parentProfile.id, null, { user, parentProfile }, req);

    res.status(201).json({
      message: 'Parent account created successfully',
      data: {
        user: { ...user.toJSON(), password: undefined },
        profile: parentProfile,
        temporaryPassword: password ? undefined : userPassword
      }
    });
  } catch (error) {
    console.error('Create parent error:', error);
    res.status(500).json({ error: 'Failed to create parent' });
  }
};

// Get all parents
exports.getParents = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    const where = { role: 'parent' };

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
      include: [{
        model: ParentProfile,
        as: 'parentProfile',
        include: [{
          model: Student,
          as: 'children',
          include: [{ model: Class }]
        }]
      }],
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
    console.error('Get parents error:', error);
    res.status(500).json({ error: 'Failed to get parents' });
  }
};

// Get single parent
exports.getParent = async (req, res) => {
  try {
    const parent = await User.findOne({
      where: { id: req.params.id, role: 'parent' },
      attributes: { exclude: ['password', 'refreshToken'] },
      include: [{
        model: ParentProfile,
        as: 'parentProfile',
        include: [{
          model: Student,
          as: 'children',
          include: [
            { model: Class },
            { model: Subject, as: 'subjects' }
          ]
        }]
      }]
    });

    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    res.json({ data: parent });
  } catch (error) {
    console.error('Get parent error:', error);
    res.status(500).json({ error: 'Failed to get parent' });
  }
};

// Update parent
exports.updateParent = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.params.id, role: 'parent' },
      include: [{ model: ParentProfile, as: 'parentProfile' }]
    });

    if (!user) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    const {
      firstName, lastName, phone, isActive,
      relationship, occupation, address, emergencyContact,
      canViewGrades, canViewAttendance, canViewAssessments, canMessageTeachers,
      studentIds
    } = req.body;

    await user.update({
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      phone: phone || user.phone,
      isActive: isActive !== undefined ? isActive : user.isActive
    });

    if (user.parentProfile) {
      await user.parentProfile.update({
        relationship: relationship || user.parentProfile.relationship,
        occupation: occupation || user.parentProfile.occupation,
        address: address || user.parentProfile.address,
        emergencyContact: emergencyContact || user.parentProfile.emergencyContact,
        canViewGrades: canViewGrades !== undefined ? canViewGrades : user.parentProfile.canViewGrades,
        canViewAttendance: canViewAttendance !== undefined ? canViewAttendance : user.parentProfile.canViewAttendance,
        canViewAssessments: canViewAssessments !== undefined ? canViewAssessments : user.parentProfile.canViewAssessments,
        canMessageTeachers: canMessageTeachers !== undefined ? canMessageTeachers : user.parentProfile.canMessageTeachers
      });
    }

    // Update linked students if provided
    if (studentIds !== undefined) {
      const students = await Student.findAll({ where: { id: studentIds } });
      await user.parentProfile.setChildren(students);
    }

    await createAuditLog(req.userId, 'UPDATE_PARENT', 'Parent', user.parentProfile.id, null, user.toJSON(), req);

    res.json({
      message: 'Parent updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update parent error:', error);
    res.status(500).json({ error: 'Failed to update parent' });
  }
};

// Delete parent (soft delete)
exports.deleteParent = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.params.id, role: 'parent' }
    });

    if (!user) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    await user.update({ isActive: false });
    await createAuditLog(req.userId, 'DELETE_PARENT', 'Parent', user.id, null, null, req);

    res.json({ message: 'Parent account deactivated successfully' });
  } catch (error) {
    console.error('Delete parent error:', error);
    res.status(500).json({ error: 'Failed to delete parent' });
  }
};

// Update parent permissions
exports.updatePermissions = async (req, res) => {
  try {
    const profile = await ParentProfile.findOne({
      where: { userId: req.params.id }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Parent profile not found' });
    }

    const { canViewGrades, canViewAttendance, canViewAssessments, canMessageTeachers } = req.body;

    await profile.update({
      canViewGrades: canViewGrades !== undefined ? canViewGrades : profile.canViewGrades,
      canViewAttendance: canViewAttendance !== undefined ? canViewAttendance : profile.canViewAttendance,
      canViewAssessments: canViewAssessments !== undefined ? canViewAssessments : profile.canViewAssessments,
      canMessageTeachers: canMessageTeachers !== undefined ? canMessageTeachers : profile.canMessageTeachers
    });

    await createAuditLog(req.userId, 'UPDATE_PARENT_PERMISSIONS', 'ParentProfile', profile.id, null, profile.toJSON(), req);

    res.json({
      message: 'Permissions updated successfully',
      data: profile
    });
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({ error: 'Failed to update permissions' });
  }
};

// Link students to parent
exports.linkStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;
    const parentId = req.params.id;

    const profile = await ParentProfile.findOne({
      where: { userId: parentId }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Parent profile not found' });
    }

    const students = await Student.findAll({
      where: { id: studentIds }
    });

    await profile.setChildren(students);
    await createAuditLog(req.userId, 'LINK_STUDENTS', 'ParentProfile', profile.id, null, { studentIds }, req);

    res.json({ message: 'Students linked successfully' });
  } catch (error) {
    console.error('Link students error:', error);
    res.status(500).json({ error: 'Failed to link students' });
  }
};

// Get child data (for parent app)
exports.getChildData = async (req, res) => {
  try {
    const parentId = req.userId;
    const childId = req.params.childId;

    const profile = await ParentProfile.findOne({
      where: { userId: parentId },
      include: [{
        model: Student,
        as: 'children',
        where: { id: childId }
      }]
    });

    if (!profile || profile.children.length === 0) {
      return res.status(404).json({ error: 'Child not found or access denied' });
    }

    const child = profile.children[0];

    // Get data based on permissions
    const data = { student: child };

    if (profile.canViewAttendance) {
      data.attendance = await Attendance.findAll({
        where: { studentId: childId },
        order: [['date', 'DESC']],
        limit: 30
      });
    }

    if (profile.canViewGrades || profile.canViewAssessments) {
      data.assessments = await AssessmentResult.findAll({
        where: { studentId: childId },
        include: [{ model: Assessment, include: [{ model: Subject }] }],
        order: [['createdAt', 'DESC']]
      });
    }

    res.json({ data });
  } catch (error) {
    console.error('Get child data error:', error);
    res.status(500).json({ error: 'Failed to get child data' });
  }
};
