// Question Generator Service
// Simulates AI-powered question generation based on JAMB/WAEC patterns

// Question bank organized by subject and topic
const questionDatabase = {
  Mathematics: {
    'Algebra Basics': [
      {
        id: 'math_alg_1',
        type: 'mcq',
        question: 'Solve for x: 2x + 5 = 15',
        options: ['x = 5', 'x = 10', 'x = 7', 'x = 3'],
        correctAnswer: 0,
        difficulty: 'easy',
        bloomsLevel: 'Application',
        estimatedTime: 60,
      },
      {
        id: 'math_alg_2',
        type: 'mcq',
        question: 'If 3(x - 2) = 12, what is the value of x?',
        options: ['x = 6', 'x = 4', 'x = 8', 'x = 2'],
        correctAnswer: 0,
        difficulty: 'easy',
        bloomsLevel: 'Application',
        estimatedTime: 60,
      },
      {
        id: 'math_alg_3',
        type: 'mcq',
        question: 'Simplify: 2a + 3b + 4a - b',
        options: ['6a + 2b', '6a + 4b', '2a + 2b', '4a + 2b'],
        correctAnswer: 0,
        difficulty: 'easy',
        bloomsLevel: 'Knowledge',
        estimatedTime: 45,
      },
      {
        id: 'math_alg_4',
        type: 'mcq',
        question: 'What is the coefficient of x in the expression 5x² + 3x - 7?',
        options: ['5', '3', '-7', '2'],
        correctAnswer: 1,
        difficulty: 'medium',
        bloomsLevel: 'Knowledge',
        estimatedTime: 30,
      },
      {
        id: 'math_alg_5',
        type: 'true_false',
        question: 'In algebra, a variable can only represent whole numbers.',
        correctAnswer: false,
        difficulty: 'easy',
        bloomsLevel: 'Knowledge',
        estimatedTime: 20,
      },
    ],
    'Linear Equations': [
      {
        id: 'math_lin_1',
        type: 'mcq',
        question: 'Find the slope of the line passing through points (2, 3) and (4, 7).',
        options: ['2', '1', '3', '4'],
        correctAnswer: 0,
        difficulty: 'medium',
        bloomsLevel: 'Application',
        estimatedTime: 90,
      },
      {
        id: 'math_lin_2',
        type: 'mcq',
        question: 'What is the y-intercept of the line y = 3x + 5?',
        options: ['3', '5', '0', '-5'],
        correctAnswer: 1,
        difficulty: 'easy',
        bloomsLevel: 'Knowledge',
        estimatedTime: 30,
      },
      {
        id: 'math_lin_3',
        type: 'mcq',
        question: 'Which equation represents a horizontal line?',
        options: ['y = 5', 'x = 5', 'y = x', 'y = 2x + 1'],
        correctAnswer: 0,
        difficulty: 'medium',
        bloomsLevel: 'Comprehension',
        estimatedTime: 45,
      },
    ],
    'Quadratic Equations': [
      {
        id: 'math_quad_1',
        type: 'mcq',
        question: 'Solve: x² - 5x + 6 = 0',
        options: ['x = 2, x = 3', 'x = -2, x = -3', 'x = 1, x = 6', 'x = -1, x = -6'],
        correctAnswer: 0,
        difficulty: 'medium',
        bloomsLevel: 'Application',
        estimatedTime: 120,
      },
      {
        id: 'math_quad_2',
        type: 'mcq',
        question: 'What is the discriminant of ax² + bx + c = 0?',
        options: ['b² - 4ac', 'b² + 4ac', '4ac - b²', 'a² - 4bc'],
        correctAnswer: 0,
        difficulty: 'medium',
        bloomsLevel: 'Knowledge',
        estimatedTime: 30,
      },
      {
        id: 'math_quad_3',
        type: 'mcq',
        question: 'If the discriminant is negative, the quadratic equation has:',
        options: ['No real solutions', 'One real solution', 'Two real solutions', 'Infinite solutions'],
        correctAnswer: 0,
        difficulty: 'medium',
        bloomsLevel: 'Comprehension',
        estimatedTime: 45,
      },
    ],
  },
  Physics: {
    'Motion & Forces': [
      {
        id: 'phy_mot_1',
        type: 'mcq',
        question: 'A car travels 100 km in 2 hours. What is its average speed?',
        options: ['50 km/h', '200 km/h', '25 km/h', '100 km/h'],
        correctAnswer: 0,
        difficulty: 'easy',
        bloomsLevel: 'Application',
        estimatedTime: 45,
      },
      {
        id: 'phy_mot_2',
        type: 'mcq',
        question: "Which of Newton's laws states that F = ma?",
        options: ['Second Law', 'First Law', 'Third Law', 'Law of Gravitation'],
        correctAnswer: 0,
        difficulty: 'easy',
        bloomsLevel: 'Knowledge',
        estimatedTime: 30,
      },
      {
        id: 'phy_mot_3',
        type: 'mcq',
        question: 'What is the SI unit of force?',
        options: ['Newton', 'Joule', 'Watt', 'Pascal'],
        correctAnswer: 0,
        difficulty: 'easy',
        bloomsLevel: 'Knowledge',
        estimatedTime: 20,
      },
      {
        id: 'phy_mot_4',
        type: 'true_false',
        question: 'An object at rest will remain at rest unless acted upon by an external force.',
        correctAnswer: true,
        difficulty: 'easy',
        bloomsLevel: 'Knowledge',
        estimatedTime: 20,
      },
    ],
    'Energy & Work': [
      {
        id: 'phy_ene_1',
        type: 'mcq',
        question: 'Work is done when a force causes:',
        options: ['Displacement', 'Acceleration', 'Velocity', 'Mass'],
        correctAnswer: 0,
        difficulty: 'easy',
        bloomsLevel: 'Knowledge',
        estimatedTime: 30,
      },
      {
        id: 'phy_ene_2',
        type: 'mcq',
        question: 'What is the formula for kinetic energy?',
        options: ['½mv²', 'mgh', 'mv', 'ma'],
        correctAnswer: 0,
        difficulty: 'easy',
        bloomsLevel: 'Knowledge',
        estimatedTime: 30,
      },
      {
        id: 'phy_ene_3',
        type: 'mcq',
        question: 'The SI unit of energy is:',
        options: ['Joule', 'Newton', 'Watt', 'Kilogram'],
        correctAnswer: 0,
        difficulty: 'easy',
        bloomsLevel: 'Knowledge',
        estimatedTime: 20,
      },
    ],
  },
  Chemistry: {
    'Atomic Structure': [
      {
        id: 'chem_atom_1',
        type: 'mcq',
        question: 'What is the charge of a proton?',
        options: ['Positive', 'Negative', 'Neutral', 'Variable'],
        correctAnswer: 0,
        difficulty: 'easy',
        bloomsLevel: 'Knowledge',
        estimatedTime: 20,
      },
      {
        id: 'chem_atom_2',
        type: 'mcq',
        question: 'Which subatomic particle determines the atomic number of an element?',
        options: ['Proton', 'Neutron', 'Electron', 'Quark'],
        correctAnswer: 0,
        difficulty: 'easy',
        bloomsLevel: 'Knowledge',
        estimatedTime: 30,
      },
      {
        id: 'chem_atom_3',
        type: 'mcq',
        question: 'Electrons are found in:',
        options: ['Orbitals around the nucleus', 'The nucleus', 'Between atoms', 'Inside protons'],
        correctAnswer: 0,
        difficulty: 'easy',
        bloomsLevel: 'Knowledge',
        estimatedTime: 30,
      },
      {
        id: 'chem_atom_4',
        type: 'true_false',
        question: 'Isotopes of an element have the same number of protons but different numbers of neutrons.',
        correctAnswer: true,
        difficulty: 'medium',
        bloomsLevel: 'Comprehension',
        estimatedTime: 30,
      },
    ],
    'Chemical Bonds': [
      {
        id: 'chem_bond_1',
        type: 'mcq',
        question: 'A covalent bond is formed by:',
        options: ['Sharing of electrons', 'Transfer of electrons', 'Sharing of protons', 'Transfer of neutrons'],
        correctAnswer: 0,
        difficulty: 'easy',
        bloomsLevel: 'Knowledge',
        estimatedTime: 30,
      },
      {
        id: 'chem_bond_2',
        type: 'mcq',
        question: 'Which type of bond typically forms between a metal and a non-metal?',
        options: ['Ionic bond', 'Covalent bond', 'Metallic bond', 'Hydrogen bond'],
        correctAnswer: 0,
        difficulty: 'medium',
        bloomsLevel: 'Comprehension',
        estimatedTime: 45,
      },
    ],
  },
  Biology: {
    'Cell Structure': [
      {
        id: 'bio_cell_1',
        type: 'mcq',
        question: 'Which organelle is known as the "powerhouse of the cell"?',
        options: ['Mitochondria', 'Nucleus', 'Ribosome', 'Chloroplast'],
        correctAnswer: 0,
        difficulty: 'easy',
        bloomsLevel: 'Knowledge',
        estimatedTime: 20,
      },
      {
        id: 'bio_cell_2',
        type: 'mcq',
        question: 'The cell membrane is primarily made of:',
        options: ['Phospholipids', 'Proteins only', 'Carbohydrates', 'Nucleic acids'],
        correctAnswer: 0,
        difficulty: 'medium',
        bloomsLevel: 'Knowledge',
        estimatedTime: 30,
      },
      {
        id: 'bio_cell_3',
        type: 'mcq',
        question: 'Which structure is found in plant cells but not in animal cells?',
        options: ['Cell wall', 'Nucleus', 'Mitochondria', 'Ribosome'],
        correctAnswer: 0,
        difficulty: 'easy',
        bloomsLevel: 'Knowledge',
        estimatedTime: 30,
      },
      {
        id: 'bio_cell_4',
        type: 'true_false',
        question: 'Prokaryotic cells have a membrane-bound nucleus.',
        correctAnswer: false,
        difficulty: 'easy',
        bloomsLevel: 'Knowledge',
        estimatedTime: 20,
      },
    ],
    'Genetics': [
      {
        id: 'bio_gen_1',
        type: 'mcq',
        question: 'DNA stands for:',
        options: ['Deoxyribonucleic acid', 'Diribonucleic acid', 'Deoxyribose acid', 'Dinucleic acid'],
        correctAnswer: 0,
        difficulty: 'easy',
        bloomsLevel: 'Knowledge',
        estimatedTime: 20,
      },
      {
        id: 'bio_gen_2',
        type: 'mcq',
        question: 'Which nitrogenous base is found in RNA but not in DNA?',
        options: ['Uracil', 'Thymine', 'Adenine', 'Guanine'],
        correctAnswer: 0,
        difficulty: 'medium',
        bloomsLevel: 'Knowledge',
        estimatedTime: 30,
      },
      {
        id: 'bio_gen_3',
        type: 'mcq',
        question: 'A gene is a segment of:',
        options: ['DNA', 'Protein', 'Carbohydrate', 'Lipid'],
        correctAnswer: 0,
        difficulty: 'easy',
        bloomsLevel: 'Knowledge',
        estimatedTime: 20,
      },
    ],
  },
  English: {
    'Grammar Basics': [
      {
        id: 'eng_gram_1',
        type: 'mcq',
        question: 'Which of the following is a noun?',
        options: ['Happiness', 'Run', 'Quickly', 'Beautiful'],
        correctAnswer: 0,
        difficulty: 'easy',
        bloomsLevel: 'Knowledge',
        estimatedTime: 20,
      },
      {
        id: 'eng_gram_2',
        type: 'mcq',
        question: 'Select the correct verb form: She ___ to school every day.',
        options: ['goes', 'go', 'going', 'gone'],
        correctAnswer: 0,
        difficulty: 'easy',
        bloomsLevel: 'Application',
        estimatedTime: 30,
      },
      {
        id: 'eng_gram_3',
        type: 'mcq',
        question: 'An adjective modifies:',
        options: ['A noun or pronoun', 'A verb', 'An adverb', 'A preposition'],
        correctAnswer: 0,
        difficulty: 'easy',
        bloomsLevel: 'Knowledge',
        estimatedTime: 30,
      },
    ],
    'Essay Writing': [
      {
        id: 'eng_essay_1',
        type: 'mcq',
        question: 'The introduction of an essay should:',
        options: ['Present the thesis statement', 'Provide detailed evidence', 'Summarize the conclusion', 'List all arguments'],
        correctAnswer: 0,
        difficulty: 'medium',
        bloomsLevel: 'Comprehension',
        estimatedTime: 45,
      },
      {
        id: 'eng_essay_2',
        type: 'mcq',
        question: 'Which of the following is NOT a common essay type?',
        options: ['Mathematical essay', 'Argumentative essay', 'Descriptive essay', 'Narrative essay'],
        correctAnswer: 0,
        difficulty: 'medium',
        bloomsLevel: 'Knowledge',
        estimatedTime: 30,
      },
    ],
  },
};

