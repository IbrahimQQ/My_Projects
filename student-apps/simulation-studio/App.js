import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './src/context/AppContext';

import HomeScreen from './src/screens/HomeScreen';
import SimulationListScreen from './src/screens/SimulationListScreen';
import SimulationEditorScreen from './src/screens/SimulationEditorScreen';
import PreviewScreen from './src/screens/PreviewScreen';
import ExportScreen from './src/screens/ExportScreen';
import TemplatesScreen from './src/screens/TemplatesScreen';
import HelpScreen from './src/screens/HelpScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="SimulationList" component={SimulationListScreen} />
          <Stack.Screen name="SimulationEditor" component={SimulationEditorScreen} />
          <Stack.Screen name="Preview" component={PreviewScreen} />
          <Stack.Screen name="Export" component={ExportScreen} />
          <Stack.Screen name="Templates" component={TemplatesScreen} />
          <Stack.Screen name="Help" component={HelpScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}
