// Exporter Component

class Exporter {
    constructor() {
        this.exportModal = document.getElementById('exportModal');
        this.exportProgress = document.getElementById('exportProgress');
        this.exportComplete = document.getElementById('exportComplete');
        this.exportProgressFill = document.getElementById('exportProgressFill');
        this.exportStatus = document.getElementById('exportStatus');
        this.exportedFilePath = null;

        this.init();
    }

    init() {
        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.showExportModal();
        });

        // Close modal
        document.getElementById('closeExportModal').addEventListener('click', () => {
            this.hideExportModal();
        });

        // Start export
        document.getElementById('startExportBtn').addEventListener('click', () => {
            this.startExport();
        });

        // Open exported file location
        document.getElementById('openExportedFile').addEventListener('click', () => {
            if (this.exportedFilePath) {
                // This would need native shell integration
                helpers.showToast(`File exported to: ${this.exportedFilePath}`, 'success');
            }
        });

        // Close on background click
        this.exportModal.addEventListener('click', (e) => {
            if (e.target === this.exportModal) {
                this.hideExportModal();
            }
        });
    }

    /**
     * Show export modal
     */
    showExportModal() {
        this.exportProgress.style.display = 'none';
        this.exportComplete.style.display = 'none';
        document.getElementById('startExportBtn').style.display = 'block';
        this.exportModal.classList.add('active');
    }

    /**
     * Hide export modal
     */
    hideExportModal() {
        this.exportModal.classList.remove('active');
    }

    /**
     * Start export process
     */
    async startExport() {
        const project = projectStorage.currentProject;
        const settings = project.settings;

        // Show progress
        document.getElementById('startExportBtn').style.display = 'none';
        this.exportProgress.style.display = 'block';
        this.updateProgress(0, 'Preparing export...');

        try {
            // Get save location
            const savePath = await window.electronAPI.showSaveDialog({
                title: 'Export Book',
                defaultPath: `${helpers.slugify(project.meta.title)}.html`,
                filters: [
                    { name: 'HTML Files', extensions: ['html'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });

            if (!savePath) {
                this.resetExportModal();
                return;
            }

            this.updateProgress(10, 'Generating HTML...');

            // Generate complete HTML
            let html;
            if (settings.export.format === 'single') {
                html = await this.generateSingleFileHTML(project);
            } else {
                html = await this.generateMultiFileHTML(project, savePath);
            }

            this.updateProgress(70, 'Writing file...');

            // Write file
            await window.electronAPI.writeFile(savePath, html);

            this.updateProgress(100, 'Complete!');

            // Show success
            this.exportedFilePath = savePath;
            this.exportProgress.style.display = 'none';
            this.exportComplete.style.display = 'flex';

            helpers.showToast('Export completed successfully!', 'success');

        } catch (error) {
            console.error('Export error:', error);
            helpers.showToast('Export failed: ' + error.message, 'error');
            this.resetExportModal();
        }
    }

    /**
     * Update progress bar
     */
    updateProgress(percent, status) {
        this.exportProgressFill.style.width = `${percent}%`;
        this.exportStatus.textContent = status;
    }

    /**
     * Reset export modal
     */
    resetExportModal() {
        this.exportProgress.style.display = 'none';
        this.exportComplete.style.display = 'none';
        document.getElementById('startExportBtn').style.display = 'block';
    }

    /**
     * Generate single file HTML with all assets inlined
     */
    async generateSingleFileHTML(project) {
        const { meta, settings, chapters, assets } = project;

        // Inline all assets
        const inlinedAssets = await this.inlineAssets(assets);

        this.updateProgress(40, 'Building content...');

        const chaptersHTML = chapters.map(chapter =>
            this.generateChapterHTML(chapter, inlinedAssets, settings)
        ).join('');

        this.updateProgress(60, 'Finalizing...');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="${helpers.escapeHtml(meta.author)}">
    <meta name="description" content="${helpers.escapeHtml(meta.description)}">
    <title>${helpers.escapeHtml(meta.title)}</title>
    <style>
${this.generateCSS(settings)}
    </style>
    ${settings.export.includeKatex ? this.getKaTeXInline() : ''}
    ${settings.export.includeHighlight ? this.getHighlightJSInline() : ''}
</head>
<body class="theme-${settings.theme}">
    <header class="book-header">
        <div class="book-header-content">
            <h1 class="book-title">${helpers.escapeHtml(meta.title)}</h1>
            ${meta.author ? `<p class="book-author">by ${helpers.escapeHtml(meta.author)}</p>` : ''}
        </div>
    </header>

    <nav class="book-nav">
        <ul>
            ${chapters.map((ch, i) => `<li><a href="#chapter-${ch.id}">${i + 1}. ${helpers.escapeHtml(ch.title)}</a></li>`).join('')}
        </ul>
    </nav>

    <main class="book-container">
        ${chaptersHTML}
    </main>

    <footer class="book-footer">
        <p>Created with HTML Book Builder</p>
    </footer>

    <script>
${this.generateScrollScript()}
    </script>
    ${settings.export.includeKatex ? `
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof renderMathInElement !== 'undefined') {
                renderMathInElement(document.body, {
                    delimiters: [
                        {left: '$$', right: '$$', display: true},
                        {left: '$', right: '$', display: false},
                        {left: '\\\\[', right: '\\\\]', display: true},
                        {left: '\\\\(', right: '\\\\)', display: false}
                    ],
                    throwOnError: false
                });
            }
        });
    </script>
    ` : ''}
    ${settings.export.includeHighlight ? `
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof hljs !== 'undefined') {
                document.querySelectorAll('pre code').forEach(block => {
                    hljs.highlightElement(block);
                });
            }
        });
    </script>
    ` : ''}
</body>
</html>`;
    }

    /**
     * Generate multi-file HTML (assets in separate folder)
     */
    async generateMultiFileHTML(project, basePath) {
        // For multi-file export, assets are copied to a folder
        // This is a simplified version - in production you'd copy actual files
        const { meta, settings, chapters, assets } = project;

        const chaptersHTML = chapters.map(chapter =>
            this.generateChapterHTML(chapter, assets, settings, true)
        ).join('');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${helpers.escapeHtml(meta.title)}</title>
    <link rel="stylesheet" href="assets/styles.css">
    ${settings.export.includeKatex ? '<link rel="stylesheet" href="assets/katex/katex.min.css">' : ''}
    ${settings.export.includeHighlight ? '<link rel="stylesheet" href="assets/highlight/styles/default.css">' : ''}
</head>
<body class="theme-${settings.theme}">
    <main class="book-container">
        ${chaptersHTML}
    </main>
    <script src="assets/scripts/main.js"></script>
</body>
</html>`;
    }

    /**
     * Inline assets as base64
     */
    async inlineAssets(assets) {
        const inlined = {};

        for (const asset of assets) {
            try {
                const assetPath = projectStorage.getAssetPath(asset);

                if (asset.type === 'images') {
                    const base64 = await window.electronAPI.readFileBinary(assetPath);
                    const mimeType = helpers.getMimeType(asset.name);
                    inlined[asset.id] = `data:${mimeType};base64,${base64}`;
                } else if (asset.type === 'svgs') {
                    const content = await window.electronAPI.readFile(assetPath);
                    inlined[asset.id] = `data:image/svg+xml;base64,${btoa(content)}`;
                } else if (asset.type === 'html-snippets') {
                    const content = await window.electronAPI.readFile(assetPath);
                    inlined[asset.id] = JSON.parse(content);
                } else {
                    inlined[asset.id] = asset;
                }
            } catch (error) {
                console.error(`Failed to inline asset ${asset.name}:`, error);
                inlined[asset.id] = asset;
            }
        }

        return inlined;
    }

    /**
     * Generate CSS for export
     */
    generateCSS(settings) {
        const { typography, colors, layout } = settings;

        return `
/* Reset */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* Base */
html { scroll-behavior: smooth; }

body {
    font-family: ${typography.bodyFont}, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: ${typography.baseFontSize}px;
    line-height: 1.7;
    color: ${colors.text};
    background-color: ${colors.background};
}

/* Header */
.book-header {
    min-height: 60vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    background: linear-gradient(135deg, ${colors.primary}22 0%, ${colors.accent}22 100%);
    padding: 40px;
}

.book-title {
    font-family: ${typography.headingFont}, serif;
    font-size: 4rem;
    font-weight: 800;
    color: ${colors.text};
    margin-bottom: 16px;
}

.book-author {
    font-size: 1.25rem;
    color: ${colors.text}aa;
}

/* Navigation */
.book-nav {
    position: sticky;
    top: 0;
    background-color: ${colors.background};
    border-bottom: 1px solid ${colors.text}22;
    padding: 16px 40px;
    z-index: 100;
}

.book-nav ul {
    display: flex;
    gap: 24px;
    list-style: none;
    justify-content: center;
    flex-wrap: wrap;
}

.book-nav a {
    color: ${colors.text};
    text-decoration: none;
    font-weight: 500;
    padding: 8px 16px;
    border-radius: 4px;
    transition: background-color 0.2s;
}

.book-nav a:hover {
    background-color: ${colors.primary}22;
    color: ${colors.primary};
}

/* Container */
.book-container {
    max-width: 1400px;
    margin: 0 auto;
}

/* Chapter */
.chapter {
    min-height: 100vh;
    padding: 100px 40px;
}

.chapter-title {
    font-family: ${typography.headingFont}, serif;
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 60px;
    color: ${colors.primary};
    text-align: center;
}

.chapter-content {
    display: flex;
    gap: 80px;
    align-items: flex-start;
}

.content-column {
    flex: 0 0 ${layout.contentWidth}%;
    max-width: ${layout.contentWidth}%;
}

.media-column {
    flex: 0 0 ${layout.mediaWidth}%;
    max-width: ${layout.mediaWidth}%;
}

.media-sticky {
    position: sticky;
    top: 100px;
}

/* Content Blocks */
.content-block {
    margin-bottom: 48px;
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.6s ease, transform 0.6s ease;
}

.content-block.in-view {
    opacity: 1;
    transform: translateY(0);
}

.content-block h1 {
    font-family: ${typography.headingFont}, serif;
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 24px;
    line-height: 1.3;
}

.content-block h2 {
    font-family: ${typography.headingFont}, serif;
    font-size: 2rem;
    font-weight: 600;
    margin-bottom: 20px;
    line-height: 1.3;
}

.content-block h3 {
    font-family: ${typography.headingFont}, serif;
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 16px;
}

.content-block h4 {
    font-family: ${typography.headingFont}, serif;
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 12px;
}

.content-block p {
    margin-bottom: 24px;
    line-height: 1.9;
}

.content-block ul, .content-block ol {
    margin-bottom: 24px;
    padding-left: 28px;
}

.content-block li {
    margin-bottom: 12px;
    line-height: 1.7;
}

.content-block blockquote {
    padding: 24px 32px;
    border-left: 4px solid ${colors.primary};
    background: linear-gradient(90deg, ${colors.primary}11 0%, transparent 100%);
    font-style: italic;
    margin-bottom: 24px;
    border-radius: 0 8px 8px 0;
}

.content-block blockquote cite {
    display: block;
    margin-top: 12px;
    font-style: normal;
    font-weight: 600;
    color: ${colors.text}88;
}

.content-block pre {
    background-color: #1e293b;
    border-radius: 12px;
    padding: 24px;
    overflow-x: auto;
    margin-bottom: 24px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.content-block code {
    font-family: ${typography.codeFont}, 'Consolas', monospace;
    font-size: 0.9em;
}

.content-block pre code {
    color: #e2e8f0;
    line-height: 1.6;
}

.content-block .equation {
    text-align: center;
    padding: 32px;
    background: ${colors.primary}08;
    border-radius: 12px;
    margin-bottom: 24px;
    font-size: 1.2em;
}

.content-block hr {
    border: none;
    height: 2px;
    background: linear-gradient(90deg, transparent, ${colors.text}33, transparent);
    margin: 48px 0;
}

.content-block details {
    border: 1px solid ${colors.text}22;
    border-radius: 12px;
    margin-bottom: 24px;
    overflow: hidden;
}

.content-block summary {
    padding: 20px 24px;
    cursor: pointer;
    font-weight: 600;
    background: ${colors.text}08;
    transition: background-color 0.2s;
}

.content-block summary:hover {
    background: ${colors.text}11;
}

.content-block details[open] summary {
    border-bottom: 1px solid ${colors.text}22;
}

.content-block details > div {
    padding: 24px;
}

/* Media Items */
.media-item {
    margin-bottom: 32px;
    opacity: 0;
    transform: scale(0.9) translateY(20px);
    transition: opacity 0.5s ease, transform 0.5s ease;
    pointer-events: none;
    position: absolute;
    width: 100%;
}

.media-item:first-child {
    position: relative;
}

.media-item.active {
    opacity: 1;
    transform: scale(1) translateY(0);
    pointer-events: auto;
    position: relative;
}

.media-item img,
.media-item video,
.media-item svg {
    width: 100%;
    height: auto;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.media-item video {
    background-color: #000;
}

.media-item iframe {
    width: 100%;
    min-height: 450px;
    border: none;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.widget-container {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    min-height: 300px;
}

/* Footer */
.book-footer {
    text-align: center;
    padding: 40px;
    color: ${colors.text}66;
    font-size: 0.9rem;
    border-top: 1px solid ${colors.text}11;
}

/* Theme: Dark */
.theme-dark {
    background-color: #0f172a;
    color: #e2e8f0;
}

.theme-dark .book-header {
    background: linear-gradient(135deg, ${colors.primary}33 0%, ${colors.accent}33 100%);
}

.theme-dark .book-nav {
    background-color: #0f172a;
    border-color: #334155;
}

.theme-dark .content-block blockquote {
    background: linear-gradient(90deg, ${colors.primary}22 0%, transparent 100%);
}

/* Theme: Sepia */
.theme-sepia {
    background-color: #fef3c7;
    color: #78350f;
}

.theme-sepia .book-nav {
    background-color: #fef3c7;
}

/* Responsive */
@media (max-width: 1200px) {
    .chapter-content {
        flex-direction: column;
    }

    .content-column, .media-column {
        flex: 0 0 100%;
        max-width: 100%;
    }

    .media-sticky {
        position: relative;
        top: 0;
    }

    .media-item {
        position: relative !important;
        opacity: 1 !important;
        transform: none !important;
        pointer-events: auto !important;
        margin-bottom: 24px;
    }
}

@media (max-width: 768px) {
    .book-title { font-size: 2.5rem; }
    .chapter-title { font-size: 2rem; }
    .chapter { padding: 60px 24px; }
    .book-nav { padding: 12px 16px; }
    .book-nav ul { gap: 12px; }
}

/* Print */
@media print {
    .book-nav { display: none; }
    .media-column { display: none; }
    .content-column { max-width: 100%; }
    .chapter { page-break-after: always; }
    .content-block { opacity: 1; transform: none; }
}

/* Custom CSS */
${settings.customCss || ''}`;
    }

    /**
     * Generate chapter HTML for export
     */
    generateChapterHTML(chapter, assets, settings, useRelativePaths = false) {
        return `
        <section class="chapter" id="chapter-${chapter.id}">
            <h2 class="chapter-title">${helpers.escapeHtml(chapter.title)}</h2>
            <div class="chapter-content">
                <div class="content-column">
                    ${chapter.blocks.map(block => this.generateBlockHTML(block)).join('')}
                </div>
                <div class="media-column">
                    <div class="media-sticky">
                        ${this.generateMediaHTML(chapter, assets, useRelativePaths)}
                    </div>
                </div>
            </div>
        </section>`;
    }

    /**
     * Generate block HTML for export
     */
    generateBlockHTML(block) {
        const mediaAttr = block.linkedMedia?.length > 0 ? `data-media="${block.linkedMedia.join(',')}"` : '';
        const triggerAttr = block.trigger?.enabled ? `data-trigger="${block.trigger.type}"` : '';
        const dataAttrs = `data-block-id="${block.id}" ${mediaAttr} ${triggerAttr}`;

        switch (block.type) {
            case 'heading':
                return `<div class="content-block" ${dataAttrs}><h${block.level}>${block.content || ''}</h${block.level}></div>`;

            case 'paragraph':
                return `<div class="content-block" ${dataAttrs}><p>${block.content || ''}</p></div>`;

            case 'list':
                const tag = block.ordered ? 'ol' : 'ul';
                const items = (block.items || []).map(item => `<li>${helpers.escapeHtml(item)}</li>`).join('');
                return `<div class="content-block" ${dataAttrs}><${tag}>${items}</${tag}></div>`;

            case 'quote':
                const citation = block.citation ? `<cite>— ${helpers.escapeHtml(block.citation)}</cite>` : '';
                return `<div class="content-block" ${dataAttrs}><blockquote>${block.content || ''}${citation}</blockquote></div>`;

            case 'code':
                return `<div class="content-block" ${dataAttrs}><pre><code class="language-${block.language || 'plaintext'}">${helpers.escapeHtml(block.content || '')}</code></pre></div>`;

            case 'equation':
                return `<div class="content-block" ${dataAttrs}><div class="equation">$$${helpers.escapeHtml(block.latex || '')}$$</div></div>`;

            case 'divider':
                return `<div class="content-block" ${dataAttrs}><hr></div>`;

            case 'collapsible':
                return `<div class="content-block" ${dataAttrs}><details><summary>${helpers.escapeHtml(block.title || 'Details')}</summary><div>${block.content || ''}</div></details></div>`;

            default:
                return `<div class="content-block" ${dataAttrs}><p>${block.type}</p></div>`;
        }
    }

    /**
     * Generate media HTML for export
     */
    generateMediaHTML(chapter, assets, useRelativePaths) {
        const linkedAssetIds = new Set();
        chapter.blocks.forEach(block => {
            (block.linkedMedia || []).forEach(id => linkedAssetIds.add(id));
        });

        if (linkedAssetIds.size === 0) {
            return '';
        }

        return Array.from(linkedAssetIds).map(assetId => {
            let asset = assets[assetId] || assets.find?.(a => a.id === assetId);
            if (!asset) return '';

            // Handle inlined assets (base64)
            if (typeof asset === 'string' && asset.startsWith('data:')) {
                return `<div class="media-item" data-asset-id="${assetId}"><img src="${asset}" alt="Media"></div>`;
            }

            // Handle snippet data
            if (asset.html !== undefined) {
                return `<div class="media-item" data-asset-id="${assetId}">
                    <div class="widget-container">
                        <style>${asset.css || ''}</style>
                        ${asset.html || ''}
                        <script>${asset.js || ''}<\/script>
                    </div>
                </div>`;
            }

            // Handle regular asset objects
            const src = useRelativePaths ? asset.relativePath : `file://${projectStorage.getAssetPath(asset)}`;

            switch (asset.type) {
                case 'images':
                case 'svgs':
                    return `<div class="media-item" data-asset-id="${assetId}"><img src="${src}" alt="${helpers.escapeHtml(asset.name)}"></div>`;

                case 'videos':
                    return `<div class="media-item" data-asset-id="${assetId}"><video src="${src}" controls playsinline></video></div>`;

                case 'html-snippets':
                    return `<div class="media-item" data-asset-id="${assetId}"><div class="widget-container" id="widget-${assetId}">Widget: ${asset.name}</div></div>`;

                case 'geogebra':
                    return `<div class="media-item" data-asset-id="${assetId}"><div class="widget-container">GeoGebra: ${asset.name}</div></div>`;

                default:
                    return `<div class="media-item" data-asset-id="${assetId}">Media: ${asset.name}</div>`;
            }
        }).join('\n');
    }

    /**
     * Generate scroll synchronization script
     */
    generateScrollScript() {
        return `
(function() {
    'use strict';

    const blocks = document.querySelectorAll('.content-block');
    const mediaItems = document.querySelectorAll('.media-item');

    // Initially show first media if exists
    if (mediaItems.length > 0) {
        mediaItems[0].classList.add('active');
    }

    // Intersection Observer for scroll-triggered effects
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '-5% 0px -45% 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const block = entry.target;

            if (entry.isIntersecting) {
                // Animate block into view
                block.classList.add('in-view');

                // Handle media switching
                const mediaIds = block.dataset.media;
                if (mediaIds) {
                    const ids = mediaIds.split(',');

                    mediaItems.forEach(item => {
                        const itemId = item.dataset.assetId;
                        if (ids.includes(itemId)) {
                            item.classList.add('active');
                        } else {
                            item.classList.remove('active');
                        }
                    });
                }

                // Handle trigger events
                const trigger = block.dataset.trigger;
                if (trigger) {
                    block.dispatchEvent(new CustomEvent('trigger', {
                        detail: { type: trigger, state: 'enter' }
                    }));
                }
            }
        });
    }, observerOptions);

    // Observe all content blocks
    blocks.forEach(block => observer.observe(block));

    // Progress-based scroll handling
    const progressBlocks = document.querySelectorAll('[data-trigger="onProgress"]');

    if (progressBlocks.length > 0) {
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const viewHeight = window.innerHeight;

                    progressBlocks.forEach(block => {
                        const rect = block.getBoundingClientRect();
                        const progress = Math.max(0, Math.min(1,
                            (viewHeight - rect.top) / (viewHeight + rect.height)
                        ));

                        block.dispatchEvent(new CustomEvent('scrollProgress', {
                            detail: { progress }
                        }));

                        block.style.setProperty('--scroll-progress', progress);
                    });

                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    // Smooth scroll for nav links
    document.querySelectorAll('.book-nav a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
})();`;
    }

    /**
     * Get KaTeX inline resources
     */
    getKaTeXInline() {
        // In a real implementation, you'd bundle KaTeX CSS/JS
        return `
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" crossorigin="anonymous">
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js" crossorigin="anonymous"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" crossorigin="anonymous"></script>`;
    }

    /**
     * Get Highlight.js inline resources
     */
    getHighlightJSInline() {
        return `
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github-dark.min.css">
    <script src="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/lib/core.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/lib/languages/javascript.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/lib/languages/python.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/lib/languages/css.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/lib/languages/xml.min.js"></script>`;
    }
}

// Create global instance
window.exporter = new Exporter();
