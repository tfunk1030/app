/**
 * AICaddyPro Gradient System
 * Bold & Colorful gradient presets inspired by Linear design language.
 *
 * Usage with expo-linear-gradient:
 * <LinearGradient colors={gradients.hero.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
 */

/**
 * Gradient color array type for LinearGradient component
 */
export type GradientColors = readonly [string, string, ...string[]];

/**
 * Gradient preset with colors and optional direction hints
 */
export interface GradientPreset {
  colors: GradientColors;
  /** Suggested start point for LinearGradient */
  start?: { x: number; y: number };
  /** Suggested end point for LinearGradient */
  end?: { x: number; y: number };
}

// =============================================================================
// BOLD & COLORFUL PALETTE
// Vibrant, saturated colors for the new design language
// =============================================================================

export const boldColors = {
  // Primary Greens - Golf Course Inspired (Bold versions)
  emerald: '#10B981',
  emeraldLight: '#34D399',
  emeraldDark: '#059669',
  teal: '#14B8A6',

  // Accent Blues - Sky & Water
  cyan: '#06B6D4',
  cyanLight: '#22D3EE',
  sky: '#0EA5E9',
  blue: '#3B82F6',

  // Warm Accents - Sunset & Sand
  amber: '#F59E0B',
  amberLight: '#FBBF24',
  orange: '#F97316',
  coral: '#FB7185',

  // Cool Purples - Twilight
  violet: '#8B5CF6',
  purple: '#A855F7',
  fuchsia: '#D946EF',

  // Deep Backgrounds
  slate900: '#0F172A',
  slate800: '#1E293B',
  slate700: '#334155',

  // Glow Effects
  glowEmerald: 'rgba(16, 185, 129, 0.6)',
  glowCyan: 'rgba(6, 182, 212, 0.6)',
  glowAmber: 'rgba(245, 158, 11, 0.5)',
  glowViolet: 'rgba(139, 92, 246, 0.5)',
} as const;

// =============================================================================
// GRADIENT PRESETS
// Organized by use case for consistent application across components
// =============================================================================

