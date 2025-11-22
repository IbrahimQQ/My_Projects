import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useApp } from '../context/AppContext';

const SimulationListScreen = ({ navigation }) => {
  const { simulations, deleteSimulation, duplicateSimulation, getSimulationsBySubject } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const subjects = [
    { id: 'all', name: 'All', color: '#2c3e50' },
    { id: 'physics', name: 'Physics', icon: '⚡', color: '#3498db' },
    { id: 'chemistry', name: 'Chemistry', icon: '⚗️', color: '#9b59b6' },
    { id: 'biology', name: 'Biology', icon: '🧬', color: '#2ecc71' },
  ];

  const getFilteredSimulations = () => {
    let filtered = filterSubject === 'all' ? simulations : getSimulationsBySubject(filterSubject);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        (s.title || '').toLowerCase().includes(query) ||
        (s.description || '').toLowerCase().includes(query) ||
        (s.category || '').toLowerCase().includes(query)
      );
    }

    switch (sortBy) {
      case 'recent': return [...filtered].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      case 'oldest': return [...filtered].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'name': return [...filtered].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      default: return filtered;
    }
  };

  const handleDelete = (sim) => {
    Alert.alert('Delete Simulation', `Are you sure you want to delete "${sim.title || 'Untitled'}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteSimulation(sim.id) },
    ]);
  };

  const handleDuplicate = async (sim) => {
    const newSim = await duplicateSimulation(sim.id);
    if (newSim) Alert.alert('Success', 'Simulation duplicated successfully!');
  };

  const filteredSimulations = getFilteredSimulations();

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backButton} onPress={() => navigation.goBack()}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Simulations</Text>
        <Text style={s.headerCount}>{filteredSimulations.length}</Text>
      </View>

      <View style={s.searchBar}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput style={s.searchInput} placeholder="Search simulations..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor="#999" />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={s.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterBar}>
        {subjects.map((subject) => (
          <TouchableOpacity key={subject.id} style={[s.filterChip, filterSubject === subject.id && { backgroundColor: subject.color }]} onPress={() => setFilterSubject(subject.id)}>
            {subject.icon && <Text style={s.filterIcon}>{subject.icon}</Text>}
            <Text style={[s.filterText, filterSubject === subject.id && { color: '#fff' }]}>{subject.name}</Text>
          </TouchableOpacity>
        ))}
        <View style={s.sortContainer}>
          <TouchableOpacity style={s.sortButton} onPress={() => setSortBy(sortBy === 'recent' ? 'name' : sortBy === 'name' ? 'oldest' : 'recent')}>
            <Text style={s.sortIcon}>↕️</Text>
            <Text style={s.sortText}>{sortBy === 'recent' ? 'Recent' : sortBy === 'name' ? 'A-Z' : 'Oldest'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {filteredSimulations.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>🔬</Text>
            <Text style={s.emptyTitle}>No Simulations Found</Text>
            <Text style={s.emptyText}>{searchQuery ? 'Try adjusting your search' : 'Create your first simulation!'}</Text>
          </View>
        ) : (
          filteredSimulations.map((sim) => {
            const subject = subjects.find(s => s.id === sim.subject);
            return (
              <TouchableOpacity key={sim.id} style={s.simCard} onPress={() => navigation.navigate('SimulationEditor', { simulationId: sim.id })} onLongPress={() => {
                Alert.alert(sim.title || 'Untitled', 'Choose an action', [
                  { text: 'Edit', onPress: () => navigation.navigate('SimulationEditor', { simulationId: sim.id }) },
                  { text: 'Duplicate', onPress: () => handleDuplicate(sim) },
                  { text: 'Export', onPress: () => navigation.navigate('Export', { simulationId: sim.id }) },
                  { text: 'Delete', style: 'destructive', onPress: () => handleDelete(sim) },
                  { text: 'Cancel', style: 'cancel' },
                ]);
              }}>
                <View style={[s.simBadge, { backgroundColor: subject?.color || '#666' }]}>
                  <Text style={s.simBadgeIcon}>{subject?.icon || '📚'}</Text>
                </View>
                <View style={s.simContent}>
                  <Text style={s.simTitle}>{sim.title || 'Untitled Simulation'}</Text>
                  <Text style={s.simDescription} numberOfLines={2}>{sim.description || 'No description'}</Text>
                  <View style={s.simMeta}>
                    <Text style={s.simMetaText}>{sim.category || 'No category'}</Text>
                    <Text style={s.simMetaDot}>•</Text>
                    <Text style={s.simMetaText}>{sim.variables?.length || 0} variables</Text>
                    <Text style={s.simMetaDot}>•</Text>
                    <Text style={s.simMetaText}>{sim.difficulty || 'Intermediate'}</Text>
                  </View>
                </View>
                <View style={s.simActions}>
                  <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('Preview', { simulationId: sim.id })}>
                    <Text style={s.actionBtnIcon}>▶</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 16, backgroundColor: '#2c3e50', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  backIcon: { fontSize: 24, color: '#fff' },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerCount: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: '600' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: -20, borderRadius: 12, paddingHorizontal: 16, elevation: 3 },
  searchIcon: { fontSize: 18, marginRight: 12 },
  searchInput: { flex: 1, height: 50, fontSize: 16, color: '#2c3e50' },
  clearIcon: { fontSize: 16, color: '#999', padding: 4 },
  filterBar: { paddingHorizontal: 12, paddingVertical: 12, maxHeight: 56 },
  filterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginHorizontal: 4, elevation: 1 },
  filterIcon: { fontSize: 14, marginRight: 6 },
  filterText: { fontSize: 13, color: '#2c3e50', fontWeight: '500' },
  sortContainer: { marginLeft: 8 },
  sortButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8e8e8', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  sortIcon: { fontSize: 14, marginRight: 6 },
  sortText: { fontSize: 13, color: '#2c3e50' },
  content: { flex: 1, paddingTop: 8 },
  emptyState: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#2c3e50', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#7f8c8d' },
  simCard: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, elevation: 2 },
  simBadge: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  simBadgeIcon: { fontSize: 24 },
  simContent: { flex: 1 },
  simTitle: { fontSize: 16, fontWeight: '600', color: '#2c3e50', marginBottom: 4 },
  simDescription: { fontSize: 13, color: '#7f8c8d', lineHeight: 18, marginBottom: 8 },
  simMeta: { flexDirection: 'row', alignItems: 'center' },
  simMetaText: { fontSize: 11, color: '#95a5a6' },
  simMetaDot: { fontSize: 11, color: '#95a5a6', marginHorizontal: 6 },
  simActions: { justifyContent: 'center' },
  actionBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e8f4f8', justifyContent: 'center', alignItems: 'center' },
  actionBtnIcon: { fontSize: 16, color: '#3498db' },
});

export default SimulationListScreen;
