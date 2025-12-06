# Python Learning App

An interactive Electron-based desktop application for learning Python programming, from basic concepts to advanced topics and popular libraries.

## Features

### 📚 Comprehensive Tutorials
- **Basics**: Variables, operators, strings, control flow, loops, functions
- **Data Structures**: Lists, tuples, dictionaries, sets
- **Advanced Concepts**: OOP, inheritance, file I/O, exceptions, modules, decorators, generators, comprehensions

### 🧠 Interactive Quizzes
- Quiz for each tutorial topic
- Instant feedback and scoring
- Track your quiz performance over time

### 💪 Coding Challenges
- LeetCode-style programming challenges
- Three difficulty levels: Easy, Medium, Hard
- 50+ challenges to practice your skills
- Built-in code editor

### 📦 Library Learning
In-depth tutorials for popular Python libraries:
- **Matplotlib**: Data visualization and plotting
- **Seaborn**: Statistical data visualization
- **TensorFlow**: Machine learning and deep learning
- **Scikit-learn**: Machine learning algorithms

### 📈 Progress Tracking
- Track completed tutorials and challenges
- View quiz scores and performance metrics
- Monitor library learning progress
- All progress saved locally

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

## Running the App

Start the application in development mode:
```bash
npm start
```

For development with DevTools:
```bash
npm run dev
```

## Building for Production

To package the app for distribution:
```bash
npm install electron-builder --save-dev
```

Add to `package.json`:
```json
"scripts": {
  "build": "electron-builder"
},
"build": {
  "appId": "com.pythonlearning.app",
  "mac": {
    "target": "dmg"
  },
  "win": {
    "target": "nsis"
  },
  "linux": {
    "target": "AppImage"
  }
}
```

Then run:
```bash
npm run build
```

## Project Structure

```
python-learning-app/
├── main.js           # Electron main process
├── preload.js        # Preload script for IPC
├── index.html        # Main HTML structure
├── styles.css        # All application styles
├── app.js           # Application logic
├── data.js          # Tutorial content, quizzes, challenges
├── package.json     # Project dependencies
└── README.md        # This file
```

## Usage Guide

### Dashboard
- View your learning statistics
- See suggestions for next topics
- Quick access to all sections

### Tutorials
1. Browse tutorials by category (Basics, Data Structures, Advanced)
2. Click on any topic to view the tutorial
3. Read through the content and code examples
4. Take the quiz to test your understanding
5. Mark the topic as complete when done

### Quizzes
- Available for most tutorial topics
- Multiple-choice questions
- Immediate feedback
- Scores are saved automatically

### Challenges
1. Select difficulty level (Easy, Medium, Hard)
2. Choose a challenge to solve
3. Read the problem description and examples
4. Write your solution in the code editor
5. Test your code in a Python environment
6. Mark as solved when complete

### Libraries
1. Select a library to learn
2. Browse through the topics
3. Study the examples and code snippets
4. Mark topics as complete to track progress

### Progress
- View detailed progress for all sections
- Track completion percentages
- Monitor your learning journey

## Data Persistence

All your progress is automatically saved to browser's localStorage:
- Completed tutorials
- Quiz scores
- Solved challenges
- Library learning progress

## Customization

### Adding More Content

Edit `data.js` to add:
- New tutorial topics
- Additional quiz questions
- More coding challenges
- Library tutorials

### Styling

Modify `styles.css` to customize:
- Color scheme
- Layout
- Fonts
- Animations

## Tips for Best Results

1. **Follow the Order**: Start with Basics, then Data Structures, then Advanced
2. **Take Quizzes**: They help reinforce learning
3. **Practice Challenges**: Apply what you've learned
4. **Code Along**: Try examples in a real Python environment
5. **Be Consistent**: Regular practice is key to mastery

## Future Enhancements

Potential features for future versions:
- Integrated Python interpreter
- More challenges and tutorials
- Code execution and testing
- Achievement system
- Dark mode
- Export progress reports
- Code snippets library
- Community challenges

## Troubleshooting

### App won't start
- Make sure Node.js is installed
- Run `npm install` to ensure all dependencies are installed
- Check console for error messages

### Progress not saving
- Check browser console for localStorage errors
- Ensure you have sufficient disk space
- Try clearing old localStorage data

### Blank screen
- Open DevTools (npm run dev) to check for errors
- Verify all files are in the correct location
- Check that data.js is loading properly

## Contributing

Feel free to:
- Add more tutorial content
- Create additional challenges
- Improve the UI/UX
- Fix bugs
- Suggest new features

## License

MIT License - feel free to use and modify for your learning needs!

## Acknowledgments

Built with:
- Electron
- Vanilla JavaScript
- CSS3
- HTML5

Tutorial content covers core Python concepts and popular libraries used in data science and machine learning.

---

Happy Learning! 🐍✨
