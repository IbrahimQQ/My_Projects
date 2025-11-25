// Block Spacing Controls - Add to block inspector

// In block-editor.js, renderInspector() method, add after Block Type section:

`
<div class="inspector-section">
    <h4>Spacing</h4>
    <div class="inspector-field">
        <label>Bottom Margin (px)</label>
        <input type="range" id="blockSpacing" min="0" max="80" value="${block.spacing || 16}">
        <span id="blockSpacingValue">${block.spacing || 16}px</span>
    </div>
</div>
`

// Add event listener:
document.getElementById('blockSpacing').addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    document.getElementById('blockSpacingValue').textContent = `${value}px`;
    projectStorage.updateBlock(this.currentChapterId, block.id, {
        spacing: value
    });
    // Update the DOM element
    const blockEl = document.querySelector(`[data-block-id="${block.id}"]`);
    if (blockEl) {
        blockEl.style.marginBottom = `${value}px`;
    }
});

// In createBlockElement(), apply spacing:
wrapper.style.marginBottom = `${block.spacing || 16}px`;

// In storage.js createBlock(), add spacing to baseBlock:
const baseBlock = {
    id: helpers.generateId(),
    type: type,
    spacing: 16, // Add this
    trigger: {
        type: 'onEnter',
        enabled: false
    },
    linkedMedia: []
};
