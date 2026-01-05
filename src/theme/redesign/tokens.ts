/**
 * AICaddyPro Redesign - Design Tokens
 *
 * Hybrid Design System combining:
 * - "The Caddy" - Minimalist, conversational, on-course optimized
 * - "Pro Analytics" - Data-dense when needed, bento grid
 * - "Augusta" - Luxury typography, editorial feel
 *
 * Core Principles:
 * 1. Outdoor readability (high contrast, no subtle gradients)
 * 2. Glove-friendly (56dp minimum touch targets)
 * 3. One-glance answers (clear visual hierarchy)
 * 4. Progressive disclosure (simple default, data available)
 */

// =============================================================================
// COLOR PALETTE
// =============================================================================

/**
 * Brand Colors - Masters-inspired with modern tech accent
 */
export const brandColors = {
  // Primary - Augusta Green
  primary: '#006747',
  primaryLight: '#059669',
  primaryDark: '#064E3B',

  // Accent - Championship Gold
  accent: '#C4A962',
  accentLight: '#D4C088',
  accentDark: '#A08940',

  // Tech accent for data/metrics
  tech: '#06B6D4', // Cyan for data visualization
  techLight: '#22D3EE',
  techDark: '#0891B2',
} as const;

/**
 * Semantic Colors - Scoring & Status
 */
