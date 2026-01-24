/**
 * Redesign Theme Provider
 *
 * Provides theme context for the redesigned app with support for:
 * - Dark mode (default, OLED optimized)
 * - Light mode
 * - Outdoor mode (maximum contrast for sunlight)
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ThemeMode,
  ThemeColors,
  lightTheme,
  darkTheme,
  outdoorTheme,
  redesignTokens,
} from './tokens';

// =============================================================================
// TYPES
// =============================================================================

interface ThemeContextValue {
  /** Current theme mode */
  mode: ThemeMode;

  /** Set theme mode */
  setMode: (mode: ThemeMode) => void;

  /** Toggle between light and dark */
  toggleMode: () => void;

  /** Current theme colors */
  colors: ThemeColors;

  /** Is dark mode active */
  isDark: boolean;

  /** Is outdoor mode active */
  isOutdoor: boolean;

  /** Full token access */
  tokens: typeof redesignTokens;
}

// =============================================================================
// CONTEXT
// =============================================================================

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = '@aicaddy_redesign_theme';

// =============================================================================
// PROVIDER
// =============================================================================

interface RedesignThemeProviderProps {
  children: React.ReactNode;
  initialMode?: ThemeMode;
}

export function RedesignThemeProvider({
  children,
  initialMode,
}: RedesignThemeProviderProps): React.ReactElement {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(initialMode ?? 'dark');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    async function loadTheme() {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved && ['light', 'dark', 'outdoor'].includes(saved)) {
          setModeState(saved as ThemeMode);
        }
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
      } finally {
        setIsLoaded(true);
      }
    }
    loadTheme();
  }, []);

  // Save theme preference
  const setMode = useCallback(async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }, []);

  // Toggle between light and dark
  const toggleMode = useCallback(() => {
    setMode(mode === 'light' ? 'dark' : 'light');
  }, [mode, setMode]);

  // Get current theme colors
  const colors = useMemo((): ThemeColors => {
    switch (mode) {
      case 'dark':
        return darkTheme;
      case 'outdoor':
        return outdoorTheme;
      case 'light':
      default:
        return lightTheme;
    }
  }, [mode]);

  const isDark = mode === 'dark';
  const isOutdoor = mode === 'outdoor';

  const value = useMemo(
    (): ThemeContextValue => ({
      mode,
      setMode,
      toggleMode,
      colors,
      isDark,
      isOutdoor,
      tokens: redesignTokens,
    }),
    [mode, setMode, toggleMode, colors, isDark, isOutdoor]
  );

  // Don't render until theme is loaded to prevent flash
  if (!isLoaded) {
    return <>{null}</>;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Access theme context
 */
export function useRedesignTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useRedesignTheme must be used within RedesignThemeProvider');
  }
  return context;
}

/**
 * Access just the colors
 */
export function useRedesignColors(): ThemeColors {
  const { colors } = useRedesignTheme();
  return colors;
}

/**
 * Access just the tokens
 */
export function useRedesignTokens(): typeof redesignTokens {
  const { tokens } = useRedesignTheme();
  return tokens;
}

/**
 * Check if dark mode
 */
export function useIsDark(): boolean {
  const { isDark } = useRedesignTheme();
  return isDark;
}

// =============================================================================
// EXPORTS
// =============================================================================

export { ThemeMode, ThemeColors };
export default RedesignThemeProvider;
