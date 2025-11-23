// Storyboard Component

class Storyboard {
    constructor() {
        this.timeline = document.getElementById('storyboardTimeline');
        this.selectedBlockId = null;
        this.selectedMediaId = null;

        this.init();
    }

    init() {
        // Auto-link button
        document.getElementById('autoLinkBtn').addEventListener('click', () => {
            this.autoLinkMedia();
        });
    }

    /**
     * Render storyboard timeline
     */
    render() {
        const project = projectStorage.currentProject;
        if (!project) return;

        this.timeline.innerHTML = '';

        if (project.chapters.length === 0 || project.chapters.every(ch => ch.blocks.length === 0)) {
            this.timeline.innerHTML = `
                <div class="storyboard-empty">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 3H4c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2zM4 19V5h16l.001 14H4z"/>
                        <path d="M6 7h5v4H6zm0 6h5v4H6zm7-6h5v4h-5zm0 6h5v4h-5z"/>
                    </svg>
                    <h3>No content yet</h3>
                    <p>Add some content blocks in the Editor view to start creating your storyboard timeline.</p>
                </div>
            `;
            return;
        }

        project.chapters.forEach(chapter => {
            const chapterElement = this.createChapterTimeline(chapter);
            this.timeline.appendChild(chapterElement);
        });
    }

