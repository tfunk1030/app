/**
 * Legacy Theme Context - Re-exports from main ThemeProvider
 *
 * This file maintains backwards compatibility with older code that imports
 * from @/src/core/context/theme. New code should import directly from
 * @/src/theme/ThemeProvider or @/src/theme/useTokens.
 *
 * @deprecated Use imports from @/src/theme/ThemeProvider instead
 */

// Re-export the main theme provider and hooks
export {
  AppThemeProvider as ThemeProvider,
  useThemeMode,
  useThemeTokens,
} from '@/src/theme/ThemeProvider';

// Re-export tokens
export { useTokens } from '@/src/theme/useTokens';

// Legacy useTheme hook that maps to the new API
import { useThemeMode } from '@/src/theme/ThemeProvider';

/**
 * @deprecated Use useThemeMode() from @/src/theme/ThemeProvider instead
 */
export const useTheme = () => {
  const { mode, scheme, setMode } = useThemeMode();

  return {
    theme: scheme,
    toggleTheme: () => {
      const newMode = mode === 'light' ? 'dark' : 'light';
      setMode(newMode);
    },
  };
};
