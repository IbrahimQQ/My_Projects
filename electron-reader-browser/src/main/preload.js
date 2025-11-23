const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // User Profile
    user: {
        register: (profile) => ipcRenderer.invoke('user:register', profile),
        getProfile: () => ipcRenderer.invoke('user:getProfile'),
        updateProfile: (profile) => ipcRenderer.invoke('user:updateProfile', profile),
        logout: () => ipcRenderer.invoke('user:logout')
    },

    // Settings
    settings: {
        get: (key) => ipcRenderer.invoke('settings:get', key),
        set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
        getAll: () => ipcRenderer.invoke('settings:getAll')
    },

    // History
    history: {
        add: (entry) => ipcRenderer.invoke('history:add', entry),
        get: () => ipcRenderer.invoke('history:get'),
        clear: () => ipcRenderer.invoke('history:clear')
    },

    // Bookmarks
    bookmarks: {
        add: (bookmark) => ipcRenderer.invoke('bookmarks:add', bookmark),
        get: () => ipcRenderer.invoke('bookmarks:get'),
        remove: (id) => ipcRenderer.invoke('bookmarks:remove', id),
        update: (id, updates) => ipcRenderer.invoke('bookmarks:update', id, updates)
    },

    // Monitoring
    monitoring: {
        logSession: (session) => ipcRenderer.invoke('monitoring:logSession', session),
        getSessions: () => ipcRenderer.invoke('monitoring:getSessions'),
        export: () => ipcRenderer.invoke('monitoring:export'),
        clearSessions: () => ipcRenderer.invoke('monitoring:clearSessions')
    },

    // Tools
    tools: {
        openDictionary: () => ipcRenderer.invoke('tools:openDictionary'),
        openCalculator: () => ipcRenderer.invoke('tools:openCalculator'),
        closeDictionary: () => ipcRenderer.invoke('tools:closeDictionary'),
        closeCalculator: () => ipcRenderer.invoke('tools:closeCalculator'),
        minimizeDictionary: () => ipcRenderer.invoke('tools:minimizeDictionary'),
        minimizeCalculator: () => ipcRenderer.invoke('tools:minimizeCalculator')
    },

    // File Operations
    file: {
        saveWebpage: (data) => ipcRenderer.invoke('file:saveWebpage', data),
        openDocument: () => ipcRenderer.invoke('file:openDocument'),
        readDocument: (path) => ipcRenderer.invoke('file:readDocument', path),
        getDocumentsStructure: () => ipcRenderer.invoke('file:getDocumentsStructure')
    },

    // Downloads
    downloads: {
        getHistory: () => ipcRenderer.invoke('downloads:getHistory'),
        add: (download) => ipcRenderer.invoke('downloads:add', download),
        clear: () => ipcRenderer.invoke('downloads:clear')
    },

    // Navigation
    navigate: {
        toMain: () => ipcRenderer.invoke('navigate:main'),
        toRegistration: () => ipcRenderer.invoke('navigate:registration')
    },

    // App
    app: {
        getPath: (name) => ipcRenderer.invoke('app:getPath', name),
        getVersion: () => ipcRenderer.invoke('app:getVersion')
    },

    // Recovery
    recovery: {
        saveState: (state) => ipcRenderer.invoke('recovery:saveState', state),
        getState: () => ipcRenderer.invoke('recovery:getState'),
        clearState: () => ipcRenderer.invoke('recovery:clearState')
    }
});
