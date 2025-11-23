// Main Application

class App {
    constructor() {
        this.currentView = 'editor';
        this.init();
    }

    async init() {
        // Create new project on startup
        projectStorage.createNewProject();

        // Initialize views
        this.loadProject(projectStorage.currentProject);

        // Setup navigation
        this.setupNavigation();

        // Setup menu handlers
        this.setupMenuHandlers();

        // Setup settings handlers
        this.setupSettingsHandlers();

        // Setup auto-save indicator
        this.setupAutoSaveIndicator();

        // Update project name display
        this.updateProjectName();

        console.log('HTML Book Builder initialized');
    }

    /**
     * Setup view navigation
     */
    setupNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.switchView(view);
            });
        });
    }

    /**
     * Switch between views
     */
    switchView(viewName) {
        this.currentView = viewName;

        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.toggle('active', view.id === `${viewName}View`);
        });

        // Refresh view-specific content
        switch (viewName) {
            case 'editor':
                blockEditor.renderBlocks();
                break;
            case 'media':
                mediaManager.renderMediaGrid();
                break;
            case 'storyboard':
                storyboard.render();
                break;
            case 'preview':
                preview.render();
                break;
            case 'settings':
                this.loadSettingsToUI();
                break;
        }
    }

    /**
     * Setup menu event handlers
     */
    setupMenuHandlers() {
        // New project
        window.electronAPI.onMenuNewProject(() => {
            this.newProject();
        });

        // Save project
        window.electronAPI.onMenuSaveProject(() => {
            this.saveProject();
        });

        // Project opened
        window.electronAPI.onProjectOpened((data) => {
            this.openProject(data);
        });

        // Save project to path
        window.electronAPI.onSaveProjectTo((path) => {
            this.saveProjectToPath(path);
        });

        // Switch view from menu
        window.electronAPI.onSwitchView((view) => {
            this.switchView(view);
        });

        // Export
        window.electronAPI.onMenuExport(() => {
            document.getElementById('exportBtn').click();
        });
    }

    /**
     * Setup settings panel handlers
     */
    setupSettingsHandlers() {
        // Project settings
        document.getElementById('bookTitle').addEventListener('input', helpers.debounce((e) => {
            projectStorage.updateMeta({ title: e.target.value });
            this.updateProjectName();
        }, 300));

        document.getElementById('bookAuthor').addEventListener('input', helpers.debounce((e) => {
            projectStorage.updateMeta({ author: e.target.value });
        }, 300));

        document.getElementById('bookDescription').addEventListener('input', helpers.debounce((e) => {
            projectStorage.updateMeta({ description: e.target.value });
        }, 300));

        // Theme presets
        document.querySelectorAll('.theme-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.theme-preset').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                projectStorage.updateSettings({ theme: btn.dataset.theme });
            });
        });

        // Typography
        ['headingFont', 'bodyFont', 'codeFont'].forEach(id => {
            document.getElementById(id).addEventListener('change', (e) => {
                projectStorage.updateSettings({
                    typography: { [id]: e.target.value }
                });
            });
        });

        // Font size
        document.getElementById('baseFontSize').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('fontSizeValue').textContent = `${value}px`;
            projectStorage.updateSettings({
                typography: { baseFontSize: value }
            });
        });

        // Colors
        ['primaryColor', 'accentColor', 'bgColor', 'textColor'].forEach(id => {
            document.getElementById(id).addEventListener('input', (e) => {
                const key = id.replace('Color', '').replace('bg', 'background');
                projectStorage.updateSettings({
                    colors: { [key]: e.target.value }
                });
            });
        });

        // Layout
        document.getElementById('contentWidth').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('contentWidthValue').textContent = `${value}%`;
            projectStorage.updateSettings({
                layout: { contentWidth: value }
            });
        });

        document.getElementById('mediaWidth').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('mediaWidthValue').textContent = `${value}%`;
            projectStorage.updateSettings({
                layout: { mediaWidth: value }
            });
        });

        // Export settings
        document.querySelectorAll('input[name="exportFormat"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                projectStorage.updateSettings({
                    export: { format: e.target.value }
                });
            });
        });

        ['includeKatex', 'includeHighlight', 'includePrintStyles'].forEach(id => {
            document.getElementById(id).addEventListener('change', (e) => {
                projectStorage.updateSettings({
                    export: { [id]: e.target.checked }
                });
            });
        });

        // Custom CSS
        document.getElementById('customCss').addEventListener('input', helpers.debounce((e) => {
            projectStorage.updateSettings({ customCss: e.target.value });
        }, 500));
    }

    /**
     * Load settings to UI
     */
    loadSettingsToUI() {
        const { meta, settings } = projectStorage.currentProject;

        // Meta
        document.getElementById('bookTitle').value = meta.title || '';
        document.getElementById('bookAuthor').value = meta.author || '';
        document.getElementById('bookDescription').value = meta.description || '';

        // Theme
        document.querySelectorAll('.theme-preset').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === settings.theme);
        });

        // Typography
        document.getElementById('headingFont').value = settings.typography.headingFont;
        document.getElementById('bodyFont').value = settings.typography.bodyFont;
        document.getElementById('codeFont').value = settings.typography.codeFont;
        document.getElementById('baseFontSize').value = settings.typography.baseFontSize;
        document.getElementById('fontSizeValue').textContent = `${settings.typography.baseFontSize}px`;

        // Colors
        document.getElementById('primaryColor').value = settings.colors.primary;
        document.getElementById('accentColor').value = settings.colors.accent;
        document.getElementById('bgColor').value = settings.colors.background;
        document.getElementById('textColor').value = settings.colors.text;

        // Layout
        document.getElementById('contentWidth').value = settings.layout.contentWidth;
        document.getElementById('contentWidthValue').textContent = `${settings.layout.contentWidth}%`;
        document.getElementById('mediaWidth').value = settings.layout.mediaWidth;
        document.getElementById('mediaWidthValue').textContent = `${settings.layout.mediaWidth}%`;

        // Export
        document.querySelector(`input[name="exportFormat"][value="${settings.export.format}"]`).checked = true;
        document.getElementById('includeKatex').checked = settings.export.includeKatex;
        document.getElementById('includeHighlight').checked = settings.export.includeHighlight;
        document.getElementById('includePrintStyles').checked = settings.export.includePrintStyles;

        // Custom CSS
        document.getElementById('customCss').value = settings.customCss || '';
    }

    /**
     * Setup auto-save indicator
     */
    setupAutoSaveIndicator() {
        document.addEventListener('projectModified', () => {
            const projectName = document.getElementById('projectName');
            if (!projectName.textContent.endsWith('*')) {
                projectName.textContent += ' *';
            }
        });
    }

    /**
     * Update project name display
     */
    updateProjectName() {
        const projectName = document.getElementById('projectName');
        projectName.textContent = projectStorage.currentProject.meta.title || 'Untitled Project';
    }

    /**
     * Create new project
     */
    async newProject() {
        if (projectStorage.hasUnsavedChanges) {
            const result = await window.electronAPI.showMessage({
                type: 'question',
                buttons: ['Save', "Don't Save", 'Cancel'],
                defaultId: 0,
                title: 'Unsaved Changes',
                message: 'Do you want to save changes to your project?'
            });

            if (result.response === 0) {
                await this.saveProject();
            } else if (result.response === 2) {
                return; // Cancel
            }
        }

        projectStorage.createNewProject();
        this.loadProject(projectStorage.currentProject);
        this.updateProjectName();
        helpers.showToast('New project created', 'success');
    }

    /**
     * Save project
     */
    async saveProject() {
        if (!projectStorage.projectPath) {
            const path = await window.electronAPI.selectFolder();
            if (!path) return;
            projectStorage.projectPath = path;
        }

        try {
            await projectStorage.saveProject();
            this.updateProjectName();
            helpers.showToast('Project saved', 'success');
        } catch (error) {
            helpers.showToast('Failed to save project', 'error');
            console.error('Save error:', error);
        }
    }

    /**
     * Save project to specific path
     */
    async saveProjectToPath(path) {
        try {
            await projectStorage.saveProject(path);
            this.updateProjectName();
            helpers.showToast('Project saved', 'success');
        } catch (error) {
            helpers.showToast('Failed to save project', 'error');
            console.error('Save error:', error);
        }
    }

    /**
     * Open existing project
     */
    openProject(data) {
        projectStorage.currentProject = data.data;
        projectStorage.projectPath = data.path;
        projectStorage.hasUnsavedChanges = false;

        this.loadProject(projectStorage.currentProject);
        this.updateProjectName();
        helpers.showToast('Project opened', 'success');
    }

    /**
     * Load project into all views
     */
    loadProject(project) {
        blockEditor.loadProject(project);
        mediaManager.loadProject(project);
        storyboard.loadProject(project);
        preview.loadProject(project);
        this.loadSettingsToUI();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
