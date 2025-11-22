// Storage utility for local data persistence
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const KEYS = {
  USER_PROFILE: '@student_reader_user_profile',
  BROWSER_HISTORY: '@student_reader_browser_history',
  BOOKMARKS: '@student_reader_bookmarks',
  DOWNLOADS: '@student_reader_downloads',
  MONITORING_DATA: '@student_reader_monitoring',
  READING_SESSIONS: '@student_reader_sessions',
  TOOL_USAGE: '@student_reader_tools',
  SETTINGS: '@student_reader_settings',
  HOMEPAGE_SHORTCUTS: '@student_reader_shortcuts',
  SAVED_PAGES: '@student_reader_saved_pages',
  DOCUMENTS: '@student_reader_documents',
  HIGHLIGHTS: '@student_reader_highlights',
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

// Browser History
export const addToHistory = async (entry) => {
  try {
    const history = await getHistory();
    const newEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    history.unshift(newEntry);
    // Keep last 500 entries
    const trimmedHistory = history.slice(0, 500);
    await AsyncStorage.setItem(KEYS.BROWSER_HISTORY, JSON.stringify(trimmedHistory));
    return true;
  } catch (error) {
    console.error('Error adding to history:', error);
    return false;
  }
};

export const getHistory = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.BROWSER_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting history:', error);
    return [];
  }
};

export const clearHistory = async () => {
  try {
    await AsyncStorage.setItem(KEYS.BROWSER_HISTORY, JSON.stringify([]));
    return true;
  } catch (error) {
    console.error('Error clearing history:', error);
    return false;
  }
};

// Bookmarks
export const addBookmark = async (bookmark) => {
  try {
    const bookmarks = await getBookmarks();
    const newBookmark = {
      ...bookmark,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    bookmarks.unshift(newBookmark);
    await AsyncStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    return true;
  } catch (error) {
    console.error('Error adding bookmark:', error);
    return false;
  }
};

export const getBookmarks = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.BOOKMARKS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    return [];
  }
};

export const removeBookmark = async (id) => {
  try {
    const bookmarks = await getBookmarks();
    const filtered = bookmarks.filter((b) => b.id !== id);
    await AsyncStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return false;
  }
};

// Downloads
export const addDownload = async (download) => {
  try {
    const downloads = await getDownloads();
    const newDownload = {
      ...download,
      id: Date.now().toString(),
      downloadedAt: new Date().toISOString(),
    };
    downloads.unshift(newDownload);
    await AsyncStorage.setItem(KEYS.DOWNLOADS, JSON.stringify(downloads));
    return true;
  } catch (error) {
    console.error('Error adding download:', error);
    return false;
  }
};

export const getDownloads = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.DOWNLOADS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting downloads:', error);
    return [];
  }
};

// Monitoring Data
export const saveMonitoringEntry = async (entry) => {
  try {
    const data = await getMonitoringData();
    const newEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    data.push(newEntry);
    await AsyncStorage.setItem(KEYS.MONITORING_DATA, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving monitoring entry:', error);
    return false;
  }
};

export const getMonitoringData = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.MONITORING_DATA);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting monitoring data:', error);
    return [];
  }
};

export const clearMonitoringData = async () => {
  try {
    await AsyncStorage.setItem(KEYS.MONITORING_DATA, JSON.stringify([]));
    return true;
  } catch (error) {
    console.error('Error clearing monitoring data:', error);
    return false;
  }
};

// Reading Sessions
export const startReadingSession = async (session) => {
  try {
    const sessions = await getReadingSessions();
    const newSession = {
      ...session,
      id: Date.now().toString(),
      startTime: new Date().toISOString(),
      endTime: null,
      duration: 0,
    };
    sessions.push(newSession);
    await AsyncStorage.setItem(KEYS.READING_SESSIONS, JSON.stringify(sessions));
    return newSession.id;
  } catch (error) {
    console.error('Error starting reading session:', error);
    return null;
  }
};

export const endReadingSession = async (sessionId) => {
  try {
    const sessions = await getReadingSessions();
    const index = sessions.findIndex((s) => s.id === sessionId);
    if (index !== -1) {
      const startTime = new Date(sessions[index].startTime);
      const endTime = new Date();
      sessions[index].endTime = endTime.toISOString();
      sessions[index].duration = Math.round((endTime - startTime) / 1000); // seconds
      await AsyncStorage.setItem(KEYS.READING_SESSIONS, JSON.stringify(sessions));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error ending reading session:', error);
    return false;
  }
};

export const getReadingSessions = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.READING_SESSIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting reading sessions:', error);
    return [];
  }
};

// Tool Usage Tracking
export const trackToolUsage = async (toolName, action) => {
  try {
    const usage = await getToolUsage();
    const entry = {
      tool: toolName,
      action: action,
      timestamp: new Date().toISOString(),
    };
    usage.push(entry);
    await AsyncStorage.setItem(KEYS.TOOL_USAGE, JSON.stringify(usage));
    return true;
  } catch (error) {
    console.error('Error tracking tool usage:', error);
    return false;
  }
};

export const getToolUsage = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.TOOL_USAGE);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting tool usage:', error);
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
      fontSize: 16,
      theme: 'light',
      viewMode: 'continuous',
      autoSaveInterval: 5, // minutes
    };
  } catch (error) {
    console.error('Error getting settings:', error);
    return {
      fontSize: 16,
      theme: 'light',
      viewMode: 'continuous',
      autoSaveInterval: 5,
    };
  }
};

