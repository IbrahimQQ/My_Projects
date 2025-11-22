const { Assessment, AssessmentResult, Question, Student, Subject, Class, TeacherProfile, Term, FailureReason } = require('../models');
const { createAuditLog } = require('../middleware/audit.middleware');

// Create assessment
exports.createAssessment = async (req, res) => {
  try {
    const {
      title, type, description, instructions, totalMarks, passingMarks,
      duration, scheduledDate, dueDate, classId, subjectId, termId, questionIds
    } = req.body;

    const teacherProfile = await TeacherProfile.findOne({ where: { userId: req.userId } });

    const assessment = await Assessment.create({
      title,
      type,
      description,
      instructions,
      totalMarks,
      passingMarks,
      duration,
      scheduledDate,
      dueDate,
      classId,
      subjectId,
      termId,
      createdBy: teacherProfile?.id,
      status: 'draft',
      questions: questionIds || []
    });

    await createAuditLog(req.userId, 'CREATE_ASSESSMENT', 'Assessment', assessment.id, null, assessment.toJSON(), req);

    res.status(201).json({
      message: 'Assessment created successfully',
      data: assessment
    });
  } catch (error) {
    console.error('Create assessment error:', error);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
};

// Get all assessments
exports.getAssessments = async (req, res) => {
  try {
    const { classId, subjectId, termId, status, type } = req.query;
    const where = {};

    if (classId) where.classId = classId;
    if (subjectId) where.subjectId = subjectId;
    if (termId) where.termId = termId;
    if (status) where.status = status;
    if (type) where.type = type;

    // For teachers, filter by their created assessments
    if (req.user.role === 'teacher') {
      const teacherProfile = await TeacherProfile.findOne({ where: { userId: req.userId } });
      if (teacherProfile) {
        where.createdBy = teacherProfile.id;
      }
    }

    const assessments = await Assessment.findAll({
      where,
      include: [
        { model: Class },
        { model: Subject },
        { model: Term },
        { model: TeacherProfile, include: [{ model: require('../models').User }] }
      ],
      order: [['scheduledDate', 'DESC']]
    });

    res.json({ data: assessments });
  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({ error: 'Failed to get assessments' });
  }
};

// Get single assessment
exports.getAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findByPk(req.params.id, {
      include: [
        { model: Class },
        { model: Subject },
        { model: Term },
        { model: TeacherProfile, include: [{ model: require('../models').User }] }
      ]
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Fetch questions if any
    let questions = [];
    if (assessment.questions && assessment.questions.length > 0) {
      questions = await Question.findAll({
        where: { id: assessment.questions }
      });
    }

    res.json({
      data: {
        ...assessment.toJSON(),
        questionDetails: questions
      }
    });
  } catch (error) {
    console.error('Get assessment error:', error);
    res.status(500).json({ error: 'Failed to get assessment' });
  }
};

// Update assessment
exports.updateAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findByPk(req.params.id);

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const {
      title, type, description, instructions, totalMarks, passingMarks,
      duration, scheduledDate, dueDate, status, questionIds
    } = req.body;

    await assessment.update({
      title: title || assessment.title,
      type: type || assessment.type,
      description: description || assessment.description,
      instructions: instructions || assessment.instructions,
      totalMarks: totalMarks || assessment.totalMarks,
      passingMarks: passingMarks || assessment.passingMarks,
      duration: duration || assessment.duration,
      scheduledDate: scheduledDate || assessment.scheduledDate,
      dueDate: dueDate || assessment.dueDate,
      status: status || assessment.status,
      questions: questionIds || assessment.questions
    });

    await createAuditLog(req.userId, 'UPDATE_ASSESSMENT', 'Assessment', assessment.id, null, assessment.toJSON(), req);

    res.json({
      message: 'Assessment updated successfully',
      data: assessment
    });
  } catch (error) {
    console.error('Update assessment error:', error);
    res.status(500).json({ error: 'Failed to update assessment' });
  }
};

// Delete assessment
exports.deleteAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findByPk(req.params.id);

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    await assessment.destroy();
    await createAuditLog(req.userId, 'DELETE_ASSESSMENT', 'Assessment', req.params.id, null, null, req);

    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Delete assessment error:', error);
    res.status(500).json({ error: 'Failed to delete assessment' });
  }
};

