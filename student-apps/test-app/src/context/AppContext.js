import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Storage from '../utils/storage';
import * as QuestionGenerator from '../services/questionGenerator';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});
  const [proficiency, setProficiency] = useState({});
  const [testSessions, setTestSessions] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [testSchedule, setTestSchedule] = useState({});
  const [readerData, setReaderData] = useState(null);

  // Current test state
  const [currentTest, setCurrentTest] = useState(null);
  const [testInProgress, setTestInProgress] = useState(false);
  const [showTestPopup, setShowTestPopup] = useState(false);

  useEffect(() => {
    loadInitialData();
    setupTestReminder();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      const [
        savedProfile,
        savedSettings,
        savedProficiency,
        savedSessions,
        savedAchievements,
        savedSchedule,
        importedReaderData,
      ] = await Promise.all([
        Storage.getUserProfile(),
        Storage.getSettings(),
        Storage.getProficiency(),
        Storage.getTestSessions(),
        Storage.getAchievements(),
        Storage.getTestSchedule(),
        Storage.importReaderData(),
      ]);

      // If no profile, try to import from Reader App
      if (!savedProfile && importedReaderData?.profile) {
        await Storage.saveUserProfile(importedReaderData.profile);
        setUser(importedReaderData.profile);
      } else {
        setUser(savedProfile);
      }

      setSettings(savedSettings);
      setProficiency(savedProficiency);
      setTestSessions(savedSessions);
      setAchievements(savedAchievements);
      setTestSchedule(savedSchedule);
      setReaderData(importedReaderData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupTestReminder = () => {
    // Check for test popup every minute
    const interval = setInterval(async () => {
      const schedule = await Storage.getTestSchedule();
      const currentSettings = await Storage.getSettings();

      if (!currentSettings.enablePopups) return;

      const now = new Date();
      const nextTest = schedule.nextTestTime ? new Date(schedule.nextTestTime) : null;

      if (nextTest && now >= nextTest && !testInProgress) {
        setShowTestPopup(true);
      }
    }, 60000);

    return () => clearInterval(interval);
  };

  // User functions
  const registerUser = async (name, classGrade) => {
    const profile = {
      name,
      classGrade,
      registeredAt: new Date().toISOString(),
    };
    await Storage.saveUserProfile(profile);
    setUser(profile);
    return true;
  };

  // Settings functions
  const updateSettings = async (newSettings) => {
    const merged = { ...settings, ...newSettings };
    await Storage.saveSettings(merged);
    setSettings(merged);
    return true;
  };

  // Test functions
  const startTest = async (options = {}) => {
    const {
      count = settings.questionsPerTest || 20,
      subjects = null,
      topics = null,
      difficulty = settings.difficulty || 'mixed',
      mode = 'adaptive', // adaptive, practice, custom
    } = options;

    // Get recent topics from reader data
    const recentTopics = readerData?.sessions
      ?.slice(0, 10)
      .map((s) => s.topic)
      .filter(Boolean) || [];

    const questions = await QuestionGenerator.generateQuestions({
      count,
      subjects,
      topics,
      difficulty,
      proficiency,
      recentTopics,
    });

    const test = {
      id: Date.now().toString(),
      questions,
      answers: new Array(questions.length).fill(null),
      times: new Array(questions.length).fill(0),
      startedAt: new Date().toISOString(),
      mode,
      currentIndex: 0,
      markedForReview: [],
    };

    setCurrentTest(test);
    setTestInProgress(true);
    setShowTestPopup(false);

    // Update schedule
    const newSchedule = {
      lastTestTime: new Date().toISOString(),
      nextTestTime: new Date(Date.now() + (settings.testFrequency || 2) * 60 * 60 * 1000).toISOString(),
      postponeCount: 0,
    };
    await Storage.saveTestSchedule(newSchedule);
    setTestSchedule(newSchedule);

    return test;
  };

  const submitAnswer = (questionIndex, answer) => {
    if (!currentTest) return;

    const updatedTest = { ...currentTest };
    updatedTest.answers[questionIndex] = answer;
    setCurrentTest(updatedTest);
  };

  const updateQuestionTime = (questionIndex, time) => {
    if (!currentTest) return;

    const updatedTest = { ...currentTest };
    updatedTest.times[questionIndex] = time;
    setCurrentTest(updatedTest);
  };

  const toggleMarkForReview = (questionIndex) => {
    if (!currentTest) return;

    const updatedTest = { ...currentTest };
    const idx = updatedTest.markedForReview.indexOf(questionIndex);
    if (idx > -1) {
      updatedTest.markedForReview.splice(idx, 1);
    } else {
      updatedTest.markedForReview.push(questionIndex);
    }
    setCurrentTest(updatedTest);
  };

  const finishTest = async () => {
    if (!currentTest) return null;

    // Calculate scores
    const scoreResult = QuestionGenerator.calculateScore(
      currentTest.questions,
      currentTest.answers
    );

    const session = {
      ...currentTest,
      finishedAt: new Date().toISOString(),
      score: scoreResult.percentage,
      correct: scoreResult.correct,
      total: scoreResult.total,
      results: scoreResult.results,
    };

    // Save session
    await Storage.saveTestSession(session);
    setTestSessions((prev) => [...prev, session]);

    // Update proficiency for each topic
    const topicScores = {};
    currentTest.questions.forEach((q, idx) => {
      const key = `${q.subject}_${q.topic}`;
      if (!topicScores[key]) {
        topicScores[key] = { subject: q.subject, topic: q.topic, correct: 0, total: 0 };
      }
      topicScores[key].total++;
      if (scoreResult.results[idx]) topicScores[key].correct++;
    });

    for (const key of Object.keys(topicScores)) {
      const ts = topicScores[key];
      await Storage.updateTopicProficiency(
        ts.subject,
        ts.topic,
        Math.round((ts.correct / ts.total) * 100),
        ts.total
      );
    }

    // Refresh proficiency
    const updatedProficiency = await Storage.getProficiency();
    setProficiency(updatedProficiency);

    // Check achievements
    await checkAchievements(session);

    // Export session data
    await Storage.exportTestSessionData(session);

    setCurrentTest(null);
    setTestInProgress(false);

    return session;
  };

  const postponeTest = async () => {
    const newSchedule = {
      ...testSchedule,
      nextTestTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes later
      postponeCount: (testSchedule.postponeCount || 0) + 1,
    };

    // Max 3 postpones
    if (newSchedule.postponeCount > 3) {
      return false;
    }

    await Storage.saveTestSchedule(newSchedule);
    setTestSchedule(newSchedule);
    setShowTestPopup(false);
    return true;
  };

  const checkAchievements = async (session) => {
    const achievementDefinitions = [
      { id: 'first_test', name: 'First Steps', description: 'Complete your first test', condition: testSessions.length === 0 },
      { id: 'perfect_score', name: 'Perfect!', description: 'Score 100% on a test', condition: session.score === 100 },
      { id: 'high_scorer', name: 'High Scorer', description: 'Score above 90%', condition: session.score >= 90 },
      { id: 'ten_tests', name: 'Dedicated Learner', description: 'Complete 10 tests', condition: testSessions.length >= 9 },
      { id: 'speed_demon', name: 'Speed Demon', description: 'Complete a test in under 5 minutes', condition: (new Date(session.finishedAt) - new Date(session.startedAt)) < 300000 },
    ];

    for (const achievement of achievementDefinitions) {
      const awarded = await Storage.checkAndAwardAchievement(achievement.id, achievement.condition);
      if (awarded) {
        setAchievements((prev) => [...prev, { ...achievement, ...awarded }]);
      }
    }
  };

  const syncWithReaderApp = async () => {
    const data = await Storage.importReaderData();
    if (data) {
      setReaderData(data);
      if (data.profile && !user) {
        await Storage.saveUserProfile(data.profile);
        setUser(data.profile);
      }
    }
    return data;
  };

  const getTopicProficiency = (subject, topic) => {
    const key = `${subject}_${topic}`;
    return proficiency[key]?.proficiencyLevel || 0;
  };

  const getOverallProficiency = () => {
    const keys = Object.keys(proficiency);
    if (keys.length === 0) return 0;

    const total = keys.reduce((sum, key) => sum + (proficiency[key]?.proficiencyLevel || 0), 0);
    return Math.round(total / keys.length);
  };

  const value = {
    user,
    loading,
    settings,
    proficiency,
    testSessions,
    achievements,
    testSchedule,
    readerData,
    currentTest,
    testInProgress,
    showTestPopup,

    registerUser,
    updateSettings,
    startTest,
    submitAnswer,
    updateQuestionTime,
    toggleMarkForReview,
    finishTest,
    postponeTest,
    syncWithReaderApp,
    getTopicProficiency,
    getOverallProficiency,
    setShowTestPopup,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
