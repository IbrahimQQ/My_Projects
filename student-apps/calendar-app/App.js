import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Context
import { AppProvider, useApp } from './src/context/AppContext';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import CalendarScreen from './src/screens/CalendarScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Settings Screen (inline for simplicity)
const SettingsScreen = () => {
  const { user, settings, updateSettings, goals, streaks, exportReport } = useApp();

  return (
    <ScrollView style={styles.settingsContainer}>
      <View style={styles.settingsHeader}>
        <Text style={styles.settingsTitle}>Settings</Text>
      </View>

      {/* Profile Section */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || '?'}</Text>
          </View>
          <View>
            <Text style={styles.profileName}>{user?.name || 'Student'}</Text>
            <Text style={styles.profileClass}>{user?.classGrade || 'Not set'}</Text>
          </View>
        </View>
      </View>

      {/* Study Settings */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Study Settings</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>School Closing Time</Text>
          <Text style={styles.settingValue}>{settings.schoolClosingTime || '15:00'}</Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Study Duration</Text>
          <Text style={styles.settingValue}>{settings.studyDuration || 60} min</Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Break Duration</Text>
          <Text style={styles.settingValue}>{settings.breakDuration || 15} min</Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Weekend Study</Text>
          <Text style={styles.settingValue}>{settings.weekendStudy ? 'Enabled' : 'Disabled'}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{streaks.currentStreak || 0}</Text>
            <Text style={styles.statName}>Current Streak</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{streaks.longestStreak || 0}</Text>
            <Text style={styles.statName}>Best Streak</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{streaks.studyDates?.length || 0}</Text>
            <Text style={styles.statName}>Total Days</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{(goals.weekly?.currentHours || 0).toFixed(1)}h</Text>
            <Text style={styles.statName}>This Week</Text>
          </View>
        </View>
      </View>

      {/* Goals */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Goals</Text>
        <View style={styles.goalItem}>
          <Text style={styles.goalLabel}>Weekly Target</Text>
          <Text style={styles.goalValue}>{goals.weekly?.targetHours || 10} hours</Text>
        </View>
        <View style={styles.goalItem}>
          <Text style={styles.goalLabel}>Monthly Target</Text>
          <Text style={styles.goalValue}>{goals.monthly?.targetHours || 40} hours</Text>
        </View>
      </View>

      {/* About */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>Student Calendar App</Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
        <Text style={styles.descText}>
          Smart study scheduling integrated with Reader and Test apps.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

// Main Tab Navigator
const MainTabs = () => {
  const { settings } = useApp();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: settings.darkMode ? '#1e1e1e' : '#fff',
          borderTopColor: settings.darkMode ? '#333' : '#e0e0e0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarActiveTintColor: '#4a90d9',
        tabBarInactiveTintColor: settings.darkMode ? '#888' : '#999',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: settings.darkMode ? '#1e1e1e' : '#fff',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: settings.darkMode ? '#fff' : '#2c3e50',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size, color }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size, color }}>📅</Text>,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size, color }}>⚙️</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

// Main Stack Navigator
const AppNavigator = () => {
  const { loading } = useApp();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90d9" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
    </Stack.Navigator>
  );
};

// App Component
export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <StatusBar style="auto" />
            <AppNavigator />
          </SafeAreaView>
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  settingsContainer: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  settingsHeader: {
    backgroundColor: '#4a90d9',
    padding: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  settingsSection: {
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
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4a90d9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  profileClass: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 14,
    color: '#2c3e50',
  },
  settingValue: {
    fontSize: 14,
    color: '#7f8c8d',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a90d9',
  },
  statName: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  goalLabel: {
    fontSize: 14,
    color: '#2c3e50',
  },
  goalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a90d9',
  },
  aboutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  versionText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  descText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 8,
    lineHeight: 20,
  },
});
