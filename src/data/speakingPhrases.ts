export interface SpeakingPhrase {
  id: string;
  phrase: string;
  transliteration: string;
  translation: string;
  category: string;
  language: 'arabic' | 'chinese';
}

const arabicPhrases: SpeakingPhrase[] = [
  {
    id: 'ar_sp_001',
    phrase: 'السلام عليكم',
    transliteration: 'as-salāmu ʿalaykum',
    translation: 'Peace be upon you (Hello)',
    category: 'Greetings',
    language: 'arabic'
  },
  {
    id: 'ar_sp_002',
    phrase: 'صباح الخير',
    transliteration: 'ṣabāḥ al-khayr',
    translation: 'Good morning',
    category: 'Greetings',
    language: 'arabic'
  },
  {
    id: 'ar_sp_003',
    phrase: 'مساء الخير',
    transliteration: 'masāʾ al-khayr',
    translation: 'Good evening',
    category: 'Greetings',
    language: 'arabic'
  },
  {
    id: 'ar_sp_004',
    phrase: 'كيف حالك؟',
    transliteration: 'kayfa ḥāluk?',
    translation: 'How are you?',
    category: 'Greetings',
    language: 'arabic'
  },
  {
    id: 'ar_sp_005',
    phrase: 'أنا بخير، شكرا',
    transliteration: 'anā bi-khayr, shukran',
    translation: 'I am fine, thank you',
    category: 'Responses',
    language: 'arabic'
  },
  {
    id: 'ar_sp_006',
    phrase: 'ما اسمك؟',
    transliteration: 'mā ismuk?',
    translation: 'What is your name?',
    category: 'Introduction',
    language: 'arabic'
  },
  {
    id: 'ar_sp_007',
    phrase: 'اسمي...',
    transliteration: 'ismī...',
    translation: 'My name is...',
    category: 'Introduction',
    language: 'arabic'
  },
  {
    id: 'ar_sp_008',
    phrase: 'من أين أنت؟',
    transliteration: 'min ayna anta?',
    translation: 'Where are you from?',
    category: 'Introduction',
    language: 'arabic'
  },
  {
    id: 'ar_sp_009',
    phrase: 'أنا من...',
    transliteration: 'anā min...',
    translation: 'I am from...',
    category: 'Introduction',
    language: 'arabic'
  },
  {
    id: 'ar_sp_010',
    phrase: 'شكرا جزيلا',
    transliteration: 'shukran jazīlan',
    translation: 'Thank you very much',
    category: 'Courtesy',
    language: 'arabic'
  },
  {
    id: 'ar_sp_011',
    phrase: 'من فضلك',
    transliteration: 'min faḍlik',
    translation: 'Please',
    category: 'Courtesy',
    language: 'arabic'
  },
  {
    id: 'ar_sp_012',
    phrase: 'عفوا',
    transliteration: 'ʿafwan',
    translation: 'You\'re welcome / Excuse me',
    category: 'Courtesy',
    language: 'arabic'
  },
  {
    id: 'ar_sp_013',
    phrase: 'آسف',
    transliteration: 'āsif',
    translation: 'Sorry',
    category: 'Courtesy',
    language: 'arabic'
  },
  {
    id: 'ar_sp_014',
    phrase: 'مع السلامة',
    transliteration: 'maʿa s-salāma',
    translation: 'Goodbye',
    category: 'Farewells',
    language: 'arabic'
  },
  {
    id: 'ar_sp_015',
    phrase: 'إلى اللقاء',
    transliteration: 'ilā l-liqāʾ',
    translation: 'See you later',
    category: 'Farewells',
    language: 'arabic'
  }
];

const chinesePhrases: SpeakingPhrase[] = [
  {
    id: 'zh_sp_001',
    phrase: '你好',
    transliteration: 'nǐ hǎo',
    translation: 'Hello',
    category: 'Greetings',
    language: 'chinese'
  },
  {
    id: 'zh_sp_002',
    phrase: '早上好',
    transliteration: 'zǎoshang hǎo',
    translation: 'Good morning',
    category: 'Greetings',
    language: 'chinese'
  },
  {
    id: 'zh_sp_003',
    phrase: '晚上好',
    transliteration: 'wǎnshang hǎo',
    translation: 'Good evening',
    category: 'Greetings',
    language: 'chinese'
  },
  {
    id: 'zh_sp_004',
    phrase: '你好吗？',
    transliteration: 'nǐ hǎo ma?',
    translation: 'How are you?',
    category: 'Greetings',
    language: 'chinese'
  },
  {
    id: 'zh_sp_005',
    phrase: '我很好，谢谢',
    transliteration: 'wǒ hěn hǎo, xièxie',
    translation: 'I am fine, thank you',
    category: 'Responses',
    language: 'chinese'
  },
  {
    id: 'zh_sp_006',
    phrase: '你叫什么名字？',
    transliteration: 'nǐ jiào shénme míngzi?',
    translation: 'What is your name?',
    category: 'Introduction',
    language: 'chinese'
  },
  {
    id: 'zh_sp_007',
    phrase: '我叫...',
    transliteration: 'wǒ jiào...',
    translation: 'My name is...',
    category: 'Introduction',
    language: 'chinese'
  },
  {
    id: 'zh_sp_008',
    phrase: '你从哪里来？',
    transliteration: 'nǐ cóng nǎlǐ lái?',
    translation: 'Where are you from?',
    category: 'Introduction',
    language: 'chinese'
  },
  {
    id: 'zh_sp_009',
    phrase: '我来自...',
    transliteration: 'wǒ láizì...',
    translation: 'I am from...',
    category: 'Introduction',
    language: 'chinese'
  },
  {
    id: 'zh_sp_010',
    phrase: '非常感谢',
    transliteration: 'fēicháng gǎnxiè',
    translation: 'Thank you very much',
    category: 'Courtesy',
    language: 'chinese'
  },
  {
    id: 'zh_sp_011',
    phrase: '请',
    transliteration: 'qǐng',
    translation: 'Please',
    category: 'Courtesy',
    language: 'chinese'
  },
  {
    id: 'zh_sp_012',
    phrase: '不客气',
    transliteration: 'bù kèqi',
    translation: 'You\'re welcome',
    category: 'Courtesy',
    language: 'chinese'
  },
  {
    id: 'zh_sp_013',
    phrase: '对不起',
    transliteration: 'duìbuqǐ',
    translation: 'Sorry',
    category: 'Courtesy',
    language: 'chinese'
  },
  {
    id: 'zh_sp_014',
    phrase: '再见',
    transliteration: 'zàijiàn',
    translation: 'Goodbye',
    category: 'Farewells',
    language: 'chinese'
  },
  {
    id: 'zh_sp_015',
    phrase: '回头见',
    transliteration: 'huítóu jiàn',
    translation: 'See you later',
    category: 'Farewells',
    language: 'chinese'
  }
];

export const getSpeakingPhrases = (language: 'arabic' | 'chinese'): SpeakingPhrase[] => {
  return language === 'arabic' ? arabicPhrases : chinesePhrases;
};
