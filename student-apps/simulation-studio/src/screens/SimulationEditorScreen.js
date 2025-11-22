import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import { useApp } from '../context/AppContext';
import { simulationTemplates, visualizationTypes } from '../data/templates';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SimulationEditorScreen = ({ route, navigation }) => {
  const { simulationId, isNew, subject } = route.params || {};
  const { getSimulationById, saveSimulation, currentSimulation, setCurrentSimulation } = useApp();
  const [activeTab, setActiveTab] = useState('basic');
  const [simulation, setSimulation] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (simulationId) {
      const sim = getSimulationById(simulationId);
      setSimulation(sim);
      setCurrentSimulation(sim);
    } else if (currentSimulation) {
      setSimulation(currentSimulation);
    }
  }, [simulationId]);

  const updateField = (field, value) => {
    setSimulation(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!simulation.title?.trim()) {
      Alert.alert('Error', 'Please enter a title for your simulation');
      return;
    }
    const saved = await saveSimulation(simulation);
    setHasChanges(false);
    Alert.alert('Saved!', 'Your simulation has been saved.', [
      { text: 'Continue Editing' },
      { text: 'Preview', onPress: () => navigation.navigate('Preview', { simulationId: saved.id }) },
    ]);
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert('Unsaved Changes', 'Do you want to save before leaving?', [
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        { text: 'Save', onPress: async () => { await handleSave(); navigation.goBack(); } },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else {
      navigation.goBack();
    }
  };

  const addVariable = (variable) => {
    const exists = simulation.variables?.find(v => v.id === variable.id);
    if (exists) {
      Alert.alert('Already Added', 'This variable is already in your simulation');
      return;
    }
    updateField('variables', [...(simulation.variables || []), { ...variable, value: variable.default }]);
  };

  const removeVariable = (variableId) => {
    updateField('variables', simulation.variables.filter(v => v.id !== variableId));
  };

  const updateVariableValue = (variableId, field, value) => {
    updateField('variables', simulation.variables.map(v =>
      v.id === variableId ? { ...v, [field]: value } : v
    ));
  };

  const addFormula = (formula) => {
    const exists = simulation.formulas?.find(f => f.id === formula.id);
    if (exists) return;
    updateField('formulas', [...(simulation.formulas || []), formula]);
  };

  const removeFormula = (formulaId) => {
    updateField('formulas', simulation.formulas.filter(f => f.id !== formulaId));
  };

  const addInstruction = () => {
    updateField('instructions', [...(simulation.instructions || []), '']);
  };

  const updateInstruction = (index, text) => {
    const updated = [...(simulation.instructions || [])];
    updated[index] = text;
    updateField('instructions', updated);
  };

  const removeInstruction = (index) => {
    updateField('instructions', simulation.instructions.filter((_, i) => i !== index));
  };

  if (!simulation) return <View style={s.container}><Text style={s.loadingText}>Loading...</Text></View>;

  const template = simulationTemplates[simulation.subject] || simulationTemplates.physics;
  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: '📝' },
    { id: 'variables', name: 'Variables', icon: '🔢' },
    { id: 'formulas', name: 'Formulas', icon: '📐' },
    { id: 'visual', name: 'Visual', icon: '🎨' },
    { id: 'instructions', name: 'Instructions', icon: '📋' },
  ];

  const renderBasicTab = () => (
    <View style={s.tabContent}>
      <Text style={s.fieldLabel}>Title *</Text>
      <TextInput style={s.textInput} value={simulation.title} onChangeText={(v) => updateField('title', v)} placeholder="Enter simulation title" />

      <Text style={s.fieldLabel}>Description</Text>
      <TextInput style={[s.textInput, s.textArea]} value={simulation.description} onChangeText={(v) => updateField('description', v)} placeholder="Describe what this simulation demonstrates" multiline numberOfLines={4} />

      <Text style={s.fieldLabel}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
        {template.categories.map((cat) => (
          <TouchableOpacity key={cat} style={[s.chip, simulation.category === cat && s.chipActive]} onPress={() => updateField('category', cat)}>
            <Text style={[s.chipText, simulation.category === cat && s.chipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={s.fieldLabel}>Difficulty</Text>
      <View style={s.chipRow}>
        {['beginner', 'intermediate', 'advanced'].map((diff) => (
          <TouchableOpacity key={diff} style={[s.chip, simulation.difficulty === diff && s.chipActive]} onPress={() => updateField('difficulty', diff)}>
            <Text style={[s.chipText, simulation.difficulty === diff && s.chipTextActive]}>{diff.charAt(0).toUpperCase() + diff.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.fieldLabel}>Duration (minutes)</Text>
      <View style={s.durationRow}>
        {[5, 10, 15, 20, 30, 45, 60].map((dur) => (
          <TouchableOpacity key={dur} style={[s.durationChip, simulation.duration === dur && s.durationChipActive]} onPress={() => updateField('duration', dur)}>
            <Text style={[s.durationText, simulation.duration === dur && s.durationTextActive]}>{dur}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderVariablesTab = () => (
    <View style={s.tabContent}>
      <Text style={s.fieldLabel}>Selected Variables ({simulation.variables?.length || 0})</Text>
      {simulation.variables?.length > 0 ? (
        simulation.variables.map((v) => (
          <View key={v.id} style={s.variableCard}>
            <View style={s.variableHeader}>
              <Text style={s.variableName}>{v.name}</Text>
              <TouchableOpacity onPress={() => removeVariable(v.id)}>
                <Text style={s.removeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={s.variableControls}>
              <View style={s.variableField}>
                <Text style={s.miniLabel}>Min</Text>
                <TextInput style={s.miniInput} value={String(v.min)} keyboardType="numeric" onChangeText={(val) => updateVariableValue(v.id, 'min', parseFloat(val) || 0)} />
              </View>
              <View style={s.variableField}>
                <Text style={s.miniLabel}>Default</Text>
                <TextInput style={s.miniInput} value={String(v.value || v.default)} keyboardType="numeric" onChangeText={(val) => updateVariableValue(v.id, 'value', parseFloat(val) || 0)} />
              </View>
              <View style={s.variableField}>
                <Text style={s.miniLabel}>Max</Text>
                <TextInput style={s.miniInput} value={String(v.max)} keyboardType="numeric" onChangeText={(val) => updateVariableValue(v.id, 'max', parseFloat(val) || 0)} />
              </View>
              <View style={s.variableField}>
                <Text style={s.miniLabel}>Unit</Text>
                <TextInput style={s.miniInput} value={v.unit} onChangeText={(val) => updateVariableValue(v.id, 'unit', val)} />
              </View>
            </View>
          </View>
        ))
      ) : (
        <Text style={s.emptyText}>No variables added yet. Select from below:</Text>
      )}

      <Text style={[s.fieldLabel, { marginTop: 20 }]}>Available Variables</Text>
      <View style={s.availableGrid}>
        {template.variables.filter(v => !simulation.variables?.find(sv => sv.id === v.id)).map((v) => (
          <TouchableOpacity key={v.id} style={s.availableChip} onPress={() => addVariable(v)}>
            <Text style={s.availableText}>+ {v.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderFormulasTab = () => (
    <View style={s.tabContent}>
      <Text style={s.fieldLabel}>Selected Formulas ({simulation.formulas?.length || 0})</Text>
      {simulation.formulas?.length > 0 ? (
        simulation.formulas.map((f) => (
          <View key={f.id} style={s.formulaCard}>
            <View style={s.formulaHeader}>
              <Text style={s.formulaName}>{f.name}</Text>
              <TouchableOpacity onPress={() => removeFormula(f.id)}>
                <Text style={s.removeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.formulaText}>{f.formula}</Text>
            <Text style={s.formulaVars}>Variables: {f.variables.join(', ')}</Text>
          </View>
        ))
      ) : (
        <Text style={s.emptyText}>No formulas added yet. Select from below:</Text>
      )}

      <Text style={[s.fieldLabel, { marginTop: 20 }]}>Available Formulas</Text>
      {template.formulas.filter(f => !simulation.formulas?.find(sf => sf.id === f.id)).map((f) => (
        <TouchableOpacity key={f.id} style={s.availableFormula} onPress={() => addFormula(f)}>
          <View style={s.formulaAddIcon}><Text style={s.addIconText}>+</Text></View>
          <View style={s.formulaInfo}>
            <Text style={s.availableFormulaName}>{f.name}</Text>
            <Text style={s.availableFormulaText}>{f.formula}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderVisualTab = () => (
    <View style={s.tabContent}>
      <Text style={s.fieldLabel}>Visualization Type</Text>
      <View style={s.visualGrid}>
        {template.visualTypes.map((vt) => {
          const visual = visualizationTypes[vt];
          return (
            <TouchableOpacity key={vt} style={[s.visualCard, simulation.visualType === vt && s.visualCardActive]} onPress={() => updateField('visualType', vt)}>
              <Text style={s.visualIcon}>{visual?.icon || '📊'}</Text>
              <Text style={[s.visualName, simulation.visualType === vt && s.visualNameActive]}>{visual?.name || vt}</Text>
              <Text style={s.visualDesc}>{visual?.description || ''}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[s.fieldLabel, { marginTop: 20 }]}>Custom Formula (optional)</Text>
      <TextInput style={[s.textInput, s.textArea]} value={simulation.customFormula} onChangeText={(v) => updateField('customFormula', v)} placeholder="Enter a custom formula for the visualization" multiline numberOfLines={3} />
    </View>
  );

  const renderInstructionsTab = () => (
    <View style={s.tabContent}>
      <Text style={s.fieldLabel}>Step-by-Step Instructions</Text>
      {(simulation.instructions || []).map((inst, index) => (
        <View key={index} style={s.instructionCard}>
          <View style={s.instructionNumber}><Text style={s.instructionNumText}>{index + 1}</Text></View>
          <TextInput style={s.instructionInput} value={inst} onChangeText={(text) => updateInstruction(index, text)} placeholder={`Step ${index + 1} instruction...`} multiline />
          <TouchableOpacity onPress={() => removeInstruction(index)}>
            <Text style={s.removeBtn}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={s.addButton} onPress={addInstruction}>
        <Text style={s.addButtonText}>+ Add Instruction</Text>
      </TouchableOpacity>

      <Text style={[s.fieldLabel, { marginTop: 24 }]}>Learning Objectives</Text>
      <TextInput style={[s.textInput, s.textArea]} value={(simulation.learningObjectives || []).join('\n')} onChangeText={(v) => updateField('learningObjectives', v.split('\n').filter(l => l.trim()))} placeholder="Enter learning objectives (one per line)" multiline numberOfLines={4} />
    </View>
  );

  return (
    <View style={s.container}>
      <View style={[s.header, { backgroundColor: simulation.subject === 'chemistry' ? '#9b59b6' : simulation.subject === 'biology' ? '#2ecc71' : '#3498db' }]}>
        <TouchableOpacity style={s.backButton} onPress={handleBack}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={s.headerInfo}>
          <Text style={s.headerTitle}>{isNew ? 'New Simulation' : 'Edit Simulation'}</Text>
          <Text style={s.headerSubject}>{simulation.subject?.charAt(0).toUpperCase() + simulation.subject?.slice(1)}</Text>
        </View>
        <TouchableOpacity style={s.saveButton} onPress={handleSave}>
          <Text style={s.saveIcon}>💾</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab.id} style={[s.tab, activeTab === tab.id && s.tabActive]} onPress={() => setActiveTab(tab.id)}>
            <Text style={s.tabIcon}>{tab.icon}</Text>
            <Text style={[s.tabText, activeTab === tab.id && s.tabTextActive]}>{tab.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'basic' && renderBasicTab()}
        {activeTab === 'variables' && renderVariablesTab()}
        {activeTab === 'formulas' && renderFormulasTab()}
        {activeTab === 'visual' && renderVisualTab()}
        {activeTab === 'instructions' && renderInstructionsTab()}
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={s.bottomBar}>
        <TouchableOpacity style={s.previewButton} onPress={() => { if (simulation.id) navigation.navigate('Preview', { simulationId: simulation.id }); else Alert.alert('Save First', 'Please save the simulation before previewing'); }}>
          <Text style={s.previewIcon}>▶</Text>
          <Text style={s.previewText}>Preview</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.exportButton} onPress={() => { if (simulation.id) navigation.navigate('Export', { simulationId: simulation.id }); else Alert.alert('Save First', 'Please save the simulation before exporting'); }}>
          <Text style={s.exportIcon}>📤</Text>
          <Text style={s.exportText}>Export</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  loadingText: { textAlign: 'center', marginTop: 100, color: '#7f8c8d' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 12 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  backIcon: { fontSize: 24, color: '#fff' },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSubject: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  saveButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  saveIcon: { fontSize: 20 },
  tabBar: { backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 8, maxHeight: 60, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginHorizontal: 4, backgroundColor: '#f5f5f5' },
  tabActive: { backgroundColor: '#e3f2fd' },
  tabIcon: { fontSize: 14, marginRight: 6 },
  tabText: { fontSize: 13, color: '#7f8c8d' },
  tabTextActive: { color: '#3498db', fontWeight: '600' },
  content: { flex: 1 },
  tabContent: { padding: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#2c3e50', marginBottom: 8, marginTop: 16 },
  textInput: { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 15, color: '#2c3e50', borderWidth: 1, borderColor: '#e0e0e0' },
  textArea: { height: 100, textAlignVertical: 'top' },
  chipScroll: { maxHeight: 44 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#e0e0e0' },
  chipActive: { backgroundColor: '#3498db', borderColor: '#3498db' },
  chipText: { fontSize: 13, color: '#2c3e50' },
  chipTextActive: { color: '#fff' },
  durationRow: { flexDirection: 'row', flexWrap: 'wrap' },
  durationChip: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#e0e0e0' },
  durationChipActive: { backgroundColor: '#3498db', borderColor: '#3498db' },
  durationText: { fontSize: 14, color: '#2c3e50' },
  durationTextActive: { color: '#fff' },
  emptyText: { color: '#7f8c8d', fontStyle: 'italic', marginBottom: 16 },
  variableCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 1 },
  variableHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  variableName: { fontSize: 15, fontWeight: '600', color: '#2c3e50' },
  removeBtn: { fontSize: 18, color: '#e74c3c', padding: 4 },
  variableControls: { flexDirection: 'row', justifyContent: 'space-between' },
  variableField: { flex: 1, marginHorizontal: 4 },
  miniLabel: { fontSize: 10, color: '#7f8c8d', marginBottom: 4 },
  miniInput: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 8, fontSize: 13, textAlign: 'center' },
  availableGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  availableChip: { backgroundColor: '#e8f5e9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginRight: 8, marginBottom: 8 },
  availableText: { fontSize: 13, color: '#27ae60' },
  formulaCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 1 },
  formulaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  formulaName: { fontSize: 15, fontWeight: '600', color: '#2c3e50' },
  formulaText: { fontSize: 16, fontFamily: 'monospace', color: '#3498db', marginVertical: 8 },
  formulaVars: { fontSize: 11, color: '#7f8c8d' },
  availableFormula: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, elevation: 1 },
  formulaAddIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e8f5e9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  addIconText: { fontSize: 18, color: '#27ae60' },
  formulaInfo: { flex: 1 },
  availableFormulaName: { fontSize: 14, fontWeight: '500', color: '#2c3e50' },
  availableFormulaText: { fontSize: 12, color: '#7f8c8d', fontFamily: 'monospace' },
  visualGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  visualCard: { width: (SCREEN_WIDTH - 44) / 3, backgroundColor: '#fff', borderRadius: 12, padding: 12, margin: 6, alignItems: 'center', borderWidth: 2, borderColor: 'transparent', elevation: 1 },
  visualCardActive: { borderColor: '#3498db', backgroundColor: '#e3f2fd' },
  visualIcon: { fontSize: 28, marginBottom: 8 },
  visualName: { fontSize: 12, fontWeight: '500', color: '#2c3e50', textAlign: 'center' },
  visualNameActive: { color: '#3498db' },
  visualDesc: { fontSize: 9, color: '#7f8c8d', textAlign: 'center', marginTop: 4 },
  instructionCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, elevation: 1 },
  instructionNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#3498db', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  instructionNumText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  instructionInput: { flex: 1, fontSize: 14, color: '#2c3e50', padding: 0 },
  addButton: { backgroundColor: '#e8f5e9', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  addButtonText: { fontSize: 14, color: '#27ae60', fontWeight: '600' },
  bottomBar: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#eee' },
  previewButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3498db', padding: 14, borderRadius: 12, marginRight: 8 },
  previewIcon: { fontSize: 16, color: '#fff', marginRight: 8 },
  previewText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  exportButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#27ae60', padding: 14, borderRadius: 12, marginLeft: 8 },
  exportIcon: { fontSize: 16, marginRight: 8 },
  exportText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

export default SimulationEditorScreen;
