import { createContext, useContext, type PropsWithChildren } from 'react';

export type ThemeColorScheme = 'light' | 'dark';

type ThemeContextValue = {
  colorScheme: ThemeColorScheme;
};

// The app is dark only (Iron redesign), so the scheme is a constant. This file is a
// temporary shim that keeps the old exports compiling; step 13 of the Iron redesign
// plan deletes it along with the other color-scheme plumbing.
const value: ThemeContextValue = { colorScheme: 'dark' };

const ThemeContext = createContext<ThemeContextValue>(value);

export function ThemeProvider({ children }: PropsWithChildren) {
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  return useContext(ThemeContext);
}

export function useColorScheme() {
  return useThemeMode().colorScheme;
}
