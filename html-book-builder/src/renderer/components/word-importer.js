/**
 * Word Document Importer
 * Allows importing .docx files and creating blocks/chapters from text selection
 */

class WordImporter {
    constructor() {
        this.currentDocument = null;
        this.documentContent = '';
        this.container = document.getElementById('wordImportView');
        this.contentArea = document.getElementById('wordContentArea');
        this.floatingToolbar = document.getElementById('floatingToolbar');
        this.selectedRange = null;

        this.init();
    }

    init() {
        // Import button handler
        const importBtn = document.getElementById('importWordBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.selectWordDocument());
        }

        // Close button handler
        const closeBtn = document.getElementById('closeWordImportBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Text selection handler
        if (this.contentArea) {
            this.contentArea.addEventListener('mouseup', () => this.handleTextSelection());
            this.contentArea.addEventListener('touchend', () => this.handleTextSelection());
        }

        // Floating toolbar button handlers
        this.setupToolbarButtons();
    }

    /**
     * Open file dialog and import Word document
     */
    async selectWordDocument() {
        try {
            const files = await window.electronAPI.selectFile([
                { name: 'Word Documents', extensions: ['docx'] }
            ]);

            if (files && files.length > 0) {
                await this.loadWordDocument(files[0]);
            }
        } catch (error) {
            console.error('Error selecting Word document:', error);
            helpers.showToast('Error selecting file', 'error');
        }
    }

    /**
     * Load and parse Word document
     */
    async loadWordDocument(filePath) {
        try {
            helpers.showToast('Loading document...', 'info');

            // Read file as buffer
            const buffer = await window.electronAPI.readFileBuffer(filePath);

            // Parse with mammoth
            const mammoth = require('mammoth');
            const result = await mammoth.convertToHtml({ buffer: buffer });

            this.documentContent = result.value;
            this.currentDocument = {
                path: filePath,
                name: filePath.split(/[/\\]/).pop()
            };

            // Display content
            this.displayContent();

            // Show the import view
            this.show();

            helpers.showToast('Document loaded successfully', 'success');
        } catch (error) {
            console.error('Error loading Word document:', error);
            helpers.showToast('Error loading document. Make sure mammoth is installed.', 'error');
        }
    }

    /**
     * Display document content
     */
    displayContent() {
        if (this.contentArea) {
            this.contentArea.innerHTML = `
                <div class="word-doc-header">
                    <h2>${helpers.escapeHtml(this.currentDocument.name)}</h2>
                    <p class="hint">Select text to create blocks or chapters</p>
                </div>
                <div class="word-doc-content" id="wordDocContent">
                    ${this.documentContent}
                </div>
            `;
        }
    }

    /**
     * Handle text selection
     */
    handleTextSelection() {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText.length > 0) {
            // Store the range
            this.selectedRange = selection.getRangeAt(0);

            // Get selection position
            const rect = this.selectedRange.getBoundingClientRect();

            // Position and show floating toolbar
            this.showFloatingToolbar(rect);
        } else {
            this.hideFloatingToolbar();
        }
    }

    /**
     * Show floating toolbar near selection
     */
    showFloatingToolbar(rect) {
        if (!this.floatingToolbar) return;

        // Position above the selection
        const toolbar = this.floatingToolbar;
        const toolbarRect = toolbar.getBoundingClientRect();

        let top = rect.top - toolbarRect.height - 10;
        let left = rect.left + (rect.width / 2) - (toolbarRect.width / 2);

        // Adjust if toolbar would go off screen
        if (top < 0) {
            top = rect.bottom + 10;
        }
        if (left < 0) {
            left = 10;
        }
        if (left + toolbarRect.width > window.innerWidth) {
            left = window.innerWidth - toolbarRect.width - 10;
        }

        toolbar.style.top = `${top + window.scrollY}px`;
        toolbar.style.left = `${left + window.scrollX}px`;
        toolbar.classList.add('visible');
    }

