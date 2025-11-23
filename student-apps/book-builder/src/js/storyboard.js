// Storyboard Manager - Visual timeline of content-media relationships
export class StoryboardManager {
  constructor(app) {
    this.app = app;
  }

  render() {
    const timeline = document.getElementById('storyboardTimeline');
    if (!timeline) return;

    const project = this.app.project.data;
    let html = '';

    project.chapters.forEach((chapter, chapterIndex) => {
      html += `
        <div class="storyboard-chapter">
          <h3 class="storyboard-chapter-title">
            <span class="chapter-number">${chapterIndex + 1}</span>
            ${chapter.title}
          </h3>
          <div class="storyboard-blocks">
      `;

      chapter.blocks.forEach((block, blockIndex) => {
        const links = project.mediaLinks.filter(l => l.blockId === block.id);
        const linkedMedia = links.map(link => project.media.find(m => m.id === link.mediaId)).filter(Boolean);

        html += this.renderTimelineItem(block, linkedMedia, links);
      });

      html += `
          </div>
        </div>
      `;
    });

    if (!html) {
      html = `
        <div class="empty-state">
          <div class="empty-icon">🎬</div>
          <h3>No Content Yet</h3>
          <p>Add content blocks in the Edit view to see them here.</p>
        </div>
      `;
    }

    timeline.innerHTML = html;

    // Add storyboard-specific styles if not present
    this.injectStyles();

    // Bind events
    timeline.querySelectorAll('.timeline-item').forEach(item => {
      item.addEventListener('click', () => {
        const blockId = item.dataset.blockId;
        const chapterId = item.dataset.chapterId;
        this.app.selectChapter(chapterId);
        this.app.editor.selectBlock(blockId);
        this.app.switchView('edit');
      });
    });

    timeline.querySelectorAll('.timeline-unlink').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const linkId = btn.dataset.linkId;
        this.app.project.removeMediaLink(linkId);
        this.render();
      });
    });

    timeline.querySelectorAll('.timeline-add-media').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = btn.dataset.blockId;
        this.app.editor.showMediaLinkOptions(blockId);
      });
    });
  }

  renderTimelineItem(block, linkedMedia, links) {
    const preview = this.getBlockPreview(block);
    const typeLabel = this.getTypeLabel(block.type);
    const hasMedia = linkedMedia.length > 0;
    const chapterId = this.getChapterIdForBlock(block.id);

    let mediaHTML = '';
    if (hasMedia) {
      mediaHTML = linkedMedia.map((media, i) => {
        const link = links[i];
        return `
          <div class="timeline-media-item">
            <div class="timeline-media-preview">
              ${this.getMediaPreviewHTML(media)}
            </div>
            <div class="timeline-media-info">
              <span class="media-name">${media.name}</span>
              <span class="media-trigger">${link?.triggerType || 'onEnter'}</span>
            </div>
            <button class="timeline-unlink" data-link-id="${link?.id}" title="Unlink">✕</button>
          </div>
        `;
      }).join('');
    } else {
      mediaHTML = `
        <div class="timeline-no-media">
          <button class="timeline-add-media" data-block-id="${block.id}">
            <span>+</span> Link Media
          </button>
        </div>
      `;
    }

    return `
      <div class="timeline-item ${hasMedia ? 'has-media' : ''}" data-block-id="${block.id}" data-chapter-id="${chapterId}">
        <div class="timeline-content">
          <div class="timeline-content-header">
            <span class="timeline-type-badge">${typeLabel}</span>
          </div>
          <div class="timeline-content-preview">${preview}</div>
        </div>
        <div class="timeline-connector">
          <div class="connector-line"></div>
          <div class="connector-dot ${hasMedia ? 'connected' : ''}"></div>
          <div class="connector-line"></div>
        </div>
        <div class="timeline-media">
          ${mediaHTML}
        </div>
      </div>
    `;
  }

  getChapterIdForBlock(blockId) {
    for (const chapter of this.app.project.data.chapters) {
      if (chapter.blocks.find(b => b.id === blockId)) {
        return chapter.id;
      }
    }
    return null;
  }

  getBlockPreview(block) {
    const content = block.content || '';
    const text = content.replace(/<[^>]*>/g, '').substring(0, 100);
    return text + (text.length >= 100 ? '...' : '') || '(empty)';
  }

  getTypeLabel(type) {
    const labels = {
      heading1: 'H1',
      heading2: 'H2',
      heading3: 'H3',
      heading4: 'H4',
      paragraph: 'P',
      quote: 'Quote',
      code: 'Code',
      math: 'Math',
      divider: '—',
      'list-ul': 'List',
      'list-ol': 'List',
      collapsible: 'Collapse'
    };
    return labels[type] || type;
  }

  getMediaPreviewHTML(media) {
    switch (media.type) {
      case 'image':
        return `<img src="${media.data}" alt="${media.name}">`;
      case 'svg':
        if (media.data.startsWith('<svg')) {
          return `<div class="svg-preview">${media.data}</div>`;
        }
        return `<img src="${media.data}" alt="${media.name}">`;
      case 'video':
        return `<div class="media-icon">🎬</div>`;
      case 'html':
        return `<div class="media-icon">🧩</div>`;
      case 'geogebra':
        return `<div class="media-icon">📊</div>`;
      case 'lottie':
        return `<div class="media-icon">✨</div>`;
      default:
        return `<div class="media-icon">📄</div>`;
    }
  }

  injectStyles() {
    if (document.getElementById('storyboard-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'storyboard-styles';
    styles.textContent = `
      .storyboard-chapter {
        margin-bottom: 32px;
      }

      .storyboard-chapter-title {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 2px solid var(--border-color);
      }

      .chapter-number {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--primary);
        color: white;
        border-radius: 50%;
        font-size: 14px;
        font-weight: 600;
      }

      .storyboard-blocks {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .timeline-item {
        display: flex;
        align-items: stretch;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        overflow: hidden;
        cursor: pointer;
        transition: var(--transition);
      }

      .timeline-item:hover {
        border-color: var(--primary);
        box-shadow: var(--shadow);
      }

      .timeline-item.has-media {
        border-left: 3px solid var(--success);
      }

      .timeline-content {
        flex: 1;
        padding: 16px;
        min-width: 0;
      }

      .timeline-content-header {
        margin-bottom: 8px;
      }

      .timeline-type-badge {
        display: inline-block;
        padding: 2px 8px;
        background: var(--bg-secondary);
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
      }

      .timeline-content-preview {
        font-size: 14px;
        color: var(--text-primary);
        line-height: 1.5;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .timeline-connector {
        width: 60px;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px 0;
        background: var(--bg-secondary);
      }

      .connector-line {
        width: 2px;
        flex: 1;
        background: var(--border-color);
      }

      .connector-dot {
        width: 16px;
        height: 16px;
        background: var(--border-color);
        border-radius: 50%;
        margin: 8px 0;
        transition: var(--transition);
      }

      .connector-dot.connected {
        background: var(--success);
        box-shadow: 0 0 0 4px rgba(39, 174, 96, 0.2);
      }

      .timeline-media {
        width: 200px;
        padding: 12px;
        background: var(--bg-secondary);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .timeline-media-item {
        position: relative;
        background: var(--bg-primary);
        border-radius: var(--radius-sm);
        overflow: hidden;
      }

      .timeline-media-preview {
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-tertiary);
        overflow: hidden;
      }

      .timeline-media-preview img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }

      .timeline-media-preview .svg-preview {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .timeline-media-preview .svg-preview svg {
        max-width: 100%;
        max-height: 100%;
      }

      .timeline-media-preview .media-icon {
        font-size: 32px;
        opacity: 0.5;
      }

      .timeline-media-info {
        padding: 8px;
        font-size: 11px;
      }

      .timeline-media-info .media-name {
        display: block;
        font-weight: 500;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .timeline-media-info .media-trigger {
        color: var(--text-muted);
      }

      .timeline-unlink {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 20px;
        height: 20px;
        border: none;
        background: rgba(0,0,0,0.5);
        color: white;
        border-radius: 50%;
        font-size: 12px;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s;
      }

      .timeline-media-item:hover .timeline-unlink {
        opacity: 1;
      }

      .timeline-no-media {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        min-height: 80px;
      }

      .timeline-add-media {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border: 1px dashed var(--border-color);
        background: transparent;
        color: var(--text-secondary);
        border-radius: var(--radius);
        font-size: 12px;
        cursor: pointer;
        transition: var(--transition);
      }

      .timeline-add-media:hover {
        border-color: var(--primary);
        color: var(--primary);
        background: rgba(52, 152, 219, 0.05);
      }

      .timeline-add-media span {
        font-size: 16px;
        font-weight: 600;
      }
    `;

    document.head.appendChild(styles);
  }
}

export default StoryboardManager;
