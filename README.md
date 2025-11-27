# Dual Language Learning App

A comprehensive Electron desktop application for learning Arabic and Chinese simultaneously. This app provides an immersive learning experience with multiple interactive features designed to help you master both languages efficiently.

## Features

### 📚 Guided Lessons
- **Chapter-by-chapter curriculum** covering grammar, vocabulary, and daily conversations
- **Side-by-side comparison** of Arabic and Chinese
- **Similarities and differences** highlighted for better understanding
- **Progress tracking** to monitor your learning journey
- **Interactive examples** with translations

### ✍️ Practice Section
- **Touch-friendly writing canvas** for practicing characters and script
- Draw Arabic script and Chinese characters with mouse or touch input
- **Custom word lists** - Add your own words and sentences
- Save and review your practiced vocabulary
- **Clear visual feedback** for writing practice

### 📖 Dictionary
- **Comprehensive bilingual dictionary** with Arabic and Chinese entries
- **Search functionality** across words, translations, and transliterations
- **Favorites system** to bookmark important words
- **Example sentences** for context
- Filter by language (Arabic, Chinese, or both)
- Part of speech and detailed translations

### 🎤 Speaking Practice
- **Audio recording and playback** to practice pronunciation
- **Text-to-speech** examples in both languages
- **Categorized phrases** (Greetings, Introductions, Courtesy, etc.)
- Record your voice and compare with native pronunciation
- **Practice history** to track your speaking progress

### 🎯 Quiz Section
- **Four quiz types:**
  - 📖 Reading comprehension
  - ✍️ Writing exercises
  - 👂 Listening comprehension
  - 🗣️ Speaking practice
- **Adaptive difficulty** based on your progress
- Questions from both learned lessons and custom content
- **Detailed explanations** for each answer
- **Score tracking** and performance analytics

## Technology Stack

- **Electron** - Cross-platform desktop framework
- **React** - Modern UI library
- **TypeScript** - Type-safe development
- **Webpack** - Module bundler
- **Local Storage** - Progress and data persistence

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. Build the Electron main process:
```bash
npm run build:electron
```

3. Start the development server:
```bash
npm start
```

This will:
- Start the React development server on port 3000
- Launch the Electron app automatically
- Enable hot-reloading for development

### Building for Production

To create a production build:

```bash
npm run build
```

To package the app for distribution:

```bash
npm run package
```

The packaged app will be available in the `release` directory.

## Project Structure

```
My_Projects/
├── electron/           # Electron main process
│   └── main.ts        # Main entry point
├── src/               # React application
│   ├── components/    # React components
│   │   ├── GuidedLessons.tsx
│   │   ├── Practice.tsx
│   │   ├── Dictionary.tsx
│   │   ├── Speaking.tsx
│   │   └── Quiz.tsx
│   ├── data/          # Learning content
│   │   ├── lessons.ts
│   │   ├── dictionary.ts
│   │   ├── speakingPhrases.ts
│   │   └── quizQuestions.ts
│   ├── utils/         # Utility functions
│   │   └── storage.ts
│   ├── App.tsx        # Main app component
│   ├── App.css        # Global styles
│   ├── index.tsx      # React entry point
│   └── index.html     # HTML template
├── dist/              # Build output
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript config
└── webpack.renderer.config.js
```

## Features in Detail

### Language Support

#### Arabic
- Right-to-left text rendering
- Proper Arabic font support
- Transliteration (romanization) for all content
- Common phrases and greetings
- Grammar explanations
- Cultural context

#### Chinese
- Simplified Chinese characters
- Pinyin (romanization) with tone marks
- Character stroke order (in practice section)
- Common phrases and greetings
- Grammar patterns
- Cultural notes

### Data Persistence

All your progress is automatically saved to local storage:
- Completed lessons
- Practiced words and sentences
- Favorite dictionary entries
- Quiz scores and history
- Custom vocabulary lists

### Offline Support

The app works completely offline once installed. All learning materials are included in the application, so you can study anywhere without an internet connection.

## Adding Custom Content

### Adding Lessons
Edit `src/data/lessons.ts` to add new chapters and lessons.

### Adding Dictionary Entries
Edit `src/data/dictionary.ts` to expand the dictionary.

### Adding Speaking Phrases
Edit `src/data/speakingPhrases.ts` to add more practice phrases.

### Adding Quiz Questions
Edit `src/data/quizQuestions.ts` to create new quiz questions.

## Troubleshooting

### Dependencies Installation Issues
If you encounter network errors while installing dependencies, try:
```bash
npm install --verbose
```

Or retry with exponential backoff if network issues occur.

### Electron Not Starting
Make sure the main process is built:
```bash
npm run build:electron
```

### Audio Recording Not Working
- Check microphone permissions
- Ensure your browser/Electron has access to audio devices
- Try using HTTPS if running in a browser

## License

MIT License

---

**Happy Learning! 🌍 تعلم سعيد! 学习愉快!**