    /**
     * Hide floating toolbar
     */
    hideFloatingToolbar() {
        if (this.floatingToolbar) {
            this.floatingToolbar.classList.remove('visible');
        }
    }

    /**
     * Setup floating toolbar buttons
     */
    setupToolbarButtons() {
        // Block type buttons
        const blockTypes = [
            'heading',
            'paragraph',
            'quote',
            'list',
            'code'
        ];

        blockTypes.forEach(type => {
            const btn = document.getElementById(`createBlock_${type}`);
            if (btn) {
                btn.addEventListener('click', () => this.createBlockFromSelection(type));
            }
        });

        // Chapter button
        const chapterBtn = document.getElementById('createChapter');
        if (chapterBtn) {
            chapterBtn.addEventListener('click', () => this.createChapterFromSelection());
        }
    }

    /**
     * Create block from selected text
     */
    createBlockFromSelection(blockType) {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (!selectedText) {
            helpers.showToast('No text selected', 'error');
            return;
        }

        // Get current chapter or create one if none exists
        const chapters = projectStorage.currentProject.chapters;
        let currentChapter = chapters.find(ch => ch.id === blockEditor.currentChapterId);

        if (!currentChapter) {
            // Create a chapter if none exists
            currentChapter = projectStorage.addChapter();
            blockEditor.currentChapterId = currentChapter.id;
        }

        // Create block based on type
        let blockData = {};

        switch (blockType) {
            case 'heading':
                // Detect heading level from font size or just use h2
                blockData = {
                    level: 2,
                    text: selectedText
                };
                break;

            case 'paragraph':
                blockData = {
                    text: selectedText
                };
                break;

            case 'quote':
                blockData = {
                    text: selectedText,
                    author: ''
                };
                break;

            case 'list':
                // Split by newlines or periods
                const items = selectedText.split(/\n|\./).filter(item => item.trim());
                blockData = {
                    items: items,
                    ordered: false
                };
                break;

            case 'code':
                blockData = {
                    code: selectedText,
                    language: 'text'
                };
                break;
        }

        // Add block to current chapter
        const block = projectStorage.createBlock(blockType, blockData);
        projectStorage.addBlock(currentChapter.id, block);

        // Update block editor view
        if (blockEditor.currentChapterId === currentChapter.id) {
            blockEditor.render();
        }

        // Hide toolbar
        this.hideFloatingToolbar();

        // Clear selection
        window.getSelection().removeAllRanges();

        helpers.showToast(`${blockType} block created`, 'success');
    }

    /**
     * Create chapter from selected text
     */
    createChapterFromSelection() {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (!selectedText) {
            helpers.showToast('No text selected', 'error');
            return;
        }

        // Use first line or first 50 chars as chapter title
        const lines = selectedText.split('\n');
        const title = lines[0].substring(0, 50);

        // Create new chapter
        const chapter = projectStorage.addChapter(title);

        // If there's more content, add it as a paragraph block
        if (lines.length > 1 || selectedText.length > title.length) {
            const remainingText = selectedText.substring(title.length).trim();
            if (remainingText) {
                const block = projectStorage.createBlock('paragraph', {
                    text: remainingText
                });
                projectStorage.addBlock(chapter.id, block);
            }
        }

        // Switch to the new chapter
        blockEditor.selectChapter(chapter.id);
        blockEditor.populateChapterDropdown();

        // Hide toolbar
        this.hideFloatingToolbar();

        // Clear selection
        window.getSelection().removeAllRanges();

        helpers.showToast(`Chapter "${title}" created`, 'success');
    }

    /**
     * Show the Word import view
     */
    show() {
        if (this.container) {
            this.container.style.display = 'flex';
            // Hide other views
            document.getElementById('editorView').style.display = 'none';
        }
    }

    /**
     * Close the Word import view
     */
    close() {
        if (this.container) {
            this.container.style.display = 'none';
            // Show editor view
            document.getElementById('editorView').style.display = 'grid';
        }
        this.hideFloatingToolbar();
    }
}

// Create global instance
window.wordImporter = new WordImporter();
