import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { useApp } from '../context/AppContext';
const { width: SW } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { user, getCategories, getStatistics, getRecentExperiments, getRecommendedExperiments, searchExperiments } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const categories = getCategories();
  const stats = getStatistics();
  const recent = getRecentExperiments(4);
  const recommended = getRecommendedExperiments();
  const handleSearch = (q) => { setSearchQuery(q); setSearchResults(q.trim().length >= 2 ? searchExperiments(q) : []); };

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.header}><View><Text style={s.greeting}>Welcome, {user?.name || 'Student'}!</Text><Text style={s.subGreeting}>Biology Virtual Laboratory</Text></View><TouchableOpacity style={s.settingsButton} onPress={() => navigation.navigate('Settings')}><Text style={s.settingsIcon}>⚙️</Text></TouchableOpacity></View>
      <View style={s.searchContainer}><Text style={s.searchIcon}>🔍</Text><TextInput style={s.searchInput} placeholder="Search experiments..." placeholderTextColor="#999" value={searchQuery} onChangeText={handleSearch} />{searchQuery.length > 0 && <TouchableOpacity onPress={() => handleSearch('')}><Text style={s.clearIcon}>✕</Text></TouchableOpacity>}</View>
      {searchResults.length > 0 && <View style={s.searchResults}>{searchResults.slice(0, 5).map(exp => <TouchableOpacity key={exp.id} style={s.searchResultItem} onPress={() => { setSearchQuery(''); setSearchResults([]); navigation.navigate('ExperimentDetail', { experimentId: exp.id }); }}><Text style={s.searchResultTitle}>{exp.title}</Text><Text style={s.searchResultCategory}>{exp.categoryTitle}</Text></TouchableOpacity>)}</View>}
      <View style={s.statsRow}><View style={s.statCard}><Text style={s.statIcon}>🔬</Text><Text style={s.statValue}>{stats.uniqueCompleted}/{stats.totalExperiments}</Text><Text style={s.statLabel}>Experiments</Text></View><View style={s.statCard}><Text style={s.statIcon}>📊</Text><Text style={s.statValue}>{stats.avgScore}%</Text><Text style={s.statLabel}>Avg Score</Text></View><View style={s.statCard}><Text style={s.statIcon}>🎖️</Text><Text style={s.statValue}>{stats.badges.length}</Text><Text style={s.statLabel}>Badges</Text></View></View>
      <View style={s.progressCard}><View style={s.progressHeader}><Text style={s.progressTitle}>Overall Progress</Text><Text style={s.progressPercent}>{stats.completionRate}%</Text></View><View style={s.progressBarContainer}><View style={[s.progressBar, { width: `${stats.completionRate}%` }]} /></View></View>
      <View style={s.section}><View style={s.sectionHeader}><Text style={s.sectionTitle}>Categories</Text><TouchableOpacity onPress={() => navigation.navigate('Categories')}><Text style={s.seeAllText}>See all</Text></TouchableOpacity></View><View style={s.categoriesGrid}>{categories.map(cat => <TouchableOpacity key={cat.id} style={[s.categoryCard, { borderTopColor: cat.color }]} onPress={() => navigation.navigate('ExperimentList', { categoryId: cat.id })}><Text style={s.categoryIcon}>{cat.icon}</Text><Text style={s.categoryTitle}>{cat.title}</Text><Text style={s.categoryCount}>{cat.completedCount}/{cat.experimentCount}</Text><View style={s.categoryProgress}><View style={[s.categoryProgressBar, { width: `${(cat.completedCount / cat.experimentCount) * 100}%`, backgroundColor: cat.color }]} /></View></TouchableOpacity>)}</View></View>
      {recent.length > 0 && <View style={s.section}><Text style={s.sectionTitle}>Recent Experiments</Text>{recent.map(exp => <TouchableOpacity key={exp.id} style={s.recentCard} onPress={() => navigation.navigate('ExperimentDetail', { experimentId: exp.id })}><View style={[s.recentIcon, { backgroundColor: exp.categoryColor + '20' }]}><Text>{exp.categoryIcon}</Text></View><View style={s.recentContent}><Text style={s.recentTitle}>{exp.title}</Text><Text style={s.recentCategory}>{exp.categoryTitle}</Text></View><View style={s.recentScore}><Text style={s.recentScoreText}>{exp.lastScore}%</Text></View></TouchableOpacity>)}</View>}
      {recommended.length > 0 && <View style={s.section}><Text style={s.sectionTitle}>Recommended</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{recommended.map(exp => <TouchableOpacity key={exp.id} style={s.recommendedCard} onPress={() => navigation.navigate('ExperimentDetail', { experimentId: exp.id })}><View style={[s.recommendedIconBg, { backgroundColor: exp.categoryColor + '20' }]}><Text style={s.recommendedIcon}>{exp.categoryIcon}</Text></View><Text style={s.recommendedTitle} numberOfLines={2}>{exp.title}</Text><Text style={s.recommendedDuration}>{exp.duration} min</Text></TouchableOpacity>)}</ScrollView></View>}
      <View style={s.quickStart}><TouchableOpacity style={s.quickStartButton} onPress={() => recommended.length > 0 && navigation.navigate('ExperimentDetail', { experimentId: recommended[0].id })}><Text style={s.quickStartIcon}>🚀</Text><Text style={s.quickStartText}>Quick Start</Text></TouchableOpacity><TouchableOpacity style={s.quickStartButton} onPress={() => navigation.navigate('Categories')}><Text style={s.quickStartIcon}>📚</Text><Text style={s.quickStartText}>Browse All</Text></TouchableOpacity></View>
      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 16, backgroundColor: '#2ecc71', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  settingsButton: { padding: 12, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
  settingsIcon: { fontSize: 20 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: -20, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, elevation: 4 },
  searchIcon: { fontSize: 18, marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: '#2c3e50' },
  clearIcon: { fontSize: 16, color: '#999', padding: 4 },
  searchResults: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 8, borderRadius: 12, overflow: 'hidden' },
  searchResultItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  searchResultTitle: { fontSize: 16, fontWeight: '600', color: '#2c3e50' },
  searchResultCategory: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, marginHorizontal: 4, alignItems: 'center', elevation: 2 },
  statIcon: { fontSize: 24, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },
  statLabel: { fontSize: 11, color: '#7f8c8d', marginTop: 2 },
  progressCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progressTitle: { fontSize: 16, fontWeight: '600', color: '#2c3e50' },
  progressPercent: { fontSize: 18, fontWeight: 'bold', color: '#2ecc71' },
  progressBarContainer: { height: 10, backgroundColor: '#e0e0e0', borderRadius: 5, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#2ecc71', borderRadius: 5 },
  section: { padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#2c3e50', marginBottom: 12 },
  seeAllText: { fontSize: 14, color: '#2ecc71', fontWeight: '600' },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  categoryCard: { width: (SW - 56) / 2, backgroundColor: '#fff', borderRadius: 16, padding: 16, margin: 6, borderTopWidth: 4 },
  categoryIcon: { fontSize: 28, marginBottom: 8 },
  categoryTitle: { fontSize: 14, fontWeight: '600', color: '#2c3e50' },
  categoryCount: { fontSize: 12, color: '#7f8c8d', marginTop: 4 },
  categoryProgress: { height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  categoryProgressBar: { height: '100%', borderRadius: 2 },
  recentCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  recentIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  recentContent: { flex: 1 },
  recentTitle: { fontSize: 15, fontWeight: '600', color: '#2c3e50' },
  recentCategory: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  recentScore: { backgroundColor: '#e8f5e9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  recentScoreText: { fontSize: 14, fontWeight: '600', color: '#2ecc71' },
  recommendedCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginRight: 12, width: 160 },
  recommendedIconBg: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  recommendedIcon: { fontSize: 24 },
  recommendedTitle: { fontSize: 14, fontWeight: '600', color: '#2c3e50', marginBottom: 8 },
  recommendedDuration: { fontSize: 11, color: '#2ecc71' },
  quickStart: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 },
  quickStartButton: { flex: 1, backgroundColor: '#2ecc71', borderRadius: 16, padding: 20, marginHorizontal: 4, alignItems: 'center' },
  quickStartIcon: { fontSize: 28, marginBottom: 8 },
  quickStartText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});

export default HomeScreen;
