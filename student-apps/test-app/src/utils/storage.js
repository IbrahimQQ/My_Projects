// Storage utility for Test App
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const KEYS = {
  USER_PROFILE: '@test_app_user_profile',
  TEST_SESSIONS: '@test_app_sessions',
  PROFICIENCY: '@test_app_proficiency',
  QUESTION_BANK: '@test_app_questions',
  SETTINGS: '@test_app_settings',
  TEST_SCHEDULE: '@test_app_schedule',
  ACHIEVEMENTS: '@test_app_achievements',
};

// User Profile (synced from Reader App)
export const saveUserProfile = async (profile) => {
  try {
    await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
    return true;
  } catch (error) {
    console.error('Error saving user profile:', error);
    return false;
  }
};

export const getUserProfile = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Test Sessions
export const saveTestSession = async (session) => {
  try {
    const sessions = await getTestSessions();
    const newSession = {
      ...session,
      id: Date.now().toString(),
      completedAt: new Date().toISOString(),
    };
    sessions.push(newSession);
    await AsyncStorage.setItem(KEYS.TEST_SESSIONS, JSON.stringify(sessions));
    return newSession.id;
  } catch (error) {
    console.error('Error saving test session:', error);
    return null;
  }
};

export const getTestSessions = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.TEST_SESSIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting test sessions:', error);
    return [];
  }
};

// Proficiency Data
export const saveProficiency = async (proficiencyData) => {
  try {
    await AsyncStorage.setItem(KEYS.PROFICIENCY, JSON.stringify(proficiencyData));

    // Also export to shared directory for other apps
    await exportProficiencyToShared(proficiencyData);

    return true;
  } catch (error) {
    console.error('Error saving proficiency:', error);
    return false;
  }
};

export const getProficiency = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.PROFICIENCY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error getting proficiency:', error);
    return {};
  }
};

export const updateTopicProficiency = async (subject, topic, score, questionsAnswered) => {
  try {
    const proficiency = await getProficiency();
    const key = `${subject}_${topic}`;

    const existing = proficiency[key] || {
      subject,
      topic,
      totalQuestions: 0,
      correctAnswers: 0,
      proficiencyLevel: 0,
      history: [],
      lastUpdated: null,
    };

    // Update stats
    existing.totalQuestions += questionsAnswered;
    existing.correctAnswers += Math.round(score * questionsAnswered / 100);

    // Calculate proficiency (0-100)
    existing.proficiencyLevel = Math.round(
      (existing.correctAnswers / existing.totalQuestions) * 100
    );

    // Add to history
    existing.history.push({
      score,
      questionsAnswered,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 20 entries in history
    if (existing.history.length > 20) {
      existing.history = existing.history.slice(-20);
    }

    existing.lastUpdated = new Date().toISOString();
    proficiency[key] = existing;

    await saveProficiency(proficiency);
    return existing.proficiencyLevel;
  } catch (error) {
    console.error('Error updating topic proficiency:', error);
    return null;
  }
};

// Question Bank
export const saveQuestionBank = async (questions) => {
  try {
    await AsyncStorage.setItem(KEYS.QUESTION_BANK, JSON.stringify(questions));
    return true;
  } catch (error) {
    console.error('Error saving question bank:', error);
    return false;
  }
};

export const getQuestionBank = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.QUESTION_BANK);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting question bank:', error);
    return [];
  }
};

// Settings
export const saveSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
};

export const getSettings = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : {
      testFrequency: 2, // hours
      questionsPerTest: 20,
      showTimer: true,
      difficulty: 'mixed',
      enablePopups: true,
      soundEnabled: true,
    };
  } catch (error) {
    console.error('Error getting settings:', error);
    return {
      testFrequency: 2,
      questionsPerTest: 20,
      showTimer: true,
      difficulty: 'mixed',
      enablePopups: true,
      soundEnabled: true,
    };
  }
};

