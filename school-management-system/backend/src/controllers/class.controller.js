const { Class, AcademicYear, Subject, Student, Schedule, TeacherProfile } = require('../models');
const { createAuditLog } = require('../middleware/audit.middleware');

// Create class
exports.createClass = async (req, res) => {
  try {
    const { name, grade, section, capacity, room, academicYearId, subjectIds } = req.body;

    const classObj = await Class.create({
      name,
      grade,
      section,
      capacity,
      room,
      academicYearId
    });

    // Assign subjects if provided
    if (subjectIds && subjectIds.length > 0) {
      const subjects = await Subject.findAll({ where: { id: subjectIds } });
      await classObj.setSubjects(subjects);
    }

    await createAuditLog(req.userId, 'CREATE_CLASS', 'Class', classObj.id, null, classObj.toJSON(), req);

    res.status(201).json({
      message: 'Class created successfully',
      data: classObj
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ error: 'Failed to create class' });
  }
};

// Get all classes
exports.getClasses = async (req, res) => {
  try {
    const { academicYearId, grade } = req.query;
    const where = {};

    if (academicYearId) where.academicYearId = academicYearId;
    if (grade) where.grade = grade;

    const classes = await Class.findAll({
      where,
      include: [
        { model: AcademicYear },
        { model: Subject, as: 'subjects' },
        { model: Student, as: 'students' }
      ],
      order: [['grade', 'ASC'], ['section', 'ASC']]
    });

    res.json({ data: classes });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Failed to get classes' });
  }
};

// Get single class
exports.getClass = async (req, res) => {
  try {
    const classObj = await Class.findByPk(req.params.id, {
      include: [
        { model: AcademicYear },
        { model: Subject, as: 'subjects' },
        { model: Student, as: 'students' }
      ]
    });

    if (!classObj) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json({ data: classObj });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ error: 'Failed to get class' });
  }
};

// Update class
exports.updateClass = async (req, res) => {
  try {
    const classObj = await Class.findByPk(req.params.id);

    if (!classObj) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const oldValue = classObj.toJSON();
    const { name, grade, section, capacity, room, subjectIds } = req.body;

    await classObj.update({
      name: name || classObj.name,
      grade: grade || classObj.grade,
      section: section || classObj.section,
      capacity: capacity || classObj.capacity,
      room: room || classObj.room
    });

    if (subjectIds) {
      const subjects = await Subject.findAll({ where: { id: subjectIds } });
      await classObj.setSubjects(subjects);
    }

    await createAuditLog(req.userId, 'UPDATE_CLASS', 'Class', classObj.id, oldValue, classObj.toJSON(), req);

    res.json({
      message: 'Class updated successfully',
      data: classObj
    });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ error: 'Failed to update class' });
  }
};

// Delete class
exports.deleteClass = async (req, res) => {
  try {
    const classObj = await Class.findByPk(req.params.id);

    if (!classObj) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Check if class has students
    const studentCount = await Student.count({ where: { classId: classObj.id } });
    if (studentCount > 0) {
      return res.status(400).json({ error: 'Cannot delete class with enrolled students' });
    }

    await classObj.destroy();
    await createAuditLog(req.userId, 'DELETE_CLASS', 'Class', req.params.id, classObj.toJSON(), null, req);

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ error: 'Failed to delete class' });
  }
};

// Get class schedule
exports.getClassSchedule = async (req, res) => {
  try {
    const schedules = await Schedule.findAll({
      where: { classId: req.params.id },
      include: [
        { model: Subject },
        { model: TeacherProfile, include: [{ model: require('../models').User }] }
      ],
      order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']]
    });

    res.json({ data: schedules });
  } catch (error) {
    console.error('Get class schedule error:', error);
    res.status(500).json({ error: 'Failed to get schedule' });
  }
};

// Get class students
exports.getClassStudents = async (req, res) => {
  try {
    const students = await Student.findAll({
      where: { classId: req.params.id },
      include: [{ model: Subject, as: 'subjects' }],
      order: [['firstName', 'ASC']]
    });

    res.json({ data: students });
  } catch (error) {
    console.error('Get class students error:', error);
    res.status(500).json({ error: 'Failed to get students' });
  }
};
