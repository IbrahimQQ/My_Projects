// Interactive Book Builder - Main Application
import { ProjectManager } from './project.js';
import { BlockEditor } from './editor.js';
import { MediaManager } from './media.js';
import { PreviewManager } from './preview.js';
import { ExportManager } from './export.js';
import { StoryboardManager } from './storyboard.js';

class BookBuilder {
  constructor() {
    this.project = new ProjectManager();
    this.editor = new BlockEditor(this);
    this.media = new MediaManager(this);
    this.preview = new PreviewManager(this);
    this.exporter = new ExportManager(this);
    this.storyboard = new StoryboardManager(this);

    this.currentView = 'edit';
    this.currentChapter = null;

    this.init();
  }

  async init() {
    this.bindEvents();
    this.setupModals();

    // Load last project or create new
    const lastProject = localStorage.getItem('lastProject');
    if (lastProject) {
      try {
        await this.project.load(JSON.parse(lastProject));
      } catch (e) {
        console.warn('Failed to load last project:', e);
        this.project.createNew();
      }
    } else {
      this.project.createNew();
    }

    this.render();
  }

  bindEvents() {
    // View tabs
    document.querySelectorAll('.view-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchView(tab.dataset.view));
    });

    // Project name
    document.getElementById('projectName').addEventListener('change', (e) => {
      this.project.data.title = e.target.value;
      this.project.markDirty();
    });

    // Toolbar buttons
    document.getElementById('btnSave').addEventListener('click', () => this.saveProject());
    document.getElementById('btnLoad').addEventListener('click', () => this.loadProject());
    document.getElementById('btnExport').addEventListener('click', () => this.showExportModal());

    // Chapter management
    document.getElementById('addChapter').addEventListener('click', () => this.addChapter());

    // Block tools
    document.querySelectorAll('.tool-btn[data-block]').forEach(btn => {
      btn.addEventListener('click', () => this.editor.addBlock(btn.dataset.block));
    });

    // Format tools
    document.querySelectorAll('.format-btn[data-format]').forEach(btn => {
      btn.addEventListener('click', () => this.editor.formatSelection(btn.dataset.format));
    });

    // Media type buttons
    document.querySelectorAll('.media-type-btn').forEach(btn => {
      btn.addEventListener('click', () => this.media.addMediaOfType(btn.dataset.type));
    });

    // Empty state button
    document.getElementById('addFirstBlock')?.addEventListener('click', () => {
      this.editor.addBlock('heading1');
    });

    // File inputs
    document.getElementById('uploadMedia')?.addEventListener('click', () => {
      document.getElementById('fileInput').click();
    });

    document.getElementById('fileInput').addEventListener('change', (e) => {
      this.media.handleFileUpload(e.target.files);
      e.target.value = '';
    });

    document.getElementById('projectInput').addEventListener('change', async (e) => {
      if (e.target.files[0]) {
        await this.loadProjectFromFile(e.target.files[0]);
        e.target.value = '';
      }
    });

