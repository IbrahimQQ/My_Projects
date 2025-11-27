import React, { useState, useEffect } from 'react';
import { getDictionary, DictionaryEntry } from '../data/dictionary';
import { saveFavoriteWord, getFavoriteWords, removeFavoriteWord } from '../utils/storage';
import './Dictionary.css';

type Language = 'arabic' | 'chinese' | 'both';

const Dictionary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [language, setLanguage] = useState<Language>('both');
  const [results, setResults] = useState<DictionaryEntry[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    loadFavorites();
    performSearch();
  }, [searchTerm, language, showFavoritesOnly]);

  const loadFavorites = () => {
    const favs = getFavoriteWords();
    setFavorites(favs);
  };

  const performSearch = () => {
    const dictionary = getDictionary();
    let filtered = dictionary;

    if (language !== 'both') {
      filtered = filtered.filter(entry => entry.language === language);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.word.toLowerCase().includes(term) ||
        entry.translation.toLowerCase().includes(term) ||
        entry.transliteration.toLowerCase().includes(term)
      );
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter(entry => favorites.includes(entry.id));
    }

    setResults(filtered);
  };

  const toggleFavorite = (entryId: string) => {
    if (favorites.includes(entryId)) {
      removeFavoriteWord(entryId);
    } else {
      saveFavoriteWord(entryId);
    }
    loadFavorites();
  };

  return (
    <div className="section dictionary">
      <h2>📖 Dictionary</h2>

      <div className="dictionary-controls">
        <div className="search-bar">
          <input
            type="search"
            placeholder="Search for words, translations, or transliterations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <div className="language-toggle">
            <button
              className={language === 'both' ? 'active' : ''}
              onClick={() => setLanguage('both')}
            >
              🌍 Both
            </button>
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

          <button
            className={`favorites-toggle ${showFavoritesOnly ? 'active' : ''}`}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            ⭐ Favorites Only
          </button>
        </div>
      </div>

      <div className="results-info">
        <p>{results.length} {results.length === 1 ? 'result' : 'results'} found</p>
      </div>

      <div className="dictionary-results">
        {results.length === 0 ? (
          <div className="empty-state">
            <p>No results found. Try a different search term.</p>
          </div>
        ) : (
          results.map((entry) => (
            <div key={entry.id} className="dictionary-entry card">
              <div className="entry-header">
                <div className="entry-main">
                  <div className={entry.language === 'arabic' ? 'arabic-text' : 'chinese-text'}>
                    {entry.word}
                  </div>
                  <div className="transliteration">{entry.transliteration}</div>
                </div>
                <button
                  className={`favorite-btn ${favorites.includes(entry.id) ? 'favorited' : ''}`}
                  onClick={() => toggleFavorite(entry.id)}
                  title={favorites.includes(entry.id) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {favorites.includes(entry.id) ? '⭐' : '☆'}
                </button>
              </div>

              <div className="entry-translation">
                <strong>Translation:</strong> {entry.translation}
              </div>

              <div className="entry-meta">
                <span className="part-of-speech">{entry.partOfSpeech}</span>
                <span className="language-badge">
                  {entry.language === 'arabic' ? '🇸🇦 Arabic' : '🇨🇳 Chinese'}
                </span>
              </div>

              {entry.examples && entry.examples.length > 0 && (
                <div className="entry-examples">
                  <strong>Examples:</strong>
                  <ul>
                    {entry.examples.map((example, idx) => (
                      <li key={idx}>
                        <div className={entry.language === 'arabic' ? 'arabic-text' : 'chinese-text'}>
                          {example.sentence}
                        </div>
                        <div className="example-translation">{example.translation}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dictionary;
