// Media Manager Component

class MediaManager {
    constructor() {
        this.selectedAssetId = null;
        this.currentFilter = 'all';
        this.mediaGrid = document.getElementById('mediaGrid');
        this.mediaInspectorContent = document.getElementById('mediaInspectorContent');
        this.snippetEditorModal = document.getElementById('snippetEditorModal');

        this.init();
    }

    init() {
        // Media type filter
        document.querySelectorAll('.media-type-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.media-type-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.currentFilter = item.dataset.type;
                this.renderMediaGrid();
            });
        });

        // Import asset button
        document.getElementById('importAssetBtn').addEventListener('click', () => {
            this.importAssets();
        });

        // Create snippet button
        document.getElementById('createSnippetBtn').addEventListener('click', () => {
            this.showSnippetEditor();
        });

        // Snippet editor modal
        document.getElementById('closeSnippetModal').addEventListener('click', () => {
            this.hideSnippetEditor();
        });

        // Snippet tabs
        document.querySelectorAll('.snippet-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.snippet-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.snippet-editor').forEach(e => e.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`snippet${tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1)}`).classList.add('active');
            });
        });

        // Snippet preview update
        ['snippetHtml', 'snippetCss', 'snippetJs'].forEach(id => {
            document.getElementById(id).addEventListener('input', helpers.debounce(() => {
                this.updateSnippetPreview();
            }, 500));
        });

        // Save snippet button
        document.getElementById('saveSnippetBtn').addEventListener('click', () => {
            this.saveSnippet();
        });

        // Close modal on background click
        this.snippetEditorModal.addEventListener('click', (e) => {
            if (e.target === this.snippetEditorModal) {
                this.hideSnippetEditor();
            }
        });

        // Setup drag and drop
        this.setupDragAndDrop();
    }

    /**
     * Render media grid
     */
    renderMediaGrid() {
        const assets = projectStorage.getAssetsByType(this.currentFilter);
        this.mediaGrid.innerHTML = '';

        if (assets.length === 0) {
            this.mediaGrid.innerHTML = `
                <div class="media-grid-empty">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2zM5 19V5h14l.002 14H5z"/>
                        <path d="m10 14-1-1-3 4h12l-5-7z"/>
                    </svg>
                    <p>No media assets yet</p>
                    <button class="btn btn-primary" onclick="mediaManager.importAssets()">Import Assets</button>
                </div>
            `;
            return;
        }

        assets.forEach(asset => {
            const item = this.createMediaItem(asset);
            this.mediaGrid.appendChild(item);
        });
    }

    /**
     * Create media item element
     */
    createMediaItem(asset) {
        const item = document.createElement('div');
        item.className = `media-item ${asset.id === this.selectedAssetId ? 'selected' : ''}`;
        item.dataset.assetId = asset.id;

        let preview = '';
        const assetPath = projectStorage.getAssetPath(asset);

        switch (asset.type) {
            case 'images':
            case 'svgs':
                preview = `<img src="file://${assetPath}" alt="${asset.name}">`;
                break;
            case 'videos':
                preview = `
                    <div class="video-thumbnail">
                        <video src="file://${assetPath}" muted></video>
                    </div>
                `;
                break;
            case 'geogebra':
                preview = `
                    <div class="geogebra-preview">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/>
                            <path d="M8 16h8v2H8zm0-4h8v2H8zm0-4h8v2H8z"/>
                        </svg>
                    </div>
                `;
                break;
            case 'html-snippets':
            case 'scripts':
                preview = `
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8.293 6.293 2.586 12l5.707 5.707 1.414-1.414L5.414 12l4.293-4.293zm7.414 11.414L21.414 12l-5.707-5.707-1.414 1.414L18.586 12l-4.293 4.293z"/>
                    </svg>
                `;
                break;
            default:
                preview = `
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2z"/>
                    </svg>
                `;
        }

        const typeIcon = this.getTypeIcon(asset.type);

        item.innerHTML = `
            <div class="media-item-preview">
                ${preview}
                <div class="media-type-icon">${typeIcon}</div>
            </div>
            <div class="media-item-info">
                <div class="media-item-name">${helpers.escapeHtml(asset.name)}</div>
                <div class="media-item-meta">${helpers.formatFileSize(asset.size)}</div>
            </div>
        `;

        item.addEventListener('click', () => {
            this.selectAsset(asset.id);
        });

        item.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e, asset);
        });

        return item;
    }

    /**
     * Get type icon SVG
     */
    getTypeIcon(type) {
        const icons = {
            images: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="m10 14-1-1-3 4h12l-5-7z"/></svg>',
            svgs: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2z"/></svg>',
            videos: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
            geogebra: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2z"/></svg>',
            'html-snippets': '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8.293 6.293 2.586 12l5.707 5.707 1.414-1.414L5.414 12l4.293-4.293z"/></svg>',
            scripts: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/></svg>'
        };
        return icons[type] || icons.scripts;
    }

    /**
     * Select an asset
     */
    selectAsset(assetId) {
        this.selectedAssetId = assetId;

        // Update UI
        document.querySelectorAll('.media-item').forEach(el => {
            el.classList.toggle('selected', el.dataset.assetId === assetId);
        });

        // Update inspector
        this.renderInspector();
    }

    /**
     * Render inspector panel
     */
    renderInspector() {
        if (!this.selectedAssetId) {
            this.mediaInspectorContent.innerHTML = `
                <p class="inspector-placeholder">Select an asset to view details</p>
            `;
            return;
        }

        const asset = projectStorage.getAsset(this.selectedAssetId);
        if (!asset) return;

        const assetPath = projectStorage.getAssetPath(asset);
        let preview = '';

        switch (asset.type) {
            case 'images':
            case 'svgs':
                preview = `<img src="file://${assetPath}" alt="${asset.name}">`;
                break;
            case 'videos':
                preview = `<video src="file://${assetPath}" controls></video>`;
                break;
            default:
                preview = `
                    <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                        <path d="M19 3H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2z"/>
                    </svg>
                `;
        }

        this.mediaInspectorContent.innerHTML = `
            <div class="media-preview-large">
                ${preview}
            </div>

            <div class="media-details">
                <div class="media-details-row">
                    <span>Name</span>
                    <span>${helpers.escapeHtml(asset.name)}</span>
                </div>
                <div class="media-details-row">
                    <span>Type</span>
                    <span style="text-transform: capitalize;">${asset.type}</span>
                </div>
                <div class="media-details-row">
                    <span>Size</span>
                    <span>${helpers.formatFileSize(asset.size)}</span>
                </div>
                <div class="media-details-row">
                    <span>Added</span>
                    <span>${helpers.formatDate(asset.added)}</span>
                </div>
            </div>

            <div class="media-actions">
                ${asset.type === 'html-snippets' ? `
                    <button class="btn btn-secondary" id="editSnippetBtn">Edit Snippet</button>
                ` : ''}
                <button class="btn btn-secondary" id="renameAssetBtn">Rename</button>
                <button class="btn btn-secondary" style="color: var(--error-color);" id="deleteAssetBtn">Delete</button>
            </div>
        `;

        // Event listeners
        if (asset.type === 'html-snippets') {
            document.getElementById('editSnippetBtn').addEventListener('click', () => {
                this.editSnippet(asset);
            });
        }

        document.getElementById('renameAssetBtn').addEventListener('click', () => {
            this.renameAsset(asset);
        });

        document.getElementById('deleteAssetBtn').addEventListener('click', () => {
            this.deleteAsset(asset.id);
        });
    }

    /**
     * Import assets
     */
    async importAssets() {
        const files = await window.electronAPI.selectFiles({
            filters: [
                { name: 'All Supported', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'mp4', 'webm', 'ogg', 'ggb', 'ggt', 'json', 'js', 'html', 'css'] },
                { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] },
                { name: 'SVG', extensions: ['svg'] },
                { name: 'Videos', extensions: ['mp4', 'webm', 'ogg'] },
                { name: 'GeoGebra', extensions: ['ggb', 'ggt'] },
                { name: 'Scripts', extensions: ['js'] }
            ]
        });

        if (files.length === 0) return;

        for (const filePath of files) {
            await projectStorage.addAsset(filePath);
        }

        this.renderMediaGrid();
        helpers.showToast(`${files.length} asset(s) imported`, 'success');
    }

    /**
     * Show snippet editor
     */
    showSnippetEditor(existingSnippet = null) {
        document.getElementById('snippetHtml').value = existingSnippet?.html || '';
        document.getElementById('snippetCss').value = existingSnippet?.css || '';
        document.getElementById('snippetJs').value = existingSnippet?.js || '';
        document.getElementById('snippetName').value = existingSnippet?.name || '';

        this.currentEditingSnippet = existingSnippet;
        this.snippetEditorModal.classList.add('active');
        this.updateSnippetPreview();
    }

    /**
     * Hide snippet editor
     */
    hideSnippetEditor() {
        this.snippetEditorModal.classList.remove('active');
        this.currentEditingSnippet = null;
    }

    /**
     * Update snippet preview
     */
    updateSnippetPreview() {
        const html = document.getElementById('snippetHtml').value;
        const css = document.getElementById('snippetCss').value;
        const js = document.getElementById('snippetJs').value;

        const previewFrame = document.getElementById('snippetPreviewFrame');
        const previewDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;

        previewDoc.open();
        previewDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { margin: 0; padding: 16px; font-family: sans-serif; }
                    ${css}
                </style>
            </head>
            <body>
                ${html}
                <script>${js}<\/script>
            </body>
            </html>
        `);
        previewDoc.close();
    }

    /**
     * Save snippet as asset
     */
    async saveSnippet() {
        const name = document.getElementById('snippetName').value.trim();
        if (!name) {
            helpers.showToast('Please enter a snippet name', 'warning');
            return;
        }

        const html = document.getElementById('snippetHtml').value;
        const css = document.getElementById('snippetCss').value;
        const js = document.getElementById('snippetJs').value;

        const snippetContent = JSON.stringify({ html, css, js }, null, 2);
        const fileName = `${helpers.slugify(name)}.snippet.json`;

        // Save to project
        if (projectStorage.projectPath) {
            const filePath = `${projectStorage.projectPath}/assets/html-snippets/${fileName}`;
            await window.electronAPI.writeFile(filePath, snippetContent);

            // Add as asset
            const asset = {
                id: helpers.generateId(),
                name: fileName,
                type: 'html-snippets',
                originalPath: filePath,
                relativePath: `assets/html-snippets/${fileName}`,
                size: new Blob([snippetContent]).size,
                added: new Date().toISOString(),
                snippetData: { html, css, js }
            };

            projectStorage.currentProject.assets.push(asset);
            projectStorage.markModified();
        }

        this.hideSnippetEditor();
        this.renderMediaGrid();
        helpers.showToast('Snippet saved', 'success');
    }

    /**
     * Edit existing snippet
     */
    async editSnippet(asset) {
        let snippetData = asset.snippetData;

        if (!snippetData) {
            const content = await window.electronAPI.readFile(projectStorage.getAssetPath(asset));
            if (content) {
                try {
                    snippetData = JSON.parse(content);
                } catch (e) {
                    helpers.showToast('Failed to load snippet', 'error');
                    return;
                }
            }
        }

        this.showSnippetEditor({
            ...snippetData,
            name: asset.name.replace('.snippet.json', ''),
            assetId: asset.id
        });
    }

    /**
     * Rename asset
     */
    async renameAsset(asset) {
        const newName = prompt('Enter new name:', asset.name);
        if (!newName || newName === asset.name) return;

        // Update asset
        asset.name = helpers.sanitizeFilename(newName);
        projectStorage.markModified();

        this.renderMediaGrid();
        this.renderInspector();
        helpers.showToast('Asset renamed', 'success');
    }

    /**
     * Delete asset
     */
    async deleteAsset(assetId) {
        const confirmed = confirm('Are you sure you want to delete this asset?');
        if (!confirmed) return;

        await projectStorage.removeAsset(assetId);

        if (this.selectedAssetId === assetId) {
            this.selectedAssetId = null;
            this.renderInspector();
        }

        this.renderMediaGrid();
        helpers.showToast('Asset deleted', 'success');
    }

    /**
     * Show context menu
     */
    showContextMenu(e, asset) {
        // Remove existing context menu
        document.querySelectorAll('.context-menu').forEach(m => m.remove());

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.left = `${e.clientX}px`;
        menu.style.top = `${e.clientY}px`;

        menu.innerHTML = `
            <div class="context-menu-item" data-action="rename">Rename</div>
            <div class="context-menu-item" data-action="duplicate">Duplicate</div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item danger" data-action="delete">Delete</div>
        `;

        document.body.appendChild(menu);

        menu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'rename') this.renameAsset(asset);
            if (action === 'duplicate') this.duplicateAsset(asset);
            if (action === 'delete') this.deleteAsset(asset.id);
            menu.remove();
        });

        // Close on click outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu() {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            });
        }, 0);
    }

    /**
     * Duplicate asset
     */
    async duplicateAsset(asset) {
        const newAsset = helpers.deepClone(asset);
        newAsset.id = helpers.generateId();
        newAsset.name = `${asset.name.replace(/\.[^.]+$/, '')}_copy${helpers.getFileExtension(asset.name) ? '.' + helpers.getFileExtension(asset.name) : ''}`;
        newAsset.added = new Date().toISOString();

        projectStorage.currentProject.assets.push(newAsset);
        projectStorage.markModified();

        this.renderMediaGrid();
        helpers.showToast('Asset duplicated', 'success');
    }

    /**
     * Setup drag and drop for file import
     */
    setupDragAndDrop() {
        const mediaContent = document.querySelector('.media-content');

        ['dragenter', 'dragover'].forEach(eventName => {
            mediaContent.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                mediaContent.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            mediaContent.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                mediaContent.classList.remove('drag-over');
            });
        });

        mediaContent.addEventListener('drop', async (e) => {
            const files = Array.from(e.dataTransfer.files);
            if (files.length === 0) return;

            for (const file of files) {
                await projectStorage.addAsset(file.path);
            }

            this.renderMediaGrid();
            helpers.showToast(`${files.length} file(s) imported`, 'success');
        });
    }

    /**
     * Load project into media manager
     */
    loadProject(project) {
        this.selectedAssetId = null;
        this.renderMediaGrid();
        this.renderInspector();
    }
}

// Create global instance
window.mediaManager = new MediaManager();
