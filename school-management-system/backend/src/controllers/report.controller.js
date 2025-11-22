const PDFDocument = require('pdfkit');
const xlsx = require('xlsx');
const { Student, Class, Subject, Assessment, AssessmentResult, Attendance, AcademicYear, Term, TeacherProfile, User } = require('../models');
const { Op } = require('sequelize');

// Generate student progress report
exports.generateStudentReport = async (req, res) => {
  try {
    const { studentId, termId, format = 'json' } = req.query;

    const student = await Student.findByPk(studentId, {
      include: [
        { model: Class },
        { model: Subject, as: 'subjects' }
      ]
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get assessment results
    const assessmentResults = await AssessmentResult.findAll({
      where: { studentId },
      include: [{
        model: Assessment,
        where: termId ? { termId } : {},
        include: [{ model: Subject }, { model: Term }]
      }]
    });

    // Get attendance
    const attendanceWhere = { studentId };
    if (termId) {
      const term = await Term.findByPk(termId);
      if (term) {
        attendanceWhere.date = { [Op.between]: [term.startDate, term.endDate] };
      }
    }
    const attendance = await Attendance.findAll({ where: attendanceWhere });

    // Calculate subject-wise performance
    const subjectPerformance = {};
    assessmentResults.forEach(result => {
      const subjectName = result.Assessment?.Subject?.name || 'Unknown';
      if (!subjectPerformance[subjectName]) {
        subjectPerformance[subjectName] = { assessments: [], totalPercentage: 0, count: 0 };
      }
      subjectPerformance[subjectName].assessments.push({
        title: result.Assessment?.title,
        type: result.Assessment?.type,
        marks: result.marksObtained,
        total: result.Assessment?.totalMarks,
        percentage: result.percentage,
        grade: result.grade
      });
      subjectPerformance[subjectName].totalPercentage += parseFloat(result.percentage || 0);
      subjectPerformance[subjectName].count++;
    });

    // Calculate averages
    Object.keys(subjectPerformance).forEach(subject => {
      const data = subjectPerformance[subject];
      data.average = data.count > 0 ? (data.totalPercentage / data.count).toFixed(2) : 0;
    });

    // Attendance statistics
    const attendanceStats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      excused: attendance.filter(a => a.status === 'excused').length
    };
    attendanceStats.percentage = attendanceStats.total > 0
      ? ((attendanceStats.present + attendanceStats.late) / attendanceStats.total * 100).toFixed(2)
      : 0;

    const reportData = {
      student: {
        id: student.id,
        studentId: student.studentId,
        name: `${student.firstName} ${student.lastName}`,
        class: student.Class?.name,
        grade: student.Class?.grade
      },
      subjectPerformance,
      attendanceStats,
      overallAverage: Object.values(subjectPerformance).length > 0
        ? (Object.values(subjectPerformance).reduce((acc, s) => acc + parseFloat(s.average), 0) / Object.values(subjectPerformance).length).toFixed(2)
        : 0,
      generatedAt: new Date().toISOString()
    };

    if (format === 'pdf') {
      return generatePDFReport(res, reportData, 'student');
    } else if (format === 'xlsx' || format === 'csv') {
      return generateExcelReport(res, reportData, format, 'student');
    }

    res.json({ data: reportData });
  } catch (error) {
    console.error('Generate student report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

// Generate class report
exports.generateClassReport = async (req, res) => {
  try {
    const { classId, termId, format = 'json' } = req.query;

    const classObj = await Class.findByPk(classId, {
      include: [{ model: Student, as: 'students' }]
    });

    if (!classObj) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const studentIds = classObj.students.map(s => s.id);

    // Get assessment results for all students
    const assessmentResults = await AssessmentResult.findAll({
      where: { studentId: { [Op.in]: studentIds } },
      include: [{
        model: Assessment,
        where: termId ? { termId, classId } : { classId },
        include: [{ model: Subject }]
      }],
      include: [{ model: Student }]
    });

    // Build student performance matrix
    const studentPerformance = {};
    classObj.students.forEach(student => {
      studentPerformance[student.id] = {
        name: `${student.firstName} ${student.lastName}`,
        studentId: student.studentId,
        subjects: {},
        overallAverage: 0
      };
    });

    assessmentResults.forEach(result => {
      const studentId = result.studentId;
      const subjectName = result.Assessment?.Subject?.name || 'Unknown';

      if (!studentPerformance[studentId].subjects[subjectName]) {
        studentPerformance[studentId].subjects[subjectName] = { total: 0, count: 0 };
      }
      studentPerformance[studentId].subjects[subjectName].total += parseFloat(result.percentage || 0);
      studentPerformance[studentId].subjects[subjectName].count++;
    });

    // Calculate averages
    Object.values(studentPerformance).forEach(student => {
      let total = 0;
      let count = 0;
      Object.keys(student.subjects).forEach(subject => {
        const subjectData = student.subjects[subject];
        subjectData.average = subjectData.count > 0 ? (subjectData.total / subjectData.count).toFixed(2) : 0;
        total += parseFloat(subjectData.average);
        count++;
      });
      student.overallAverage = count > 0 ? (total / count).toFixed(2) : 0;
    });

    // Rank students
    const rankedStudents = Object.values(studentPerformance).sort((a, b) => b.overallAverage - a.overallAverage);
    rankedStudents.forEach((student, index) => {
      student.rank = index + 1;
    });

    const reportData = {
      class: {
        id: classObj.id,
        name: classObj.name,
        grade: classObj.grade,
        section: classObj.section,
        totalStudents: classObj.students.length
      },
      studentPerformance: rankedStudents,
      classAverage: rankedStudents.length > 0
        ? (rankedStudents.reduce((acc, s) => acc + parseFloat(s.overallAverage), 0) / rankedStudents.length).toFixed(2)
        : 0,
      generatedAt: new Date().toISOString()
    };

    if (format === 'pdf') {
      return generatePDFReport(res, reportData, 'class');
    } else if (format === 'xlsx' || format === 'csv') {
      return generateExcelReport(res, reportData, format, 'class');
    }

    res.json({ data: reportData });
  } catch (error) {
    console.error('Generate class report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

// Generate attendance report
exports.generateAttendanceReport = async (req, res) => {
  try {
    const { classId, startDate, endDate, format = 'json' } = req.query;

    const where = {};
    if (classId) where.classId = classId;
    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    }

    const attendance = await Attendance.findAll({
      where,
      include: [
        { model: Student },
        { model: Class },
        { model: Subject }
      ],
      order: [['date', 'DESC']]
    });

    // Group by student
    const studentAttendance = {};
    attendance.forEach(record => {
      const studentId = record.studentId;
      if (!studentAttendance[studentId]) {
        studentAttendance[studentId] = {
          student: record.Student,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0
        };
      }
      studentAttendance[studentId][record.status]++;
      studentAttendance[studentId].total++;
    });

    // Calculate percentages
    Object.values(studentAttendance).forEach(s => {
      s.percentage = s.total > 0
        ? ((s.present + s.late) / s.total * 100).toFixed(2)
        : 0;
    });

    const reportData = {
      dateRange: { startDate, endDate },
      classId,
      studentAttendance: Object.values(studentAttendance),
      summary: {
        totalRecords: attendance.length,
        averageAttendance: Object.values(studentAttendance).length > 0
          ? (Object.values(studentAttendance).reduce((acc, s) => acc + parseFloat(s.percentage), 0) / Object.values(studentAttendance).length).toFixed(2)
          : 0
      },
      generatedAt: new Date().toISOString()
    };

    if (format === 'pdf') {
      return generatePDFReport(res, reportData, 'attendance');
    } else if (format === 'xlsx' || format === 'csv') {
      return generateExcelReport(res, reportData, format, 'attendance');
    }

    res.json({ data: reportData });
  } catch (error) {
    console.error('Generate attendance report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

// Generate custom report
exports.generateCustomReport = async (req, res) => {
  try {
    const { reportType, filters, format = 'json' } = req.body;

    let reportData = {};

    switch (reportType) {
      case 'teacher_performance':
        reportData = await generateTeacherPerformanceReport(filters);
        break;
      case 'subject_analysis':
        reportData = await generateSubjectAnalysisReport(filters);
        break;
      case 'comparative':
        reportData = await generateComparativeReport(filters);
        break;
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    if (format === 'pdf') {
      return generatePDFReport(res, reportData, reportType);
    } else if (format === 'xlsx' || format === 'csv') {
      return generateExcelReport(res, reportData, format, reportType);
    }

    res.json({ data: reportData });
  } catch (error) {
    console.error('Generate custom report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

// Helper function to generate PDF
function generatePDFReport(res, data, reportType) {
  const doc = new PDFDocument();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${reportType}-report.pdf`);

  doc.pipe(res);

  // Header
  doc.fontSize(20).text('School Management System', { align: 'center' });
  doc.fontSize(16).text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text(`Generated: ${data.generatedAt || new Date().toISOString()}`, { align: 'right' });
  doc.moveDown();

  // Content based on report type
  if (reportType === 'student' && data.student) {
    doc.fontSize(14).text(`Student: ${data.student.name}`);
    doc.fontSize(12).text(`ID: ${data.student.studentId}`);
    doc.text(`Class: ${data.student.class} - ${data.student.grade}`);
    doc.moveDown();

    doc.fontSize(14).text('Subject Performance:');
    Object.entries(data.subjectPerformance || {}).forEach(([subject, perf]) => {
      doc.fontSize(12).text(`${subject}: ${perf.average}%`);
    });
    doc.moveDown();

    doc.fontSize(14).text('Attendance:');
    doc.fontSize(12).text(`Attendance Rate: ${data.attendanceStats?.percentage}%`);
  }

  doc.end();
}

// Helper function to generate Excel
function generateExcelReport(res, data, format, reportType) {
  let sheetData = [];

  if (reportType === 'student' && data.subjectPerformance) {
    sheetData = Object.entries(data.subjectPerformance).map(([subject, perf]) => ({
      Subject: subject,
      'Average (%)': perf.average,
      'Assessments': perf.count
    }));
  } else if (reportType === 'class' && data.studentPerformance) {
    sheetData = data.studentPerformance.map(s => ({
      'Rank': s.rank,
      'Student ID': s.studentId,
      'Name': s.name,
      'Average (%)': s.overallAverage
    }));
  } else if (reportType === 'attendance' && data.studentAttendance) {
    sheetData = data.studentAttendance.map(s => ({
      'Student': `${s.student?.firstName} ${s.student?.lastName}`,
      'Present': s.present,
      'Absent': s.absent,
      'Late': s.late,
      'Excused': s.excused,
      'Total': s.total,
      'Percentage': s.percentage
    }));
  }

  const worksheet = xlsx.utils.json_to_sheet(sheetData);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Report');

  const buffer = xlsx.write(workbook, { type: 'buffer', bookType: format === 'csv' ? 'csv' : 'xlsx' });

  res.setHeader('Content-Disposition', `attachment; filename=${reportType}-report.${format}`);
  res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
}

// Helper functions for custom reports
async function generateTeacherPerformanceReport(filters) {
  // Implementation for teacher performance report
  return { type: 'teacher_performance', data: {} };
}

async function generateSubjectAnalysisReport(filters) {
  // Implementation for subject analysis report
  return { type: 'subject_analysis', data: {} };
}

async function generateComparativeReport(filters) {
  // Implementation for comparative report
  return { type: 'comparative', data: {} };
}