export const semanticColors = {
  // Scoring (high contrast for outdoor visibility)
  eagle: '#15803D',     // Dark green - exceptional
  birdie: '#22C55E',    // Bright green - under par
  par: '#3B82F6',       // Blue - on target
  bogey: '#F59E0B',     // Amber - warning
  double: '#EF4444',    // Red - alert

  // Status
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const;

/**
 * Neutral Palette - High contrast for outdoor use
 */
export const neutralColors = {
  // Light mode - Cream/warm whites (easier on eyes outdoors)
  white: '#FFFFFF',
  cream: '#FDFBF7',
  sand: '#F5F1E8',
  stone: '#E7E2D9',

  // Grays
  gray50: '#FAFAF9',
  gray100: '#F5F5F4',
  gray200: '#E7E5E4',
  gray300: '#D6D3D1',
  gray400: '#A8A29E',
  gray500: '#78716C',
  gray600: '#57534E',
  gray700: '#44403C',
  gray800: '#292524',
  gray900: '#1C1917',

  // Dark mode
  ink: '#0A0A0A',
  charcoal: '#171717',
  slate: '#1E1E1E',
} as const;

// =============================================================================
// THEME CONFIGURATIONS
// =============================================================================

export type ThemeMode = 'light' | 'dark' | 'outdoor';

export interface ThemeColors {
  // Backgrounds
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceElevated: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Brand
  brand: string;
  brandMuted: string;
  accent: string;

  // Borders & Dividers
  border: string;
  borderStrong: string;
  divider: string;

  // Interactive
  interactive: string;
  interactiveHover: string;
  interactivePressed: string;

  // Semantic
  success: string;
  warning: string;
  error: string;
  info: string;
}

/**
 * Light Theme - Clean, warm, readable
 */
export const lightTheme: ThemeColors = {
  background: neutralColors.cream,
  backgroundAlt: neutralColors.sand,
  surface: neutralColors.white,
  surfaceElevated: neutralColors.white,

  textPrimary: neutralColors.gray900,
  textSecondary: neutralColors.gray700,
  textMuted: neutralColors.gray500,
  textInverse: neutralColors.white,

  brand: brandColors.primary,
  brandMuted: '#E6F2EE',
  accent: brandColors.accent,

  border: neutralColors.gray200,
  borderStrong: neutralColors.gray300,
  divider: neutralColors.gray100,

  interactive: brandColors.primary,
  interactiveHover: brandColors.primaryDark,
  interactivePressed: brandColors.primaryDark,

  success: semanticColors.success,
  warning: semanticColors.warning,
  error: semanticColors.error,
  info: semanticColors.info,
};

/**
 * Dark Theme - OLED-friendly, data-focused
 */
export const darkTheme: ThemeColors = {
  background: neutralColors.ink,
  backgroundAlt: neutralColors.charcoal,
  surface: neutralColors.slate,
  surfaceElevated: '#262626',

  textPrimary: neutralColors.gray50,
  textSecondary: neutralColors.gray300,
  textMuted: neutralColors.gray500,
  textInverse: neutralColors.gray900,

  brand: brandColors.primaryLight,
  brandMuted: 'rgba(5, 150, 105, 0.15)',
  accent: brandColors.accent,

  border: neutralColors.gray800,
  borderStrong: neutralColors.gray700,
  divider: neutralColors.gray800,

  interactive: brandColors.primaryLight,
  interactiveHover: brandColors.primary,
  interactivePressed: brandColors.primaryDark,

  success: semanticColors.success,
  warning: semanticColors.warning,
  error: semanticColors.error,
  info: semanticColors.info,
};

/**
 * Outdoor Theme - Maximum contrast for sunlight
 */
export const outdoorTheme: ThemeColors = {
  background: neutralColors.white,
  backgroundAlt: neutralColors.gray100,
  surface: neutralColors.white,
  surfaceElevated: neutralColors.white,

  textPrimary: '#000000',
  textSecondary: neutralColors.gray800,
  textMuted: neutralColors.gray600,
  textInverse: neutralColors.white,

  brand: brandColors.primaryDark, // Darker for contrast
  brandMuted: '#D1FAE5',
  accent: brandColors.accentDark,

  border: neutralColors.gray400,
  borderStrong: neutralColors.gray600,
  divider: neutralColors.gray300,

  interactive: brandColors.primaryDark,
  interactiveHover: brandColors.primary,
  interactivePressed: '#053D2B',

  success: '#15803D', // Darker greens for outdoor
  warning: '#D97706',
  error: '#DC2626',
  info: '#2563EB',
};

// =============================================================================
// SPACING
// =============================================================================

export const spacing = {
  /** 4px - Minimal spacing */
  xs: 4,
  /** 8px - Tight spacing */
  sm: 8,
  /** 12px - Compact spacing */
  md: 12,
  /** 16px - Standard spacing */
  base: 16,
  /** 24px - Comfortable spacing */
  lg: 24,
  /** 32px - Section spacing */
  xl: 32,
  /** 48px - Large gaps */
  '2xl': 48,
  /** 64px - Hero spacing */
  '3xl': 64,
  /** 96px - Maximum spacing */
  '4xl': 96,
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

/**
 * Font families - Using system fonts for performance
 * Can be swapped with custom fonts (Playfair, Inter) via expo-font
 */
export const fontFamily = {
  // Display - For headlines (swap with Playfair Display for luxury)
  display: 'System',

  // Body - For readable text (swap with Inter for modern)
  body: 'System',

  // Mono - For metrics and numbers
  mono: 'Menlo',
} as const;

/**
 * Font sizes - Larger for outdoor readability
 */
export const fontSize = {
  /** 12px - Fine print */
  xs: 12,
  /** 14px - Captions */
  sm: 14,
  /** 16px - Small body */
  base: 16,
  /** 18px - Body text (larger than typical) */
  md: 18,
  /** 20px - Large body */
  lg: 20,
  /** 24px - Small headings */
  xl: 24,
  /** 32px - Section headings */
  '2xl': 32,
  /** 40px - Page titles */
  '3xl': 40,
  /** 48px - Hero text */
  '4xl': 48,
  /** 64px - Display */
  '5xl': 64,
} as const;

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const lineHeight = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
};

export const letterSpacing = {
  tighter: -1.5,
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
};

/**
 * Typography presets - Ready to use combinations
 */
export const typography = {
  // Hero - Main result display
  hero: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tighter,
  },

  // Display - Page titles
  display: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },

  // H1 - Section headers
  h1: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.tight,
  },

  // H2 - Subsection headers
  h2: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },

  // H3 - Card headers
  h3: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },

  // Body - Main content (larger for outdoor)
  body: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Body small
  bodySmall: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Caption - Secondary info
  caption: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },

  // Label - Form labels, categories
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.wider,
    textTransform: 'uppercase' as const,
  },

  // Metric - Large numbers
  metric: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
    fontFamily: fontFamily.mono,
  },

  // Metric small
  metricSmall: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
    fontFamily: fontFamily.mono,
  },

  // Button
  button: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.wide,
  },

  // Button small
  buttonSmall: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.wide,
  },
} as const;

