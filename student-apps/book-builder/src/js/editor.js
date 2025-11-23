// Block Editor - WYSIWYG content editing
export class BlockEditor {
  constructor(app) {
    this.app = app;
    this.chapter = null;
    this.selectedBlockId = null;
  }

  loadChapter(chapter) {
    this.chapter = chapter;
    this.selectedBlockId = null;
    this.render();
  }

  render() {
    const canvas = document.getElementById('editorCanvas');
    const emptyState = document.getElementById('emptyState');

    if (!this.chapter || this.chapter.blocks.length === 0) {
      canvas.innerHTML = '';
      if (emptyState) {
        emptyState.style.display = 'flex';
        canvas.appendChild(emptyState);
      }
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    canvas.innerHTML = this.chapter.blocks.map(block => this.renderBlock(block)).join('');

    // Bind block events
    canvas.querySelectorAll('.content-block').forEach(el => {
      const blockId = el.dataset.id;

      el.addEventListener('click', () => this.selectBlock(blockId));

      const content = el.querySelector('.block-content');
      if (content) {
        content.addEventListener('input', () => {
          this.updateBlockContent(blockId, content.innerHTML);
        });

        content.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey && !['code', 'quote'].includes(el.dataset.type)) {
            e.preventDefault();
            this.addBlockAfter(blockId, 'paragraph');
          } else if (e.key === 'Backspace' && content.textContent === '') {
            e.preventDefault();
            this.deleteBlock(blockId);
          }
        });
      }

      // Block menu actions
      el.querySelector('[data-action="delete"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteBlock(blockId);
      });

