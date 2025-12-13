// Bridge hook so existing components use the ThemeProvider's tokens
import { useThemeTokens } from './ThemeProvider';
import type { Tokens } from './tokens';

export function useTokens(): Tokens {
  return useThemeTokens();
}
