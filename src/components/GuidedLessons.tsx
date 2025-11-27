import React, { useState } from 'react';
import { getLessons, Lesson } from '../data/lessons';
import { saveProgress, getProgress } from '../utils/storage';
import './GuidedLessons.css';

const GuidedLessons: React.FC = () => {
  const [selectedChapter, setSelectedChapter] = useState<number>(0);
  const [selectedLesson, setSelectedLesson] = useState<number>(0);
  const lessons = getLessons();
  const progress = getProgress();

  const currentLesson = lessons[selectedChapter]?.lessons[selectedLesson];

  const markAsComplete = () => {
    const key = `lesson_${selectedChapter}_${selectedLesson}`;
    saveProgress(key, { completed: true, completedAt: new Date().toISOString() });
    alert('Lesson marked as complete! 🎉');
  };

  const nextLesson = () => {
    if (selectedLesson < lessons[selectedChapter].lessons.length - 1) {
      setSelectedLesson(selectedLesson + 1);
    } else if (selectedChapter < lessons.length - 1) {
      setSelectedChapter(selectedChapter + 1);
      setSelectedLesson(0);
    }
  };

  const previousLesson = () => {
    if (selectedLesson > 0) {
      setSelectedLesson(selectedLesson - 1);
    } else if (selectedChapter > 0) {
      setSelectedChapter(selectedChapter - 1);
      setSelectedLesson(lessons[selectedChapter - 1].lessons.length - 1);
    }
  };

  return (
    <div className="section guided-lessons">
      <h2>📚 Guided Lessons</h2>

      <div className="lessons-layout">
        <aside className="chapters-sidebar">
          <h3>Chapters</h3>
          {lessons.map((chapter, idx) => (
            <div
              key={idx}
              className={`chapter-item ${selectedChapter === idx ? 'active' : ''}`}
              onClick={() => {
                setSelectedChapter(idx);
                setSelectedLesson(0);
              }}
            >
              <div className="chapter-title">
                {chapter.title}
              </div>
              <div className="chapter-meta">
                {chapter.lessons.length} lessons
              </div>
            </div>
          ))}
        </aside>

        <div className="lesson-content">
          {currentLesson ? (
            <>
              <div className="lesson-header">
                <h2>{currentLesson.title}</h2>
                <p className="lesson-description">{currentLesson.description}</p>
              </div>

              <div className="lesson-navigation-top">
                {lessons[selectedChapter].lessons.map((_, idx) => (
                  <button
                    key={idx}
                    className={`lesson-dot ${selectedLesson === idx ? 'active' : ''} ${
                      progress[`lesson_${selectedChapter}_${idx}`] ? 'completed' : ''
                    }`}
                    onClick={() => setSelectedLesson(idx)}
                    title={`Lesson ${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <div className="dual-view">
                <div className="language-panel">
                  <h3>🇸🇦 Arabic</h3>
                  <div className="content-section">
                    <h4>Vocabulary</h4>
                    <div className="vocabulary-list">
                      {currentLesson.arabic.vocabulary.map((item, idx) => (
                        <div key={idx} className="vocab-item">
                          <span className="arabic-text">{item.word}</span>
                          <span className="transliteration">{item.transliteration}</span>
                          <span className="meaning">{item.meaning}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="content-section">
                    <h4>Grammar</h4>
                    <p>{currentLesson.arabic.grammar}</p>
                  </div>

                  <div className="content-section">
                    <h4>Examples</h4>
                    {currentLesson.arabic.examples.map((example, idx) => (
                      <div key={idx} className="example-item">
                        <div className="arabic-text">{example.sentence}</div>
                        <div className="translation">{example.translation}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="language-panel">
                  <h3>🇨🇳 Chinese</h3>
                  <div className="content-section">
                    <h4>Vocabulary</h4>
                    <div className="vocabulary-list">
                      {currentLesson.chinese.vocabulary.map((item, idx) => (
                        <div key={idx} className="vocab-item">
                          <span className="chinese-text">{item.word}</span>
                          <span className="transliteration">{item.pinyin}</span>
                          <span className="meaning">{item.meaning}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="content-section">
                    <h4>Grammar</h4>
                    <p>{currentLesson.chinese.grammar}</p>
                  </div>

                  <div className="content-section">
                    <h4>Examples</h4>
                    {currentLesson.chinese.examples.map((example, idx) => (
                      <div key={idx} className="example-item">
                        <div className="chinese-text">{example.sentence}</div>
                        <div className="translation">{example.translation}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {currentLesson.comparison && (
                <div className="comparison-section">
                  <h3>🔄 Language Comparison</h3>
                  <div className="comparison-content">
                    <div className="similarities">
                      <h4>✅ Similarities</h4>
                      <ul>
                        {currentLesson.comparison.similarities.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="differences">
                      <h4>⚡ Differences</h4>
                      <ul>
                        {currentLesson.comparison.differences.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="lesson-actions">
                <button
                  className="secondary-btn"
                  onClick={previousLesson}
                  disabled={selectedChapter === 0 && selectedLesson === 0}
                >
                  ← Previous
                </button>
                <button className="primary-btn" onClick={markAsComplete}>
                  ✓ Mark Complete
                </button>
                <button
                  className="secondary-btn"
                  onClick={nextLesson}
                  disabled={
                    selectedChapter === lessons.length - 1 &&
                    selectedLesson === lessons[selectedChapter].lessons.length - 1
                  }
                >
                  Next →
                </button>
              </div>
            </>
          ) : (
            <p>Select a chapter to begin learning</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuidedLessons;
