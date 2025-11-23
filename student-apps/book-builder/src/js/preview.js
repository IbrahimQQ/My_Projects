// Preview Manager - Live preview of the book
export class PreviewManager {
  constructor(app) {
    this.app = app;
    this.device = 'desktop';
    this.darkMode = false;
  }

  refresh() {
    const frame = document.getElementById('previewFrame');
    if (!frame) return;

    const html = this.generatePreviewHTML();
    frame.srcdoc = html;

    // Apply device class
    frame.className = 'preview-frame ' + this.device;
  }

  setDevice(device) {
    this.device = device;
    const frame = document.getElementById('previewFrame');
    if (frame) {
      frame.className = 'preview-frame ' + device;
    }
  }

  setDarkMode(enabled) {
    this.darkMode = enabled;
    this.refresh();
  }

  generatePreviewHTML() {
    const project = this.app.project.data;
    const settings = project.settings;
    const themeClass = this.darkMode ? 'dark' : (settings.theme || 'light');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${settings.title || project.title || 'Preview'}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
  <style>
    ${this.generateStyles(settings)}
  </style>
</head>
<body>
  <div class="book-container ${themeClass}">
    ${this.generateHeader(project, settings)}
    ${this.generateNav(project)}
    ${this.generateChapters(project)}
  </div>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script>
    ${this.generateScript()}
  </script>
</body>
</html>`;
  }

  generateStyles(settings) {
    const contentWidth = { narrow: '500px', medium: '600px', wide: '700px' }[settings.contentWidth] || '600px';
    const mediaWidth = { narrow: '400px', medium: '500px', wide: '600px' }[settings.mediaWidth] || '500px';

    return `
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

      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Fira+Code&display=swap');

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
        padding: 60px 40px;
        text-align: center;
        background: linear-gradient(135deg, var(--book-accent), #2c3e50);
        color: white;
      }

      .book-header h1 {
        font-family: var(--book-heading-font);
        font-size: 2.5em;
        font-weight: 700;
        margin-bottom: 10px;
      }

      .book-header .author {
        font-size: 1.1em;
        opacity: 0.9;
      }

      .book-nav {
        position: sticky;
        top: 0;
        background: var(--book-bg);
        border-bottom: 1px solid #eee;
        padding: 12px 40px;
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
        color: var(--book-text);
        text-decoration: none;
        font-size: 0.9em;
        font-weight: 500;
      }

      .book-nav a:hover { color: var(--book-accent); }

      .book-chapter {
        display: flex;
        max-width: calc(var(--book-content-width) + var(--book-media-width) + 80px);
        margin: 0 auto;
        padding: 60px 40px;
        gap: 60px;
      }

      .book-content {
        flex: 0 0 var(--book-content-width);
        max-width: var(--book-content-width);
      }

      .book-media {
        flex: 0 0 var(--book-media-width);
        max-width: var(--book-media-width);
        position: sticky;
        top: 80px;
        height: fit-content;
      }

      .book-content-block {
        margin-bottom: 2em;
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.5s ease, transform 0.5s ease;
      }

      .book-content-block.visible {
        opacity: 1;
        transform: translateY(0);
      }

      .book-content-block h1, .book-content-block h2, .book-content-block h3, .book-content-block h4 {
        font-family: var(--book-heading-font);
        margin-bottom: 0.5em;
      }

      .book-content-block h1 { font-size: 2em; font-weight: 700; }
      .book-content-block h2 { font-size: 1.6em; font-weight: 600; }
      .book-content-block h3 { font-size: 1.3em; font-weight: 600; }
      .book-content-block h4 { font-size: 1.1em; font-weight: 600; }

      .book-content-block p { margin-bottom: 1em; }

      .book-content-block blockquote {
        border-left: 4px solid var(--book-accent);
        padding-left: 1.5em;
        margin: 1.5em 0;
        font-style: italic;
        color: #666;
      }

      .book-content-block ul, .book-content-block ol {
        margin: 1em 0;
        padding-left: 2em;
      }

      .book-content-block li { margin-bottom: 0.5em; }

      .book-content-block pre {
        background: #1e1e1e;
        color: #d4d4d4;
        padding: 1.5em;
        border-radius: 8px;
        overflow-x: auto;
        font-family: var(--book-code-font);
        font-size: 0.85em;
      }

      .book-content-block code {
        font-family: var(--book-code-font);
        background: #f5f5f5;
        padding: 0.2em 0.4em;
        border-radius: 4px;
        font-size: 0.9em;
      }

      .book-content-block pre code {
        background: none;
        padding: 0;
      }

      .book-content-block hr {
        border: none;
        border-top: 2px solid #eee;
        margin: 2em 0;
      }

      .book-media-item {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.5s ease;
      }

      .book-media-item.active {
        position: relative;
        opacity: 1;
        visibility: visible;
      }

      .book-media-item img, .book-media-item video {
        max-width: 100%;
        border-radius: 8px;
      }

      .book-media-item iframe {
        width: 100%;
        min-height: 400px;
        border: none;
        border-radius: 8px;
      }

      @media (max-width: 1024px) {
        .book-chapter {
          flex-direction: column;
          padding: 40px 20px;
          gap: 40px;
        }
        .book-content, .book-media {
          flex: none;
          max-width: 100%;
          position: relative;
          top: auto;
        }
        .book-media { order: -1; }
        .book-media-item { position: relative; }
      }

      @media print {
        .book-nav, .book-media { display: none; }
        .book-chapter { max-width: 100%; }
        .book-content { max-width: 100%; }
        .book-content-block { opacity: 1; transform: none; }
      }
    `;
  }

  generateHeader(project, settings) {
    return `
      <header class="book-header">
        <h1>${settings.title || project.title || 'Interactive Book'}</h1>
        ${settings.author ? `<p class="author">by ${settings.author}</p>` : ''}
      </header>
    `;
  }

  generateNav(project) {
    const links = project.chapters.map(ch =>
      `<li><a href="#${ch.id}">${ch.title}</a></li>`
    ).join('');

    return `
      <nav class="book-nav">
        <ul>${links}</ul>
      </nav>
    `;
  }

  generateChapters(project) {
    return project.chapters.map(chapter => this.generateChapter(chapter, project)).join('');
  }

  generateChapter(chapter, project) {
    const contentHTML = chapter.blocks.map(block =>
      this.generateBlock(block, project)
    ).join('');

    const mediaHTML = this.generateMediaColumn(chapter, project);

    return `
      <section class="book-chapter" id="${chapter.id}">
        <div class="book-content">
          ${contentHTML}
        </div>
        <div class="book-media">
          ${mediaHTML}
        </div>
      </section>
    `;
  }

  generateBlock(block, project) {
    let content = block.content || '';
    let tag = 'div';

    switch (block.type) {
      case 'heading1': tag = 'h1'; break;
      case 'heading2': tag = 'h2'; break;
      case 'heading3': tag = 'h3'; break;
      case 'heading4': tag = 'h4'; break;
      case 'paragraph': tag = 'p'; break;
      case 'quote': return `<blockquote>${content}</blockquote>`;
      case 'code': return `<pre><code>${this.escapeHtml(content)}</code></pre>`;
      case 'math': return `<div class="math-block">${content}</div>`;
      case 'divider': return '<hr>';
      case 'list-ul':
        return `<ul>${content.split('\n').filter(Boolean).map(i => `<li>${i.replace(/^[•\-*]\s*/, '')}</li>`).join('')}</ul>`;
      case 'list-ol':
        return `<ol>${content.split('\n').filter(Boolean).map(i => `<li>${i.replace(/^\d+\.\s*/, '')}</li>`).join('')}</ol>`;
    }

    return `<div class="book-content-block" data-block="${block.id}"><${tag}>${content}</${tag}></div>`;
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

    if (mediaItems.length === 0) {
      return '<div class="book-media-placeholder"></div>';
    }

    return mediaItems.map((item, index) => {
      const isFirst = index === 0;
      return `
        <div class="book-media-item ${isFirst ? 'active' : ''}" data-for="${item.blockId}" data-trigger="${item.triggerType}">
          ${this.generateMediaContent(item.media)}
        </div>
      `;
    }).join('');
  }

  generateMediaContent(media) {
    switch (media.type) {
      case 'image':
        return `<img src="${media.data}" alt="${media.name}">`;
      case 'svg':
        return media.data.startsWith('<svg') ? media.data : `<img src="${media.data}" alt="${media.name}">`;
      case 'video':
        return `<video src="${media.data}" controls></video>`;
      case 'html':
        return `<iframe srcdoc="${this.escapeAttr(this.buildWidgetHtml(media))}"></iframe>`;
      case 'geogebra':
        return `<iframe src="${media.embedUrl || `https://www.geogebra.org/material/iframe/id/${media.data}`}"></iframe>`;
      case 'lottie':
        return `<div class="lottie-container" data-animation="${this.escapeAttr(media.data)}"></div>`;
      default:
        return `<div>Unsupported media type</div>`;
    }
  }

  buildWidgetHtml(media) {
    return `<!DOCTYPE html><html><head><style>${media.css || ''}</style></head><body>${media.html || ''}<script>${media.js || ''}<\/script></body></html>`;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  escapeAttr(text) {
    return text.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  generateScript() {
    return `
      // Initialize KaTeX
      document.addEventListener('DOMContentLoaded', function() {
        if (window.renderMathInElement) {
          renderMathInElement(document.body, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false }
            ],
            throwOnError: false
          });
        }

        // Highlight code
        if (window.hljs) {
          document.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
        }

        // Scroll-triggered animations
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');

              // Update media
              const blockId = entry.target.dataset.block;
              if (blockId) {
                updateMedia(blockId);
              }
            }
          });
        }, { threshold: 0.3 });

        document.querySelectorAll('.book-content-block').forEach(el => observer.observe(el));

        function updateMedia(blockId) {
          const chapter = document.querySelector('.book-chapter:has([data-block="' + blockId + '"])');
          if (!chapter) return;

          const mediaContainer = chapter.querySelector('.book-media');
          const targetMedia = mediaContainer.querySelector('[data-for="' + blockId + '"]');

          if (targetMedia) {
            mediaContainer.querySelectorAll('.book-media-item').forEach(el => el.classList.remove('active'));
            targetMedia.classList.add('active');
          }
        }
      });
    `;
  }
}

export default PreviewManager;
