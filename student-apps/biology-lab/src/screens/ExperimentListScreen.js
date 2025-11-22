import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useApp } from '../context/AppContext';
import { biologyExperiments } from '../data/experiments';

const ExperimentListScreen = ({ route, navigation }) => {
  const { categoryId } = route.params || {};
  const { getExperimentsByCategory, getAllExperiments, isExperimentCompleted, getExperimentCompletion, favorites } = useApp();
  const [filter, setFilter] = useState('all');
  const category = categoryId ? biologyExperiments[categoryId] : null;
  const allExperiments = categoryId ? getExperimentsByCategory(categoryId) : getAllExperiments();
  const filteredExperiments = useMemo(() => {
    let f = [...allExperiments];
    if (filter === 'completed') f = f.filter(e => isExperimentCompleted(e.id));
    else if (filter === 'incomplete') f = f.filter(e => !isExperimentCompleted(e.id));
    else if (filter === 'favorites') f = f.filter(e => favorites.includes(e.id));
    return f;
  }, [allExperiments, filter, favorites]);

  const getDifficultyColor = (d) => ({ beginner: '#2ecc71', intermediate: '#f39c12', advanced: '#e74c3c' }[d] || '#7f8c8d');

  const renderExperiment = ({ item: exp }) => {
    const completed = isExperimentCompleted(exp.id);
    const completion = getExperimentCompletion(exp.id);
    return (
      <TouchableOpacity style={s.experimentCard} onPress={() => navigation.navigate('ExperimentDetail', { experimentId: exp.id })}>
        <View style={s.experimentHeader}>
          <View style={[s.experimentIcon, { backgroundColor: (exp.categoryColor || '#2ecc71') + '20' }]}><Text>{exp.categoryIcon || '🔬'}</Text></View>
          <View style={s.experimentInfo}><Text style={s.experimentTitle}>{exp.title}</Text>{!categoryId && <Text style={s.experimentCategory}>{exp.categoryTitle}</Text>}</View>
          {favorites.includes(exp.id) && <Text style={s.favoriteIcon}>❤️</Text>}
          {completed && <View style={s.completedBadge}><Text style={s.completedIcon}>✓</Text></View>}
        </View>
        <Text style={s.experimentDescription} numberOfLines={2}>{exp.description}</Text>
        <View style={s.experimentMeta}>
          <View style={[s.difficultyBadge, { backgroundColor: getDifficultyColor(exp.difficulty) + '20' }]}><Text style={[s.difficultyText, { color: getDifficultyColor(exp.difficulty) }]}>{exp.difficulty}</Text></View>
          <View style={s.durationBadge}><Text style={s.durationIcon}>⏱️</Text><Text style={s.durationText}>{exp.duration} min</Text></View>
          {completion && <View style={s.scoreBadge}><Text style={s.scoreText}>Best: {completion.bestScore}%</Text></View>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      <View style={[s.header, { backgroundColor: category?.color || '#2ecc71' }]}>
        <TouchableOpacity style={s.backButton} onPress={() => navigation.goBack()}><Text style={s.backIcon}>←</Text></TouchableOpacity>
        <View><Text style={s.headerTitle}>{category?.title || 'All Experiments'}</Text><Text style={s.headerSubtitle}>{filteredExperiments.length} experiments</Text></View>
        <View style={s.headerIcon}><Text style={s.headerIconText}>{category?.icon || '📚'}</Text></View>
      </View>
      <View style={s.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'incomplete', 'completed', 'favorites'].map(f => <TouchableOpacity key={f} style={[s.filterChip, filter === f && s.filterChipActive]} onPress={() => setFilter(f)}><Text style={[s.filterChipText, filter === f && s.filterChipTextActive]}>{f === 'incomplete' ? 'To Do' : f.charAt(0).toUpperCase() + f.slice(1)}</Text></TouchableOpacity>)}
        </ScrollView>
      </View>
      <FlatList data={filteredExperiments} renderItem={renderExperiment} keyExtractor={item => item.id} contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false} ListEmptyComponent={<View style={s.emptyContainer}><Text style={s.emptyIcon}>🔍</Text><Text style={s.emptyText}>No experiments found</Text></View>} />
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  backIcon: { fontSize: 24, color: '#fff' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  headerIcon: { marginLeft: 'auto', width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerIconText: { fontSize: 24 },
  filterContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#e0e0e0' },
  filterChipActive: { backgroundColor: '#2ecc71', borderColor: '#2ecc71' },
  filterChipText: { fontSize: 14, color: '#7f8c8d' },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },
  listContent: { padding: 16, paddingTop: 8 },
  experimentCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  experimentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  experimentIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  experimentInfo: { flex: 1 },
  experimentTitle: { fontSize: 16, fontWeight: '600', color: '#2c3e50' },
  experimentCategory: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  favoriteIcon: { fontSize: 16, marginRight: 8 },
  completedBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#d4edda', justifyContent: 'center', alignItems: 'center' },
  completedIcon: { fontSize: 14, color: '#155724', fontWeight: 'bold' },
  experimentDescription: { fontSize: 14, color: '#7f8c8d', lineHeight: 20, marginBottom: 12 },
  experimentMeta: { flexDirection: 'row', alignItems: 'center' },
  difficultyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
  difficultyText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  durationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
  durationIcon: { fontSize: 11, marginRight: 4 },
  durationText: { fontSize: 11, color: '#7f8c8d' },
  scoreBadge: { backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  scoreText: { fontSize: 11, color: '#2ecc71', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#2c3e50' },
});

export default ExperimentListScreen;
