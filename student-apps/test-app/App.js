import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, ActivityIndicator, Modal, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Context
import { AppProvider, useApp } from './src/context/AppContext';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import TestScreen from './src/screens/TestScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import PracticeScreen from './src/screens/PracticeScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Test Popup Component
const TestPopup = () => {
  const { showTestPopup, setShowTestPopup, startTest, postponeTest, testSchedule } = useApp();

  const handleStartTest = async () => {
    await startTest({ count: 20, mode: 'adaptive' });
    setShowTestPopup(false);
  };

  const handlePostpone = async () => {
    const success = await postponeTest();
    if (!success) {
      // Max postpones reached
    }
  };

  return (
    <Modal visible={showTestPopup} transparent animationType="fade">
      <View style={styles.popupOverlay}>
        <View style={styles.popupContainer}>
          <Text style={styles.popupIcon}>📝</Text>
          <Text style={styles.popupTitle}>Time for a Quiz!</Text>
          <Text style={styles.popupMessage}>
            It's been a while since your last test. Ready to check your knowledge?
          </Text>
          <TouchableOpacity style={styles.popupPrimaryBtn} onPress={handleStartTest}>
            <Text style={styles.popupPrimaryBtnText}>Start Test Now</Text>
          </TouchableOpacity>
          {testSchedule?.postponeCount < 3 && (
            <TouchableOpacity style={styles.popupSecondaryBtn} onPress={handlePostpone}>
              <Text style={styles.popupSecondaryBtnText}>
                Remind me later ({3 - (testSchedule?.postponeCount || 0)} left)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

// Stats Screen Component (inline for simplicity)
const StatsScreen = () => {
  const { testSessions, proficiency, achievements, user } = useApp();

  const totalTests = testSessions.length;
  const totalQuestions = testSessions.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalCorrect = testSessions.reduce((sum, s) => sum + (s.correct || 0), 0);
  const avgScore = totalTests > 0
    ? Math.round(testSessions.reduce((sum, s) => sum + (s.score || 0), 0) / totalTests)
    : 0;

  return (
    <View style={styles.statsContainer}>
      <View style={styles.statsHeader}>
        <Text style={styles.statsTitle}>Statistics</Text>
        <Text style={styles.statsSubtitle}>{user?.name || 'Student'}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalTests}</Text>
          <Text style={styles.statLabel}>Tests Taken</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalQuestions}</Text>
          <Text style={styles.statLabel}>Questions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalCorrect}</Text>
          <Text style={styles.statLabel}>Correct</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{avgScore}%</Text>
          <Text style={styles.statLabel}>Avg Score</Text>
        </View>
      </View>

      <View style={styles.achievementsSection}>
        <Text style={styles.sectionTitle}>Achievements ({achievements.length})</Text>
        {achievements.length === 0 ? (
          <Text style={styles.emptyText}>Complete tests to earn achievements!</Text>
        ) : (
          <View style={styles.achievementsGrid}>
            {achievements.map((a) => (
              <View key={a.id} style={styles.achievementBadge}>
                <Text style={styles.achievementIcon}>🏆</Text>
                <Text style={styles.achievementName}>{a.name || a.id}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.proficiencySection}>
        <Text style={styles.sectionTitle}>Topic Mastery</Text>
        {Object.keys(proficiency).length === 0 ? (
          <Text style={styles.emptyText}>No proficiency data yet</Text>
        ) : (
          Object.entries(proficiency).map(([key, data]) => (
            <View key={key} style={styles.proficiencyItem}>
              <View>
                <Text style={styles.profSubject}>{data.subject}</Text>
                <Text style={styles.profTopic}>{data.topic}</Text>
              </View>
              <Text style={[
                styles.profLevel,
                { color: data.proficiencyLevel >= 70 ? '#27ae60' : data.proficiencyLevel >= 40 ? '#f39c12' : '#e74c3c' }
              ]}>
                {data.proficiencyLevel}%
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

// Main Tab Navigator
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e0e0e0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarActiveTintColor: '#4a90d9',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#fff',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#2c3e50',
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
        name="Practice"
        component={PracticeScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size, color }}>🎯</Text>,
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size, color }}>📊</Text>,
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
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Test" component={TestScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} />
      </Stack.Navigator>
      <TestPopup />
    </>
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
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    margin: 24,
    alignItems: 'center',
  },
  popupIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  popupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  popupMessage: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24,
  },
  popupPrimaryBtn: {
    backgroundColor: '#27ae60',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  popupPrimaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  popupSecondaryBtn: {
    padding: 12,
  },
  popupSecondaryBtnText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  statsContainer: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  statsHeader: {
    backgroundColor: '#4a90d9',
    padding: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  statsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    marginTop: -20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: '1%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  achievementsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  achievementBadge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  achievementIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  achievementName: {
    fontSize: 10,
    color: '#2c3e50',
    textAlign: 'center',
  },
  proficiencySection: {
    padding: 16,
  },
  proficiencyItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profSubject: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  profTopic: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  profLevel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
    padding: 20,
  },
});
