/**
 * useReduceMotion.ts
 *
 * A comprehensive hook for detecting and responding to the user's reduce motion
 * accessibility preference. This hook provides both state and utility functions
 * for creating accessible animations that respect user preferences.
 *
 * Usage:
 * ```tsx
 * import { useReduceMotion } from '@/src/hooks/useReduceMotion';
 *
 * function MyComponent() {
 *   const {
 *     reduceMotion,
 *     getAnimationDuration,
 *     shouldAnimate,
 *     getSpringConfig,
 *   } = useReduceMotion();
 *
 *   const animatedStyle = useAnimatedStyle(() => ({
 *     opacity: withTiming(1, { duration: getAnimationDuration(300) }),
 *   }));
 *
 *   return <Animated.View style={animatedStyle}>...</Animated.View>;
 * }
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AccessibilityInfo } from 'react-native';
import type { SpringConfig, TimingConfig } from '../theme/animations';

// =============================================================================
// Types
// =============================================================================

export interface ReduceMotionConfig {
  /** Whether reduce motion is currently enabled */
  reduceMotion: boolean;
  /** Whether animations should run (inverse of reduceMotion) */
  shouldAnimate: boolean;
  /** Get duration respecting reduce motion (returns 0 if reduced) */
  getAnimationDuration: (normalDuration: number, reducedDuration?: number) => number;
  /** Get delay respecting reduce motion (returns 0 if reduced) */
  getAnimationDelay: (normalDelay: number) => number;
  /** Get spring config respecting reduce motion */
  getSpringConfig: (normalConfig: SpringConfig) => SpringConfig;
  /** Get timing config respecting reduce motion */
  getTimingConfig: (normalConfig: TimingConfig) => TimingConfig;
  /** Conditionally return entering animation or undefined */
  getEnteringAnimation: <T>(animation: T) => T | undefined;
  /** Conditionally return exiting animation or undefined */
  getExitingAnimation: <T>(animation: T) => T | undefined;
}

// =============================================================================
// Constants
// =============================================================================

/** Instant spring config for reduce motion (settles immediately) */
const REDUCED_SPRING_CONFIG: SpringConfig = {
  damping: 100,
  stiffness: 1000,
  mass: 0.1,
  overshootClamping: true,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

/** Instant timing config for reduce motion */
const REDUCED_TIMING_CONFIG: TimingConfig = {
  duration: 0,
};

// =============================================================================
// Global State Management
// =============================================================================

/**
 * Global state for reduce motion preference
 * This allows synchronous access in non-React contexts (like animations.ts)
 */
let globalReduceMotionEnabled = false;
let listenerInitialized = false;

/**
 * Initialize the global reduce motion listener
 * Call this once at app startup
 */
export function initializeReduceMotionListener(): () => void {
  if (listenerInitialized) {
    return () => {};
  }

  listenerInitialized = true;

  // Check initial state
  AccessibilityInfo.isReduceMotionEnabled()
    .then((enabled) => {
      globalReduceMotionEnabled = enabled;
    })
    .catch(() => {
      globalReduceMotionEnabled = false;
    });

  // Listen for changes
  const subscription = AccessibilityInfo.addEventListener(
    'reduceMotionChanged',
    (enabled: boolean) => {
      globalReduceMotionEnabled = enabled;
    }
  );

  return () => {
    subscription.remove();
    listenerInitialized = false;
  };
}

/**
 * Get the current reduce motion preference synchronously
 * Note: This may be stale on first call before async initialization completes
 */
export function getReduceMotionEnabled(): boolean {
  return globalReduceMotionEnabled;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for accessing reduce motion preference with reactive updates
 *
 * This hook:
 * - Detects the initial reduce motion preference
 * - Listens for changes to the preference
 * - Provides utility functions for creating accessible animations
 * - Updates global state for synchronous access elsewhere
 */
export function useReduceMotion(): ReduceMotionConfig {
  const [reduceMotion, setReduceMotion] = useState<boolean>(globalReduceMotionEnabled);

  // Initialize listener and sync state
  useEffect(() => {
    let mounted = true;

    // Check initial state
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) {
          setReduceMotion(enabled);
          globalReduceMotionEnabled = enabled;
        }
      })
      .catch(() => {
        if (mounted) {
          setReduceMotion(false);
          globalReduceMotionEnabled = false;
        }
      });

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled: boolean) => {
        if (mounted) {
          setReduceMotion(enabled);
          globalReduceMotionEnabled = enabled;
        }
      }
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  /**
   * Get animation duration respecting reduce motion
   * @param normalDuration - Duration when animations are enabled
   * @param reducedDuration - Optional reduced duration (defaults to 0)
   */
  const getAnimationDuration = useCallback(
    (normalDuration: number, reducedDuration: number = 0): number => {
      return reduceMotion ? reducedDuration : normalDuration;
    },
    [reduceMotion]
  );

  /**
   * Get animation delay respecting reduce motion
   * Returns 0 when reduce motion is enabled
   */
  const getAnimationDelay = useCallback(
    (normalDelay: number): number => {
      return reduceMotion ? 0 : normalDelay;
    },
    [reduceMotion]
  );

  /**
   * Get spring config respecting reduce motion
   * Returns a snappy, non-bouncy config when reduced
   */
  const getSpringConfig = useCallback(
    (normalConfig: SpringConfig): SpringConfig => {
      if (reduceMotion) {
        return REDUCED_SPRING_CONFIG;
      }
      return normalConfig;
    },
    [reduceMotion]
  );

  /**
   * Get timing config respecting reduce motion
   * Returns instant timing when reduced
   */
  const getTimingConfig = useCallback(
    (normalConfig: TimingConfig): TimingConfig => {
      if (reduceMotion) {
        return REDUCED_TIMING_CONFIG;
      }
      return normalConfig;
    },
    [reduceMotion]
  );

  /**
   * Conditionally return entering animation
   * Returns undefined when reduce motion is enabled
   */
  const getEnteringAnimation = useCallback(
    <T,>(animation: T): T | undefined => {
      return reduceMotion ? undefined : animation;
    },
    [reduceMotion]
  );

  /**
   * Conditionally return exiting animation
   * Returns undefined when reduce motion is enabled
   */
  const getExitingAnimation = useCallback(
    <T,>(animation: T): T | undefined => {
      return reduceMotion ? undefined : animation;
    },
    [reduceMotion]
  );

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      reduceMotion,
      shouldAnimate: !reduceMotion,
      getAnimationDuration,
      getAnimationDelay,
      getSpringConfig,
      getTimingConfig,
      getEnteringAnimation,
      getExitingAnimation,
    }),
    [
      reduceMotion,
      getAnimationDuration,
      getAnimationDelay,
      getSpringConfig,
      getTimingConfig,
      getEnteringAnimation,
      getExitingAnimation,
    ]
  );
}

// =============================================================================
// Convenience Hook for Simple Cases
// =============================================================================

/**
 * Simple hook that just returns the boolean reduce motion state
 * Use this when you only need to check the preference
 */
export function useReduceMotionValue(): boolean {
  const [reduceMotion, setReduceMotion] = useState<boolean>(globalReduceMotionEnabled);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) {
          setReduceMotion(enabled);
        }
      })
      .catch(() => {
        if (mounted) {
          setReduceMotion(false);
        }
      });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled: boolean) => {
        if (mounted) {
          setReduceMotion(enabled);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

// =============================================================================
// Default Export
// =============================================================================

export default useReduceMotion;
