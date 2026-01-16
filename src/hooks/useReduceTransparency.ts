/**
 * useReduceTransparency.ts
 *
 * A hook for detecting the user's Reduce Transparency accessibility preference.
 * When enabled, blur/glass effects should be replaced with solid backgrounds
 * for better readability and performance.
 *
 * iOS: Settings > Accessibility > Display & Text Size > Reduce Transparency
 *
 * Usage:
 * ```tsx
 * import { useReduceTransparencyValue } from '@/src/hooks/useReduceTransparency';
 *
 * function MyComponent() {
 *   const reduceTransparency = useReduceTransparencyValue();
 *
 *   return reduceTransparency ? (
 *     <View style={{ backgroundColor: theme.surface }} />
 *   ) : (
 *     <BlurView intensity={20} />
 *   );
 * }
 * ```
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { AccessibilityInfo, Platform, AppState, AppStateStatus } from 'react-native';

// =============================================================================
// Types
// =============================================================================

export interface ReduceTransparencyConfig {
  /** Whether reduce transparency is currently enabled */
  reduceTransparency: boolean;
  /** Whether transparency effects should be shown (inverse of reduceTransparency) */
  shouldShowTransparency: boolean;
  /** Get background style respecting reduce transparency */
  getBackgroundStyle: (
    transparentBg: string,
    solidBg: string
  ) => { backgroundColor: string };
}

// =============================================================================
// Global State Management
// =============================================================================

/**
 * Global state for reduce transparency preference
 * This allows synchronous access in non-React contexts
 */
let globalReduceTransparencyEnabled = false;
let listenerInitialized = false;

/**
 * Initialize the global reduce transparency listener
 * Call this once at app startup
 *
 * Note: Unlike reduceMotion, there's no dedicated event listener for reduceTransparency
 * changes in React Native. However, we listen for AppState changes to re-check
 * when the user returns from Settings, improving UX without requiring app restart.
 */
export function initializeReduceTransparencyListener(): () => void {
  if (listenerInitialized) {
    return () => {};
  }

  listenerInitialized = true;

  // Helper to check and update transparency state
  const checkTransparency = () => {
    if (Platform.OS === 'ios') {
      AccessibilityInfo.isReduceTransparencyEnabled()
        .then((enabled) => {
          globalReduceTransparencyEnabled = enabled;
        })
        .catch(() => {
          globalReduceTransparencyEnabled = false;
        });
    }
  };

  // Check initial state
  checkTransparency();

  // Re-check when app returns to foreground (user may have changed Settings)
  const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      checkTransparency();
    }
  });

  return () => {
    subscription.remove();
    listenerInitialized = false;
  };
}

/**
 * Get the current reduce transparency preference synchronously
 * Note: This may be stale on first call before async initialization completes
 */
export function getReduceTransparencyEnabled(): boolean {
  return globalReduceTransparencyEnabled;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for accessing reduce transparency preference with reactive updates
 *
 * This hook:
 * - Detects the initial reduce transparency preference
 * - Re-checks when app returns to foreground (Settings → App transition)
 * - Provides utility functions for creating accessible UI
 * - Updates global state for synchronous access elsewhere
 */
export function useReduceTransparency(): ReduceTransparencyConfig {
  const [reduceTransparency, setReduceTransparency] = useState<boolean>(
    globalReduceTransparencyEnabled
  );

  // Initialize and sync state, re-check on app foreground
  useEffect(() => {
    let mounted = true;

    const checkTransparency = () => {
      if (Platform.OS === 'ios') {
        AccessibilityInfo.isReduceTransparencyEnabled()
          .then((enabled) => {
            if (mounted) {
              setReduceTransparency(enabled);
              globalReduceTransparencyEnabled = enabled;
            }
          })
          .catch(() => {
            if (mounted) {
              setReduceTransparency(false);
              globalReduceTransparencyEnabled = false;
            }
          });
      }
    };

    // Check on mount
    checkTransparency();

    // Re-check when app returns to foreground
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkTransparency();
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  /**
   * Get background style respecting reduce transparency
   * @param transparentBg - Background color when transparency is allowed (can be transparent/semi-transparent)
   * @param solidBg - Solid background color when reduce transparency is enabled
   */
  const getBackgroundStyle = useCallback(
    (
      transparentBg: string,
      solidBg: string
    ): { backgroundColor: string } => {
      return {
        backgroundColor: reduceTransparency ? solidBg : transparentBg,
      };
    },
    [reduceTransparency]
  );

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      reduceTransparency,
      shouldShowTransparency: !reduceTransparency,
      getBackgroundStyle,
    }),
    [reduceTransparency, getBackgroundStyle]
  );
}

// =============================================================================
// Convenience Hook for Simple Cases
// =============================================================================

/**
 * Simple hook that just returns the boolean reduce transparency state
 * Use this when you only need to check the preference
 *
 * Re-checks when app returns to foreground for better UX.
 *
 * @returns true if user has enabled "Reduce Transparency" in iOS Accessibility settings
 */
export function useReduceTransparencyValue(): boolean {
  const [reduceTransparency, setReduceTransparency] = useState<boolean>(
    globalReduceTransparencyEnabled
  );

  useEffect(() => {
    let mounted = true;

    const checkTransparency = () => {
      if (Platform.OS === 'ios') {
        AccessibilityInfo.isReduceTransparencyEnabled()
          .then((enabled) => {
            if (mounted) {
              setReduceTransparency(enabled);
              globalReduceTransparencyEnabled = enabled;
            }
          })
          .catch(() => {
            if (mounted) {
              setReduceTransparency(false);
              globalReduceTransparencyEnabled = false;
            }
          });
      }
    };

    // Check on mount
    checkTransparency();

    // Re-check when app returns to foreground
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkTransparency();
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceTransparency;
}

// =============================================================================
// Default Export
// =============================================================================

export default useReduceTransparency;
