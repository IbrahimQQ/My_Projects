// Local storage utilities for the app

export const saveProgress = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving progress:', error);
  }
};

export const getProgress = (): Record<string, any> => {
  try {
    const keys = Object.keys(localStorage);
    const progress: Record<string, any> = {};
    keys.forEach(key => {
      if (key.startsWith('lesson_')) {
        const data = localStorage.getItem(key);
        if (data) {
          progress[key] = JSON.parse(data);
        }
      }
    });
    return progress;
  } catch (error) {
    console.error('Error getting progress:', error);
    return {};
  }
};

export const savePracticedWord = (item: any) => {
  try {
    const practiced = getPracticedWords();
    practiced.unshift(item);
    localStorage.setItem('practiced_words', JSON.stringify(practiced));
  } catch (error) {
    console.error('Error saving practiced word:', error);
  }
};

export const getPracticedWords = (): any[] => {
  try {
    const data = localStorage.getItem('practiced_words');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting practiced words:', error);
    return [];
  }
};

export const saveFavoriteWord = (wordId: string) => {
  try {
    const favorites = getFavoriteWords();
    if (!favorites.includes(wordId)) {
      favorites.push(wordId);
      localStorage.setItem('favorite_words', JSON.stringify(favorites));
    }
  } catch (error) {
    console.error('Error saving favorite word:', error);
  }
};

export const removeFavoriteWord = (wordId: string) => {
  try {
    const favorites = getFavoriteWords();
    const filtered = favorites.filter(id => id !== wordId);
    localStorage.setItem('favorite_words', JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing favorite word:', error);
  }
};

export const getFavoriteWords = (): string[] => {
  try {
    const data = localStorage.getItem('favorite_words');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting favorite words:', error);
    return [];
  }
};

export const saveQuizScore = (score: any) => {
  try {
    const scores = getQuizScores();
    scores.unshift(score);
    // Keep only last 20 scores
    if (scores.length > 20) {
      scores.pop();
    }
    localStorage.setItem('quiz_scores', JSON.stringify(scores));
  } catch (error) {
    console.error('Error saving quiz score:', error);
  }
};

export const getQuizScores = (): any[] => {
  try {
    const data = localStorage.getItem('quiz_scores');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting quiz scores:', error);
    return [];
  }
};
