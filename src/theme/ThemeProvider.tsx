import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { tokens as brandLightTokens, type Tokens } from './tokens';

// Dark palette aligned to requested premium dark mode
const brandDarkTokens: Tokens = {
  colors: {
    background: '#0B0F17',
    surface: '#121826',
    surfaceAlt: '#1A2233',
    border: '#2C3446',
    textPrimary: '#FFFFFF',
    textMuted: '#B0B9C6',
    brand: '#18C964',
    brandAlt: '#4FB3F6',
    success: '#22C55E',
    danger: '#EF4444',
    shadow: '#000000',
  },
  radius: { sm: 8, md: 12, lg: 16 },
  spacing: (n: number) => n * 4,
  shadow: {
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 8,
    },
    subtle: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
  },
} as const;

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
  const systemScheme: ColorSchemeName = Appearance.getColorScheme();

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

  const effectiveScheme: ColorSchemeName = useMemo(() => {
    return mode === 'system' ? systemScheme : mode;
  }, [mode, systemScheme]);

  const palette: Tokens = useMemo(() => {
    return effectiveScheme === 'dark' ? brandDarkTokens : brandLightTokens;
  }, [effectiveScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ tokens: palette, mode, setMode }),
    [palette, mode, setMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useThemeTokens(): Tokens {
  const ctx = useContext(ThemeContext);
  return ctx ? ctx.tokens : brandLightTokens;
}

export function useThemeMode(): { mode: ThemeMode; setMode: (m: ThemeMode) => void } {
  const ctx = useContext(ThemeContext);
  return { mode: ctx?.mode ?? 'system', setMode: ctx?.setMode ?? (() => {}) };
}
