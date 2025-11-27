export interface Vocabulary {
  word: string;
  transliteration?: string;
  pinyin?: string;
  meaning: string;
}

export interface Example {
  sentence: string;
  translation: string;
}

export interface LanguageContent {
  vocabulary: Vocabulary[];
  grammar: string;
  examples: Example[];
}

export interface Lesson {
  title: string;
  description: string;
  arabic: LanguageContent;
  chinese: LanguageContent;
  comparison?: {
    similarities: string[];
    differences: string[];
  };
}

export interface Chapter {
  title: string;
  lessons: Lesson[];
}

export const getLessons = (): Chapter[] => {
  return [
    {
      title: "Chapter 1: Basics & Greetings",
      lessons: [
        {
          title: "Lesson 1: Basic Greetings",
          description: "Learn how to greet people in Arabic and Chinese",
          arabic: {
            vocabulary: [
              { word: "السلام عليكم", transliteration: "as-salāmu ʿalaykum", meaning: "Peace be upon you (Hello)" },
              { word: "مرحبا", transliteration: "marḥaban", meaning: "Hello/Welcome" },
              { word: "صباح الخير", transliteration: "ṣabāḥ al-khayr", meaning: "Good morning" },
              { word: "مساء الخير", transliteration: "masāʾ al-khayr", meaning: "Good evening" },
              { word: "كيف حالك؟", transliteration: "kayfa ḥāluk?", meaning: "How are you?" }
            ],
            grammar: "Arabic greetings often include religious phrases. The response to 'السلام عليكم' is 'وعليكم السلام' (wa ʿalaykumu s-salām).",
            examples: [
              { sentence: "السلام عليكم، كيف حالك؟", translation: "Peace be upon you, how are you?" },
              { sentence: "مرحبا! صباح الخير", translation: "Hello! Good morning" }
            ]
          },
          chinese: {
            vocabulary: [
              { word: "你好", pinyin: "nǐ hǎo", meaning: "Hello" },
              { word: "早上好", pinyin: "zǎoshang hǎo", meaning: "Good morning" },
              { word: "晚上好", pinyin: "wǎnshang hǎo", meaning: "Good evening" },
              { word: "你好吗？", pinyin: "nǐ hǎo ma?", meaning: "How are you?" },
              { word: "我很好", pinyin: "wǒ hěn hǎo", meaning: "I'm fine" }
            ],
            grammar: "Chinese greetings use the particle '吗' (ma) at the end of statements to form questions. Tones are crucial for proper pronunciation.",
            examples: [
              { sentence: "你好！你好吗？", translation: "Hello! How are you?" },
              { sentence: "早上好！我很好", translation: "Good morning! I'm fine" }
            ]
          },
          comparison: {
            similarities: [
              "Both languages have time-specific greetings (morning, evening)",
              "Both ask about well-being as a greeting",
              "Formal greetings exist in both languages"
            ],
            differences: [
              "Arabic greetings often include religious phrases, Chinese greetings are more secular",
              "Chinese uses tones to distinguish meaning, Arabic uses different consonants",
              "Arabic is written right-to-left, Chinese uses characters"
            ]
          }
        },
        {
          title: "Lesson 2: Introduction & Basic Phrases",
          description: "Learn how to introduce yourself and use basic phrases",
          arabic: {
            vocabulary: [
              { word: "أنا", transliteration: "anā", meaning: "I" },
              { word: "اسمي", transliteration: "ismī", meaning: "My name is" },
              { word: "من", transliteration: "min", meaning: "From" },
              { word: "شكرا", transliteration: "shukran", meaning: "Thank you" },
              { word: "من فضلك", transliteration: "min faḍlik", meaning: "Please" },
              { word: "نعم", transliteration: "naʿam", meaning: "Yes" },
              { word: "لا", transliteration: "lā", meaning: "No" }
            ],
            grammar: "In Arabic, possessive pronouns are attached as suffixes. 'My name' is 'اسمي' (ism + ī).",
            examples: [
              { sentence: "أنا اسمي أحمد", translation: "I, my name is Ahmad" },
              { sentence: "شكرا، من فضلك", translation: "Thank you, please" }
            ]
          },
          chinese: {
            vocabulary: [
              { word: "我", pinyin: "wǒ", meaning: "I/Me" },
              { word: "我叫", pinyin: "wǒ jiào", meaning: "My name is (I'm called)" },
              { word: "来自", pinyin: "láizì", meaning: "Come from" },
              { word: "谢谢", pinyin: "xièxie", meaning: "Thank you" },
              { word: "请", pinyin: "qǐng", meaning: "Please" },
              { word: "是", pinyin: "shì", meaning: "Yes/Is" },
              { word: "不是", pinyin: "bù shì", meaning: "No/Is not" }
            ],
            grammar: "Chinese word order for introduction: 我 (I) + 叫 (am called) + name. Use 来自 (come from) + place for origin.",
            examples: [
              { sentence: "我叫李明", translation: "My name is Li Ming" },
              { sentence: "谢谢，请坐", translation: "Thank you, please sit" }
            ]
          },
          comparison: {
            similarities: [
              "Both languages place personal pronouns before the verb in statements",
              "Both have distinct words for 'please' and 'thank you'",
              "Both use name + introduction pattern"
            ],
            differences: [
              "Arabic attaches possessive suffixes, Chinese uses separate words",
              "Chinese 'yes' (是) literally means 'is', Arabic 'yes' (نعم) is standalone",
              "Chinese uses measure words, Arabic uses grammatical gender"
            ]
          }
        }
      ]
    },
    {
      title: "Chapter 2: Numbers & Time",
      lessons: [
        {
          title: "Lesson 3: Numbers 1-10",
          description: "Master basic counting in both languages",
          arabic: {
            vocabulary: [
              { word: "واحد", transliteration: "wāḥid", meaning: "One" },
              { word: "اثنان", transliteration: "ithnān", meaning: "Two" },
              { word: "ثلاثة", transliteration: "thalātha", meaning: "Three" },
              { word: "أربعة", transliteration: "arbaʿa", meaning: "Four" },
              { word: "خمسة", transliteration: "khamsa", meaning: "Five" },
              { word: "ستة", transliteration: "sitta", meaning: "Six" },
              { word: "سبعة", transliteration: "sabʿa", meaning: "Seven" },
              { word: "ثمانية", transliteration: "thamāniya", meaning: "Eight" },
              { word: "تسعة", transliteration: "tisʿa", meaning: "Nine" },
              { word: "عشرة", transliteration: "ʿashara", meaning: "Ten" }
            ],
            grammar: "Arabic numbers have both masculine and feminine forms depending on the noun they modify. These are the feminine forms (most common).",
            examples: [
              { sentence: "واحد، اثنان، ثلاثة", translation: "One, two, three" },
              { sentence: "عندي خمسة كتب", translation: "I have five books" }
            ]
          },
          chinese: {
            vocabulary: [
              { word: "一", pinyin: "yī", meaning: "One" },
              { word: "二", pinyin: "èr", meaning: "Two" },
              { word: "三", pinyin: "sān", meaning: "Three" },
              { word: "四", pinyin: "sì", meaning: "Four" },
              { word: "五", pinyin: "wǔ", meaning: "Five" },
              { word: "六", pinyin: "liù", meaning: "Six" },
              { word: "七", pinyin: "qī", meaning: "Seven" },
              { word: "八", pinyin: "bā", meaning: "Eight" },
              { word: "九", pinyin: "jiǔ", meaning: "Nine" },
              { word: "十", pinyin: "shí", meaning: "Ten" }
            ],
            grammar: "Chinese numbers are simple and don't change form. Numbers above 10 are built logically: 11 = 十一 (ten-one), 20 = 二十 (two-ten).",
            examples: [
              { sentence: "一、二、三", translation: "One, two, three" },
              { sentence: "我有五本书", translation: "I have five books" }
            ]
          },
          comparison: {
            similarities: [
              "Both use numbers in a logical system",
              "Both count on fingers similarly",
              "Numbers can be used independently or with nouns"
            ],
            differences: [
              "Arabic numbers have gender forms, Chinese numbers don't change",
              "Chinese builds larger numbers logically (十一 = 11), Arabic uses unique words",
              "Chinese characters represent concepts, Arabic uses an alphabet"
            ]
          }
        }
      ]
    }
  ];
};
