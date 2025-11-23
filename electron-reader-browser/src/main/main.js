const { app, BrowserWindow, ipcMain, session, Menu, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

// Initialize stores for different data types
const userStore = new Store({ name: 'user-profile' });
const settingsStore = new Store({ name: 'settings' });
const historyStore = new Store({ name: 'history' });
const bookmarksStore = new Store({ name: 'bookmarks' });
const monitoringStore = new Store({ name: 'monitoring' });

let mainWindow;
let dictionaryWindow = null;
let calculatorWindow = null;

// Auto-save interval (5 minutes)
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000;
let autoSaveTimer = null;

// Create the main application window
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webviewTag: true,
            sandbox: false
        },
        icon: path.join(__dirname, '../../assets/icons/icon.png'),
        show: false
    });

    // Check if user is registered
    const userProfile = userStore.get('profile');
    if (userProfile) {
        mainWindow.loadFile(path.join(__dirname, '../renderer/pages/main.html'));
    } else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/pages/registration.html'));
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('close', () => {
        saveMonitoringData();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Start auto-save timer
    startAutoSave();
}

// Create floating dictionary window
function createDictionaryWindow() {
    if (dictionaryWindow) {
        dictionaryWindow.focus();
        return;
    }

    const savedPosition = settingsStore.get('dictionaryPosition', { x: 100, y: 100 });
    const savedSize = settingsStore.get('dictionarySize', { width: 400, height: 500 });

    dictionaryWindow = new BrowserWindow({
        width: savedSize.width,
        height: savedSize.height,
        x: savedPosition.x,
        y: savedPosition.y,
        minWidth: 300,
        minHeight: 400,
        frame: false,
        transparent: false,
        alwaysOnTop: true,
        resizable: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    dictionaryWindow.loadFile(path.join(__dirname, '../renderer/pages/dictionary.html'));

    dictionaryWindow.on('move', () => {
        const position = dictionaryWindow.getPosition();
        settingsStore.set('dictionaryPosition', { x: position[0], y: position[1] });
    });

    dictionaryWindow.on('resize', () => {
        const size = dictionaryWindow.getSize();
        settingsStore.set('dictionarySize', { width: size[0], height: size[1] });
    });

    dictionaryWindow.on('closed', () => {
        dictionaryWindow = null;
    });
}

// Create floating calculator window
function createCalculatorWindow() {
    if (calculatorWindow) {
        calculatorWindow.focus();
        return;
    }

    const savedPosition = settingsStore.get('calculatorPosition', { x: 200, y: 200 });
    const savedSize = settingsStore.get('calculatorSize', { width: 350, height: 500 });

    calculatorWindow = new BrowserWindow({
        width: savedSize.width,
        height: savedSize.height,
        x: savedPosition.x,
        y: savedPosition.y,
        minWidth: 300,
        minHeight: 400,
        frame: false,
        transparent: false,
        alwaysOnTop: true,
        resizable: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    calculatorWindow.loadFile(path.join(__dirname, '../renderer/pages/calculator.html'));

    calculatorWindow.on('move', () => {
        const position = calculatorWindow.getPosition();
        settingsStore.set('calculatorPosition', { x: position[0], y: position[1] });
    });

    calculatorWindow.on('resize', () => {
        const size = calculatorWindow.getSize();
        settingsStore.set('calculatorSize', { width: size[0], height: size[1] });
    });

    calculatorWindow.on('closed', () => {
        calculatorWindow = null;
    });
}

// Auto-save monitoring data
function startAutoSave() {
    autoSaveTimer = setInterval(() => {
        saveMonitoringData();
    }, AUTO_SAVE_INTERVAL);
}

// Save monitoring data to file
function saveMonitoringData() {
    const userProfile = userStore.get('profile');
    if (!userProfile) return;

    const monitoringData = monitoringStore.get('sessions', []);
    if (monitoringData.length === 0) return;

    const fileName = `${userProfile.name.replace(/\s+/g, '')}${userProfile.class}.csv`;
    const filePath = path.join(app.getPath('userData'), 'exports', fileName);

    // Ensure exports directory exists
    const exportsDir = path.join(app.getPath('userData'), 'exports');
    if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Create CSV content
    const headers = 'Date,Time Started,Time Ended,Duration,Document Title,Subject,Topic,Activity Type\n';
    const rows = monitoringData.map(session => {
        return `${session.date},${session.timeStarted},${session.timeEnded},${session.duration},${session.documentTitle},${session.subject},${session.topic},${session.activityType}`;
    }).join('\n');

    fs.writeFileSync(filePath, headers + rows, 'utf-8');
}

// IPC Handlers
// User Profile
ipcMain.handle('user:register', (event, profile) => {
    userStore.set('profile', profile);
    return { success: true };
});

ipcMain.handle('user:getProfile', () => {
    return userStore.get('profile', null);
});

ipcMain.handle('user:updateProfile', (event, profile) => {
    userStore.set('profile', profile);
    return { success: true };
});

ipcMain.handle('user:logout', () => {
    userStore.delete('profile');
    return { success: true };
});

// Settings
ipcMain.handle('settings:get', (event, key) => {
    return settingsStore.get(key);
});

ipcMain.handle('settings:set', (event, key, value) => {
    settingsStore.set(key, value);
    return { success: true };
});

ipcMain.handle('settings:getAll', () => {
    return settingsStore.store;
});

// History
ipcMain.handle('history:add', (event, entry) => {
    const history = historyStore.get('entries', []);
    entry.timestamp = new Date().toISOString();
    history.unshift(entry);
    // Keep last 1000 entries
    if (history.length > 1000) history.pop();
    historyStore.set('entries', history);
    return { success: true };
});

ipcMain.handle('history:get', () => {
    return historyStore.get('entries', []);
});

ipcMain.handle('history:clear', () => {
    historyStore.set('entries', []);
    return { success: true };
});

// Bookmarks
ipcMain.handle('bookmarks:add', (event, bookmark) => {
    const bookmarks = bookmarksStore.get('items', []);
    bookmark.id = Date.now().toString();
    bookmark.createdAt = new Date().toISOString();
    bookmarks.push(bookmark);
    bookmarksStore.set('items', bookmarks);
    return { success: true, id: bookmark.id };
});

ipcMain.handle('bookmarks:get', () => {
    return bookmarksStore.get('items', []);
});

ipcMain.handle('bookmarks:remove', (event, id) => {
    const bookmarks = bookmarksStore.get('items', []);
    const filtered = bookmarks.filter(b => b.id !== id);
    bookmarksStore.set('items', filtered);
    return { success: true };
});

ipcMain.handle('bookmarks:update', (event, id, updates) => {
    const bookmarks = bookmarksStore.get('items', []);
    const index = bookmarks.findIndex(b => b.id === id);
    if (index !== -1) {
        bookmarks[index] = { ...bookmarks[index], ...updates };
        bookmarksStore.set('items', bookmarks);
    }
    return { success: true };
});

// Monitoring
ipcMain.handle('monitoring:logSession', (event, session) => {
    const sessions = monitoringStore.get('sessions', []);
    sessions.push(session);
    monitoringStore.set('sessions', sessions);
    return { success: true };
});

ipcMain.handle('monitoring:getSessions', () => {
    return monitoringStore.get('sessions', []);
});

ipcMain.handle('monitoring:export', async () => {
    const userProfile = userStore.get('profile');
    if (!userProfile) return { success: false, error: 'No user profile' };

    const fileName = `${userProfile.name.replace(/\s+/g, '')}${userProfile.class}.csv`;

    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: fileName,
        filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    });

    if (!result.canceled && result.filePath) {
        saveMonitoringData();
        const sourcePath = path.join(app.getPath('userData'), 'exports', fileName);
        if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, result.filePath);
        }
        return { success: true, path: result.filePath };
    }
    return { success: false };
});

ipcMain.handle('monitoring:clearSessions', () => {
    monitoringStore.set('sessions', []);
    return { success: true };
});

// Tools
ipcMain.handle('tools:openDictionary', () => {
    createDictionaryWindow();
    return { success: true };
});

ipcMain.handle('tools:openCalculator', () => {
    createCalculatorWindow();
    return { success: true };
});

ipcMain.handle('tools:closeDictionary', () => {
    if (dictionaryWindow) {
        dictionaryWindow.close();
    }
    return { success: true };
});

ipcMain.handle('tools:closeCalculator', () => {
    if (calculatorWindow) {
        calculatorWindow.close();
    }
    return { success: true };
});

ipcMain.handle('tools:minimizeDictionary', () => {
    if (dictionaryWindow) {
        dictionaryWindow.minimize();
    }
    return { success: true };
});

ipcMain.handle('tools:minimizeCalculator', () => {
    if (calculatorWindow) {
        calculatorWindow.minimize();
    }
    return { success: true };
});

// File operations
ipcMain.handle('file:saveWebpage', async (event, { url, html, title }) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: `${title || 'webpage'}.html`,
        filters: [{ name: 'HTML Files', extensions: ['html'] }]
    });

    if (!result.canceled && result.filePath) {
        fs.writeFileSync(result.filePath, html, 'utf-8');
        return { success: true, path: result.filePath };
    }
    return { success: false };
});

