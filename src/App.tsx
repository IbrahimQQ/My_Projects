import React, { useState } from 'react';
import './App.css';
import GuidedLessons from './components/GuidedLessons';
import Practice from './components/Practice';
import Dictionary from './components/Dictionary';
import Speaking from './components/Speaking';
import Quiz from './components/Quiz';

type Section = 'lessons' | 'practice' | 'dictionary' | 'speaking' | 'quiz';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('lessons');

  const renderSection = () => {
    switch (activeSection) {
      case 'lessons':
        return <GuidedLessons />;
      case 'practice':
        return <Practice />;
      case 'dictionary':
        return <Dictionary />;
      case 'speaking':
        return <Speaking />;
      case 'quiz':
        return <Quiz />;
      default:
        return <GuidedLessons />;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🌍 Dual Language Learning</h1>
        <p className="subtitle">Master Arabic & Chinese Together</p>
      </header>

      <nav className="navigation">
        <button
          className={activeSection === 'lessons' ? 'active' : ''}
          onClick={() => setActiveSection('lessons')}
        >
          📚 Guided Lessons
        </button>
        <button
          className={activeSection === 'practice' ? 'active' : ''}
          onClick={() => setActiveSection('practice')}
        >
          ✍️ Practice
        </button>
        <button
          className={activeSection === 'dictionary' ? 'active' : ''}
          onClick={() => setActiveSection('dictionary')}
        >
          📖 Dictionary
        </button>
        <button
          className={activeSection === 'speaking' ? 'active' : ''}
          onClick={() => setActiveSection('speaking')}
        >
          🎤 Speaking
        </button>
        <button
          className={activeSection === 'quiz' ? 'active' : ''}
          onClick={() => setActiveSection('quiz')}
        >
          🎯 Quiz
        </button>
      </nav>

      <main className="main-content">
        {renderSection()}
      </main>
    </div>
  );
};

export default App;
