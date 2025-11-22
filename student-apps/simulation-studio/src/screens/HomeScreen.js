import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useApp } from '../context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { simulations, getStatistics, createSimulation } = useApp();
  const stats = getStatistics();
  const recentSimulations = [...simulations].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);

  const subjects = [
    { id: 'physics', name: 'Physics', icon: '⚡', color: '#3498db', description: 'Mechanics, Waves, Electricity' },
    { id: 'chemistry', name: 'Chemistry', icon: '⚗️', color: '#9b59b6', description: 'Reactions, Molecules, Solutions' },
    { id: 'biology', name: 'Biology', icon: '🧬', color: '#2ecc71', description: 'Cells, Ecology, Genetics' },
  ];

  const handleCreateNew = (subject) => {
    createSimulation(subject);
    navigation.navigate('SimulationEditor', { isNew: true, subject });
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.welcomeText}>Welcome to</Text>
          <Text style={s.headerTitle}>Simulation Studio</Text>
        </View>
        <TouchableOpacity style={s.settingsButton} onPress={() => navigation.navigate('Settings')}>
          <Text style={s.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {/* Stats Overview */}
        <View style={s.statsCard}>
          <Text style={s.statsTitle}>Your Simulations</Text>
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{stats.total}</Text>
              <Text style={s.statLabel}>Total</Text>
            </View>
            <View style={[s.statItem, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#eee' }]}>
              <Text style={[s.statValue, { color: '#3498db' }]}>{stats.physics}</Text>
              <Text style={s.statLabel}>Physics</Text>
            </View>
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: '#9b59b6' }]}>{stats.chemistry}</Text>
              <Text style={s.statLabel}>Chemistry</Text>
            </View>
            <View style={[s.statItem, { borderLeftWidth: 1, borderColor: '#eee' }]}>
              <Text style={[s.statValue, { color: '#2ecc71' }]}>{stats.biology}</Text>
              <Text style={s.statLabel}>Biology</Text>
            </View>
          </View>
        </View>

        {/* Create New Section */}
        <Text style={s.sectionTitle}>Create New Simulation</Text>
        <View style={s.subjectsGrid}>
          {subjects.map((subject) => (
            <TouchableOpacity key={subject.id} style={[s.subjectCard, { borderColor: subject.color }]} onPress={() => handleCreateNew(subject.id)}>
              <View style={[s.subjectIconContainer, { backgroundColor: subject.color + '20' }]}>
                <Text style={s.subjectIcon}>{subject.icon}</Text>
              </View>
              <Text style={s.subjectName}>{subject.name}</Text>
              <Text style={s.subjectDescription}>{subject.description}</Text>
              <View style={[s.createBadge, { backgroundColor: subject.color }]}>
                <Text style={s.createBadgeText}>+ Create</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Simulations */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Recent Simulations</Text>
          {simulations.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('SimulationList')}>
              <Text style={s.seeAllText}>See All →</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentSimulations.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>🎨</Text>
            <Text style={s.emptyTitle}>No Simulations Yet</Text>
            <Text style={s.emptyText}>Create your first simulation to get started!</Text>
          </View>
        ) : (
          recentSimulations.map((sim) => (
            <TouchableOpacity key={sim.id} style={s.simCard} onPress={() => navigation.navigate('SimulationEditor', { simulationId: sim.id })}>
              <View style={[s.simSubjectBadge, { backgroundColor: subjects.find(s => s.id === sim.subject)?.color || '#666' }]}>
                <Text style={s.simSubjectIcon}>{subjects.find(s => s.id === sim.subject)?.icon || '📚'}</Text>
              </View>
              <View style={s.simInfo}>
                <Text style={s.simTitle}>{sim.title || 'Untitled Simulation'}</Text>
                <Text style={s.simMeta}>{sim.category || 'No category'} • {sim.variables?.length || 0} variables</Text>
              </View>
              <Text style={s.simArrow}>→</Text>
            </TouchableOpacity>
          ))
        )}

        {/* Quick Actions */}
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.actionsGrid}>
          <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('SimulationList')}>
            <Text style={s.actionIcon}>📋</Text>
            <Text style={s.actionText}>Browse All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('Export')}>
            <Text style={s.actionIcon}>📤</Text>
            <Text style={s.actionText}>Export</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('Templates')}>
            <Text style={s.actionIcon}>📑</Text>
            <Text style={s.actionText}>Templates</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('Help')}>
            <Text style={s.actionIcon}>❓</Text>
            <Text style={s.actionText}>Help</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 16, backgroundColor: '#2c3e50', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  welcomeText: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  settingsButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  settingsIcon: { fontSize: 20 },
  content: { flex: 1 },
  statsCard: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 20, elevation: 2 },
  statsTitle: { fontSize: 16, fontWeight: '600', color: '#2c3e50', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', flex: 1, paddingVertical: 8 },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#2c3e50' },
  statLabel: { fontSize: 12, color: '#7f8c8d', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#2c3e50', marginHorizontal: 16, marginTop: 8, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 8, marginBottom: 12 },
  seeAllText: { fontSize: 14, color: '#3498db', fontWeight: '500' },
  subjectsGrid: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 8 },
  subjectCard: { flex: 1, backgroundColor: '#fff', margin: 4, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 2, elevation: 2 },
  subjectIconContainer: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  subjectIcon: { fontSize: 28 },
  subjectName: { fontSize: 16, fontWeight: '600', color: '#2c3e50', marginBottom: 4 },
  subjectDescription: { fontSize: 11, color: '#7f8c8d', textAlign: 'center', marginBottom: 12 },
  createBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  createBadgeText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  emptyState: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 40, alignItems: 'center', elevation: 2 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#2c3e50', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#7f8c8d', textAlign: 'center' },
  simCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 12, elevation: 1 },
  simSubjectBadge: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  simSubjectIcon: { fontSize: 20 },
  simInfo: { flex: 1 },
  simTitle: { fontSize: 15, fontWeight: '600', color: '#2c3e50' },
  simMeta: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  simArrow: { fontSize: 18, color: '#bdc3c7' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  actionCard: { width: (SCREEN_WIDTH - 48) / 4, backgroundColor: '#fff', margin: 4, borderRadius: 12, padding: 12, alignItems: 'center', elevation: 1 },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionText: { fontSize: 11, color: '#2c3e50', textAlign: 'center' },
});

export default HomeScreen;
