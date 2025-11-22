import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Storage from '../utils/storage';
import { biologyExperiments, getAllExperiments } from '../data/experiments';

const AppContext = createContext();
export const useApp = () => { const ctx = useContext(AppContext); if (!ctx) throw new Error('useApp must be used within AppProvider'); return ctx; };

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});
  const [completedExperiments, setCompletedExperiments] = useState([]);
  const [experimentResults, setExperimentResults] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [notes, setNotes] = useState({});
  const [achievements, setAchievements] = useState({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [p, s, c, r, f, n, a] = await Promise.all([Storage.getUserProfile(), Storage.getSettings(), Storage.getCompletedExperiments(), Storage.getExperimentResults(), Storage.getFavorites(), Storage.getNotes(), Storage.getAchievements()]);
      setUser(p); setSettings(s); setCompletedExperiments(c); setExperimentResults(r); setFavorites(f); setNotes(n); setAchievements(a);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const registerUser = async (name, classGrade) => { const profile = { name, classGrade, registeredAt: new Date().toISOString() }; await Storage.saveUserProfile(profile); setUser(profile); return true; };
  const updateSettings = async (newSettings) => { const merged = { ...settings, ...newSettings }; await Storage.saveSettings(merged); setSettings(merged); return true; };
  const getExperimentById = (id) => getAllExperiments().find(e => e.id === id);
  const getExperimentsByCategory = (catId) => { const cat = biologyExperiments[catId]; if (!cat) return []; return cat.experiments.map(e => ({ ...e, categoryId: catId, categoryTitle: cat.title, categoryIcon: cat.icon, categoryColor: cat.color })); };
  const getCategories = () => Object.entries(biologyExperiments).map(([id, cat]) => ({ id, title: cat.title, icon: cat.icon, color: cat.color, experimentCount: cat.experiments.length, completedCount: completedExperiments.filter(c => cat.experiments.some(e => e.id === c.experimentId)).length }));
  const isExperimentCompleted = (id) => completedExperiments.some(c => c.experimentId === id);
  const getExperimentCompletion = (id) => completedExperiments.find(c => c.experimentId === id);

  const completeExperiment = async (id, score, data) => {
    await Storage.markExperimentCompleted(id, score);
    await Storage.saveExperimentResult({ experimentId: id, score, data });
    const completed = await Storage.getCompletedExperiments();
    const results = await Storage.getExperimentResults();
    setCompletedExperiments(completed); setExperimentResults(results);
    await updateAchievementsAfterExperiment(id, score);
    return true;
  };

  const updateAchievementsAfterExperiment = async (id, score) => {
    const exp = getExperimentById(id);
    const updates = { ...achievements };
    updates.experimentsCompleted = (updates.experimentsCompleted || 0) + 1;
    if (score >= 100) updates.perfectScores = (updates.perfectScores || 0) + 1;
    if (exp && !updates.categoriesExplored?.includes(exp.categoryId)) updates.categoriesExplored = [...(updates.categoriesExplored || []), exp.categoryId];
    const badges = [...(updates.badges || [])];
    if (updates.experimentsCompleted >= 1 && !badges.includes('first_observation')) badges.push('first_observation');
    if (updates.experimentsCompleted >= 10 && !badges.includes('lab_explorer')) badges.push('lab_explorer');
    if (updates.experimentsCompleted >= 25 && !badges.includes('biologist')) badges.push('biologist');
    if (updates.perfectScores >= 5 && !badges.includes('precision_master')) badges.push('precision_master');
    if (updates.categoriesExplored?.length >= 3 && !badges.includes('versatile')) badges.push('versatile');
    if (updates.categoriesExplored?.length >= 6 && !badges.includes('biology_expert')) badges.push('biology_expert');
    updates.badges = badges;
    const saved = await Storage.updateAchievements(updates);
    if (saved) setAchievements(saved);
  };

  const toggleFavorite = async (id) => { const newFavs = await Storage.toggleFavorite(id); setFavorites(newFavs); return newFavs.includes(id); };
  const saveNote = async (id, note) => { await Storage.saveNote(id, note); const allNotes = await Storage.getNotes(); setNotes(allNotes); return true; };
  const getNote = (id) => notes[id]?.content || '';

  const getStatistics = () => {
    const all = getAllExperiments();
    const uniqueCompleted = [...new Set(completedExperiments.map(c => c.experimentId))].length;
    const avgScore = completedExperiments.length > 0 ? completedExperiments.reduce((s, c) => s + c.bestScore, 0) / completedExperiments.length : 0;
    return { totalExperiments: all.length, completedCount: completedExperiments.length, uniqueCompleted, completionRate: Math.round((uniqueCompleted / all.length) * 100), avgScore: Math.round(avgScore), totalAttempts: completedExperiments.reduce((s, c) => s + c.attempts, 0), perfectScores: achievements.perfectScores || 0, badges: achievements.badges || [] };
  };

  const searchExperiments = (query) => { if (!query.trim()) return []; const q = query.toLowerCase(); return getAllExperiments().filter(e => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.categoryTitle.toLowerCase().includes(q)); };
  const getRecentExperiments = (limit = 5) => { const sorted = [...experimentResults].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); const unique = []; const seen = new Set(); for (const r of sorted) { if (!seen.has(r.experimentId) && unique.length < limit) { const exp = getExperimentById(r.experimentId); if (exp) { unique.push({ ...exp, lastAttempt: r.timestamp, lastScore: r.score }); seen.add(r.experimentId); } } } return unique; };
  const getRecommendedExperiments = () => { const completedIds = completedExperiments.map(c => c.experimentId); return getAllExperiments().filter(e => !completedIds.includes(e.id)).slice(0, 6); };
  const exportData = async () => await Storage.exportLabData();

  const value = { user, loading, settings, completedExperiments, experimentResults, favorites, notes, achievements, registerUser, updateSettings, getAllExperiments: () => getAllExperiments(), getExperimentById, getExperimentsByCategory, getCategories, isExperimentCompleted, getExperimentCompletion, completeExperiment, toggleFavorite, saveNote, getNote, getStatistics, searchExperiments, getRecentExperiments, getRecommendedExperiments, exportData };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
