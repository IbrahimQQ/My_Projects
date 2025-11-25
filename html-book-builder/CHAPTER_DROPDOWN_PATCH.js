// Block Editor Updates - Add after line 10 in init()

// Chapter dropdown
this.chapterDropdown = document.getElementById('chapterDropdown');
this.addChapterBtnToolbar = document.getElementById('addChapterBtnToolbar');

// Replace chapter sidebar handlers with dropdown handlers
this.chapterDropdown.addEventListener('change', (e) => {
    if (e.target.value) {
        this.selectChapter(e.target.value);
    }
});

this.addChapterBtnToolbar.addEventListener('click', () => {
    const chapter = projectStorage.addChapter();
    this.populateChapterDropdown();
    this.selectChapter(chapter.id);
});

// Replace renderChapterList() with populateChapterDropdown():
populateChapterDropdown() {
    const chapters = projectStorage.currentProject.chapters;
    this.chapterDropdown.innerHTML = '<option value="">Select Chapter...</option>';

    chapters.forEach((chapter, index) => {
        const option = document.createElement('option');
        option.value = chapter.id;
        option.textContent = `${index + 1}. ${chapter.title}`;
        if (chapter.id === this.currentChapterId) {
            option.selected = true;
        }
        this.chapterDropdown.appendChild(option);
    });
}

// Update selectChapter to also update dropdown
selectChapter(chapterId) {
    this.currentChapterId = chapterId;
    const chapter = projectStorage.getChapter(chapterId);

    if (chapter) {
        this.chapterTitleInput.value = chapter.title;
        this.chapterDropdown.value = chapterId; // Update dropdown
        this.renderBlocks();
    }
}

// Call populateChapterDropdown() instead of renderChapterList() everywhere
