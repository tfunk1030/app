/**
 * AICaddyPro Design Tokens
 * Single source of truth for all design values.
 *
 * This file exports themed token sets (darkTokens, lightTokens) for use with ThemeProvider.
 * Components should use the `useTokens()` hook to access the current theme's tokens.
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Shadow configuration type for React Native
 */
export interface ShadowConfig {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

/**
 * Spring animation configuration for react-native-reanimated
 */
export interface SpringConfig {
  damping: number;
  stiffness: number;
  mass: number;
}

/**
 * Complete themed token set used by components
 */
export interface Tokens {
  colors: {
    // Backgrounds
    background: string;
    surface: string;
    surfaceAlt: string;
    surfaceGlass: string;

    // Text
    textPrimary: string;
    textMuted: string;

    // Brand colors
    brand: string;
    brandAlt: string;

    // Borders and shadows
    border: string;
    shadow: string;

    // Semantic colors
    danger: string;
    success: string;
    warning: string;
    info: string;

    // Glow effects
    glowPrimary: string;
    glowSecondary: string;
    dangerGlow: string;
    successGlow: string;
    warningGlow: string;
    infoGlow: string;

    // Fixed contrast colors (for text on colored backgrounds)
    onBrand: string;
    onDanger: string;
    onSuccess: string;

    // Overlay colors
    overlay: string;
    overlayLight: string;

    // Ripple effect for touch feedback
    ripple: string;

    // Offline/error state backgrounds
    offlineBackground: string;
    offlineBorder: string;
    offlineText: string;

    // Semantic background variants (alpha)
    dangerBackgroundAlpha: string;
    successBackgroundAlpha: string;
    warningBackgroundAlpha: string;
    infoBackgroundAlpha: string;
    brandBackgroundAlpha: string;

    // Icon gradient colors (for light mode icon backgrounds)
    iconGradientStart: string;
    iconGradientEnd: string;
  };

  gradients: {
    primary: readonly string[];
    surface: readonly string[];
    iconBackground: readonly string[];
    dangerGradient: readonly string[];
    successGradient: readonly string[];
  };

  shadow: {
    subtle: ShadowConfig;
    card: ShadowConfig;
    glow: ShadowConfig;
    glowSecondary: ShadowConfig;
    dangerGlow: ShadowConfig;
    successGlow: ShadowConfig;
    warningGlow: ShadowConfig;
    infoGlow: ShadowConfig;
  };

  animation: {
    fast: number;
    normal: number;
    slow: number;
    spring: SpringConfig;
  };

  // Base tokens (shared across themes)
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  touchTarget: typeof touchTarget;
  letterSpacing: typeof letterSpacing;
  containerSize: typeof containerSize;
  borderWidth: typeof borderWidth;
  opacity: typeof opacity;
}

// =============================================================================
// BASE TOKEN VALUES (shared across themes)
// =============================================================================

export const spacing = {
  xs: 4,
  sm: 8,
  base: 12, // Common 12px gap pattern - used in grids, form layouts, etc.
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96, // Large containers (premium icon, etc.)
  '5xl': 120, // Scroll bottom padding
} as const;

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20, // Hero icon containers
  '3xl': 24, // Premium/large containers
  full: 9999, // Pills and circular elements
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800', // Used for hero values and emphasis
} as const;

export const touchTarget = {
  minimum: 48,
  recommended: 56,
} as const;

/**
 * Letter spacing values for typography
 * Used for headings, labels, and section headers
 */
export const letterSpacing = {
  tighter: -1, // Hero values, large numbers
  tight: -0.5, // Screen titles
  normal: 0, // Body text
  wide: 0.6, // Section headers, labels
  wider: 1, // Emphasis labels (e.g., "PLAYS LIKE")
} as const;

/**
 * Container size tokens for consistent icon and element sizing
 * Based on common patterns across the app
 */
export const containerSize = {
  icon: {
    xs: 24, // Small icons in lists
    sm: 32, // Settings icons, small buttons
    md: 44, // Minimum touch target icons
    lg: 48, // Recommended touch target icons
    xl: 64, // Hero icons
    '2xl': 96, // Premium/feature icons
  },
  input: {
    sm: 36, // Dense input height
    md: 40, // Default input height
    lg: 48, // Large input height (touch target compliant)
  },
  slider: {
    track: 8, // Default track height
    trackDense: 6, // Dense track height
    thumb: 26, // Default thumb diameter
    thumbDense: 22, // Dense thumb diameter
  },
} as const;

/**
 * Border width values for consistent borders
 */
export const borderWidth = {
  none: 0,
  hairline: 0.5, // StyleSheet.hairlineWidth equivalent
  thin: 1, // Default borders
  medium: 1.5, // Neon button borders
  thick: 2, // Emphasis borders
} as const;

