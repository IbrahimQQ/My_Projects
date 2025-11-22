# My_Projects

React and JavaScript Projects I am currently working on. Feel free to browse around.

## Student Educational Apps Suite

A comprehensive suite of three interconnected React Native/Expo applications designed for students on Android tablets (15.6 inch screens).

### Apps Included

#### 1. Reader & Browser App (`student-apps/reader-browser-app`)
A full-featured educational browser and document reader with monitoring capabilities.

**Features:**
- Web browsing with tab management (PC browser style)
- Split-screen viewing for side-by-side tabs
- Document reader supporting HTML, PDF, text files
- Subject-organized content with table of contents
- Reading progress tracking with breadcrumb navigation
- Font size adjustment and dark/light mode
- Integrated floating Dictionary tool
- Integrated floating Scientific Calculator
- Comprehensive monitoring system (tracks reading sessions, page views, time spent)
- Auto-save monitoring data every 5 minutes
- Export data as CSV with student name and class naming convention
- Local user registration (no server required)

#### 2. Test App & Question Generator (`student-apps/test-app`)
An intelligent testing application with AI-powered question generation.

**Features:**
- Question bank based on JAMB/WAEC patterns
- Multiple question types (MCQ, True/False, Fill-in-blank)
- Adaptive question generation based on proficiency
- 20-50 questions per session with mixed difficulty
- Test popup reminders during device usage
- Mark for review feature and question navigation
- Real-time timer and progress tracking
- Score calculation with topic breakdown
- Proficiency tracking per topic (0-100%)
- Achievement badges and gamification
- Practice mode for unlimited attempts
- Data export in JSON and CSV formats
- Integration with Reader App reading history

#### 3. Calendar App (`student-apps/calendar-app`)
An intelligent calendar with automated study scheduling.

**Features:**
- Monthly, weekly, and daily calendar views
- Smart study plan generation based on proficiency data
- Automatic scheduling after school hours
- Spaced repetition algorithm for optimal review
- Study streak tracking and goals
- Weak topic prioritization
- Drag and drop event management
- Color-coded events by category (Study, Exam, Personal, School)
- Push notification reminders
- Study time analytics and reports
- Weekly/monthly progress tracking
- Integration with Reader and Test apps

### Technology Stack

- **Framework:** React Native with Expo
- **Navigation:** React Navigation (Stack, Bottom Tabs)
- **Storage:** AsyncStorage for local persistence
- **File System:** Expo FileSystem for data export/import
- **Inter-app Communication:** Shared local file directory

### Getting Started

```bash
# Navigate to any app directory
cd student-apps/reader-browser-app

# Install dependencies
npm install

# Start the development server
npm start

# Run on Android
npm run android
```

### Data Flow Between Apps

1. **Reader App** generates monitoring data (CSV) with reading sessions
2. **Test App** imports reader data to generate relevant questions based on topics studied
3. **Calendar App** imports proficiency data from Test App to create smart study schedules
4. All apps share user profile data through a common shared directory

### Screen Size Optimization

All apps are optimized for a 15.6 inch Android tablet display with:
- Larger touch targets
- Responsive grid layouts
- Split-screen support
- Comfortable reading fonts
