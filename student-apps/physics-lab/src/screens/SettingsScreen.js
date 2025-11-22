import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import { useApp } from '../context/AppContext';

const SettingsScreen = ({ navigation }) => {
  const {
    user,
    settings,
    updateSettings,
    getStatistics,
    achievements,
    exportData,
    registerUser,
  } = useApp();

  const stats = getStatistics();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');

  const handleToggle = async (key) => {
    await updateSettings({ [key]: !settings[key] });
  };

  const handleSelectValue = async (key, value) => {
    await updateSettings({ [key]: value });
  };

  const handleExport = async () => {
    const filePath = await exportData();
    if (filePath) {
      Alert.alert('Exported', `Data exported to:\n${filePath}`);
    } else {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleSaveName = async () => {
    if (newName.trim()) {
      await registerUser(newName.trim(), user?.classGrade || '');
      setEditingName(false);
    }
  };

  const getBadgeInfo = (badge) => {
    const badges = {
      first_experiment: { icon: '🎯', name: 'First Experiment', desc: 'Complete your first experiment' },
      lab_explorer: { icon: '🔬', name: 'Lab Explorer', desc: 'Complete 10 experiments' },
      lab_scientist: { icon: '👨‍🔬', name: 'Lab Scientist', desc: 'Complete 25 experiments' },
      perfectionist: { icon: '💯', name: 'Perfectionist', desc: 'Get 5 perfect scores' },
      category_master: { icon: '🏅', name: 'Category Master', desc: 'Explore 3 categories' },
      physics_guru: { icon: '🧙‍♂️', name: 'Physics Guru', desc: 'Master all 6 categories' },
    };
    return badges[badge] || { icon: '🏆', name: badge, desc: '' };
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
          </View>
          <View style={styles.profileInfo}>
            {editingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  style={styles.nameInput}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Enter name"
                  autoFocus
                />
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveName}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.profileName}>{user?.name || 'Student'}</Text>
                <TouchableOpacity onPress={() => setEditingName(true)}>
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Statistics Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.uniqueCompleted}</Text>
            <Text style={styles.statLabel}>Experiments</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.totalAttempts}</Text>
            <Text style={styles.statLabel}>Attempts</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.avgScore}%</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.perfectScores}</Text>
            <Text style={styles.statLabel}>Perfect</Text>
          </View>
        </View>
      </View>

      {/* Achievements Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementsGrid}>
          {['first_experiment', 'lab_explorer', 'lab_scientist', 'perfectionist', 'category_master', 'physics_guru'].map((badge) => {
            const info = getBadgeInfo(badge);
            const earned = achievements.badges?.includes(badge);

            return (
              <View
                key={badge}
                style={[styles.achievementCard, !earned && styles.achievementCardLocked]}
              >
                <Text style={[styles.achievementIcon, !earned && styles.achievementIconLocked]}>
                  {info.icon}
                </Text>
                <Text style={[styles.achievementName, !earned && styles.achievementNameLocked]}>
                  {info.name}
                </Text>
                <Text style={styles.achievementDesc}>{info.desc}</Text>
                {earned && <View style={styles.earnedBadge}><Text style={styles.earnedText}>✓</Text></View>}
              </View>
            );
          })}
        </View>
      </View>

      {/* Display Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Display</Text>
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Text style={styles.settingDescription}>Use dark theme</Text>
          </View>
          <Switch
            value={settings.darkMode || false}
            onValueChange={() => handleToggle('darkMode')}
            trackColor={{ false: '#e0e0e0', true: '#81b0ff' }}
            thumbColor={settings.darkMode ? '#3498db' : '#f4f3f4'}
          />
        </View>
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>Show Formulas</Text>
            <Text style={styles.settingDescription}>Display formulas in experiments</Text>
          </View>
          <Switch
            value={settings.showFormulas !== false}
            onValueChange={() => handleToggle('showFormulas')}
            trackColor={{ false: '#e0e0e0', true: '#81b0ff' }}
            thumbColor={settings.showFormulas !== false ? '#3498db' : '#f4f3f4'}
          />
        </View>
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>Show Hints</Text>
            <Text style={styles.settingDescription}>Display helpful hints</Text>
          </View>
          <Switch
            value={settings.showHints !== false}
            onValueChange={() => handleToggle('showHints')}
            trackColor={{ false: '#e0e0e0', true: '#81b0ff' }}
            thumbColor={settings.showHints !== false ? '#3498db' : '#f4f3f4'}
          />
        </View>
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>Sound Effects</Text>
            <Text style={styles.settingDescription}>Play sounds during simulations</Text>
          </View>
          <Switch
            value={settings.soundEffects !== false}
            onValueChange={() => handleToggle('soundEffects')}
            trackColor={{ false: '#e0e0e0', true: '#81b0ff' }}
            thumbColor={settings.soundEffects !== false ? '#3498db' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Simulation Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Simulation</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Animation Speed</Text>
          <View style={styles.speedOptions}>
            {[0.5, 1, 2].map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[
                  styles.speedOption,
                  (settings.animationSpeed || 1) === speed && styles.speedOptionActive,
                ]}
                onPress={() => handleSelectValue('animationSpeed', speed)}
              >
                <Text
                  style={[
                    styles.speedOptionText,
                    (settings.animationSpeed || 1) === speed && styles.speedOptionTextActive,
                  ]}
                >
                  {speed}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Measurement Units</Text>
          <View style={styles.speedOptions}>
            {['SI', 'CGS'].map((unit) => (
              <TouchableOpacity
                key={unit}
                style={[
                  styles.speedOption,
                  (settings.measurementUnits || 'SI') === unit && styles.speedOptionActive,
                ]}
                onPress={() => handleSelectValue('measurementUnits', unit)}
              >
                <Text
                  style={[
                    styles.speedOptionText,
                    (settings.measurementUnits || 'SI') === unit && styles.speedOptionTextActive,
                  ]}
                >
                  {unit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Data Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <TouchableOpacity style={styles.actionButton} onPress={handleExport}>
          <Text style={styles.actionButtonIcon}>📤</Text>
          <Text style={styles.actionButtonText}>Export Lab Data</Text>
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutCard}>
          <Text style={styles.appName}>Physics Virtual Laboratory</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appDescription}>
            Interactive physics experiments and simulations for students.
            Covers mechanics, waves, electricity, optics, thermodynamics, and modern physics.
          </Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#3498db',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  backIcon: {
    fontSize: 24,
    color: '#fff',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  editText: {
    fontSize: 14,
    color: '#3498db',
    marginTop: 4,
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#f5f7fa',
    borderRadius: 12,
    padding: 16,
    margin: '1%',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3498db',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  achievementCard: {
    width: '48%',
    backgroundColor: '#f5f7fa',
    borderRadius: 12,
    padding: 12,
    margin: '1%',
    alignItems: 'center',
    position: 'relative',
  },
  achievementCardLocked: {
    opacity: 0.5,
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  achievementIconLocked: {
    opacity: 0.4,
  },
  achievementName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
  achievementNameLocked: {
    color: '#7f8c8d',
  },
  achievementDesc: {
    fontSize: 10,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 4,
  },
  earnedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#27ae60',
    justifyContent: 'center',
    alignItems: 'center',
  },
  earnedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 15,
    color: '#2c3e50',
  },
  settingDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  speedOptions: {
    flexDirection: 'row',
  },
  speedOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginLeft: 8,
  },
  speedOptionActive: {
    backgroundColor: '#3498db',
  },
  speedOptionText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  speedOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f7fa',
    borderRadius: 12,
    padding: 16,
  },
  actionButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3498db',
  },
  aboutCard: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  appVersion: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  appDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
});

export default SettingsScreen;
