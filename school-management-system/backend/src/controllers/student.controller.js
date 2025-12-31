const { Student, Class, Subject, ParentProfile, StudentSubject, User, Attendance, AssessmentResult, Assessment } = require('../models');
const { createAuditLog } = require('../middleware/audit.middleware');
const xlsx = require('xlsx');

// Create student
exports.createStudent = async (req, res) => {
  try {
    const {
      firstName, lastName, dateOfBirth, gender, address, phone, email,
      enrollmentDate, classId, medicalInfo, subjectIds
    } = req.body;

    // Generate unique student ID
    const studentId = `STU${Date.now().toString().slice(-8)}`;

    const student = await Student.create({
      studentId,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      address,
      phone,
      email,
      enrollmentDate: enrollmentDate || new Date(),
      classId,
      medicalInfo: medicalInfo || {}
    });

    // Enroll in subjects if provided
    if (subjectIds && subjectIds.length > 0) {
      for (const subjectId of subjectIds) {
        await StudentSubject.create({
          StudentId: student.id,
          SubjectId: subjectId
        });
      }
    }

    await createAuditLog(req.userId, 'CREATE_STUDENT', 'Student', student.id, null, student.toJSON(), req);

    res.status(201).json({
      message: 'Student created successfully',
      data: student
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
};

// Get all students
exports.getStudents = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, classId, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    // CRITICAL: Filter by school - multi-tenancy
    if (req.user && req.user.schoolId) {
      where.schoolId = req.user.schoolId;
    }

    if (classId) where.classId = classId;
    if (status) where.status = status;

    if (search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { studentId: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Student.findAndCountAll({
      where,
      include: [
        { model: Class },
        { model: Subject, as: 'subjects' },
        { model: ParentProfile, as: 'parents', include: [{ model: User }] }
      ],
      limit: parseInt(limit),
      offset,
      order: [['firstName', 'ASC']]
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
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Failed to get students' });
  }
};

// Get single student
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id, {
      include: [
        { model: Class },
        { model: Subject, as: 'subjects' },
        { model: ParentProfile, as: 'parents', include: [{ model: User }] }
      ]
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // CRITICAL: Check multi-tenancy - student must belong to user's school
    if (req.user && req.user.schoolId && student.schoolId !== req.user.schoolId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ data: student });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ error: 'Failed to get student' });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const oldValue = student.toJSON();
    const {
      firstName, lastName, dateOfBirth, gender, address, phone, email,
      classId, status, medicalInfo, subjectIds
    } = req.body;

    await student.update({
      firstName: firstName || student.firstName,
      lastName: lastName || student.lastName,
      dateOfBirth: dateOfBirth || student.dateOfBirth,
      gender: gender || student.gender,
      address: address || student.address,
      phone: phone || student.phone,
      email: email || student.email,
      classId: classId || student.classId,
      status: status || student.status,
      medicalInfo: medicalInfo || student.medicalInfo
    });

    // Update subject enrollments if provided
    if (subjectIds) {
      await StudentSubject.destroy({ where: { StudentId: student.id } });
      for (const subjectId of subjectIds) {
        await StudentSubject.create({
          StudentId: student.id,
          SubjectId: subjectId
        });
      }
    }

    await createAuditLog(req.userId, 'UPDATE_STUDENT', 'Student', student.id, oldValue, student.toJSON(), req);

    res.json({
      message: 'Student updated successfully',
      data: student
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
};

// Archive student
exports.archiveStudent = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    await student.update({ status: 'archived' });
    await createAuditLog(req.userId, 'ARCHIVE_STUDENT', 'Student', student.id, null, null, req);

    res.json({ message: 'Student archived successfully' });
  } catch (error) {
    console.error('Archive student error:', error);
    res.status(500).json({ error: 'Failed to archive student' });
  }
};

// Bulk import students
exports.bulkImport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    const results = { success: 0, failed: 0, errors: [] };

    for (const row of data) {
      try {
        const studentId = `STU${Date.now().toString().slice(-8)}${results.success}`;
        await Student.create({
          studentId,
          firstName: row.firstName || row['First Name'],
          lastName: row.lastName || row['Last Name'],
          dateOfBirth: row.dateOfBirth || row['Date of Birth'],
          gender: row.gender || row['Gender'],
          email: row.email || row['Email'],
          phone: row.phone || row['Phone'],
          address: row.address || row['Address'],
          classId: row.classId || row['Class ID'],
          enrollmentDate: new Date()
        });
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ row: row, error: error.message });
      }
    }

    await createAuditLog(req.userId, 'BULK_IMPORT_STUDENTS', 'Student', null, null, results, req);

    res.json({
      message: 'Bulk import completed',
      data: results
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: 'Failed to import students' });
  }
};

