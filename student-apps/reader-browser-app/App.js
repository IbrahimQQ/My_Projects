import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Context
import { AppProvider, useApp } from './src/context/AppContext';

// Screens
import RegistrationScreen from './src/screens/RegistrationScreen';
import BrowserScreen from './src/screens/BrowserScreen';
import ReaderScreen from './src/screens/ReaderScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import DownloadsScreen from './src/screens/DownloadsScreen';

// Components
import Dictionary from './src/components/Dictionary';
import Calculator from './src/components/Calculator';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Floating Tools Toolbar
const FloatingToolbar = () => {
  const { toggleDictionary, toggleCalculator, dictionaryVisible, calculatorVisible } = useApp();

  return (
    <View style={styles.floatingToolbar}>
      <TouchableOpacity
        style={[styles.toolbarBtn, dictionaryVisible && styles.toolbarBtnActive]}
        onPress={toggleDictionary}
      >
        <Text style={styles.toolbarBtnText}>📖</Text>
        <Text style={styles.toolbarBtnLabel}>Dict</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.toolbarBtn, calculatorVisible && styles.toolbarBtnActive]}
        onPress={toggleCalculator}
      >
        <Text style={styles.toolbarBtnText}>🧮</Text>
        <Text style={styles.toolbarBtnLabel}>Calc</Text>
      </TouchableOpacity>
    </View>
  );
};

// Tab Navigator with floating tools
const MainTabs = () => {
  const { settings, dictionaryVisible, calculatorVisible, toggleDictionary, toggleCalculator } = useApp();
  const darkMode = settings.theme === 'dark';

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: darkMode ? '#1e1e1e' : '#fff',
            borderTopColor: darkMode ? '#333' : '#e0e0e0',
            paddingBottom: 8,
            paddingTop: 8,
            height: 65,
          },
          tabBarActiveTintColor: '#4a90d9',
          tabBarInactiveTintColor: darkMode ? '#888' : '#999',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          headerStyle: {
            backgroundColor: darkMode ? '#1e1e1e' : '#fff',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: darkMode ? '#333' : '#e0e0e0',
          },
          headerTintColor: darkMode ? '#fff' : '#2c3e50',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Tab.Screen
          name="Browser"
          component={BrowserScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size, color }}>🌐</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Reader"
          component={ReaderScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size, color }}>📚</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Downloads"
          component={DownloadsScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size, color }}>📥</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size, color }}>⚙️</Text>
            ),
          }}
        />
      </Tab.Navigator>

      {/* Floating Toolbar */}
      <FloatingToolbar />

      {/* Floating Tools */}
      <Dictionary visible={dictionaryVisible} onClose={toggleDictionary} />
      <Calculator visible={calculatorVisible} onClose={toggleCalculator} />
    </View>
  );
};

// Main App Stack
const AppNavigator = () => {
  const { isRegistered, loading } = useApp();

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
      {!isRegistered ? (
        <Stack.Screen name="Registration" component={RegistrationScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
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
  container: {
    flex: 1,
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
  floatingToolbar: {
    position: 'absolute',
    right: 16,
    bottom: 90,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    flexDirection: 'column',
    alignItems: 'center',
  },
  toolbarBtn: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  toolbarBtnActive: {
    backgroundColor: '#e3f2fd',
  },
  toolbarBtnText: {
    fontSize: 24,
  },
  toolbarBtnLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
});
