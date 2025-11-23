# Student Educational Apps Suite

A comprehensive collection of educational applications designed for students, featuring interactive learning tools, virtual laboratories, and content creation utilities.

## 📋 Table of Contents

- [Overview](#overview)
- [System Requirements](#system-requirements)
- [Quick Start](#quick-start)
- [Applications](#applications)
  - [1. Reader & Browser App](#1-reader--browser-app)
  - [2. Test App](#2-test-app)
  - [3. Calendar App](#3-calendar-app)
  - [4. Physics Virtual Laboratory](#4-physics-virtual-laboratory)
  - [5. Chemistry Virtual Laboratory](#5-chemistry-virtual-laboratory)
  - [6. Biology Virtual Laboratory](#6-biology-virtual-laboratory)
  - [7. Simulation Studio](#7-simulation-studio)
  - [8. Interactive Book Builder](#8-interactive-book-builder)
- [Installation Guide](#installation-guide)
- [Testing Guide](#testing-guide)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

---

## Overview

This suite contains 8 educational applications:

| App | Type | Purpose |
|-----|------|---------|
| Reader & Browser App | React Native (Expo) | Read and browse educational content |
| Test App | React Native (Expo) | Take quizzes and assessments |
| Calendar App | React Native (Expo) | Schedule and track academic events |
| Physics Lab | React Native (Expo) | Interactive physics experiments |
| Chemistry Lab | React Native (Expo) | Interactive chemistry experiments |
| Biology Lab | React Native (Expo) | Interactive biology experiments |
| Simulation Studio | React Native (Expo) | Create custom simulations for the labs |
| Book Builder | Web (HTML/JS) | Create interactive HTML books |

---

## System Requirements

### For React Native Apps (Mobile)
- **Node.js**: v16.0.0 or higher
- **npm**: v8.0.0 or higher
- **Expo CLI**: Latest version
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)
- **Mobile Device or Emulator**: Android 5.0+ or iOS 13+

### For Web Apps (Book Builder)
- **Modern Web Browser**: Chrome, Firefox, Safari, or Edge (latest versions)
- **Node.js** (optional, for local server)

### Recommended Hardware
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 5GB free space
- **Display**: 15.6 inch or larger for optimal experience

---

## Quick Start

### Install All Dependencies
```bash
# Navigate to the project root
cd student-apps

# Install dependencies for all React Native apps
for app in reader-browser-app test-app calendar-app physics-lab chemistry-lab biology-lab simulation-studio; do
  echo "Installing $app..."
  cd $app && npm install && cd ..
done

echo "All apps installed!"
```

### Run Any App
```bash
# For React Native apps
cd <app-name>
npx expo start

# For Book Builder (web)
cd book-builder
npx serve . -p 3000
```

---

## Applications

### 1. Reader & Browser App

**Location**: `student-apps/reader-browser-app/`

**Description**: A feature-rich reading application that allows students to browse, read, and annotate educational content. Supports multiple formats and provides a distraction-free reading experience.

#### Features
- 📖 Multi-format document support
- 🔖 Bookmarking and annotations
- 🔍 Full-text search
- 📱 Offline reading capability
- 🎨 Customizable themes (light/dark/sepia)
- 📊 Reading progress tracking
- 📝 Note-taking functionality

#### Installation & Testing
```bash
cd student-apps/reader-browser-app

# Install dependencies
npm install

# Start development server
npx expo start

# Run on Android
npx expo start --android

# Run on iOS
npx expo start --ios

# Run in web browser
npx expo start --web
```

#### Testing the App
1. Launch the app using `npx expo start`
2. Scan the QR code with Expo Go app (mobile) or press 'w' for web
3. Test features:
   - Browse the content library
   - Open and read a document
   - Add bookmarks and annotations
   - Switch between themes
   - Test offline mode by disabling network

---

### 2. Test App

**Location**: `student-apps/test-app/`

**Description**: An interactive assessment application for creating and taking quizzes, tests, and exams. Supports multiple question types and provides instant feedback.

#### Features
- ✅ Multiple question types (MCQ, True/False, Fill-in-blank, Essay)
- ⏱️ Timed assessments
- 📊 Score tracking and analytics
- 📈 Progress reports
- 🔄 Quiz retry functionality
- 📱 Offline quiz support
- 🏆 Achievement badges

#### Installation & Testing
```bash
cd student-apps/test-app

# Install dependencies
npm install

# Start development server
npx expo start

# Run on specific platform
npx expo start --android
npx expo start --ios
npx expo start --web
```

#### Testing the App
1. Launch the app and create a profile
2. Test features:
   - Take a practice quiz
   - Review answers and explanations
   - Check score history
   - Test timed quiz mode
   - Verify progress tracking

---

### 3. Calendar App

**Location**: `student-apps/calendar-app/`

**Description**: An academic calendar and scheduling application to help students manage their study schedule, assignments, and events.

#### Features
- 📅 Monthly/Weekly/Daily views
- ⏰ Event reminders and notifications
- 📚 Assignment tracking
- 🔁 Recurring events
- 🏷️ Color-coded categories
- 📤 Export/Import calendar data
- 🔔 Push notifications

#### Installation & Testing
```bash
cd student-apps/calendar-app

# Install dependencies
npm install

# Start development server
npx expo start
```

#### Testing the App
1. Launch the app
2. Test features:
   - Create new events and assignments
   - Set reminders
   - Switch between calendar views
   - Edit and delete events
   - Test recurring events
   - Verify notifications (requires device)

---

### 4. Physics Virtual Laboratory

**Location**: `student-apps/physics-lab/`

**Description**: A comprehensive virtual laboratory for physics experiments. Students can perform interactive simulations covering mechanics, waves, electricity, optics, thermodynamics, and modern physics.

#### Features
- 🔬 17 interactive experiments across 6 categories
- 📐 Real physics calculations and formulas
- 📊 Live data visualization with SVG graphics
- 📝 Experiment notes and observations
- ⭐ Progress tracking and scoring
- 🏆 Achievement badges
- 📤 Data export functionality

#### Experiment Categories
| Category | Experiments |
|----------|-------------|
| Mechanics | Simple Pendulum, Projectile Motion, Friction, Newton's Laws, Momentum |
| Waves | Standing Waves, Resonance, Diffraction |
| Electricity | Ohm's Law, Kirchhoff's Laws, RC Circuit, Magnetic Field |
| Optics | Snell's Law, Thin Lens, Interference |
| Thermodynamics | Specific Heat, Gas Laws |
| Modern Physics | Photoelectric Effect, Radioactive Decay |

#### Installation & Testing
```bash
cd student-apps/physics-lab

# Install dependencies
npm install

# Start development server
npx expo start
```

#### Testing the App
1. Launch and explore the home screen
2. Test each category:
   - Navigate to Mechanics → Simple Pendulum
   - Adjust parameters (length, mass, angle)
   - Run the simulation
   - Observe the animation and data
   - Record observations in notes
   - Complete the experiment and check score
3. Verify:
   - Progress saves correctly
   - Formulas display properly
   - Export functionality works

---

### 5. Chemistry Virtual Laboratory

**Location**: `student-apps/chemistry-lab/`

**Description**: A virtual chemistry laboratory with interactive experiments covering general, organic, inorganic, physical, environmental, and food chemistry.

#### Features
- 🧪 20+ interactive experiments across 6 categories
- ⚗️ Realistic chemistry simulations
- 📊 Titration curves and reaction graphs
- 🔥 Color-changing reactions
- 📝 Lab notebook functionality
- ⭐ Progress tracking
- 📤 Data export

#### Experiment Categories
| Category | Experiments |
|----------|-------------|
| General Chemistry | Acid-Base Titration, Rate of Reaction, Solubility, Enthalpy |
| Organic Chemistry | Esterification, Fermentation, Distillation, Saponification |
| Inorganic Chemistry | Flame Test, Reactivity Series, Electroplating, Qualitative Analysis |
| Physical Chemistry | Chemical Equilibrium, Electrolysis, Hess's Law |
| Environmental Chemistry | Water Testing, Acid Rain Simulation |
| Food Chemistry | Food Tests, Vitamin C Analysis |

#### Installation & Testing
```bash
cd student-apps/chemistry-lab

# Install dependencies
npm install

# Start development server
npx expo start
```

#### Testing the App
1. Launch and explore categories
2. Test an experiment:
   - Go to General Chemistry → Acid-Base Titration
   - Set acid/base concentrations
   - Perform virtual titration
   - Observe pH changes and indicator colors
   - Record equivalence point
3. Verify calculations match expected results

---

### 6. Biology Virtual Laboratory

**Location**: `student-apps/biology-lab/`

**Description**: A virtual biology laboratory featuring experiments in cell biology, biochemistry, ecology, human physiology, genetics, and microbiology.

#### Features
- 🦠 17 interactive experiments across 6 categories
- 🔬 Microscopy simulations
- 📈 Population dynamics modeling
- 🧬 Genetics calculations
- 📊 Statistical analysis (Chi-squared)
- 📝 Lab notebook
- ⭐ Progress tracking

#### Experiment Categories
| Category | Experiments |
|----------|-------------|
| Cell Biology | Microscopy, Osmosis, Cell Division |
| Biochemistry | Enzyme Activity, Photosynthesis, Respiration, Food Tests |
| Ecology | Quadrat Sampling, Belt Transect, Mark-Release-Recapture |
| Human Physiology | Heart Rate, Breathing Rate, Reaction Time |
| Genetics | DNA Extraction, Chi-Squared Test |
| Microbiology | Bacterial Growth, Antibiotic Sensitivity |

#### Installation & Testing
```bash
cd student-apps/biology-lab

# Install dependencies
npm install

# Start development server
npx expo start
```

#### Testing the App
1. Launch and browse experiments
2. Test different categories:
   - Cell Biology: Test osmosis simulation with different concentrations
   - Ecology: Perform mark-release-recapture calculation
   - Genetics: Run chi-squared test with sample data
3. Verify:
   - Graphs render correctly
   - Calculations are accurate
   - Progress saves between sessions

---

### 7. Simulation Studio

**Location**: `student-apps/simulation-studio/`

**Description**: A central application for creating custom simulations for Physics, Chemistry, and Biology. Created simulations can be exported to the respective lab apps.

#### Features
- 🎨 No-code simulation builder
- 📐 Variable management with customizable ranges
- 📝 Formula library for each subject
- 🖼️ Multiple visualization types
- 👁️ Live preview
- 📤 Export to lab apps (JSON format)
- 📑 Pre-built templates

#### Available Templates
**Physics**: Simple Pendulum, Projectile Motion, Ohm's Law Circuit, Wave Interference, Ideal Gas

**Chemistry**: Acid-Base Titration, Reaction Rate, Chemical Equilibrium, Solution Dilution, pH and Buffers

**Biology**: Enzyme Kinetics, Population Growth, Hardy-Weinberg, Photosynthesis Rate, Species Diversity

#### Installation & Testing
```bash
cd student-apps/simulation-studio

# Install dependencies
npm install

# Start development server
npx expo start
```

#### Testing the App
1. Launch and go to home screen
2. Create a new simulation:
   - Select subject (Physics/Chemistry/Biology)
   - Add title and description
   - Choose category and difficulty
   - Add variables from the library
   - Select formulas
   - Choose visualization type
   - Add step-by-step instructions
3. Preview the simulation
4. Export and verify JSON output

---

### 8. Interactive Book Builder

**Location**: `student-apps/book-builder/`

**Description**: A web-based no-code application for creating interactive HTML books similar to [Seeing Theory](https://seeing-theory.brown.edu/). Features a two-column layout with scroll-triggered media synchronization.

#### Features
- 📝 WYSIWYG block-based editor
- 📐 Two-column layout (content + media)
- 🔄 Scroll-triggered media synchronization
- 🖼️ Multiple media types support
- 🎬 Storyboard view
- 👁️ Live preview with device simulation
- 📤 Export to standalone HTML
- 🎨 Theme customization

#### Content Block Types
- Headings (H1-H4)
- Rich text paragraphs
- Block quotes
- Code blocks (syntax highlighted)
- LaTeX equations (KaTeX)
- Ordered/Unordered lists
- Collapsible sections
- Horizontal dividers

#### Media Types
- Images (PNG, JPG, WebP)
- SVG (static/animated)
- Custom HTML/CSS/JS widgets
- GeoGebra applets
- Lottie animations
- Video files (MP4, WebM)

#### Installation & Testing
```bash
cd student-apps/book-builder

# Option 1: Use a local server (recommended)
npx serve . -p 3000
# Then open http://localhost:3000 in your browser

# Option 2: Open directly in browser
# Simply open index.html in a modern web browser
```

#### Testing the App
1. Open the app in a web browser
2. Test the editor:
   - Add a chapter
   - Add content blocks (H1, paragraph, code, math)
   - Format text (bold, italic, links)
3. Test media management:
   - Upload images/SVGs
   - Create custom HTML widget
   - Link media to content blocks
4. Test storyboard:
   - View content-media relationships
   - Verify links work correctly
5. Test preview:
   - Check scroll-triggered media changes
   - Test different device sizes
   - Toggle dark mode
6. Test export:
   - Export as single HTML file
   - Open exported file in browser
   - Verify it works offline

---

## Installation Guide

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd My_Projects/student-apps
```

### Step 2: Install Node.js
Download and install Node.js from [nodejs.org](https://nodejs.org/) (v16 or higher)

```bash
# Verify installation
node --version  # Should be v16.0.0 or higher
npm --version   # Should be v8.0.0 or higher
```

### Step 3: Install Expo CLI (for mobile apps)
```bash
npm install -g expo-cli
```

### Step 4: Install Dependencies for Each App

#### All React Native Apps (One Command)
```bash
# From the student-apps directory
for dir in reader-browser-app test-app calendar-app physics-lab chemistry-lab biology-lab simulation-studio; do
  echo "Installing dependencies for $dir..."
  (cd "$dir" && npm install)
done
```

#### Individual App Installation
```bash
# Physics Lab example
cd physics-lab
npm install

# Chemistry Lab
cd ../chemistry-lab
npm install

# Biology Lab
cd ../biology-lab
npm install

# Simulation Studio
cd ../simulation-studio
npm install

# Reader Browser App
cd ../reader-browser-app
npm install

# Test App
cd ../test-app
npm install

# Calendar App
cd ../calendar-app
npm install
```

#### Book Builder (Web App)
```bash
cd book-builder
# No npm install needed - it's a pure HTML/JS app
# Just serve the files
npx serve . -p 3000
```

### Step 5: Set Up Mobile Development Environment

#### For Android:
1. Install [Android Studio](https://developer.android.com/studio)
2. Set up an Android Virtual Device (AVD) or connect a physical device
3. Enable USB debugging on physical devices

#### For iOS (macOS only):
1. Install [Xcode](https://apps.apple.com/app/xcode/id497799835) from App Store
2. Install iOS Simulator
3. Accept Xcode license: `sudo xcodebuild -license accept`

#### Using Expo Go (Easiest Method):
1. Install "Expo Go" app on your mobile device
   - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
2. Run `npx expo start` in any app directory
3. Scan the QR code with Expo Go

---

## Testing Guide

### Automated Testing Checklist

#### React Native Apps Common Tests
- [ ] App launches without errors
- [ ] Navigation works between screens
- [ ] Data persists after app restart (AsyncStorage)
- [ ] UI renders correctly on different screen sizes
- [ ] Offline functionality works

#### Physics/Chemistry/Biology Lab Tests
- [ ] All experiments load correctly
- [ ] Parameter adjustments update simulations
- [ ] Calculations match expected formulas
- [ ] Progress saves correctly
- [ ] Export functionality works
- [ ] Achievement badges unlock properly

#### Book Builder Tests
- [ ] All views accessible (Edit, Media, Storyboard, Preview, Settings)
- [ ] Content blocks can be added/edited/deleted
- [ ] Media uploads correctly
- [ ] Media links to content blocks
- [ ] Preview shows scroll-triggered changes
- [ ] Export produces valid HTML
- [ ] Exported HTML works offline

### Manual Testing Procedure

#### Test 1: Basic Functionality
```bash
# Start any lab app
cd physics-lab
npx expo start --web

# In browser:
# 1. Navigate through all screens
# 2. Open an experiment
# 3. Run a simulation
# 4. Check that data displays correctly
```

#### Test 2: Data Persistence
```bash
# 1. Start app, create some progress
# 2. Close the app completely
# 3. Restart the app
# 4. Verify progress is preserved
```

#### Test 3: Cross-Platform
```bash
# Test on web
npx expo start --web

# Test on Android
npx expo start --android

# Test on iOS (macOS only)
npx expo start --ios
```

#### Test 4: Book Builder Export
```bash
cd book-builder
npx serve . -p 3000

# In browser:
# 1. Create a simple book with 2-3 sections
# 2. Add media to each section
# 3. Preview the book
# 4. Export as single HTML
# 5. Open the exported file
# 6. Disconnect from internet
# 7. Verify the book still works
```

---

## Project Structure

```
student-apps/
├── reader-browser-app/          # Document reader app
│   ├── App.js                   # Main entry point
│   ├── src/
│   │   ├── screens/             # Screen components
│   │   ├── components/          # Reusable components
│   │   ├── context/             # State management
│   │   └── utils/               # Utility functions
│   └── package.json
│
├── test-app/                    # Quiz and assessment app
│   ├── App.js
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── context/
│   │   └── data/                # Quiz questions
│   └── package.json
│
├── calendar-app/                # Academic calendar app
│   ├── App.js
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   └── context/
│   └── package.json
│
├── physics-lab/                 # Physics experiments
│   ├── App.js
│   ├── src/
│   │   ├── screens/
│   │   │   ├── HomeScreen.js
│   │   │   ├── CategoriesScreen.js
│   │   │   ├── ExperimentListScreen.js
│   │   │   ├── ExperimentDetailScreen.js
│   │   │   ├── SimulationScreen.js
│   │   │   └── SettingsScreen.js
│   │   ├── context/
│   │   │   └── AppContext.js
│   │   ├── data/
│   │   │   └── experiments.js   # 17 physics experiments
│   │   ├── simulations/
│   │   │   └── PhysicsEngine.js # Physics calculations
│   │   └── utils/
│   │       └── storage.js
│   └── package.json
│
├── chemistry-lab/               # Chemistry experiments
│   ├── App.js
│   ├── src/
│   │   ├── screens/
│   │   ├── context/
│   │   ├── data/
│   │   │   └── experiments.js   # 20+ chemistry experiments
│   │   ├── simulations/
│   │   │   └── ChemistryEngine.js
│   │   └── utils/
│   └── package.json
│
├── biology-lab/                 # Biology experiments
│   ├── App.js
│   ├── src/
│   │   ├── screens/
│   │   ├── context/
│   │   ├── data/
│   │   │   └── experiments.js   # 17 biology experiments
│   │   ├── simulations/
│   │   │   └── BiologyEngine.js
│   │   └── utils/
│   └── package.json
│
├── simulation-studio/           # Simulation creator
│   ├── App.js
│   ├── src/
│   │   ├── screens/
│   │   │   ├── HomeScreen.js
│   │   │   ├── SimulationListScreen.js
│   │   │   ├── SimulationEditorScreen.js
│   │   │   ├── PreviewScreen.js
│   │   │   ├── ExportScreen.js
│   │   │   ├── TemplatesScreen.js
│   │   │   ├── HelpScreen.js
│   │   │   └── SettingsScreen.js
│   │   ├── context/
│   │   ├── data/
│   │   │   └── templates.js     # Simulation templates
│   │   └── utils/
│   └── package.json
│
└── book-builder/                # Interactive book creator (web)
    ├── index.html               # Main application
    ├── package.json
    └── src/
        ├── css/
        │   ├── main.css         # Core styles
        │   ├── editor.css       # Editor styles
        │   └── preview.css      # Book preview styles
        └── js/
            ├── app.js           # Main controller
            ├── project.js       # Data management
            ├── editor.js        # Block editor
            ├── media.js         # Media manager
            ├── preview.js       # Live preview
            ├── storyboard.js    # Timeline view
            └── export.js        # HTML export
```

---

## Troubleshooting

### Common Issues

#### Issue: "expo: command not found"
```bash
# Solution: Install Expo CLI globally
npm install -g expo-cli

# Or use npx (no installation needed)
npx expo start
```

#### Issue: "Unable to resolve module" errors
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules
rm package-lock.json
npm install
npx expo start --clear
```

#### Issue: Metro Bundler stuck
```bash
# Solution: Reset cache
npx expo start --clear

# Or kill the process and restart
pkill -f "expo"
npx expo start
```

#### Issue: Android emulator not detected
```bash
# Solution: Ensure Android Studio is set up correctly
# 1. Open Android Studio
# 2. Go to Tools → AVD Manager
# 3. Create/Start a virtual device
# 4. Then run: npx expo start --android
```

#### Issue: iOS simulator issues (macOS)
```bash
# Solution: Reset simulator
xcrun simctl erase all

# Reinstall pods if needed
cd ios
pod install
cd ..
```

#### Issue: Book Builder not loading
```bash
# Solution 1: Use a local server
cd book-builder
npx serve . -p 3000

# Solution 2: Check browser console for errors
# Press F12 → Console tab

# Solution 3: Try a different browser
# Chrome or Firefox recommended
```

#### Issue: AsyncStorage data not persisting
```bash
# Solution: Check storage permissions
# For web: Enable localStorage in browser settings
# For mobile: App needs storage permissions
```

#### Issue: SVG animations not working
```bash
# Solution: Ensure react-native-svg is installed
npm install react-native-svg
npx expo install react-native-svg
```

### Getting Help

1. **Check the console logs** - Most errors are logged to the console
2. **Clear all caches** - `npx expo start --clear`
3. **Reinstall dependencies** - Delete `node_modules` and run `npm install`
4. **Check Expo documentation** - [docs.expo.dev](https://docs.expo.dev/)

---

## License

This project is for educational purposes.

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

*Last updated: November 2024*