      el.querySelector('[data-action="duplicate"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.duplicateBlock(blockId);
      });

      el.querySelector('[data-action="link"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showMediaLinkOptions(blockId);
      });

      // Collapsible toggle
      el.querySelector('.collapsible-header')?.addEventListener('click', () => {
        el.querySelector('.collapsible-header').classList.toggle('collapsed');
        el.querySelector('.collapsible-body').classList.toggle('hidden');
      });
    });

    // Render math equations
    if (window.renderMathInElement) {
      canvas.querySelectorAll('.block-math .block-content').forEach(el => {
        window.renderMathInElement(el, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      });
    }

    // Highlight code blocks
    if (window.hljs) {
      canvas.querySelectorAll('.block-code .block-content').forEach(el => {
        window.hljs.highlightElement(el);
      });
    }
  }

  renderBlock(block) {
    const hasMedia = this.app.project.getMediaLinksForBlock(block.id).length > 0;
    const isSelected = block.id === this.selectedBlockId;

    const typeClass = `block-${block.type.replace(/[0-9]/g, '')}`;
    const placeholder = this.getPlaceholder(block.type);

    let content = '';
    switch (block.type) {
      case 'divider':
        content = '<hr>';
        break;
      case 'collapsible':
        content = `
          <div class="collapsible-header">
            <span class="collapsible-icon">▼</span>
            <span contenteditable="true" class="collapsible-title">${block.title || 'Click to expand'}</span>
          </div>
          <div class="collapsible-body">
            <div contenteditable="true" data-placeholder="Collapsible content...">${block.content || ''}</div>
          </div>
        `;
        break;
      default:
        content = `<div class="block-content" contenteditable="true" data-placeholder="${placeholder}">${block.content || ''}</div>`;
    }

    return `
      <div class="content-block ${typeClass} ${isSelected ? 'selected' : ''} ${hasMedia ? 'has-media' : ''}"
           data-id="${block.id}" data-type="${block.type}">
        <div class="block-handle">⋮⋮</div>
        ${content}
        <div class="block-menu">
          <button class="block-menu-btn" data-action="link" title="Link Media">🔗</button>
          <button class="block-menu-btn" data-action="duplicate" title="Duplicate">📋</button>
          <button class="block-menu-btn" data-action="delete" title="Delete">🗑️</button>
        </div>
        ${hasMedia ? '<div class="media-indicator">🖼️</div>' : ''}
      </div>
    `;
  }

  getPlaceholder(type) {
    const placeholders = {
      heading1: 'Heading 1',
      heading2: 'Heading 2',
      heading3: 'Heading 3',
      heading4: 'Heading 4',
      paragraph: 'Start typing...',
      quote: 'Enter a quote...',
      code: 'Enter code...',
      math: '$$E = mc^2$$',
      'list-ul': '• Item',
      'list-ol': '1. Item'
    };
    return placeholders[type] || 'Enter content...';
  }

  addBlock(type) {
    if (!this.chapter) return;

    const block = this.app.project.addBlock(this.chapter.id, type, '', this.selectedBlockId);
    this.selectedBlockId = block.id;
    this.render();
    this.focusBlock(block.id);
  }

  addBlockAfter(afterId, type) {
    if (!this.chapter) return;

    const block = this.app.project.addBlock(this.chapter.id, type, '', afterId);
    this.selectedBlockId = block.id;
    this.render();
    this.focusBlock(block.id);
  }

  updateBlockContent(blockId, content) {
    if (!this.chapter) return;
    this.app.project.updateBlock(this.chapter.id, blockId, { content });
  }

  deleteBlock(blockId) {
    if (!this.chapter) return;

    const blocks = this.chapter.blocks;
    const index = blocks.findIndex(b => b.id === blockId);

    this.app.project.deleteBlock(this.chapter.id, blockId);

    // Select adjacent block
    if (blocks.length > 0) {
      const newIndex = Math.min(index, blocks.length - 1);
      this.selectedBlockId = blocks[newIndex]?.id;
    } else {
      this.selectedBlockId = null;
    }

    this.render();
    this.app.updateMediaLinker();
  }

  duplicateBlock(blockId) {
    if (!this.chapter) return;

    const original = this.app.project.getBlock(this.chapter.id, blockId);
    if (!original) return;

    const block = this.app.project.addBlock(this.chapter.id, original.type, original.content, blockId);
    this.selectedBlockId = block.id;
    this.render();
  }

  selectBlock(blockId) {
    this.selectedBlockId = blockId;

    document.querySelectorAll('.content-block').forEach(el => {
      el.classList.toggle('selected', el.dataset.id === blockId);
    });

    this.app.updateMediaLinker();
  }

  getSelectedBlock() {
    if (!this.chapter || !this.selectedBlockId) return null;
    return this.app.project.getBlock(this.chapter.id, this.selectedBlockId);
  }

  focusBlock(blockId) {
    setTimeout(() => {
      const block = document.querySelector(`.content-block[data-id="${blockId}"]`);
      const content = block?.querySelector('.block-content');
      if (content) {
        content.focus();
        // Place cursor at end
        const range = document.createRange();
        range.selectNodeContents(content);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }, 10);
  }

  formatSelection(format) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    switch (format) {
      case 'bold':
        document.execCommand('bold');
        break;
      case 'italic':
        document.execCommand('italic');
        break;
      case 'code':
        const range = selection.getRangeAt(0);
        const code = document.createElement('code');
        code.appendChild(range.extractContents());
        range.insertNode(code);
        break;
      case 'link':
        const url = prompt('Enter URL:');
        if (url) {
          document.execCommand('createLink', false, url);
        }
        break;
    }
  }

  showMediaLinkOptions(blockId) {
    // Show available media to link
    const media = this.app.project.data.media;
    if (media.length === 0) {
      alert('No media available. Upload media first in the Media tab.');
      return;
    }

    // For simplicity, show a basic selection
    const mediaNames = media.map((m, i) => `${i + 1}. ${m.name}`).join('\n');
    const choice = prompt(`Select media to link (enter number):\n${mediaNames}`);

    if (choice) {
      const index = parseInt(choice) - 1;
      if (index >= 0 && index < media.length) {
        this.app.showMediaLinkModal(blockId, media[index].id);
      }
    }
  }
}

export default BlockEditor;
