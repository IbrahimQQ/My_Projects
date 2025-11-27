export interface QuizQuestion {
  id: string;
  question: string;
  type: 'listening' | 'speaking' | 'writing' | 'reading';
  language: 'arabic' | 'chinese';
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  audioText?: string;
}

const arabicQuestions: QuizQuestion[] = [
  // Reading questions
  {
    id: 'ar_quiz_r_001',
    question: 'What does "السلام عليكم" mean?',
    type: 'reading',
    language: 'arabic',
    options: ['Good morning', 'Peace be upon you', 'How are you', 'Goodbye'],
    correctAnswer: 'Peace be upon you',
    explanation: 'السلام عليكم (as-salāmu ʿalaykum) is a traditional Arabic greeting meaning "Peace be upon you"'
  },
  {
    id: 'ar_quiz_r_002',
    question: 'What does "شكرا" mean?',
    type: 'reading',
    language: 'arabic',
    options: ['Please', 'Thank you', 'Sorry', 'Yes'],
    correctAnswer: 'Thank you',
    explanation: 'شكرا (shukran) means "Thank you" in Arabic'
  },
  {
    id: 'ar_quiz_r_003',
    question: 'What does "كتاب" mean?',
    type: 'reading',
    language: 'arabic',
    options: ['House', 'Book', 'Water', 'Friend'],
    correctAnswer: 'Book',
    explanation: 'كتاب (kitāb) means "book" in Arabic'
  },
  {
    id: 'ar_quiz_r_004',
    question: 'What is the Arabic word for "water"?',
    type: 'reading',
    language: 'arabic',
    options: ['ماء', 'طعام', 'بيت', 'يوم'],
    correctAnswer: 'ماء',
    explanation: 'ماء (māʾ) is the Arabic word for "water"'
  },
  {
    id: 'ar_quiz_r_005',
    question: 'What does "مع السلامة" mean?',
    type: 'reading',
    language: 'arabic',
    options: ['Hello', 'Thank you', 'Goodbye', 'Please'],
    correctAnswer: 'Goodbye',
    explanation: 'مع السلامة (maʿa s-salāma) means "Goodbye" literally "with peace"'
  },

  // Writing questions
  {
    id: 'ar_quiz_w_001',
    question: 'How do you say "Hello" in Arabic? (Type in Arabic or transliteration)',
    type: 'writing',
    language: 'arabic',
    correctAnswer: 'مرحبا',
    explanation: 'مرحبا (marḥaban) is a common way to say "Hello" in Arabic'
  },
  {
    id: 'ar_quiz_w_002',
    question: 'How do you say "Yes" in Arabic?',
    type: 'writing',
    language: 'arabic',
    correctAnswer: 'نعم',
    explanation: 'نعم (naʿam) means "Yes" in Arabic'
  },
  {
    id: 'ar_quiz_w_003',
    question: 'How do you say "No" in Arabic?',
    type: 'writing',
    language: 'arabic',
    correctAnswer: 'لا',
    explanation: 'لا (lā) means "No" in Arabic'
  },

  // Listening questions
  {
    id: 'ar_quiz_l_001',
    question: 'Listen and select the correct translation:',
    type: 'listening',
    language: 'arabic',
    audioText: 'صباح الخير',
    options: ['Good evening', 'Good morning', 'Good night', 'Hello'],
    correctAnswer: 'Good morning',
    explanation: 'صباح الخير (ṣabāḥ al-khayr) means "Good morning"'
  },
  {
    id: 'ar_quiz_l_002',
    question: 'Listen and select the correct translation:',
    type: 'listening',
    language: 'arabic',
    audioText: 'كيف حالك',
    options: ['What is your name', 'How are you', 'Where are you from', 'Thank you'],
    correctAnswer: 'How are you',
    explanation: 'كيف حالك (kayfa ḥāluk) means "How are you?"'
  },

  // Speaking questions
  {
    id: 'ar_quiz_s_001',
    question: 'How would you greet someone in the morning in Arabic?',
    type: 'speaking',
    language: 'arabic',
    options: ['السلام عليكم', 'صباح الخير', 'مساء الخير', 'مع السلامة'],
    correctAnswer: 'صباح الخير',
    explanation: 'صباح الخير (ṣabāḥ al-khayr) is "Good morning" in Arabic'
  }
];

