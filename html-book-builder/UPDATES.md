# HTML Book Builder - Feature Updates

## Changes Made

### 1. Media Column Fading (✓)
- **Changed**: Media now fades in/out instead of scrolling
- **Implementation**: Media items are positioned absolutely and centered, with opacity transitions
- **Location**: `src/renderer/components/preview.js` and `src/renderer/components/exporter.js`

### 2. Block Spacing Controls
- **Added**: Spacing control in block inspector
- **Feature**: Adjust padding between blocks individually
- **Location**: Block inspector in `block-editor.js`

### 3. Interactive Controls Block Type (✓)
- **Added**: New "Controls" block type with buttons, sliders, and inputs
- **Purpose**: Connect to GeoGebra applets and other interactive media
- **Features**:
  - Button controls (trigger actions)
  - Slider controls (adjust parameters 0-100)
  - Text input controls
  - Each control can target specific media and send commands

### 4. Chapter Dropdown Navigation (✓)
- **Changed**: Chapters shown as dropdown in top toolbar instead of sidebar
- **Benefit**: More screen space for content editing
- **Location**: Updated HTML structure in header

### 5. Title Images (✓)
- **Added**: Support for adding images to book title
- **Feature**: Select image from file system, preview in settings
- **Display**: Shows in exported book header

### 6. Editable Footer (✓)
- **Added**: Custom footer text in settings
- **Feature**: Toggle footer visibility on/off
- **Default**: "Created with HTML Book Builder" (customizable)

### 7. More Font Options (✓)
- **Added Fonts**:
  - **Headings**: Montserrat, Raleway, Poppins, Lato, PT Serif, Crimson Text, Libre Baskerville
  - **Body**: Open Sans, Source Sans Pro, Noto Sans, PT Sans, Work Sans, Georgia
  - **Code**: Roboto Mono, IBM Plex Mono, Inconsolata, Courier New

### 8. Multi-Chapter HTML Export (✓)
- **Added**: Export format "Multiple HTML Files (one per chapter)"
- **Feature**: Creates separate HTML file for each chapter with navigation
- **Files**: index.html + chapter-1.html, chapter-2.html, etc.

## Installation of Updates

Replace the following files with the updated versions provided:
- `src/renderer/index.html`
- `src/renderer/components/preview.js`
- `src/renderer/components/exporter.js`
- `src/renderer/components/block-editor.js`
- `src/renderer/app.js`
- `src/renderer/utils/storage.js`

## Usage Guide

### Interactive Controls
1. Add a "Controls" block in the editor
2. Choose control type (button, slider, input)
3. Link to media in the block inspector
4. Set target parameter (for GeoGebra: variable name, for custom widgets: event name)

### GeoGebra Integration
- Upload .ggb file in Media Manager
- Link to content block with controls
- Use slider control with target parameter like "a" or "n"
- Button can trigger "reset" or "step" commands

### Chapter Navigation
- Click chapter dropdown in toolbar
- Select different chapter to edit
- Chapters automatically linked in exported book

### Title Images
1. Go to Settings > Project Settings
2. Click "Select Image"
3. Choose image file
4. Preview appears immediately
5. Exported book shows image in header

### Footer Customization
1. Go to Settings > Export Settings
2. Enter custom footer text
3. Uncheck "Show footer" to hide completely

### Multi-Chapter Export
1. Go to Settings > Export Settings
2. Select "Multiple HTML Files (one per chapter)"
3. Export creates folder with:
   - index.html (table of contents)
   - chapter-1.html, chapter-2.html, etc.
   - assets/ folder (shared)

## Technical Implementation Details

### Controls Block Structure
```javascript
{
  type: 'controls',
  controls: [
    {
      type: 'button',
      label: 'Run Simulation',
      targetMedia: 'asset_id',
      action: 'start'
    },
    {
      type: 'slider',
      label: 'Speed',
      min: 0,
      max: 100,
      value: 50,
      targetMedia: 'asset_id',
      parameter: 'speed'
    }
  ]
}
```

### Media Fade CSS
```css
.media-item {
  position: absolute;
  opacity: 0;
  transition: opacity 0.6s ease;
}

.media-item.active {
  opacity: 1;
}
```

### Multi-Chapter Export Structure
```
export/
├── index.html (navigation)
├── chapter-1.html
├── chapter-2.html
├── chapter-3.html
├── assets/
│   ├── styles.css
│   ├── scripts.js
│   └── [media files]
└── README.txt
```

## Next Steps

To fully implement these features, you'll need to:
1. Update the files mentioned above
2. Run `npm install` to ensure all dependencies are current
3. Test each feature individually
4. Commit changes to your repository

All features are now ready for implementation!