/**
 * Opacity values for consistent transparency
 */
export const opacity = {
  disabled: 0.5,
  muted: 0.6,
  subtle: 0.8,
  full: 1,
} as const;

// Base animation values (shared across themes)
const baseAnimation = {
  fast: 150,
  normal: 250,
  slow: 350,
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
} as const;

// =============================================================================
// DARK THEME TOKENS
// Modern Sports Tech aesthetic with glassmorphism and neon accents
// =============================================================================

export const darkTokens: Tokens = {
  colors: {
    // Backgrounds - Deep slate for modern dark theme
    background: '#0F172A',
    surface: '#1E293B',
    surfaceAlt: '#334155',
    surfaceGlass: 'rgba(15, 23, 42, 0.6)',

    // Text - High contrast for readability
    textPrimary: '#F8FAFC',
    textMuted: '#94A3B8',

    // Brand colors - Emerald (primary) and Cyan (accent)
    brand: '#10B981',
    brandAlt: '#06B6D4',

    // Borders and shadows
    border: 'rgba(148, 163, 184, 0.2)',
    shadow: '#000000',

    // Semantic colors
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',

    // Glow effects for neon aesthetic
    glowPrimary: '#10B981',
    glowSecondary: '#06B6D4',
    dangerGlow: '#EF4444',
    successGlow: '#10B981',
    warningGlow: '#F59E0B',
    infoGlow: '#3B82F6',

    // Fixed contrast colors (for text on colored backgrounds)
    // These remain white in dark mode for proper contrast on brand buttons
    onBrand: '#FFFFFF',
    onDanger: '#FFFFFF',
    onSuccess: '#FFFFFF',

    // Overlay colors for modals and backdrop
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',

    // Ripple effect for touch feedback (Android)
    ripple: 'rgba(255, 255, 255, 0.12)',

    // Offline/error state backgrounds (e.g., ConnectivityBanner)
    offlineBackground: 'rgba(239, 68, 68, 0.15)',
    offlineBorder: 'rgba(239, 68, 68, 0.3)',
    offlineText: '#F87171',

    // Semantic background variants (alpha) for subtle tinted backgrounds
    dangerBackgroundAlpha: 'rgba(239, 68, 68, 0.15)',
    successBackgroundAlpha: 'rgba(16, 185, 129, 0.15)',
    warningBackgroundAlpha: 'rgba(245, 158, 11, 0.15)',
    infoBackgroundAlpha: 'rgba(59, 130, 246, 0.15)',
    brandBackgroundAlpha: 'rgba(16, 185, 129, 0.15)',

    // Icon gradient colors (for icon backgrounds in MetricTile, etc.)
    iconGradientStart: 'rgba(16, 185, 129, 0.2)',
    iconGradientEnd: 'rgba(6, 182, 212, 0.2)',
  },

  gradients: {
    // Primary gradient for borders and accents (emerald to cyan)
    primary: ['#10B981', '#06B6D4'] as const,
    // Surface gradient for subtle backgrounds
    surface: ['rgba(30, 41, 59, 0.8)', 'rgba(15, 23, 42, 0.9)'] as const,
    // Icon background gradient
    iconBackground: ['rgba(30, 41, 59, 0.8)', 'rgba(15, 23, 42, 0.9)'] as const,
    // Danger gradient for error states
    dangerGradient: ['#EF4444', '#DC2626'] as const,
    // Success gradient for positive states
    successGradient: ['#10B981', '#059669'] as const,
  },

  shadow: {
    subtle: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    glow: {
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 12,
      elevation: 8,
    },
    glowSecondary: {
      shadowColor: '#06B6D4',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 6,
    },
    dangerGlow: {
      shadowColor: '#EF4444',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 6,
    },
    successGlow: {
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 6,
    },
    warningGlow: {
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 6,
    },
    infoGlow: {
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 6,
    },
  },

  animation: baseAnimation,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  touchTarget,
  letterSpacing,
  containerSize,
  borderWidth,
  opacity,
};

// =============================================================================
// LIGHT THEME TOKENS
// Clean, professional light theme maintaining Sports Tech aesthetic
// =============================================================================

