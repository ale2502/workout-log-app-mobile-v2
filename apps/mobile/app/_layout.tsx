import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { ThemeProvider, useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const isDemoLayout =
    Platform.OS === 'web' && process.env.EXPO_PUBLIC_DEMO_LAYOUT === 'true';
  const navigationTheme =
    colorScheme === 'dark'
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: Colors.dark.background,
            card: Colors.dark.surface,
            text: Colors.dark.text,
            border: Colors.dark.border,
            primary: Colors.dark.tint,
            notification: Colors.dark.tint,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            background: Colors.light.background,
            card: Colors.light.surface,
            text: Colors.light.text,
            border: Colors.light.border,
            primary: Colors.light.tint,
            notification: Colors.light.tint,
          },
        };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <View style={[styles.appContainer, isDemoLayout && styles.demoContainer]}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: 'modal', title: 'Modal' }}
          />
        </Stack>
        <StatusBar style="auto" />
      </View>
    </NavigationThemeProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
  demoContainer: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
});
