// Export Manager - Generate standalone HTML books
export class ExportManager {
  constructor(app) {
    this.app = app;
  }

  async export(format, onProgress) {
    onProgress(10, 'Gathering project data...');
    const project = this.app.project.data;

    onProgress(30, 'Generating HTML...');
    const html = await this.generateExportHTML(project, format === 'single');

    onProgress(70, 'Preparing download...');

    if (format === 'single') {
      await this.downloadSingleFile(html, project.title || 'book');
    } else {
      await this.downloadBundle(html, project);
    }

    onProgress(100, 'Export complete!');
  }

  async generateExportHTML(project, inlineAssets = true) {
    const settings = project.settings;

    // Generate inline styles
    const styles = this.generateStyles(settings);

    // Generate content
    const content = this.generateContent(project);

    // Get bundled libraries
    const libs = this.getBundledLibraries();

    // Process media for inline or reference
    const mediaAssets = inlineAssets ? await this.inlineMedia(project) : this.referenceMedia(project);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${settings.title || project.title || 'Interactive Book'}</title>
  <meta name="author" content="${settings.author || ''}">
  <meta name="description" content="${settings.description || ''}">

  <!-- Bundled Styles -->
  <style>
    ${libs.katexCSS}
    ${libs.highlightCSS}
    ${styles}
  </style>
</head>
<body>
  <div class="book-container ${settings.theme || 'light'}">
    ${this.generateHeader(project, settings)}
    ${this.generateNav(project)}
    ${content}
  </div>

  <!-- Bundled Scripts -->
  <script>
    ${libs.katexJS}
  </script>
  <script>
    ${libs.highlightJS}
  </script>
  <script>
    ${this.generateScrollScript()}
  </script>
  <script>
    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
      // Render math
      if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(document.body, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      }

      // Highlight code
      if (typeof hljs !== 'undefined') {
        document.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
      }

      // Initialize scroll observer
      initScrollObserver();
    });
  </script>
