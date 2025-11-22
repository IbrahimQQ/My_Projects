import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useApp } from '../context/AppContext';

const SettingsScreen = ({ navigation }) => {
  const {
    user,
    settings,
    updateSettings,
    exportData,
    exportForOtherApps,
    clearBrowserHistory,
  } = useApp();

  const [fontSize, setFontSize] = useState(settings.fontSize);
  const [darkMode, setDarkMode] = useState(settings.theme === 'dark');
  const [autoSaveInterval, setAutoSaveInterval] = useState(settings.autoSaveInterval);

  const handleFontSizeChange = (delta) => {
    const newSize = Math.min(Math.max(fontSize + delta, 12), 28);
    setFontSize(newSize);
    updateSettings({ fontSize: newSize });
  };

  const handleDarkModeToggle = (value) => {
    setDarkMode(value);
    updateSettings({ theme: value ? 'dark' : 'light' });
  };

  const handleAutoSaveChange = (interval) => {
    setAutoSaveInterval(interval);
    updateSettings({ autoSaveInterval: interval });
  };

  const handleExportData = async () => {
    try {
      const filePath = await exportData();
      if (filePath) {
        Alert.alert('Success', `Monitoring data exported successfully!\n\nFile: ${filePath}`);
      } else {
        Alert.alert('Error', 'Failed to export data');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while exporting data');
    }
  };

  const handleExportForApps = async () => {
    try {
      const success = await exportForOtherApps();
      if (success) {
        Alert.alert('Success', 'Data exported for other apps (Test App, Calendar App)');
      } else {
        Alert.alert('Error', 'Failed to export data');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while exporting data');
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all browsing history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearBrowserHistory();
            Alert.alert('Success', 'Browsing history cleared');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, darkMode && styles.containerDark]}>
      {/* User Profile Section */}
      <View style={[styles.section, darkMode && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>User Profile</Text>
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, darkMode && styles.textDark]}>
              {user?.name || 'Unknown'}
            </Text>
            <Text style={[styles.profileClass, darkMode && styles.textLightDark]}>
              {user?.classGrade || 'Unknown'}
            </Text>
          </View>
        </View>
      </View>

      {/* Reading Settings */}
      <View style={[styles.section, darkMode && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>Reading Settings</Text>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, darkMode && styles.textDark]}>Font Size</Text>
          <View style={styles.fontSizeControl}>
            <TouchableOpacity
              style={styles.fontSizeButton}
              onPress={() => handleFontSizeChange(-2)}
            >
              <Text style={styles.fontSizeButtonText}>A-</Text>
            </TouchableOpacity>
            <Text style={[styles.fontSizeValue, darkMode && styles.textDark]}>{fontSize}px</Text>
            <TouchableOpacity
              style={styles.fontSizeButton}
              onPress={() => handleFontSizeChange(2)}
            >
              <Text style={styles.fontSizeButtonText}>A+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, darkMode && styles.textDark]}>Dark Mode</Text>
          <Switch
            value={darkMode}
            onValueChange={handleDarkModeToggle}
            trackColor={{ false: '#ddd', true: '#4a90d9' }}
            thumbColor={darkMode ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, darkMode && styles.textDark]}>View Mode</Text>
          <View style={styles.viewModeButtons}>
            {['book', 'single', 'continuous'].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.viewModeButton,
                  settings.viewMode === mode && styles.viewModeButtonActive,
                ]}
                onPress={() => updateSettings({ viewMode: mode })}
              >
                <Text
                  style={[
                    styles.viewModeButtonText,
                    settings.viewMode === mode && styles.viewModeButtonTextActive,
                  ]}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Monitoring Settings */}
      <View style={[styles.section, darkMode && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>Monitoring & Data</Text>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, darkMode && styles.textDark]}>Auto-save Interval</Text>
          <View style={styles.intervalButtons}>
            {[5, 10, 15, 30].map((interval) => (
              <TouchableOpacity
                key={interval}
                style={[
                  styles.intervalButton,
                  autoSaveInterval === interval && styles.intervalButtonActive,
                ]}
                onPress={() => handleAutoSaveChange(interval)}
              >
                <Text
                  style={[
                    styles.intervalButtonText,
                    autoSaveInterval === interval && styles.intervalButtonTextActive,
                  ]}
                >
                  {interval}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={handleExportData}>
          <Text style={styles.actionButtonIcon}>📊</Text>
          <View style={styles.actionButtonContent}>
            <Text style={styles.actionButtonTitle}>Export Monitoring Data</Text>
            <Text style={styles.actionButtonSubtitle}>
              Export as CSV: {user?.name?.replace(/\s+/g, '')}{user?.classGrade?.replace(/\s+/g, '')}.csv
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleExportForApps}>
          <Text style={styles.actionButtonIcon}>🔄</Text>
          <View style={styles.actionButtonContent}>
            <Text style={styles.actionButtonTitle}>Export for Other Apps</Text>
            <Text style={styles.actionButtonSubtitle}>
              Share data with Test App & Calendar App
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Privacy & Data */}
      <View style={[styles.section, darkMode && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>Privacy & Data</Text>

        <TouchableOpacity style={styles.dangerButton} onPress={handleClearHistory}>
          <Text style={styles.dangerButtonText}>Clear Browsing History</Text>
        </TouchableOpacity>

        <Text style={[styles.infoText, darkMode && styles.textLightDark]}>
          Your data is stored locally on this device. Monitoring data is used to track your
          learning progress and can be exported for analysis.
        </Text>
      </View>

      {/* About */}
      <View style={[styles.section, darkMode && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>About</Text>
        <Text style={[styles.aboutText, darkMode && styles.textLightDark]}>
          Student Reader & Browser App
        </Text>
        <Text style={[styles.versionText, darkMode && styles.textLightDark]}>
          Version 1.0.0
        </Text>
        <Text style={[styles.descriptionText, darkMode && styles.textLightDark]}>
          An educational companion app designed to help students read, browse, and track their
          learning progress.
        </Text>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionDark: {
    backgroundColor: '#1e1e1e',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  textDark: {
    color: '#fff',
  },
  textLightDark: {
    color: '#aaa',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4a90d9',
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
    marginBottom: 4,
  },
  profileClass: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#2c3e50',
  },
  fontSizeControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fontSizeButton: {
    backgroundColor: '#f0f4f8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  fontSizeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a90d9',
  },
  fontSizeValue: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
    color: '#2c3e50',
    minWidth: 50,
    textAlign: 'center',
  },
  viewModeButtons: {
    flexDirection: 'row',
  },
  viewModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f4f8',
    marginLeft: 8,
  },
  viewModeButtonActive: {
    backgroundColor: '#4a90d9',
  },
  viewModeButtonText: {
    fontSize: 12,
    color: '#666',
  },
  viewModeButtonTextActive: {
    color: '#fff',
  },
  intervalButtons: {
    flexDirection: 'row',
  },
  intervalButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f4f8',
    marginLeft: 8,
  },
  intervalButtonActive: {
    backgroundColor: '#4a90d9',
  },
  intervalButtonText: {
    fontSize: 12,
    color: '#666',
  },
  intervalButtonTextActive: {
    color: '#fff',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  actionButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  actionButtonContent: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  actionButtonSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  dangerButton: {
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c62828',
  },
  infoText: {
    fontSize: 13,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  aboutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 32,
  },
});

export default SettingsScreen;