// Generate questions based on reading history and proficiency
export const generateQuestions = async (options = {}) => {
  const {
    count = 20,
    subjects = null,
    topics = null,
    difficulty = 'mixed',
    proficiency = {},
    recentTopics = [],
  } = options;

  let allQuestions = [];

  // Collect questions from all requested subjects/topics
  const subjectsToUse = subjects || Object.keys(questionDatabase);

  subjectsToUse.forEach((subject) => {
    if (!questionDatabase[subject]) return;

    const subjectTopics = topics || Object.keys(questionDatabase[subject]);

    subjectTopics.forEach((topic) => {
      if (!questionDatabase[subject][topic]) return;

      const topicQuestions = questionDatabase[subject][topic].map((q) => ({
        ...q,
        subject,
        topic,
      }));

      allQuestions = [...allQuestions, ...topicQuestions];
    });
  });

  // Filter by difficulty if not mixed
  if (difficulty !== 'mixed') {
    allQuestions = allQuestions.filter((q) => q.difficulty === difficulty);
  }

  // Prioritize questions based on proficiency (lower proficiency = higher priority)
  allQuestions = allQuestions.map((q) => {
    const profKey = `${q.subject}_${q.topic}`;
    const profLevel = proficiency[profKey]?.proficiencyLevel || 50;
    const isRecent = recentTopics.includes(q.topic);

    // Calculate priority score (lower is better)
    let priority = profLevel;
    if (isRecent) priority -= 20; // Prioritize recent topics

    return { ...q, priority };
  });

  // Sort by priority and add some randomness
  allQuestions.sort((a, b) => {
    const randomFactor = (Math.random() - 0.5) * 30;
    return a.priority - b.priority + randomFactor;
  });

  // Select the requested number of questions
  const selectedQuestions = allQuestions.slice(0, count);

  // Shuffle final selection
  return shuffleArray(selectedQuestions);
};

