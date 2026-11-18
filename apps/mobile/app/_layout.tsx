import {
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
  useFonts,
} from '@expo-google-fonts/barlow-condensed';
import {
  DarkTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { ThemeProvider } from '@/hooks/use-color-scheme';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

// The app is dark only, so the navigation theme is always DarkTheme with Iron colors.
const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.dark.background,
    card: Colors.dark.surface,
    text: Colors.dark.text,
    border: Colors.dark.border,
    primary: Colors.dark.accent,
    notification: Colors.dark.accent,
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
  });
  const fontsReady = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (fontsReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsReady]);

  if (!fontsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <ThemeProvider>
        <RootLayoutContent />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutContent() {
  const isDemoLayout =
    Platform.OS === 'web' && process.env.EXPO_PUBLIC_DEMO_LAYOUT === 'true';

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <View style={[styles.appContainer, isDemoLayout && styles.demoContainer]}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="light" />
      </View>
    </NavigationThemeProvider>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  appContainer: {
    flex: 1,
  },
  demoContainer: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
});