// Record scores for assessment
exports.recordScores = async (req, res) => {
  try {
    const assessmentId = req.params.id;
    const { results } = req.body;

    const assessment = await Assessment.findByPk(assessmentId);
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const teacherProfile = await TeacherProfile.findOne({ where: { userId: req.userId } });
    const savedResults = [];

    for (const result of results) {
      const { studentId, marksObtained, answers, questionResults, comments } = result;

      const percentage = (marksObtained / assessment.totalMarks * 100).toFixed(2);
      const grade = calculateGrade(percentage);

      const [assessmentResult, created] = await AssessmentResult.findOrCreate({
        where: { assessmentId, studentId },
        defaults: {
          assessmentId,
          studentId,
          marksObtained,
          percentage,
          grade,
          status: 'graded',
          answers: answers || [],
          questionResults: questionResults || [],
          comments,
          gradedBy: teacherProfile?.id,
          gradedAt: new Date()
        }
      });

      if (!created) {
        await assessmentResult.update({
          marksObtained,
          percentage,
          grade,
          status: 'graded',
          answers: answers || assessmentResult.answers,
          questionResults: questionResults || assessmentResult.questionResults,
          comments,
          gradedBy: teacherProfile?.id,
          gradedAt: new Date()
        });
      }

      // Record failure reasons if provided
      if (questionResults) {
        for (const qr of questionResults) {
          if (!qr.passed && qr.failureReason) {
            await FailureReason.create({
              resultId: assessmentResult.id,
              questionId: qr.questionId,
              reason: qr.failureReason,
              notes: qr.notes
            });
          }
        }
      }

      savedResults.push(assessmentResult);
    }

    // Update assessment status if all students graded
    const classStudentCount = await Student.count({ where: { classId: assessment.classId } });
    const gradedCount = await AssessmentResult.count({ where: { assessmentId, status: 'graded' } });

    if (gradedCount >= classStudentCount) {
      await assessment.update({ status: 'graded' });
    }

    await createAuditLog(req.userId, 'RECORD_SCORES', 'Assessment', assessmentId, null, { resultCount: savedResults.length }, req);

    res.json({
      message: 'Scores recorded successfully',
      data: savedResults
    });
  } catch (error) {
    console.error('Record scores error:', error);
    res.status(500).json({ error: 'Failed to record scores' });
  }
};

// Get assessment results
exports.getAssessmentResults = async (req, res) => {
  try {
    const assessmentId = req.params.id;

    const results = await AssessmentResult.findAll({
      where: { assessmentId },
      include: [
        { model: Student },
        { model: TeacherProfile, include: [{ model: require('../models').User }] }
      ],
      order: [[Student, 'firstName', 'ASC']]
    });

    // Calculate class statistics
    const marks = results.filter(r => r.marksObtained !== null).map(r => parseFloat(r.marksObtained));
    const stats = marks.length > 0 ? {
      highest: Math.max(...marks),
      lowest: Math.min(...marks),
      average: (marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(2),
      passRate: (results.filter(r => parseFloat(r.percentage) >= 50).length / results.length * 100).toFixed(2)
    } : null;

    res.json({
      data: results,
      stats
    });
  } catch (error) {
    console.error('Get assessment results error:', error);
    res.status(500).json({ error: 'Failed to get results' });
  }
};

// Get student's assessment result
exports.getStudentResult = async (req, res) => {
  try {
    const { assessmentId, studentId } = req.params;

    const result = await AssessmentResult.findOne({
      where: { assessmentId, studentId },
      include: [
        { model: Assessment, include: [{ model: Subject }] },
        { model: Student }
      ]
    });

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    // Get failure reasons
    const failureReasons = await FailureReason.findAll({
      where: { resultId: result.id },
      include: [{ model: Question }]
    });

    res.json({
      data: {
        ...result.toJSON(),
        failureReasons
      }
    });
  } catch (error) {
    console.error('Get student result error:', error);
    res.status(500).json({ error: 'Failed to get result' });
  }
};

// Helper function to calculate grade
function calculateGrade(percentage) {
  const pct = parseFloat(percentage);
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}