export const lightTokens: Tokens = {
  colors: {
    // Backgrounds - Clean whites and light grays
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',
    surfaceGlass: 'rgba(255, 255, 255, 0.8)',

    // Text - Dark for contrast
    textPrimary: '#0F172A',
    textMuted: '#64748B',

    // Brand colors - Same as dark for consistency
    brand: '#10B981',
    brandAlt: '#06B6D4',

    // Borders and shadows
    border: 'rgba(15, 23, 42, 0.1)',
    shadow: '#64748B',

    // Semantic colors - Slightly darker for light backgrounds
    danger: '#DC2626',
    success: '#16A34A',
    warning: '#D97706',
    info: '#2563EB',

    // Glow effects - Softer for light mode
    glowPrimary: '#10B981',
    glowSecondary: '#06B6D4',
    dangerGlow: '#DC2626',
    successGlow: '#16A34A',
    warningGlow: '#D97706',
    infoGlow: '#2563EB',

    // Fixed contrast colors (for text on colored backgrounds)
    // White text on brand buttons for proper contrast
    onBrand: '#FFFFFF',
    onDanger: '#FFFFFF',
    onSuccess: '#FFFFFF',

    // Overlay colors for modals and backdrop
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',

    // Ripple effect for touch feedback (Android) - darker for light mode
    ripple: 'rgba(0, 0, 0, 0.08)',

    // Offline/error state backgrounds (lighter variants for light mode)
    offlineBackground: '#FEE2E2',
    offlineBorder: '#FCA5A5',
    offlineText: '#7F1D1D',

    // Semantic background variants (alpha) for subtle tinted backgrounds
    dangerBackgroundAlpha: 'rgba(220, 38, 38, 0.1)',
    successBackgroundAlpha: 'rgba(22, 163, 74, 0.1)',
    warningBackgroundAlpha: 'rgba(217, 119, 6, 0.1)',
    infoBackgroundAlpha: 'rgba(37, 99, 235, 0.1)',
    brandBackgroundAlpha: 'rgba(16, 185, 129, 0.1)',

    // Icon gradient colors (for icon backgrounds in MetricTile, etc.)
    iconGradientStart: 'rgba(16, 185, 129, 0.1)',
    iconGradientEnd: 'rgba(6, 182, 212, 0.1)',
  },

  gradients: {
    // Primary gradient for borders and accents
    primary: ['#10B981', '#06B6D4'] as const,
    // Surface gradient for subtle backgrounds
    surface: ['rgba(241, 245, 249, 0.9)', 'rgba(255, 255, 255, 0.95)'] as const,
    // Icon background gradient (lighter for light mode)
    iconBackground: ['rgba(16, 185, 129, 0.1)', 'rgba(6, 182, 212, 0.1)'] as const,
    // Danger gradient for error states
    dangerGradient: ['#DC2626', '#B91C1C'] as const,
    // Success gradient for positive states
    successGradient: ['#16A34A', '#15803D'] as const,
  },

  shadow: {
    subtle: {
      shadowColor: '#64748B',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 1,
    },
    card: {
      shadowColor: '#64748B',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 3,
    },
    glow: {
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
    },
    glowSecondary: {
      shadowColor: '#06B6D4',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    dangerGlow: {
      shadowColor: '#DC2626',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    successGlow: {
      shadowColor: '#16A34A',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    warningGlow: {
      shadowColor: '#D97706',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    infoGlow: {
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
  },

  animation: baseAnimation,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  touchTarget,
  letterSpacing,
  containerSize,
  borderWidth,
  opacity,
};

// =============================================================================
// LEGACY EXPORTS (for backward compatibility)
// =============================================================================

/**
 * @deprecated Use darkTokens.colors or lightTokens.colors instead
 */
export const colors = {
  // Primary - Course Green
  primary: '#2E8B57',
  primaryLight: '#3CB371',
  primaryDark: '#228B22',

  // Accent - Sand/Gold
  accent: '#F4D03F',
  accentAlt: '#DAA520',

  // Surfaces - Light Mode
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Surfaces - Dark Mode
  backgroundDark: '#0F172A',
  surfaceDark: '#1E293B',
  surfaceElevatedDark: '#334155',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textDark: '#F8FAFC',
  textSecondaryDark: '#CBD5E1',

  // Semantic - Scoring
  birdie: '#16A34A',
  par: '#3B82F6',
  bogey: '#F59E0B',
  doublePlus: '#DC2626',

  // Semantic - UI
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',
  info: '#3B82F6',

  // Borders
  border: '#E5E7EB',
  borderDark: '#374151',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
} as const;

/**
 * @deprecated Use darkTokens.shadow or lightTokens.shadow instead
 */
export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;

/**
 * @deprecated Use darkTokens.animation or lightTokens.animation instead
 */
export const animation = baseAnimation;

export type ColorKey = keyof typeof colors;
export type SpacingKey = keyof typeof spacing;

/**
 * Default tokens export for static usage (defaults to dark theme).
 * For dynamic theme support, use the useTokens() hook instead.
 */
export const tokens = darkTokens;