// Generate a specific number of questions for a topic
export const generateTopicQuestions = async (subject, topic, count = 10) => {
  if (!questionDatabase[subject] || !questionDatabase[subject][topic]) {
    return [];
  }

  const questions = questionDatabase[subject][topic].map((q) => ({
    ...q,
    subject,
    topic,
  }));

  return shuffleArray(questions).slice(0, count);
};

// Generate theory questions (for essay-type questions)
export const generateTheoryQuestion = (subject, topic) => {
  const theoryQuestions = {
    Mathematics: {
      'Algebra Basics': [
        'Explain the concept of variables in algebra and give two examples of how they are used in real-life situations.',
        'Describe the steps to solve a linear equation with one unknown.',
      ],
      'Quadratic Equations': [
        'Explain the quadratic formula and when it should be used.',
        'Describe the relationship between the discriminant and the nature of roots.',
      ],
    },
    Physics: {
      'Motion & Forces': [
        "State Newton's three laws of motion and give an example of each.",
        'Explain the difference between speed and velocity.',
      ],
    },
    Biology: {
      'Cell Structure': [
        'Compare and contrast plant cells and animal cells.',
        'Describe the function of mitochondria in cellular respiration.',
      ],
    },
  };

  const subjectQuestions = theoryQuestions[subject];
  if (!subjectQuestions) return null;

  const topicQuestions = subjectQuestions[topic];
  if (!topicQuestions) return null;

  return topicQuestions[Math.floor(Math.random() * topicQuestions.length)];
};

// Utility function to shuffle an array
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Get all available subjects and topics
export const getAvailableContent = () => {
  const content = {};
  Object.keys(questionDatabase).forEach((subject) => {
    content[subject] = Object.keys(questionDatabase[subject]);
  });
  return content;
};

// Calculate score from answers
export const calculateScore = (questions, answers) => {
  let correct = 0;
  const results = [];

  questions.forEach((question, index) => {
    const userAnswer = answers[index];
    let isCorrect = false;

    if (question.type === 'mcq') {
      isCorrect = userAnswer === question.correctAnswer;
    } else if (question.type === 'true_false') {
      isCorrect = userAnswer === question.correctAnswer;
    } else if (question.type === 'fill_blank') {
      isCorrect = userAnswer?.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim();
    }

    if (isCorrect) correct++;
    results.push(isCorrect);
  });

  return {
    correct,
    total: questions.length,
    percentage: Math.round((correct / questions.length) * 100),
    results,
  };
};
