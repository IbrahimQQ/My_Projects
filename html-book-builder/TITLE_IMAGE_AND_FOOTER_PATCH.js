// Title Image & Footer Customization

// ============ In app.js setupSettingsHandlers() ============

// Title image selection
document.getElementById('selectTitleImageBtn').addEventListener('click', async () => {
    const files = await window.electronAPI.selectImage();
    if (files.length > 0) {
        const filePath = files[0];
        // Read as base64
        const base64 = await window.electronAPI.readFileBinary(filePath);
        const fileName = filePath.split(/[/\\]/).pop();
        const mimeType = helpers.getMimeType(fileName);

        projectStorage.updateMeta({
            titleImage: {
                data: `data:${mimeType};base64,${base64}`,
                name: fileName
            }
        });

        // Show preview
        const preview = document.getElementById('titleImagePreview');
        const img = document.getElementById('titleImagePreviewImg');
        img.src = `data:${mimeType};base64,${base64}`;
        preview.style.display = 'block';
        document.getElementById('clearTitleImageBtn').style.display = 'inline-block';

        helpers.showToast('Title image added', 'success');
    }
});

document.getElementById('clearTitleImageBtn').addEventListener('click', () => {
    projectStorage.updateMeta({ titleImage: null });
    document.getElementById('titleImagePreview').style.display = 'none';
    document.getElementById('clearTitleImageBtn').style.display = 'none';
    helpers.showToast('Title image removed', 'success');
});

// Footer settings
document.getElementById('footerText').addEventListener('input', helpers.debounce((e) => {
    projectStorage.updateSettings({
        export: { footerText: e.target.value }
    });
}, 300));

document.getElementById('showFooter').addEventListener('change', (e) => {
    projectStorage.updateSettings({
        export: { showFooter: e.target.checked }
    });
});

// ============ In loadSettingsToUI() ============

// Title image
if (meta.titleImage) {
    const preview = document.getElementById('titleImagePreview');
    const img = document.getElementById('titleImagePreviewImg');
    img.src = meta.titleImage.data;
    preview.style.display = 'block';
    document.getElementById('clearTitleImageBtn').style.display = 'inline-block';
} else {
    document.getElementById('titleImagePreview').style.display = 'none';
    document.getElementById('clearTitleImageBtn').style.display = 'none';
}

// Footer
document.getElementById('footerText').value = settings.export.footerText || 'Created with HTML Book Builder';
document.getElementById('showFooter').checked = settings.export.showFooter !== false;

// ============ In exporter.js generateHTML() ============

// Add title image to header:
<header class="book-header">
    <div class="book-header-content">
        ${meta.titleImage ? `<img src="${meta.titleImage.data}" class="book-title-image" alt="Book cover">` : ''}
        <h1 class="book-title">${helpers.escapeHtml(meta.title)}</h1>
        ${meta.author ? `<p class="book-author">by ${helpers.escapeHtml(meta.author)}</p>` : ''}
    </div>
</header>

// Add footer (conditional):
${settings.export.showFooter !== false ? `
<footer class="book-footer">
    <p>${helpers.escapeHtml(settings.export.footerText || 'Created with HTML Book Builder')}</p>
</footer>
` : ''}

// ============ Add to exporter CSS ============

.book-title-image {
    max-width: 300px;
    max-height: 200px;
    margin-bottom: 24px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
}