// =============================================================================
// BORDERS & RADIUS
// =============================================================================

export const borderRadius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

export const borderWidth = {
  none: 0,
  thin: 1,
  medium: 1.5,
  thick: 2,
  heavy: 3,
} as const;

// =============================================================================
// SHADOWS (Minimal - no glassmorphism for outdoor use)
// =============================================================================

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },

  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },

  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

// =============================================================================
// TOUCH TARGETS (Larger for glove use)
// =============================================================================

export const touchTargets = {
  /** 44px - Absolute minimum (not recommended) */
  minimum: 44,
  /** 56px - Standard interactive elements */
  standard: 56,
  /** 64px - Important actions */
  large: 64,
  /** 72px - Primary CTAs, FABs */
  xlarge: 72,
  /** 88px - Hero actions */
  hero: 88,
} as const;

// =============================================================================
// ANIMATION (Reduced for outdoor use)
// =============================================================================

export const animation = {
  duration: {
    instant: 0,
    fast: 100,
    normal: 200,
    slow: 300,
  },

  easing: {
    default: 'ease-out',
    in: 'ease-in',
    inOut: 'ease-in-out',
    linear: 'linear',
  },

  // No springs - too distracting outdoors
  // No bounces - feels gimmicky for serious tool
} as const;

// =============================================================================
// LAYOUT
// =============================================================================

export const layout = {
  /** Maximum content width */
  maxWidth: 428, // iPhone 14 Pro Max

  /** Screen padding */
  screenPadding: spacing.base,

  /** Card padding */
  cardPadding: spacing.lg,

  /** Section gap */
  sectionGap: spacing.xl,

  /** Safe area bottom (for tab bar) */
  bottomSafe: 100,
} as const;

// =============================================================================
// Z-INDEX
// =============================================================================

export const zIndex = {
  base: 0,
  card: 10,
  header: 100,
  modal: 500,
  toast: 1000,
  tooltip: 1100,
} as const;

// =============================================================================
// COMPONENT-SPECIFIC TOKENS
// =============================================================================

export const components = {
  // Result Card - The main output display
  resultCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    minHeight: 160,
  },

  // Quick Action Button
  quickAction: {
    height: touchTargets.large,
    padding: spacing.base,
    borderRadius: borderRadius.lg,
  },

  // Metric Pill - Compact data display
  metricPill: {
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },

  // Slider
  slider: {
    trackHeight: 8,
    thumbSize: 28,
    activeTrackColor: brandColors.primary,
  },

  // Tab Bar
  tabBar: {
    height: 64,
    iconSize: 24,
    labelSize: fontSize.xs,
  },

  // Input
  input: {
    height: touchTargets.standard,
    padding: spacing.base,
    borderRadius: borderRadius.md,
    borderWidth: borderWidth.medium,
  },
} as const;

// =============================================================================
// EXPORT COMBINED TOKENS
// =============================================================================

export const redesignTokens = {
  colors: {
    brand: brandColors,
    semantic: semanticColors,
    neutral: neutralColors,
  },
  themes: {
    light: lightTheme,
    dark: darkTheme,
    outdoor: outdoorTheme,
  },
  spacing,
  typography,
  fontSize,
  fontWeight,
  fontFamily,
  lineHeight,
  letterSpacing,
  borderRadius,
  borderWidth,
  shadows,
  touchTargets,
  animation,
  layout,
  zIndex,
  components,
} as const;

export type RedesignTokens = typeof redesignTokens;
export default redesignTokens;
