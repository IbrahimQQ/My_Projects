import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useApp } from '../context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ResultsScreen = ({ route, navigation }) => {
  const { testSessions, proficiency } = useApp();
  const [showDetails, setShowDetails] = useState(false);

  const { sessionId } = route.params || {};
  const session = testSessions.find((s) => s.id === sessionId);

  if (!session) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Test results not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.backButtonText}>Go Back Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getProficiencyColor = (level) => {
    if (level >= 80) return '#27ae60';
    if (level >= 60) return '#f39c12';
    if (level >= 40) return '#e67e22';
    return '#e74c3c';
  };

  const getGrade = (score) => {
    if (score >= 90) return { grade: 'A', label: 'Excellent!' };
    if (score >= 80) return { grade: 'B', label: 'Great job!' };
    if (score >= 70) return { grade: 'C', label: 'Good work!' };
    if (score >= 60) return { grade: 'D', label: 'Keep practicing!' };
    return { grade: 'F', label: 'Need more study!' };
  };

  const gradeInfo = getGrade(session.score);

  // Calculate topic breakdown
  const topicBreakdown = {};
  session.questions?.forEach((q, idx) => {
    const key = `${q.subject} - ${q.topic}`;
    if (!topicBreakdown[key]) {
      topicBreakdown[key] = { correct: 0, total: 0, subject: q.subject, topic: q.topic };
    }
    topicBreakdown[key].total++;
    if (session.results?.[idx]) {
      topicBreakdown[key].correct++;
    }
  });

  const timeTaken = session.finishedAt && session.startedAt
    ? Math.round((new Date(session.finishedAt) - new Date(session.startedAt)) / 1000)
    : 0;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <View style={[styles.headerCard, { backgroundColor: getProficiencyColor(session.score) }]}>
        <Text style={styles.gradeLabel}>{gradeInfo.label}</Text>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreValue}>{session.score}%</Text>
          <Text style={styles.gradeValue}>{gradeInfo.grade}</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{session.correct}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{session.total - session.correct}</Text>
            <Text style={styles.statLabel}>Wrong</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatTime(timeTaken)}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
        </View>
      </View>

      {/* Topic Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance by Topic</Text>
        {Object.entries(topicBreakdown).map(([key, data]) => {
          const percentage = Math.round((data.correct / data.total) * 100);
          return (
            <View key={key} style={styles.topicCard}>
              <View style={styles.topicHeader}>
                <View>
                  <Text style={styles.topicSubject}>{data.subject}</Text>
                  <Text style={styles.topicName}>{data.topic}</Text>
                </View>
                <Text style={[styles.topicScore, { color: getProficiencyColor(percentage) }]}>
                  {data.correct}/{data.total}
                </Text>
              </View>
              <View style={styles.topicProgressBar}>
                <View
                  style={[
                    styles.topicProgressFill,
                    {
                      width: `${percentage}%`,
                      backgroundColor: getProficiencyColor(percentage),
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* Question Details Toggle */}
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setShowDetails(!showDetails)}
      >
        <Text style={styles.toggleButtonText}>
          {showDetails ? 'Hide Question Details' : 'Show Question Details'}
        </Text>
      </TouchableOpacity>

      {/* Question Details */}
      {showDetails && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Question Review</Text>
          {session.questions?.map((question, index) => {
            const isCorrect = session.results?.[index];
            const userAnswer = session.answers?.[index];

            return (
              <View
                key={index}
                style={[
                  styles.questionCard,
                  isCorrect ? styles.questionCorrect : styles.questionWrong,
                ]}
              >
                <View style={styles.questionHeader}>
                  <Text style={styles.questionNumber}>Q{index + 1}</Text>
                  <Text style={[styles.questionStatus, { color: isCorrect ? '#27ae60' : '#e74c3c' }]}>
                    {isCorrect ? '✓ Correct' : '✗ Wrong'}
                  </Text>
                </View>
                <Text style={styles.questionText}>{question.question}</Text>

                {question.type === 'mcq' && (
                  <View style={styles.answersContainer}>
                    {question.options.map((option, optIdx) => {
                      const isUserAnswer = userAnswer === optIdx;
                      const isCorrectAnswer = question.correctAnswer === optIdx;

                      return (
                        <View
                          key={optIdx}
                          style={[
                            styles.answerOption,
                            isCorrectAnswer && styles.correctAnswer,
                            isUserAnswer && !isCorrect && styles.wrongAnswer,
                          ]}
                        >
                          <Text style={styles.answerLetter}>
                            {String.fromCharCode(65 + optIdx)}
                          </Text>
                          <Text style={styles.answerText}>{option}</Text>
                          {isCorrectAnswer && <Text style={styles.answerBadge}>✓</Text>}
                          {isUserAnswer && !isCorrect && <Text style={styles.answerBadge}>✗</Text>}
                        </View>
                      );
                    })}
                  </View>
                )}

                {question.type === 'true_false' && (
                  <View style={styles.answersContainer}>
                    <Text style={styles.answerText}>
                      Your answer: {userAnswer !== null ? (userAnswer ? 'True' : 'False') : 'Not answered'}
                    </Text>
                    <Text style={[styles.answerText, { color: '#27ae60' }]}>
                      Correct answer: {question.correctAnswer ? 'True' : 'False'}
                    </Text>
                  </View>
                )}

                <View style={styles.questionMeta}>
                  <Text style={styles.metaText}>{question.subject} • {question.topic}</Text>
                  <Text style={styles.metaText}>
                    Time: {session.times?.[index] || 0}s
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.primaryButtonText}>Back to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            navigation.navigate('Practice');
          }}
        >
          <Text style={styles.secondaryButtonText}>Practice Weak Topics</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#4a90d9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerCard: {
    padding: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  gradeLabel: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
  },
  gradeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  topicCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topicSubject: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  topicName: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  topicScore: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  topicProgressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  topicProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  toggleButton: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a90d9',
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  questionCorrect: {
    borderLeftColor: '#27ae60',
  },
  questionWrong: {
    borderLeftColor: '#e74c3c',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  questionStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 24,
    marginBottom: 12,
  },
  answersContainer: {
    marginBottom: 8,
  },
  answerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginBottom: 4,
  },
  correctAnswer: {
    backgroundColor: '#d4edda',
  },
  wrongAnswer: {
    backgroundColor: '#f8d7da',
  },
  answerLetter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 12,
  },
  answerText: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
  },
  answerBadge: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  questionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  metaText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  actionButtons: {
    padding: 16,
  },
  primaryButton: {
    backgroundColor: '#4a90d9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4a90d9',
  },
  secondaryButtonText: {
    color: '#4a90d9',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 20,
  },
});

export default ResultsScreen;
