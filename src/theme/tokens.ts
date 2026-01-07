/**
 * AICaddyPro Design Tokens
 * Single source of truth for all design values.
 *
 * This file exports:
 * - Base constants (colors, spacing, etc.) for reference
 * - darkTokens / lightTokens - Complete themed token sets
 * - Tokens type - TypeScript interface for token structure
 */

import { gradients, boldColors, type GradientColors } from './gradients';

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
    // Brand colors
    brand: string;
    brandAlt: string;
    brandDark: string;

    // Backgrounds
    background: string;
    surface: string;
    surfaceAlt: string;
    surfaceElevated: string;
    surfaceGlass: string;

    // Text
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;

    // Borders and shadows
    border: string;
    borderFocus: string;
    shadow: string;

    // Semantic colors
    danger: string;
    success: string;
    warning: string;
    info: string;

    // Glow effects
    glowPrimary: string;
    glowSecondary: string;
    glowTertiary: string;
    dangerGlow: string;

    // Vibrant accent colors (Bold & Colorful)
    vibrantPrimary: string;
    vibrantSecondary: string;
    vibrantTertiary: string;
    vibrantAccent: string;

    // Scoring colors
    birdie: string;
    par: string;
    bogey: string;
    doublePlus: string;

    // On-semantic text colors
    onDanger: string;
    onBrand: string;

    // Offline/connectivity state
    offlineBackground: string;
    offlineBorder: string;
    offlineText: string;

    // Interaction feedback
    ripple: string;

    // Alpha backgrounds
    brandBackgroundAlpha: string;
    dangerBackgroundAlpha: string;
    successBackgroundAlpha: string;
    successGlow: string;
  };

  gradients: {
    primary: GradientColors;
    secondary: GradientColors;
    tertiary: GradientColors;
    accent: GradientColors;
    surface: GradientColors;
    hero: GradientColors;
    button: GradientColors;
    overlay: GradientColors;
  };

  shadow: {
    subtle: ShadowConfig;
    card: ShadowConfig;
    elevated: ShadowConfig;
    glow: ShadowConfig;
    glowSecondary: ShadowConfig;
    dangerGlow: ShadowConfig;
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
// BASE COLOR PALETTE
// Raw color values for reference and light mode defaults
// =============================================================================

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

  // Semantic aliases (for backwards compatibility)
  brand: '#2E8B57', // alias for primary
  surfaceAlt: '#F1F5F9',
  textMuted: '#9CA3AF', // alias for textTertiary
  danger: '#DC2626', // alias for error
  shadow: 'rgba(0, 0, 0, 0.1)',
} as const;

// =============================================================================
// SPACING SCALE
// =============================================================================

export const spacing = {
  xs: 4,
  sm: 8,
  base: 12,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
  '5xl': 120,
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

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
  extrabold: '800',
} as const;

/**
 * Letter spacing values for typography
 * Used for headings, labels, and section headers
 */
export const letterSpacing = {
  tighter: -1,
  tight: -0.5,
  normal: 0,
  wide: 0.6,
  wider: 1,
} as const;

/**
 * Container size tokens for consistent icon and element sizing
 * Based on common patterns across the app
 */
export const containerSize = {
  icon: {
    xs: 24,
    sm: 32,
    md: 44,
    lg: 48,
    xl: 64,
    '2xl': 96,
  },
  input: {
    sm: 36,
    md: 40,
    lg: 48,
  },
  slider: {
    track: 8,
    trackDense: 6,
    thumb: 26,
    thumbDense: 22,
  },
} as const;

/**
 * Border width values for consistent borders
 */
