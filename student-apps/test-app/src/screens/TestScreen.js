import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { useApp } from '../context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TestScreen = ({ navigation }) => {
  const {
    currentTest,
    settings,
    submitAnswer,
    updateQuestionTime,
    toggleMarkForReview,
    finishTest,
  } = useApp();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [questionTimer, setQuestionTimer] = useState(0);
  const [totalTimer, setTotalTimer] = useState(0);
  const [showNavigation, setShowNavigation] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!currentTest) {
      navigation.goBack();
      return;
    }

    // Start timers
    timerRef.current = setInterval(() => {
      setQuestionTimer((prev) => prev + 1);
      setTotalTimer((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentTest]);

  useEffect(() => {
    // Reset question timer when changing questions
    setQuestionTimer(0);
    setSelectedAnswer(currentTest?.answers[currentIndex] ?? null);
  }, [currentIndex]);

  if (!currentTest || !currentTest.questions || currentTest.questions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading test...</Text>
      </View>
    );
  }

  const question = currentTest.questions[currentIndex];
  const isMarkedForReview = currentTest.markedForReview.includes(currentIndex);
  const answeredCount = currentTest.answers.filter((a) => a !== null).length;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (answerIndex) => {
    setSelectedAnswer(answerIndex);
    submitAnswer(currentIndex, answerIndex);
    updateQuestionTime(currentIndex, questionTimer);
  };

  const handleNext = () => {
    if (currentIndex < currentTest.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleGoToQuestion = (index) => {
    setCurrentIndex(index);
    setShowNavigation(false);
  };

  const handleFinishTest = () => {
    const unanswered = currentTest.answers.filter((a) => a === null).length;

    if (unanswered > 0) {
      Alert.alert(
        'Unanswered Questions',
        `You have ${unanswered} unanswered question(s). Are you sure you want to submit?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Submit Anyway',
            onPress: async () => {
              const result = await finishTest();
              if (result) {
                navigation.replace('Results', { sessionId: result.id });
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Submit Test',
        'Are you sure you want to submit your test?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Submit',
            onPress: async () => {
              const result = await finishTest();
              if (result) {
                navigation.replace('Results', { sessionId: result.id });
              }
            },
          },
        ]
      );
    }
  };

  const renderQuestion = () => {
    if (question.type === 'mcq') {
      return (
        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedAnswer === index && styles.optionButtonSelected,
              ]}
              onPress={() => handleSelectAnswer(index)}
            >
              <View style={[
                styles.optionCircle,
                selectedAnswer === index && styles.optionCircleSelected,
              ]}>
                <Text style={[
                  styles.optionLetter,
                  selectedAnswer === index && styles.optionLetterSelected,
                ]}>
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>
              <Text style={[
                styles.optionText,
                selectedAnswer === index && styles.optionTextSelected,
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (question.type === 'true_false') {
      return (
        <View style={styles.optionsContainer}>
          {[true, false].map((value, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedAnswer === value && styles.optionButtonSelected,
              ]}
              onPress={() => handleSelectAnswer(value)}
            >
              <View style={[
                styles.optionCircle,
                selectedAnswer === value && styles.optionCircleSelected,
              ]}>
                <Text style={[
                  styles.optionLetter,
                  selectedAnswer === value && styles.optionLetterSelected,
                ]}>
                  {value ? 'T' : 'F'}
                </Text>
              </View>
              <Text style={[
                styles.optionText,
                selectedAnswer === value && styles.optionTextSelected,
              ]}>
                {value ? 'True' : 'False'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.questionCounter}>
            Question {currentIndex + 1}/{currentTest.questions.length}
          </Text>
          <Text style={styles.answeredCount}>
            {answeredCount} answered
          </Text>
        </View>
        {settings.showTimer && (
          <View style={styles.timerContainer}>
            <Text style={styles.timerLabel}>Time</Text>
            <Text style={styles.timerValue}>{formatTime(totalTimer)}</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.navToggle}
          onPress={() => setShowNavigation(!showNavigation)}
        >
          <Text style={styles.navToggleText}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* Question Navigation Panel */}
      {showNavigation && (
        <View style={styles.navigationPanel}>
          <Text style={styles.navPanelTitle}>Question Navigation</Text>
          <View style={styles.navGrid}>
            {currentTest.questions.map((_, index) => {
              const isAnswered = currentTest.answers[index] !== null;
              const isMarked = currentTest.markedForReview.includes(index);
              const isCurrent = index === currentIndex;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.navItem,
                    isAnswered && styles.navItemAnswered,
                    isMarked && styles.navItemMarked,
                    isCurrent && styles.navItemCurrent,
                  ]}
                  onPress={() => handleGoToQuestion(index)}
                >
                  <Text style={[
                    styles.navItemText,
                    isAnswered && styles.navItemTextAnswered,
                    isCurrent && styles.navItemTextCurrent,
                  ]}>
                    {index + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.navLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.navItemAnswered]} />
              <Text style={styles.legendText}>Answered</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.navItemMarked]} />
              <Text style={styles.legendText}>Marked</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox]} />
              <Text style={styles.legendText}>Not answered</Text>
            </View>
          </View>
        </View>
      )}

      {/* Question Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.questionMeta}>
          <Text style={styles.subjectTag}>{question.subject}</Text>
          <Text style={styles.topicTag}>{question.topic}</Text>
          <Text style={[styles.difficultyTag, styles[`difficulty${question.difficulty}`]]}>
            {question.difficulty}
          </Text>
        </View>

        <Text style={styles.questionText}>{question.question}</Text>

        {renderQuestion()}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.markButton,
            isMarkedForReview && styles.markButtonActive,
          ]}
          onPress={() => toggleMarkForReview(currentIndex)}
        >
          <Text style={[
            styles.markButtonText,
            isMarkedForReview && styles.markButtonTextActive,
          ]}>
            {isMarkedForReview ? '🚩 Marked' : '🏳️ Mark for Review'}
          </Text>
        </TouchableOpacity>

        <View style={styles.navButtons}>
          <TouchableOpacity
            style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
            onPress={handlePrevious}
            disabled={currentIndex === 0}
          >
            <Text style={styles.navButtonText}>← Previous</Text>
          </TouchableOpacity>

          {currentIndex < currentTest.questions.length - 1 ? (
            <TouchableOpacity style={styles.navButton} onPress={handleNext}>
              <Text style={styles.navButtonText}>Next →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.submitButton} onPress={handleFinishTest}>
              <Text style={styles.submitButtonText}>Submit Test</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flex: 1,
  },
  questionCounter: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  answeredCount: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  timerContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  timerLabel: {
    fontSize: 10,
    color: '#7f8c8d',
  },
  timerValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  navToggle: {
    padding: 8,
  },
  navToggleText: {
    fontSize: 24,
    color: '#2c3e50',
  },
  navigationPanel: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  navPanelTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  navItem: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 4,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  navItemAnswered: {
    backgroundColor: '#d4edda',
  },
  navItemMarked: {
    borderColor: '#f39c12',
  },
  navItemCurrent: {
    borderColor: '#4a90d9',
    backgroundColor: '#e3f2fd',
  },
  navItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  navItemTextAnswered: {
    color: '#155724',
  },
  navItemTextCurrent: {
    color: '#4a90d9',
  },
  navLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#7f8c8d',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  questionMeta: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  subjectTag: {
    backgroundColor: '#4a90d9',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  topicTag: {
    backgroundColor: '#e0e0e0',
    color: '#666',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    marginRight: 8,
  },
  difficultyTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  difficultyeasy: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  difficultymedium: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  difficultyhard: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#2c3e50',
    lineHeight: 28,
    marginBottom: 24,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  optionButtonSelected: {
    borderColor: '#4a90d9',
    backgroundColor: '#e3f2fd',
  },
  optionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionCircleSelected: {
    backgroundColor: '#4a90d9',
  },
  optionLetter: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  optionLetterSelected: {
    color: '#fff',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
  optionTextSelected: {
    color: '#4a90d9',
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  markButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  markButtonActive: {
    backgroundColor: '#fff3cd',
  },
  markButtonText: {
    fontSize: 14,
    color: '#666',
  },
  markButtonTextActive: {
    color: '#856404',
    fontWeight: '600',
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    backgroundColor: '#4a90d9',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  navButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TestScreen;
