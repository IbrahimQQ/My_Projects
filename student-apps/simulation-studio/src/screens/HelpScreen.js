import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const HelpScreen = ({ navigation }) => {
  const [expandedSection, setExpandedSection] = useState(null);

  const helpSections = [
    {
      id: 'getting_started',
      title: 'Getting Started',
      icon: '🚀',
      content: [
        { q: 'What is Simulation Studio?', a: 'Simulation Studio is a tool for creating custom educational simulations for Physics, Chemistry, and Biology. You can design interactive experiments that can be exported to the corresponding lab apps.' },
        { q: 'How do I create my first simulation?', a: 'From the Home screen, tap on a subject (Physics, Chemistry, or Biology) to start a new simulation. You\'ll be guided through setting up variables, formulas, and visualization.' },
        { q: 'Can I use templates?', a: 'Yes! Go to Templates from the Home screen to find pre-built simulations that you can customize and use as starting points.' },
      ],
    },
    {
      id: 'variables',
      title: 'Working with Variables',
      icon: '🔢',
      content: [
        { q: 'What are variables?', a: 'Variables are the measurable quantities in your simulation, like mass, temperature, or concentration. Users can adjust these to see how they affect the outcome.' },
        { q: 'How do I add variables?', a: 'In the Variables tab of the editor, you\'ll see available variables for your subject. Tap on any variable to add it to your simulation.' },
        { q: 'Can I customize variable ranges?', a: 'Yes! After adding a variable, you can adjust its minimum, maximum, and default values to suit your simulation.' },
      ],
    },
    {
      id: 'formulas',
      title: 'Using Formulas',
      icon: '📐',
      content: [
        { q: 'What are formulas for?', a: 'Formulas define the mathematical relationships between variables. They\'re used to calculate outputs and drive the simulation visualization.' },
        { q: 'How do I add formulas?', a: 'Go to the Formulas tab and select from the available formulas for your subject. Each formula shows which variables it requires.' },
        { q: 'Can I use custom formulas?', a: 'Yes! In the Visual tab, you can enter a custom formula that will be used for the visualization calculations.' },
      ],
    },
    {
      id: 'visualization',
      title: 'Visualization Types',
      icon: '🎨',
      content: [
        { q: 'What visualization types are available?', a: 'Each subject has specific visualization types: Physics has graphs, animations, waves, and circuits. Chemistry has titration, reaction, and molecular views. Biology has cell, organism, and population displays.' },
        { q: 'How do I choose a visualization?', a: 'In the Visual tab, browse the available options and tap on one to select it. The visualization will be used when running the simulation.' },
        { q: 'Can I preview my visualization?', a: 'Yes! Save your simulation and tap Preview to see how it will look and behave with your configured variables and formulas.' },
      ],
    },
    {
      id: 'export',
      title: 'Exporting Simulations',
      icon: '📤',
      content: [
        { q: 'How do I export a simulation?', a: 'Go to the Export screen, select the simulations you want to export, and choose the target lab app. The export will create a JSON file that can be imported.' },
        { q: 'Can I export to any lab app?', a: 'Simulations can only be exported to their matching lab app (Physics simulations to Physics Lab, etc.).' },
        { q: 'What\'s included in the export?', a: 'The export includes all simulation settings: variables, formulas, visualization type, instructions, and learning objectives.' },
      ],
    },
    {
      id: 'tips',
      title: 'Tips & Best Practices',
      icon: '💡',
      content: [
        { q: 'Start simple', a: 'Begin with 2-3 variables and one formula. You can always add more complexity later.' },
        { q: 'Use meaningful names', a: 'Give your simulations descriptive titles that explain what concept they demonstrate.' },
        { q: 'Test your simulations', a: 'Always preview your simulation to make sure the variables produce meaningful outputs.' },
        { q: 'Write clear instructions', a: 'Include step-by-step instructions to guide students through the simulation.' },
        { q: 'Set appropriate difficulty', a: 'Match the difficulty level to your target audience - beginner, intermediate, or advanced.' },
      ],
    },
  ];

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backButton} onPress={() => navigation.goBack()}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Help & Guide</Text>
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.introCard}>
          <Text style={s.introIcon}>📚</Text>
          <Text style={s.introTitle}>Welcome to Simulation Studio</Text>
          <Text style={s.introText}>Create custom educational simulations for Physics, Chemistry, and Biology that can be exported to lab apps.</Text>
        </View>

        {helpSections.map((section) => (
          <View key={section.id} style={s.section}>
            <TouchableOpacity style={s.sectionHeader} onPress={() => setExpandedSection(expandedSection === section.id ? null : section.id)}>
              <View style={s.sectionHeaderLeft}>
                <Text style={s.sectionIcon}>{section.icon}</Text>
                <Text style={s.sectionTitle}>{section.title}</Text>
              </View>
              <Text style={s.expandIcon}>{expandedSection === section.id ? '−' : '+'}</Text>
            </TouchableOpacity>
            {expandedSection === section.id && (
              <View style={s.sectionContent}>
                {section.content.map((item, idx) => (
                  <View key={idx} style={s.helpItem}>
                    <Text style={s.question}>{item.q}</Text>
                    <Text style={s.answer}>{item.a}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        <View style={s.contactCard}>
          <Text style={s.contactTitle}>Need More Help?</Text>
          <Text style={s.contactText}>If you have questions or suggestions, feel free to reach out through the settings menu.</Text>
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
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  content: { flex: 1 },
  introCard: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 24, alignItems: 'center', elevation: 2 },
  introIcon: { fontSize: 48, marginBottom: 12 },
  introTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 8, textAlign: 'center' },
  introText: { fontSize: 14, color: '#7f8c8d', textAlign: 'center', lineHeight: 22 },
  section: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 12, overflow: 'hidden', elevation: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  sectionIcon: { fontSize: 20, marginRight: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#2c3e50' },
  expandIcon: { fontSize: 24, color: '#7f8c8d' },
  sectionContent: { borderTopWidth: 1, borderTopColor: '#f0f0f0', padding: 16 },
  helpItem: { marginBottom: 16 },
  question: { fontSize: 14, fontWeight: '600', color: '#2c3e50', marginBottom: 6 },
  answer: { fontSize: 13, color: '#7f8c8d', lineHeight: 20 },
  contactCard: { backgroundColor: '#e3f2fd', margin: 16, borderRadius: 12, padding: 16 },
  contactTitle: { fontSize: 15, fontWeight: '600', color: '#1976d2', marginBottom: 8 },
  contactText: { fontSize: 13, color: '#1976d2', lineHeight: 20 },
});

export default HelpScreen;
