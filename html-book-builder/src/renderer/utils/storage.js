// Project storage and data management

class ProjectStorage {
    constructor() {
        this.currentProject = null;
        this.projectPath = null;
        this.hasUnsavedChanges = false;
    }

    /**
     * Create a new project
     */
    createNewProject() {
        this.currentProject = {
            version: '1.0.0',
            meta: {
                title: 'Untitled Book',
                author: '',
                description: '',
                created: new Date().toISOString(),
                modified: new Date().toISOString()
            },
            settings: {
                theme: 'light',
                typography: {
                    headingFont: 'Inter',
                    bodyFont: 'Inter',
                    codeFont: 'Fira Code',
                    baseFontSize: 18
                },
                colors: {
                    primary: '#2563eb',
                    accent: '#7c3aed',
                    background: '#ffffff',
                    text: '#1f2937'
                },
                layout: {
                    contentWidth: 45,
                    mediaWidth: 45
                },
                export: {
                    format: 'single',
                    includeKatex: true,
                    includeHighlight: true,
                    includePrintStyles: true
                },
                customCss: ''
            },
            chapters: [
                {
                    id: helpers.generateId(),
                    title: 'Introduction',
                    blocks: []
                }
            ],
            assets: []
        };
        this.projectPath = null;
        this.hasUnsavedChanges = false;
        return this.currentProject;
    }

    /**
     * Load project from path
     */
    async loadProject(projectPath) {
        try {
            const projectFile = `${projectPath}/project.json`;
            const content = await window.electronAPI.readFile(projectFile);
            if (content) {
                this.currentProject = JSON.parse(content);
                this.projectPath = projectPath;
                this.hasUnsavedChanges = false;
                return this.currentProject;
            }
        } catch (error) {
            console.error('Error loading project:', error);
        }
        return null;
    }

    /**
     * Save project to path
     */
    async saveProject(projectPath = null) {
        if (projectPath) {
            this.projectPath = projectPath;
        }

        if (!this.projectPath) {
            throw new Error('No project path specified');
        }

        // Update modified date
        this.currentProject.meta.modified = new Date().toISOString();

        // Create directory structure
        await window.electronAPI.createDirectory(this.projectPath);
        await window.electronAPI.createDirectory(`${this.projectPath}/assets`);
        await window.electronAPI.createDirectory(`${this.projectPath}/assets/images`);
        await window.electronAPI.createDirectory(`${this.projectPath}/assets/svgs`);
        await window.electronAPI.createDirectory(`${this.projectPath}/assets/videos`);
        await window.electronAPI.createDirectory(`${this.projectPath}/assets/scripts`);
        await window.electronAPI.createDirectory(`${this.projectPath}/assets/geogebra`);
        await window.electronAPI.createDirectory(`${this.projectPath}/assets/html-snippets`);
        await window.electronAPI.createDirectory(`${this.projectPath}/chapters`);
        await window.electronAPI.createDirectory(`${this.projectPath}/export`);

        // Save project.json
        const projectContent = JSON.stringify(this.currentProject, null, 2);
        await window.electronAPI.writeFile(`${this.projectPath}/project.json`, projectContent);

        // Save chapters as individual files
        for (const chapter of this.currentProject.chapters) {
            const chapterContent = JSON.stringify(chapter, null, 2);
            const chapterFile = `${this.projectPath}/chapters/${helpers.slugify(chapter.title) || chapter.id}.json`;
            await window.electronAPI.writeFile(chapterFile, chapterContent);
        }

        this.hasUnsavedChanges = false;
        await window.electronAPI.setCurrentProjectPath(this.projectPath);
        return true;
    }

    /**
     * Add chapter
     */
    addChapter(title = 'New Chapter') {
        const chapter = {
            id: helpers.generateId(),
            title: title,
            blocks: []
        };
        this.currentProject.chapters.push(chapter);
        this.markModified();
        return chapter;
    }

    /**
     * Remove chapter
     */
    removeChapter(chapterId) {
        const index = this.currentProject.chapters.findIndex(c => c.id === chapterId);
        if (index > -1) {
            this.currentProject.chapters.splice(index, 1);
            this.markModified();
            return true;
        }
        return false;
    }

    /**
     * Update chapter
     */
    updateChapter(chapterId, updates) {
        const chapter = this.currentProject.chapters.find(c => c.id === chapterId);
        if (chapter) {
            Object.assign(chapter, updates);
            this.markModified();
            return chapter;
        }
        return null;
    }

    /**
     * Get chapter by ID
     */
    getChapter(chapterId) {
        return this.currentProject.chapters.find(c => c.id === chapterId);
    }

    /**
     * Add block to chapter
     */
    addBlock(chapterId, blockType, position = -1) {
        const chapter = this.getChapter(chapterId);
        if (!chapter) return null;

        const block = this.createBlock(blockType);

        if (position === -1 || position >= chapter.blocks.length) {
            chapter.blocks.push(block);
        } else {
            chapter.blocks.splice(position, 0, block);
        }

        this.markModified();
        return block;
    }