// Test Schedule
export const saveTestSchedule = async (schedule) => {
  try {
    await AsyncStorage.setItem(KEYS.TEST_SCHEDULE, JSON.stringify(schedule));
    return true;
  } catch (error) {
    console.error('Error saving test schedule:', error);
    return false;
  }
};

export const getTestSchedule = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.TEST_SCHEDULE);
    return data ? JSON.parse(data) : {
      lastTestTime: null,
      nextTestTime: null,
      postponeCount: 0,
    };
  } catch (error) {
    console.error('Error getting test schedule:', error);
    return {
      lastTestTime: null,
      nextTestTime: null,
      postponeCount: 0,
    };
  }
};

// Achievements
export const saveAchievements = async (achievements) => {
  try {
    await AsyncStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
    return true;
  } catch (error) {
    console.error('Error saving achievements:', error);
    return false;
  }
};

export const getAchievements = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.ACHIEVEMENTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting achievements:', error);
    return [];
  }
};

export const checkAndAwardAchievement = async (achievementId, condition) => {
  try {
    const achievements = await getAchievements();
    const hasAchievement = achievements.find(a => a.id === achievementId);

    if (!hasAchievement && condition) {
      const newAchievement = {
        id: achievementId,
        unlockedAt: new Date().toISOString(),
      };
      achievements.push(newAchievement);
      await saveAchievements(achievements);
      return newAchievement;
    }
    return null;
  } catch (error) {
    console.error('Error checking achievement:', error);
    return null;
  }
};

// Shared data functions
const getSharedDataPath = () => {
  return `${FileSystem.documentDirectory}shared_data/`;
};

const ensureSharedDirectory = async () => {
  const sharedPath = getSharedDataPath();
  const dirInfo = await FileSystem.getInfoAsync(sharedPath);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(sharedPath, { intermediates: true });
  }
  return sharedPath;
};

export const exportProficiencyToShared = async (proficiencyData) => {
  try {
    const sharedPath = await ensureSharedDirectory();
    const filePath = `${sharedPath}proficiency_data.json`;

    const exportData = {
      proficiency: proficiencyData,
      exportedAt: new Date().toISOString(),
      source: 'test_app',
    };

    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(exportData, null, 2));
    return true;
  } catch (error) {
    console.error('Error exporting proficiency to shared:', error);
    return false;
  }
};

export const importReaderData = async () => {
  try {
    const sharedPath = getSharedDataPath();
    const filePath = `${sharedPath}reader_data.json`;

    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (!fileInfo.exists) {
      return null;
    }

    const content = await FileSystem.readAsStringAsync(filePath);
    return JSON.parse(content);
  } catch (error) {
    console.error('Error importing reader data:', error);
    return null;
  }
};

// Export test session data
export const exportTestSessionData = async (session) => {
  try {
    const profile = await getUserProfile();
    const sharedPath = await ensureSharedDirectory();

    const studentName = profile?.name?.replace(/\s+/g, '') || 'Student';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${studentName}TestSession${timestamp}.json`;
    const filePath = `${sharedPath}${filename}`;

    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(session, null, 2));

    // Also create CSV version
    const csvFilename = `${studentName}TestSession${timestamp}.csv`;
    const csvFilePath = `${sharedPath}${csvFilename}`;

    let csv = 'Question,Subject,Topic,Difficulty,Correct Answer,Student Answer,Is Correct,Time Taken\n';
    session.questions?.forEach((q, index) => {
      csv += `"${q.question.replace(/"/g, '""')}",${q.subject},${q.topic},${q.difficulty},${q.correctAnswer},${session.answers?.[index] || ''},${session.results?.[index] ? 'Yes' : 'No'},${session.times?.[index] || 0}s\n`;
    });

    await FileSystem.writeAsStringAsync(csvFilePath, csv);

    return { jsonPath: filePath, csvPath: csvFilePath };
  } catch (error) {
    console.error('Error exporting test session data:', error);
    return null;
  }
};
