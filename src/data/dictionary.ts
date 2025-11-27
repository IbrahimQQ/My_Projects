export interface DictionaryEntry {
  id: string;
  word: string;
  transliteration: string;
  translation: string;
  language: 'arabic' | 'chinese';
  partOfSpeech: string;
  examples?: Array<{
    sentence: string;
    translation: string;
  }>;
}

export const getDictionary = (): DictionaryEntry[] => {
  return [
    // Arabic entries
    {
      id: 'ar_001',
      word: 'كتاب',
      transliteration: 'kitāb',
      translation: 'book',
      language: 'arabic',
      partOfSpeech: 'noun',
      examples: [
        { sentence: 'هذا كتاب جيد', translation: 'This is a good book' }
      ]
    },
    {
      id: 'ar_002',
      word: 'بيت',
      transliteration: 'bayt',
      translation: 'house, home',
      language: 'arabic',
      partOfSpeech: 'noun',
      examples: [
        { sentence: 'بيتي كبير', translation: 'My house is big' }
      ]
    },
    {
      id: 'ar_003',
      word: 'ماء',
      transliteration: 'māʾ',
      translation: 'water',
      language: 'arabic',
      partOfSpeech: 'noun',
      examples: [
        { sentence: 'أريد ماء من فضلك', translation: 'I want water please' }
      ]
    },
    {
      id: 'ar_004',
      word: 'طعام',
      transliteration: 'ṭaʿām',
      translation: 'food',
      language: 'arabic',
      partOfSpeech: 'noun',
      examples: [
        { sentence: 'الطعام لذيذ', translation: 'The food is delicious' }
      ]
    },
    {
      id: 'ar_005',
      word: 'صديق',
      transliteration: 'ṣadīq',
      translation: 'friend',
      language: 'arabic',
      partOfSpeech: 'noun',
      examples: [
        { sentence: 'هو صديقي', translation: 'He is my friend' }
      ]
    },
    {
      id: 'ar_006',
      word: 'مدرسة',
      transliteration: 'madrasa',
      translation: 'school',
      language: 'arabic',
      partOfSpeech: 'noun',
      examples: [
        { sentence: 'أذهب إلى المدرسة', translation: 'I go to school' }
      ]
    },
    {
      id: 'ar_007',
      word: 'يوم',
      transliteration: 'yawm',
      translation: 'day',
      language: 'arabic',
      partOfSpeech: 'noun',
      examples: [
        { sentence: 'يوم جميل', translation: 'A beautiful day' }
      ]
    },
    {
      id: 'ar_008',
      word: 'ليلة',
      transliteration: 'layla',
      translation: 'night',
      language: 'arabic',
      partOfSpeech: 'noun',
      examples: [
        { sentence: 'ليلة سعيدة', translation: 'Happy night (Good night)' }
      ]
    },
    {
      id: 'ar_009',
      word: 'حب',
      transliteration: 'ḥubb',
      translation: 'love',
      language: 'arabic',
      partOfSpeech: 'noun',
      examples: [
        { sentence: 'الحب جميل', translation: 'Love is beautiful' }
      ]
    },
    {
      id: 'ar_010',
      word: 'عمل',
      transliteration: 'ʿamal',
      translation: 'work',
      language: 'arabic',
      partOfSpeech: 'noun',
      examples: [
        { sentence: 'أذهب إلى العمل', translation: 'I go to work' }
      ]
    },

    // Chinese entries
    {
      id: 'zh_001',
      word: '书',
      transliteration: 'shū',
      translation: 'book',
      language: 'chinese',
      partOfSpeech: 'noun',
      examples: [
        { sentence: '这是一本好书', translation: 'This is a good book' }
      ]
    },
    {
      id: 'zh_002',
      word: '家',
      transliteration: 'jiā',
      translation: 'home, family',
      language: 'chinese',
      partOfSpeech: 'noun',
      examples: [
        { sentence: '我的家很大', translation: 'My home is big' }
      ]
    },
    {
      id: 'zh_003',
      word: '水',
      transliteration: 'shuǐ',
      translation: 'water',
      language: 'chinese',
      partOfSpeech: 'noun',
      examples: [
        { sentence: '我要水', translation: 'I want water' }
      ]
    },
    {
      id: 'zh_004',
      word: '食物',
      transliteration: 'shíwù',
      translation: 'food',
      language: 'chinese',
      partOfSpeech: 'noun',
      examples: [
        { sentence: '食物很好吃', translation: 'The food is delicious' }
      ]
    },
    {
      id: 'zh_005',
      word: '朋友',
      transliteration: 'péngyou',
      translation: 'friend',
      language: 'chinese',
      partOfSpeech: 'noun',
      examples: [
        { sentence: '他是我的朋友', translation: 'He is my friend' }
      ]
    },
    {
      id: 'zh_006',
      word: '学校',
      transliteration: 'xuéxiào',
      translation: 'school',
      language: 'chinese',
      partOfSpeech: 'noun',
      examples: [
        { sentence: '我去学校', translation: 'I go to school' }
      ]
    },
    {
      id: 'zh_007',
      word: '天',
      transliteration: 'tiān',
      translation: 'day, sky',
      language: 'chinese',
      partOfSpeech: 'noun',
      examples: [
        { sentence: '今天是美好的一天', translation: 'Today is a beautiful day' }
      ]
    },
    {
      id: 'zh_008',
      word: '夜',
      transliteration: 'yè',
      translation: 'night',
      language: 'chinese',
      partOfSpeech: 'noun',
      examples: [
        { sentence: '晚安', translation: 'Good night' }
      ]
    },
    {
      id: 'zh_009',
      word: '爱',
      transliteration: 'ài',
      translation: 'love',
      language: 'chinese',
      partOfSpeech: 'noun/verb',
      examples: [
        { sentence: '爱很美', translation: 'Love is beautiful' }
      ]
    },
    {
      id: 'zh_010',
      word: '工作',
      transliteration: 'gōngzuò',
      translation: 'work',
      language: 'chinese',
      partOfSpeech: 'noun/verb',
      examples: [
        { sentence: '我去工作', translation: 'I go to work' }
      ]
    },
    {
      id: 'zh_011',
      word: '时间',
      transliteration: 'shíjiān',
      translation: 'time',
      language: 'chinese',
      partOfSpeech: 'noun',
      examples: [
        { sentence: '现在几点？', translation: 'What time is it now?' }
      ]
    },
    {
      id: 'zh_012',
      word: '人',
      transliteration: 'rén',
      translation: 'person, people',
      language: 'chinese',
      partOfSpeech: 'noun',
      examples: [
        { sentence: '很多人', translation: 'Many people' }
      ]
    },
    {
      id: 'ar_011',
      word: 'وقت',
      transliteration: 'waqt',
      translation: 'time',
      language: 'arabic',
      partOfSpeech: 'noun',
      examples: [
        { sentence: 'ما الوقت؟', translation: 'What time is it?' }
      ]
    },
    {
      id: 'ar_012',
      word: 'شخص',
      transliteration: 'shakhs',
      translation: 'person',
      language: 'arabic',
      partOfSpeech: 'noun',
      examples: [
        { sentence: 'هو شخص جيد', translation: 'He is a good person' }
      ]
    },
    {
      id: 'zh_013',
      word: '吃',
      transliteration: 'chī',
      translation: 'to eat',
      language: 'chinese',
      partOfSpeech: 'verb',
      examples: [
        { sentence: '我喜欢吃', translation: 'I like to eat' }
      ]
    },
    {
      id: 'zh_014',
      word: '喝',
      transliteration: 'hē',
      translation: 'to drink',
      language: 'chinese',
      partOfSpeech: 'verb',
      examples: [
        { sentence: '喝水', translation: 'Drink water' }
      ]
    },
    {
      id: 'ar_013',
      word: 'أكل',
      transliteration: 'akala',
      translation: 'to eat',
      language: 'arabic',
      partOfSpeech: 'verb',
      examples: [
        { sentence: 'أريد أن آكل', translation: 'I want to eat' }
      ]
    },
    {
      id: 'ar_014',
      word: 'شرب',
      transliteration: 'shariba',
      translation: 'to drink',
      language: 'arabic',
      partOfSpeech: 'verb',
      examples: [
        { sentence: 'أشرب الماء', translation: 'I drink water' }
      ]
    }
  ];
};