    /**
     * Create a new block of specified type
     */
    createBlock(type) {
        const baseBlock = {
            id: helpers.generateId(),
            type: type,
            trigger: {
                type: 'onEnter',
                enabled: false
            },
            linkedMedia: []
        };

        switch (type) {
            case 'heading':
                return { ...baseBlock, level: 1, content: 'Heading' };
            case 'paragraph':
                return { ...baseBlock, content: '' };
            case 'list':
                return { ...baseBlock, ordered: false, items: ['Item 1'] };
            case 'quote':
                return { ...baseBlock, content: '', citation: '' };
            case 'code':
                return { ...baseBlock, language: 'javascript', content: '' };
            case 'equation':
                return { ...baseBlock, latex: '' };
            case 'divider':
                return { ...baseBlock };
            case 'collapsible':
                return { ...baseBlock, title: 'Collapsible Section', content: '' };
            default:
                return baseBlock;
        }
    }

    /**
     * Update block
     */
    updateBlock(chapterId, blockId, updates) {
        const chapter = this.getChapter(chapterId);
        if (!chapter) return null;

        const block = chapter.blocks.find(b => b.id === blockId);
        if (block) {
            Object.assign(block, updates);
            this.markModified();
            return block;
        }
        return null;
    }

    /**
     * Remove block
     */
    removeBlock(chapterId, blockId) {
        const chapter = this.getChapter(chapterId);
        if (!chapter) return false;

        const index = chapter.blocks.findIndex(b => b.id === blockId);
        if (index > -1) {
            chapter.blocks.splice(index, 1);
            this.markModified();
            return true;
        }
        return false;
    }

    /**
     * Move block
     */
    moveBlock(chapterId, blockId, newPosition) {
        const chapter = this.getChapter(chapterId);
        if (!chapter) return false;

        const currentIndex = chapter.blocks.findIndex(b => b.id === blockId);
        if (currentIndex === -1) return false;

        const [block] = chapter.blocks.splice(currentIndex, 1);
        chapter.blocks.splice(newPosition, 0, block);
        this.markModified();
        return true;
    }

    /**
     * Add asset
     */
    async addAsset(filePath, assetType = null) {
        const fileName = filePath.split(/[/\\]/).pop();
        const fileType = assetType || helpers.getFileType(fileName);
        const fileInfo = await window.electronAPI.getFileInfo(filePath);

        const asset = {
            id: helpers.generateId(),
            name: fileName,
            type: fileType,
            originalPath: filePath,
            relativePath: `assets/${fileType}s/${fileName}`,
            size: fileInfo ? fileInfo.size : 0,
            added: new Date().toISOString()
        };

        // Copy file to project if project has a path
        if (this.projectPath) {
            const destPath = `${this.projectPath}/${asset.relativePath}`;
            await window.electronAPI.copyFile(filePath, destPath);
        }

        this.currentProject.assets.push(asset);
        this.markModified();
        return asset;
    }

    /**
     * Remove asset
     */
    async removeAsset(assetId) {
        const index = this.currentProject.assets.findIndex(a => a.id === assetId);
        if (index > -1) {
            const asset = this.currentProject.assets[index];

            // Delete file if project is saved
            if (this.projectPath) {
                const filePath = `${this.projectPath}/${asset.relativePath}`;
                await window.electronAPI.deleteFile(filePath);
            }

            this.currentProject.assets.splice(index, 1);
            this.markModified();
            return true;
        }
        return false;
    }

    /**
     * Get asset by ID
     */
    getAsset(assetId) {
        return this.currentProject.assets.find(a => a.id === assetId);
    }

    /**
     * Get assets by type
     */
    getAssetsByType(type) {
        if (type === 'all') return this.currentProject.assets;
        return this.currentProject.assets.filter(a => a.type === type);
    }

    /**
     * Link media to block
     */
    linkMediaToBlock(chapterId, blockId, assetId, trigger = { type: 'onEnter' }) {
        const chapter = this.getChapter(chapterId);
        if (!chapter) return false;

        const block = chapter.blocks.find(b => b.id === blockId);
        if (!block) return false;

        // Check if already linked
        if (!block.linkedMedia.includes(assetId)) {
            block.linkedMedia.push(assetId);
            block.trigger = trigger;
            this.markModified();
        }
        return true;
    }

    /**
     * Unlink media from block
     */
    unlinkMediaFromBlock(chapterId, blockId, assetId) {
        const chapter = this.getChapter(chapterId);
        if (!chapter) return false;

        const block = chapter.blocks.find(b => b.id === blockId);
        if (!block) return false;

        const index = block.linkedMedia.indexOf(assetId);
        if (index > -1) {
            block.linkedMedia.splice(index, 1);
            this.markModified();
            return true;
        }
        return false;
    }

    /**
     * Update settings
     */
    updateSettings(updates) {
        this.currentProject.settings = helpers.deepMerge(this.currentProject.settings, updates);
        this.markModified();
        return this.currentProject.settings;
    }

    /**
     * Update meta
     */
    updateMeta(updates) {
        Object.assign(this.currentProject.meta, updates);
        this.markModified();
        return this.currentProject.meta;
    }

    /**
     * Mark project as modified
     */
    markModified() {
        this.hasUnsavedChanges = true;
        document.dispatchEvent(new CustomEvent('projectModified'));
    }

    /**
     * Get full asset path
     */
    getAssetPath(asset) {
        if (this.projectPath) {
            return `${this.projectPath}/${asset.relativePath}`;
        }
        return asset.originalPath;
    }

    /**
     * Export project data for HTML generation
     */
    getExportData() {
        return {
            meta: this.currentProject.meta,
            settings: this.currentProject.settings,
            chapters: this.currentProject.chapters,
            assets: this.currentProject.assets
        };
    }
}

// Create global instance
window.projectStorage = new ProjectStorage();
