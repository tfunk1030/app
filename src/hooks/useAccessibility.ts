/**
 * Accessibility Hooks for AICaddy Pro
 *
 * Provides animation utilities that respect user's reduced motion preferences.
 * All screen animations should use these hooks instead of direct Reanimated imports.
 */

import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  withSpring,
  withTiming,
  type WithSpringConfig,
  type WithTimingConfig,
} from 'react-native-reanimated';

// Spring configurations from design system
const springConfigs = {
  gentle: { damping: 20, stiffness: 90, mass: 1 },
  default: { damping: 15, stiffness: 120, mass: 1 },
  bouncy: { damping: 10, stiffness: 150, mass: 1 },
  snappy: { damping: 20, stiffness: 200, mass: 0.8 },
} as const;

// Timing configurations
const timingConfigs = {
  fast: { duration: 150, easing: Easing.out(Easing.ease) },
  normal: { duration: 250, easing: Easing.inOut(Easing.ease) },
  slow: { duration: 400, easing: Easing.inOut(Easing.ease) },
} as const;

// Instant timing for reduced motion
const instantTiming: WithTimingConfig = { duration: 0 };

/**
 * Hook to detect if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check initial state
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setPrefersReducedMotion(enabled);
    });

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        setPrefersReducedMotion(enabled);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Main accessibility animations hook
 *
 * Provides pre-configured animations that automatically disable when
 * the user has enabled "Reduce Motion" in their device settings.
 *
 * Usage:
 * ```tsx
 * const { headerEntering, cardEntering } = useAccessibleAnimations();
 *
 * <Animated.View entering={headerEntering}>
 *   <Text>Title</Text>
 * </Animated.View>
 *
 * <Animated.View entering={cardEntering(0)}>
 *   <GlassCard>First card</GlassCard>
 * </Animated.View>
 * ```
 */
export function useAccessibleAnimations() {
  const prefersReducedMotion = useReducedMotion();

  /**
   * Wraps an entering animation, returning undefined if reduced motion is enabled
   */
  const getEntering = useCallback(
    <T,>(animation: T): T | undefined => {
      if (prefersReducedMotion) {
        return undefined;
      }
      return animation;
    },
    [prefersReducedMotion]
  );

  /**
   * Returns instant timing if reduced motion, otherwise the provided spring config
   */
  const getSpring = useCallback(
    (toValue: number, config?: WithSpringConfig) => {
      if (prefersReducedMotion) {
        return withTiming(toValue, instantTiming);
      }
      return withSpring(toValue, config ?? springConfigs.default);
    },
    [prefersReducedMotion]
  );

  /**
   * Returns instant timing if reduced motion, otherwise the provided timing config
   */
  const getTiming = useCallback(
    (toValue: number, config?: WithTimingConfig) => {
      if (prefersReducedMotion) {
        return withTiming(toValue, instantTiming);
      }
      return withTiming(toValue, config ?? timingConfigs.normal);
    },
    [prefersReducedMotion]
  );

  /**
   * Header entering animation - fade in
   */
  const headerEntering = prefersReducedMotion
    ? undefined
    : FadeIn.duration(300);

  /**
   * Header exiting animation
   */
  const headerExiting = prefersReducedMotion ? undefined : FadeOut.duration(200);

  /**
   * Card entering animation with stagger support
   * @param index - Card index for stagger delay (0-based)
   * @param baseDelay - Base delay before first card (default: 100ms)
   * @param staggerDelay - Delay between cards (default: 100ms)
   */
  const cardEntering = useCallback(
    (index: number, baseDelay = 100, staggerDelay = 100) => {
      if (prefersReducedMotion) {
        return undefined;
      }
      return FadeInDown.delay(baseDelay + index * staggerDelay).duration(400);
    },
    [prefersReducedMotion]
  );

  /**
   * List item entering animation with faster stagger
   * @param index - Item index for stagger delay
   */
  const listItemEntering = useCallback(
    (index: number) => {
      if (prefersReducedMotion) {
        return undefined;
      }
      return FadeInDown.delay(index * 50).duration(200);
    },
    [prefersReducedMotion]
  );

  /**
   * Fade in up animation for modals/overlays
   */
  const modalEntering = prefersReducedMotion
    ? undefined
    : FadeInUp.duration(300).springify().damping(20);

  /**
   * Quick fade animation for state changes
   */
  const quickFade = prefersReducedMotion ? undefined : FadeIn.duration(150);

  return {
    // State
    prefersReducedMotion,

    // Utility functions
    getEntering,
    getSpring,
    getTiming,

    // Pre-configured animations
    headerEntering,
    headerExiting,
    cardEntering,
    listItemEntering,
    modalEntering,
    quickFade,

    // Config exports for custom animations
    springConfigs,
    timingConfigs,
  };
}

/**
 * Press scale values for interactive elements
 */
export const pressScale = {
  pressed: 0.97,
  default: 1,
} as const;

/**
 * Card press scale values (less aggressive)
 */
export const cardPressScale = {
  pressed: 0.98,
  default: 1,
} as const;

// Re-export spring configs for direct usage
export { springConfigs, timingConfigs };
