// Media Manager - Handles media assets
export class MediaManager {
  constructor(app) {
    this.app = app;
    this.currentFolder = 'all';
    this.selectedMediaId = null;
  }

  render() {
    this.renderGrid();
  }

  renderGrid() {
    const grid = document.getElementById('mediaGrid');
    const dropZone = document.getElementById('mediaDropZone');
    const media = this.getFilteredMedia();

    if (media.length === 0) {
      grid.innerHTML = '';
      if (dropZone) {
        grid.appendChild(dropZone);
      }
      return;
    }

    grid.innerHTML = media.map(item => `
      <div class="media-item ${item.id === this.selectedMediaId ? 'selected' : ''}" data-id="${item.id}">
        <div class="media-item-preview">
          ${this.getPreviewHTML(item)}
        </div>
        <div class="media-item-info">
          <div class="media-item-name">${item.name}</div>
          <div class="media-item-type">${item.type}</div>
        </div>
      </div>
    `).join('');

    if (dropZone) {
      grid.appendChild(dropZone);
    }

    // Bind events
    grid.querySelectorAll('.media-item').forEach(el => {
      el.addEventListener('click', () => this.selectMedia(el.dataset.id));
      el.addEventListener('dblclick', () => this.useMedia(el.dataset.id));
    });
  }

  getFilteredMedia() {
    const searchQuery = document.getElementById('mediaSearch')?.value?.toLowerCase() || '';
    let media = this.app.project.getMediaByType(this.currentFolder === 'all' ? 'all' : this.getFolderType(this.currentFolder));

    if (searchQuery) {
      media = media.filter(m => m.name.toLowerCase().includes(searchQuery));
    }

    return media;
  }

  getFolderType(folder) {
    const map = {
      images: 'image',
      svgs: 'svg',
      videos: 'video',
      html: 'html',
      geogebra: 'geogebra',
      lottie: 'lottie'
    };
    return map[folder] || folder;
  }

  filterByFolder(folder) {
    this.currentFolder = folder;
    this.renderGrid();
  }

  getPreviewHTML(item) {
    switch (item.type) {
      case 'image':
        return `<img src="${item.data}" alt="${item.name}">`;
      case 'svg':
        if (item.data.startsWith('<svg')) {
          return item.data;
        }
        return `<img src="${item.data}" alt="${item.name}">`;
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

  selectMedia(mediaId) {
    this.selectedMediaId = mediaId;
    this.renderGrid();
    this.showPreview(mediaId);
  }

  showPreview(mediaId) {
    const media = this.app.project.getMedia(mediaId);
    if (!media) return;

    const previewContent = document.getElementById('mediaPreviewContent');
    const details = document.getElementById('mediaDetails');

    previewContent.innerHTML = this.getFullPreviewHTML(media);

    details.innerHTML = `
      <div class="setting-row">
        <label>Name</label>
        <input type="text" value="${media.name}" id="mediaNameInput">
      </div>
      <div class="setting-row">
        <label>Type</label>
        <span>${media.type}</span>
      </div>
      <div class="setting-row">
        <button class="btn btn-secondary" id="deleteMediaBtn">Delete</button>
      </div>
    `;

    document.getElementById('mediaNameInput')?.addEventListener('change', (e) => {
      this.app.project.updateMedia(mediaId, { name: e.target.value });
      this.renderGrid();
    });

    document.getElementById('deleteMediaBtn')?.addEventListener('click', () => {
      if (confirm('Delete this media?')) {
        this.app.project.deleteMedia(mediaId);
        this.selectedMediaId = null;
        this.render();
        previewContent.innerHTML = '<p class="helper-text">Select a media item to preview</p>';
        details.innerHTML = '';
      }
    });
  }

  getFullPreviewHTML(media) {
    switch (media.type) {
      case 'image':
        return `<img src="${media.data}" alt="${media.name}" style="max-width:100%;max-height:100%;object-fit:contain;">`;
      case 'svg':
        if (media.data.startsWith('<svg')) {
          return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">${media.data}</div>`;
        }
        return `<img src="${media.data}" alt="${media.name}" style="max-width:100%;max-height:100%;object-fit:contain;">`;
      case 'video':
        return `<video src="${media.data}" controls style="max-width:100%;max-height:100%;"></video>`;
      case 'html':
        return `<iframe srcdoc="${this.escapeHtml(this.buildWidgetHtml(media))}" style="width:100%;height:100%;border:none;"></iframe>`;
      default:
        return `<div class="media-icon" style="font-size:60px;">${this.getTypeIcon(media.type)}</div>`;
    }
  }

  getTypeIcon(type) {
    const icons = {
      image: '🖼️',
      svg: '📐',
      video: '🎬',
      html: '🧩',
      geogebra: '📊',
      lottie: '✨'
    };
    return icons[type] || '📄';
  }

  buildWidgetHtml(media) {
    return `<!DOCTYPE html><html><head><style>${media.css || ''}</style></head><body>${media.html || ''}<script>${media.js || ''}<\/script></body></html>`;
  }

  escapeHtml(html) {
    return html.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  useMedia(mediaId) {
    const selectedBlock = this.app.editor.getSelectedBlock();
    if (selectedBlock) {
      this.app.showMediaLinkModal(selectedBlock.id, mediaId);
    } else {
      alert('Please select a content block first in the Edit view.');
    }
  }

  async handleFileUpload(files) {
    for (const file of files) {
      try {
        const media = await this.processFile(file);
        this.app.project.addMedia(media);
      } catch (e) {
        console.error('Failed to process file:', file.name, e);
      }
    }
    this.render();
  }

  async processFile(file) {
    const type = this.getFileType(file);
    const name = file.name;

    let data;
    if (type === 'html' || type === 'svg') {
      data = await file.text();
    } else {
      data = await this.fileToDataURL(file);
    }

    return { name, type, data };
  }

  getFileType(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    const mimeType = file.type;

    if (mimeType.startsWith('image/svg') || ext === 'svg') return 'svg';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (ext === 'json' && file.name.includes('lottie')) return 'lottie';
    if (ext === 'json') return 'lottie'; // Assume JSON is Lottie
    if (ext === 'ggb') return 'geogebra';
    if (ext === 'html') return 'html';

    return 'image'; // Default
  }

  fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  addMediaOfType(type) {
    switch (type) {
      case 'image':
      case 'svg':
      case 'video':
        document.getElementById('fileInput').click();
        break;
      case 'html':
        this.app.showWidgetEditor();
        break;
      case 'geogebra':
        this.addGeoGebraPrompt();
        break;
      case 'lottie':
        document.getElementById('fileInput').click();
        break;
    }
  }

  addGeoGebraPrompt() {
    const url = prompt('Enter GeoGebra material ID or URL (e.g., "abc123" or "https://www.geogebra.org/m/abc123"):');
    if (!url) return;

    const materialId = url.includes('geogebra.org') ? url.split('/').pop() : url;

    const media = {
      name: `GeoGebra: ${materialId}`,
      type: 'geogebra',
      data: materialId,
      embedUrl: `https://www.geogebra.org/material/iframe/id/${materialId}`
    };

    this.app.project.addMedia(media);
    this.render();
  }
}

export default MediaManager;