ipcMain.handle('file:openDocument', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        filters: [
            { name: 'Documents', extensions: ['html', 'htm', 'pdf', 'epub', 'txt'] },
            { name: 'HTML Files', extensions: ['html', 'htm'] },
            { name: 'PDF Files', extensions: ['pdf'] },
            { name: 'EPUB Files', extensions: ['epub'] },
            { name: 'Text Files', extensions: ['txt'] }
        ],
        properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
        return { success: true, path: result.filePaths[0] };
    }
    return { success: false };
});

ipcMain.handle('file:readDocument', async (event, filePath) => {
    try {
        const ext = path.extname(filePath).toLowerCase();
        if (ext === '.pdf') {
            const buffer = fs.readFileSync(filePath);
            return { success: true, type: 'pdf', data: buffer.toString('base64') };
        } else {
            const content = fs.readFileSync(filePath, 'utf-8');
            return { success: true, type: ext.substring(1), data: content };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('file:getDocumentsStructure', async () => {
    const documentsPath = path.join(__dirname, '../../documents/subjects');
    const structure = [];

    try {
        if (fs.existsSync(documentsPath)) {
            const subjects = fs.readdirSync(documentsPath);
            for (const subject of subjects) {
                const subjectPath = path.join(documentsPath, subject);
                if (fs.statSync(subjectPath).isDirectory()) {
                    const topics = fs.readdirSync(subjectPath)
                        .filter(file => ['.html', '.htm', '.pdf', '.epub', '.txt'].includes(path.extname(file).toLowerCase()))
                        .map(file => ({
                            name: path.basename(file, path.extname(file)),
                            file: file,
                            path: path.join(subjectPath, file),
                            type: path.extname(file).substring(1)
                        }));

                    structure.push({
                        name: subject,
                        path: subjectPath,
                        topics: topics
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error reading documents structure:', error);
    }

    return structure;
});

// Downloads
ipcMain.handle('downloads:getHistory', () => {
    return settingsStore.get('downloads', []);
});

ipcMain.handle('downloads:add', (event, download) => {
    const downloads = settingsStore.get('downloads', []);
    download.timestamp = new Date().toISOString();
    downloads.unshift(download);
    settingsStore.set('downloads', downloads);
    return { success: true };
});

ipcMain.handle('downloads:clear', () => {
    settingsStore.set('downloads', []);
    return { success: true };
});

// Navigation to main window after registration
ipcMain.handle('navigate:main', () => {
    if (mainWindow) {
        mainWindow.loadFile(path.join(__dirname, '../renderer/pages/main.html'));
    }
    return { success: true };
});

ipcMain.handle('navigate:registration', () => {
    if (mainWindow) {
        mainWindow.loadFile(path.join(__dirname, '../renderer/pages/registration.html'));
    }
    return { success: true };
});

// App paths
ipcMain.handle('app:getPath', (event, name) => {
    return app.getPath(name);
});

ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
});

// Crash recovery
ipcMain.handle('recovery:saveState', (event, state) => {
    settingsStore.set('lastState', state);
    return { success: true };
});

ipcMain.handle('recovery:getState', () => {
    return settingsStore.get('lastState', null);
});

ipcMain.handle('recovery:clearState', () => {
    settingsStore.delete('lastState');
    return { success: true };
});

// App events
app.whenReady().then(() => {
    createMainWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
    }
    saveMonitoringData();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    saveMonitoringData();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    saveMonitoringData();
});