// Homepage Shortcuts
export const saveShortcuts = async (shortcuts) => {
  try {
    await AsyncStorage.setItem(KEYS.HOMEPAGE_SHORTCUTS, JSON.stringify(shortcuts));
    return true;
  } catch (error) {
    console.error('Error saving shortcuts:', error);
    return false;
  }
};

export const getShortcuts = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.HOMEPAGE_SHORTCUTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting shortcuts:', error);
    return [];
  }
};

// Saved Pages (Offline)
export const savePage = async (page) => {
  try {
    const pages = await getSavedPages();
    const pageDir = `${FileSystem.documentDirectory}saved_pages/`;
    const dirInfo = await FileSystem.getInfoAsync(pageDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(pageDir, { intermediates: true });
    }

    const filename = `page_${Date.now()}.html`;
    const filePath = `${pageDir}${filename}`;
    await FileSystem.writeAsStringAsync(filePath, page.content || '');

    const newPage = {
      id: Date.now().toString(),
      url: page.url,
      title: page.title,
      filePath: filePath,
      savedAt: new Date().toISOString(),
    };
    pages.push(newPage);
    await AsyncStorage.setItem(KEYS.SAVED_PAGES, JSON.stringify(pages));
    return true;
  } catch (error) {
    console.error('Error saving page:', error);
    return false;
  }
};

export const getSavedPages = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.SAVED_PAGES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting saved pages:', error);
    return [];
  }
};

// Documents
export const saveDocument = async (doc) => {
  try {
    const docs = await getDocuments();
    const newDoc = {
      ...doc,
      id: Date.now().toString(),
      addedAt: new Date().toISOString(),
    };
    docs.push(newDoc);
    await AsyncStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(docs));
    return newDoc.id;
  } catch (error) {
    console.error('Error saving document:', error);
    return null;
  }
};

export const getDocuments = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.DOCUMENTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting documents:', error);
    return [];
  }
};

// Highlights
export const saveHighlight = async (highlight) => {
  try {
    const highlights = await getHighlights();
    const newHighlight = {
      ...highlight,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    highlights.push(newHighlight);
    await AsyncStorage.setItem(KEYS.HIGHLIGHTS, JSON.stringify(highlights));
    return true;
  } catch (error) {
    console.error('Error saving highlight:', error);
    return false;
  }
};

export const getHighlights = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.HIGHLIGHTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting highlights:', error);
    return [];
  }
};

// Export Monitoring Data to CSV
export const exportMonitoringToCSV = async () => {
  try {
    const profile = await getUserProfile();
    const data = await getMonitoringData();
    const sessions = await getReadingSessions();
    const toolUsage = await getToolUsage();

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Create CSV header
    let csv = 'Date,Time Started,Time Ended,Duration (seconds),Document Title,Subject,Topic,Activity Type,URL\n';

    // Add monitoring data rows
    data.forEach((entry) => {
      const date = new Date(entry.timestamp);
      csv += `${date.toLocaleDateString()},${date.toLocaleTimeString()},,0,${entry.title || ''},${entry.subject || ''},${entry.topic || ''},${entry.activityType || 'browsing'},${entry.url || ''}\n`;
    });

    // Add session data rows
    sessions.forEach((session) => {
      const startDate = new Date(session.startTime);
      const endDate = session.endTime ? new Date(session.endTime) : new Date();
      csv += `${startDate.toLocaleDateString()},${startDate.toLocaleTimeString()},${endDate.toLocaleTimeString()},${session.duration || 0},${session.documentTitle || ''},${session.subject || ''},${session.topic || ''},reading,${session.url || ''}\n`;
    });

    // Create filename with student name and class
    const studentName = profile.name.replace(/\s+/g, '');
    const studentClass = profile.classGrade.replace(/\s+/g, '');
    const filename = `${studentName}${studentClass}.csv`;

    // Save to file
    const fileDir = `${FileSystem.documentDirectory}exports/`;
    const dirInfo = await FileSystem.getInfoAsync(fileDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(fileDir, { intermediates: true });
    }

    const filePath = `${fileDir}${filename}`;
    await FileSystem.writeAsStringAsync(filePath, csv);

    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath);
    }

    return filePath;
  } catch (error) {
    console.error('Error exporting monitoring data:', error);
    return null;
  }
};

// Auto-save monitoring data
let autoSaveInterval = null;

export const startAutoSave = (intervalMinutes = 5) => {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
  }
  autoSaveInterval = setInterval(async () => {
    await exportMonitoringToCSV();
    console.log('Auto-saved monitoring data');
  }, intervalMinutes * 60 * 1000);
};

export const stopAutoSave = () => {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
};

// Get shared directory path for inter-app communication
export const getSharedDataPath = () => {
  return `${FileSystem.documentDirectory}shared_data/`;
};

export const ensureSharedDirectory = async () => {
  const sharedPath = getSharedDataPath();
  const dirInfo = await FileSystem.getInfoAsync(sharedPath);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(sharedPath, { intermediates: true });
  }
  return sharedPath;
};

// Export data for other apps
export const exportDataForOtherApps = async () => {
  try {
    const sharedPath = await ensureSharedDirectory();
    const profile = await getUserProfile();
    const sessions = await getReadingSessions();
    const monitoring = await getMonitoringData();

    const exportData = {
      profile,
      sessions,
      monitoring,
      exportedAt: new Date().toISOString(),
    };

    const filePath = `${sharedPath}reader_data.json`;
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(exportData, null, 2));

    // Also export CSV
    await exportMonitoringToCSV();

    return true;
  } catch (error) {
    console.error('Error exporting data for other apps:', error);
    return false;
  }
};
