import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as Storage from '../utils/storage';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // User state
  const [user, setUser] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);

  // Settings state
  const [settings, setSettings] = useState({
    fontSize: 16,
    theme: 'light',
    viewMode: 'continuous',
    autoSaveInterval: 5,
  });

  // Browser state
  const [tabs, setTabs] = useState([
    { id: '1', url: '', title: 'New Tab', isActive: true },
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  const [splitScreen, setSplitScreen] = useState(false);
  const [splitTabId, setSplitTabId] = useState(null);
  const [history, setHistory] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [shortcuts, setShortcuts] = useState([]);

  // Reader state
  const [documents, setDocuments] = useState([]);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [highlights, setHighlights] = useState([]);

  // Monitoring state
  const [monitoringData, setMonitoringData] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);

  // Tools state
  const [dictionaryVisible, setDictionaryVisible] = useState(false);
  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const [dictionaryPosition, setDictionaryPosition] = useState({ x: 50, y: 100 });
  const [calculatorPosition, setCalculatorPosition] = useState({ x: 50, y: 100 });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [
        userProfile,
        savedSettings,
        savedHistory,
        savedBookmarks,
        savedDownloads,
        savedShortcuts,
        savedDocuments,
        savedHighlights,
        savedMonitoring,
      ] = await Promise.all([
        Storage.getUserProfile(),
        Storage.getSettings(),
        Storage.getHistory(),
        Storage.getBookmarks(),
        Storage.getDownloads(),
        Storage.getShortcuts(),
        Storage.getDocuments(),
        Storage.getHighlights(),
        Storage.getMonitoringData(),
      ]);

      if (userProfile) {
        setUser(userProfile);
        setIsRegistered(true);
      }
      if (savedSettings) setSettings(savedSettings);
      if (savedHistory) setHistory(savedHistory);
      if (savedBookmarks) setBookmarks(savedBookmarks);
      if (savedDownloads) setDownloads(savedDownloads);
      if (savedShortcuts) setShortcuts(savedShortcuts);
      if (savedDocuments) setDocuments(savedDocuments);
      if (savedHighlights) setHighlights(savedHighlights);
      if (savedMonitoring) setMonitoringData(savedMonitoring);

      // Start auto-save
      Storage.startAutoSave(savedSettings?.autoSaveInterval || 5);
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
    const success = await Storage.saveUserProfile(profile);
    if (success) {
      setUser(profile);
      setIsRegistered(true);
    }
    return success;
  };

  const updateSettings = async (newSettings) => {
    const merged = { ...settings, ...newSettings };
    const success = await Storage.saveSettings(merged);
    if (success) {
      setSettings(merged);
      if (newSettings.autoSaveInterval) {
        Storage.startAutoSave(newSettings.autoSaveInterval);
      }
    }
    return success;
  };

  // Tab functions
  const addTab = (url = '', title = 'New Tab') => {
    const newTab = {
      id: Date.now().toString(),
      url,
      title,
      isActive: false,
    };
    setTabs([...tabs, newTab]);
    switchTab(newTab.id);
    return newTab.id;
  };

  const closeTab = (tabId) => {
    if (tabs.length === 1) {
      // Reset to new tab instead of closing
      setTabs([{ id: '1', url: '', title: 'New Tab', isActive: true }]);
      setActiveTabId('1');
      return;
    }
    const newTabs = tabs.filter((t) => t.id !== tabId);
    if (tabId === activeTabId) {
      setActiveTabId(newTabs[0].id);
    }
    if (tabId === splitTabId) {
      setSplitTabId(null);
      setSplitScreen(false);
    }
    setTabs(newTabs);
  };

  const switchTab = (tabId) => {
    setActiveTabId(tabId);
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) {
      trackActivity('tab_switch', { tabId, url: tab.url, title: tab.title });
    }
  };

  const updateTab = (tabId, updates) => {
    setTabs(tabs.map((t) => (t.id === tabId ? { ...t, ...updates } : t)));
  };

  const toggleSplitScreen = (secondTabId = null) => {
    if (splitScreen) {
      setSplitScreen(false);
      setSplitTabId(null);
    } else if (secondTabId && secondTabId !== activeTabId) {
      setSplitScreen(true);
      setSplitTabId(secondTabId);
    } else if (tabs.length > 1) {
      const otherTab = tabs.find((t) => t.id !== activeTabId);
      if (otherTab) {
        setSplitScreen(true);
        setSplitTabId(otherTab.id);
      }
    }
  };

  // History functions
  const addHistoryEntry = async (entry) => {
    const success = await Storage.addToHistory(entry);
    if (success) {
      setHistory((prev) => [
        { ...entry, id: Date.now().toString(), timestamp: new Date().toISOString() },
        ...prev,
      ].slice(0, 500));
    }
  };

  const clearBrowserHistory = async () => {
    const success = await Storage.clearHistory();
    if (success) {
      setHistory([]);
    }
  };

  // Bookmark functions
  const addBookmark = async (bookmark) => {
    const success = await Storage.addBookmark(bookmark);
    if (success) {
      setBookmarks((prev) => [
        { ...bookmark, id: Date.now().toString(), createdAt: new Date().toISOString() },
        ...prev,
      ]);
    }
    return success;
  };

  const removeBookmark = async (id) => {
    const success = await Storage.removeBookmark(id);
    if (success) {
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    }
    return success;
  };

  // Shortcut functions
  const addShortcut = async (shortcut) => {
    const newShortcuts = [...shortcuts, { ...shortcut, id: Date.now().toString() }];
    const success = await Storage.saveShortcuts(newShortcuts);
    if (success) {
      setShortcuts(newShortcuts);
    }
    return success;
  };

  const removeShortcut = async (id) => {
    const newShortcuts = shortcuts.filter((s) => s.id !== id);
    const success = await Storage.saveShortcuts(newShortcuts);
    if (success) {
      setShortcuts(newShortcuts);
    }
    return success;
  };

  // Download functions
  const addDownload = async (download) => {
    const success = await Storage.addDownload(download);
    if (success) {
      setDownloads((prev) => [
        { ...download, id: Date.now().toString(), downloadedAt: new Date().toISOString() },
        ...prev,
      ]);
    }
    return success;
  };

  // Document functions
  const addDocument = async (doc) => {
    const id = await Storage.saveDocument(doc);
    if (id) {
      setDocuments((prev) => [
        { ...doc, id, addedAt: new Date().toISOString() },
        ...prev,
      ]);
    }
    return id;
  };

  // Highlight functions
  const addHighlight = async (highlight) => {
    const success = await Storage.saveHighlight(highlight);
    if (success) {
      setHighlights((prev) => [
        { ...highlight, id: Date.now().toString(), createdAt: new Date().toISOString() },
        ...prev,
      ]);
    }
    return success;
  };

  // Monitoring functions
  const trackActivity = async (activityType, data = {}) => {
    const entry = {
      activityType,
      ...data,
      timestamp: new Date().toISOString(),
    };
    await Storage.saveMonitoringEntry(entry);
    setMonitoringData((prev) => [...prev, { ...entry, id: Date.now().toString() }]);
  };

  const startSession = async (sessionData) => {
    const sessionId = await Storage.startReadingSession(sessionData);
    if (sessionId) {
      setCurrentSession({ ...sessionData, id: sessionId });
    }
    return sessionId;
  };

  const endSession = async () => {
    if (currentSession) {
      await Storage.endReadingSession(currentSession.id);
      setCurrentSession(null);
    }
  };

  const trackToolUsage = async (toolName, action) => {
    await Storage.trackToolUsage(toolName, action);
  };

  // Export functions
  const exportData = async () => {
    return await Storage.exportMonitoringToCSV();
  };

  const exportForOtherApps = async () => {
    return await Storage.exportDataForOtherApps();
  };

  // Tool visibility
  const toggleDictionary = () => {
    setDictionaryVisible(!dictionaryVisible);
    trackToolUsage('dictionary', dictionaryVisible ? 'close' : 'open');
  };

  const toggleCalculator = () => {
    setCalculatorVisible(!calculatorVisible);
    trackToolUsage('calculator', calculatorVisible ? 'close' : 'open');
  };

  const value = {
    // User
    user,
    isRegistered,
    loading,
    registerUser,

    // Settings
    settings,
    updateSettings,

    // Tabs
    tabs,
    activeTabId,
    splitScreen,
    splitTabId,
    addTab,
    closeTab,
    switchTab,
    updateTab,
    toggleSplitScreen,

    // History
    history,
    addHistoryEntry,
    clearBrowserHistory,

    // Bookmarks
    bookmarks,
    addBookmark,
    removeBookmark,

    // Shortcuts
    shortcuts,
    addShortcut,
    removeShortcut,

    // Downloads
    downloads,
    addDownload,

    // Documents
    documents,
    currentDocument,
    setCurrentDocument,
    addDocument,

    // Highlights
    highlights,
    addHighlight,

    // Monitoring
    monitoringData,
    currentSession,
    trackActivity,
    startSession,
    endSession,
    trackToolUsage,
    exportData,
    exportForOtherApps,

    // Tools
    dictionaryVisible,
    calculatorVisible,
    dictionaryPosition,
    calculatorPosition,
    setDictionaryPosition,
    setCalculatorPosition,
    toggleDictionary,
    toggleCalculator,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
