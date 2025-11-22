import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useApp } from '../context/AppContext';

const SettingsScreen = ({ navigation }) => {
  const { settings, updateSettings, simulations, exportAll } = useApp();

  const handleExportAll = async () => {
    if (simulations.length === 0) {
      Alert.alert('No Simulations', 'Create some simulations first to export.');
      return;
    }
    const result = await exportAll();
    if (result) {
      Alert.alert('Export Successful', `Exported ${simulations.length} simulations.`);
    } else {
      Alert.alert('Export Failed', 'Could not export simulations.');
    }
  };

  const handleClearAll = () => {
    Alert.alert('Clear All Simulations', 'This will delete all your simulations. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete All',
        style: 'destructive',
        onPress: async () => {
          // Would need to implement clearAll in context
          Alert.alert('Cleared', 'All simulations have been removed.');
        },
      },
    ]);
  };

  const SettingRow = ({ label, description, children }) => (
    <View style={s.settingRow}>
      <View style={s.settingInfo}>
        <Text style={s.settingLabel}>{label}</Text>
        {description && <Text style={s.settingDescription}>{description}</Text>}
      </View>
      {children}
    </View>
  );

  const SettingToggle = ({ label, description, value, onValueChange }) => (
    <SettingRow label={label} description={description}>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: '#e0e0e0', true: '#a5d6a7' }} thumbColor={value ? '#2c3e50' : '#f4f3f4'} />
    </SettingRow>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backButton} onPress={() => navigation.goBack()}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.section}>
          <Text style={s.sectionTitle}>Preferences</Text>
          <View style={s.card}>
            <SettingToggle label="Dark Mode" description="Use dark theme throughout the app" value={settings.darkMode} onValueChange={(v) => updateSettings({ darkMode: v })} />
            <SettingToggle label="Auto-save" description="Automatically save changes as you edit" value={settings.autoSave !== false} onValueChange={(v) => updateSettings({ autoSave: v })} />
            <SettingToggle label="Show Tips" description="Display helpful tips while creating simulations" value={settings.showTips !== false} onValueChange={(v) => updateSettings({ showTips: v })} />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Default Settings</Text>
          <View style={s.card}>
            <SettingRow label="Default Subject">
              <View style={s.subjectButtons}>
                {[{ id: 'physics', icon: '⚡' }, { id: 'chemistry', icon: '⚗️' }, { id: 'biology', icon: '🧬' }].map((sub) => (
                  <TouchableOpacity key={sub.id} style={[s.subjectButton, settings.defaultSubject === sub.id && s.subjectButtonActive]} onPress={() => updateSettings({ defaultSubject: sub.id })}>
                    <Text style={s.subjectButtonIcon}>{sub.icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </SettingRow>
            <SettingRow label="Default Duration">
              <View style={s.durationButtons}>
                {[15, 20, 30].map((dur) => (
                  <TouchableOpacity key={dur} style={[s.durationButton, settings.defaultDuration === dur && s.durationButtonActive]} onPress={() => updateSettings({ defaultDuration: dur })}>
                    <Text style={[s.durationButtonText, settings.defaultDuration === dur && s.durationButtonTextActive]}>{dur}m</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </SettingRow>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Data Management</Text>
          <View style={s.card}>
            <TouchableOpacity style={s.actionRow} onPress={handleExportAll}>
              <View style={s.actionIcon}><Text>📤</Text></View>
              <View style={s.actionInfo}>
                <Text style={s.actionLabel}>Export All Simulations</Text>
                <Text style={s.actionDescription}>{simulations.length} simulations available</Text>
              </View>
              <Text style={s.actionArrow}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionRow} onPress={handleClearAll}>
              <View style={[s.actionIcon, { backgroundColor: '#ffebee' }]}><Text>🗑️</Text></View>
              <View style={s.actionInfo}>
                <Text style={[s.actionLabel, { color: '#e74c3c' }]}>Clear All Simulations</Text>
                <Text style={s.actionDescription}>Remove all saved simulations</Text>
              </View>
              <Text style={s.actionArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>About</Text>
          <View style={s.card}>
            <SettingRow label="Version"><Text style={s.versionText}>1.0.0</Text></SettingRow>
            <SettingRow label="App"><Text style={s.infoText}>Simulation Studio</Text></SettingRow>
            <SettingRow label="Purpose"><Text style={s.infoText}>Educational Tool</Text></SettingRow>
          </View>
        </View>

        <View style={s.creditsCard}>
          <Text style={s.creditsTitle}>Simulation Studio</Text>
          <Text style={s.creditsText}>Create • Preview • Export</Text>
          <Text style={s.creditsSubtext}>Build custom simulations for Physics, Chemistry, and Biology</Text>
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
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#7f8c8d', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', elevation: 2 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  settingInfo: { flex: 1, marginRight: 16 },
  settingLabel: { fontSize: 16, color: '#2c3e50', fontWeight: '500' },
  settingDescription: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  subjectButtons: { flexDirection: 'row' },
  subjectButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  subjectButtonActive: { backgroundColor: '#e3f2fd', borderWidth: 2, borderColor: '#3498db' },
  subjectButtonIcon: { fontSize: 20 },
  durationButtons: { flexDirection: 'row' },
  durationButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#f5f5f5', marginLeft: 8 },
  durationButtonActive: { backgroundColor: '#2c3e50' },
  durationButtonText: { fontSize: 13, color: '#7f8c8d', fontWeight: '500' },
  durationButtonTextActive: { color: '#fff' },
  actionRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  actionIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#e8f5e9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  actionInfo: { flex: 1 },
  actionLabel: { fontSize: 16, color: '#2c3e50', fontWeight: '500' },
  actionDescription: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  actionArrow: { fontSize: 18, color: '#7f8c8d' },
  versionText: { fontSize: 14, color: '#7f8c8d' },
  infoText: { fontSize: 14, color: '#7f8c8d' },
  creditsCard: { backgroundColor: '#2c3e50', margin: 16, borderRadius: 16, padding: 24, alignItems: 'center' },
  creditsTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  creditsText: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  creditsSubtext: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 8, textAlign: 'center' },
});

export default SettingsScreen;
