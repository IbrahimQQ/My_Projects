# Student Reader & Browser

An educational reader and browser application for students built with Electron.

## Features

### User Registration (Local)
- Local registration page (no server required)
- Stores student name and class/grade locally
- Profile data used for monitoring file naming

### Core Browser Functionality
- Full web browsing capabilities
- Tab management with visual tabs at the top (PC browser style)
- Split-screen feature for viewing two tabs side-by-side
- Navigation (back, forward, refresh)
- History with timestamps
- Bookmarks management
- Downloads history
- Save webpage for offline viewing
- Homepage with shortcuts to frequently visited pages

### Document Reader
Supported formats:
- HTML/Hypertext documents (primary format)
- PDF files
- EPUB (basic support)
- Plain text files

Features:
- Documents organized by subject
- Table of contents with clickable navigation
- Next/Previous navigation between topics
- Breadcrumb navigation (Subject > Topic)
- Font size adjustment
- View modes (book view, continuous scroll)
- Reading progress indicator
- Zoom controls
- Light/Dark mode toggle
- Text selection and highlighting
- Search within document

### Monitoring & Analytics System
- Tracks active tab/document in real-time
- Logs metadata: Document title, subject, topic
- Records time spent on each page
- Tracks reading session duration
- Monitors tool usage (dictionary, calculator)
- Auto-saves data every 5 minutes
- Exports to CSV format: `[StudentName][Class].csv`

### Integrated Student Tools

**Dictionary Tool:**
- Floating, draggable window
- Quick word lookup using Free Dictionary API
- Definition display with pronunciation
- Usage examples
- Synonyms and antonyms
- Search history

**Calculator Tool:**
- Scientific calculator functionality
- Basic and scientific modes
- Trigonometric functions (sin, cos, tan)
- Logarithms and exponentials
- Calculation history
- Floating, draggable window

### Technical Features
- Offline functionality for downloaded content
- Local data persistence using electron-store
- Smooth performance with multiple tabs
- Responsive design
- Auto-save monitoring data
- Crash recovery for unsaved data
- Light and dark themes

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the application:
   ```bash
   npm start
   ```

## Building

To build the application for distribution:

```bash
# For Windows
npm run build:win

# For macOS
npm run build:mac

# For Linux
npm run build:linux
```

## Project Structure

```
electron-reader-browser/
├── src/
│   ├── main/
│   │   ├── main.js          # Main Electron process
│   │   └── preload.js       # Preload script for IPC
│   └── renderer/
│       ├── pages/
│       │   ├── main.html        # Main browser interface
│       │   ├── registration.html # User registration
│       │   ├── reader.html      # Document reader
│       │   ├── dictionary.html  # Dictionary tool
│       │   └── calculator.html  # Calculator tool
│       ├── styles/
│       │   ├── main.css         # Main styles
│       │   └── icons.css        # Icon utilities
│       └── utils/
│           └── app.js           # Application logic
├── assets/
│   └── icons/
│       └── icon.svg             # App icon
├── documents/
│   └── subjects/                # Educational documents
│       ├── Mathematics/
│       ├── Science/
│       └── English/
├── package.json
└── README.md
```

## Adding Documents

Place your educational documents in the `documents/subjects/` folder:
1. Create a folder for each subject
2. Add HTML, PDF, TXT, or EPUB files to the subject folder
3. Documents will appear in the Document Library

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+T | New tab |
| Ctrl+W | Close tab |
| Ctrl+L | Focus address bar |
| Ctrl+R / F5 | Refresh |
| Ctrl+F | Search in document |
| Arrow Left/Right | Previous/Next page (in reader) |

## Data Storage

All user data is stored locally:
- User profile
- Browsing history
- Bookmarks
- Settings and preferences
- Monitoring/analytics data

Monitoring data can be exported as CSV for analysis.

## License

MIT License
