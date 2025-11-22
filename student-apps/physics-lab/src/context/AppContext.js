import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Storage from '../utils/storage';
import { physicsExperiments } from '../data/experiments';

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
  const [currentExperiment, setCurrentExperiment] = useState(null);
  const [simulationState, setSimulationState] = useState({});

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

  // Get all experiments as flat list
  const getAllExperiments = () => {
    const experiments = [];
    Object.entries(physicsExperiments).forEach(([categoryId, category]) => {
      category.experiments.forEach(exp => {
        experiments.push({
          ...exp,
          categoryId,
          categoryTitle: category.title,
          categoryIcon: category.icon,
          categoryColor: category.color,
        });
      });
    });
    return experiments;
  };

  // Get experiment by ID
  const getExperimentById = (experimentId) => {
    const allExperiments = getAllExperiments();
    return allExperiments.find(exp => exp.id === experimentId);
  };

  // Get experiments by category
  const getExperimentsByCategory = (categoryId) => {
    const category = physicsExperiments[categoryId];
    if (!category) return [];
    return category.experiments.map(exp => ({
      ...exp,
      categoryId,
      categoryTitle: category.title,
      categoryIcon: category.icon,
      categoryColor: category.color,
    }));
  };

  // Get categories with counts
  const getCategories = () => {
    return Object.entries(physicsExperiments).map(([id, category]) => ({
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

  // Check if experiment is completed
  const isExperimentCompleted = (experimentId) => {
    return completedExperiments.some(c => c.experimentId === experimentId);
  };

  // Get experiment completion data
  const getExperimentCompletion = (experimentId) => {
    return completedExperiments.find(c => c.experimentId === experimentId);
  };

  // Complete an experiment
  const completeExperiment = async (experimentId, score, data) => {
    await Storage.markExperimentCompleted(experimentId, score);

    // Save detailed result
    await Storage.saveExperimentResult({
      experimentId,
      score,
      data,
    });

    // Update local state
    const completed = await Storage.getCompletedExperiments();
    setCompletedExperiments(completed);

    const results = await Storage.getExperimentResults();
    setExperimentResults(results);

    // Update achievements
    await updateAchievementsAfterExperiment(experimentId, score);

    // Export proficiency data for other apps
    await Storage.exportProficiencyData();

    return true;
  };

  // Update achievements after completing experiment
  const updateAchievementsAfterExperiment = async (experimentId, score) => {
    const experiment = getExperimentById(experimentId);
    const updates = { ...achievements };

    updates.experimentsCompleted = (updates.experimentsCompleted || 0) + 1;

    if (score >= 100) {
      updates.perfectScores = (updates.perfectScores || 0) + 1;
    }

    if (experiment && !updates.categoriesExplored?.includes(experiment.categoryId)) {
      updates.categoriesExplored = [...(updates.categoriesExplored || []), experiment.categoryId];
    }

    // Check for badges
    const badges = [...(updates.badges || [])];

    if (updates.experimentsCompleted >= 1 && !badges.includes('first_experiment')) {
      badges.push('first_experiment');
    }
    if (updates.experimentsCompleted >= 10 && !badges.includes('lab_explorer')) {
      badges.push('lab_explorer');
    }
    if (updates.experimentsCompleted >= 25 && !badges.includes('lab_scientist')) {
      badges.push('lab_scientist');
    }
    if (updates.perfectScores >= 5 && !badges.includes('perfectionist')) {
      badges.push('perfectionist');
    }
    if (updates.categoriesExplored?.length >= 3 && !badges.includes('category_master')) {
      badges.push('category_master');
    }
    if (updates.categoriesExplored?.length >= 6 && !badges.includes('physics_guru')) {
      badges.push('physics_guru');
    }

    updates.badges = badges;

    const saved = await Storage.updateAchievements(updates);
    if (saved) {
      setAchievements(saved);
    }
  };

  // Toggle favorite
  const toggleFavorite = async (experimentId) => {
    const newFavorites = await Storage.toggleFavorite(experimentId);
    setFavorites(newFavorites);
    return newFavorites.includes(experimentId);
  };

  // Save note for experiment
  const saveNote = async (experimentId, note) => {
    await Storage.saveNote(experimentId, note);
    const allNotes = await Storage.getNotes();
    setNotes(allNotes);
    return true;
  };

  // Get note for experiment
  const getNote = (experimentId) => {
    return notes[experimentId]?.content || '';
  };

  // Get statistics
  const getStatistics = () => {
    const allExperiments = getAllExperiments();
    const totalExperiments = allExperiments.length;
    const completedCount = completedExperiments.length;
    const uniqueCompleted = [...new Set(completedExperiments.map(c => c.experimentId))].length;

    const avgScore = completedExperiments.length > 0
      ? completedExperiments.reduce((sum, c) => sum + c.bestScore, 0) / completedExperiments.length
      : 0;

    const categoryStats = getCategories().map(cat => ({
      ...cat,
      progress: cat.experimentCount > 0
        ? Math.round((cat.completedCount / cat.experimentCount) * 100)
        : 0,
    }));

    return {
      totalExperiments,
      completedCount,
      uniqueCompleted,
      completionRate: Math.round((uniqueCompleted / totalExperiments) * 100),
      avgScore: Math.round(avgScore),
      categoryStats,
      totalAttempts: completedExperiments.reduce((sum, c) => sum + c.attempts, 0),
      perfectScores: achievements.perfectScores || 0,
      badges: achievements.badges || [],
    };
  };

  // Search experiments
  const searchExperiments = (query) => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    const allExperiments = getAllExperiments();

    return allExperiments.filter(exp =>
      exp.title.toLowerCase().includes(lowerQuery) ||
      exp.description.toLowerCase().includes(lowerQuery) ||
      exp.categoryTitle.toLowerCase().includes(lowerQuery) ||
      exp.theory?.toLowerCase().includes(lowerQuery) ||
      exp.objectives?.some(obj => obj.toLowerCase().includes(lowerQuery))
    );
  };

  // Get recent experiments
  const getRecentExperiments = (limit = 5) => {
    const sorted = [...experimentResults].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    const unique = [];
    const seen = new Set();

    for (const result of sorted) {
      if (!seen.has(result.experimentId) && unique.length < limit) {
        const experiment = getExperimentById(result.experimentId);
        if (experiment) {
          unique.push({
            ...experiment,
            lastAttempt: result.timestamp,
            lastScore: result.score,
          });
          seen.add(result.experimentId);
        }
      }
    }

    return unique;
  };

  // Get recommended experiments
  const getRecommendedExperiments = () => {
    const allExperiments = getAllExperiments();
    const completedIds = completedExperiments.map(c => c.experimentId);

    // Find incomplete experiments, prioritize by difficulty and category balance
    const incomplete = allExperiments.filter(exp => !completedIds.includes(exp.id));

    // Sort by: 1. Beginner first, 2. Less explored categories first
    const categoryCompletions = {};
    completedExperiments.forEach(c => {
      const exp = getExperimentById(c.experimentId);
      if (exp) {
        categoryCompletions[exp.categoryId] = (categoryCompletions[exp.categoryId] || 0) + 1;
      }
    });

    return incomplete
      .sort((a, b) => {
        const diffOrder = { beginner: 0, intermediate: 1, advanced: 2 };
        const diffA = diffOrder[a.difficulty] || 1;
        const diffB = diffOrder[b.difficulty] || 1;

        if (diffA !== diffB) return diffA - diffB;

        const catA = categoryCompletions[a.categoryId] || 0;
        const catB = categoryCompletions[b.categoryId] || 0;

        return catA - catB;
      })
      .slice(0, 6);
  };

  // Export data
  const exportData = async () => {
    return await Storage.exportLabData();
  };

  const value = {
    user,
    loading,
    settings,
    completedExperiments,
    experimentResults,
    favorites,
    notes,
    achievements,
    currentExperiment,
    simulationState,

    setCurrentExperiment,
    setSimulationState,

    registerUser,
    updateSettings,
    getAllExperiments,
    getExperimentById,
    getExperimentsByCategory,
    getCategories,
    isExperimentCompleted,
    getExperimentCompletion,
    completeExperiment,
    toggleFavorite,
    saveNote,
    getNote,
    getStatistics,
    searchExperiments,
    getRecentExperiments,
    getRecommendedExperiments,
    exportData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