export const borderWidth = {
  none: 0,
  hairline: 0.5,
  thin: 1,
  medium: 1.5,
  thick: 2,
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

// =============================================================================
// TOUCH TARGETS
// =============================================================================

export const touchTarget = {
  minimum: 48,
  recommended: 56,
} as const;

// =============================================================================
// SHADOW PRESETS
// =============================================================================

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

// =============================================================================
// ANIMATION PRESETS
// =============================================================================

export const animation = {
  fast: 150,
  normal: 250,
  slow: 350,
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
} as const;

// Base animation values (shared across themes)
const baseAnimation = animation;

// =============================================================================
// DARK MODE TOKENS
// Bold & Colorful theme - Primary dark mode experience
// =============================================================================

export const darkTokens: Tokens = {
  colors: {
    // Brand - Bold Emerald/Cyan
    brand: boldColors.emerald,
    brandAlt: boldColors.cyan,
    brandDark: boldColors.emeraldDark,

    // Surfaces - Deep slate backgrounds
    background: boldColors.slate900,
    surface: boldColors.slate800,
    surfaceAlt: boldColors.slate700,
    surfaceElevated: boldColors.slate700,
    surfaceGlass: 'rgba(30, 41, 59, 0.8)',

    // Text - High contrast
    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    textInverse: '#0F172A',

    // Borders and shadows
    border: 'rgba(71, 85, 105, 0.6)',
    borderFocus: boldColors.emerald,
    shadow: 'rgba(0, 0, 0, 0.4)',

    // Semantic colors
    success: boldColors.emerald,
    warning: boldColors.amber,
    danger: '#EF4444',
    info: boldColors.sky,

    // Glow effects for neon aesthetic
    glowPrimary: boldColors.glowEmerald,
    glowSecondary: boldColors.glowCyan,
    glowTertiary: boldColors.glowViolet,
    dangerGlow: 'rgba(239, 68, 68, 0.5)',

    // Vibrant accent colors (Bold & Colorful)
    vibrantPrimary: boldColors.emerald,
    vibrantSecondary: boldColors.cyan,
    vibrantTertiary: boldColors.violet,
    vibrantAccent: boldColors.amber,

    // Scoring colors
    birdie: '#22C55E',
    par: '#60A5FA',
    bogey: '#FBBF24',
    doublePlus: '#F87171',

    // On-semantic text colors
    onDanger: '#FFFFFF',
    onBrand: '#FFFFFF',

    // Offline/connectivity state
    offlineBackground: 'rgba(239, 68, 68, 0.15)',
    offlineBorder: 'rgba(239, 68, 68, 0.3)',
    offlineText: '#F87171',

    // Interaction feedback
    ripple: 'rgba(255, 255, 255, 0.12)',

    // Alpha backgrounds
    brandBackgroundAlpha: 'rgba(16, 185, 129, 0.15)',
    dangerBackgroundAlpha: 'rgba(239, 68, 68, 0.15)',
    successBackgroundAlpha: 'rgba(34, 197, 94, 0.15)',
    successGlow: 'rgba(34, 197, 94, 0.5)',
  },

  gradients: {
    primary: gradients.primary,
    secondary: gradients.secondary,
    tertiary: [boldColors.violet, boldColors.fuchsia] as GradientColors,
    accent: gradients.accent,
    surface: gradients.surface.dark,
    hero: gradients.hero.primary,
    button: gradients.button.primary,
    overlay: gradients.overlay.bottomSheet,
  },

  shadow: {
    subtle: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 1,
    },
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    elevated: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    glow: {
      shadowColor: boldColors.glowEmerald,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 8,
    },
    glowSecondary: {
      shadowColor: boldColors.glowCyan,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 8,
    },
    dangerGlow: {
      shadowColor: 'rgba(239, 68, 68, 0.5)',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 8,
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
// LIGHT MODE TOKENS
// Bold & Colorful theme - Light mode variant
// =============================================================================

export const lightTokens: Tokens = {
  colors: {
    // Brand - Same bold colors work in light mode
    brand: boldColors.emeraldDark,
    brandAlt: boldColors.teal,
    brandDark: '#047857',

    // Surfaces - Clean whites
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',
    surfaceElevated: '#FFFFFF',
    surfaceGlass: 'rgba(255, 255, 255, 0.9)',

    // Text - Dark on light
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    textInverse: '#F8FAFC',

    // Borders and shadows
    border: '#E2E8F0',
    borderFocus: boldColors.emeraldDark,
    shadow: 'rgba(0, 0, 0, 0.1)',

    // Semantic - Slightly darker for contrast
    success: boldColors.emeraldDark,
    warning: '#D97706',
    danger: '#DC2626',
    info: '#2563EB',

    // Glow effects (subtle in light mode)
    glowPrimary: 'rgba(5, 150, 105, 0.3)',
    glowSecondary: 'rgba(13, 148, 136, 0.3)',
    glowTertiary: 'rgba(139, 92, 246, 0.3)',
    dangerGlow: 'rgba(220, 38, 38, 0.3)',

// Vibrant accent colors (Bold & Colorful)
    vibrantPrimary: boldColors.emeraldDark,
    vibrantSecondary: boldColors.teal,
    vibrantTertiary: boldColors.violet,
    vibrantAccent: boldColors.orange,

    // Scoring colors
    birdie: '#16A34A',
    par: '#3B82F6',
    bogey: '#D97706',
    doublePlus: '#DC2626',

    // On-semantic text colors
    onDanger: '#FFFFFF',
    onBrand: '#FFFFFF',

    // Offline/connectivity state
    offlineBackground: 'rgba(220, 38, 38, 0.1)',
    offlineBorder: 'rgba(220, 38, 38, 0.2)',
    offlineText: '#DC2626',

    // Interaction feedback
    ripple: 'rgba(0, 0, 0, 0.08)',

    // Alpha backgrounds
    brandBackgroundAlpha: 'rgba(5, 150, 105, 0.1)',
    dangerBackgroundAlpha: 'rgba(220, 38, 38, 0.1)',
    successBackgroundAlpha: 'rgba(22, 163, 74, 0.1)',
    successGlow: 'rgba(22, 163, 74, 0.3)',
  },

  gradients: {
    primary: gradients.primary,
    secondary: gradients.secondary,
    tertiary: [boldColors.violet, boldColors.purple] as GradientColors,
    accent: gradients.accent,
    surface: gradients.surface.light,
    hero: [boldColors.emeraldDark, boldColors.emerald, boldColors.teal] as GradientColors,
    button: gradients.button.primary,
    overlay: ['rgba(255, 255, 255, 0.95)', 'rgba(248, 250, 252, 0.98)'] as GradientColors,
  },

  shadow: {
    subtle: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    elevated: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
    },
    glow: {
      shadowColor: 'rgba(5, 150, 105, 0.4)',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
    },
    glowSecondary: {
      shadowColor: 'rgba(13, 148, 136, 0.4)',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
    },
    dangerGlow: {
      shadowColor: 'rgba(220, 38, 38, 0.3)',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
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
// TYPE EXPORTS
// =============================================================================

export type ColorKey = keyof typeof colors;
export type SpacingKey = keyof typeof spacing;
export type FontSizeKey = keyof typeof fontSize;
export type BorderRadiusKey = keyof typeof borderRadius;

// =============================================================================
// CONVENIENCE EXPORT
// =============================================================================

/**
 * Unified tokens export for easy importing.
 * Usage: import { tokens } from '@/src/theme/tokens';
 */
export const tokens = {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadow,
};