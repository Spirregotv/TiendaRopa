import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/config/theme';

// Tema de react-native-paper con colores de FashionFlow
const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    secondary: COLORS.accent,
    background: COLORS.background,
    surface: COLORS.surface,
    error: COLORS.error,
  },
};

export default function App() {
  return (
    <PaperProvider theme={paperTheme}>
      <AuthProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </AuthProvider>
    </PaperProvider>
  );
}
