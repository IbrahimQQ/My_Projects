import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useApp } from '../context/AppContext';

const ExportScreen = ({ route, navigation }) => {
  const { simulationId } = route.params || {};
  const { simulations, getSimulationById, exportSim, exportAll } = useApp();
  const simulation = simulationId ? getSimulationById(simulationId) : null;
  const [selectedSims, setSelectedSims] = useState(simulation ? [simulation.id] : []);
  const [exporting, setExporting] = useState(false);

  const targetApps = [
    { id: 'physics-lab', name: 'Physics Lab', icon: '⚡', color: '#3498db', subject: 'physics' },
    { id: 'chemistry-lab', name: 'Chemistry Lab', icon: '⚗️', color: '#9b59b6', subject: 'chemistry' },
    { id: 'biology-lab', name: 'Biology Lab', icon: '🧬', color: '#2ecc71', subject: 'biology' },
  ];

  const toggleSelection = (id) => {
    setSelectedSims(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const selectAll = () => setSelectedSims(simulations.map(s => s.id));
  const selectNone = () => setSelectedSims([]);

  const handleExportSingle = async (targetApp) => {
    if (selectedSims.length !== 1) {
      Alert.alert('Select One', 'Please select exactly one simulation to export');
      return;
    }
    setExporting(true);
    const result = await exportSim(selectedSims[0], targetApp.id);
    setExporting(false);
    if (result) {
      Alert.alert('Export Successful', `Simulation exported for ${targetApp.name}`);
    } else {
      Alert.alert('Export Failed', 'Could not export simulation');
    }
  };

  const handleExportAll = async () => {
    if (selectedSims.length === 0) {
      Alert.alert('No Selection', 'Please select at least one simulation to export');
      return;
    }
    setExporting(true);
    const simsToExport = simulations.filter(s => selectedSims.includes(s.id));
    const result = await exportAll(simsToExport);
    setExporting(false);
    if (result) {
      Alert.alert('Export Successful', `${simsToExport.length} simulation(s) exported`);
    } else {
      Alert.alert('Export Failed', 'Could not export simulations');
    }
  };

  const getSimulationsBySubject = (subject) => simulations.filter(s => s.subject === subject);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backButton} onPress={() => navigation.goBack()}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={s.headerInfo}>
          <Text style={s.headerTitle}>Export Simulations</Text>
          <Text style={s.headerSubtitle}>{selectedSims.length} selected</Text>
        </View>
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {/* Target Apps */}
        <Text style={s.sectionTitle}>Export To Lab App</Text>
        <View style={s.appsGrid}>
          {targetApps.map((app) => {
            const compatibleSims = selectedSims.filter(id => {
              const sim = getSimulationById(id);
              return sim?.subject === app.subject;
            });
            return (
              <TouchableOpacity key={app.id} style={[s.appCard, { borderColor: app.color }]} onPress={() => handleExportSingle(app)} disabled={exporting || compatibleSims.length === 0}>
                <View style={[s.appIcon, { backgroundColor: app.color + '20' }]}>
                  <Text style={s.appIconText}>{app.icon}</Text>
                </View>
                <Text style={s.appName}>{app.name}</Text>
                <Text style={s.appCount}>{getSimulationsBySubject(app.subject).length} simulations</Text>
                {compatibleSims.length > 0 && (
                  <View style={[s.compatibleBadge, { backgroundColor: app.color }]}>
                    <Text style={s.compatibleText}>{compatibleSims.length} compatible</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selection Controls */}
        <View style={s.selectionHeader}>
          <Text style={s.sectionTitle}>Select Simulations</Text>
          <View style={s.selectionButtons}>
            <TouchableOpacity style={s.selectButton} onPress={selectAll}>
              <Text style={s.selectButtonText}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.selectButton} onPress={selectNone}>
              <Text style={s.selectButtonText}>None</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Simulations List */}
        {simulations.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>📦</Text>
            <Text style={s.emptyTitle}>No Simulations</Text>
            <Text style={s.emptyText}>Create simulations first to export them</Text>
          </View>
        ) : (
          simulations.map((sim) => {
            const app = targetApps.find(a => a.subject === sim.subject);
            const isSelected = selectedSims.includes(sim.id);
            return (
              <TouchableOpacity key={sim.id} style={[s.simCard, isSelected && s.simCardSelected]} onPress={() => toggleSelection(sim.id)}>
                <View style={[s.checkbox, isSelected && { backgroundColor: app?.color || '#3498db', borderColor: app?.color || '#3498db' }]}>
                  {isSelected && <Text style={s.checkmark}>✓</Text>}
                </View>
                <View style={[s.simBadge, { backgroundColor: app?.color || '#666' }]}>
                  <Text style={s.simBadgeIcon}>{app?.icon || '📚'}</Text>
                </View>
                <View style={s.simInfo}>
                  <Text style={s.simTitle}>{sim.title || 'Untitled'}</Text>
                  <Text style={s.simMeta}>{sim.category || 'No category'} • {sim.variables?.length || 0} vars • {sim.formulas?.length || 0} formulas</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Export All Button */}
        {simulations.length > 0 && (
          <TouchableOpacity style={[s.exportAllButton, exporting && s.exportAllButtonDisabled]} onPress={handleExportAll} disabled={exporting || selectedSims.length === 0}>
            <Text style={s.exportAllIcon}>📤</Text>
            <Text style={s.exportAllText}>{exporting ? 'Exporting...' : `Export ${selectedSims.length} Simulation(s)`}</Text>
          </TouchableOpacity>
        )}

        {/* Export Format Info */}
        <View style={s.infoCard}>
          <Text style={s.infoTitle}>Export Format</Text>
          <Text style={s.infoText}>Simulations are exported as JSON files that can be imported into the respective lab apps. Each export includes:</Text>
          <View style={s.infoList}>
            <Text style={s.infoItem}>• Simulation configuration</Text>
            <Text style={s.infoItem}>• Variables and their ranges</Text>
            <Text style={s.infoItem}>• Formulas and calculations</Text>
            <Text style={s.infoItem}>• Visualization settings</Text>
            <Text style={s.infoItem}>• Instructions and objectives</Text>
          </View>
        </View>

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
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  content: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#2c3e50', marginHorizontal: 16, marginTop: 20, marginBottom: 12 },
  appsGrid: { flexDirection: 'row', paddingHorizontal: 12 },
  appCard: { flex: 1, backgroundColor: '#fff', margin: 4, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 2, elevation: 2 },
  appIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  appIconText: { fontSize: 24 },
  appName: { fontSize: 13, fontWeight: '600', color: '#2c3e50', textAlign: 'center' },
  appCount: { fontSize: 11, color: '#7f8c8d', marginTop: 4 },
  compatibleBadge: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  compatibleText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  selectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 20, marginBottom: 12 },
  selectionButtons: { flexDirection: 'row' },
  selectButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#ecf0f1', borderRadius: 12, marginLeft: 8 },
  selectButtonText: { fontSize: 12, color: '#2c3e50' },
  emptyState: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#2c3e50', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#7f8c8d' },
  simCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 12, elevation: 1 },
  simCardSelected: { borderWidth: 2, borderColor: '#3498db' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  simBadge: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  simBadgeIcon: { fontSize: 18 },
  simInfo: { flex: 1 },
  simTitle: { fontSize: 14, fontWeight: '600', color: '#2c3e50' },
  simMeta: { fontSize: 11, color: '#7f8c8d', marginTop: 2 },
  exportAllButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#27ae60', marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 12 },
  exportAllButtonDisabled: { backgroundColor: '#95a5a6' },
  exportAllIcon: { fontSize: 18, marginRight: 8 },
  exportAllText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  infoCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 20, borderRadius: 16, padding: 16 },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#2c3e50', marginBottom: 8 },
  infoText: { fontSize: 13, color: '#7f8c8d', lineHeight: 20 },
  infoList: { marginTop: 12 },
  infoItem: { fontSize: 13, color: '#7f8c8d', lineHeight: 22 },
});

export default ExportScreen;
