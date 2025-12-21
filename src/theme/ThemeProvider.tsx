import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import { darkTokens, lightTokens, type Tokens } from './tokens';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  tokens: Tokens;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'themeMode';

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const systemScheme = Appearance.getColorScheme() ?? 'dark';

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setModeState(saved);
        }
      } catch {}
    })();
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
  }, []);

  const effectiveScheme = useMemo(() => {
    if (mode === 'system') {
      return systemScheme === 'light' ? 'light' : 'dark';
    }
    return mode;
  }, [mode, systemScheme]);

  const palette: Tokens = useMemo(() => {
    return effectiveScheme === 'dark' ? darkTokens : lightTokens;
  }, [effectiveScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ tokens: palette, mode, setMode }),
    [palette, mode, setMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useThemeTokens(): Tokens {
  const ctx = useContext(ThemeContext);
  // Default to dark tokens (Modern Sports Tech primary)
  return ctx ? ctx.tokens : darkTokens;
}

export function useThemeMode(): { mode: ThemeMode; setMode: (m: ThemeMode) => void } {
  const ctx = useContext(ThemeContext);
  return { mode: ctx?.mode ?? 'system', setMode: ctx?.setMode ?? (() => {}) };
}
