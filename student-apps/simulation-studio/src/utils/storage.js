import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const STORAGE_KEYS = {
  SIMULATIONS: '@simulation_studio_simulations',
  SETTINGS: '@simulation_studio_settings',
  TEMPLATES: '@simulation_studio_templates',
};

export const saveSimulations = async (simulations) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SIMULATIONS, JSON.stringify(simulations));
    return true;
  } catch (e) { console.error('Error saving simulations:', e); return false; }
};

export const loadSimulations = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SIMULATIONS);
    return data ? JSON.parse(data) : [];
  } catch (e) { console.error('Error loading simulations:', e); return []; }
};

export const saveSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return true;
  } catch (e) { console.error('Error saving settings:', e); return false; }
};

export const loadSettings = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : {};
  } catch (e) { console.error('Error loading settings:', e); return {}; }
};

export const exportSimulation = async (simulation, targetApp) => {
  try {
    const exportData = {
      ...simulation,
      exportedAt: new Date().toISOString(),
      targetApp,
      version: '1.0',
    };

    const fileName = `${simulation.id}_${targetApp}.json`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(exportData, null, 2));

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: `Export ${simulation.title} to ${targetApp}`,
      });
    }

    return filePath;
  } catch (e) { console.error('Error exporting simulation:', e); return null; }
};

export const exportAllSimulations = async (simulations) => {
  try {
    const exportData = {
      simulations,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    const fileName = `all_simulations_${Date.now()}.json`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(exportData, null, 2));

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath);
    }

    return filePath;
  } catch (e) { console.error('Error exporting all simulations:', e); return null; }
};

export default { saveSimulations, loadSimulations, saveSettings, loadSettings, exportSimulation, exportAllSimulations };