// Export students
exports.exportStudents = async (req, res) => {
  try {
    const { classId, format = 'xlsx' } = req.query;
    const where = {};
    if (classId) where.classId = classId;

    const students = await Student.findAll({
      where,
      include: [{ model: Class }],
      order: [['firstName', 'ASC']]
    });

    const data = students.map(s => ({
      'Student ID': s.studentId,
      'First Name': s.firstName,
      'Last Name': s.lastName,
      'Date of Birth': s.dateOfBirth,
      'Gender': s.gender,
      'Email': s.email,
      'Phone': s.phone,
      'Address': s.address,
      'Class': s.Class?.name,
      'Status': s.status,
      'Enrollment Date': s.enrollmentDate
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Students');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: format === 'csv' ? 'csv' : 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename=students.${format}`);
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Export students error:', error);
    res.status(500).json({ error: 'Failed to export students' });
  }
};

// Get student performance summary
exports.getStudentPerformance = async (req, res) => {
  try {
    const studentId = req.params.id;

    const student = await Student.findByPk(studentId, {
      include: [{ model: Subject, as: 'subjects' }]
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get assessment results
    const results = await AssessmentResult.findAll({
      where: { studentId },
      include: [{ model: Assessment, include: [{ model: Subject }] }],
      order: [['createdAt', 'DESC']]
    });

    // Get attendance records
    const attendance = await Attendance.findAll({
      where: { studentId },
      order: [['date', 'DESC']],
      limit: 30
    });

    // Calculate statistics
    const subjectPerformance = {};
    results.forEach(result => {
      const subjectName = result.Assessment?.Subject?.name || 'Unknown';
      if (!subjectPerformance[subjectName]) {
        subjectPerformance[subjectName] = { total: 0, count: 0 };
      }
      subjectPerformance[subjectName].total += parseFloat(result.percentage || 0);
      subjectPerformance[subjectName].count++;
    });

    const subjectAverages = Object.entries(subjectPerformance).map(([subject, data]) => ({
      subject,
      average: data.count > 0 ? (data.total / data.count).toFixed(2) : 0
    }));

    const attendanceStats = {
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      excused: attendance.filter(a => a.status === 'excused').length
    };

    res.json({
      data: {
        student,
        assessmentResults: results,
        subjectAverages,
        attendanceStats,
        recentAttendance: attendance
      }
    });
  } catch (error) {
    console.error('Get student performance error:', error);
    res.status(500).json({ error: 'Failed to get performance data' });
  }
};

// Assign parent to student
exports.assignParent = async (req, res) => {
  try {
    const { parentId } = req.body;
    const studentId = req.params.id;

    const student = await Student.findByPk(studentId);
    const parent = await ParentProfile.findByPk(parentId);

    if (!student || !parent) {
      return res.status(404).json({ error: 'Student or parent not found' });
    }

    await student.addParent(parent);
    await createAuditLog(req.userId, 'ASSIGN_PARENT', 'Student', studentId, null, { parentId }, req);

    res.json({ message: 'Parent assigned successfully' });
  } catch (error) {
    console.error('Assign parent error:', error);
    res.status(500).json({ error: 'Failed to assign parent' });
  }
};

// Enroll student in subjects
exports.enrollInSubjects = async (req, res) => {
  try {
    const { subjectIds } = req.body;
    const studentId = req.params.id;

    const student = await Student.findByPk(studentId);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    for (const subjectId of subjectIds) {
      await StudentSubject.findOrCreate({
        where: { StudentId: studentId, SubjectId: subjectId },
        defaults: { StudentId: studentId, SubjectId: subjectId }
      });
    }

    await createAuditLog(req.userId, 'ENROLL_SUBJECTS', 'Student', studentId, null, { subjectIds }, req);

    res.json({ message: 'Student enrolled in subjects successfully' });
  } catch (error) {
    console.error('Enroll in subjects error:', error);
    res.status(500).json({ error: 'Failed to enroll in subjects' });
  }
};
