// Multi-Chapter HTML Export

// ============ In exporter.js startExport() ============

// Replace the export logic with:

if (settings.export.format === 'multiChapter') {
    html = await this.generateMultiChapterHTML(project, savePath);
} else if (settings.export.format === 'single') {
    html = await this.generateSingleFileHTML(project);
} else {
    html = await this.generateMultiFileHTML(project, savePath);
}

// ============ Add new method to Exporter class ============

/**
 * Generate multiple HTML files - one per chapter
 */
async generateMultiChapterHTML(project, basePath) {
    const { meta, settings, chapters } = project;

    // Create output directory structure
    const baseDir = basePath.replace(/\.html$/, '_chapters');
    await window.electronAPI.createDirectory(baseDir);
    await window.electronAPI.createDirectory(`${baseDir}/assets`);

    this.updateProgress(20, 'Generating index page...');

    // Generate index.html (table of contents)
    const indexHTML = this.generateIndexPage(project, chapters);
    await window.electronAPI.writeFile(`${baseDir}/index.html`, indexHTML);

    this.updateProgress(40, 'Generating chapter files...');

    // Generate individual chapter files
    for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        const chapterHTML = this.generateChapterPage(project, chapter, i, chapters.length);
        const fileName = `chapter-${i + 1}.html`;
        await window.electronAPI.writeFile(`${baseDir}/${fileName}`, chapterHTML);

        this.updateProgress(40 + (30 * (i + 1) / chapters.length), `Generated ${fileName}...`);
    }

    this.updateProgress(70, 'Generating shared assets...');

    // Generate shared CSS
    const sharedCSS = this.generateCSS(settings);
    await window.electronAPI.writeFile(`${baseDir}/assets/styles.css`, sharedCSS);

    // Generate shared JS
    const sharedJS = this.generateScrollScript();
    await window.electronAPI.writeFile(`${baseDir}/assets/scripts.js`, sharedJS);

    // Copy assets
    await this.copyProjectAssets(project, `${baseDir}/assets`);

    this.exportedFilePath = `${baseDir}/index.html`;
    helpers.showToast(`Multi-chapter book created at: ${baseDir}`, 'success');

    return indexHTML; // Return something for the promise
}

/**
 * Generate index/table of contents page
 */
generateIndexPage(project, chapters) {
    const { meta, settings } = project;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${helpers.escapeHtml(meta.title)}</title>
    <link rel="stylesheet" href="assets/styles.css">
</head>
<body class="theme-${settings.theme}">
    <header class="book-header">
        <div class="book-header-content">
            ${meta.titleImage ? `<img src="${meta.titleImage.data}" class="book-title-image" alt="Book cover">` : ''}
            <h1 class="book-title">${helpers.escapeHtml(meta.title)}</h1>
            ${meta.author ? `<p class="book-author">by ${helpers.escapeHtml(meta.author)}</p>` : ''}
            ${meta.description ? `<p class="book-description">${helpers.escapeHtml(meta.description)}</p>` : ''}
        </div>
    </header>

    <main class="toc-container">
        <h2>Table of Contents</h2>
        <nav class="toc-list">
            ${chapters.map((ch, i) => `
                <a href="chapter-${i + 1}.html" class="toc-item">
                    <span class="toc-number">${i + 1}</span>
                    <span class="toc-title">${helpers.escapeHtml(ch.title)}</span>
                    <span class="toc-blocks">${ch.blocks.length} sections</span>
                </a>
            `).join('')}
        </nav>
    </main>

    ${settings.export.showFooter !== false ? `
    <footer class="book-footer">
        <p>${helpers.escapeHtml(settings.export.footerText || 'Created with HTML Book Builder')}</p>
    </footer>
    ` : ''}
</body>
</html>`;
}

/**
 * Generate individual chapter page
 */
generateChapterPage(project, chapter, chapterIndex, totalChapters) {
    const { meta, settings, assets } = project;

    const prevChapter = chapterIndex > 0 ? `chapter-${chapterIndex}.html` : null;
    const nextChapter = chapterIndex < totalChapters - 1 ? `chapter-${chapterIndex + 2}.html` : null;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${helpers.escapeHtml(chapter.title)} - ${helpers.escapeHtml(meta.title)}</title>
    <link rel="stylesheet" href="assets/styles.css">
    ${settings.export.includeKatex ? this.getKaTeXInline() : ''}
    ${settings.export.includeHighlight ? this.getHighlightJSInline() : ''}
</head>
<body class="theme-${settings.theme}">
    <nav class="chapter-nav">
        <a href="index.html" class="nav-home">← Contents</a>
        <span class="chapter-indicator">${chapterIndex + 1} / ${totalChapters}</span>
        <div class="nav-arrows">
            ${prevChapter ? `<a href="${prevChapter}" class="nav-prev">← Previous</a>` : '<span></span>'}
            ${nextChapter ? `<a href="${nextChapter}" class="nav-next">Next →</a>` : '<span></span>'}
        </div>
    </nav>

    <main class="book-container">
        ${this.generateChapterHTML(chapter, assets, settings)}
    </main>

    ${settings.export.showFooter !== false ? `
    <footer class="book-footer">
        <p>${helpers.escapeHtml(settings.export.footerText || 'Created with HTML Book Builder')}</p>
    </footer>
    ` : ''}

    <script src="assets/scripts.js"></script>
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
 * Copy project assets to export directory
 */
async copyProjectAssets(project, destDir) {
    for (const asset of project.assets) {
        const srcPath = projectStorage.getAssetPath(asset);
        const destPath = `${destDir}/${asset.relativePath}`;
        await window.electronAPI.copyFile(srcPath, destPath);
    }
}

// ============ Add to exporter CSS ============

/* Table of Contents */
.toc-container {
    max-width: 800px;
    margin: 60px auto;
    padding: 40px;
}

.toc-container h2 {
    font-size: 2.5rem;
    margin-bottom: 40px;
    text-align: center;
}

.toc-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.toc-item {
    display: grid;
    grid-template-columns: 60px 1fr auto;
    align-items: center;
    gap: 20px;
    padding: 24px;
    background-color: ${colors.primary}08;
    border-left: 4px solid ${colors.primary};
    border-radius: 12px;
    text-decoration: none;
    color: inherit;
    transition: all 0.3s ease;
}

.toc-item:hover {
    background-color: ${colors.primary}15;
    transform: translateX(8px);
}

.toc-number {
    font-size: 2rem;
    font-weight: 700;
    color: ${colors.primary};
}

.toc-title {
    font-size: 1.25rem;
    font-weight: 600;
}

.toc-blocks {
    font-size: 0.9rem;
    color: ${colors.text}88;
}

.book-description {
    max-width: 600px;
    margin: 16px auto 0;
    font-size: 1.1rem;
    line-height: 1.8;
    color: ${colors.text}aa;
}

/* Chapter Navigation */
.chapter-nav {
    position: sticky;
    top: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 40px;
    background-color: ${colors.background};
    border-bottom: 1px solid ${colors.text}22;
    z-index: 100;
}

.nav-home {
    text-decoration: none;
    color: ${colors.primary};
    font-weight: 500;
}

.chapter-indicator {
    font-size: 0.9rem;
    color: ${colors.text}66;
}

.nav-arrows {
    display: flex;
    gap: 16px;
}

.nav-prev, .nav-next {
    text-decoration: none;
    color: ${colors.primary};
    font-weight: 500;
    padding: 8px 16px;
    border-radius: 8px;
    transition: background-color 0.2s;
}

.nav-prev:hover, .nav-next:hover {
    background-color: ${colors.primary}11;
}
