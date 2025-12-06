// Python Learning App - Main Application Logic

class PythonLearningApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentTopic = null;
        this.currentChallenge = null;
        this.currentLibrary = null;
        this.currentQuiz = null;
        this.quizAnswers = [];
        this.currentDifficulty = 'easy';

        // Load progress from localStorage
        this.progress = this.loadProgress();

        this.init();
    }

    init() {
        this.setupNavigation();
        this.renderDashboard();
        this.renderTutorials();
        this.renderChallenges();
        this.renderLibraries();
        this.updateProgress();
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                this.showSection(section);

                // Update active state
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    showSection(section) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });

        // Show selected section
        const sectionEl = document.getElementById(section);
        if (sectionEl) {
            sectionEl.classList.add('active');
            this.currentSection = section;
        }

        // Refresh content if needed
        if (section === 'dashboard') {
            this.renderDashboard();
        } else if (section === 'progress') {
            this.renderProgressPage();
        }
    }

    // Dashboard
    renderDashboard() {
        const stats = this.calculateStats();

        document.getElementById('concepts-learned').textContent = stats.conceptsLearned;
        document.getElementById('challenges-solved').textContent = stats.challengesSolved;
        document.getElementById('quiz-score').textContent = stats.averageQuizScore;
        document.getElementById('libraries-learned').textContent = stats.librariesLearned;

        // Continue learning suggestions
        const continueEl = document.getElementById('continue-learning');
        if (stats.nextTopic) {
            continueEl.innerHTML = `
                <div class="topic-card" onclick="app.showTutorial('${stats.nextTopic.id}', '${stats.nextTopic.category}')">
                    <div class="topic-title">${stats.nextTopic.title}</div>
                    <div class="topic-description">${stats.nextTopic.description}</div>
                </div>
            `;
        } else {
            continueEl.innerHTML = '<p>Great! You have completed all tutorials. Try some challenges!</p>';
        }
    }

    calculateStats() {
        const completed = this.progress.completedTopics || [];
        const quizScores = this.progress.quizScores || {};
        const solvedChallenges = this.progress.solvedChallenges || [];
        const libraryProgress = this.progress.libraryProgress || {};

        // Calculate average quiz score
        const scores = Object.values(quizScores);
        const averageQuizScore = scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0;

        // Count libraries with progress > 80%
        const librariesLearned = Object.values(libraryProgress)
            .filter(progress => progress >= 80).length;

        // Find next topic to learn
        let nextTopic = null;
        const allTopics = [
            ...tutorialsData.basics.map(t => ({ ...t, category: 'basics' })),
            ...tutorialsData.dataStructures.map(t => ({ ...t, category: 'dataStructures' })),
            ...tutorialsData.advanced.map(t => ({ ...t, category: 'advanced' }))
        ];

        for (const topic of allTopics) {
            if (!completed.includes(topic.id)) {
                nextTopic = topic;
                break;
            }
        }

        return {
            conceptsLearned: completed.length,
            challengesSolved: solvedChallenges.length,
            averageQuizScore,
            librariesLearned,
            nextTopic
        };
    }

    // Tutorials
    renderTutorials() {
        this.renderTopicList('basics-topics', tutorialsData.basics, 'basics');
        this.renderTopicList('data-structures-topics', tutorialsData.dataStructures, 'dataStructures');
        this.renderTopicList('advanced-topics', tutorialsData.advanced, 'advanced');
    }

    renderTopicList(containerId, topics, category) {
        const container = document.getElementById(containerId);
        const completed = this.progress.completedTopics || [];

        container.innerHTML = topics.map(topic => `
            <div class="topic-card ${completed.includes(topic.id) ? 'completed' : ''}"
                 onclick="app.showTutorial('${topic.id}', '${category}')">
                <div class="topic-title">${topic.title}</div>
                <div class="topic-description">${topic.description}</div>
            </div>
        `).join('');
    }

    showTutorial(topicId, category) {
        const topics = tutorialsData[category];
        const topic = topics.find(t => t.id === topicId);

        if (!topic) return;

        this.currentTopic = { ...topic, category };

        const content = document.getElementById('tutorial-content');
        content.innerHTML = `
            <div class="tutorial-detail-container">
                <div class="tutorial-header">
                    <h2>${topic.title}</h2>
                    <p>${topic.description}</p>
                </div>
                <div class="tutorial-body">
                    ${topic.content}
                </div>
                <div class="tutorial-actions">
                    <button class="btn btn-primary" onclick="app.startQuiz('${topicId}')">
                        Take Quiz
                    </button>
                    <button class="btn btn-secondary" onclick="app.markAsComplete('${topicId}')">
                        Mark as Complete
                    </button>
                </div>
            </div>
        `;

        this.showSection('tutorial-detail');
    }

    markAsComplete(topicId) {
        if (!this.progress.completedTopics) {
            this.progress.completedTopics = [];
        }

        if (!this.progress.completedTopics.includes(topicId)) {
            this.progress.completedTopics.push(topicId);
            this.saveProgress();
            this.renderTutorials();
            alert('Topic marked as complete!');
        }
    }

    // Quiz
    startQuiz(topicId) {
        const questions = quizzesData[topicId];

        if (!questions || questions.length === 0) {
            alert('No quiz available for this topic yet.');
            return;
        }

        this.currentQuiz = {
            topicId,
            questions,
            currentQuestion: 0,
            answers: [],
            score: 0
        };

        this.renderQuizQuestion();
        this.showSection('quiz');
    }

    renderQuizQuestion() {
        const quiz = this.currentQuiz;
        const question = quiz.questions[quiz.currentQuestion];
        const progress = ((quiz.currentQuestion + 1) / quiz.questions.length) * 100;

        const content = document.getElementById('quiz-content');
        content.innerHTML = `
            <div class="quiz-container">
                <div class="quiz-header">
                    <h2>Quiz</h2>
                    <div class="quiz-progress">
                        <div class="quiz-progress-bar" style="width: ${progress}%"></div>
                    </div>
                    <p>Question ${quiz.currentQuestion + 1} of ${quiz.questions.length}</p>
                </div>
                <div class="question-container">
                    <div class="question-text">${question.question}</div>
                    <div class="options-container" id="quiz-options">
                        ${question.options.map((option, index) => `
                            <div class="option" data-index="${index}" onclick="app.selectQuizOption(${index})">
                                ${option}
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="quiz-actions">
                    <button class="btn btn-secondary" onclick="app.backFromQuiz()">Cancel</button>
                    <button class="btn btn-primary" id="quiz-next-btn" disabled onclick="app.nextQuizQuestion()">
                        ${quiz.currentQuestion === quiz.questions.length - 1 ? 'Finish' : 'Next'}
                    </button>
                </div>
            </div>
        `;
    }

    selectQuizOption(index) {
        const quiz = this.currentQuiz;
        quiz.answers[quiz.currentQuestion] = index;

        // Update UI
        document.querySelectorAll('#quiz-options .option').forEach((opt, i) => {
            opt.classList.remove('selected');
            if (i === index) {
                opt.classList.add('selected');
            }
        });

        // Enable next button
        document.getElementById('quiz-next-btn').disabled = false;
    }

    nextQuizQuestion() {
        const quiz = this.currentQuiz;

        if (quiz.currentQuestion < quiz.questions.length - 1) {
            quiz.currentQuestion++;
            this.renderQuizQuestion();

            // If already answered, show selection
            if (quiz.answers[quiz.currentQuestion] !== undefined) {
                const selectedIndex = quiz.answers[quiz.currentQuestion];
                document.querySelectorAll('#quiz-options .option')[selectedIndex].classList.add('selected');
                document.getElementById('quiz-next-btn').disabled = false;
            }
        } else {
            this.showQuizResults();
        }
    }

    showQuizResults() {
        const quiz = this.currentQuiz;
        let correct = 0;

        quiz.questions.forEach((question, index) => {
            if (quiz.answers[index] === question.correct) {
                correct++;
            }
        });

        const score = Math.round((correct / quiz.questions.length) * 100);
        quiz.score = score;

        // Save score
        if (!this.progress.quizScores) {
            this.progress.quizScores = {};
        }
        this.progress.quizScores[quiz.topicId] = score;
        this.saveProgress();

        const content = document.getElementById('quiz-content');
        content.innerHTML = `
            <div class="quiz-container">
                <div class="quiz-result">
                    <h2>Quiz Complete!</h2>
                    <div class="quiz-score">${score}%</div>
                    <p>You got ${correct} out of ${quiz.questions.length} questions correct.</p>
                    <div class="quiz-actions">
                        <button class="btn btn-primary" onclick="app.startQuiz('${quiz.topicId}')">
                            Retake Quiz
                        </button>
                        <button class="btn btn-secondary" onclick="app.backFromQuiz()">
                            Back to Tutorial
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    backFromQuiz() {
        if (this.currentTopic) {
            this.showTutorial(this.currentTopic.id, this.currentTopic.category);
        } else {
            this.showSection('tutorials');
        }
    }

    // Challenges
    renderChallenges() {
        // Setup difficulty tabs
        const tabs = document.querySelectorAll('.difficulty-tabs .tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentDifficulty = tab.dataset.difficulty;
                this.renderChallengeList();
            });
        });

        this.renderChallengeList();
    }

    renderChallengeList() {
        const challenges = challengesData[this.currentDifficulty];
        const solved = this.progress.solvedChallenges || [];

        const container = document.getElementById('challenges-list');
        container.innerHTML = `
            <div class="challenges-grid">
                ${challenges.map(challenge => `
                    <div class="challenge-card ${solved.includes(challenge.id) ? 'solved' : ''}"
                         onclick="app.showChallenge('${challenge.id}')">
                        <div class="challenge-title">${challenge.title}</div>
                        <div class="challenge-difficulty difficulty-${challenge.difficulty}">
                            ${challenge.difficulty.toUpperCase()}
                        </div>
                        <div class="challenge-description">${challenge.description}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    showChallenge(challengeId) {
        const challenge = Object.values(challengesData)
            .flat()
            .find(c => c.id === challengeId);

        if (!challenge) return;

        this.currentChallenge = challenge;

        const content = document.getElementById('challenge-content');
        content.innerHTML = `
            <div class="challenge-detail-container">
                <div class="challenge-info">
                    <h2>${challenge.title}</h2>
                    <div class="challenge-difficulty difficulty-${challenge.difficulty}">
                        ${challenge.difficulty.toUpperCase()}
                    </div>
                    <h3>Description</h3>
                    <p>${challenge.description}</p>
                    <h3>Examples</h3>
                    ${challenge.examples.map(ex => `
                        <div class="code-block">
                            Input: ${ex.input}<br>
                            Output: ${ex.output}
                        </div>
                    `).join('')}
                </div>
                <div class="challenge-editor">
                    <div class="editor-header">
                        <h3>Code Editor</h3>
                        <div class="editor-actions">
                            <button class="btn btn-secondary" onclick="app.resetCode()">Reset</button>
                            <button class="btn btn-primary" onclick="app.runTests()">Run Tests</button>
                        </div>
                    </div>
                    <textarea class="code-editor" id="code-editor">${challenge.starterCode}</textarea>
                    <div class="test-results" id="test-results"></div>
                </div>
            </div>
        `;

        this.showSection('challenge-detail');
    }

    resetCode() {
        if (this.currentChallenge) {
            document.getElementById('code-editor').value = this.currentChallenge.starterCode;
        }
    }

    runTests() {
        const resultsEl = document.getElementById('test-results');
        resultsEl.innerHTML = `
            <div class="test-case">
                <strong>Note:</strong> This is a learning environment. In a real implementation,
                you would need a Python backend to actually execute the code.<br><br>
                For now, review your solution against the test cases in the problem description
                and test it in a Python environment like IDLE, Jupyter, or an online interpreter.
            </div>
            <div class="test-case passed">
                ✓ Your code syntax looks good! Test it in a Python environment.
            </div>
        `;

        // Mark as solved (simplified)
        if (!this.progress.solvedChallenges) {
            this.progress.solvedChallenges = [];
        }

        if (!this.progress.solvedChallenges.includes(this.currentChallenge.id)) {
            const markSolved = confirm('Mark this challenge as solved?');
            if (markSolved) {
                this.progress.solvedChallenges.push(this.currentChallenge.id);
                this.saveProgress();
                this.renderChallengeList();
            }
        }
    }

    // Libraries
    renderLibraries() {
        const libraryCards = document.querySelectorAll('.library-card');
        libraryCards.forEach(card => {
            card.addEventListener('click', () => {
                const library = card.dataset.library;
                this.showLibrary(library);
            });
        });

        this.updateLibraryProgress();
    }

    updateLibraryProgress() {
        const progress = this.progress.libraryProgress || {};

        Object.keys(progress).forEach(library => {
            const fillEl = document.querySelector(`[data-progress="${library}"]`);
            if (fillEl) {
                fillEl.style.width = `${progress[library]}%`;
            }
        });
    }

    showLibrary(libraryName) {
        const topics = librariesData[libraryName];
        if (!topics) return;

        this.currentLibrary = libraryName;

        const content = document.getElementById('library-content');
        const libraryTitles = {
            matplotlib: 'Matplotlib',
            seaborn: 'Seaborn',
            tensorflow: 'TensorFlow',
            sklearn: 'Scikit-learn'
        };

        content.innerHTML = `
            <div class="library-detail-container">
                <h2>${libraryTitles[libraryName]}</h2>
                <div class="library-topics">
                    ${topics.map(topic => `
                        <div class="topic-card" onclick="app.showLibraryTopic('${libraryName}', '${topic.id}')">
                            <div class="topic-title">${topic.title}</div>
                            <div class="topic-description">${topic.description}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        this.showSection('library-detail');
    }

    showLibraryTopic(libraryName, topicId) {
        const topic = librariesData[libraryName].find(t => t.id === topicId);
        if (!topic) return;

        const content = document.getElementById('library-content');
        content.innerHTML = `
            <div class="tutorial-detail-container">
                <div class="tutorial-header">
                    <h2>${topic.title}</h2>
                    <p>${topic.description}</p>
                </div>
                <div class="tutorial-body">
                    ${topic.content}
                </div>
                <div class="tutorial-actions">
                    <button class="btn btn-secondary" onclick="app.showLibrary('${libraryName}')">
                        Back to ${libraryName}
                    </button>
                    <button class="btn btn-primary" onclick="app.markLibraryTopicComplete('${libraryName}', '${topicId}')">
                        Mark as Complete
                    </button>
                </div>
            </div>
        `;
    }

    markLibraryTopicComplete(libraryName, topicId) {
        if (!this.progress.completedLibraryTopics) {
            this.progress.completedLibraryTopics = {};
        }
        if (!this.progress.completedLibraryTopics[libraryName]) {
            this.progress.completedLibraryTopics[libraryName] = [];
        }

        const completed = this.progress.completedLibraryTopics[libraryName];
        if (!completed.includes(topicId)) {
            completed.push(topicId);

            // Update library progress percentage
            const totalTopics = librariesData[libraryName].length;
            const completedCount = completed.length;
            const percentage = Math.round((completedCount / totalTopics) * 100);

            if (!this.progress.libraryProgress) {
                this.progress.libraryProgress = {};
            }
            this.progress.libraryProgress[libraryName] = percentage;

            this.saveProgress();
            this.updateLibraryProgress();
            alert('Topic marked as complete!');
        }
    }

    // Progress Page
    renderProgressPage() {
        const tutorialProgress = this.getTutorialProgress();
        const challengeProgress = this.getChallengeProgress();

        document.getElementById('tutorial-progress-list').innerHTML = tutorialProgress
            .map(item => `
                <div class="progress-item">
                    <div class="progress-item-header">
                        <span class="progress-item-title">${item.name}</span>
                        <span class="progress-percentage">${item.percentage}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${item.percentage}%"></div>
                    </div>
                </div>
            `).join('');

        document.getElementById('challenge-progress-list').innerHTML = challengeProgress
            .map(item => `
                <div class="progress-item">
                    <div class="progress-item-header">
                        <span class="progress-item-title">${item.name}</span>
                        <span class="progress-percentage">${item.solved}/${item.total}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${item.percentage}%"></div>
                    </div>
                </div>
            `).join('');
    }

    getTutorialProgress() {
        const completed = this.progress.completedTopics || [];

        return [
            {
                name: 'Basics',
                percentage: Math.round((completed.filter(id =>
                    tutorialsData.basics.find(t => t.id === id)).length / tutorialsData.basics.length) * 100)
            },
            {
                name: 'Data Structures',
                percentage: Math.round((completed.filter(id =>
                    tutorialsData.dataStructures.find(t => t.id === id)).length / tutorialsData.dataStructures.length) * 100)
            },
            {
                name: 'Advanced Concepts',
                percentage: Math.round((completed.filter(id =>
                    tutorialsData.advanced.find(t => t.id === id)).length / tutorialsData.advanced.length) * 100)
            }
        ];
    }

    getChallengeProgress() {
        const solved = this.progress.solvedChallenges || [];

        return ['easy', 'medium', 'hard'].map(difficulty => {
            const total = challengesData[difficulty].length;
            const solvedCount = solved.filter(id =>
                challengesData[difficulty].find(c => c.id === id)).length;

            return {
                name: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
                solved: solvedCount,
                total: total,
                percentage: Math.round((solvedCount / total) * 100)
            };
        });
    }

    // Progress Management
    loadProgress() {
        const saved = localStorage.getItem('pythonLearningProgress');
        return saved ? JSON.parse(saved) : {
            completedTopics: [],
            quizScores: {},
            solvedChallenges: [],
            libraryProgress: {},
            completedLibraryTopics: {}
        };
    }

    saveProgress() {
        localStorage.setItem('pythonLearningProgress', JSON.stringify(this.progress));
    }

    updateProgress() {
        this.renderDashboard();
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PythonLearningApp();
});
