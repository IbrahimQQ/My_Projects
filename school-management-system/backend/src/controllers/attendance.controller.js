const { Attendance, Student, Class, Subject, TeacherProfile, User } = require('../models');
const { createAuditLog } = require('../middleware/audit.middleware');
const { Op } = require('sequelize');

// Mark attendance
exports.markAttendance = async (req, res) => {
  try {
    const { classId, subjectId, date, records } = req.body;
    const teacherProfile = await TeacherProfile.findOne({ where: { userId: req.userId } });

    if (!teacherProfile) {
      return res.status(403).json({ error: 'Teacher profile not found' });
    }

    const results = [];

    for (const record of records) {
      const [attendance, created] = await Attendance.findOrCreate({
        where: {
          studentId: record.studentId,
          classId,
          subjectId,
          date
        },
        defaults: {
          studentId: record.studentId,
          classId,
          subjectId,
          date,
          status: record.status,
          remarks: record.remarks,
          markedBy: teacherProfile.id
        }
      });

      if (!created) {
        await attendance.update({
          status: record.status,
          remarks: record.remarks
        });
      }

      results.push(attendance);
    }

    await createAuditLog(req.userId, 'MARK_ATTENDANCE', 'Attendance', null, null, { date, classId, records: results.length }, req);

    res.json({
      message: 'Attendance marked successfully',
      data: results
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};

// Get attendance by class and date
exports.getClassAttendance = async (req, res) => {
  try {
    const { classId, date, subjectId } = req.query;

    const where = { classId };
    if (date) where.date = date;
    if (subjectId) where.subjectId = subjectId;

    const attendance = await Attendance.findAll({
      where,
      include: [
        { model: Student },
        { model: Subject },
        { model: TeacherProfile, include: [{ model: User }] }
      ],
      order: [['date', 'DESC']]
    });

    res.json({ data: attendance });
  } catch (error) {
    console.error('Get class attendance error:', error);
    res.status(500).json({ error: 'Failed to get attendance' });
  }
};

// Get student attendance
exports.getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, subjectId } = req.query;

    const where = { studentId };
    if (subjectId) where.subjectId = subjectId;
    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    }

    const attendance = await Attendance.findAll({
      where,
      include: [
        { model: Class },
        { model: Subject }
      ],
      order: [['date', 'DESC']]
    });

    // Calculate statistics
    const stats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      excused: attendance.filter(a => a.status === 'excused').length
    };
    stats.percentage = stats.total > 0
      ? ((stats.present + stats.late) / stats.total * 100).toFixed(2)
      : 0;

    res.json({
      data: attendance,
      stats
    });
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({ error: 'Failed to get attendance' });
  }
};

// Get attendance summary
exports.getAttendanceSummary = async (req, res) => {
  try {
    const { classId, startDate, endDate } = req.query;

    const where = {};
    if (classId) where.classId = classId;
    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    }

    const attendance = await Attendance.findAll({
      where,
      include: [{ model: Student }]
    });

    // Group by student
    const summary = {};
    attendance.forEach(record => {
      const studentId = record.studentId;
      if (!summary[studentId]) {
        summary[studentId] = {
          student: record.Student,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0
        };
      }
      summary[studentId][record.status]++;
      summary[studentId].total++;
    });

    // Calculate percentages
    Object.values(summary).forEach(s => {
      s.percentage = s.total > 0
        ? ((s.present + s.late) / s.total * 100).toFixed(2)
        : 0;
    });

    res.json({ data: Object.values(summary) });
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({ error: 'Failed to get summary' });
  }
};

// Update attendance record
exports.updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByPk(req.params.id);

    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    const { status, remarks } = req.body;

    await attendance.update({
      status: status || attendance.status,
      remarks: remarks !== undefined ? remarks : attendance.remarks
    });

    await createAuditLog(req.userId, 'UPDATE_ATTENDANCE', 'Attendance', attendance.id, null, attendance.toJSON(), req);

    res.json({
      message: 'Attendance updated successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
};

// Delete attendance record
exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByPk(req.params.id);

    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    await attendance.destroy();
    await createAuditLog(req.userId, 'DELETE_ATTENDANCE', 'Attendance', req.params.id, null, null, req);

    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ error: 'Failed to delete attendance' });
  }
};

// Get today's attendance for teacher
exports.getTodayAttendance = async (req, res) => {
  try {
    const teacherProfile = await TeacherProfile.findOne({ where: { userId: req.userId } });

    if (!teacherProfile) {
      return res.status(403).json({ error: 'Teacher profile not found' });
    }

    const today = new Date().toISOString().split('T')[0];

    const attendance = await Attendance.findAll({
      where: {
        markedBy: teacherProfile.id,
        date: today
      },
      include: [
        { model: Student },
        { model: Class },
        { model: Subject }
      ]
    });

    res.json({ data: attendance });
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({ error: 'Failed to get attendance' });
  }
};
