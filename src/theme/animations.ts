/**
 * AICaddyPro Animation System
 * Comprehensive animation presets for 60fps performance.
 *
 * This file exports:
 * - Animation timing and spring presets
 * - Reduce motion utilities and accessibility helpers
 * - GPU-optimized animation configurations
 * - Performance-focused animation factories
 *
 * Usage with react-native-reanimated:
 * import { animationPresets, getReducedMotionConfig } from '@/src/theme/animations';
 * const config = animationPresets.spring.snappy;
 * offset.value = withSpring(targetValue, config);
 *
 * For React components, use the useReduceMotion hook instead:
 * import { useReduceMotion } from '@/src/hooks/useReduceMotion';
 * const { reduceMotion, getSpringConfig } = useReduceMotion();
 */

import { Easing } from 'react-native-reanimated';
import { AccessibilityInfo } from 'react-native';

// =============================================================================
// CUSTOM TYPES
// Local types to avoid conflicts with Reanimated's complex union types
// =============================================================================

export interface SpringConfig {
  damping?: number;
  stiffness?: number;
  mass?: number;
  overshootClamping?: boolean;
  restDisplacementThreshold?: number;
  restSpeedThreshold?: number;
}

export interface TimingConfig {
  duration?: number;
  easing?: (value: number) => number;
}

// =============================================================================
// DURATION CONSTANTS
// Standard timing values for consistent animation feel
// =============================================================================

export const durations = {
  /** Instant - no animation (0ms) */
  instant: 0,
  /** Micro interactions - button highlights (50ms) */
  micro: 50,
  /** Fast - button presses, toggles (150ms) */
  fast: 150,
  /** Normal - state changes, reveals (250ms) */
  normal: 250,
  /** Slow - page transitions, complex reveals (350ms) */
  slow: 350,
  /** Slower - elaborate animations (500ms) */
  slower: 500,
  /** Modal entry/exit (300ms) */
  modal: 300,
  /** Overlay fade (200ms) */
  overlay: 200,
  /** Loading pulse cycle (1500ms) */
  pulse: 1500,
  /** Skeleton shimmer cycle (2000ms) */
  shimmer: 2000,
} as const;

// =============================================================================
// EASING PRESETS
// Curated easing curves for different animation types
// =============================================================================

export const easings = {
  /** Standard ease out - decelerating motion */
  easeOut: Easing.out(Easing.ease),
  /** Standard ease in - accelerating motion */
  easeIn: Easing.in(Easing.ease),
  /** Smooth ease in/out - symmetric acceleration */
  easeInOut: Easing.inOut(Easing.ease),
  /** Cubic ease out - snappier deceleration */
  cubicOut: Easing.out(Easing.cubic),
  /** Cubic ease in/out - smooth transitions */
  cubicInOut: Easing.inOut(Easing.cubic),
  /** Quad ease out - gentler deceleration */
  quadOut: Easing.out(Easing.quad),
  /** Elastic ease out - bouncy overshoot */
  elasticOut: Easing.out(Easing.elastic(1)),
  /** Back ease out - slight overshoot */
  backOut: Easing.out(Easing.back(1.5)),
  /** Linear - constant speed */
  linear: Easing.linear,
} as const;

// =============================================================================
// SPRING CONFIGURATIONS
// Physics-based spring presets for natural motion
// =============================================================================

