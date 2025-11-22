const { Question, Subject, TeacherProfile, User } = require('../models');
const { createAuditLog } = require('../middleware/audit.middleware');

// Create question
exports.createQuestion = async (req, res) => {
  try {
    const {
      type, question, options, correctAnswer, topic, chapter,
      bloomsLevel, difficulty, marks, expectedTime, explanation, subjectId
    } = req.body;

    const teacherProfile = await TeacherProfile.findOne({ where: { userId: req.userId } });

    const newQuestion = await Question.create({
      type,
      question,
      options: options || [],
      correctAnswer,
      topic,
      chapter,
      bloomsLevel,
      difficulty,
      marks,
      expectedTime,
      explanation,
      subjectId,
      createdBy: teacherProfile?.id
    });

    await createAuditLog(req.userId, 'CREATE_QUESTION', 'Question', newQuestion.id, null, newQuestion.toJSON(), req);

    res.status(201).json({
      message: 'Question created successfully',
      data: newQuestion
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
};

// Get questions with filters
exports.getQuestions = async (req, res) => {
  try {
    const { page = 1, limit = 20, subjectId, type, topic, chapter, bloomsLevel, difficulty } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (subjectId) where.subjectId = subjectId;
    if (type) where.type = type;
    if (topic) where.topic = topic;
    if (chapter) where.chapter = chapter;
    if (bloomsLevel) where.bloomsLevel = bloomsLevel;
    if (difficulty) where.difficulty = difficulty;

    // For teachers, show only their questions
    if (req.user.role === 'teacher') {
      const teacherProfile = await TeacherProfile.findOne({ where: { userId: req.userId } });
      if (teacherProfile) {
        where.createdBy = teacherProfile.id;
      }
    }

    const { count, rows } = await Question.findAndCountAll({
      where,
      include: [
        { model: Subject },
        { model: TeacherProfile, include: [{ model: User }] }
      ],
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
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Failed to get questions' });
  }
};

// Get single question
exports.getQuestion = async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id, {
      include: [
        { model: Subject },
        { model: TeacherProfile, include: [{ model: User }] }
      ]
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({ data: question });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ error: 'Failed to get question' });
  }
};

// Update question
exports.updateQuestion = async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id);

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const {
      type, question: questionText, options, correctAnswer, topic, chapter,
      bloomsLevel, difficulty, marks, expectedTime, explanation
    } = req.body;

    await question.update({
      type: type || question.type,
      question: questionText || question.question,
      options: options || question.options,
      correctAnswer: correctAnswer !== undefined ? correctAnswer : question.correctAnswer,
      topic: topic || question.topic,
      chapter: chapter || question.chapter,
      bloomsLevel: bloomsLevel || question.bloomsLevel,
      difficulty: difficulty || question.difficulty,
      marks: marks || question.marks,
      expectedTime: expectedTime || question.expectedTime,
      explanation: explanation || question.explanation
    });

    await createAuditLog(req.userId, 'UPDATE_QUESTION', 'Question', question.id, null, question.toJSON(), req);

    res.json({
      message: 'Question updated successfully',
      data: question
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
};

// Delete question
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id);

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    await question.destroy();
    await createAuditLog(req.userId, 'DELETE_QUESTION', 'Question', req.params.id, null, null, req);

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
};

// Bulk create questions
exports.bulkCreateQuestions = async (req, res) => {
  try {
    const { questions, subjectId } = req.body;
    const teacherProfile = await TeacherProfile.findOne({ where: { userId: req.userId } });

    const createdQuestions = [];

    for (const q of questions) {
      const newQuestion = await Question.create({
        ...q,
        subjectId,
        createdBy: teacherProfile?.id
      });
      createdQuestions.push(newQuestion);
    }

    await createAuditLog(req.userId, 'BULK_CREATE_QUESTIONS', 'Question', null, null, { count: createdQuestions.length }, req);

    res.status(201).json({
      message: `${createdQuestions.length} questions created successfully`,
      data: createdQuestions
    });
  } catch (error) {
    console.error('Bulk create questions error:', error);
    res.status(500).json({ error: 'Failed to create questions' });
  }
};

// Get topics and chapters for a subject
exports.getTopicsAndChapters = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const questions = await Question.findAll({
      where: { subjectId },
      attributes: ['topic', 'chapter'],
      group: ['topic', 'chapter']
    });

    const topics = [...new Set(questions.map(q => q.topic).filter(Boolean))];
    const chapters = [...new Set(questions.map(q => q.chapter).filter(Boolean))];

    res.json({
      data: { topics, chapters }
    });
  } catch (error) {
    console.error('Get topics and chapters error:', error);
    res.status(500).json({ error: 'Failed to get topics and chapters' });
  }
};

// Get question statistics
exports.getQuestionStats = async (req, res) => {
  try {
    const { subjectId } = req.query;
    const where = {};
    if (subjectId) where.subjectId = subjectId;

    const questions = await Question.findAll({ where });

    const stats = {
      total: questions.length,
      byType: {},
      byDifficulty: {},
      byBloomsLevel: {}
    };

    questions.forEach(q => {
      // By type
      stats.byType[q.type] = (stats.byType[q.type] || 0) + 1;
      // By difficulty
      stats.byDifficulty[q.difficulty] = (stats.byDifficulty[q.difficulty] || 0) + 1;
      // By Bloom's level
      if (q.bloomsLevel) {
        stats.byBloomsLevel[q.bloomsLevel] = (stats.byBloomsLevel[q.bloomsLevel] || 0) + 1;
      }
    });

    res.json({ data: stats });
  } catch (error) {
    console.error('Get question stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
};
