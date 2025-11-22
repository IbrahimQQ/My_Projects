import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useApp } from '../context/AppContext';
import * as QuestionGenerator from '../services/questionGenerator';

const PracticeScreen = ({ navigation }) => {
  const { proficiency, startTest } = useApp();
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [questionCount, setQuestionCount] = useState(10);

  const availableContent = QuestionGenerator.getAvailableContent();

  const getProficiencyColor = (level) => {
    if (level >= 80) return '#27ae60';
    if (level >= 60) return '#f39c12';
    if (level >= 40) return '#e67e22';
    return '#e74c3c';
  };

  const getTopicProficiency = (subject, topic) => {
    const key = `${subject}_${topic}`;
    return proficiency[key]?.proficiencyLevel || 0;
  };

  const handleStartPractice = async () => {
    const options = {
      count: questionCount,
      subjects: selectedSubject ? [selectedSubject] : null,
      topics: selectedTopic ? [selectedTopic] : null,
      mode: 'practice',
    };

    await startTest(options);
    navigation.navigate('Test');
  };

  const handlePracticeWeakTopics = async () => {
    // Find weak topics (proficiency < 60%)
    const weakTopics = Object.entries(proficiency)
      .filter(([_, data]) => data.proficiencyLevel < 60)
      .map(([_, data]) => data.topic);

    await startTest({
      count: questionCount,
      topics: weakTopics.length > 0 ? weakTopics : null,
      mode: 'practice',
    });
    navigation.navigate('Test');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Practice Mode</Text>
        <Text style={styles.headerSubtitle}>
          Practice makes perfect! Select a subject and topic to begin.
        </Text>
      </View>

      {/* Quick Practice */}
      <View style={styles.quickSection}>
        <TouchableOpacity
          style={styles.quickButton}
          onPress={handlePracticeWeakTopics}
        >
          <Text style={styles.quickButtonIcon}>🎯</Text>
          <View>
            <Text style={styles.quickButtonTitle}>Practice Weak Topics</Text>
            <Text style={styles.quickButtonSubtitle}>Focus on areas that need improvement</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Question Count */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Number of Questions</Text>
        <View style={styles.countOptions}>
          {[5, 10, 15, 20].map((count) => (
            <TouchableOpacity
              key={count}
              style={[
                styles.countOption,
                questionCount === count && styles.countOptionSelected,
              ]}
              onPress={() => setQuestionCount(count)}
            >
              <Text
                style={[
                  styles.countOptionText,
                  questionCount === count && styles.countOptionTextSelected,
                ]}
              >
                {count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Subject Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Subject</Text>
        <View style={styles.subjectsGrid}>
          {Object.keys(availableContent).map((subject) => (
            <TouchableOpacity
              key={subject}
              style={[
                styles.subjectCard,
                selectedSubject === subject && styles.subjectCardSelected,
              ]}
              onPress={() => {
                setSelectedSubject(selectedSubject === subject ? null : subject);
                setSelectedTopic(null);
              }}
            >
              <Text style={styles.subjectIcon}>
                {subject === 'Mathematics' ? '📐' :
                 subject === 'Physics' ? '⚛️' :
                 subject === 'Chemistry' ? '🧪' :
                 subject === 'Biology' ? '🧬' :
                 subject === 'English' ? '📝' : '📚'}
              </Text>
              <Text
                style={[
                  styles.subjectName,
                  selectedSubject === subject && styles.subjectNameSelected,
                ]}
              >
                {subject}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Topic Selection */}
      {selectedSubject && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Topic (Optional)</Text>
          <View style={styles.topicsList}>
            {availableContent[selectedSubject].map((topic) => {
              const topicProf = getTopicProficiency(selectedSubject, topic);
              return (
                <TouchableOpacity
                  key={topic}
                  style={[
                    styles.topicCard,
                    selectedTopic === topic && styles.topicCardSelected,
                  ]}
                  onPress={() => setSelectedTopic(selectedTopic === topic ? null : topic)}
                >
                  <View style={styles.topicInfo}>
                    <Text
                      style={[
                        styles.topicName,
                        selectedTopic === topic && styles.topicNameSelected,
                      ]}
                    >
                      {topic}
                    </Text>
                    <View style={styles.proficiencyIndicator}>
                      <View style={styles.miniProgressBar}>
                        <View
                          style={[
                            styles.miniProgressFill,
                            {
                              width: `${topicProf}%`,
                              backgroundColor: getProficiencyColor(topicProf),
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.proficiencyText}>{topicProf}%</Text>
                    </View>
                  </View>
                  {selectedTopic === topic && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Start Button */}
      <View style={styles.startSection}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartPractice}
        >
          <Text style={styles.startButtonText}>
            Start Practice ({questionCount} questions)
          </Text>
        </TouchableOpacity>
        <Text style={styles.startHint}>
          {selectedSubject
            ? selectedTopic
              ? `Practicing ${selectedTopic} in ${selectedSubject}`
              : `Practicing all topics in ${selectedSubject}`
            : 'Practicing all subjects'}
        </Text>
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
  header: {
    backgroundColor: '#4a90d9',
    padding: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  quickSection: {
    padding: 16,
  },
  quickButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickButtonIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  quickButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  quickButtonSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  countOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  countOption: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  countOptionSelected: {
    borderColor: '#4a90d9',
    backgroundColor: '#e3f2fd',
  },
  countOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  countOptionTextSelected: {
    color: '#4a90d9',
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  subjectCard: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 4,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  subjectCardSelected: {
    borderColor: '#4a90d9',
    backgroundColor: '#e3f2fd',
  },
  subjectIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  subjectName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  subjectNameSelected: {
    color: '#4a90d9',
  },
  topicsList: {},
  topicCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  topicCardSelected: {
    borderColor: '#4a90d9',
    backgroundColor: '#e3f2fd',
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  topicNameSelected: {
    color: '#4a90d9',
  },
  proficiencyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginRight: 8,
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  proficiencyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7f8c8d',
    width: 40,
    textAlign: 'right',
  },
  checkmark: {
    fontSize: 20,
    color: '#4a90d9',
    fontWeight: 'bold',
  },
  startSection: {
    padding: 16,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 12,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  startHint: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 8,
  },
  bottomSpacer: {
    height: 20,
  },
});

export default PracticeScreen;
