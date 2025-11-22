import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert } from 'react-native';
import { useApp } from '../context/AppContext';

const SettingsScreen = ({ navigation }) => {
  const { settings, updateSettings, userProfile, updateUserProfile, exportData, resetProgress } = useApp();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userProfile?.name || '');

  const handleResetProgress = () => {
    Alert.alert('Reset Progress', 'Are you sure you want to reset all your progress? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => { resetProgress(); Alert.alert('Progress Reset', 'All progress has been reset.'); } },
    ]);
  };

  const handleExportData = async () => {
    const path = await exportData();
    if (path) { Alert.alert('Export Successful', `Data exported to:\n${path}`); }
    else { Alert.alert('Export Failed', 'Could not export data. Please try again.'); }
  };

  const saveName = () => {
    updateUserProfile({ name: nameInput });
    setEditingName(false);
  };

  const SettingRow = ({ label, description, children }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}><Text style={styles.settingLabel}>{label}</Text>{description && <Text style={styles.settingDescription}>{description}</Text>}</View>
      {children}
    </View>
  );

  const SettingToggle = ({ label, description, value, onValueChange }) => (
    <SettingRow label={label} description={description}>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: '#e0e0e0', true: '#a5d6a7' }} thumbColor={value ? '#2ecc71' : '#f4f3f4'} />
    </SettingRow>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backIcon}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.card}>
            <SettingRow label="Your Name" description="Displayed on your profile">
              {editingName ? (
                <View style={styles.nameEditContainer}>
                  <TextInput style={styles.nameInput} value={nameInput} onChangeText={setNameInput} placeholder="Enter name" autoFocus />
                  <TouchableOpacity style={styles.saveButton} onPress={saveName}><Text style={styles.saveButtonText}>Save</Text></TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setEditingName(true)}><Text style={styles.nameValue}>{userProfile?.name || 'Set Name'}</Text></TouchableOpacity>
              )}
            </SettingRow>
            <SettingRow label="Grade Level">
              <View style={styles.gradeButtons}>
                {['Middle School', 'High School', 'College'].map((grade) => (
                  <TouchableOpacity key={grade} style={[styles.gradeButton, userProfile?.grade === grade && styles.gradeButtonActive]} onPress={() => updateUserProfile({ grade })}>
                    <Text style={[styles.gradeButtonText, userProfile?.grade === grade && styles.gradeButtonTextActive]}>{grade}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </SettingRow>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display</Text>
          <View style={styles.card}>
            <SettingToggle label="Dark Mode" description="Use dark theme" value={settings.darkMode} onValueChange={(v) => updateSettings({ darkMode: v })} />
            <SettingToggle label="Show Formulas" description="Display formulas in experiments" value={settings.showFormulas} onValueChange={(v) => updateSettings({ showFormulas: v })} />
            <SettingToggle label="Show Hints" description="Show helpful tips during experiments" value={settings.showHints} onValueChange={(v) => updateSettings({ showHints: v })} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Simulation</Text>
          <View style={styles.card}>
            <SettingRow label="Animation Speed">
              <View style={styles.speedButtons}>
                {[{ label: '0.5x', value: 0.5 }, { label: '1x', value: 1 }, { label: '2x', value: 2 }].map((speed) => (
                  <TouchableOpacity key={speed.value} style={[styles.speedButton, settings.animationSpeed === speed.value && styles.speedButtonActive]} onPress={() => updateSettings({ animationSpeed: speed.value })}>
                    <Text style={[styles.speedButtonText, settings.animationSpeed === speed.value && styles.speedButtonTextActive]}>{speed.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </SettingRow>
            <SettingToggle label="Auto-save Notes" description="Automatically save experiment notes" value={settings.autoSaveNotes !== false} onValueChange={(v) => updateSettings({ autoSaveNotes: v })} />
            <SettingToggle label="Sound Effects" description="Play sounds during simulations" value={settings.soundEffects !== false} onValueChange={(v) => updateSettings({ soundEffects: v })} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.actionRow} onPress={handleExportData}>
              <View style={styles.actionIcon}><Text>📤</Text></View>
              <View style={styles.actionInfo}><Text style={styles.actionLabel}>Export Lab Data</Text><Text style={styles.actionDescription}>Save your results and notes</Text></View>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionRow} onPress={handleResetProgress}>
              <View style={[styles.actionIcon, { backgroundColor: '#ffebee' }]}><Text>🗑️</Text></View>
              <View style={styles.actionInfo}><Text style={[styles.actionLabel, { color: '#e74c3c' }]}>Reset All Progress</Text><Text style={styles.actionDescription}>Clear all experiment data</Text></View>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <SettingRow label="Version"><Text style={styles.versionText}>1.0.0</Text></SettingRow>
            <SettingRow label="Biology Virtual Lab"><Text style={styles.infoText}>Educational Tool</Text></SettingRow>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 16, backgroundColor: '#2ecc71', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
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
  nameEditContainer: { flexDirection: 'row', alignItems: 'center' },
  nameInput: { borderWidth: 1, borderColor: '#2ecc71', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, fontSize: 14, minWidth: 120, marginRight: 8 },
  saveButton: { backgroundColor: '#2ecc71', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveButtonText: { color: '#fff', fontWeight: '600' },
  nameValue: { fontSize: 14, color: '#2ecc71', fontWeight: '500' },
  gradeButtons: { flexDirection: 'column', alignItems: 'flex-end' },
  gradeButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f0f0f0', marginBottom: 4 },
  gradeButtonActive: { backgroundColor: '#e8f5e9' },
  gradeButtonText: { fontSize: 12, color: '#7f8c8d' },
  gradeButtonTextActive: { color: '#2ecc71', fontWeight: '600' },
  speedButtons: { flexDirection: 'row' },
  speedButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f0f0f0', marginLeft: 8 },
  speedButtonActive: { backgroundColor: '#2ecc71' },
  speedButtonText: { fontSize: 14, color: '#7f8c8d', fontWeight: '500' },
  speedButtonTextActive: { color: '#fff' },
  actionRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  actionIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#e8f5e9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  actionInfo: { flex: 1 },
  actionLabel: { fontSize: 16, color: '#2c3e50', fontWeight: '500' },
  actionDescription: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  actionArrow: { fontSize: 18, color: '#7f8c8d' },
  versionText: { fontSize: 14, color: '#7f8c8d' },
  infoText: { fontSize: 14, color: '#7f8c8d' },
});

export default SettingsScreen;
