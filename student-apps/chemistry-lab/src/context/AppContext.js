import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Storage from '../utils/storage';
import { chemistryExperiments, getAllExperiments, getTotalExperiments } from '../data/experiments';

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
  const [completedExperiments, setCompletedExperiments] = useState([]);
  const [experimentResults, setExperimentResults] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [notes, setNotes] = useState({});
  const [achievements, setAchievements] = useState({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [
        savedProfile,
        savedSettings,
        savedCompleted,
        savedResults,
        savedFavorites,
        savedNotes,
        savedAchievements,
      ] = await Promise.all([
        Storage.getUserProfile(),
        Storage.getSettings(),
        Storage.getCompletedExperiments(),
        Storage.getExperimentResults(),
        Storage.getFavorites(),
        Storage.getNotes(),
        Storage.getAchievements(),
      ]);

      setUser(savedProfile);
      setSettings(savedSettings);
      setCompletedExperiments(savedCompleted);
      setExperimentResults(savedResults);
      setFavorites(savedFavorites);
      setNotes(savedNotes);
      setAchievements(savedAchievements);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (name, classGrade) => {
    const profile = { name, classGrade, registeredAt: new Date().toISOString() };
    await Storage.saveUserProfile(profile);
    setUser(profile);
    return true;
  };

  const updateSettings = async (newSettings) => {
    const merged = { ...settings, ...newSettings };
    await Storage.saveSettings(merged);
    setSettings(merged);
    return true;
  };

  const getExperimentById = (experimentId) => {
    return getAllExperiments().find(exp => exp.id === experimentId);
  };

  const getExperimentsByCategory = (categoryId) => {
    const category = chemistryExperiments[categoryId];
    if (!category) return [];
    return category.experiments.map(exp => ({
      ...exp,
      categoryId,
      categoryTitle: category.title,
      categoryIcon: category.icon,
      categoryColor: category.color,
    }));
  };

  const getCategories = () => {
    return Object.entries(chemistryExperiments).map(([id, category]) => ({
      id,
      title: category.title,
      icon: category.icon,
      color: category.color,
      experimentCount: category.experiments.length,
      completedCount: completedExperiments.filter(
        c => category.experiments.some(e => e.id === c.experimentId)
      ).length,
    }));
  };

  const isExperimentCompleted = (experimentId) => {
    return completedExperiments.some(c => c.experimentId === experimentId);
  };

  const getExperimentCompletion = (experimentId) => {
    return completedExperiments.find(c => c.experimentId === experimentId);
  };

  const completeExperiment = async (experimentId, score, data) => {
    await Storage.markExperimentCompleted(experimentId, score);
    await Storage.saveExperimentResult({ experimentId, score, data });

    const completed = await Storage.getCompletedExperiments();
    setCompletedExperiments(completed);

    const results = await Storage.getExperimentResults();
    setExperimentResults(results);

    await updateAchievementsAfterExperiment(experimentId, score);
    await Storage.exportProficiencyData();

    return true;
  };

  const updateAchievementsAfterExperiment = async (experimentId, score) => {
    const experiment = getExperimentById(experimentId);
    const updates = { ...achievements };

    updates.experimentsCompleted = (updates.experimentsCompleted || 0) + 1;
    if (score >= 100) updates.perfectScores = (updates.perfectScores || 0) + 1;

    if (experiment && !updates.categoriesExplored?.includes(experiment.categoryId)) {
      updates.categoriesExplored = [...(updates.categoriesExplored || []), experiment.categoryId];
    }

    const badges = [...(updates.badges || [])];
    if (updates.experimentsCompleted >= 1 && !badges.includes('first_reaction')) badges.push('first_reaction');
    if (updates.experimentsCompleted >= 10 && !badges.includes('lab_assistant')) badges.push('lab_assistant');
    if (updates.experimentsCompleted >= 25 && !badges.includes('chemist')) badges.push('chemist');
    if (updates.perfectScores >= 5 && !badges.includes('precision_master')) badges.push('precision_master');
    if (updates.categoriesExplored?.length >= 3 && !badges.includes('versatile_scientist')) badges.push('versatile_scientist');
    if (updates.categoriesExplored?.length >= 6 && !badges.includes('chemistry_expert')) badges.push('chemistry_expert');
    updates.badges = badges;

    const saved = await Storage.updateAchievements(updates);
    if (saved) setAchievements(saved);
  };

  const toggleFavorite = async (experimentId) => {
    const newFavorites = await Storage.toggleFavorite(experimentId);
    setFavorites(newFavorites);
    return newFavorites.includes(experimentId);
  };

  const saveNote = async (experimentId, note) => {
    await Storage.saveNote(experimentId, note);
    const allNotes = await Storage.getNotes();
    setNotes(allNotes);
    return true;
  };

  const getNote = (experimentId) => notes[experimentId]?.content || '';

  const getStatistics = () => {
    const allExperiments = getAllExperiments();
    const totalExperiments = allExperiments.length;
    const uniqueCompleted = [...new Set(completedExperiments.map(c => c.experimentId))].length;
    const avgScore = completedExperiments.length > 0
      ? completedExperiments.reduce((sum, c) => sum + c.bestScore, 0) / completedExperiments.length
      : 0;

    return {
      totalExperiments,
      completedCount: completedExperiments.length,
      uniqueCompleted,
      completionRate: Math.round((uniqueCompleted / totalExperiments) * 100),
      avgScore: Math.round(avgScore),
      totalAttempts: completedExperiments.reduce((sum, c) => sum + c.attempts, 0),
      perfectScores: achievements.perfectScores || 0,
      badges: achievements.badges || [],
    };
  };

  const searchExperiments = (query) => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return getAllExperiments().filter(exp =>
      exp.title.toLowerCase().includes(lowerQuery) ||
      exp.description.toLowerCase().includes(lowerQuery) ||
      exp.categoryTitle.toLowerCase().includes(lowerQuery)
    );
  };

  const getRecentExperiments = (limit = 5) => {
    const sorted = [...experimentResults].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const unique = [];
    const seen = new Set();
    for (const result of sorted) {
      if (!seen.has(result.experimentId) && unique.length < limit) {
        const experiment = getExperimentById(result.experimentId);
        if (experiment) {
          unique.push({ ...experiment, lastAttempt: result.timestamp, lastScore: result.score });
          seen.add(result.experimentId);
        }
      }
    }
    return unique;
  };

  const getRecommendedExperiments = () => {
    const completedIds = completedExperiments.map(c => c.experimentId);
    const incomplete = getAllExperiments().filter(exp => !completedIds.includes(exp.id));
    return incomplete.slice(0, 6);
  };

  const exportData = async () => await Storage.exportLabData();

  const value = {
    user, loading, settings, completedExperiments, experimentResults,
    favorites, notes, achievements,
    registerUser, updateSettings, getAllExperiments: () => getAllExperiments(),
    getExperimentById, getExperimentsByCategory, getCategories,
    isExperimentCompleted, getExperimentCompletion, completeExperiment,
    toggleFavorite, saveNote, getNote, getStatistics, searchExperiments,
    getRecentExperiments, getRecommendedExperiments, exportData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
