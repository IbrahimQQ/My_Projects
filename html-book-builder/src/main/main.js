const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let currentProjectPath = null;

// Create the main application window
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 1000,
        minWidth: 1200,
        minHeight: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, '../../assets/icons/icon.png'),
        title: 'HTML Book Builder'
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    // Open DevTools in development mode
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    createMenu();
}

// Create application menu
function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Project',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => mainWindow.webContents.send('menu-new-project')
                },
                {
                    label: 'Open Project',
                    accelerator: 'CmdOrCtrl+O',
                    click: () => openProject()
                },
                {
                    label: 'Save Project',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => mainWindow.webContents.send('menu-save-project')
                },
                {
                    label: 'Save Project As...',
                    accelerator: 'CmdOrCtrl+Shift+S',
                    click: () => saveProjectAs()
                },
                { type: 'separator' },
                {
                    label: 'Export HTML',
                    accelerator: 'CmdOrCtrl+E',
                    click: () => mainWindow.webContents.send('menu-export')
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => app.quit()
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
                { label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z', role: 'redo' },
                { type: 'separator' },
                { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
                { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
                { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
                { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Editor',
                    accelerator: 'CmdOrCtrl+1',
                    click: () => mainWindow.webContents.send('switch-view', 'editor')
                },
                {
                    label: 'Media Manager',
                    accelerator: 'CmdOrCtrl+2',
                    click: () => mainWindow.webContents.send('switch-view', 'media')
                },
                {
                    label: 'Storyboard',
                    accelerator: 'CmdOrCtrl+3',
                    click: () => mainWindow.webContents.send('switch-view', 'storyboard')
                },
                {
                    label: 'Preview',
                    accelerator: 'CmdOrCtrl+4',
                    click: () => mainWindow.webContents.send('switch-view', 'preview')
                },
                {
                    label: 'Settings',
                    accelerator: 'CmdOrCtrl+,',
                    click: () => mainWindow.webContents.send('switch-view', 'settings')
                },
                { type: 'separator' },
                { label: 'Toggle DevTools', accelerator: 'F12', role: 'toggleDevTools' },
                { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Documentation',
                    click: () => shell.openExternal('https://github.com/your-repo/html-book-builder')
                },
                {
                    label: 'About',
                    click: () => showAboutDialog()
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// Show about dialog
function showAboutDialog() {
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'About HTML Book Builder',
        message: 'HTML Book Builder',
        detail: 'Version 1.0.0\n\nCreate interactive HTML books without coding.\nInspired by Seeing Theory.'
    });
}

// Open project dialog
async function openProject() {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'Open Project Folder'
    });

    if (!result.canceled && result.filePaths.length > 0) {
        const projectPath = result.filePaths[0];
        const projectFile = path.join(projectPath, 'project.json');

        if (fs.existsSync(projectFile)) {
            currentProjectPath = projectPath;
            const projectData = JSON.parse(fs.readFileSync(projectFile, 'utf8'));
            mainWindow.webContents.send('project-opened', { path: projectPath, data: projectData });
        } else {
            dialog.showErrorBox('Error', 'No project.json found in selected folder');
        }
    }
}

// Save project as dialog
async function saveProjectAs() {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'createDirectory'],
        title: 'Save Project To Folder'
    });

    if (!result.canceled && result.filePaths.length > 0) {
        currentProjectPath = result.filePaths[0];
        mainWindow.webContents.send('save-project-to', currentProjectPath);
    }
}

// IPC Handlers
ipcMain.handle('get-app-path', () => {
    return app.getAppPath();
});

ipcMain.handle('get-bundled-libs-path', () => {
    return path.join(app.getAppPath(), 'bundled-libs');
});

ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'createDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('select-files', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: options.filters || []
    });
    return result.canceled ? [] : result.filePaths;
});

ipcMain.handle('select-image', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [
            { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] }
        ]
    });
    return result.canceled ? [] : result.filePaths;
});

ipcMain.handle('select-video', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'Videos', extensions: ['mp4', 'webm', 'ogg'] }
        ]
    });
    return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('select-geogebra', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'GeoGebra Files', extensions: ['ggb', 'ggt'] }
        ]
    });
    return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('read-file', async (event, filePath) => {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        return null;
    }
});

ipcMain.handle('read-file-binary', async (event, filePath) => {
    try {
        return fs.readFileSync(filePath).toString('base64');
    } catch (error) {
        return null;
    }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
    try {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    } catch (error) {
        return false;
    }
});

ipcMain.handle('write-file-binary', async (event, filePath, base64Content) => {
    try {
        const buffer = Buffer.from(base64Content, 'base64');
        fs.writeFileSync(filePath, buffer);
        return true;
    } catch (error) {
        return false;
    }
});

ipcMain.handle('copy-file', async (event, source, destination) => {
    try {
        // Ensure destination directory exists
        const destDir = path.dirname(destination);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(source, destination);
        return true;
    } catch (error) {
        console.error('Copy file error:', error);
        return false;
    }
});

ipcMain.handle('create-directory', async (event, dirPath) => {
    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        return true;
    } catch (error) {
        return false;
    }
});

ipcMain.handle('list-directory', async (event, dirPath) => {
    try {
        if (!fs.existsSync(dirPath)) {
            return [];
        }
        const items = fs.readdirSync(dirPath, { withFileTypes: true });
        return items.map(item => ({
            name: item.name,
            isDirectory: item.isDirectory(),
            path: path.join(dirPath, item.name)
        }));
    } catch (error) {
        return [];
    }
});

ipcMain.handle('file-exists', async (event, filePath) => {
    return fs.existsSync(filePath);
});

ipcMain.handle('delete-file', async (event, filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return true;
    } catch (error) {
        return false;
    }
});

ipcMain.handle('get-file-info', async (event, filePath) => {
    try {
        const stats = fs.statSync(filePath);
        return {
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            isDirectory: stats.isDirectory()
        };
    } catch (error) {
        return null;
    }
});

ipcMain.handle('show-save-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result.canceled ? null : result.filePath;
});

ipcMain.handle('show-message', async (event, options) => {
    return dialog.showMessageBox(mainWindow, options);
});

ipcMain.handle('get-current-project-path', () => {
    return currentProjectPath;
});

ipcMain.handle('set-current-project-path', (event, projectPath) => {
    currentProjectPath = projectPath;
});

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
