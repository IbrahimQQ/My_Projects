// Controls Block Implementation

// ============ In block-editor.js getBlockContent() ============

case 'controls':
    const controls = block.controls || [];
    if (controls.length === 0) {
        return `
            <div class="block-controls-empty">
                <p>No controls added yet. Use the inspector to add buttons, sliders, or inputs.</p>
            </div>
        `;
    }

    return `
        <div class="block-controls">
            ${controls.map((control, idx) => {
                switch (control.type) {
                    case 'button':
                        return `
                            <button class="control-btn" data-control-idx="${idx}" data-action="${control.action || 'trigger'}">
                                ${helpers.escapeHtml(control.label || 'Button')}
                            </button>
                        `;
                    case 'slider':
                        return `
                            <div class="control-slider-container">
                                <label>${helpers.escapeHtml(control.label || 'Slider')}</label>
                                <input type="range"
                                       class="control-slider"
                                       data-control-idx="${idx}"
                                       min="${control.min || 0}"
                                       max="${control.max || 100}"
                                       value="${control.value || 50}"
                                       data-parameter="${control.parameter || ''}">
                                <span class="control-value">${control.value || 50}</span>
                            </div>
                        `;
                    case 'input':
                        return `
                            <div class="control-input-container">
                                <label>${helpers.escapeHtml(control.label || 'Input')}</label>
                                <input type="text"
                                       class="control-input"
                                       data-control-idx="${idx}"
                                       placeholder="${control.placeholder || ''}"
                                       value="${control.value || ''}">
                            </div>
                        `;
                    default:
                        return '';
                }
            }).join('')}
        </div>
    `;

// ============ Add to editor.css ============

.block-controls {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    background-color: var(--surface-hover);
    border-radius: var(--radius-md);
}

.block-controls-empty {
    padding: 32px;
    text-align: center;
    color: var(--text-muted);
    font-style: italic;
    background-color: var(--surface-hover);
    border-radius: var(--radius-md);
    border: 2px dashed var(--border-color);
}

.control-btn {
    padding: 12px 24px;
    border: none;
    border-radius: var(--radius-md);
    background-color: var(--primary-color);
    color: white;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
}

.control-btn:hover {
    background-color: var(--primary-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
}

.control-slider-container,
.control-input-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.control-slider-container label,
.control-input-container label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-color);
}

.control-slider {
    width: 100%;
}

.control-value {
    align-self: flex-end;
    font-size: 12px;
    font-weight: 600;
    color: var(--primary-color);
}

.control-input {
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: 14px;
}

// ============ Inspector for Controls Block ============

// In renderInspector(), add for controls block type:

if (block.type === 'controls') {
    const controlsHtml = `
        <div class="inspector-section">
            <h4>Controls</h4>
            <button class="btn btn-secondary" id="addControlBtn" style="width: 100%; margin-bottom: 12px;">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/>
                </svg>
                Add Control
            </button>
            <div id="controlsList">
                ${(block.controls || []).map((control, idx) => `
                    <div class="control-config" data-idx="${idx}">
                        <div class="control-config-header">
                            <strong>${control.type.toUpperCase()}: ${control.label || 'Unnamed'}</strong>
                            <button class="btn-icon delete-control" data-idx="${idx}">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                    <path d="M5 20a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8h2V6h-4V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H3v2h2zM9 4h6v2H9zM8 8h9v12H7V8z"/>
                                </svg>
                            </button>
                        </div>
                        <button class="btn btn-secondary edit-control" data-idx="${idx}" style="width: 100%; font-size: 12px;">
                            Edit
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    // Append to inspector and add event listeners
}

// ============ Control Config Modal ============

// Add to index.html:

<div class="modal" id="controlConfigModal">
    <div class="modal-content">
        <div class="modal-header">
            <h3>Configure Control</h3>
            <button class="modal-close" id="closeControlModal">&times;</button>
        </div>
        <div style="padding: 20px;">
            <div class="setting-group">
                <label>Control Type</label>
                <select id="controlType">
                    <option value="button">Button</option>
                    <option value="slider">Slider</option>
                    <option value="input">Text Input</option>
                </select>
            </div>
            <div class="setting-group">
                <label>Label</label>
                <input type="text" id="controlLabel" placeholder="Control label">
            </div>
            <div class="setting-group" id="controlButtonGroup" style="display: none;">
                <label>Button Action</label>
                <input type="text" id="controlAction" placeholder="start, stop, reset">
            </div>
            <div class="setting-group" id="controlSliderGroup" style="display: none;">
                <label>Min Value</label>
                <input type="number" id="controlMin" value="0">
                <label>Max Value</label>
                <input type="number" id="controlMax" value="100">
                <label>Default Value</label>
                <input type="number" id="controlValue" value="50">
                <label>Parameter Name (for GeoGebra/widgets)</label>
                <input type="text" id="controlParameter" placeholder="e.g., 'speed' or 'angle'">
            </div>
            <div class="setting-group" id="controlInputGroup" style="display: none;">
                <label>Placeholder</label>
                <input type="text" id="controlPlaceholder" placeholder="Enter text...">
            </div>
            <div class="setting-group">
                <label>Target Media</label>
                <select id="controlTargetMedia">
                    <option value="">Select media...</option>
                </select>
            </div>
            <button class="btn btn-primary" id="saveControlBtn" style="width: 100%; margin-top: 16px;">
                Save Control
            </button>
        </div>
    </div>
</div>

// ============ GeoGebra Integration ============

// In preview.js and exporter.js, add control event handlers:

document.querySelectorAll('.control-slider').forEach(slider => {
    slider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        const parameter = e.target.dataset.parameter;
        const blockId = e.target.closest('[data-block-id]').dataset.blockId;
        const block = findBlock(blockId);

        if (block && block.linkedMedia) {
            block.linkedMedia.forEach(assetId => {
                const mediaEl = document.querySelector(`[data-asset-id="${assetId}"]`);
                if (mediaEl && mediaEl.tagName === 'IFRAME') {
                    // GeoGebra command
                    const ggbApp = mediaEl.contentWindow.ggbApplet;
                    if (ggbApp && parameter) {
                        ggbApp.setValue(parameter, value / 100); // Normalize to 0-1
                    }
                }
                // Dispatch custom event for custom widgets
                mediaEl?.dispatchEvent(new CustomEvent('controlChange', {
                    detail: { parameter, value }
                }));
            });
        }

        // Update display
        e.target.nextElementSibling.textContent = value;
    });
});

document.querySelectorAll('.control-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const blockId = e.target.closest('[data-block-id]').dataset.blockId;
        const block = findBlock(blockId);

        if (block && block.linkedMedia) {
            block.linkedMedia.forEach(assetId => {
                const mediaEl = document.querySelector(`[data-asset-id="${assetId}"]`);
                // Trigger action
                mediaEl?.dispatchEvent(new CustomEvent('controlAction', {
                    detail: { action }
                }));
            });
        }
    });
});
