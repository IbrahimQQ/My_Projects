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

// Generate comprehensive report card
exports.generateReportCard = async (req, res) => {
  try {
    const { studentId, termId } = req.query;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const student = await Student.findByPk(studentId, {
      include: [
        { model: Class, include: [{ model: TeacherProfile, as: 'classTeacher', include: [{ model: User }] }] },
        { model: Subject, as: 'subjects' }
      ]
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get term info
    let term = null;
    if (termId) {
      term = await Term.findByPk(termId, { include: [{ model: AcademicYear }] });
    }

    // Get all students in the same class for comparative analysis
    const classmates = await Student.findAll({ where: { classId: student.classId } });
    const classmateIds = classmates.map(c => c.id);

    // Get assessment results for this student
    const assessmentWhere = termId ? { termId } : {};
    const studentResults = await AssessmentResult.findAll({
      where: { studentId },
      include: [{
        model: Assessment,
        where: assessmentWhere,
        include: [{ model: Subject }, { model: Term }]
      }]
    });

    // Get assessment results for all classmates (for comparison)
    const classResults = await AssessmentResult.findAll({
      where: { studentId: { [Op.in]: classmateIds } },
      include: [{
        model: Assessment,
        where: assessmentWhere,
        include: [{ model: Subject }]
      }]
    });

    // Get attendance for this student
    const attendanceWhere = { studentId };
    if (term) {
      attendanceWhere.date = { [Op.between]: [term.startDate, term.endDate] };
    }
    const attendance = await Attendance.findAll({ where: attendanceWhere });

    // Calculate subject-wise performance with detailed analysis
    const subjectPerformance = {};
    const classSubjectAverages = {};

    // First, calculate class averages per subject
    classResults.forEach(result => {
      const subjectName = result.Assessment?.Subject?.name;
      if (!subjectName) return;

      if (!classSubjectAverages[subjectName]) {
        classSubjectAverages[subjectName] = { total: 0, count: 0 };
      }
      classSubjectAverages[subjectName].total += parseFloat(result.percentage || 0);
      classSubjectAverages[subjectName].count++;
    });

    Object.keys(classSubjectAverages).forEach(subject => {
      const data = classSubjectAverages[subject];
      data.average = data.count > 0 ? (data.total / data.count) : 0;
    });

    // Now calculate student performance with comparison
    studentResults.forEach(result => {
      const subjectName = result.Assessment?.Subject?.name;
      if (!subjectName) return;

      if (!subjectPerformance[subjectName]) {
        subjectPerformance[subjectName] = {
          assessments: [],
          totalPercentage: 0,
          count: 0,
          classAverage: classSubjectAverages[subjectName]?.average || 0
        };
      }

      subjectPerformance[subjectName].assessments.push({
        title: result.Assessment?.title,
        type: result.Assessment?.type,
        marks: result.marksObtained,
        total: result.Assessment?.totalMarks,
        percentage: parseFloat(result.percentage || 0),
        grade: result.grade,
        failureReason: result.failureReason,
        feedback: result.feedback,
        date: result.Assessment?.date
      });
      subjectPerformance[subjectName].totalPercentage += parseFloat(result.percentage || 0);
      subjectPerformance[subjectName].count++;
    });

    // Calculate averages, grades, and generate analysis
    Object.keys(subjectPerformance).forEach(subject => {
      const data = subjectPerformance[subject];
      data.average = data.count > 0 ? (data.totalPercentage / data.count) : 0;
      data.grade = calculateGrade(data.average);
      data.comparisonToClass = data.average - data.classAverage;
      data.performanceLevel = getPerformanceLevel(data.average);
      data.trend = calculateTrend(data.assessments);
      data.improvementSuggestions = generateImprovementSuggestions(subject, data);
      data.parentExplanation = generateParentExplanation(subject, data);
    });

    // Calculate class rank
    const studentOverallAverage = Object.values(subjectPerformance).length > 0
      ? Object.values(subjectPerformance).reduce((acc, s) => acc + s.average, 0) / Object.values(subjectPerformance).length
      : 0;

    // Calculate all student averages for ranking
    const studentAverages = {};
    classResults.forEach(result => {
      const sid = result.studentId;
      if (!studentAverages[sid]) {
        studentAverages[sid] = { total: 0, count: 0, subjects: {} };
      }
      const subjectName = result.Assessment?.Subject?.name;
      if (!studentAverages[sid].subjects[subjectName]) {
        studentAverages[sid].subjects[subjectName] = { total: 0, count: 0 };
      }
      studentAverages[sid].subjects[subjectName].total += parseFloat(result.percentage || 0);
      studentAverages[sid].subjects[subjectName].count++;
    });

    const rankedStudents = Object.entries(studentAverages).map(([sid, data]) => {
      let subjectCount = 0;
      let totalAverage = 0;
      Object.values(data.subjects).forEach(subj => {
        if (subj.count > 0) {
          totalAverage += subj.total / subj.count;
          subjectCount++;
        }
      });
      return {
        studentId: parseInt(sid),
        average: subjectCount > 0 ? totalAverage / subjectCount : 0
      };
    }).sort((a, b) => b.average - a.average);

    const classRank = rankedStudents.findIndex(s => s.studentId === student.id) + 1;
    const totalStudents = classmates.length;

    // Attendance statistics
    const attendanceStats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      excused: attendance.filter(a => a.status === 'excused').length
    };
    attendanceStats.percentage = attendanceStats.total > 0
      ? ((attendanceStats.present + attendanceStats.late) / attendanceStats.total * 100)
      : 100;
    attendanceStats.rating = getAttendanceRating(attendanceStats.percentage);
    attendanceStats.parentExplanation = generateAttendanceExplanation(attendanceStats);

    // Overall assessment
    const overallGrade = calculateGrade(studentOverallAverage);
    const classAverage = rankedStudents.length > 0
      ? rankedStudents.reduce((acc, s) => acc + s.average, 0) / rankedStudents.length
      : 0;

    // Generate strengths and areas for improvement
    const strengths = [];
    const areasForImprovement = [];

    Object.entries(subjectPerformance).forEach(([subject, data]) => {
      if (data.average >= 80) {
        strengths.push({ subject, average: data.average, note: `Excellent performance in ${subject}` });
      } else if (data.average < 60) {
        areasForImprovement.push({ subject, average: data.average, suggestions: data.improvementSuggestions });
      }
    });

    // Overall improvement suggestions
    const overallSuggestions = generateOverallSuggestions(subjectPerformance, attendanceStats, studentOverallAverage);

    const reportCard = {
      student: {
        id: student.id,
        studentId: student.studentId,
        name: `${student.firstName} ${student.lastName}`,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        photo: student.photo
      },
      class: {
        name: student.Class?.name,
        gradeLevel: student.Class?.gradeLevel,
        section: student.Class?.section,
        classTeacher: student.Class?.classTeacher?.User
          ? `${student.Class.classTeacher.User.firstName} ${student.Class.classTeacher.User.lastName}`
          : null
      },
      term: term ? {
        name: term.name,
        academicYear: term.AcademicYear?.name,
        startDate: term.startDate,
        endDate: term.endDate
      } : null,
      academicPerformance: {
        subjects: subjectPerformance,
        overallAverage: parseFloat(studentOverallAverage.toFixed(2)),
        overallGrade,
        classAverage: parseFloat(classAverage.toFixed(2)),
        comparisonToClass: parseFloat((studentOverallAverage - classAverage).toFixed(2)),
        classRank,
        totalStudents,
        percentile: parseFloat((((totalStudents - classRank) / totalStudents) * 100).toFixed(1))
      },
      attendance: attendanceStats,
      analysis: {
        strengths,
        areasForImprovement,
        overallSuggestions,
        parentSummary: generateParentSummary(student, subjectPerformance, attendanceStats, classRank, totalStudents, studentOverallAverage)
      },
      generatedAt: new Date().toISOString()
    };

    res.json({ data: reportCard });
  } catch (error) {
    console.error('Generate report card error:', error);
    res.status(500).json({ error: 'Failed to generate report card' });
  }
};

// Generate report cards for entire class
exports.generateClassReportCards = async (req, res) => {
  try {
    const { classId, termId } = req.query;

    if (!classId) {
      return res.status(400).json({ error: 'Class ID is required' });
    }

    const classObj = await Class.findByPk(classId, {
      include: [{ model: Student, as: 'students' }]
    });

    if (!classObj) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const reportCards = [];
    for (const student of classObj.students) {
      // Simplified version for bulk generation
      const studentResults = await AssessmentResult.findAll({
        where: { studentId: student.id },
        include: [{
          model: Assessment,
          where: termId ? { termId } : {},
          include: [{ model: Subject }]
        }]
      });

      const subjectPerformance = {};
      studentResults.forEach(result => {
        const subjectName = result.Assessment?.Subject?.name;
        if (!subjectName) return;
        if (!subjectPerformance[subjectName]) {
          subjectPerformance[subjectName] = { total: 0, count: 0 };
        }
        subjectPerformance[subjectName].total += parseFloat(result.percentage || 0);
        subjectPerformance[subjectName].count++;
      });

      let totalAvg = 0;
      let subjectCount = 0;
      Object.values(subjectPerformance).forEach(data => {
        if (data.count > 0) {
          totalAvg += data.total / data.count;
          subjectCount++;
        }
      });

      const overallAverage = subjectCount > 0 ? totalAvg / subjectCount : 0;

      reportCards.push({
        studentId: student.id,
        studentNumber: student.studentId,
        name: `${student.firstName} ${student.lastName}`,
        overallAverage: parseFloat(overallAverage.toFixed(2)),
        grade: calculateGrade(overallAverage),
        subjectCount: Object.keys(subjectPerformance).length
      });
    }

    // Sort by average and add ranks
    reportCards.sort((a, b) => b.overallAverage - a.overallAverage);
    reportCards.forEach((card, index) => {
      card.rank = index + 1;
    });

    res.json({
      data: {
        class: { id: classObj.id, name: classObj.name },
        reportCards,
        totalStudents: reportCards.length,
        classAverage: reportCards.length > 0
          ? parseFloat((reportCards.reduce((acc, c) => acc + c.overallAverage, 0) / reportCards.length).toFixed(2))
          : 0,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Generate class report cards error:', error);
    res.status(500).json({ error: 'Failed to generate class report cards' });
  }
};

// Helper functions for report card generation
function calculateGrade(percentage) {
  if (percentage >= 90) return { letter: 'A+', gpa: 4.0, description: 'Outstanding' };
  if (percentage >= 85) return { letter: 'A', gpa: 4.0, description: 'Excellent' };
  if (percentage >= 80) return { letter: 'A-', gpa: 3.7, description: 'Very Good' };
  if (percentage >= 75) return { letter: 'B+', gpa: 3.3, description: 'Good' };
  if (percentage >= 70) return { letter: 'B', gpa: 3.0, description: 'Above Average' };
  if (percentage >= 65) return { letter: 'B-', gpa: 2.7, description: 'Satisfactory' };
  if (percentage >= 60) return { letter: 'C+', gpa: 2.3, description: 'Average' };
  if (percentage >= 55) return { letter: 'C', gpa: 2.0, description: 'Below Average' };
  if (percentage >= 50) return { letter: 'C-', gpa: 1.7, description: 'Needs Improvement' };
  if (percentage >= 45) return { letter: 'D', gpa: 1.0, description: 'Poor' };
  return { letter: 'F', gpa: 0.0, description: 'Failing' };
}

function getPerformanceLevel(percentage) {
  if (percentage >= 85) return { level: 'Exceeding Expectations', color: 'green', icon: 'star' };
  if (percentage >= 70) return { level: 'Meeting Expectations', color: 'blue', icon: 'check' };
  if (percentage >= 55) return { level: 'Approaching Expectations', color: 'yellow', icon: 'arrow-up' };
  return { level: 'Below Expectations', color: 'red', icon: 'alert' };
}

function calculateTrend(assessments) {
  if (assessments.length < 2) return { direction: 'stable', description: 'Not enough data' };

  const sorted = [...assessments].sort((a, b) => new Date(a.date) - new Date(b.date));
  const firstHalf = sorted.slice(0, Math.ceil(sorted.length / 2));
  const secondHalf = sorted.slice(Math.ceil(sorted.length / 2));

  const firstAvg = firstHalf.reduce((acc, a) => acc + a.percentage, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((acc, a) => acc + a.percentage, 0) / secondHalf.length;

  const diff = secondAvg - firstAvg;

  if (diff > 5) return { direction: 'improving', change: diff.toFixed(1), description: 'Performance is improving' };
  if (diff < -5) return { direction: 'declining', change: diff.toFixed(1), description: 'Performance needs attention' };
  return { direction: 'stable', change: diff.toFixed(1), description: 'Performance is consistent' };
}

function generateImprovementSuggestions(subject, data) {
  const suggestions = [];

  if (data.average < 50) {
    suggestions.push(`Schedule additional support sessions for ${subject}`);
    suggestions.push('Consider one-on-one tutoring');
    suggestions.push('Review foundational concepts');
  } else if (data.average < 70) {
    suggestions.push(`Practice more ${subject} exercises at home`);
    suggestions.push('Complete all homework assignments on time');
    suggestions.push('Ask questions in class when concepts are unclear');
  } else if (data.average < 85) {
    suggestions.push('Challenge yourself with advanced problems');
    suggestions.push('Help classmates to reinforce your understanding');
  }

  // Check for specific failure reasons
  const failureReasons = data.assessments
    .filter(a => a.failureReason)
    .map(a => a.failureReason);

  if (failureReasons.includes('lack_of_understanding')) {
    suggestions.push('Review class notes and textbook more thoroughly');
  }
  if (failureReasons.includes('time_management')) {
    suggestions.push('Practice timed exercises to improve speed');
  }
  if (failureReasons.includes('careless_mistakes')) {
    suggestions.push('Take time to review answers before submitting');
  }

  if (data.trend?.direction === 'declining') {
    suggestions.push('Identify what changed recently and address it');
  }

  return suggestions.length > 0 ? suggestions : ['Keep up the excellent work!'];
}

function generateParentExplanation(subject, data) {
  const avg = data.average;
  const comparison = data.comparisonToClass;

  let explanation = `In ${subject}, your child scored an average of ${avg.toFixed(1)}% across ${data.count} assessments. `;

  if (comparison > 10) {
    explanation += `This is significantly above the class average, showing excellent understanding of the material. `;
  } else if (comparison > 0) {
    explanation += `This is above the class average, indicating good progress. `;
  } else if (comparison > -10) {
    explanation += `This is close to the class average. `;
  } else {
    explanation += `This is below the class average, and we recommend additional support. `;
  }

  if (data.trend?.direction === 'improving') {
    explanation += `We're pleased to see improvement over the term.`;
  } else if (data.trend?.direction === 'declining') {
    explanation += `We've noticed a decline and would like to work with you to address this.`;
  }

  return explanation;
}

function getAttendanceRating(percentage) {
  if (percentage >= 95) return { rating: 'Excellent', color: 'green' };
  if (percentage >= 90) return { rating: 'Good', color: 'blue' };
  if (percentage >= 80) return { rating: 'Satisfactory', color: 'yellow' };
  if (percentage >= 70) return { rating: 'Needs Improvement', color: 'orange' };
  return { rating: 'Poor', color: 'red' };
}

function generateAttendanceExplanation(stats) {
  let explanation = `Your child attended ${stats.present} out of ${stats.total} school days (${stats.percentage.toFixed(1)}% attendance rate). `;

  if (stats.late > 0) {
    explanation += `There were ${stats.late} instances of late arrival. `;
  }
  if (stats.absent > 0) {
    explanation += `There were ${stats.absent} absences${stats.excused > 0 ? ` (${stats.excused} excused)` : ''}. `;
  }

  if (stats.percentage >= 95) {
    explanation += 'Excellent attendance contributes greatly to academic success!';
  } else if (stats.percentage < 80) {
    explanation += 'Regular attendance is crucial for learning. Please ensure your child attends school consistently.';
  }

  return explanation;
}

function generateOverallSuggestions(subjectPerformance, attendanceStats, overallAverage) {
  const suggestions = [];

  if (overallAverage >= 85) {
    suggestions.push('Continue to encourage your child\'s excellent academic performance');
    suggestions.push('Consider enrichment activities or competitions to challenge them further');
  } else if (overallAverage >= 70) {
    suggestions.push('Maintain consistent study habits');
    suggestions.push('Focus on subjects that need more attention');
  } else {
    suggestions.push('Establish a regular homework and study schedule');
    suggestions.push('Consider meeting with teachers to discuss support strategies');
    suggestions.push('Ensure adequate sleep and nutrition for better focus');
  }

  if (attendanceStats.percentage < 90) {
    suggestions.push('Prioritize regular school attendance');
  }

  const weakSubjects = Object.entries(subjectPerformance)
    .filter(([_, data]) => data.average < 60)
    .map(([subject, _]) => subject);

  if (weakSubjects.length > 0) {
    suggestions.push(`Schedule extra help sessions for: ${weakSubjects.join(', ')}`);
  }

  return suggestions;
}

function generateParentSummary(student, subjectPerformance, attendanceStats, classRank, totalStudents, overallAverage) {
  const name = student.firstName;
  const subjects = Object.keys(subjectPerformance);
  const strongSubjects = Object.entries(subjectPerformance)
    .filter(([_, data]) => data.average >= 80)
    .map(([subject, _]) => subject);
  const weakSubjects = Object.entries(subjectPerformance)
    .filter(([_, data]) => data.average < 60)
    .map(([subject, _]) => subject);

  let summary = `Dear Parent/Guardian,\n\n`;
  summary += `This report card summarizes ${name}'s academic progress. `;
  summary += `${name} achieved an overall average of ${overallAverage.toFixed(1)}% and is ranked ${classRank} out of ${totalStudents} students in the class.\n\n`;

  if (strongSubjects.length > 0) {
    summary += `${name} shows particular strength in ${strongSubjects.join(', ')}. `;
  }

  if (weakSubjects.length > 0) {
    summary += `Additional support may be beneficial in ${weakSubjects.join(', ')}. `;
  }

  summary += `\n\nAttendance rate: ${attendanceStats.percentage.toFixed(1)}% (${attendanceStats.rating.rating}).\n\n`;

  if (overallAverage >= 80) {
    summary += `Overall, ${name} is performing excellently. We encourage continued effort and exploration of new challenges.`;
  } else if (overallAverage >= 60) {
    summary += `Overall, ${name} is making satisfactory progress. With continued effort and focus, we expect to see further improvement.`;
  } else {
    summary += `We would like to schedule a meeting to discuss strategies to support ${name}'s learning. Please contact the school office.`;
  }

  summary += `\n\nThank you for your partnership in your child's education.\n\nSincerely,\nThe School Team`;

  return summary;
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
