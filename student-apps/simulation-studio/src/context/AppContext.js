import React, { createContext, useContext, useState, useEffect } from 'react';
import { saveSimulations, loadSimulations, saveSettings, loadSettings, exportSimulation, exportAllSimulations } from '../utils/storage';
import { defaultSimulation } from '../data/templates';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export const AppProvider = ({ children }) => {
  const [simulations, setSimulations] = useState([]);
  const [settings, setSettings] = useState({ darkMode: false, autoSave: true, showTips: true });
  const [loading, setLoading] = useState(true);
  const [currentSimulation, setCurrentSimulation] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [loadedSims, loadedSettings] = await Promise.all([loadSimulations(), loadSettings()]);
    setSimulations(loadedSims);
    if (Object.keys(loadedSettings).length > 0) setSettings(loadedSettings);
    setLoading(false);
  };

  const createSimulation = (subject) => {
    const newSim = {
      ...defaultSimulation,
      id: `sim_${Date.now()}`,
      subject,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCurrentSimulation(newSim);
    return newSim;
  };

  const saveSimulation = async (simulation) => {
    const updated = { ...simulation, updatedAt: new Date().toISOString() };
    const exists = simulations.find(s => s.id === simulation.id);
    let newList;
    if (exists) {
      newList = simulations.map(s => s.id === simulation.id ? updated : s);
    } else {
      newList = [...simulations, updated];
    }
    setSimulations(newList);
    await saveSimulations(newList);
    return updated;
  };

  const deleteSimulation = async (id) => {
    const newList = simulations.filter(s => s.id !== id);
    setSimulations(newList);
    await saveSimulations(newList);
  };

  const duplicateSimulation = async (id) => {
    const original = simulations.find(s => s.id === id);
    if (!original) return null;
    const duplicate = {
      ...original,
      id: `sim_${Date.now()}`,
      title: `${original.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newList = [...simulations, duplicate];
    setSimulations(newList);
    await saveSimulations(newList);
    return duplicate;
  };

  const getSimulationById = (id) => simulations.find(s => s.id === id);

  const getSimulationsBySubject = (subject) => simulations.filter(s => s.subject === subject);

  const exportSim = async (id, targetApp) => {
    const sim = getSimulationById(id);
    if (!sim) return null;
    return await exportSimulation(sim, targetApp);
  };

  const exportAll = async () => {
    return await exportAllSimulations(simulations);
  };

  const updateSettings = async (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await saveSettings(updated);
  };

  const getStatistics = () => {
    const physics = simulations.filter(s => s.subject === 'physics').length;
    const chemistry = simulations.filter(s => s.subject === 'chemistry').length;
    const biology = simulations.filter(s => s.subject === 'biology').length;
    return { total: simulations.length, physics, chemistry, biology };
  };

  const value = {
    simulations,
    settings,
    loading,
    currentSimulation,
    setCurrentSimulation,
    createSimulation,
    saveSimulation,
    deleteSimulation,
    duplicateSimulation,
    getSimulationById,
    getSimulationsBySubject,
    exportSim,
    exportAll,
    updateSettings,
    getStatistics,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
