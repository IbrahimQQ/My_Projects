const { Subject, Class, Student, TeacherProfile, User } = require('../models');
const { createAuditLog } = require('../middleware/audit.middleware');

// Create subject
exports.createSubject = async (req, res) => {
  try {
    const { name, code, description, curriculum, creditHours, classIds, teacherIds } = req.body;

    // Check if subject code already exists
    if (code) {
      const existing = await Subject.findOne({ where: { code } });
      if (existing) {
        return res.status(400).json({ error: 'Subject code already exists' });
      }
    }

    const subject = await Subject.create({
      name,
      code: code || `SUB${Date.now().toString().slice(-6)}`,
      description,
      curriculum: curriculum || {},
      creditHours
    });

    // Assign to classes if provided
    if (classIds && classIds.length > 0) {
      const classes = await Class.findAll({ where: { id: classIds } });
      await subject.setClasses(classes);
    }

    // Assign teachers if provided
    if (teacherIds && teacherIds.length > 0) {
      const teachers = await TeacherProfile.findAll({
        where: { userId: teacherIds }
      });
      await subject.setTeachers(teachers);
    }

    await createAuditLog(req.userId, 'CREATE_SUBJECT', 'Subject', subject.id, null, subject.toJSON(), req);

    res.status(201).json({
      message: 'Subject created successfully',
      data: subject
    });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ error: 'Failed to create subject' });
  }
};

// Get all subjects
exports.getSubjects = async (req, res) => {
  try {
    const { classId, teacherId } = req.query;

    let subjects;
    if (classId) {
      const classObj = await Class.findByPk(classId, {
        include: [{ model: Subject, as: 'subjects' }]
      });
      subjects = classObj?.subjects || [];
    } else if (teacherId) {
      const profile = await TeacherProfile.findOne({
        where: { userId: teacherId },
        include: [{ model: Subject, as: 'subjects' }]
      });
      subjects = profile?.subjects || [];
    } else {
      subjects = await Subject.findAll({
        include: [
          { model: Class, as: 'classes' },
          { model: TeacherProfile, as: 'teachers', include: [{ model: User }] }
        ],
        order: [['name', 'ASC']]
      });
    }

    res.json({ data: subjects });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ error: 'Failed to get subjects' });
  }
};

// Get single subject
exports.getSubject = async (req, res) => {
  try {
    const subject = await Subject.findByPk(req.params.id, {
      include: [
        { model: Class, as: 'classes' },
        { model: TeacherProfile, as: 'teachers', include: [{ model: User }] },
        { model: Student, as: 'students' }
      ]
    });

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    res.json({ data: subject });
  } catch (error) {
    console.error('Get subject error:', error);
    res.status(500).json({ error: 'Failed to get subject' });
  }
};

// Update subject
exports.updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByPk(req.params.id);

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const oldValue = subject.toJSON();
    const { name, code, description, curriculum, creditHours, classIds, teacherIds } = req.body;

    // Check code uniqueness if updating
    if (code && code !== subject.code) {
      const existing = await Subject.findOne({ where: { code } });
      if (existing) {
        return res.status(400).json({ error: 'Subject code already exists' });
      }
    }

    await subject.update({
      name: name || subject.name,
      code: code || subject.code,
      description: description || subject.description,
      curriculum: curriculum || subject.curriculum,
      creditHours: creditHours || subject.creditHours
    });

    if (classIds) {
      const classes = await Class.findAll({ where: { id: classIds } });
      await subject.setClasses(classes);
    }

    if (teacherIds) {
      const teachers = await TeacherProfile.findAll({ where: { userId: teacherIds } });
      await subject.setTeachers(teachers);
    }

    await createAuditLog(req.userId, 'UPDATE_SUBJECT', 'Subject', subject.id, oldValue, subject.toJSON(), req);

    res.json({
      message: 'Subject updated successfully',
      data: subject
    });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({ error: 'Failed to update subject' });
  }
};

// Delete subject
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByPk(req.params.id);

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    await subject.destroy();
    await createAuditLog(req.userId, 'DELETE_SUBJECT', 'Subject', req.params.id, subject.toJSON(), null, req);

    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
};

// Update curriculum
exports.updateCurriculum = async (req, res) => {
  try {
    const subject = await Subject.findByPk(req.params.id);

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const { curriculum } = req.body;
    await subject.update({ curriculum });

    await createAuditLog(req.userId, 'UPDATE_CURRICULUM', 'Subject', subject.id, null, curriculum, req);

    res.json({
      message: 'Curriculum updated successfully',
      data: subject
    });
  } catch (error) {
    console.error('Update curriculum error:', error);
    res.status(500).json({ error: 'Failed to update curriculum' });
  }
};
