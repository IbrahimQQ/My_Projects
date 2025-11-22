import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const STORAGE_KEYS = {
  USER_PROFILE: '@chemistry_lab_user_profile',
  SETTINGS: '@chemistry_lab_settings',
  COMPLETED_EXPERIMENTS: '@chemistry_lab_completed',
  EXPERIMENT_RESULTS: '@chemistry_lab_results',
  FAVORITES: '@chemistry_lab_favorites',
  NOTES: '@chemistry_lab_notes',
  ACHIEVEMENTS: '@chemistry_lab_achievements',
};

export const getUserProfile = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const saveUserProfile = async (profile) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    return true;
  } catch (error) {
    console.error('Error saving user profile:', error);
    return false;
  }
};

export const getSettings = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : {
      darkMode: false,
      soundEffects: true,
      showFormulas: true,
      showHints: true,
      showSafetyWarnings: true,
      animationSpeed: 1,
      autoSaveResults: true,
    };
  } catch (error) {
    console.error('Error getting settings:', error);
    return {};
  }
};

export const saveSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
};

export const getCompletedExperiments = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_EXPERIMENTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting completed experiments:', error);
    return [];
  }
};

export const markExperimentCompleted = async (experimentId, score) => {
  try {
    const completed = await getCompletedExperiments();
    const existing = completed.find(e => e.experimentId === experimentId);

    if (existing) {
      existing.attempts += 1;
      existing.bestScore = Math.max(existing.bestScore, score);
      existing.lastAttempt = new Date().toISOString();
    } else {
      completed.push({
        experimentId,
        attempts: 1,
        bestScore: score,
        firstCompleted: new Date().toISOString(),
        lastAttempt: new Date().toISOString(),
      });
    }

    await AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_EXPERIMENTS, JSON.stringify(completed));
    return true;
  } catch (error) {
    console.error('Error marking experiment completed:', error);
    return false;
  }
};

export const getExperimentResults = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.EXPERIMENT_RESULTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting experiment results:', error);
    return [];
  }
};

export const saveExperimentResult = async (result) => {
  try {
    const results = await getExperimentResults();
    results.push({
      ...result,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    });

    if (results.length > 100) {
      results.splice(0, results.length - 100);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.EXPERIMENT_RESULTS, JSON.stringify(results));
    return true;
  } catch (error) {
    console.error('Error saving experiment result:', error);
    return false;
  }
};

export const getFavorites = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

export const toggleFavorite = async (experimentId) => {
  try {
    const favorites = await getFavorites();
    const index = favorites.indexOf(experimentId);

    if (index > -1) {
      favorites.splice(index, 1);
    } else {
      favorites.push(experimentId);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    return favorites;
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return [];
  }
};

export const getNotes = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.NOTES);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error getting notes:', error);
    return {};
  }
};

export const saveNote = async (experimentId, note) => {
  try {
    const notes = await getNotes();
    notes[experimentId] = {
      content: note,
      updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    return true;
  } catch (error) {
    console.error('Error saving note:', error);
    return false;
  }
};

export const getAchievements = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    return data ? JSON.parse(data) : {
      experimentsCompleted: 0,
      perfectScores: 0,
      categoriesExplored: [],
      totalTime: 0,
      badges: [],
    };
  } catch (error) {
    console.error('Error getting achievements:', error);
    return {};
  }
};

export const updateAchievements = async (updates) => {
  try {
    const achievements = await getAchievements();
    const merged = { ...achievements, ...updates };
    await AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(merged));
    return merged;
  } catch (error) {
    console.error('Error updating achievements:', error);
    return null;
  }
};

export const exportLabData = async () => {
  try {
    const [profile, results, completed, notes] = await Promise.all([
      getUserProfile(),
      getExperimentResults(),
      getCompletedExperiments(),
      getNotes(),
    ]);

    const exportData = {
      profile,
      results,
      completed,
      notes,
      exportedAt: new Date().toISOString(),
    };

    const exportDir = FileSystem.documentDirectory + 'exports/';
    await FileSystem.makeDirectoryAsync(exportDir, { intermediates: true });

    const filename = `chemistry_lab_export_${Date.now()}.json`;
    const filePath = exportDir + filename;

    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(exportData, null, 2));

    return filePath;
  } catch (error) {
    console.error('Error exporting lab data:', error);
    return null;
  }
};

export const exportProficiencyData = async () => {
  try {
    const completed = await getCompletedExperiments();

    const proficiency = {};
    completed.forEach(exp => {
      const category = exp.experimentId.split('_')[0] || 'general';
      if (!proficiency[category]) {
        proficiency[category] = { score: 0, attempts: 0 };
      }
      proficiency[category].score += exp.bestScore;
      proficiency[category].attempts += exp.attempts;
    });

    Object.keys(proficiency).forEach(key => {
      if (proficiency[key].attempts > 0) {
        proficiency[key].avgScore = proficiency[key].score / proficiency[key].attempts;
      }
    });

    const sharedDir = FileSystem.documentDirectory + '../shared_student_data/';
    await FileSystem.makeDirectoryAsync(sharedDir, { intermediates: true });

    const existingPath = sharedDir + 'proficiency_data.json';
    let existingData = {};

    const fileInfo = await FileSystem.getInfoAsync(existingPath);
    if (fileInfo.exists) {
      const content = await FileSystem.readAsStringAsync(existingPath);
      existingData = JSON.parse(content);
    }

    existingData.chemistryLab = {
      proficiency,
      lastUpdated: new Date().toISOString(),
    };

    await FileSystem.writeAsStringAsync(existingPath, JSON.stringify(existingData, null, 2));
    return true;
  } catch (error) {
    console.error('Error exporting proficiency data:', error);
    return false;
  }
};
