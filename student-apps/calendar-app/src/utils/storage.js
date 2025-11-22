// Storage utility for Calendar App
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const KEYS = {
  USER_PROFILE: '@calendar_app_user_profile',
  EVENTS: '@calendar_app_events',
  STUDY_PLAN: '@calendar_app_study_plan',
  SETTINGS: '@calendar_app_settings',
  GOALS: '@calendar_app_goals',
  STUDY_STREAKS: '@calendar_app_streaks',
};

// User Profile
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

// Events
export const saveEvents = async (events) => {
  try {
    await AsyncStorage.setItem(KEYS.EVENTS, JSON.stringify(events));
    return true;
  } catch (error) {
    console.error('Error saving events:', error);
    return false;
  }
};

export const getEvents = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.EVENTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting events:', error);
    return [];
  }
};

export const addEvent = async (event) => {
  try {
    const events = await getEvents();
    const newEvent = {
      ...event,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    events.push(newEvent);
    await saveEvents(events);
    return newEvent.id;
  } catch (error) {
    console.error('Error adding event:', error);
    return null;
  }
};

export const updateEvent = async (eventId, updates) => {
  try {
    const events = await getEvents();
    const index = events.findIndex(e => e.id === eventId);
    if (index !== -1) {
      events[index] = { ...events[index], ...updates };
      await saveEvents(events);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating event:', error);
    return false;
  }
};

export const deleteEvent = async (eventId) => {
  try {
    const events = await getEvents();
    const filtered = events.filter(e => e.id !== eventId);
    await saveEvents(filtered);
    return true;
  } catch (error) {
    console.error('Error deleting event:', error);
    return false;
  }
};

// Study Plan
export const saveStudyPlan = async (plan) => {
  try {
    await AsyncStorage.setItem(KEYS.STUDY_PLAN, JSON.stringify(plan));
    return true;
  } catch (error) {
    console.error('Error saving study plan:', error);
    return false;
  }
};

export const getStudyPlan = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.STUDY_PLAN);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting study plan:', error);
    return null;
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
      schoolClosingTime: '15:00',
      studyDuration: 60, // minutes
      breakDuration: 15, // minutes
      reminderMinutesBefore: 15,
      enableReminders: true,
      weekendStudy: true,
      darkMode: false,
    };
  } catch (error) {
    console.error('Error getting settings:', error);
    return {
      schoolClosingTime: '15:00',
      studyDuration: 60,
      breakDuration: 15,
      reminderMinutesBefore: 15,
      enableReminders: true,
      weekendStudy: true,
      darkMode: false,
    };
  }
};

// Goals
export const saveGoals = async (goals) => {
  try {
    await AsyncStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
    return true;
  } catch (error) {
    console.error('Error saving goals:', error);
    return false;
  }
};

export const getGoals = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.GOALS);
    return data ? JSON.parse(data) : {
      weekly: { targetHours: 10, currentHours: 0 },
      monthly: { targetHours: 40, currentHours: 0 },
    };
  } catch (error) {
    console.error('Error getting goals:', error);
    return {
      weekly: { targetHours: 10, currentHours: 0 },
      monthly: { targetHours: 40, currentHours: 0 },
    };
  }
};

// Study Streaks
export const saveStreaks = async (streaks) => {
  try {
    await AsyncStorage.setItem(KEYS.STUDY_STREAKS, JSON.stringify(streaks));
    return true;
  } catch (error) {
    console.error('Error saving streaks:', error);
    return false;
  }
};

export const getStreaks = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.STUDY_STREAKS);
    return data ? JSON.parse(data) : {
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
      studyDates: [],
    };
  } catch (error) {
    console.error('Error getting streaks:', error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
      studyDates: [],
    };
  }
};

export const updateStreak = async () => {
  try {
    const streaks = await getStreaks();
    const today = new Date().toISOString().split('T')[0];

    if (streaks.lastStudyDate === today) {
      return streaks; // Already updated today
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (streaks.lastStudyDate === yesterday) {
      // Continue streak
      streaks.currentStreak += 1;
    } else {
      // Reset streak
      streaks.currentStreak = 1;
    }

    if (streaks.currentStreak > streaks.longestStreak) {
      streaks.longestStreak = streaks.currentStreak;
    }

    streaks.lastStudyDate = today;
    if (!streaks.studyDates.includes(today)) {
      streaks.studyDates.push(today);
    }

    await saveStreaks(streaks);
    return streaks;
  } catch (error) {
    console.error('Error updating streak:', error);
    return null;
  }
};

// Import data from other apps
const getSharedDataPath = () => {
  return `${FileSystem.documentDirectory}shared_data/`;
};

export const importProficiencyData = async () => {
  try {
    const sharedPath = getSharedDataPath();
    const filePath = `${sharedPath}proficiency_data.json`;

    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (!fileInfo.exists) {
      return null;
    }

    const content = await FileSystem.readAsStringAsync(filePath);
    return JSON.parse(content);
  } catch (error) {
    console.error('Error importing proficiency data:', error);
    return null;
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

// Export study report
export const exportStudyReport = async () => {
  try {
    const events = await getEvents();
    const streaks = await getStreaks();
    const goals = await getGoals();
    const profile = await getUserProfile();

    const report = {
      profile,
      studyStats: {
        currentStreak: streaks.currentStreak,
        longestStreak: streaks.longestStreak,
        totalStudyDays: streaks.studyDates.length,
        weeklyProgress: goals.weekly,
        monthlyProgress: goals.monthly,
      },
      recentEvents: events.filter(e => {
        const eventDate = new Date(e.date);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
        return eventDate >= thirtyDaysAgo;
      }),
      exportedAt: new Date().toISOString(),
    };

    const sharedPath = getSharedDataPath();
    const dirInfo = await FileSystem.getInfoAsync(sharedPath);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(sharedPath, { intermediates: true });
    }

    const filePath = `${sharedPath}study_report.json`;
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(report, null, 2));

    return filePath;
  } catch (error) {
    console.error('Error exporting study report:', error);
    return null;
  }
};
