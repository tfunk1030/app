/**
 * Animation Utilities and Presets for AICaddy Pro
 *
 * This file exports animation configurations that match the design system.
 * Use these presets for consistent animations throughout the app.
 *
 * For accessibility-aware animations, use the useAccessibleAnimations() hook
 * from @/src/hooks/useAccessibility which automatically respects reduced motion.
 */

import { Easing } from 'react-native-reanimated';

/**
 * Spring configurations for different animation feels
 */
export const springConfigs = {
  /** Smooth, gentle movements - great for page transitions */
  gentle: {
    damping: 20,
    stiffness: 90,
    mass: 1,
  },
  /** Default spring - balanced for most interactions */
  default: {
    damping: 15,
    stiffness: 120,
    mass: 1,
  },
  /** Playful bounce - for highlights and emphasis */
  bouncy: {
    damping: 10,
    stiffness: 150,
    mass: 1,
  },
  /** Quick and responsive - for buttons and toggles */
  snappy: {
    damping: 20,
    stiffness: 200,
    mass: 0.8,
  },
} as const;

/**
 * Timing configurations with easing curves
 */
export const timingConfigs = {
  /** Quick interactions (150ms) - buttons, toggles */
  fast: {
    duration: 150,
    easing: Easing.out(Easing.ease),
  },
  /** Standard transitions (250ms) - state changes, reveals */
  normal: {
    duration: 250,
    easing: Easing.inOut(Easing.ease),
  },
  /** Slower animations (400ms) - page transitions, complex reveals */
  slow: {
    duration: 400,
    easing: Easing.inOut(Easing.ease),
  },
  /** Modal entry (300ms) - modals, overlays */
  modal: {
    duration: 300,
    easing: Easing.out(Easing.cubic),
  },
} as const;

/**
 * Stagger delay values for sequential animations
 */
export const staggerDelays = {
  /** Fast stagger (50ms) - list items */
  fast: 50,
  /** Normal stagger (100ms) - cards, sections */
  normal: 100,
  /** Slow stagger (150ms) - larger elements, emphasis */
  slow: 150,
} as const;

/**
 * Scale values for press/hover states
 */
export const scaleValues = {
  /** Card press scale - subtle shrink */
  card: {
    pressed: 0.98,
    default: 1,
  },
  /** Button press scale - noticeable shrink */
  button: {
    pressed: 0.96,
    default: 1,
  },
  /** Tab icon scale - focused vs unfocused */
  tab: {
    focused: 1,
    unfocused: 0.9,
  },
} as const;

/**
 * Opacity values for fade transitions
 */
export const opacityValues = {
  visible: 1,
  hidden: 0,
  muted: 0.6,
  disabled: 0.4,
} as const;

/**
 * Common animation durations in milliseconds
 */
export const durations = {
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 400,
  slower: 600,
  pulse: 1500,
  shimmer: 3000,
} as const;

/**
 * Z-index values for layering animated elements
 */
export const zIndex = {
  background: 0,
  content: 1,
  overlay: 10,
  modal: 100,
  toast: 1000,
} as const;

/**
 * Helper to calculate stagger delay for indexed items
 * @param index - Item index (0-based)
 * @param baseDelay - Initial delay before first item (default: 100ms)
 * @param stagger - Delay between items (default: 100ms)
 */
export function getStaggerDelay(
  index: number,
  baseDelay = 100,
  stagger: keyof typeof staggerDelays | number = 'normal'
): number {
  const staggerValue = typeof stagger === 'number' ? stagger : staggerDelays[stagger];
  return baseDelay + index * staggerValue;
}

/**
 * Type exports for TypeScript consumers
 */
export type SpringConfig = (typeof springConfigs)[keyof typeof springConfigs];
export type TimingConfig = (typeof timingConfigs)[keyof typeof timingConfigs];