export const gradients = {
  // ---------------------------------------------------------------------------
  // PRIMARY GRADIENTS
  // Main brand gradients for buttons, highlights, and accents
  // ---------------------------------------------------------------------------

  /** Primary brand gradient - Emerald to Cyan */
  primary: [boldColors.emerald, boldColors.cyan] as GradientColors,

  /** Extended primary with mid-tone */
  primaryExtended: [boldColors.emeraldDark, boldColors.emerald, boldColors.cyan] as GradientColors,

  /** Secondary brand gradient - Cyan to Blue */
  secondary: [boldColors.cyan, boldColors.blue] as GradientColors,

  /** Accent gradient - Warm tones */
  accent: [boldColors.amber, boldColors.orange] as GradientColors,

  // ---------------------------------------------------------------------------
  // HERO GRADIENTS
  // Full-screen and large area backgrounds
  // ---------------------------------------------------------------------------

  hero: {
    /** Main hero gradient for Shot screen */
    primary: [boldColors.slate900, boldColors.slate800, boldColors.emeraldDark] as GradientColors,

    /** Wind screen hero gradient */
    wind: [boldColors.slate900, boldColors.slate800, boldColors.cyan] as GradientColors,

    /** Settings screen hero gradient */
    settings: [boldColors.slate900, boldColors.slate800, boldColors.violet] as GradientColors,

    /** Club library hero gradient */
    clubs: [boldColors.slate900, boldColors.slate800, boldColors.teal] as GradientColors,

    /** Premium/Pro feature gradient */
    premium: [boldColors.slate900, boldColors.violet, boldColors.fuchsia] as GradientColors,

    /** Sunset warm gradient */
    sunset: [boldColors.slate900, boldColors.orange, boldColors.coral] as GradientColors,
  },

  // ---------------------------------------------------------------------------
  // SURFACE GRADIENTS
  // Card backgrounds and elevated surfaces
  // ---------------------------------------------------------------------------

  surface: {
    /** Dark mode surface gradient */
    dark: ['rgba(30, 41, 59, 0.95)', 'rgba(15, 23, 42, 0.98)'] as GradientColors,

    /** Light mode surface gradient */
    light: ['rgba(255, 255, 255, 0.95)', 'rgba(248, 250, 252, 0.98)'] as GradientColors,

    /** Glassmorphism replacement - subtle gradient */
    elevated: ['rgba(51, 65, 85, 0.9)', 'rgba(30, 41, 59, 0.95)'] as GradientColors,

    /** Card highlight gradient */
    highlight: ['rgba(16, 185, 129, 0.15)', 'rgba(6, 182, 212, 0.1)'] as GradientColors,
  },

  // ---------------------------------------------------------------------------
  // BUTTON GRADIENTS
  // Interactive element backgrounds
  // ---------------------------------------------------------------------------

  button: {
    /** Primary action button */
    primary: [boldColors.emerald, boldColors.teal] as GradientColors,

    /** Secondary action button */
    secondary: [boldColors.cyan, boldColors.sky] as GradientColors,

    /** Destructive/danger button */
    danger: ['#DC2626', '#B91C1C'] as GradientColors,

    /** Success state button */
    success: [boldColors.emerald, boldColors.emeraldLight] as GradientColors,

    /** Premium/upgrade button */
    premium: [boldColors.violet, boldColors.purple] as GradientColors,

    /** Disabled state (reduced saturation) */
    disabled: ['#64748B', '#475569'] as GradientColors,
  },

  // ---------------------------------------------------------------------------
  // OVERLAY GRADIENTS
  // Modal backgrounds and overlays
  // ---------------------------------------------------------------------------

  overlay: {
    /** Bottom sheet gradient */
    bottomSheet: ['rgba(15, 23, 42, 0.95)', 'rgba(15, 23, 42, 0.99)'] as GradientColors,

    /** Modal backdrop gradient */
    modal: ['rgba(15, 23, 42, 0.9)', 'rgba(15, 23, 42, 0.95)'] as GradientColors,

    /** Top fade for content behind header */
    topFade: ['rgba(15, 23, 42, 1)', 'rgba(15, 23, 42, 0)'] as GradientColors,

    /** Bottom fade for content behind footer */
    bottomFade: ['rgba(15, 23, 42, 0)', 'rgba(15, 23, 42, 1)'] as GradientColors,
  },

  // ---------------------------------------------------------------------------
  // SEMANTIC GRADIENTS
  // Scoring and status indicators
  // ---------------------------------------------------------------------------

  scoring: {
    /** Birdie - Excellent performance */
    birdie: ['#16A34A', '#22C55E'] as GradientColors,

    /** Par - Standard performance */
    par: ['#3B82F6', '#60A5FA'] as GradientColors,

    /** Bogey - Below average */
    bogey: ['#F59E0B', '#FBBF24'] as GradientColors,

    /** Double bogey or worse */
    doublePlus: ['#DC2626', '#EF4444'] as GradientColors,
  },

  status: {
    /** Success state */
    success: [boldColors.emerald, boldColors.emeraldLight] as GradientColors,

    /** Warning state */
    warning: [boldColors.amber, boldColors.amberLight] as GradientColors,

    /** Error state */
    error: ['#DC2626', '#EF4444'] as GradientColors,

    /** Info state */
    info: [boldColors.sky, boldColors.blue] as GradientColors,
  },

  // ---------------------------------------------------------------------------
  // DECORATIVE GRADIENTS
  // Visual embellishments and accents
  // ---------------------------------------------------------------------------

  decorative: {
    /** Rainbow accent for special elements */
    rainbow: [boldColors.violet, boldColors.cyan, boldColors.emerald, boldColors.amber] as GradientColors,

    /** Neon glow effect */
    neon: [boldColors.cyan, boldColors.emerald] as GradientColors,

    /** Warm glow effect */
    warmGlow: [boldColors.amber, boldColors.coral] as GradientColors,

    /** Cool glow effect */
    coolGlow: [boldColors.cyan, boldColors.violet] as GradientColors,

    /** Metallic sheen */
    metallic: ['#94A3B8', '#CBD5E1', '#94A3B8'] as GradientColors,
  },

  // ---------------------------------------------------------------------------
  // TAB BAR GRADIENTS
  // Bottom navigation styling
  // ---------------------------------------------------------------------------

  tabBar: {
    /** Active tab indicator */
    activeIndicator: [boldColors.emerald, boldColors.cyan] as GradientColors,

    /** Tab bar background - dark mode */
    backgroundDark: ['rgba(15, 23, 42, 0.98)', 'rgba(30, 41, 59, 0.95)'] as GradientColors,

    /** Tab bar background - light mode */
    backgroundLight: ['rgba(255, 255, 255, 0.98)', 'rgba(248, 250, 252, 0.95)'] as GradientColors,
  },
} as const;

// =============================================================================
// GRADIENT PRESETS WITH DIRECTIONS
// Complete gradient configurations including suggested directions
// =============================================================================

export const gradientPresets: Record<string, GradientPreset> = {
  // Hero backgrounds - typically diagonal or vertical
  heroPrimary: {
    colors: gradients.hero.primary,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  heroWind: {
    colors: gradients.hero.wind,
    start: { x: 0, y: 0 },
    end: { x: 0.5, y: 1 },
  },

  // Buttons - horizontal for wide elements
  buttonPrimary: {
    colors: gradients.button.primary,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  buttonSecondary: {
    colors: gradients.button.secondary,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },

  // Overlays - vertical fade
  overlayBottom: {
    colors: gradients.overlay.bottomFade,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  overlayTop: {
    colors: gradients.overlay.topFade,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
};

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type GradientKey = keyof typeof gradients;
export type HeroGradientKey = keyof typeof gradients.hero;
export type SurfaceGradientKey = keyof typeof gradients.surface;
export type ButtonGradientKey = keyof typeof gradients.button;
export type ScoringGradientKey = keyof typeof gradients.scoring;
export type StatusGradientKey = keyof typeof gradients.status;
