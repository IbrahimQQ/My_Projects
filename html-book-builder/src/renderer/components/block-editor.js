// Block Editor Component

class BlockEditor {
    constructor() {
        this.currentChapterId = null;
        this.selectedBlockId = null;
        this.blocksContainer = document.getElementById('blocksContainer');
        this.chapterList = document.getElementById('chapterList');
        this.chapterTitleInput = document.getElementById('chapterTitleInput');
        this.inspectorContent = document.getElementById('inspectorContent');
        this.blockTypeModal = document.getElementById('blockTypeModal');
        this.chapterDropdown = document.getElementById('chapterDropdown');
        this.addChapterBtnToolbar = document.getElementById('addChapterBtnToolbar');

        this.init();
    }

    init() {
        // Chapter dropdown
        this.chapterDropdown.addEventListener('change', (e) => {
            if (e.target.value) {
                this.selectChapter(e.target.value);
            }
        });

        // Add chapter button (toolbar)
        this.addChapterBtnToolbar.addEventListener('click', () => {
            const chapter = projectStorage.addChapter();
            this.populateChapterDropdown();
            this.selectChapter(chapter.id);
        });

        // Chapter title change
        this.chapterTitleInput.addEventListener('input', helpers.debounce(() => {
            if (this.currentChapterId) {
                projectStorage.updateChapter(this.currentChapterId, {
                    title: this.chapterTitleInput.value
                });
                this.populateChapterDropdown();
            }
        }, 300));

        // Add block button
        document.getElementById('addBlockBtn').addEventListener('click', () => {
            this.showBlockTypeModal();
        });

        // Block type modal
        document.getElementById('closeBlockModal').addEventListener('click', () => {
            this.hideBlockTypeModal();
        });

        document.querySelectorAll('.block-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                this.addBlock(type);
                this.hideBlockTypeModal();
            });
        });

        // Close modal on background click
        this.blockTypeModal.addEventListener('click', (e) => {
            if (e.target === this.blockTypeModal) {
                this.hideBlockTypeModal();
            }
        });

        // Setup drag and drop
        this.setupDragAndDrop();
    }

    /**
     * Populate chapter dropdown
     */
    populateChapterDropdown() {
        const chapters = projectStorage.currentProject.chapters;
        this.chapterDropdown.innerHTML = '<option value="">Select Chapter...</option>';

        chapters.forEach((chapter, index) => {
            const option = document.createElement('option');
            option.value = chapter.id;
            option.textContent = `${index + 1}. ${chapter.title}`;
            if (chapter.id === this.currentChapterId) {
                option.selected = true;
            }
            this.chapterDropdown.appendChild(option);
        });
    }

    /**
     * Render chapter list in sidebar (legacy - kept for compatibility)
     */
    renderChapterList() {
        // Now delegates to dropdown
        this.populateChapterDropdown();
    }

    /**
     * Select a chapter
     */
    selectChapter(chapterId) {
        this.currentChapterId = chapterId;
        const chapter = projectStorage.getChapter(chapterId);

        if (chapter) {
            this.chapterTitleInput.value = chapter.title;
            this.renderChapterList();
            this.renderBlocks();
        }
    }

    /**
     * Delete a chapter
     */
    deleteChapter(chapterId) {
        if (projectStorage.currentProject.chapters.length <= 1) {
            helpers.showToast('Cannot delete the last chapter', 'warning');
            return;
        }

        projectStorage.removeChapter(chapterId);

        if (this.currentChapterId === chapterId) {
            const firstChapter = projectStorage.currentProject.chapters[0];
            if (firstChapter) {
                this.selectChapter(firstChapter.id);
            }
        } else {
            this.renderChapterList();
        }

        helpers.showToast('Chapter deleted', 'success');
    }

    /**
     * Render blocks for current chapter
     */
    renderBlocks() {
        const chapter = projectStorage.getChapter(this.currentChapterId);
        if (!chapter) return;

        this.blocksContainer.innerHTML = '';

        if (chapter.blocks.length === 0) {
            this.blocksContainer.innerHTML = `
                <div class="blocks-empty">
                    <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor">
                        <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/>
                    </svg>
                    <p>No content blocks yet</p>
                    <button class="btn btn-primary" id="emptyAddBlockBtn">Add Block</button>
                </div>
            `;
            document.getElementById('emptyAddBlockBtn').addEventListener('click', () => {
                this.showBlockTypeModal();
            });
            return;
        }

        chapter.blocks.forEach((block, index) => {
            const blockElement = this.createBlockElement(block, index);
            this.blocksContainer.appendChild(blockElement);
        });
    }

    /**
     * Create block element
     */
    createBlockElement(block, index) {
        const wrapper = document.createElement('div');
        wrapper.className = `block-wrapper ${block.id === this.selectedBlockId ? 'selected' : ''}`;
        wrapper.dataset.blockId = block.id;
        wrapper.draggable = true;

        // Drag handle
        const handle = document.createElement('div');
        handle.className = 'block-handle';
        handle.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm6-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
            </svg>
        `;
        wrapper.appendChild(handle);

        // Media link indicator
        if (block.linkedMedia && block.linkedMedia.length > 0) {
            const linkIndicator = document.createElement('div');
            linkIndicator.className = 'block-media-link';
            linkIndicator.innerHTML = `
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                    <path d="M8.465 11.293c1.133-1.133 3.109-1.133 4.242 0l.707.707 1.414-1.414-.707-.707c-.943-.944-2.199-1.465-3.535-1.465s-2.592.521-3.535 1.465L4.929 12a5.008 5.008 0 0 0 0 7.071 4.983 4.983 0 0 0 3.535 1.462A4.982 4.982 0 0 0 12 19.071l.707-.707-1.414-1.414-.707.707a3.007 3.007 0 0 1-4.243 0 3.005 3.005 0 0 1 0-4.243l2.122-2.121z"/>
                    <path d="m12 4.929-.707.707 1.414 1.414.707-.707a3.007 3.007 0 0 1 4.243 0 3.005 3.005 0 0 1 0 4.243l-2.122 2.121c-1.133 1.133-3.109 1.133-4.242 0L10.586 12l-1.414 1.414.707.707c.943.944 2.199 1.465 3.535 1.465s2.592-.521 3.535-1.465L19.071 12a5.008 5.008 0 0 0 0-7.071 5.006 5.006 0 0 0-7.071 0z"/>
                </svg>
                ${block.linkedMedia.length}
            `;
            wrapper.appendChild(linkIndicator);
        }

        // Block content
        const content = document.createElement('div');
        content.className = 'block-content';
        content.innerHTML = this.getBlockContent(block);
        wrapper.appendChild(content);

        // Block toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'block-toolbar';
        toolbar.innerHTML = `
            <button class="duplicate" title="Duplicate">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M14 8H4c-1.103 0-2 .897-2 2v10c0 1.103.897 2 2 2h10c1.103 0 2-.897 2-2V10c0-1.103-.897-2-2-2z"/>
                    <path d="M20 2H10a2 2 0 0 0-2 2v2h8a2 2 0 0 1 2 2v8h2a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/>
                </svg>
            </button>
            <button class="delete" title="Delete">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M5 20a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8h2V6h-4V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H3v2h2zM9 4h6v2H9zM8 8h9v12H7V8z"/>
                </svg>
            </button>
        `;
        wrapper.appendChild(toolbar);

        // Event listeners
        wrapper.addEventListener('click', (e) => {
            if (!e.target.closest('.block-toolbar')) {
                this.selectBlock(block.id);
            }
        });

        toolbar.querySelector('.duplicate').addEventListener('click', (e) => {
            e.stopPropagation();
            this.duplicateBlock(block.id);
        });

        toolbar.querySelector('.delete').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteBlock(block.id);
        });

        // Setup content editing
        this.setupBlockEditing(wrapper, block);

        return wrapper;
    }

    /**
     * Get block HTML content based on type
     */
    getBlockContent(block) {
        switch (block.type) {
            case 'heading':
                return `
                    <h${block.level} class="block-heading" data-level="${block.level}" contenteditable="true">${helpers.escapeHtml(block.content)}</h${block.level}>
                `;

            case 'paragraph':
                return `
                    <div class="block-paragraph" contenteditable="true">${block.content || '<span style="color: #94a3b8;">Start typing...</span>'}</div>
                `;

            case 'list':
                const listTag = block.ordered ? 'ol' : 'ul';
                const items = block.items.map(item => `<li contenteditable="true">${helpers.escapeHtml(item)}</li>`).join('');
                return `
                    <${listTag} class="block-list ${block.ordered ? 'ordered' : 'unordered'}">
                        ${items}
                    </${listTag}>
                `;

            case 'quote':
                return `
                    <blockquote class="block-quote">
                        <div contenteditable="true">${block.content || 'Enter quote...'}</div>
                        ${block.citation ? `<cite>— ${helpers.escapeHtml(block.citation)}</cite>` : ''}
                    </blockquote>
                `;

            case 'code':
                return `
                    <div class="block-code">
                        <div class="block-code-header">
                            <select class="code-language">
                                <option value="javascript" ${block.language === 'javascript' ? 'selected' : ''}>JavaScript</option>
                                <option value="python" ${block.language === 'python' ? 'selected' : ''}>Python</option>
                                <option value="html" ${block.language === 'html' ? 'selected' : ''}>HTML</option>
                                <option value="css" ${block.language === 'css' ? 'selected' : ''}>CSS</option>
                                <option value="java" ${block.language === 'java' ? 'selected' : ''}>Java</option>
                                <option value="cpp" ${block.language === 'cpp' ? 'selected' : ''}>C++</option>
                                <option value="rust" ${block.language === 'rust' ? 'selected' : ''}>Rust</option>
                            </select>
                        </div>
                        <pre><code contenteditable="true" spellcheck="false">${helpers.escapeHtml(block.content) || '// Your code here...'}</code></pre>
                    </div>
                `;

            case 'equation':
                return `
                    <div class="block-equation">
                        <input type="text" class="block-equation-input" placeholder="Enter LaTeX equation..." value="${helpers.escapeHtml(block.latex || '')}">
                        <div class="block-equation-preview">${block.latex || 'Preview will appear here'}</div>
                    </div>
                `;

            case 'divider':
                return `
                    <div class="block-divider"><hr></div>
                `;

            case 'collapsible':
                return `
                    <div class="block-collapsible">
                        <div class="block-collapsible-header">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                <path d="M10 17l5-5-5-5v10z"/>
                            </svg>
                            <span contenteditable="true">${helpers.escapeHtml(block.title)}</span>
                        </div>
                        <div class="block-collapsible-content" contenteditable="true">
                            ${block.content || 'Collapsible content...'}
                        </div>
                    </div>
                `;

            default:
                return `<div>Unknown block type: ${block.type}</div>`;
        }
    }

    /**
     * Setup block content editing
     */
    setupBlockEditing(wrapper, block) {
        const editables = wrapper.querySelectorAll('[contenteditable="true"]');

        editables.forEach(editable => {
            // Focus handling
            editable.addEventListener('focus', () => {
                if (editable.textContent === 'Start typing...' ||
                    editable.textContent === 'Enter quote...' ||
                    editable.textContent === '// Your code here...' ||
                    editable.textContent === 'Collapsible content...') {
                    editable.textContent = '';
                }
            });

            // Content change handling
            editable.addEventListener('input', helpers.debounce(() => {
                this.saveBlockContent(block.id, wrapper);
            }, 300));

            // Blur handling
            editable.addEventListener('blur', () => {
                this.saveBlockContent(block.id, wrapper);
            });
        });

        // Special handling for different block types
        if (block.type === 'code') {
            const langSelect = wrapper.querySelector('.code-language');
            if (langSelect) {
                langSelect.addEventListener('change', () => {
                    projectStorage.updateBlock(this.currentChapterId, block.id, {
                        language: langSelect.value
                    });
                });
            }
        }

        if (block.type === 'equation') {
            const input = wrapper.querySelector('.block-equation-input');
            if (input) {
                input.addEventListener('input', helpers.debounce(() => {
                    projectStorage.updateBlock(this.currentChapterId, block.id, {
                        latex: input.value
                    });
                    // Update preview (would need KaTeX integration)
                    const preview = wrapper.querySelector('.block-equation-preview');
                    preview.textContent = input.value || 'Preview will appear here';
                }, 300));
            }
        }

        if (block.type === 'collapsible') {
            const header = wrapper.querySelector('.block-collapsible-header');
            header.addEventListener('click', (e) => {
                if (!e.target.matches('[contenteditable]')) {
                    wrapper.querySelector('.block-collapsible').classList.toggle('expanded');
                }
            });
        }
    }

    /**
     * Save block content from DOM
     */
    saveBlockContent(blockId, wrapper) {
        const chapter = projectStorage.getChapter(this.currentChapterId);
        if (!chapter) return;

        const block = chapter.blocks.find(b => b.id === blockId);
        if (!block) return;

        switch (block.type) {
            case 'heading':
            case 'paragraph':
                const content = wrapper.querySelector('[contenteditable]');
                if (content) {
                    projectStorage.updateBlock(this.currentChapterId, blockId, {
                        content: content.innerHTML
                    });
                }
                break;

            case 'list':
                const items = Array.from(wrapper.querySelectorAll('li')).map(li => li.textContent);
                projectStorage.updateBlock(this.currentChapterId, blockId, { items });
                break;

            case 'quote':
                const quoteContent = wrapper.querySelector('blockquote > div');
                if (quoteContent) {
                    projectStorage.updateBlock(this.currentChapterId, blockId, {
                        content: quoteContent.innerHTML
                    });
                }
                break;

            case 'code':
                const code = wrapper.querySelector('code');
                if (code) {
                    projectStorage.updateBlock(this.currentChapterId, blockId, {
                        content: code.textContent
                    });
                }
                break;

            case 'collapsible':
                const title = wrapper.querySelector('.block-collapsible-header span');
                const collContent = wrapper.querySelector('.block-collapsible-content');
                projectStorage.updateBlock(this.currentChapterId, blockId, {
                    title: title ? title.textContent : block.title,
                    content: collContent ? collContent.innerHTML : block.content
                });
                break;
        }
    }

    /**
     * Select a block
     */
    selectBlock(blockId) {
        this.selectedBlockId = blockId;

        // Update UI
        document.querySelectorAll('.block-wrapper').forEach(el => {
            el.classList.toggle('selected', el.dataset.blockId === blockId);
        });

        // Update inspector
        this.renderInspector();
    }

    /**
     * Add a new block
     */
    addBlock(type) {
        if (!this.currentChapterId) return;

        const block = projectStorage.addBlock(this.currentChapterId, type);
        this.renderBlocks();
        this.selectBlock(block.id);
        helpers.showToast('Block added', 'success');
    }

    /**
     * Duplicate a block
     */
    duplicateBlock(blockId) {
        const chapter = projectStorage.getChapter(this.currentChapterId);
        if (!chapter) return;

        const block = chapter.blocks.find(b => b.id === blockId);
        if (!block) return;

        const newBlock = helpers.deepClone(block);
        newBlock.id = helpers.generateId();

        const index = chapter.blocks.findIndex(b => b.id === blockId);
        chapter.blocks.splice(index + 1, 0, newBlock);
        projectStorage.markModified();

        this.renderBlocks();
        this.selectBlock(newBlock.id);
        helpers.showToast('Block duplicated', 'success');
    }

    /**
     * Delete a block
     */
    deleteBlock(blockId) {
        projectStorage.removeBlock(this.currentChapterId, blockId);

        if (this.selectedBlockId === blockId) {
            this.selectedBlockId = null;
            this.renderInspector();
        }

        this.renderBlocks();
        helpers.showToast('Block deleted', 'success');
    }

    /**
     * Render inspector panel
     */
    renderInspector() {
        if (!this.selectedBlockId) {
            this.inspectorContent.innerHTML = `
                <p class="inspector-placeholder">Select a block to edit its properties</p>
            `;
            return;
        }

        const chapter = projectStorage.getChapter(this.currentChapterId);
        if (!chapter) return;

        const block = chapter.blocks.find(b => b.id === this.selectedBlockId);
        if (!block) return;

        this.inspectorContent.innerHTML = `
            <div class="inspector-section">
                <h4>Block Type</h4>
                <div class="inspector-field">
                    <span style="text-transform: capitalize; font-weight: 500;">${block.type}</span>
                </div>
            </div>

            ${block.type === 'heading' ? `
                <div class="inspector-section">
                    <h4>Heading Level</h4>
                    <div class="inspector-field">
                        <select id="headingLevel">
                            <option value="1" ${block.level === 1 ? 'selected' : ''}>H1</option>
                            <option value="2" ${block.level === 2 ? 'selected' : ''}>H2</option>
                            <option value="3" ${block.level === 3 ? 'selected' : ''}>H3</option>
                            <option value="4" ${block.level === 4 ? 'selected' : ''}>H4</option>
                        </select>
                    </div>
                </div>
            ` : ''}

            ${block.type === 'list' ? `
                <div class="inspector-section">
                    <h4>List Type</h4>
                    <div class="inspector-field">
                        <select id="listType">
                            <option value="false" ${!block.ordered ? 'selected' : ''}>Unordered (bullets)</option>
                            <option value="true" ${block.ordered ? 'selected' : ''}>Ordered (numbers)</option>
                        </select>
                    </div>
                </div>
            ` : ''}

            <div class="inspector-section">
                <h4>Scroll Trigger</h4>
                <div class="trigger-settings">
                    <div class="trigger-option">
                        <input type="checkbox" id="triggerEnabled" ${block.trigger?.enabled ? 'checked' : ''}>
                        <label for="triggerEnabled">Enable trigger</label>
                    </div>
                    <div class="inspector-field" style="margin-top: 12px;">
                        <label>Trigger Type</label>
                        <select id="triggerType" ${!block.trigger?.enabled ? 'disabled' : ''}>
                            <option value="onEnter" ${block.trigger?.type === 'onEnter' ? 'selected' : ''}>On Enter</option>
                            <option value="onCenter" ${block.trigger?.type === 'onCenter' ? 'selected' : ''}>On Center</option>
                            <option value="onExit" ${block.trigger?.type === 'onExit' ? 'selected' : ''}>On Exit</option>
                            <option value="onProgress" ${block.trigger?.type === 'onProgress' ? 'selected' : ''}>On Progress</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="inspector-section">
                <h4>Linked Media</h4>
                <div class="media-link-panel">
                    <button class="btn btn-secondary" id="linkMediaBtn" style="width: 100%;">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/>
                        </svg>
                        Link Media
                    </button>
                    <div class="media-link-list" id="linkedMediaList">
                        ${this.renderLinkedMedia(block)}
                    </div>
                </div>
            </div>
        `;

        // Event listeners
        if (block.type === 'heading') {
            document.getElementById('headingLevel').addEventListener('change', (e) => {
                projectStorage.updateBlock(this.currentChapterId, block.id, {
                    level: parseInt(e.target.value)
                });
                this.renderBlocks();
            });
        }

        if (block.type === 'list') {
            document.getElementById('listType').addEventListener('change', (e) => {
                projectStorage.updateBlock(this.currentChapterId, block.id, {
                    ordered: e.target.value === 'true'
                });
                this.renderBlocks();
            });
        }

        document.getElementById('triggerEnabled').addEventListener('change', (e) => {
            const trigger = { ...block.trigger, enabled: e.target.checked };
            projectStorage.updateBlock(this.currentChapterId, block.id, { trigger });
            document.getElementById('triggerType').disabled = !e.target.checked;
        });

        document.getElementById('triggerType').addEventListener('change', (e) => {
            const trigger = { ...block.trigger, type: e.target.value };
            projectStorage.updateBlock(this.currentChapterId, block.id, { trigger });
        });

        document.getElementById('linkMediaBtn').addEventListener('click', () => {
            this.showMediaLinkDialog(block.id);
        });
    }

    /**
     * Render linked media list
     */
    renderLinkedMedia(block) {
        if (!block.linkedMedia || block.linkedMedia.length === 0) {
            return '<p style="color: var(--text-muted); font-size: 13px; margin-top: 12px;">No media linked</p>';
        }

        return block.linkedMedia.map(assetId => {
            const asset = projectStorage.getAsset(assetId);
            if (!asset) return '';

            return `
                <div class="media-link-item" data-asset-id="${assetId}">
                    ${asset.type === 'images' || asset.type === 'svgs'
                        ? `<img src="file://${projectStorage.getAssetPath(asset)}" alt="${asset.name}">`
                        : `<div style="width: 40px; height: 40px; background: var(--surface-hover); display: flex; align-items: center; justify-content: center; border-radius: 4px;">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 3H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2z"/></svg>
                           </div>`
                    }
                    <span class="media-link-name">${helpers.truncateText(asset.name, 20)}</span>
                    <button class="unlink-media" data-asset-id="${assetId}">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                            <path d="m16.192 6.344-4.243 4.243-4.243-4.243-1.414 1.414L10.535 12l-4.243 4.243 1.414 1.414 4.243-4.243 4.243 4.243 1.414-1.414L13.364 12l4.243-4.243z"/>
                        </svg>
                    </button>
                </div>
            `;
        }).join('');
    }

    /**
     * Show media link dialog
     */
    showMediaLinkDialog(blockId) {
        const assets = projectStorage.currentProject.assets;
        if (assets.length === 0) {
            helpers.showToast('No media assets available. Add some in the Media Manager.', 'warning');
            return;
        }

        // Create simple selection modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Select Media to Link</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div style="padding: 16px; max-height: 400px; overflow-y: auto;">
                    ${assets.map(asset => `
                        <div class="media-selector-item" data-asset-id="${asset.id}" style="display: flex; align-items: center; gap: 12px; padding: 10px; cursor: pointer; border-radius: 8px;">
                            ${asset.type === 'images' || asset.type === 'svgs'
                                ? `<img src="file://${projectStorage.getAssetPath(asset)}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 4px;">`
                                : `<div style="width: 48px; height: 48px; background: var(--surface-hover); display: flex; align-items: center; justify-content: center; border-radius: 4px;">
                                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 3H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2z"/></svg>
                                   </div>`
                            }
                            <div>
                                <div style="font-weight: 500;">${asset.name}</div>
                                <div style="font-size: 12px; color: var(--text-muted);">${asset.type}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        modal.querySelectorAll('.media-selector-item').forEach(item => {
            item.addEventListener('click', () => {
                const assetId = item.dataset.assetId;
                projectStorage.linkMediaToBlock(this.currentChapterId, blockId, assetId);
                this.renderBlocks();
                this.renderInspector();
                modal.remove();
                helpers.showToast('Media linked', 'success');
            });
        });
    }

    /**
     * Setup drag and drop
     */
    setupDragAndDrop() {
        let draggedElement = null;
        let draggedBlockId = null;

        this.blocksContainer.addEventListener('dragstart', (e) => {
            const wrapper = e.target.closest('.block-wrapper');
            if (wrapper) {
                draggedElement = wrapper;
                draggedBlockId = wrapper.dataset.blockId;
                wrapper.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        this.blocksContainer.addEventListener('dragend', (e) => {
            if (draggedElement) {
                draggedElement.classList.remove('dragging');
                draggedElement = null;
                draggedBlockId = null;
            }
            document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
        });

        this.blocksContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const wrapper = e.target.closest('.block-wrapper');
            if (wrapper && wrapper !== draggedElement) {
                const rect = wrapper.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;

                document.querySelectorAll('.drop-indicator').forEach(el => el.remove());

                const indicator = document.createElement('div');
                indicator.className = 'drop-indicator';

                if (e.clientY < midY) {
                    wrapper.parentNode.insertBefore(indicator, wrapper);
                } else {
                    wrapper.parentNode.insertBefore(indicator, wrapper.nextSibling);
                }
            }
        });

        this.blocksContainer.addEventListener('drop', (e) => {
            e.preventDefault();

            const indicator = document.querySelector('.drop-indicator');
            if (indicator && draggedBlockId) {
                const chapter = projectStorage.getChapter(this.currentChapterId);
                if (chapter) {
                    const blocks = Array.from(this.blocksContainer.querySelectorAll('.block-wrapper'));
                    const newIndex = blocks.indexOf(indicator.nextElementSibling);
                    const actualIndex = newIndex === -1 ? chapter.blocks.length - 1 : newIndex;

                    projectStorage.moveBlock(this.currentChapterId, draggedBlockId, actualIndex);
                    this.renderBlocks();
                }
            }

            document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
        });
    }

    /**
     * Show block type modal
     */
    showBlockTypeModal() {
        this.blockTypeModal.classList.add('active');
    }

    /**
     * Hide block type modal
     */
    hideBlockTypeModal() {
        this.blockTypeModal.classList.remove('active');
    }

    /**
     * Load project into editor
     */
    loadProject(project) {
        if (project.chapters.length > 0) {
            this.renderChapterList();
            this.selectChapter(project.chapters[0].id);
        }
    }
}

// Create global instance
window.blockEditor = new BlockEditor();
