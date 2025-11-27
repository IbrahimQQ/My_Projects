import React, { useState, useEffect } from 'react';
import { getQuizQuestions, QuizQuestion } from '../data/quizQuestions';
import { saveQuizScore } from '../utils/storage';
import './Quiz.css';

type QuizType = 'listening' | 'speaking' | 'writing' | 'reading';
type Language = 'arabic' | 'chinese' | 'both';

const Quiz: React.FC = () => {
  const [quizType, setQuizType] = useState<QuizType>('reading');
  const [language, setLanguage] = useState<Language>('both');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  const startQuiz = () => {
    const quizQuestions = getQuizQuestions(quizType, language);
    setQuestions(quizQuestions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizStarted(true);
    setQuizCompleted(false);
    setShowResult(false);
    setSelectedAnswer('');
    setUserAnswer('');
  };

  const checkAnswer = () => {
    const answer = quizType === 'writing' ? userAnswer : selectedAnswer;
    const isCorrect = answer.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();

    if (isCorrect) {
      setScore(score + 1);
    }

    setShowResult(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer('');
      setUserAnswer('');
      setShowResult(false);
    } else {
      setQuizCompleted(true);
      const finalScore = {
        type: quizType,
        language,
        score,
        total: questions.length,
        date: new Date().toISOString()
      };
      saveQuizScore(finalScore);
    }
  };

  const speakQuestion = (text: string, lang: 'arabic' | 'chinese') => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'arabic' ? 'ar-SA' : 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const renderQuizSetup = () => (
    <div className="quiz-setup">
      <h3>Choose Your Quiz</h3>

      <div className="quiz-type-selection">
        <h4>Quiz Type</h4>
        <div className="type-grid">
          <button
            className={`type-card ${quizType === 'reading' ? 'active' : ''}`}
            onClick={() => setQuizType('reading')}
          >
            <span className="type-icon">📖</span>
            <span className="type-name">Reading</span>
            <span className="type-desc">Test comprehension</span>
          </button>
          <button
            className={`type-card ${quizType === 'writing' ? 'active' : ''}`}
            onClick={() => setQuizType('writing')}
          >
            <span className="type-icon">✍️</span>
            <span className="type-name">Writing</span>
            <span className="type-desc">Type the translation</span>
          </button>
          <button
            className={`type-card ${quizType === 'listening' ? 'active' : ''}`}
            onClick={() => setQuizType('listening')}
          >
            <span className="type-icon">👂</span>
            <span className="type-name">Listening</span>
            <span className="type-desc">Hear and answer</span>
          </button>
          <button
            className={`type-card ${quizType === 'speaking' ? 'active' : ''}`}
            onClick={() => setQuizType('speaking')}
          >
            <span className="type-icon">🗣️</span>
            <span className="type-name">Speaking</span>
            <span className="type-desc">Pronounce correctly</span>
          </button>
        </div>
      </div>

      <div className="language-selection">
        <h4>Language</h4>
        <div className="language-toggle">
          <button
            className={language === 'both' ? 'active' : ''}
            onClick={() => setLanguage('both')}
          >
            🌍 Both Languages
          </button>
          <button
            className={language === 'arabic' ? 'active' : ''}
            onClick={() => setLanguage('arabic')}
          >
            🇸🇦 Arabic Only
          </button>
          <button
            className={language === 'chinese' ? 'active' : ''}
            onClick={() => setLanguage('chinese')}
          >
            🇨🇳 Chinese Only
          </button>
        </div>
      </div>

      <button className="primary-btn start-quiz-btn" onClick={startQuiz}>
        🎯 Start Quiz
      </button>
    </div>
  );

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    return (
      <div className="quiz-question">
        <div className="quiz-header">
          <div className="quiz-progress">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
          <div className="quiz-score">
            Score: {score}/{questions.length}
          </div>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        <div className="question-content">
          <div className="question-type-badge">
            {quizType === 'reading' && '📖'}
            {quizType === 'writing' && '✍️'}
            {quizType === 'listening' && '👂'}
            {quizType === 'speaking' && '🗣️'}
            {' '}{quizType.charAt(0).toUpperCase() + quizType.slice(1)}
          </div>

          <h3 className="question-text">{currentQuestion.question}</h3>

          {quizType === 'listening' && (
            <button
              className="listen-question-btn"
              onClick={() => speakQuestion(currentQuestion.audioText || '', currentQuestion.language)}
            >
              🔊 Play Audio
            </button>
          )}

          {quizType === 'writing' ? (
            <div className="writing-answer">
              <input
                type="text"
                placeholder="Type your answer here..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={showResult}
                className={currentQuestion.language === 'arabic' ? 'arabic-text' :
                          currentQuestion.language === 'chinese' ? 'chinese-text' : ''}
              />
            </div>
          ) : (
            <div className="answer-options">
              {currentQuestion.options?.map((option, idx) => (
                <button
                  key={idx}
                  className={`option-btn ${
                    selectedAnswer === option ? 'selected' : ''
                  } ${
                    showResult && option === currentQuestion.correctAnswer
                      ? 'correct'
                      : showResult && selectedAnswer === option
                      ? 'incorrect'
                      : ''
                  }`}
                  onClick={() => !showResult && setSelectedAnswer(option)}
                  disabled={showResult}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {showResult && (
            <div className={`result-feedback ${
              (quizType === 'writing' ? userAnswer : selectedAnswer).toLowerCase().trim() ===
              currentQuestion.correctAnswer.toLowerCase().trim() ? 'correct' : 'incorrect'
            }`}>
              {(quizType === 'writing' ? userAnswer : selectedAnswer).toLowerCase().trim() ===
               currentQuestion.correctAnswer.toLowerCase().trim() ? (
                <>
                  <span className="result-icon">✅</span>
                  <span>Correct!</span>
                </>
              ) : (
                <>
                  <span className="result-icon">❌</span>
                  <span>Incorrect. The correct answer is: {currentQuestion.correctAnswer}</span>
                </>
              )}
              {currentQuestion.explanation && (
                <div className="explanation">
                  💡 {currentQuestion.explanation}
                </div>
              )}
            </div>
          )}

          <div className="question-actions">
            {!showResult ? (
              <button
                className="primary-btn"
                onClick={checkAnswer}
                disabled={quizType === 'writing' ? !userAnswer.trim() : !selectedAnswer}
              >
                Check Answer
              </button>
            ) : (
              <button className="primary-btn" onClick={nextQuestion}>
                {currentQuestionIndex < questions.length - 1 ? 'Next Question →' : 'Finish Quiz'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const percentage = (score / questions.length) * 100;
    let message = '';
    let emoji = '';

    if (percentage >= 90) {
      message = 'Excellent! You\'re a master!';
      emoji = '🏆';
    } else if (percentage >= 70) {
      message = 'Great job! Keep it up!';
      emoji = '🌟';
    } else if (percentage >= 50) {
      message = 'Good effort! Practice more!';
      emoji = '👍';
    } else {
      message = 'Keep practicing! You\'ll improve!';
      emoji = '💪';
    }

    return (
      <div className="quiz-results">
        <div className="results-emoji">{emoji}</div>
        <h2>Quiz Complete!</h2>
        <div className="results-score">
          <div className="score-circle">
            <div className="score-number">{score}</div>
            <div className="score-total">/ {questions.length}</div>
          </div>
          <div className="score-percentage">{percentage.toFixed(0)}%</div>
        </div>
        <p className="results-message">{message}</p>
        <div className="results-actions">
          <button className="primary-btn" onClick={() => setQuizStarted(false)}>
            📚 Take Another Quiz
          </button>
          <button className="secondary-btn" onClick={startQuiz}>
            🔄 Retry This Quiz
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="section quiz">
      <h2>🎯 Quiz Time</h2>

      {!quizStarted && renderQuizSetup()}
      {quizStarted && !quizCompleted && renderQuestion()}
      {quizCompleted && renderResults()}
    </div>
  );
};

export default Quiz;
