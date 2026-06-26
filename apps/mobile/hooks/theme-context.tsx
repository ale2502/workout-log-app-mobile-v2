import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

export type ThemeColorScheme = 'light' | 'dark';

type ThemeContextValue = {
  colorScheme: ThemeColorScheme;
  isDarkModeEnabled: boolean;
  setIsDarkModeEnabled: (enabled: boolean) => void;
  isLoaded: boolean;
};

const STORAGE_KEY = 'workout-log-app-theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useRNColorScheme() === 'dark' ? 'dark' : 'light';
  const [storedValue, setStoredValue] = useState<ThemeColorScheme | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadStoredTheme() {
      try {
        const value = await AsyncStorage.getItem(STORAGE_KEY);

        if (!isMounted) {
          return;
        }

        if (value === 'light' || value === 'dark') {
          setStoredValue(value);
        }
      } finally {
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    }

    loadStoredTheme();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (storedValue === null) {
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
      return;
    }

    AsyncStorage.setItem(STORAGE_KEY, storedValue).catch(() => undefined);
  }, [isLoaded, storedValue]);

  const setIsDarkModeEnabled = useCallback((enabled: boolean) => {
    setStoredValue(enabled ? 'dark' : 'light');
  }, []);

  const colorScheme = storedValue ?? systemColorScheme;

  const value = useMemo<ThemeContextValue>(
    () => ({
      colorScheme,
      isDarkModeEnabled: colorScheme === 'dark',
      setIsDarkModeEnabled,
      isLoaded,
    }),
    [colorScheme, isLoaded, setIsDarkModeEnabled],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useThemeContext() {
  const context = useContext(ThemeContext);

  if (context !== undefined) {
    return context;
  }

  const systemColorScheme = useRNColorScheme() === 'dark' ? 'dark' : 'light';

  return {
    colorScheme: systemColorScheme,
    isDarkModeEnabled: systemColorScheme === 'dark',
    setIsDarkModeEnabled: () => undefined,
    isLoaded: false,
  };
}

export function useThemeMode() {
  return useThemeContext();
}

export function useColorScheme() {
  return useThemeContext().colorScheme;
}