    // Drag and drop for media
    const dropZone = document.getElementById('mediaDropZone');
    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      });
      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
      });
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        this.media.handleFileUpload(e.dataTransfer.files);
      });
    }

    // Media folder navigation
    document.querySelectorAll('.folder-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.folder-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        this.media.filterByFolder(item.dataset.folder);
      });
    });

    // Widget editor
    document.getElementById('createWidget')?.addEventListener('click', () => this.showWidgetEditor());
    document.getElementById('saveWidget')?.addEventListener('click', () => this.saveWidget());

    // Widget tabs
    document.querySelectorAll('.widget-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.widget-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.code-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab + 'Panel').classList.add('active');
      });
    });

    // Preview controls
    document.getElementById('previewRefresh')?.addEventListener('click', () => this.preview.refresh());
    document.getElementById('previewDevice')?.addEventListener('change', (e) => {
      this.preview.setDevice(e.target.value);
    });
    document.getElementById('previewDarkMode')?.addEventListener('change', (e) => {
      this.preview.setDarkMode(e.target.checked);
    });

    // Settings
    this.bindSettingsEvents();

    // Export modal
    document.getElementById('startExport')?.addEventListener('click', () => this.startExport());

    // Media link modal
    document.getElementById('confirmMediaLink')?.addEventListener('click', () => this.confirmMediaLink());

    // Auto-save
    setInterval(() => this.autoSave(), 30000);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  bindSettingsEvents() {
    const settings = this.project.data.settings;

    // Theme presets
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        settings.theme = btn.dataset.theme;
        this.project.markDirty();
      });
    });

    // Font size slider
    const fontSizeSlider = document.getElementById('settingFontSize');
    const fontSizeValue = document.getElementById('fontSizeValue');
    if (fontSizeSlider) {
      fontSizeSlider.addEventListener('input', (e) => {
        fontSizeValue.textContent = e.target.value + 'px';
        settings.fontSize = parseInt(e.target.value);
        this.project.markDirty();
      });
    }

    // Other settings inputs
    ['settingTitle', 'settingAuthor', 'settingDescription', 'settingBgColor',
     'settingTextColor', 'settingAccentColor', 'settingHeadingFont', 'settingBodyFont',
     'settingCodeFont', 'settingContentWidth', 'settingMediaWidth', 'settingExportFormat'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', (e) => {
          const key = id.replace('setting', '').charAt(0).toLowerCase() + id.replace('setting', '').slice(1);
          settings[key] = e.target.value;
          this.project.markDirty();
        });
      }
    });
  }

  setupModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal(modal.id);
      });
      modal.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => this.closeModal(modal.id));
      });
    });
  }

  switchView(view) {
    this.currentView = view;

    document.querySelectorAll('.view-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.view === view);
    });

    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === view + 'View');
    });

    if (view === 'preview') {
      this.preview.refresh();
    } else if (view === 'storyboard') {
      this.storyboard.render();
    }
  }

  addChapter() {
    const chapter = this.project.addChapter('New Chapter');
    this.renderChapterList();
    this.selectChapter(chapter.id);
  }

  selectChapter(chapterId) {
    this.currentChapter = this.project.getChapter(chapterId);

    document.querySelectorAll('.chapter-item').forEach(item => {
      item.classList.toggle('active', item.dataset.id === chapterId);
    });

    this.editor.loadChapter(this.currentChapter);
    this.updateMediaLinker();
  }

  deleteChapter(chapterId) {
    if (this.project.data.chapters.length <= 1) {
      alert('Cannot delete the last chapter');
      return;
    }

    if (confirm('Delete this chapter?')) {
      this.project.deleteChapter(chapterId);
      this.renderChapterList();
      if (this.currentChapter?.id === chapterId) {
        this.selectChapter(this.project.data.chapters[0].id);
      }
    }
  }

  renderChapterList() {
    const list = document.getElementById('chapterList');
    list.innerHTML = '';

    this.project.data.chapters.forEach((chapter, index) => {
      const item = document.createElement('div');
      item.className = 'chapter-item' + (chapter.id === this.currentChapter?.id ? ' active' : '');
      item.dataset.id = chapter.id;
      item.innerHTML = `
        <span class="chapter-icon">📄</span>
        <span class="chapter-name">${chapter.title || 'Chapter ' + (index + 1)}</span>
        <div class="chapter-actions">
          <button class="chapter-action-btn" data-action="rename" title="Rename">✏️</button>
          <button class="chapter-action-btn" data-action="delete" title="Delete">🗑️</button>
        </div>
      `;

      item.addEventListener('click', (e) => {
        if (!e.target.closest('.chapter-action-btn')) {
          this.selectChapter(chapter.id);
        }
      });

      item.querySelector('[data-action="rename"]').addEventListener('click', () => {
        const newName = prompt('Chapter name:', chapter.title);
        if (newName) {
          chapter.title = newName;
          this.project.markDirty();
          this.renderChapterList();
        }
      });

      item.querySelector('[data-action="delete"]').addEventListener('click', () => {
        this.deleteChapter(chapter.id);
      });

      list.appendChild(item);
    });
  }

  updateMediaLinker() {
    const content = document.getElementById('mediaLinkerContent');
    const selectedBlock = this.editor.getSelectedBlock();

    if (!selectedBlock) {
      content.innerHTML = '<p class="helper-text">Select a content block to link media to it.</p>';
      return;
    }

    const links = this.project.getMediaLinksForBlock(selectedBlock.id);

    let html = `<p class="helper-text">Media linked to this block:</p>`;

    if (links.length === 0) {
      html += `<p class="helper-text" style="font-style: italic;">No media linked yet.</p>`;
    } else {
      links.forEach(link => {
        const media = this.project.getMedia(link.mediaId);
        if (media) {
          html += `
            <div class="media-link-card">
              <div class="link-header">
                <span class="link-title">${media.name}</span>
                <button class="block-menu-btn" data-remove="${link.id}">✕</button>
              </div>
              <div class="link-preview">
                ${this.media.getPreviewHTML(media)}
              </div>
              <div class="link-trigger">Trigger: ${link.triggerType}</div>
            </div>
          `;
        }
      });
    }

    content.innerHTML = html;

    // Bind remove buttons
    content.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.project.removeMediaLink(btn.dataset.remove);
        this.updateMediaLinker();
      });
    });
  }

  showExportModal() {
    document.getElementById('exportModal').classList.add('active');
  }

  async startExport() {
    const format = document.querySelector('input[name="exportType"]:checked').value;
    const progress = document.getElementById('exportProgress');
    const progressFill = document.getElementById('exportProgressFill');
    const status = document.getElementById('exportStatus');

    progress.style.display = 'block';
    progressFill.style.width = '0%';
    status.textContent = 'Preparing export...';

    try {
      await this.exporter.export(format, (percent, message) => {
        progressFill.style.width = percent + '%';
        status.textContent = message;
      });

      status.textContent = 'Export complete!';
      setTimeout(() => this.closeModal('exportModal'), 1500);
    } catch (e) {
      status.textContent = 'Export failed: ' + e.message;
      console.error(e);
    }
  }

  showWidgetEditor(widget = null) {
    document.getElementById('widgetHtml').value = widget?.html || '';
    document.getElementById('widgetCss').value = widget?.css || '';
    document.getElementById('widgetJs').value = widget?.js || '';
    document.getElementById('widgetEditorModal').classList.add('active');
    this.updateWidgetPreview();
  }

  updateWidgetPreview() {
    const html = document.getElementById('widgetHtml').value;
    const css = document.getElementById('widgetCss').value;
    const js = document.getElementById('widgetJs').value;

    const preview = document.getElementById('widgetPreviewFrame');
    const doc = preview.contentDocument;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head><style>${css}</style></head>
      <body>${html}<script>${js}<\/script></body>
      </html>
    `);
    doc.close();
  }

  saveWidget() {
    const widget = {
      id: 'widget_' + Date.now(),
      name: 'Custom Widget',
      type: 'html',
      html: document.getElementById('widgetHtml').value,
      css: document.getElementById('widgetCss').value,
      js: document.getElementById('widgetJs').value
    };

    this.project.addMedia(widget);
    this.media.render();
    this.closeModal('widgetEditorModal');
  }

  showMediaLinkModal(blockId, mediaId) {
    this.pendingLink = { blockId, mediaId };
    document.getElementById('mediaLinkModal').classList.add('active');
  }

  confirmMediaLink() {
    if (!this.pendingLink) return;

    const link = {
      blockId: this.pendingLink.blockId,
      mediaId: this.pendingLink.mediaId,
      triggerType: document.getElementById('linkTriggerType').value,
      transition: document.getElementById('linkTransition').value,
      duration: parseInt(document.getElementById('linkDuration').value)
    };

    this.project.addMediaLink(link);
    this.closeModal('mediaLinkModal');
    this.updateMediaLinker();
    this.pendingLink = null;
  }

  closeModal(id) {
    document.getElementById(id).classList.remove('active');
  }

  async saveProject() {
    const data = JSON.stringify(this.project.data);
    localStorage.setItem('lastProject', data);

    // Also offer download
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (this.project.data.title || 'untitled') + '.bookproject.json';
    a.click();
    URL.revokeObjectURL(url);

    this.project.isDirty = false;
    alert('Project saved!');
  }

  loadProject() {
    document.getElementById('projectInput').click();
  }

  async loadProjectFromFile(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await this.project.load(data);
      localStorage.setItem('lastProject', text);
      this.render();
    } catch (e) {
      alert('Failed to load project: ' + e.message);
    }
  }

  autoSave() {
    if (this.project.isDirty) {
      localStorage.setItem('lastProject', JSON.stringify(this.project.data));
      console.log('Auto-saved');
    }
  }

  handleKeyboard(e) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          this.saveProject();
          break;
        case 'b':
          e.preventDefault();
          this.editor.formatSelection('bold');
          break;
        case 'i':
          e.preventDefault();
          this.editor.formatSelection('italic');
          break;
      }
    }
  }

  render() {
    document.getElementById('projectName').value = this.project.data.title || 'Untitled Book';
    this.renderChapterList();

    if (this.project.data.chapters.length > 0) {
      this.selectChapter(this.currentChapter?.id || this.project.data.chapters[0].id);
    }

    this.media.render();
    this.applySettings();
  }

  applySettings() {
    const s = this.project.data.settings;

    // Apply to settings UI
    document.getElementById('settingTitle').value = s.title || '';
    document.getElementById('settingAuthor').value = s.author || '';
    document.getElementById('settingDescription').value = s.description || '';
    document.getElementById('settingBgColor').value = s.bgColor || '#ffffff';
    document.getElementById('settingTextColor').value = s.textColor || '#333333';
    document.getElementById('settingAccentColor').value = s.accentColor || '#3498db';
    document.getElementById('settingFontSize').value = s.fontSize || 18;
    document.getElementById('fontSizeValue').textContent = (s.fontSize || 18) + 'px';

    // Apply theme selection
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === (s.theme || 'light'));
    });
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.bookBuilder = new BookBuilder();
});
