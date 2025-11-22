const { User, Student, Class, Subject, TeacherProfile, Assessment, AssessmentResult, Attendance, AcademicYear, Term, Invoice, Payment, ParentProfile } = require('../models');
const { Op } = require('sequelize');

// Principal dashboard
exports.getPrincipalDashboard = async (req, res) => {
  try {
    // Get current academic year
    const currentYear = await AcademicYear.findOne({ where: { isCurrent: true } });

    // Counts
    const totalStudents = await Student.count({ where: { status: 'active' } });
    const totalTeachers = await User.count({ where: { role: 'teacher', isActive: true } });
    const totalParents = await User.count({ where: { role: 'parent', isActive: true } });
    const totalClasses = await Class.count({ where: currentYear ? { academicYearId: currentYear.id } : {} });
    const totalSubjects = await Subject.count();

    // Today's attendance
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = await Attendance.findAll({ where: { date: today } });
    const attendanceStats = {
      present: todayAttendance.filter(a => a.status === 'present').length,
      absent: todayAttendance.filter(a => a.status === 'absent').length,
      late: todayAttendance.filter(a => a.status === 'late').length,
      total: todayAttendance.length
    };

    // Recent assessments
    const recentAssessments = await Assessment.findAll({
      include: [{ model: Subject }, { model: Class }],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Financial overview
    const pendingInvoices = await Invoice.count({ where: { status: 'pending' } });
    const totalRevenue = await Payment.sum('amount', {
      where: { status: 'completed' }
    });

    // Student enrollment trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const enrollmentTrend = await Student.findAll({
      where: { enrollmentDate: { [Op.gte]: sixMonthsAgo } },
      attributes: [
        [require('sequelize').fn('DATE_TRUNC', 'month', require('sequelize').col('enrollment_date')), 'month'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['month'],
      raw: true
    });

    res.json({
      data: {
        counts: {
          students: totalStudents,
          teachers: totalTeachers,
          parents: totalParents,
          classes: totalClasses,
          subjects: totalSubjects
        },
        currentAcademicYear: currentYear,
        todayAttendance: attendanceStats,
        recentAssessments,
        financialOverview: {
          pendingInvoices,
          totalRevenue: totalRevenue || 0
        },
        enrollmentTrend
      }
    });
  } catch (error) {
    console.error('Get principal dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
};

// Teacher dashboard
exports.getTeacherDashboard = async (req, res) => {
  try {
    const teacherProfile = await TeacherProfile.findOne({
      where: { userId: req.userId },
      include: [{ model: Subject, as: 'subjects' }]
    });

    if (!teacherProfile) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    const today = new Date().toISOString().split('T')[0];

    // Get today's schedule
    const dayOfWeek = new Date().getDay();
    const todaySchedule = await require('../models').Schedule.findAll({
      where: { teacherId: teacherProfile.id, dayOfWeek },
      include: [{ model: Class }, { model: Subject }],
      order: [['startTime', 'ASC']]
    });

    // Get assigned subjects and classes
    const subjects = teacherProfile.subjects || [];

    // Recent attendance marked
    const recentAttendance = await Attendance.findAll({
      where: { markedBy: teacherProfile.id },
      include: [{ model: Class }, { model: Subject }],
      order: [['date', 'DESC']],
      limit: 5
    });

    // Pending assessments to grade
    const pendingGrading = await Assessment.findAll({
      where: { createdBy: teacherProfile.id, status: 'active' },
      include: [{ model: Subject }, { model: Class }],
      limit: 5
    });

    // Recent class records
    const recentRecords = await require('../models').ClassRecord.findAll({
      where: { teacherId: teacherProfile.id },
      include: [{ model: Class }, { model: Subject }],
      order: [['date', 'DESC']],
      limit: 5
    });

    // Student count in assigned classes
    const classIds = [...new Set(todaySchedule.map(s => s.classId))];
    const studentCount = await Student.count({
      where: { classId: { [Op.in]: classIds }, status: 'active' }
    });

    res.json({
      data: {
        profile: teacherProfile,
        subjects,
        todaySchedule,
        recentAttendance,
        pendingGrading,
        recentRecords,
        studentCount
      }
    });
  } catch (error) {
    console.error('Get teacher dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
};

// Parent dashboard
exports.getParentDashboard = async (req, res) => {
  try {
    const parentProfile = await ParentProfile.findOne({
      where: { userId: req.userId },
      include: [{
        model: Student,
        as: 'children',
        include: [
          { model: Class },
          { model: Subject, as: 'subjects' }
        ]
      }]
    });

    if (!parentProfile) {
      return res.status(404).json({ error: 'Parent profile not found' });
    }

    const children = parentProfile.children || [];
    const childrenData = [];

    for (const child of children) {
      const childData = {
        student: child,
        recentGrades: null,
        attendance: null,
        upcomingAssessments: null
      };

      // Get recent grades if permitted
      if (parentProfile.canViewGrades) {
        childData.recentGrades = await AssessmentResult.findAll({
          where: { studentId: child.id },
          include: [{ model: Assessment, include: [{ model: Subject }] }],
          order: [['gradedAt', 'DESC']],
          limit: 5
        });
      }

      // Get attendance if permitted
      if (parentProfile.canViewAttendance) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const attendance = await Attendance.findAll({
          where: {
            studentId: child.id,
            date: { [Op.gte]: thirtyDaysAgo.toISOString().split('T')[0] }
          }
        });

        childData.attendance = {
          present: attendance.filter(a => a.status === 'present').length,
          absent: attendance.filter(a => a.status === 'absent').length,
          late: attendance.filter(a => a.status === 'late').length,
          total: attendance.length,
          percentage: attendance.length > 0
            ? ((attendance.filter(a => a.status === 'present' || a.status === 'late').length / attendance.length) * 100).toFixed(2)
            : 100
        };
      }

      // Get upcoming assessments
      if (parentProfile.canViewAssessments) {
        childData.upcomingAssessments = await Assessment.findAll({
          where: {
            classId: child.classId,
            scheduledDate: { [Op.gte]: new Date() },
            status: { [Op.in]: ['scheduled', 'active'] }
          },
          include: [{ model: Subject }],
          order: [['scheduledDate', 'ASC']],
          limit: 5
        });
      }

      childrenData.push(childData);
    }

    res.json({
      data: {
        profile: parentProfile,
        permissions: {
          canViewGrades: parentProfile.canViewGrades,
          canViewAttendance: parentProfile.canViewAttendance,
          canViewAssessments: parentProfile.canViewAssessments,
          canMessageTeachers: parentProfile.canMessageTeachers
        },
        children: childrenData
      }
    });
  } catch (error) {
    console.error('Get parent dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
};

// Quick stats endpoint
exports.getQuickStats = async (req, res) => {
  try {
    const stats = {};

    switch (req.user.role) {
      case 'principal':
      case 'admin':
        stats.students = await Student.count({ where: { status: 'active' } });
        stats.teachers = await User.count({ where: { role: 'teacher', isActive: true } });
        stats.pendingFees = await Invoice.count({ where: { status: 'pending' } });
        break;
      case 'teacher':
        const teacherProfile = await TeacherProfile.findOne({ where: { userId: req.userId } });
        if (teacherProfile) {
          stats.subjects = await require('../models').TeacherSubject.count({ where: { TeacherProfileId: teacherProfile.id } });
          stats.pendingGrading = await Assessment.count({ where: { createdBy: teacherProfile.id, status: 'active' } });
        }
        break;
      case 'parent':
        const parentProfile = await ParentProfile.findOne({ where: { userId: req.userId } });
        if (parentProfile) {
          const children = await parentProfile.getChildren();
          stats.children = children.length;
        }
        break;
    }

    res.json({ data: stats });
  } catch (error) {
    console.error('Get quick stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
};
