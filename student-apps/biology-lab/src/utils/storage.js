import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const KEYS = {
  USER: '@bio_lab_user',
  SETTINGS: '@bio_lab_settings',
  COMPLETED: '@bio_lab_completed',
  RESULTS: '@bio_lab_results',
  FAVORITES: '@bio_lab_favorites',
  NOTES: '@bio_lab_notes',
  ACHIEVEMENTS: '@bio_lab_achievements',
};

export const getUserProfile = async () => { try { const d = await AsyncStorage.getItem(KEYS.USER); return d ? JSON.parse(d) : null; } catch (e) { return null; } };
export const saveUserProfile = async (p) => { try { await AsyncStorage.setItem(KEYS.USER, JSON.stringify(p)); return true; } catch (e) { return false; } };
export const getSettings = async () => { try { const d = await AsyncStorage.getItem(KEYS.SETTINGS); return d ? JSON.parse(d) : { darkMode: false, showFormulas: true, showHints: true, animationSpeed: 1 }; } catch (e) { return {}; } };
export const saveSettings = async (s) => { try { await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(s)); return true; } catch (e) { return false; } };
export const getCompletedExperiments = async () => { try { const d = await AsyncStorage.getItem(KEYS.COMPLETED); return d ? JSON.parse(d) : []; } catch (e) { return []; } };
export const markExperimentCompleted = async (id, score) => {
  try {
    const completed = await getCompletedExperiments();
    const existing = completed.find(e => e.experimentId === id);
    if (existing) { existing.attempts += 1; existing.bestScore = Math.max(existing.bestScore, score); existing.lastAttempt = new Date().toISOString(); }
    else { completed.push({ experimentId: id, attempts: 1, bestScore: score, firstCompleted: new Date().toISOString(), lastAttempt: new Date().toISOString() }); }
    await AsyncStorage.setItem(KEYS.COMPLETED, JSON.stringify(completed)); return true;
  } catch (e) { return false; }
};
export const getExperimentResults = async () => { try { const d = await AsyncStorage.getItem(KEYS.RESULTS); return d ? JSON.parse(d) : []; } catch (e) { return []; } };
export const saveExperimentResult = async (r) => { try { const results = await getExperimentResults(); results.push({ ...r, id: Date.now().toString(), timestamp: new Date().toISOString() }); if (results.length > 100) results.splice(0, results.length - 100); await AsyncStorage.setItem(KEYS.RESULTS, JSON.stringify(results)); return true; } catch (e) { return false; } };
export const getFavorites = async () => { try { const d = await AsyncStorage.getItem(KEYS.FAVORITES); return d ? JSON.parse(d) : []; } catch (e) { return []; } };
export const toggleFavorite = async (id) => { try { const favs = await getFavorites(); const idx = favs.indexOf(id); idx > -1 ? favs.splice(idx, 1) : favs.push(id); await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(favs)); return favs; } catch (e) { return []; } };
export const getNotes = async () => { try { const d = await AsyncStorage.getItem(KEYS.NOTES); return d ? JSON.parse(d) : {}; } catch (e) { return {}; } };
export const saveNote = async (id, note) => { try { const notes = await getNotes(); notes[id] = { content: note, updatedAt: new Date().toISOString() }; await AsyncStorage.setItem(KEYS.NOTES, JSON.stringify(notes)); return true; } catch (e) { return false; } };
export const getAchievements = async () => { try { const d = await AsyncStorage.getItem(KEYS.ACHIEVEMENTS); return d ? JSON.parse(d) : { experimentsCompleted: 0, perfectScores: 0, categoriesExplored: [], badges: [] }; } catch (e) { return {}; } };
export const updateAchievements = async (u) => { try { const a = await getAchievements(); const m = { ...a, ...u }; await AsyncStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(m)); return m; } catch (e) { return null; } };
export const exportLabData = async () => { try { const [profile, results, completed, notes] = await Promise.all([getUserProfile(), getExperimentResults(), getCompletedExperiments(), getNotes()]); const dir = FileSystem.documentDirectory + 'exports/'; await FileSystem.makeDirectoryAsync(dir, { intermediates: true }); const path = dir + `biology_lab_${Date.now()}.json`; await FileSystem.writeAsStringAsync(path, JSON.stringify({ profile, results, completed, notes, exportedAt: new Date().toISOString() }, null, 2)); return path; } catch (e) { return null; } };
