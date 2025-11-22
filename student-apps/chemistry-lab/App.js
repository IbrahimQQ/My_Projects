import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AppProvider, useApp } from './src/context/AppContext';
import HomeScreen from './src/screens/HomeScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import ExperimentListScreen from './src/screens/ExperimentListScreen';
import ExperimentDetailScreen from './src/screens/ExperimentDetailScreen';
import SimulationScreen from './src/screens/SimulationScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createStackNavigator();

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <Text style={styles.loadingIcon}>🧪</Text>
    <Text style={styles.loadingTitle}>Chemistry Virtual Lab</Text>
    <ActivityIndicator size="large" color="#27ae60" style={{ marginTop: 20 }} />
    <Text style={styles.loadingText}>Loading experiments...</Text>
  </View>
);

const AppNavigator = () => {
  const { loading, settings } = useApp();
  if (loading) return <LoadingScreen />;
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: settings.darkMode ? '#1a1a2e' : '#f5f7fa' } }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen name="ExperimentList" component={ExperimentListScreen} />
      <Stack.Screen name="ExperimentDetail" component={ExperimentDetailScreen} />
      <Stack.Screen name="Simulation" component={SimulationScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <StatusBar style="light" />
            <AppNavigator />
          </SafeAreaView>
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#27ae60' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fa' },
  loadingIcon: { fontSize: 64, marginBottom: 16 },
  loadingTitle: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#7f8c8d' },
});
