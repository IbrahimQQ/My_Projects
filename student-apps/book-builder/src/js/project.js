// Project Manager - Handles project data and persistence
export class ProjectManager {
  constructor() {
    this.data = null;
    this.isDirty = false;
  }

  createNew() {
    this.data = {
      id: 'project_' + Date.now(),
      title: 'Untitled Book',
      version: '1.0',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      settings: {
        title: '',
        author: '',
        description: '',
        theme: 'light',
        bgColor: '#ffffff',
        textColor: '#333333',
        accentColor: '#3498db',
        headingFont: 'Merriweather',
        bodyFont: 'Inter',
        codeFont: 'Fira Code',
        fontSize: 18,
        contentWidth: 'medium',
        mediaWidth: 'medium',
        exportFormat: 'single'
      },
      chapters: [{
        id: 'chapter_' + Date.now(),
        title: 'Introduction',
        blocks: []
      }],
      media: [],
      mediaLinks: []
    };
    return this.data;
  }

  async load(data) {
    this.data = data;
    this.data.modified = new Date().toISOString();
    this.isDirty = false;
  }

  markDirty() {
    this.isDirty = true;
    this.data.modified = new Date().toISOString();
  }

  // Chapter management
  addChapter(title = 'New Chapter') {
    const chapter = {
      id: 'chapter_' + Date.now(),
      title,
      blocks: []
    };
    this.data.chapters.push(chapter);
    this.markDirty();
    return chapter;
  }

  getChapter(id) {
    return this.data.chapters.find(c => c.id === id);
  }

  deleteChapter(id) {
    const index = this.data.chapters.findIndex(c => c.id === id);
    if (index !== -1) {
      // Remove associated media links
      this.data.chapters[index].blocks.forEach(block => {
        this.data.mediaLinks = this.data.mediaLinks.filter(l => l.blockId !== block.id);
      });
      this.data.chapters.splice(index, 1);
      this.markDirty();
    }
  }

  reorderChapters(fromIndex, toIndex) {
    const [chapter] = this.data.chapters.splice(fromIndex, 1);
    this.data.chapters.splice(toIndex, 0, chapter);
    this.markDirty();
  }

  // Block management
  addBlock(chapterId, type, content = '', afterBlockId = null) {
    const chapter = this.getChapter(chapterId);
    if (!chapter) return null;

    const block = {
      id: 'block_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      type,
      content,
      created: new Date().toISOString()
    };

    if (afterBlockId) {
      const index = chapter.blocks.findIndex(b => b.id === afterBlockId);
      chapter.blocks.splice(index + 1, 0, block);
    } else {
      chapter.blocks.push(block);
    }

    this.markDirty();
    return block;
  }

  getBlock(chapterId, blockId) {
    const chapter = this.getChapter(chapterId);
    return chapter?.blocks.find(b => b.id === blockId);
  }

  updateBlock(chapterId, blockId, updates) {
    const block = this.getBlock(chapterId, blockId);
    if (block) {
      Object.assign(block, updates);
      this.markDirty();
    }
    return block;
  }

  deleteBlock(chapterId, blockId) {
    const chapter = this.getChapter(chapterId);
    if (!chapter) return;

    const index = chapter.blocks.findIndex(b => b.id === blockId);
    if (index !== -1) {
      chapter.blocks.splice(index, 1);
      // Remove associated media links
      this.data.mediaLinks = this.data.mediaLinks.filter(l => l.blockId !== blockId);
      this.markDirty();
    }
  }

  reorderBlocks(chapterId, fromIndex, toIndex) {
    const chapter = this.getChapter(chapterId);
    if (!chapter) return;

    const [block] = chapter.blocks.splice(fromIndex, 1);
    chapter.blocks.splice(toIndex, 0, block);
    this.markDirty();
  }

  // Media management
  addMedia(media) {
    media.id = media.id || 'media_' + Date.now();
    media.created = new Date().toISOString();
    this.data.media.push(media);
    this.markDirty();
    return media;
  }

  getMedia(id) {
    return this.data.media.find(m => m.id === id);
  }

  updateMedia(id, updates) {
    const media = this.getMedia(id);
    if (media) {
      Object.assign(media, updates);
      this.markDirty();
    }
    return media;
  }

  deleteMedia(id) {
    const index = this.data.media.findIndex(m => m.id === id);
    if (index !== -1) {
      this.data.media.splice(index, 1);
      // Remove associated links
      this.data.mediaLinks = this.data.mediaLinks.filter(l => l.mediaId !== id);
      this.markDirty();
    }
  }

  getMediaByType(type) {
    if (type === 'all') return this.data.media;
    return this.data.media.filter(m => m.type === type);
  }

  // Media links
  addMediaLink(link) {
    link.id = 'link_' + Date.now();
    this.data.mediaLinks.push(link);
    this.markDirty();
    return link;
  }

  getMediaLinksForBlock(blockId) {
    return this.data.mediaLinks.filter(l => l.blockId === blockId);
  }

  getMediaLinksForMedia(mediaId) {
    return this.data.mediaLinks.filter(l => l.mediaId === mediaId);
  }

  removeMediaLink(linkId) {
    const index = this.data.mediaLinks.findIndex(l => l.id === linkId);
    if (index !== -1) {
      this.data.mediaLinks.splice(index, 1);
      this.markDirty();
    }
  }

  // Export helpers
  getAllBlocks() {
    const blocks = [];
    this.data.chapters.forEach(chapter => {
      chapter.blocks.forEach(block => {
        blocks.push({ ...block, chapterId: chapter.id, chapterTitle: chapter.title });
      });
    });
    return blocks;
  }

  getLinkedMedia(blockId) {
    const links = this.getMediaLinksForBlock(blockId);
    return links.map(link => ({
      ...link,
      media: this.getMedia(link.mediaId)
    })).filter(l => l.media);
  }
}

export default ProjectManager;