const chineseQuestions: QuizQuestion[] = [
  // Reading questions
  {
    id: 'zh_quiz_r_001',
    question: 'What does "你好" mean?',
    type: 'reading',
    language: 'chinese',
    options: ['Goodbye', 'Thank you', 'Hello', 'Please'],
    correctAnswer: 'Hello',
    explanation: '你好 (nǐ hǎo) is the standard greeting in Chinese meaning "Hello"'
  },
  {
    id: 'zh_quiz_r_002',
    question: 'What does "谢谢" mean?',
    type: 'reading',
    language: 'chinese',
    options: ['Sorry', 'Please', 'Thank you', 'Yes'],
    correctAnswer: 'Thank you',
    explanation: '谢谢 (xièxie) means "Thank you" in Chinese'
  },
  {
    id: 'zh_quiz_r_003',
    question: 'What does "书" mean?',
    type: 'reading',
    language: 'chinese',
    options: ['Home', 'Water', 'Book', 'Friend'],
    correctAnswer: 'Book',
    explanation: '书 (shū) means "book" in Chinese'
  },
  {
    id: 'zh_quiz_r_004',
    question: 'What is the Chinese word for "water"?',
    type: 'reading',
    language: 'chinese',
    options: ['水', '食物', '家', '天'],
    correctAnswer: '水',
    explanation: '水 (shuǐ) is the Chinese word for "water"'
  },
  {
    id: 'zh_quiz_r_005',
    question: 'What does "再见" mean?',
    type: 'reading',
    language: 'chinese',
    options: ['Hello', 'Thank you', 'Goodbye', 'Please'],
    correctAnswer: 'Goodbye',
    explanation: '再见 (zàijiàn) means "Goodbye" in Chinese'
  },

  // Writing questions
  {
    id: 'zh_quiz_w_001',
    question: 'How do you say "Hello" in Chinese?',
    type: 'writing',
    language: 'chinese',
    correctAnswer: '你好',
    explanation: '你好 (nǐ hǎo) is how you say "Hello" in Chinese'
  },
  {
    id: 'zh_quiz_w_002',
    question: 'How do you say "Yes" in Chinese?',
    type: 'writing',
    language: 'chinese',
    correctAnswer: '是',
    explanation: '是 (shì) means "Yes" or "is" in Chinese'
  },
  {
    id: 'zh_quiz_w_003',
    question: 'How do you say "Please" in Chinese?',
    type: 'writing',
    language: 'chinese',
    correctAnswer: '请',
    explanation: '请 (qǐng) means "Please" in Chinese'
  },

  // Listening questions
  {
    id: 'zh_quiz_l_001',
    question: 'Listen and select the correct translation:',
    type: 'listening',
    language: 'chinese',
    audioText: '早上好',
    options: ['Good evening', 'Good morning', 'Good night', 'Goodbye'],
    correctAnswer: 'Good morning',
    explanation: '早上好 (zǎoshang hǎo) means "Good morning"'
  },
  {
    id: 'zh_quiz_l_002',
    question: 'Listen and select the correct translation:',
    type: 'listening',
    language: 'chinese',
    audioText: '你好吗',
    options: ['What is your name', 'How are you', 'Where are you from', 'Thank you'],
    correctAnswer: 'How are you',
    explanation: '你好吗 (nǐ hǎo ma) means "How are you?"'
  },

  // Speaking questions
  {
    id: 'zh_quiz_s_001',
    question: 'How would you greet someone in the morning in Chinese?',
    type: 'speaking',
    language: 'chinese',
    options: ['你好', '早上好', '晚上好', '再见'],
    correctAnswer: '早上好',
    explanation: '早上好 (zǎoshang hǎo) is "Good morning" in Chinese'
  }
];

export const getQuizQuestions = (
  type: 'listening' | 'speaking' | 'writing' | 'reading',
  language: 'arabic' | 'chinese' | 'both'
): QuizQuestion[] => {
  let questions: QuizQuestion[] = [];

  if (language === 'both') {
    questions = [...arabicQuestions, ...chineseQuestions];
  } else if (language === 'arabic') {
    questions = arabicQuestions;
  } else {
    questions = chineseQuestions;
  }

  // Filter by type
  questions = questions.filter(q => q.type === type);

  // Shuffle and return up to 10 questions
  return questions.sort(() => Math.random() - 0.5).slice(0, 10);
};
