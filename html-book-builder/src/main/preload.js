const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // App paths
    getAppPath: () => ipcRenderer.invoke('get-app-path'),
    getBundledLibsPath: () => ipcRenderer.invoke('bundled-libs-path'),

    // Dialog methods
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    selectFiles: (options) => ipcRenderer.invoke('select-files', options),
    selectImage: () => ipcRenderer.invoke('select-image'),
    selectVideo: () => ipcRenderer.invoke('select-video'),
    selectGeogebra: () => ipcRenderer.invoke('select-geogebra'),
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    showMessage: (options) => ipcRenderer.invoke('show-message', options),

    // File operations
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    readFileBinary: (filePath) => ipcRenderer.invoke('read-file-binary', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
    writeFileBinary: (filePath, base64Content) => ipcRenderer.invoke('write-file-binary', filePath, base64Content),
    copyFile: (source, destination) => ipcRenderer.invoke('copy-file', source, destination),
    createDirectory: (dirPath) => ipcRenderer.invoke('create-directory', dirPath),
    listDirectory: (dirPath) => ipcRenderer.invoke('list-directory', dirPath),
    fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath),
    deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
    getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),

    // Project management
    getCurrentProjectPath: () => ipcRenderer.invoke('get-current-project-path'),
    setCurrentProjectPath: (path) => ipcRenderer.invoke('set-current-project-path', path),

    // Menu events
    onMenuNewProject: (callback) => ipcRenderer.on('menu-new-project', callback),
    onMenuSaveProject: (callback) => ipcRenderer.on('menu-save-project', callback),
    onMenuExport: (callback) => ipcRenderer.on('menu-export', callback),
    onProjectOpened: (callback) => ipcRenderer.on('project-opened', (event, data) => callback(data)),
    onSaveProjectTo: (callback) => ipcRenderer.on('save-project-to', (event, path) => callback(path)),
    onSwitchView: (callback) => ipcRenderer.on('switch-view', (event, view) => callback(view)),

    // Remove listeners
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
