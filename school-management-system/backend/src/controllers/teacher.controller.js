const bcrypt = require('bcryptjs');
const { User, TeacherProfile, Subject, Class, TeacherSubject, Schedule } = require('../models');
const { createAuditLog } = require('../middleware/audit.middleware');

// Create teacher with profile
exports.createTeacher = async (req, res) => {
  try {
    const {
      email, password, firstName, lastName, phone,
      employeeId, qualification, specialization, experience,
      joiningDate, address, emergencyContact, salary, subjectIds
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
      role: 'teacher'
    });

    const teacherProfile = await TeacherProfile.create({
      userId: user.id,
      employeeId: employeeId || `EMP${Date.now()}`,
      qualification,
      specialization,
      experience,
      joiningDate,
      address,
      emergencyContact,
      salary
    });

    // Assign subjects if provided
    if (subjectIds && subjectIds.length > 0) {
      for (const subjectId of subjectIds) {
        await TeacherSubject.create({
          TeacherProfileId: teacherProfile.id,
          SubjectId: subjectId
        });
      }
    }

    await createAuditLog(req.userId, 'CREATE_TEACHER', 'Teacher', teacherProfile.id, null, { user, teacherProfile }, req);

    res.status(201).json({
      message: 'Teacher created successfully',
      data: {
        user: { ...user.toJSON(), password: undefined },
        profile: teacherProfile,
        temporaryPassword: password ? undefined : userPassword
      }
    });
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({ error: 'Failed to create teacher' });
  }
};

// Get all teachers
exports.getTeachers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const offset = (page - 1) * limit;

    const where = { role: 'teacher' };
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
      include: [{
        model: TeacherProfile,
        as: 'teacherProfile',
        include: [{
          model: Subject,
          as: 'subjects'
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
    console.error('Get teachers error:', error);
    res.status(500).json({ error: 'Failed to get teachers' });
  }
};

// Get single teacher
exports.getTeacher = async (req, res) => {
  try {
    const teacher = await User.findOne({
      where: { id: req.params.id, role: 'teacher' },
      attributes: { exclude: ['password', 'refreshToken'] },
      include: [{
        model: TeacherProfile,
        as: 'teacherProfile',
        include: [{
          model: Subject,
          as: 'subjects'
        }]
      }]
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json({ data: teacher });
  } catch (error) {
    console.error('Get teacher error:', error);
    res.status(500).json({ error: 'Failed to get teacher' });
  }
};

// Update teacher
exports.updateTeacher = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.params.id, role: 'teacher' },
      include: [{ model: TeacherProfile, as: 'teacherProfile' }]
    });

    if (!user) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const {
      firstName, lastName, phone, isActive,
      qualification, specialization, experience,
      address, emergencyContact, salary, subjectIds
    } = req.body;

    await user.update({
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      phone: phone || user.phone,
      isActive: isActive !== undefined ? isActive : user.isActive
    });

    if (user.teacherProfile) {
      await user.teacherProfile.update({
        qualification: qualification || user.teacherProfile.qualification,
        specialization: specialization || user.teacherProfile.specialization,
        experience: experience || user.teacherProfile.experience,
        address: address || user.teacherProfile.address,
        emergencyContact: emergencyContact || user.teacherProfile.emergencyContact,
        salary: salary || user.teacherProfile.salary
      });
    }

    // Update subject assignments if provided
    if (subjectIds) {
      await TeacherSubject.destroy({
        where: { TeacherProfileId: user.teacherProfile.id }
      });

      for (const subjectId of subjectIds) {
        await TeacherSubject.create({
          TeacherProfileId: user.teacherProfile.id,
          SubjectId: subjectId
        });
      }
    }

    await createAuditLog(req.userId, 'UPDATE_TEACHER', 'Teacher', user.teacherProfile.id, null, user.toJSON(), req);

    res.json({
      message: 'Teacher updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({ error: 'Failed to update teacher' });
  }
};

// Delete teacher (soft delete)
exports.deleteTeacher = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.params.id, role: 'teacher' }
    });

    if (!user) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    await user.update({ isActive: false });
    await createAuditLog(req.userId, 'DELETE_TEACHER', 'Teacher', user.id, null, null, req);

    res.json({ message: 'Teacher deactivated successfully' });
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({ error: 'Failed to delete teacher' });
  }
};

// Get teacher workload
exports.getTeacherWorkload = async (req, res) => {
  try {
    const teacherId = req.params.id;

    const profile = await TeacherProfile.findOne({
      where: { userId: teacherId },
      include: [
        { model: Subject, as: 'subjects' }
      ]
    });

    if (!profile) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    const schedules = await Schedule.findAll({
      where: { teacherId: profile.id },
      include: [
        { model: Class },
        { model: Subject }
      ]
    });

    const totalHours = schedules.reduce((acc, schedule) => {
      const start = new Date(`1970-01-01T${schedule.startTime}`);
      const end = new Date(`1970-01-01T${schedule.endTime}`);
      return acc + (end - start) / 3600000;
    }, 0);

    res.json({
      data: {
        subjects: profile.subjects,
        schedules,
        totalWeeklyHours: totalHours,
        classCount: [...new Set(schedules.map(s => s.classId))].length
      }
    });
  } catch (error) {
    console.error('Get teacher workload error:', error);
    res.status(500).json({ error: 'Failed to get workload' });
  }
};

// Assign subjects to teacher
exports.assignSubjects = async (req, res) => {
  try {
    const { subjectIds } = req.body;
    const teacherId = req.params.id;

    const profile = await TeacherProfile.findOne({
      where: { userId: teacherId }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    // Remove existing assignments
    await TeacherSubject.destroy({
      where: { TeacherProfileId: profile.id }
    });

    // Create new assignments
    for (const subjectId of subjectIds) {
      await TeacherSubject.create({
        TeacherProfileId: profile.id,
        SubjectId: subjectId
      });
    }

    await createAuditLog(req.userId, 'ASSIGN_SUBJECTS', 'Teacher', profile.id, null, { subjectIds }, req);

    res.json({ message: 'Subjects assigned successfully' });
  } catch (error) {
    console.error('Assign subjects error:', error);
    res.status(500).json({ error: 'Failed to assign subjects' });
  }
};

// Generate new credentials for teacher
exports.generateCredentials = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await TeacherProfile.findByPk(id, {
      include: [{ model: User }]
    });

    if (!profile) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // CRITICAL: Check multi-tenancy
    if (req.user && req.user.schoolId && profile.schoolId !== req.user.schoolId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Generate a strong temporary password
    const temporaryPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase() + '!';
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Update user password
    await User.update(
      { password: hashedPassword },
      { where: { id: profile.userId } }
    );

    await createAuditLog(req.user.id, 'GENERATE_CREDENTIALS', 'Teacher', id, null, null, req);

    res.json({
      message: 'Credentials generated successfully',
      data: {
        email: profile.User.email,
        temporaryPassword
      }
    });
  } catch (error) {
    console.error('Generate credentials error:', error);
    res.status(500).json({ error: 'Failed to generate credentials' });
  }
};
