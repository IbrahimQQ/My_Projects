import React, { useState, useRef, useEffect } from 'react';
import { savePracticedWord, getPracticedWords } from '../utils/storage';
import './Practice.css';

type Language = 'arabic' | 'chinese';

interface PracticedItem {
  text: string;
  language: Language;
  translation: string;
  practicedAt: string;
}

const Practice: React.FC = () => {
  const [language, setLanguage] = useState<Language>('arabic');
  const [isDrawing, setIsDrawing] = useState(false);
  const [customWord, setCustomWord] = useState('');
  const [customTranslation, setCustomTranslation] = useState('');
  const [practicedWords, setPracticedWords] = useState<PracticedItem[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    canvas.style.width = `${canvas.offsetWidth / 2}px`;
    canvas.style.height = `${canvas.offsetHeight / 2}px`;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.scale(2, 2);
    context.lineCap = 'round';
    context.strokeStyle = '#333';
    context.lineWidth = 3;
    contextRef.current = context;

    loadPracticedWords();
  }, []);

  const loadPracticedWords = () => {
    const words = getPracticedWords();
    setPracticedWords(words);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    contextRef.current?.beginPath();
    contextRef.current?.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      e.preventDefault();
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    contextRef.current?.lineTo(x, y);
    contextRef.current?.stroke();
  };

  const stopDrawing = () => {
    contextRef.current?.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;
    contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
  };

  const addToPracticed = () => {
    if (!customWord.trim() || !customTranslation.trim()) {
      alert('Please enter both word and translation');
      return;
    }

    const item: PracticedItem = {
      text: customWord,
      language,
      translation: customTranslation,
      practicedAt: new Date().toISOString()
    };

    savePracticedWord(item);
    setCustomWord('');
    setCustomTranslation('');
    loadPracticedWords();
    clearCanvas();
    alert('Added to practiced words! ✓');
  };

  const practicePrompts = {
    arabic: [
      { text: 'السلام عليكم', translation: 'Peace be upon you (Hello)' },
      { text: 'شكرا', translation: 'Thank you' },
      { text: 'مع السلامة', translation: 'Goodbye' },
      { text: 'نعم', translation: 'Yes' },
      { text: 'لا', translation: 'No' }
    ],
    chinese: [
      { text: '你好', translation: 'Hello (nǐ hǎo)' },
      { text: '谢谢', translation: 'Thank you (xiè xie)' },
      { text: '再见', translation: 'Goodbye (zài jiàn)' },
      { text: '是', translation: 'Yes (shì)' },
      { text: '不是', translation: 'No (bù shì)' }
    ]
  };

  return (
    <div className="section practice">
      <h2>✍️ Practice Writing</h2>

      <div className="language-toggle">
        <button
          className={language === 'arabic' ? 'active' : ''}
          onClick={() => setLanguage('arabic')}
        >
          🇸🇦 Arabic
        </button>
        <button
          className={language === 'chinese' ? 'active' : ''}
          onClick={() => setLanguage('chinese')}
        >
          🇨🇳 Chinese
        </button>
      </div>

      <div className="practice-layout">
        <div className="practice-area">
          <div className="prompts-section">
            <h3>Practice These:</h3>
            <div className="prompts-grid">
              {practicePrompts[language].map((prompt, idx) => (
                <div key={idx} className="prompt-card">
                  <div className={language === 'arabic' ? 'arabic-text' : 'chinese-text'}>
                    {prompt.text}
                  </div>
                  <div className="prompt-translation">{prompt.translation}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="canvas-section">
            <div className="canvas-header">
              <h3>Writing Canvas</h3>
              <button className="secondary-btn" onClick={clearCanvas}>
                🗑️ Clear
              </button>
            </div>
            <canvas
              ref={canvasRef}
              className="drawing-canvas"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <p className="canvas-hint">Draw with mouse or touch to practice writing</p>
          </div>

          <div className="add-custom-section">
            <h3>Add to Practiced Words</h3>
            <div className="custom-input-group">
              <input
                type="text"
                placeholder={`Enter word in ${language === 'arabic' ? 'Arabic' : 'Chinese'}`}
                value={customWord}
                onChange={(e) => setCustomWord(e.target.value)}
                className={language === 'arabic' ? 'arabic-text' : 'chinese-text'}
              />
              <input
                type="text"
                placeholder="Enter translation"
                value={customTranslation}
                onChange={(e) => setCustomTranslation(e.target.value)}
              />
              <button className="primary-btn" onClick={addToPracticed}>
                ➕ Add to Practiced
              </button>
            </div>
          </div>
        </div>

        <div className="practiced-words-section">
          <h3>📝 Your Practiced Words</h3>
          <div className="practiced-list">
            {practicedWords.length === 0 ? (
              <p className="empty-state">No practiced words yet. Start practicing!</p>
            ) : (
              practicedWords.map((item, idx) => (
                <div key={idx} className="practiced-item card">
                  <div className={item.language === 'arabic' ? 'arabic-text' : 'chinese-text'}>
                    {item.text}
                  </div>
                  <div className="practiced-translation">{item.translation}</div>
                  <div className="practiced-meta">
                    {item.language === 'arabic' ? '🇸🇦' : '🇨🇳'} •{' '}
                    {new Date(item.practicedAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Practice;