</body>
</html>`;
  }

  generateStyles(settings) {
    const contentWidth = { narrow: '500px', medium: '600px', wide: '700px' }[settings.contentWidth] || '600px';
    const mediaWidth = { narrow: '400px', medium: '500px', wide: '600px' }[settings.mediaWidth] || '500px';

    return `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Fira+Code&display=swap');

      :root {
        --book-bg: ${settings.bgColor || '#ffffff'};
        --book-text: ${settings.textColor || '#333333'};
        --book-accent: ${settings.accentColor || '#3498db'};
        --book-heading-font: '${settings.headingFont || 'Merriweather'}', Georgia, serif;
        --book-body-font: '${settings.bodyFont || 'Inter'}', -apple-system, sans-serif;
        --book-code-font: '${settings.codeFont || 'Fira Code'}', Consolas, monospace;
        --book-font-size: ${settings.fontSize || 18}px;
        --book-content-width: ${contentWidth};
        --book-media-width: ${mediaWidth};
      }

      * { box-sizing: border-box; margin: 0; padding: 0; }
      html { scroll-behavior: smooth; }

      .book-container {
        min-height: 100vh;
        background: var(--book-bg);
        color: var(--book-text);
        font-family: var(--book-body-font);
        font-size: var(--book-font-size);
        line-height: 1.7;
      }

      .book-container.dark {
        --book-bg: #1a1a2e;
        --book-text: #e0e0e0;
      }

      .book-container.sepia {
        --book-bg: #f4ecd8;
        --book-text: #5c4b37;
      }

      .book-header {
        padding: 80px 40px;
        text-align: center;
        background: linear-gradient(135deg, var(--book-accent), #2c3e50);
        color: white;
      }

      .book-header h1 {
        font-family: var(--book-heading-font);
        font-size: 3em;
        font-weight: 700;
        margin-bottom: 16px;
      }

      .book-header .author { font-size: 1.2em; opacity: 0.9; }
      .book-header .description { font-size: 1em; opacity: 0.8; max-width: 600px; margin: 16px auto 0; }

      .book-nav {
        position: sticky;
        top: 0;
        background: var(--book-bg);
        border-bottom: 1px solid rgba(0,0,0,0.1);
        padding: 16px 40px;
        z-index: 100;
        backdrop-filter: blur(10px);
      }

      .book-nav ul {
        display: flex;
        gap: 32px;
        list-style: none;
        justify-content: center;
        flex-wrap: wrap;
      }

      .book-nav a {
        color: var(--book-text);
        text-decoration: none;
        font-size: 0.95em;
        font-weight: 500;
        transition: color 0.2s;
      }

      .book-nav a:hover, .book-nav a.active { color: var(--book-accent); }

      .book-chapter {
        display: flex;
        max-width: calc(var(--book-content-width) + var(--book-media-width) + 100px);
        margin: 0 auto;
        padding: 80px 40px;
        gap: 80px;
      }

      .book-content {
        flex: 0 0 var(--book-content-width);
        max-width: var(--book-content-width);
      }

      .book-media {
        flex: 0 0 var(--book-media-width);
        max-width: var(--book-media-width);
        position: sticky;
        top: 100px;
        height: fit-content;
        align-self: flex-start;
      }

      .book-section {
        margin-bottom: 3em;
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s ease-out, transform 0.6s ease-out;
      }

      .book-section.visible {
        opacity: 1;
        transform: translateY(0);
      }

      .book-section h1, .book-section h2, .book-section h3, .book-section h4 {
        font-family: var(--book-heading-font);
        margin-bottom: 0.5em;
        line-height: 1.3;
      }

      .book-section h1 { font-size: 2.2em; font-weight: 700; }
      .book-section h2 { font-size: 1.8em; font-weight: 600; }
      .book-section h3 { font-size: 1.4em; font-weight: 600; }
      .book-section h4 { font-size: 1.1em; font-weight: 600; }
      .book-section p { margin-bottom: 1.2em; }

      .book-section blockquote {
        border-left: 4px solid var(--book-accent);
        padding: 0.5em 0 0.5em 1.5em;
        margin: 1.5em 0;
        font-style: italic;
        color: #666;
        background: rgba(0,0,0,0.02);
      }

      .book-section ul, .book-section ol {
        margin: 1.2em 0;
        padding-left: 2em;
      }

      .book-section li { margin-bottom: 0.6em; }

      .book-section pre {
        background: #1e1e1e;
        color: #d4d4d4;
        padding: 1.5em;
        border-radius: 12px;
        overflow-x: auto;
        font-family: var(--book-code-font);
        font-size: 0.85em;
        line-height: 1.5;
        margin: 1.5em 0;
      }

      .book-section code {
        font-family: var(--book-code-font);
        background: rgba(0,0,0,0.05);
        padding: 0.2em 0.4em;
        border-radius: 4px;
        font-size: 0.9em;
      }

      .book-section pre code { background: none; padding: 0; }

      .book-section hr {
        border: none;
        border-top: 2px solid rgba(0,0,0,0.1);
        margin: 3em 0;
      }

      .book-section .math-block {
        margin: 2em 0;
        text-align: center;
        overflow-x: auto;
        padding: 1em;
      }

      .book-section details {
        border: 1px solid rgba(0,0,0,0.1);
        border-radius: 8px;
        margin: 1.5em 0;
      }

      .book-section summary {
        padding: 1em 1.5em;
        background: rgba(0,0,0,0.02);
        cursor: pointer;
        font-weight: 500;
      }

      .book-section details > div { padding: 1.5em; }

      .book-media-item {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.5s ease, transform 0.5s ease;
        transform: translateY(20px);
      }

      .book-media-item.active {
        position: relative;
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .book-media-item img, .book-media-item video {
        max-width: 100%;
        height: auto;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      }

      .book-media-item iframe {
        width: 100%;
        min-height: 400px;
        border: none;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      }

      .book-media-item .widget-container {
        background: #f9f9f9;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      }

      @media (max-width: 1100px) {
        .book-chapter {
          flex-direction: column;
          padding: 60px 24px;
          gap: 40px;
        }
        .book-content, .book-media {
          flex: none;
          max-width: 100%;
          position: relative;
          top: auto;
        }
        .book-media { order: -1; }
        .book-media-item { position: relative; opacity: 1; visibility: visible; transform: none; }
        .book-header { padding: 60px 24px; }
        .book-header h1 { font-size: 2em; }
      }

      @media print {
        .book-nav, .book-media { display: none; }
        .book-chapter { max-width: 100%; page-break-after: always; }
        .book-content { max-width: 100%; }
        .book-section { opacity: 1; transform: none; }
        .book-header { page-break-after: always; }
      }
    `;
  }

  generateHeader(project, settings) {
    return `
      <header class="book-header">
        <h1>${settings.title || project.title || 'Interactive Book'}</h1>
        ${settings.author ? `<p class="author">by ${settings.author}</p>` : ''}
        ${settings.description ? `<p class="description">${settings.description}</p>` : ''}
      </header>
    `;
  }

  generateNav(project) {
    const links = project.chapters.map(ch =>
      `<li><a href="#${ch.id}">${ch.title}</a></li>`
    ).join('');
    return `<nav class="book-nav"><ul>${links}</ul></nav>`;
  }

  generateContent(project) {
    return project.chapters.map(chapter => this.generateChapter(chapter, project)).join('');
  }

  generateChapter(chapter, project) {
    const blocks = chapter.blocks.map((block, index) => this.generateBlock(block, index, project)).join('');
    const media = this.generateMediaColumn(chapter, project);

    return `
      <section class="book-chapter" id="${chapter.id}" data-chapter="${chapter.id}">
        <div class="book-content">
          ${blocks}
        </div>
        <div class="book-media">
          ${media}
        </div>
      </section>
    `;
  }

  generateBlock(block, index, project) {
    let content = block.content || '';
    const sectionId = `section-${block.id}`;

    switch (block.type) {
      case 'heading1': return `<div class="book-section" id="${sectionId}" data-block="${block.id}"><h1>${content}</h1></div>`;
      case 'heading2': return `<div class="book-section" id="${sectionId}" data-block="${block.id}"><h2>${content}</h2></div>`;
      case 'heading3': return `<div class="book-section" id="${sectionId}" data-block="${block.id}"><h3>${content}</h3></div>`;
      case 'heading4': return `<div class="book-section" id="${sectionId}" data-block="${block.id}"><h4>${content}</h4></div>`;
      case 'paragraph': return `<div class="book-section" id="${sectionId}" data-block="${block.id}"><p>${content}</p></div>`;
      case 'quote': return `<div class="book-section" id="${sectionId}" data-block="${block.id}"><blockquote>${content}</blockquote></div>`;
      case 'code': return `<div class="book-section" id="${sectionId}" data-block="${block.id}"><pre><code>${this.escapeHtml(content)}</code></pre></div>`;
      case 'math': return `<div class="book-section" id="${sectionId}" data-block="${block.id}"><div class="math-block">${content}</div></div>`;
      case 'divider': return `<div class="book-section" id="${sectionId}" data-block="${block.id}"><hr></div>`;
      case 'list-ul':
        return `<div class="book-section" id="${sectionId}" data-block="${block.id}"><ul>${content.split('\n').filter(Boolean).map(i => `<li>${i.replace(/^[•\-*]\s*/, '')}</li>`).join('')}</ul></div>`;
      case 'list-ol':
        return `<div class="book-section" id="${sectionId}" data-block="${block.id}"><ol>${content.split('\n').filter(Boolean).map(i => `<li>${i.replace(/^\d+\.\s*/, '')}</li>`).join('')}</ol></div>`;
      case 'collapsible':
        return `<div class="book-section" id="${sectionId}" data-block="${block.id}"><details><summary>${block.title || 'Details'}</summary><div>${content}</div></details></div>`;
      default:
        return `<div class="book-section" id="${sectionId}" data-block="${block.id}"><p>${content}</p></div>`;
    }
  }

  generateMediaColumn(chapter, project) {
    const mediaItems = [];

    chapter.blocks.forEach(block => {
      const links = project.mediaLinks.filter(l => l.blockId === block.id);
      links.forEach(link => {
        const media = project.media.find(m => m.id === link.mediaId);
        if (media) {
          mediaItems.push({ ...link, media, blockId: block.id });
        }
      });
    });

    if (mediaItems.length === 0) return '';

    return mediaItems.map((item, index) => `
      <div class="book-media-item ${index === 0 ? 'active' : ''}"
           data-for="${item.blockId}"
           data-trigger="${item.triggerType}"
           data-transition="${item.transition || 'fade'}">
        ${this.generateMediaContent(item.media)}
      </div>
    `).join('');
  }

  generateMediaContent(media) {
    switch (media.type) {
      case 'image':
        return `<img src="${media.data}" alt="${media.name}" loading="lazy">`;
      case 'svg':
        return media.data.startsWith('<svg') ? media.data : `<img src="${media.data}" alt="${media.name}">`;
      case 'video':
        return `<video src="${media.data}" controls preload="metadata"></video>`;
      case 'html':
        return `<div class="widget-container"><iframe srcdoc="${this.escapeAttr(this.buildWidgetHtml(media))}"></iframe></div>`;
      case 'geogebra':
        return `<iframe src="https://www.geogebra.org/material/iframe/id/${media.data}" allowfullscreen></iframe>`;
      case 'lottie':
        return `<div class="lottie-player" data-src="${this.escapeAttr(media.data)}"></div>`;
      default:
        return '';
    }
  }

  buildWidgetHtml(media) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:16px;font-family:sans-serif;}${media.css || ''}</style></head><body>${media.html || ''}<script>${media.js || ''}<\/script></body></html>`;
  }

  generateScrollScript() {
    return `
      function initScrollObserver() {
        const sections = document.querySelectorAll('.book-section');
        const mediaItems = document.querySelectorAll('.book-media-item');

        // Intersection observer for section visibility
        const sectionObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
            }
          });
        }, { threshold: 0.2, rootMargin: '-50px' });

        sections.forEach(section => sectionObserver.observe(section));

        // Media trigger observer
        const mediaObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const blockId = entry.target.dataset.block;
              updateMedia(blockId);
            }
          });
        }, { threshold: 0.5 });

        sections.forEach(section => {
          if (section.dataset.block) {
            mediaObserver.observe(section);
          }
        });

        function updateMedia(blockId) {
          const chapter = document.querySelector('.book-chapter:has([data-block="' + blockId + '"])');
          if (!chapter) return;

          const targetMedia = chapter.querySelector('.book-media-item[data-for="' + blockId + '"]');
          if (!targetMedia) return;

          chapter.querySelectorAll('.book-media-item').forEach(el => {
            el.classList.remove('active');
          });
          targetMedia.classList.add('active');
        }

        // Update nav on scroll
        const navLinks = document.querySelectorAll('.book-nav a');
        const chapters = document.querySelectorAll('.book-chapter');

        window.addEventListener('scroll', () => {
          let current = '';
          chapters.forEach(chapter => {
            const rect = chapter.getBoundingClientRect();
            if (rect.top <= 150) {
              current = chapter.id;
            }
          });

          navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
              link.classList.add('active');
            }
          });
        });
      }
    `;
  }

  getBundledLibraries() {
    // Return minimal stubs - in production, these would be full libraries
    return {
      katexCSS: '/* KaTeX CSS would be inlined here */',
      katexJS: '/* KaTeX JS would be inlined here */\nvar renderMathInElement = function() {};',
      highlightCSS: '/* Highlight.js CSS would be inlined here */',
      highlightJS: '/* Highlight.js would be inlined here */\nvar hljs = { highlightElement: function() {} };'
    };
  }

  async inlineMedia(project) {
    // Media is already base64 encoded from upload
    return project.media;
  }

  referenceMedia(project) {
    return project.media.map(m => ({
      ...m,
      data: `assets/${m.id}.${this.getExtension(m.type)}`
    }));
  }

  getExtension(type) {
    const exts = { image: 'png', svg: 'svg', video: 'mp4', html: 'html', geogebra: 'ggb', lottie: 'json' };
    return exts[type] || 'bin';
  }

  escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  escapeAttr(text) {
    if (!text) return '';
    return text.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  async downloadSingleFile(html, filename) {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace(/[^a-z0-9]/gi, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async downloadBundle(html, project) {
    // For bundle export, we'd need a zip library
    // For now, just download the HTML
    await this.downloadSingleFile(html, project.title || 'book');
  }
}

export default ExportManager;