export const springConfigs: Record<string, SpringConfig> = {
  /** Gentle - smooth, slow settling (page transitions) */
  gentle: {
    damping: 20,
    stiffness: 90,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },

  /** Default - balanced for most interactions */
  default: {
    damping: 15,
    stiffness: 120,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },

  /** Snappy - quick and responsive (buttons, toggles) */
  snappy: {
    damping: 20,
    stiffness: 200,
    mass: 0.8,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },

  /** Bouncy - playful with overshoot (highlights, emphasis) */
  bouncy: {
    damping: 10,
    stiffness: 150,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },

  /** Stiff - minimal oscillation (cards, surfaces) */
  stiff: {
    damping: 25,
    stiffness: 300,
    mass: 1,
    overshootClamping: true,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },

  /** Heavy - slow, weighty motion (large elements) */
  heavy: {
    damping: 30,
    stiffness: 80,
    mass: 2,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
};

// =============================================================================
// TIMING CONFIGURATIONS
// Duration-based timing presets with easing
// =============================================================================

export const timingConfigs: Record<string, TimingConfig> = {
  /** Fast - quick interactions (150ms) */
  fast: {
    duration: durations.fast,
    easing: easings.easeOut,
  },

  /** Normal - standard transitions (250ms) */
  normal: {
    duration: durations.normal,
    easing: easings.easeInOut,
  },

  /** Slow - complex animations (350ms) */
  slow: {
    duration: durations.slow,
    easing: easings.easeInOut,
  },

  /** Modal - overlay entry/exit (300ms) */
  modal: {
    duration: durations.modal,
    easing: easings.cubicOut,
  },

  /** Fade - opacity transitions (200ms) */
  fade: {
    duration: durations.overlay,
    easing: easings.easeOut,
  },

  /** Slide - translation animations (250ms) */
  slide: {
    duration: durations.normal,
    easing: easings.cubicOut,
  },

  /** Scale - size transitions (200ms) */
  scale: {
    duration: durations.overlay,
    easing: easings.backOut,
  },
};

// =============================================================================
// ANIMATION PRESETS
// Complete animation configurations organized by use case
// =============================================================================

export const animationPresets = {
  // Duration constants
  durations,

  // Easing curves
  easings,

  // Spring physics configurations
  spring: springConfigs,

  // Timing configurations
  timing: timingConfigs,

  // Stagger delays for sequential animations
  stagger: {
    /** Fast stagger - list items (50ms) */
    fast: 50,
    /** Normal stagger - cards, sections (80ms) */
    normal: 80,
    /** Slow stagger - larger elements (120ms) */
    slow: 120,
  },

  // Scale values for press states
  scale: {
    /** Button press scale */
    button: { pressed: 0.96, default: 1 },
    /** Card press scale */
    card: { pressed: 0.98, default: 1 },
    /** Tab icon scale */
    tab: { focused: 1, unfocused: 0.9 },
    /** Icon highlight scale */
    icon: { pressed: 0.92, default: 1 },
  },

  // Opacity values
  opacity: {
    visible: 1,
    hidden: 0,
    muted: 0.6,
    disabled: 0.4,
    overlay: 0.5,
  },

  // Translation offsets
  offset: {
    /** Slide in from bottom */
    slideUp: { from: 100, to: 0 },
    /** Slide in from top */
    slideDown: { from: -50, to: 0 },
    /** Slide in from right */
    slideRight: { from: 50, to: 0 },
    /** Slide in from left */
    slideLeft: { from: -50, to: 0 },
    /** Modal slide distance */
    modal: { from: 300, to: 0 },
  },
} as const;

// =============================================================================
// REDUCE MOTION SUPPORT
// Accessibility-aware animation utilities
// =============================================================================

/**
 * Cached reduce motion preference
 * This global state allows synchronous access from non-React contexts
 */
let reduceMotionEnabled: boolean | null = null;

/**
 * Reduced motion spring configuration
 * Settles immediately with no bounce or overshoot
 */
export const reducedMotionSpringConfig: SpringConfig = {
  damping: 100,
  stiffness: 1000,
  mass: 0.1,
  overshootClamping: true,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

/**
 * Reduced motion timing configuration
 * Instant transition with no duration
 */
export const reducedMotionTimingConfig: TimingConfig = {
  duration: 0,
  easing: easings.linear,
};

/**
 * Check if reduce motion is enabled (async)
 * Caches result for performance, updates via listener
 */
export async function isReduceMotionEnabled(): Promise<boolean> {
  if (reduceMotionEnabled !== null) {
    return reduceMotionEnabled;
  }

  try {
    reduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
    return reduceMotionEnabled;
  } catch {
    return false;
  }
}

/**
 * Get reduce motion state synchronously
 * May return null on first call before initialization
 */
export function getReduceMotionSync(): boolean {
  return reduceMotionEnabled ?? false;
}

/**
 * Manually set the reduce motion state
 * Used by useReduceMotion hook to sync state
 */
export function setReduceMotionState(enabled: boolean): void {
  reduceMotionEnabled = enabled;
}

/**
 * Set up listener for reduce motion preference changes
 * Call this once at app startup
 */
export function setupReduceMotionListener(): () => void {
  const subscription = AccessibilityInfo.addEventListener(
    'reduceMotionChanged',
    (enabled: boolean) => {
      reduceMotionEnabled = enabled;
    }
  );

  // Initial check
  isReduceMotionEnabled();

  return () => {
    subscription.remove();
  };
}

/**
 * Get animation configuration respecting reduce motion preference
 * @param normalConfig - Configuration to use when animations are enabled
 * @param reducedConfig - Optional reduced configuration (defaults to instant)
 */
export function getReducedMotionConfig<T extends SpringConfig | TimingConfig>(
  normalConfig: T,
  reducedConfig?: Partial<T>
): T {
  if (reduceMotionEnabled) {
    if (reducedConfig) {
      return { ...normalConfig, ...reducedConfig };
    }
    // Default: instant timing
    return {
      ...normalConfig,
      duration: durations.instant,
    } as T;
  }
  return normalConfig;
}

/**
 * Get spring config with reduce motion fallback
 */
export function getAccessibleSpringConfig(
  configKey: string = 'default'
): SpringConfig {
  const config = springConfigs[configKey] || springConfigs.default;
  if (reduceMotionEnabled) {
    return reducedMotionSpringConfig;
  }
  return config;
}

/**
 * Get timing config with reduce motion fallback
 */
export function getAccessibleTimingConfig(
  configKey: string = 'normal'
): TimingConfig {
  const config = timingConfigs[configKey] || timingConfigs.normal;
  if (reduceMotionEnabled) {
    return reducedMotionTimingConfig;
  }
  return config;
}

/**
 * Check if animation should be skipped entirely
 * Use this for layout animations or entering/exiting animations
 */
export function shouldSkipAnimation(): boolean {
  return reduceMotionEnabled ?? false;
}

/**
 * Get conditional animation value
 * Returns undefined when reduce motion is enabled, animation otherwise
 */
export function getConditionalAnimation<T>(animation: T): T | undefined {
  if (reduceMotionEnabled) {
    return undefined;
  }
  return animation;
}

// =============================================================================
// ANIMATION UTILITIES
// Helper functions for common animation patterns
// =============================================================================

/**
 * Calculate stagger delay for indexed items
 * @param index - Item index (0-based)
 * @param baseDelay - Initial delay before first item (default: 50ms)
 * @param stagger - Delay between items (default: 80ms)
 */
export function getStaggerDelay(
  index: number,
  baseDelay: number = 50,
  stagger: number = animationPresets.stagger.normal
): number {
  if (reduceMotionEnabled) {
    return 0;
  }
  return baseDelay + index * stagger;
}

/**
 * Get animation duration respecting reduce motion
 * @param duration - Normal duration in ms
 * @returns Duration (0 if reduce motion enabled)
 */
export function getAccessibleDuration(duration: number): number {
  return reduceMotionEnabled ? 0 : duration;
}

/**
 * Create a GPU-optimized transform style object
 * Ensures transforms use hardware acceleration
 */
export function createGPUTransform(transforms: Record<string, number>): object[] {
  const result: object[] = [];

  if ('translateX' in transforms) {
    result.push({ translateX: transforms.translateX });
  }
  if ('translateY' in transforms) {
    result.push({ translateY: transforms.translateY });
  }
  if ('scale' in transforms) {
    result.push({ scale: transforms.scale });
  }
  if ('scaleX' in transforms) {
    result.push({ scaleX: transforms.scaleX });
  }
  if ('scaleY' in transforms) {
    result.push({ scaleY: transforms.scaleY });
  }
  if ('rotate' in transforms) {
    result.push({ rotate: `${transforms.rotate}deg` });
  }
  if ('rotateX' in transforms) {
    result.push({ rotateX: `${transforms.rotateX}deg` });
  }
  if ('rotateY' in transforms) {
    result.push({ rotateY: `${transforms.rotateY}deg` });
  }

  return result;
}

// =============================================================================
// PERFORMANCE CONSTANTS
// Thresholds and targets for animation performance
// =============================================================================

export const performanceTargets = {
  /** Target frame rate */
  targetFPS: 60,
  /** Frame time budget in ms (16.67ms for 60fps) */
  frameBudget: 16.67,
  /** Maximum acceptable dropped frames per transition */
  maxDroppedFrames: 5,
  /** Warning threshold for dropped frames */
  warnDroppedFrames: 3,
  /** Minimum acceptable FPS before warning */
  minAcceptableFPS: 55,
  /** JS thread budget in ms (should not block more than this) */
  jsThreadBudget: 10,
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type SpringConfigKey = 'gentle' | 'default' | 'snappy' | 'bouncy' | 'stiff' | 'heavy';
export type TimingConfigKey = 'fast' | 'normal' | 'slow' | 'modal' | 'fade' | 'slide' | 'scale';
export type StaggerKey = keyof typeof animationPresets.stagger;
export type EasingKey = keyof typeof easings;
export type DurationKey = keyof typeof durations;
