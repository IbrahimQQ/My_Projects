import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useApp } from '../context/AppContext';
import { simulationTemplates, visualizationTypes } from '../data/templates';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TemplatesScreen = ({ navigation }) => {
  const { createSimulation, saveSimulation } = useApp();
  const [activeSubject, setActiveSubject] = useState('physics');

  const subjects = [
    { id: 'physics', name: 'Physics', icon: '⚡', color: '#3498db' },
    { id: 'chemistry', name: 'Chemistry', icon: '⚗️', color: '#9b59b6' },
    { id: 'biology', name: 'Biology', icon: '🧬', color: '#2ecc71' },
  ];

  const prebuiltTemplates = {
    physics: [
      { title: 'Simple Pendulum', category: 'Mechanics', description: 'Explore pendulum motion and period relationships', variables: ['mass', 'distance', 'angle'], formulas: ['pendulum_period'], visualType: 'animation', difficulty: 'beginner', duration: 15 },
      { title: 'Projectile Motion', category: 'Mechanics', description: 'Study trajectory of launched objects', variables: ['velocity', 'angle', 'acceleration'], formulas: ['projectile_range', 'kinetic_energy'], visualType: 'animation', difficulty: 'intermediate', duration: 20 },
      { title: 'Ohm\'s Law Circuit', category: 'Electricity', description: 'Investigate voltage, current and resistance relationships', variables: ['voltage', 'current', 'resistance'], formulas: ['ohms_law', 'power'], visualType: 'circuit', difficulty: 'beginner', duration: 15 },
      { title: 'Wave Interference', category: 'Waves', description: 'Observe constructive and destructive interference', variables: ['frequency', 'wavelength', 'amplitude'], formulas: ['wave_equation'], visualType: 'wave', difficulty: 'intermediate', duration: 20 },
      { title: 'Ideal Gas Behavior', category: 'Thermodynamics', description: 'Explore PVT relationships in gases', variables: ['pressure', 'volume', 'temperature'], formulas: ['ideal_gas'], visualType: 'graph', difficulty: 'intermediate', duration: 25 },
    ],
    chemistry: [
      { title: 'Acid-Base Titration', category: 'General Chemistry', description: 'Perform virtual titration to find concentration', variables: ['concentration', 'volume_ml', 'ph'], formulas: ['molarity', 'ph_calc'], visualType: 'titration', difficulty: 'intermediate', duration: 20 },
      { title: 'Reaction Rate', category: 'Physical Chemistry', description: 'Study factors affecting reaction speed', variables: ['concentration', 'temperature_c', 'rate_constant'], formulas: ['rate_law', 'arrhenius'], visualType: 'graph', difficulty: 'advanced', duration: 25 },
      { title: 'Chemical Equilibrium', category: 'Physical Chemistry', description: 'Explore Le Chatelier\'s principle', variables: ['concentration', 'temperature_c', 'equilibrium_constant'], formulas: ['gibbs_free'], visualType: 'reaction', difficulty: 'advanced', duration: 30 },
      { title: 'Solution Dilution', category: 'General Chemistry', description: 'Calculate dilution requirements', variables: ['concentration', 'volume_ml'], formulas: ['dilution', 'molarity'], visualType: 'beaker', difficulty: 'beginner', duration: 15 },
      { title: 'pH and Buffers', category: 'General Chemistry', description: 'Understand buffer systems', variables: ['ph', 'concentration'], formulas: ['henderson', 'ph_calc'], visualType: 'graph', difficulty: 'intermediate', duration: 20 },
    ],
    biology: [
      { title: 'Enzyme Kinetics', category: 'Biochemistry', description: 'Study Michaelis-Menten kinetics', variables: ['substrate_conc', 'enzyme_conc', 'temperature_bio'], formulas: ['michaelis_menten', 'q10'], visualType: 'graph', difficulty: 'intermediate', duration: 25 },
      { title: 'Population Growth', category: 'Ecology', description: 'Model exponential and logistic growth', variables: ['population', 'growth_rate', 'time_min'], formulas: ['population_growth', 'logistic_growth'], visualType: 'population', difficulty: 'intermediate', duration: 20 },
      { title: 'Hardy-Weinberg Equilibrium', category: 'Genetics', description: 'Calculate allele frequencies', variables: ['allele_freq', 'population'], formulas: ['hardy_weinberg'], visualType: 'graph', difficulty: 'intermediate', duration: 20 },
      { title: 'Photosynthesis Rate', category: 'Biochemistry', description: 'Explore light and CO2 effects', variables: ['light_intensity', 'co2_conc', 'temperature_bio'], formulas: ['q10'], visualType: 'graph', difficulty: 'beginner', duration: 20 },
      { title: 'Species Diversity', category: 'Ecology', description: 'Calculate diversity indices', variables: ['species_count', 'population', 'area'], formulas: ['simpsons_index'], visualType: 'ecosystem', difficulty: 'intermediate', duration: 25 },
    ],
  };

  const handleUseTemplate = async (template, subject) => {
    const sim = createSimulation(subject);
    const fullVariables = template.variables.map(vid => simulationTemplates[subject].variables.find(v => v.id === vid)).filter(Boolean);
    const fullFormulas = template.formulas.map(fid => simulationTemplates[subject].formulas.find(f => f.id === fid)).filter(Boolean);

    const newSim = {
      ...sim,
      title: template.title,
      description: template.description,
      category: template.category,
      difficulty: template.difficulty,
      duration: template.duration,
      variables: fullVariables.map(v => ({ ...v, value: v.default })),
      formulas: fullFormulas,
      visualType: template.visualType,
      instructions: [`Set up the ${template.title} simulation`, 'Adjust variables to observe changes', 'Record your observations', 'Analyze the results'],
      learningObjectives: [`Understand ${template.category} concepts`, `Apply ${template.title} principles`],
    };

    const saved = await saveSimulation(newSim);
    navigation.navigate('SimulationEditor', { simulationId: saved.id });
  };

  const template = simulationTemplates[activeSubject];
  const templates = prebuiltTemplates[activeSubject] || [];
  const activeColor = subjects.find(s => s.id === activeSubject)?.color || '#3498db';

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backButton} onPress={() => navigation.goBack()}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Templates</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.subjectBar}>
        {subjects.map((sub) => (
          <TouchableOpacity key={sub.id} style={[s.subjectTab, activeSubject === sub.id && { backgroundColor: sub.color }]} onPress={() => setActiveSubject(sub.id)}>
            <Text style={s.subjectIcon}>{sub.icon}</Text>
            <Text style={[s.subjectText, activeSubject === sub.id && { color: '#fff' }]}>{sub.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionTitle}>Ready-to-Use Templates</Text>
        {templates.map((tmpl, index) => (
          <TouchableOpacity key={index} style={s.templateCard} onPress={() => handleUseTemplate(tmpl, activeSubject)}>
            <View style={[s.templateIcon, { backgroundColor: activeColor + '20' }]}>
              <Text style={s.templateIconText}>{visualizationTypes[tmpl.visualType]?.icon || '📊'}</Text>
            </View>
            <View style={s.templateInfo}>
              <Text style={s.templateTitle}>{tmpl.title}</Text>
              <Text style={s.templateDescription}>{tmpl.description}</Text>
              <View style={s.templateMeta}>
                <View style={s.metaBadge}><Text style={s.metaText}>{tmpl.category}</Text></View>
                <View style={[s.metaBadge, { backgroundColor: tmpl.difficulty === 'advanced' ? '#ffebee' : tmpl.difficulty === 'intermediate' ? '#fff3e0' : '#e8f5e9' }]}>
                  <Text style={[s.metaText, { color: tmpl.difficulty === 'advanced' ? '#c62828' : tmpl.difficulty === 'intermediate' ? '#ef6c00' : '#2e7d32' }]}>{tmpl.difficulty}</Text>
                </View>
                <View style={s.metaBadge}><Text style={s.metaText}>{tmpl.duration} min</Text></View>
              </View>
            </View>
            <View style={[s.useButton, { backgroundColor: activeColor }]}>
              <Text style={s.useButtonText}>Use</Text>
            </View>
          </TouchableOpacity>
        ))}

        <Text style={[s.sectionTitle, { marginTop: 24 }]}>Available Variables</Text>
        <View style={s.variablesGrid}>
          {template.variables.slice(0, 12).map((v) => (
            <View key={v.id} style={s.variableChip}>
              <Text style={s.variableName}>{v.name}</Text>
              <Text style={s.variableUnit}>{v.unit}</Text>
            </View>
          ))}
          {template.variables.length > 12 && (
            <View style={[s.variableChip, { backgroundColor: '#ecf0f1' }]}>
              <Text style={s.variableName}>+{template.variables.length - 12} more</Text>
            </View>
          )}
        </View>

        <Text style={[s.sectionTitle, { marginTop: 24 }]}>Available Formulas</Text>
        {template.formulas.map((f) => (
          <View key={f.id} style={s.formulaCard}>
            <Text style={s.formulaName}>{f.name}</Text>
            <Text style={s.formulaText}>{f.formula}</Text>
          </View>
        ))}

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
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subjectBar: { paddingHorizontal: 12, paddingVertical: 12, maxHeight: 60 },
  subjectTab: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginHorizontal: 4, elevation: 1 },
  subjectIcon: { fontSize: 16, marginRight: 8 },
  subjectText: { fontSize: 14, fontWeight: '500', color: '#2c3e50' },
  content: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#2c3e50', marginHorizontal: 16, marginTop: 16, marginBottom: 12 },
  templateCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, elevation: 2 },
  templateIcon: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  templateIconText: { fontSize: 24 },
  templateInfo: { flex: 1 },
  templateTitle: { fontSize: 15, fontWeight: '600', color: '#2c3e50', marginBottom: 4 },
  templateDescription: { fontSize: 12, color: '#7f8c8d', marginBottom: 8 },
  templateMeta: { flexDirection: 'row', flexWrap: 'wrap' },
  metaBadge: { backgroundColor: '#f5f5f5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginRight: 6 },
  metaText: { fontSize: 10, color: '#666' },
  useButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  useButtonText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  variablesGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  variableChip: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, margin: 4, elevation: 1 },
  variableName: { fontSize: 12, fontWeight: '500', color: '#2c3e50' },
  variableUnit: { fontSize: 10, color: '#7f8c8d' },
  formulaCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 12, elevation: 1 },
  formulaName: { fontSize: 13, fontWeight: '500', color: '#2c3e50' },
  formulaText: { fontSize: 14, fontFamily: 'monospace', color: '#3498db', marginTop: 4 },
});

export default TemplatesScreen;
