import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useApp } from '../context/AppContext';

const ExperimentDetailScreen = ({ route, navigation }) => {
  const { experimentId } = route.params;
  const {
    getExperimentById,
    isExperimentCompleted,
    getExperimentCompletion,
    favorites,
    toggleFavorite,
    saveNote,
    getNote,
    settings,
  } = useApp();

  const [activeTab, setActiveTab] = useState('overview');
  const [noteText, setNoteText] = useState(getNote(experimentId) || '');
  const [showNoteInput, setShowNoteInput] = useState(false);

  const experiment = getExperimentById(experimentId);
  const completed = isExperimentCompleted(experimentId);
  const completion = getExperimentCompletion(experimentId);
  const isFavorite = favorites.includes(experimentId);

  if (!experiment) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Experiment not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleToggleFavorite = async () => {
    await toggleFavorite(experimentId);
  };

  const handleSaveNote = async () => {
    await saveNote(experimentId, noteText);
    setShowNoteInput(false);
    Alert.alert('Saved', 'Your note has been saved!');
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return '#27ae60';
      case 'intermediate': return '#f39c12';
      case 'advanced': return '#e74c3c';
      default: return '#7f8c8d';
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <View>
            {/* Objectives */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Learning Objectives</Text>
              {experiment.objectives?.map((obj, index) => (
                <View key={index} style={styles.objectiveItem}>
                  <Text style={styles.objectiveBullet}>•</Text>
                  <Text style={styles.objectiveText}>{obj}</Text>
                </View>
              ))}
            </View>

            {/* Theory */}
            {settings.showFormulas && experiment.theory && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Theory</Text>
                <Text style={styles.theoryText}>{experiment.theory}</Text>
              </View>
            )}

            {/* Formula */}
            {settings.showFormulas && experiment.formula && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Key Formula</Text>
                <View style={styles.formulaBox}>
                  <Text style={styles.formulaText}>{experiment.formula}</Text>
                </View>
              </View>
            )}
          </View>
        );

      case 'equipment':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Equipment & Materials</Text>
            {experiment.equipment?.map((item, index) => (
              <View key={index} style={styles.equipmentItem}>
                <Text style={styles.equipmentIcon}>🔧</Text>
                <Text style={styles.equipmentText}>{item}</Text>
              </View>
            ))}
          </View>
        );

      case 'procedure':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Procedure</Text>
            {experiment.procedure?.map((step, index) => (
              <View key={index} style={styles.procedureStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        );

      case 'variables':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Variables</Text>
            <View style={styles.variableCard}>
              <Text style={styles.variableLabel}>Independent Variable</Text>
              <Text style={styles.variableValue}>{experiment.variables?.independent}</Text>
            </View>
            <View style={styles.variableCard}>
              <Text style={styles.variableLabel}>Dependent Variable</Text>
              <Text style={styles.variableValue}>{experiment.variables?.dependent}</Text>
            </View>
            {experiment.variables?.controlled && (
              <View style={styles.variableCard}>
                <Text style={styles.variableLabel}>Controlled Variables</Text>
                {experiment.variables.controlled.map((v, i) => (
                  <Text key={i} style={styles.controlledItem}>• {v}</Text>
                ))}
              </View>
            )}
          </View>
        );

      case 'notes':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Notes</Text>
            {showNoteInput ? (
              <View>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Write your observations, findings, or notes here..."
                  multiline
                  numberOfLines={6}
                  value={noteText}
                  onChangeText={setNoteText}
                  textAlignVertical="top"
                />
                <View style={styles.noteButtons}>
                  <TouchableOpacity
                    style={styles.noteCancelButton}
                    onPress={() => setShowNoteInput(false)}
                  >
                    <Text style={styles.noteCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.noteSaveButton}
                    onPress={handleSaveNote}
                  >
                    <Text style={styles.noteSaveText}>Save Note</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                {noteText ? (
                  <View style={styles.savedNote}>
                    <Text style={styles.savedNoteText}>{noteText}</Text>
                    <TouchableOpacity onPress={() => setShowNoteInput(true)}>
                      <Text style={styles.editNoteText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addNoteButton}
                    onPress={() => setShowNoteInput(true)}
                  >
                    <Text style={styles.addNoteIcon}>📝</Text>
                    <Text style={styles.addNoteText}>Add a note</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: experiment.categoryColor || '#3498db' }]}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
          <Text style={styles.headerBackIcon}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.favoriteButton} onPress={handleToggleFavorite}>
          <Text style={styles.favoriteIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Card */}
        <View style={styles.titleCard}>
          <View style={styles.titleHeader}>
            <View style={[styles.categoryBadge, { backgroundColor: (experiment.categoryColor || '#3498db') + '20' }]}>
              <Text style={styles.categoryIcon}>{experiment.categoryIcon}</Text>
              <Text style={[styles.categoryText, { color: experiment.categoryColor }]}>{experiment.categoryTitle}</Text>
            </View>
            {completed && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedIcon}>✓</Text>
                <Text style={styles.completedText}>Completed</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{experiment.title}</Text>
          <Text style={styles.description}>{experiment.description}</Text>

          <View style={styles.metaRow}>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(experiment.difficulty) + '20' }]}>
              <Text style={[styles.difficultyText, { color: getDifficultyColor(experiment.difficulty) }]}>
                {experiment.difficulty}
              </Text>
            </View>
            <View style={styles.durationBadge}>
              <Text style={styles.durationIcon}>⏱️</Text>
              <Text style={styles.durationText}>{experiment.duration} min</Text>
            </View>
            {completion && (
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreIcon}>🏆</Text>
                <Text style={styles.scoreText}>Best: {completion.bestScore}%</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
        >
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'equipment', label: 'Equipment' },
            { key: 'procedure', label: 'Procedure' },
            { key: 'variables', label: 'Variables' },
            { key: 'notes', label: 'Notes' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {renderTab()}
        </View>

        {/* Default Parameters */}
        {experiment.defaultParams && (
          <View style={styles.paramsSection}>
            <Text style={styles.sectionTitle}>Default Parameters</Text>
            <View style={styles.paramsGrid}>
              {Object.entries(experiment.defaultParams).map(([key, value]) => (
                <View key={key} style={styles.paramItem}>
                  <Text style={styles.paramLabel}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
                  <Text style={styles.paramValue}>
                    {typeof value === 'number' ? value.toFixed(2) : value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Start Button */}
      <View style={styles.startButtonContainer}>
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: experiment.categoryColor || '#3498db' }]}
          onPress={() => navigation.navigate('Simulation', { experimentId })}
        >
          <Text style={styles.startButtonIcon}>🚀</Text>
          <Text style={styles.startButtonText}>
            {completed ? 'Try Again' : 'Start Experiment'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
    fontSize: 18,
    color: '#e74c3c',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 12,
  },
  headerBackButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackIcon: {
    fontSize: 24,
    color: '#fff',
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  titleCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  titleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  completedIcon: {
    fontSize: 12,
    marginRight: 4,
    color: '#155724',
  },
  completedText: {
    fontSize: 12,
    color: '#155724',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#7f8c8d',
    lineHeight: 22,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  durationIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  durationText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 4,
  },
  scoreIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  scoreText: {
    fontSize: 12,
    color: '#f39c12',
    fontWeight: '600',
  },
  tabsContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  tabActive: {
    backgroundColor: '#3498db',
  },
  tabText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  objectiveItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  objectiveBullet: {
    fontSize: 14,
    color: '#3498db',
    marginRight: 8,
    fontWeight: 'bold',
  },
  objectiveText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  theoryText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  formulaBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  formulaText: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#2c3e50',
    textAlign: 'center',
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  equipmentIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  equipmentText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  procedureStep: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    paddingTop: 4,
  },
  variableCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  variableLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  variableValue: {
    fontSize: 15,
    color: '#2c3e50',
    fontWeight: '500',
  },
  controlledItem: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  noteInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#2c3e50',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  noteButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  noteCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
  },
  noteCancelText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  noteSaveButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  noteSaveText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  savedNote: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  savedNoteText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 22,
  },
  editNoteText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600',
    marginTop: 12,
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 24,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  addNoteIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  addNoteText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  paramsSection: {
    padding: 16,
  },
  paramsGrid: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  paramItem: {
    width: '50%',
    marginBottom: 12,
  },
  paramLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    textTransform: 'capitalize',
  },
  paramValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 2,
  },
  bottomSpacer: {
    height: 100,
  },
  startButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  startButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default ExperimentDetailScreen;
