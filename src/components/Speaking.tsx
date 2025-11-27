import React, { useState, useRef, useEffect } from 'react';
import { getSpeakingPhrases, SpeakingPhrase } from '../data/speakingPhrases';
import './Speaking.css';

type Language = 'arabic' | 'chinese';

const Speaking: React.FC = () => {
  const [language, setLanguage] = useState<Language>('arabic');
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [selectedPhrase, setSelectedPhrase] = useState<SpeakingPhrase | null>(null);
  const [recordings, setRecordings] = useState<{ phrase: string; url: string; date: string }[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const phrases = getSpeakingPhrases(language);

  useEffect(() => {
    if (phrases.length > 0) {
      setSelectedPhrase(phrases[0]);
    }
  }, [language]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);

        if (selectedPhrase) {
          const newRecording = {
            phrase: selectedPhrase.phrase,
            url,
            date: new Date().toISOString()
          };
          setRecordings([newRecording, ...recordings]);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const playRecording = () => {
    if (audioRef.current && audioURL) {
      audioRef.current.play();
    }
  };

  const speakPhrase = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'arabic' ? 'ar-SA' : 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="section speaking">
      <h2>🎤 Speaking Practice</h2>

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

      <div className="speaking-layout">
        <div className="phrases-list">
          <h3>Practice Phrases</h3>
          {phrases.map((phrase, idx) => (
            <div
              key={idx}
              className={`phrase-card ${selectedPhrase?.id === phrase.id ? 'active' : ''}`}
              onClick={() => setSelectedPhrase(phrase)}
            >
              <div className="phrase-category">{phrase.category}</div>
              <div className={language === 'arabic' ? 'arabic-text' : 'chinese-text'}>
                {phrase.phrase}
              </div>
              <div className="phrase-transliteration">{phrase.transliteration}</div>
              <div className="phrase-translation">{phrase.translation}</div>
              <button
                className="listen-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  speakPhrase(phrase.phrase);
                }}
                title="Listen to pronunciation"
              >
                🔊 Listen
              </button>
            </div>
          ))}
        </div>

        <div className="recording-area">
          {selectedPhrase && (
            <>
              <div className="current-phrase">
                <h3>Current Phrase</h3>
                <div className="phrase-display">
                  <div className={language === 'arabic' ? 'arabic-text' : 'chinese-text'}>
                    {selectedPhrase.phrase}
                  </div>
                  <div className="transliteration">{selectedPhrase.transliteration}</div>
                  <div className="translation">{selectedPhrase.translation}</div>
                </div>
                <button
                  className="primary-btn"
                  onClick={() => speakPhrase(selectedPhrase.phrase)}
                >
                  🔊 Hear Example
                </button>
              </div>

              <div className="recording-controls">
                <h3>Your Recording</h3>
                <div className="record-buttons">
                  {!isRecording ? (
                    <button className="record-btn" onClick={startRecording}>
                      <span className="record-icon">⏺</span>
                      Start Recording
                    </button>
                  ) : (
                    <button className="stop-btn" onClick={stopRecording}>
                      <span className="stop-icon">⏹</span>
                      Stop Recording
                    </button>
                  )}
                </div>

                {isRecording && (
                  <div className="recording-indicator">
                    <span className="pulse"></span>
                    Recording...
                  </div>
                )}

                {audioURL && (
                  <div className="playback-controls">
                    <audio ref={audioRef} src={audioURL} />
                    <button className="primary-btn" onClick={playRecording}>
                      ▶️ Play Your Recording
                    </button>
                  </div>
                )}
              </div>

              <div className="tips-section">
                <h4>💡 Speaking Tips</h4>
                <ul>
                  <li>Listen to the example pronunciation carefully</li>
                  <li>Repeat the phrase multiple times before recording</li>
                  <li>Speak clearly and at a natural pace</li>
                  <li>Compare your recording with the example</li>
                  <li>Practice regularly for better pronunciation</li>
                </ul>
              </div>
            </>
          )}

          {recordings.length > 0 && (
            <div className="recordings-history">
              <h3>Recent Recordings</h3>
              <div className="recordings-list">
                {recordings.slice(0, 5).map((recording, idx) => (
                  <div key={idx} className="recording-item card">
                    <div className="recording-phrase">{recording.phrase}</div>
                    <div className="recording-date">
                      {new Date(recording.date).toLocaleString()}
                    </div>
                    <audio controls src={recording.url} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Speaking;
