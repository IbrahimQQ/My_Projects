import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useApp } from '../context/AppContext';

const ExperimentDetailScreen = ({ route, navigation }) => {
  const { experimentId } = route.params;
  const { getExperimentById, isExperimentCompleted, getExperimentCompletion, favorites, toggleFavorite, saveNote, getNote, settings } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [noteText, setNoteText] = useState(getNote(experimentId) || '');
  const [showNoteInput, setShowNoteInput] = useState(false);

  const experiment = getExperimentById(experimentId);
  const completed = isExperimentCompleted(experimentId);
  const completion = getExperimentCompletion(experimentId);
  const isFavorite = favorites.includes(experimentId);

  if (!experiment) return <View style={styles.errorContainer}><Text>Experiment not found</Text></View>;

  const getDifficultyColor = (diff) => ({ beginner: '#27ae60', intermediate: '#f39c12', advanced: '#e74c3c' }[diff] || '#7f8c8d');

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return (
        <View>
          <View style={styles.section}><Text style={styles.sectionTitle}>Learning Objectives</Text>
            {experiment.objectives?.map((obj, i) => <View key={i} style={styles.objectiveItem}><Text style={styles.objectiveBullet}>•</Text><Text style={styles.objectiveText}>{obj}</Text></View>)}
          </View>
          {settings.showFormulas && experiment.theory && <View style={styles.section}><Text style={styles.sectionTitle}>Theory</Text><Text style={styles.theoryText}>{experiment.theory}</Text></View>}
          {settings.showFormulas && experiment.formula && <View style={styles.section}><Text style={styles.sectionTitle}>Key Formula</Text><View style={styles.formulaBox}><Text style={styles.formulaText}>{experiment.formula}</Text></View></View>}
        </View>
      );
      case 'equipment': return <View style={styles.section}><Text style={styles.sectionTitle}>Equipment & Materials</Text>{experiment.equipment?.map((item, i) => <View key={i} style={styles.equipmentItem}><Text style={styles.equipmentIcon}>🔧</Text><Text style={styles.equipmentText}>{item}</Text></View>)}</View>;
      case 'procedure': return <View style={styles.section}><Text style={styles.sectionTitle}>Procedure</Text>{experiment.procedure?.map((step, i) => <View key={i} style={styles.procedureStep}><View style={styles.stepNumber}><Text style={styles.stepNumberText}>{i + 1}</Text></View><Text style={styles.stepText}>{step}</Text></View>)}</View>;
      case 'safety': return <View style={styles.section}><Text style={styles.sectionTitle}>Safety Precautions</Text><View style={styles.safetyCard}><Text style={styles.safetyIcon}>⚠️</Text><Text style={styles.safetyText}>Always wear safety goggles and lab coat. Handle chemicals with care. Dispose of waste properly.</Text></View></View>;
      case 'notes': return <View style={styles.section}><Text style={styles.sectionTitle}>Your Notes</Text>{showNoteInput ? <View><TextInput style={styles.noteInput} placeholder="Write your notes..." multiline numberOfLines={6} value={noteText} onChangeText={setNoteText} textAlignVertical="top" /><View style={styles.noteButtons}><TouchableOpacity style={styles.noteCancelButton} onPress={() => setShowNoteInput(false)}><Text style={styles.noteCancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.noteSaveButton} onPress={() => { saveNote(experimentId, noteText); setShowNoteInput(false); Alert.alert('Saved'); }}><Text style={styles.noteSaveText}>Save</Text></TouchableOpacity></View></View> : noteText ? <View style={styles.savedNote}><Text style={styles.savedNoteText}>{noteText}</Text><TouchableOpacity onPress={() => setShowNoteInput(true)}><Text style={styles.editNoteText}>Edit</Text></TouchableOpacity></View> : <TouchableOpacity style={styles.addNoteButton} onPress={() => setShowNoteInput(true)}><Text style={styles.addNoteIcon}>📝</Text><Text style={styles.addNoteText}>Add a note</Text></TouchableOpacity>}</View>;
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: experiment.categoryColor || '#27ae60' }]}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}><Text style={styles.headerBackIcon}>←</Text></TouchableOpacity>
        <TouchableOpacity style={styles.favoriteButton} onPress={() => toggleFavorite(experimentId)}><Text style={styles.favoriteIcon}>{isFavorite ? '❤️' : '🤍'}</Text></TouchableOpacity>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleCard}>
          <View style={styles.titleHeader}>
            <View style={[styles.categoryBadge, { backgroundColor: (experiment.categoryColor || '#27ae60') + '20' }]}><Text style={styles.categoryIcon}>{experiment.categoryIcon}</Text><Text style={[styles.categoryText, { color: experiment.categoryColor }]}>{experiment.categoryTitle}</Text></View>
            {completed && <View style={styles.completedBadge}><Text style={styles.completedIcon}>✓</Text><Text style={styles.completedText}>Completed</Text></View>}
          </View>
          <Text style={styles.title}>{experiment.title}</Text>
          <Text style={styles.description}>{experiment.description}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(experiment.difficulty) + '20' }]}><Text style={[styles.difficultyText, { color: getDifficultyColor(experiment.difficulty) }]}>{experiment.difficulty}</Text></View>
            <View style={styles.durationBadge}><Text style={styles.durationIcon}>⏱️</Text><Text style={styles.durationText}>{experiment.duration} min</Text></View>
            {completion && <View style={styles.scoreBadge}><Text style={styles.scoreIcon}>🏆</Text><Text style={styles.scoreText}>Best: {completion.bestScore}%</Text></View>}
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
          {['overview', 'equipment', 'procedure', 'safety', 'notes'].map((tab) => <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}><Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text></TouchableOpacity>)}
        </ScrollView>
        <View style={styles.tabContent}>{renderTab()}</View>
        <View style={{ height: 100 }} />
      </ScrollView>
      <View style={styles.startButtonContainer}>
        <TouchableOpacity style={[styles.startButton, { backgroundColor: experiment.categoryColor || '#27ae60' }]} onPress={() => navigation.navigate('Simulation', { experimentId })}>
          <Text style={styles.startButtonIcon}>🧪</Text><Text style={styles.startButtonText}>{completed ? 'Try Again' : 'Start Experiment'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 12 },
  headerBackButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerBackIcon: { fontSize: 24, color: '#fff' },
  favoriteButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  favoriteIcon: { fontSize: 20 },
  content: { flex: 1 },
  titleCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: -20, borderRadius: 20, padding: 20, elevation: 5 },
  titleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  categoryIcon: { fontSize: 14, marginRight: 6 },
  categoryText: { fontSize: 12, fontWeight: '600' },
  completedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#d4edda', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  completedIcon: { fontSize: 12, marginRight: 4, color: '#155724' },
  completedText: { fontSize: 12, color: '#155724', fontWeight: '600' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50', marginBottom: 8 },
  description: { fontSize: 15, color: '#7f8c8d', lineHeight: 22, marginBottom: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  difficultyBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8 },
  difficultyText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  durationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8 },
  durationIcon: { fontSize: 12, marginRight: 4 },
  durationText: { fontSize: 12, color: '#7f8c8d' },
  scoreBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff3e0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  scoreIcon: { fontSize: 12, marginRight: 4 },
  scoreText: { fontSize: 12, color: '#f39c12', fontWeight: '600' },
  tabsContainer: { marginTop: 16, paddingHorizontal: 16 },
  tab: { paddingHorizontal: 20, paddingVertical: 12, marginRight: 8, borderRadius: 20, backgroundColor: '#fff' },
  tabActive: { backgroundColor: '#27ae60' },
  tabText: { fontSize: 14, color: '#7f8c8d', fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  tabContent: { paddingHorizontal: 16, paddingTop: 16 },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#2c3e50', marginBottom: 12 },
  objectiveItem: { flexDirection: 'row', marginBottom: 8 },
  objectiveBullet: { fontSize: 14, color: '#27ae60', marginRight: 8, fontWeight: 'bold' },
  objectiveText: { flex: 1, fontSize: 14, color: '#555', lineHeight: 20 },
  theoryText: { fontSize: 14, color: '#555', lineHeight: 22 },
  formulaBox: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: '#27ae60' },
  formulaText: { fontSize: 16, fontFamily: 'monospace', color: '#2c3e50', textAlign: 'center' },
  equipmentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  equipmentIcon: { fontSize: 16, marginRight: 12 },
  equipmentText: { fontSize: 14, color: '#2c3e50' },
  procedureStep: { flexDirection: 'row', marginBottom: 16 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#27ae60', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stepNumberText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  stepText: { flex: 1, fontSize: 14, color: '#555', lineHeight: 22, paddingTop: 4 },
  safetyCard: { flexDirection: 'row', backgroundColor: '#fff3e0', borderRadius: 12, padding: 16, alignItems: 'flex-start' },
  safetyIcon: { fontSize: 24, marginRight: 12 },
  safetyText: { flex: 1, fontSize: 14, color: '#e65100', lineHeight: 22 },
  noteInput: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 16, fontSize: 14, color: '#2c3e50', minHeight: 120, borderWidth: 1, borderColor: '#e0e0e0' },
  noteButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  noteCancelButton: { paddingHorizontal: 20, paddingVertical: 10, marginRight: 12 },
  noteCancelText: { fontSize: 14, color: '#7f8c8d' },
  noteSaveButton: { backgroundColor: '#27ae60', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  noteSaveText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  savedNote: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 16 },
  savedNoteText: { fontSize: 14, color: '#2c3e50', lineHeight: 22 },
  editNoteText: { fontSize: 14, color: '#27ae60', fontWeight: '600', marginTop: 12 },
  addNoteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa', borderRadius: 12, padding: 24, borderWidth: 2, borderColor: '#e0e0e0', borderStyle: 'dashed' },
  addNoteIcon: { fontSize: 24, marginRight: 8 },
  addNoteText: { fontSize: 14, color: '#7f8c8d' },
  startButtonContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  startButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16 },
  startButtonIcon: { fontSize: 20, marginRight: 8 },
  startButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
});

export default ExperimentDetailScreen;
