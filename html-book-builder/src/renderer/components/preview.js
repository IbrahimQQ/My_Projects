// Preview Component

class Preview {
    constructor() {
        this.previewFrame = document.getElementById('previewFrame');
        this.currentDevice = 'desktop';

        this.init();
    }

    init() {
        // Device buttons
        document.querySelectorAll('.device-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentDevice = btn.dataset.device;
                this.previewFrame.dataset.device = this.currentDevice;
            });
        });

        // Refresh button
        document.getElementById('refreshPreviewBtn').addEventListener('click', () => {
            this.render();
        });

        // Set initial device
        this.previewFrame.dataset.device = 'desktop';
    }

    /**
     * Render preview
     */
    render() {
        const project = projectStorage.currentProject;
        if (!project) return;

        const html = this.generateHTML(project);

        // Write to iframe
        const doc = this.previewFrame.contentDocument || this.previewFrame.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();
    }

    /**
     * Generate preview HTML
     */
    generateHTML(project) {
        const { meta, settings, chapters, assets } = project;

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${helpers.escapeHtml(meta.title)}</title>
    <style>
        ${this.generateCSS(settings)}
    </style>
    ${settings.export.includeKatex ? `
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script>
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"><\/script>
    ` : ''}
    ${settings.export.includeHighlight ? `
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github.min.css">
    <script src="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/lib/core.min.js"><\/script>
    <script src="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/lib/languages/javascript.min.js"><\/script>
    <script src="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/lib/languages/python.min.js"><\/script>
    ` : ''}
</head>
<body class="theme-${settings.theme}">
    <div class="book-container">
        ${chapters.map(chapter => this.generateChapterHTML(chapter, assets, settings)).join('')}
    </div>

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
                        {left: '$', right: '$', display: false}
                    ]
                });
            }
        });
    <\/script>
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
    <\/script>
    ` : ''}
</body>
</html>
        `;
    }

    /**
     * Generate CSS styles
     */
    generateCSS(settings) {
        const { typography, colors, layout } = settings;

        return `
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }

            body {
                font-family: ${typography.bodyFont}, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: ${typography.baseFontSize}px;
                line-height: 1.7;
                color: ${colors.text};
                background-color: ${colors.background};
            }

            .book-container {
                max-width: 1400px;
                margin: 0 auto;
            }

            .chapter {
                min-height: 100vh;
                padding: 80px 40px;
            }

            .chapter-title {
                font-family: ${typography.headingFont}, serif;
                font-size: 3rem;
                font-weight: 700;
                margin-bottom: 60px;
                color: ${colors.primary};
            }

            .chapter-content {
                display: flex;
                gap: 60px;
            }

            .content-column {
                flex: 0 0 ${layout.contentWidth}%;
                max-width: ${layout.contentWidth}%;
            }

            .media-column {
                flex: 0 0 ${layout.mediaWidth}%;
                max-width: ${layout.mediaWidth}%;
                position: relative;
            }

            .media-sticky {
                position: sticky;
                top: 80px;
            }

            .content-block {
                margin-bottom: 40px;
                opacity: 0.6;
                transform: translateY(20px);
                transition: opacity 0.5s ease, transform 0.5s ease;
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
                color: ${colors.text};
            }

            .content-block h2 {
                font-family: ${typography.headingFont}, serif;
                font-size: 2rem;
                font-weight: 600;
                margin-bottom: 20px;
                color: ${colors.text};
            }

            .content-block h3 {
                font-family: ${typography.headingFont}, serif;
                font-size: 1.5rem;
                font-weight: 600;
                margin-bottom: 16px;
                color: ${colors.text};
            }

            .content-block h4 {
                font-family: ${typography.headingFont}, serif;
                font-size: 1.25rem;
                font-weight: 600;
                margin-bottom: 12px;
                color: ${colors.text};
            }

            .content-block p {
                margin-bottom: 20px;
                line-height: 1.8;
            }

            .content-block ul,
            .content-block ol {
                margin-bottom: 20px;
                padding-left: 24px;
            }

            .content-block li {
                margin-bottom: 8px;
            }

            .content-block blockquote {
                padding: 20px 24px;
                border-left: 4px solid ${colors.primary};
                background-color: rgba(0, 0, 0, 0.03);
                font-style: italic;
                margin-bottom: 20px;
            }

            .content-block pre {
                background-color: #1e293b;
                border-radius: 8px;
                padding: 20px;
                overflow-x: auto;
                margin-bottom: 20px;
            }

            .content-block code {
                font-family: ${typography.codeFont}, 'Consolas', monospace;
                font-size: 0.9em;
            }

            .content-block pre code {
                color: #e2e8f0;
            }

            .content-block .equation {
                text-align: center;
                padding: 24px;
                background-color: rgba(0, 0, 0, 0.02);
                border-radius: 8px;
                margin-bottom: 20px;
            }

            .content-block hr {
                border: none;
                border-top: 2px solid rgba(0, 0, 0, 0.1);
                margin: 40px 0;
            }

            .content-block details {
                border: 1px solid rgba(0, 0, 0, 0.1);
                border-radius: 8px;
                margin-bottom: 20px;
            }

            .content-block summary {
                padding: 16px;
                cursor: pointer;
                font-weight: 600;
                background-color: rgba(0, 0, 0, 0.02);
            }

            .content-block details[open] summary {
                border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            }

            .content-block details > div {
                padding: 16px;
            }

            /* Media Items */
            .media-item {
                width: 100%;
                margin-bottom: 24px;
                opacity: 0;
                transform: scale(0.95);
                transition: opacity 0.5s ease, transform 0.5s ease;
            }

            .media-item.active {
                opacity: 1;
                transform: scale(1);
            }

            .media-item img,
            .media-item video,
            .media-item svg {
                width: 100%;
                height: auto;
                border-radius: 8px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
            }

            .media-item iframe {
                width: 100%;
                min-height: 400px;
                border: none;
                border-radius: 8px;
            }

            .widget-container {
                background-color: white;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
            }

            /* Theme variations */
            .theme-dark {
                background-color: #0f172a;
                color: #e2e8f0;
            }

            .theme-dark .content-block blockquote {
                background-color: rgba(255, 255, 255, 0.05);
            }

            .theme-sepia {
                background-color: #fef3c7;
                color: #78350f;
            }

            /* Responsive */
            @media (max-width: 1024px) {
                .chapter-content {
                    flex-direction: column;
                }

                .content-column,
                .media-column {
                    flex: 0 0 100%;
                    max-width: 100%;
                }

                .media-sticky {
                    position: relative;
                    top: 0;
                }
            }

            /* Print styles */
            @media print {
                .chapter {
                    page-break-after: always;
                }

                .media-column {
                    display: none;
                }

                .content-column {
                    max-width: 100%;
                }
            }

            /* Custom CSS */
            ${settings.customCss || ''}
        `;
    }

    /**
     * Generate chapter HTML
     */
    generateChapterHTML(chapter, assets, settings) {
        return `
            <section class="chapter" id="chapter-${chapter.id}">
                <h2 class="chapter-title">${helpers.escapeHtml(chapter.title)}</h2>
                <div class="chapter-content">
                    <div class="content-column">
                        ${chapter.blocks.map(block => this.generateBlockHTML(block)).join('')}
                    </div>
                    <div class="media-column">
                        <div class="media-sticky">
                            ${this.generateMediaHTML(chapter, assets)}
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    /**
     * Generate block HTML
     */
    generateBlockHTML(block) {
        const dataAttrs = `data-block-id="${block.id}" ${block.linkedMedia?.length > 0 ? `data-media="${block.linkedMedia.join(',')}"` : ''} ${block.trigger?.enabled ? `data-trigger="${block.trigger.type}"` : ''}`;

        switch (block.type) {
            case 'heading':
                return `<div class="content-block" ${dataAttrs}><h${block.level}>${block.content}</h${block.level}></div>`;

            case 'paragraph':
                return `<div class="content-block" ${dataAttrs}><p>${block.content}</p></div>`;

            case 'list':
                const tag = block.ordered ? 'ol' : 'ul';
                const items = (block.items || []).map(item => `<li>${helpers.escapeHtml(item)}</li>`).join('');
                return `<div class="content-block" ${dataAttrs}><${tag}>${items}</${tag}></div>`;

            case 'quote':
                return `<div class="content-block" ${dataAttrs}><blockquote>${block.content}${block.citation ? `<cite>— ${helpers.escapeHtml(block.citation)}</cite>` : ''}</blockquote></div>`;

            case 'code':
                return `<div class="content-block" ${dataAttrs}><pre><code class="language-${block.language}">${helpers.escapeHtml(block.content)}</code></pre></div>`;

            case 'equation':
                return `<div class="content-block" ${dataAttrs}><div class="equation">$$${helpers.escapeHtml(block.latex)}$$</div></div>`;

            case 'divider':
                return `<div class="content-block" ${dataAttrs}><hr></div>`;

            case 'collapsible':
                return `<div class="content-block" ${dataAttrs}><details><summary>${helpers.escapeHtml(block.title)}</summary><div>${block.content}</div></details></div>`;

            default:
                return `<div class="content-block" ${dataAttrs}>${block.type}</div>`;
        }
    }

    /**
     * Generate media HTML
     */
    generateMediaHTML(chapter, assets) {
        const linkedAssetIds = new Set();
        chapter.blocks.forEach(block => {
            (block.linkedMedia || []).forEach(id => linkedAssetIds.add(id));
        });

        if (linkedAssetIds.size === 0) {
            return '<div class="media-item">No media linked</div>';
        }

        return Array.from(linkedAssetIds).map(assetId => {
            const asset = assets.find(a => a.id === assetId);
            if (!asset) return '';

            const assetPath = projectStorage.getAssetPath(asset);

            switch (asset.type) {
                case 'images':
                case 'svgs':
                    return `<div class="media-item" data-asset-id="${asset.id}"><img src="file://${assetPath}" alt="${helpers.escapeHtml(asset.name)}"></div>`;

                case 'videos':
                    return `<div class="media-item" data-asset-id="${asset.id}"><video src="file://${assetPath}" controls></video></div>`;

                case 'html-snippets':
                    return `<div class="media-item" data-asset-id="${asset.id}"><div class="widget-container" id="widget-${asset.id}"></div></div>`;

                case 'geogebra':
                    return `<div class="media-item" data-asset-id="${asset.id}"><div id="ggb-${asset.id}" class="geogebra-container"></div></div>`;

                default:
                    return `<div class="media-item" data-asset-id="${asset.id}">Media: ${asset.name}</div>`;
            }
        }).join('');
    }

    /**
     * Generate scroll synchronization script
     */
    generateScrollScript() {
        return `
            (function() {
                const blocks = document.querySelectorAll('.content-block');
                const mediaItems = document.querySelectorAll('.media-item');

                // Initially hide all media
                mediaItems.forEach(item => item.classList.remove('active'));

                // Show first media by default
                if (mediaItems.length > 0) {
                    mediaItems[0].classList.add('active');
                }

                // Intersection Observer for content blocks
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        const block = entry.target;

                        if (entry.isIntersecting) {
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
                        } else {
                            // Optional: fade out when leaving
                            // block.classList.remove('in-view');
                        }
                    });
                }, {
                    threshold: 0.3,
                    rootMargin: '-10% 0px -40% 0px'
                });

                blocks.forEach(block => observer.observe(block));

                // Progress-based triggers
                const progressBlocks = document.querySelectorAll('[data-trigger="onProgress"]');
                if (progressBlocks.length > 0) {
                    window.addEventListener('scroll', () => {
                        progressBlocks.forEach(block => {
                            const rect = block.getBoundingClientRect();
                            const viewHeight = window.innerHeight;
                            const progress = Math.max(0, Math.min(1, (viewHeight - rect.top) / (viewHeight + rect.height)));

                            // Dispatch custom event with progress
                            block.dispatchEvent(new CustomEvent('scrollProgress', { detail: { progress } }));
                        });
                    });
                }
            })();
        `;
    }

    /**
     * Load project into preview
     */
    loadProject(project) {
        this.render();
    }
}

// Create global instance
window.preview = new Preview();