    /**
     * Create chapter timeline section
     */
    createChapterTimeline(chapter) {
        const section = document.createElement('div');
        section.className = 'timeline-chapter';

        // Chapter header
        const header = document.createElement('div');
        header.className = 'timeline-chapter-header';
        header.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M6 22h15v-2H6.012C5.55 19.988 5 19.806 5 19c0-.101.009-.191.024-.273.112-.576.584-.717.988-.727H21V4c0-1.103-.897-2-2-2H6c-1.206 0-3 .799-3 3v14c0 2.201 1.794 3 3 3z"/>
            </svg>
            <h4>${helpers.escapeHtml(chapter.title)}</h4>
            <span class="chapter-badge">${chapter.blocks.length} blocks</span>
        `;
        section.appendChild(header);

        // Timeline rows
        chapter.blocks.forEach(block => {
            const row = this.createTimelineRow(chapter.id, block);
            section.appendChild(row);
        });

        return section;
    }

    /**
     * Create timeline row for a block
     */
    createTimelineRow(chapterId, block) {
        const row = document.createElement('div');
        row.className = 'timeline-row';

        // Content column
        const contentCol = document.createElement('div');
        contentCol.className = 'timeline-content-col';

        const contentBlock = document.createElement('div');
        contentBlock.className = `timeline-content-block ${block.linkedMedia?.length > 0 ? 'has-link' : ''}`;
        contentBlock.dataset.blockId = block.id;
        contentBlock.dataset.chapterId = chapterId;

        contentBlock.innerHTML = `
            <div class="timeline-block-icon">
                ${this.getBlockTypeIcon(block.type)}
            </div>
            <div class="timeline-block-info">
                <span class="timeline-block-type">${block.type}</span>
                <span class="timeline-block-preview">${this.getBlockPreview(block)}</span>
            </div>
            ${block.trigger?.enabled ? `<span class="trigger-badge">${block.trigger.type}</span>` : ''}
        `;

        contentBlock.addEventListener('click', () => {
            this.selectBlock(chapterId, block.id);
        });

        contentCol.appendChild(contentBlock);
        row.appendChild(contentCol);

        // Connection column
        const connectionCol = document.createElement('div');
        connectionCol.className = 'timeline-connection-col';

        const connector = document.createElement('div');
        connector.className = `timeline-connector ${block.linkedMedia?.length > 0 ? 'active' : ''}`;

        const linkBtn = document.createElement('button');
        linkBtn.className = `timeline-link-btn ${block.linkedMedia?.length > 0 ? 'linked' : ''}`;
        linkBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                ${block.linkedMedia?.length > 0
                    ? '<path d="M8.465 11.293c1.133-1.133 3.109-1.133 4.242 0l.707.707 1.414-1.414-.707-.707c-.943-.944-2.199-1.465-3.535-1.465s-2.592.521-3.535 1.465L4.929 12a5.008 5.008 0 0 0 0 7.071 4.983 4.983 0 0 0 3.535 1.462A4.982 4.982 0 0 0 12 19.071l.707-.707-1.414-1.414-.707.707a3.007 3.007 0 0 1-4.243 0 3.005 3.005 0 0 1 0-4.243l2.122-2.121z"/><path d="m12 4.929-.707.707 1.414 1.414.707-.707a3.007 3.007 0 0 1 4.243 0 3.005 3.005 0 0 1 0 4.243l-2.122 2.121c-1.133 1.133-3.109 1.133-4.242 0L10.586 12l-1.414 1.414.707.707c.943.944 2.199 1.465 3.535 1.465s2.592-.521 3.535-1.465L19.071 12a5.008 5.008 0 0 0 0-7.071 5.006 5.006 0 0 0-7.071 0z"/>'
                    : '<path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/>'
                }
            </svg>
        `;

        linkBtn.addEventListener('click', () => {
            this.showMediaSelector(chapterId, block.id, linkBtn);
        });

        connectionCol.appendChild(connector);
        connectionCol.appendChild(linkBtn);
        row.appendChild(connectionCol);

        // Media column
        const mediaCol = document.createElement('div');
        mediaCol.className = 'timeline-media-col';

        if (block.linkedMedia && block.linkedMedia.length > 0) {
            block.linkedMedia.forEach(assetId => {
                const asset = projectStorage.getAsset(assetId);
                if (asset) {
                    const mediaBlock = this.createMediaBlock(asset, chapterId, block.id);
                    mediaCol.appendChild(mediaBlock);
                }
            });
        } else {
            const emptyMedia = document.createElement('div');
            emptyMedia.className = 'timeline-media-empty';
            emptyMedia.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/>
                </svg>
                Add media
            `;
            emptyMedia.addEventListener('click', () => {
                this.showMediaSelector(chapterId, block.id, linkBtn);
            });
            mediaCol.appendChild(emptyMedia);
        }

        row.appendChild(mediaCol);

        return row;
    }

    /**
     * Create media block element
     */
    createMediaBlock(asset, chapterId, blockId) {
        const block = document.createElement('div');
        block.className = 'timeline-media-block';
        block.dataset.assetId = asset.id;

        const assetPath = projectStorage.getAssetPath(asset);
        let thumbnail = '';

        if (asset.type === 'images' || asset.type === 'svgs') {
            thumbnail = `<img src="file://${assetPath}" alt="${asset.name}">`;
        } else {
            thumbnail = this.getMediaTypeIcon(asset.type);
        }

        block.innerHTML = `
            <div class="timeline-media-thumbnail">
                ${thumbnail}
            </div>
            <div class="timeline-media-info">
                <span class="timeline-media-name">${helpers.truncateText(asset.name, 15)}</span>
                <span class="timeline-media-type">${asset.type}</span>
            </div>
            <button class="unlink-btn" title="Unlink">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="m16.192 6.344-4.243 4.243-4.243-4.243-1.414 1.414L10.535 12l-4.243 4.243 1.414 1.414 4.243-4.243 4.243 4.243 1.414-1.414L13.364 12l4.243-4.243z"/>
                </svg>
            </button>
        `;

        block.querySelector('.unlink-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            projectStorage.unlinkMediaFromBlock(chapterId, blockId, asset.id);
            this.render();
            helpers.showToast('Media unlinked', 'success');
        });

        return block;
    }

    /**
     * Get block type icon
     */
    getBlockTypeIcon(type) {
        const icons = {
            heading: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18 20V4h-3v6H9V4H6v16h3v-7h6v7z"/></svg>',
            paragraph: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M4 6h16v2H4zm0 4h16v2H4zm0 4h16v2H4zm0 4h10v2H4z"/></svg>',
            list: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M4 6h2v2H4zm4 0h12v2H8zm-4 5h2v2H4zm4 0h12v2H8zm-4 5h2v2H4zm4 0h12v2H8z"/></svg>',
            quote: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6.5 10c-.223 0-.437.034-.65.065.069-.232.14-.468.254-.68.114-.308.292-.575.469-.844.148-.291.409-.488.601-.737.201-.242.475-.403.692-.604.213-.21.492-.315.714-.463.232-.133.434-.28.65-.35l.539-.222.474-.197-.485-1.938-.597.144c-.191.048-.424.104-.689.171-.271.05-.56.187-.882.312-.318.142-.686.238-1.028.466-.344.218-.741.4-1.091.692-.339.301-.748.562-1.05.945-.33.358-.656.734-.909 1.162-.293.408-.492.856-.702 1.299-.19.443-.343.896-.468 1.336-.237.882-.343 1.72-.384 2.437-.034.718-.014 1.315.028 1.747.015.204.043.402.063.539l.025.168.026-.006A4.5 4.5 0 1 0 6.5 10z"/></svg>',
            code: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8.293 6.293 2.586 12l5.707 5.707 1.414-1.414L5.414 12l4.293-4.293zm7.414 11.414L21.414 12l-5.707-5.707-1.414 1.414L18.586 12l-4.293 4.293z"/></svg>',
            equation: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="m7 2 5 5-2 2 4 4 4-4-2-2 5-5H7z"/></svg>',
            divider: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M4 11h16v2H4z"/></svg>',
            collapsible: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M4 6h16v2H4zm4 5h12v2H8zm0 5h12v2H8z"/></svg>'
        };
        return icons[type] || icons.paragraph;
    }

    /**
     * Get media type icon
     */
    getMediaTypeIcon(type) {
        const icons = {
            videos: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
            geogebra: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2z"/></svg>',
            'html-snippets': '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M8.293 6.293 2.586 12l5.707 5.707 1.414-1.414L5.414 12l4.293-4.293zm7.414 11.414L21.414 12l-5.707-5.707-1.414 1.414L18.586 12l-4.293 4.293z"/></svg>',
            scripts: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/></svg>'
        };
        return icons[type] || '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 3H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2z"/></svg>';
    }

    /**
     * Get block content preview
     */
    getBlockPreview(block) {
        switch (block.type) {
            case 'heading':
            case 'paragraph':
                return helpers.truncateText(helpers.stripHtml(block.content || ''), 30) || 'Empty';
            case 'list':
                return block.items?.[0] ? helpers.truncateText(block.items[0], 25) : 'Empty list';
            case 'quote':
                return helpers.truncateText(helpers.stripHtml(block.content || ''), 30) || 'Empty quote';
            case 'code':
                return helpers.truncateText(block.content || '', 25) || 'Empty code';
            case 'equation':
                return helpers.truncateText(block.latex || '', 25) || 'Empty equation';
            case 'divider':
                return '—————';
            case 'collapsible':
                return helpers.truncateText(block.title || '', 25) || 'Collapsible';
            default:
                return block.type;
        }
    }

    /**
     * Select a block
     */
    selectBlock(chapterId, blockId) {
        this.selectedBlockId = blockId;

        document.querySelectorAll('.timeline-content-block').forEach(el => {
            el.classList.toggle('selected', el.dataset.blockId === blockId);
        });
    }

    /**
     * Show media selector dropdown
     */
    showMediaSelector(chapterId, blockId, anchorElement) {
        const assets = projectStorage.currentProject.assets;
        if (assets.length === 0) {
            helpers.showToast('No media assets available. Add some in the Media Manager.', 'warning');
            return;
        }

        // Remove existing dropdown
        document.querySelectorAll('.media-selector-dropdown').forEach(d => d.remove());

        const dropdown = document.createElement('div');
        dropdown.className = 'media-selector-dropdown';

        dropdown.innerHTML = `
            <div class="media-selector-header">
                <input type="text" placeholder="Search media..." id="mediaSearchInput">
            </div>
            <div class="media-selector-list">
                ${assets.map(asset => `
                    <div class="media-selector-item" data-asset-id="${asset.id}">
                        ${asset.type === 'images' || asset.type === 'svgs'
                            ? `<img src="file://${projectStorage.getAssetPath(asset)}" alt="${asset.name}">`
                            : `<div style="width: 40px; height: 40px; background: var(--surface-hover); display: flex; align-items: center; justify-content: center; border-radius: 4px;">
                                ${this.getMediaTypeIcon(asset.type)}
                               </div>`
                        }
                        <span class="media-name">${asset.name}</span>
                    </div>
                `).join('')}
            </div>
        `;

        // Position dropdown
        const rect = anchorElement.getBoundingClientRect();
        dropdown.style.position = 'fixed';
        dropdown.style.left = `${rect.left + rect.width / 2}px`;
        dropdown.style.top = `${rect.bottom + 8}px`;

        document.body.appendChild(dropdown);

        // Search functionality
        const searchInput = dropdown.querySelector('#mediaSearchInput');
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase();
            dropdown.querySelectorAll('.media-selector-item').forEach(item => {
                const name = item.querySelector('.media-name').textContent.toLowerCase();
                item.style.display = name.includes(query) ? 'flex' : 'none';
            });
        });

        // Item selection
        dropdown.querySelectorAll('.media-selector-item').forEach(item => {
            item.addEventListener('click', () => {
                const assetId = item.dataset.assetId;
                projectStorage.linkMediaToBlock(chapterId, blockId, assetId, { type: 'onEnter', enabled: true });
                dropdown.remove();
                this.render();
                helpers.showToast('Media linked', 'success');
            });
        });

        // Close on click outside
        setTimeout(() => {
            document.addEventListener('click', function closeDropdown(e) {
                if (!dropdown.contains(e.target) && e.target !== anchorElement) {
                    dropdown.remove();
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }, 0);

        searchInput.focus();
    }

    /**
     * Auto-link media based on naming conventions
     */
    autoLinkMedia() {
        const project = projectStorage.currentProject;
        let linkedCount = 0;

        project.chapters.forEach(chapter => {
            chapter.blocks.forEach(block => {
                if (block.linkedMedia?.length > 0) return; // Skip already linked

                // Try to find matching asset
                const blockContent = this.getBlockPreview(block).toLowerCase();
                const matchingAsset = project.assets.find(asset => {
                    const assetName = asset.name.toLowerCase().replace(/[-_]/g, ' ');
                    return blockContent.includes(assetName.split('.')[0]);
                });

                if (matchingAsset) {
                    projectStorage.linkMediaToBlock(chapter.id, block.id, matchingAsset.id, { type: 'onEnter', enabled: true });
                    linkedCount++;
                }
            });
        });

        this.render();
        helpers.showToast(`Auto-linked ${linkedCount} media items`, 'success');
    }

    /**
     * Load project into storyboard
     */
    loadProject(project) {
        this.selectedBlockId = null;
        this.render();
    }
}

// Create global instance
window.storyboard = new Storyboard();
