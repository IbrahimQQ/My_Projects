# HTML Book Builder

A No-Code Interactive HTML Book Builder for creating educational content with synchronized media, inspired by [Seeing Theory](https://seeing-theory.brown.edu/).

## Features

### Content Editing
- **Rich Block Editor**: Create content using various block types:
  - Headings (H1-H4)
  - Paragraphs with rich text formatting
  - Ordered and unordered lists
  - Block quotes with citations
  - Code blocks with syntax highlighting
  - LaTeX equations (KaTeX support)
  - Collapsible sections
  - Horizontal dividers

### Two-Column Layout
- **Content Column**: Scrollable text content on the left
- **Media Column**: Sticky/fixed media area on the right
- Content and media are synchronized via scroll triggers

### Media Support
- Static images (PNG, JPG, WebP, GIF)
- SVG graphics (static and animated)
- Custom HTML/CSS/JS widgets
- GeoGebra applets (offline .ggb files)
- Videos (MP4, WebM)
- Lottie animations

### Scroll-Triggered Synchronization
- **onEnter**: Trigger when block enters viewport
- **onCenter**: Trigger when block is centered
- **onExit**: Trigger when block leaves viewport
- **onProgress**: Continuous value (0-1) based on scroll position

### Multiple Views
1. **Editor**: WYSIWYG block editor with drag-and-drop
2. **Media Manager**: Import, organize, and manage assets
3. **Storyboard**: Visual timeline for content-media linking
4. **Preview**: Live preview with device simulation
5. **Settings**: Theme, typography, and export options

### Export Options
- **Single HTML File**: All assets inlined as base64
- **Multi-file Bundle**: HTML + assets folder
- **Zipped Package**: Ready for deployment

### Offline-First
- Works entirely without internet
- All dependencies bundled locally
- Projects saved as local files

## Installation

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn

### Setup

```bash
# Navigate to project directory
cd html-book-builder

# Install dependencies
npm install

# Start the application
npm start

# For development mode with DevTools
npm run dev
```

### Building for Distribution

```bash
# Build for current platform
npm run build

# Build for specific platforms
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## Usage

### Creating a New Book

1. Launch the application
2. A new project is created automatically
3. Add chapters using the sidebar
4. Add content blocks using the "+" button
5. Import media in the Media Manager view
6. Link media to content blocks in the Storyboard view

### Project Structure

```
my-book-project/
├── project.json          # Book structure and settings
├── assets/
│   ├── images/           # PNG, JPG, WebP, GIF
│   ├── svgs/             # SVG files
│   ├── videos/           # MP4, WebM
│   ├── scripts/          # Custom JS
│   ├── geogebra/         # .ggb files
│   └── html-snippets/    # Custom HTML widgets
├── chapters/             # Individual chapter files
└── export/               # Generated output
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+N | New Project |
| Ctrl+O | Open Project |
| Ctrl+S | Save Project |
| Ctrl+Shift+S | Save As |
| Ctrl+E | Export HTML |
| Ctrl+1 | Editor View |
| Ctrl+2 | Media Manager |
| Ctrl+3 | Storyboard |
| Ctrl+4 | Preview |
| Ctrl+, | Settings |

### Creating Custom Widgets

1. Go to Media Manager
2. Click "Create HTML Snippet"
3. Write HTML, CSS, and JavaScript
4. Preview in real-time
5. Save and link to content blocks

### Using GeoGebra

1. Create your applet in GeoGebra
2. Export as .ggb file
3. Import in Media Manager
4. Link to content blocks

## Theming

### Built-in Themes
- Light (default)
- Dark
- Sepia
- Custom

### Custom Styling
Add custom CSS in Settings > Custom CSS to override any styles.

## Technical Details

### Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Desktop**: Electron
- **Math Rendering**: KaTeX
- **Code Highlighting**: Highlight.js

### Supported File Types

| Type | Extensions |
|------|------------|
| Images | png, jpg, jpeg, gif, webp |
| Vector | svg |
| Video | mp4, webm, ogg |
| GeoGebra | ggb, ggt |
| Code | js, css, html |
| Data | json |

## Sample Project

A sample project is included in the `sample-project/` directory demonstrating:
- Multi-chapter structure
- Various content block types
- Media-content linking
- Scroll triggers

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Inspired by [Seeing Theory](https://seeing-theory.brown.edu/) by Daniel Kunin
- Built with [Electron](https://www.electronjs.org/)
- Math rendering by [KaTeX](https://katex.org/)
- Code highlighting by [Highlight.js](https://highlightjs.org/)
