/**
 * Wind Screen Layout Hook
 *
 * Combines window dimensions, safe area insets, and responsive utilities
 * to provide optimized layout values for the Wind Calculator screen.
 */

import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getLayoutMode,
  getCompassSizeByMode,
  getActionBarHeight,
  type LayoutMode,
} from '@/src/utils/responsive';

export interface WindScreenLayout {
  /** Current layout mode based on screen height */
  layoutMode: LayoutMode;
  /** Optimal compass size for current device */
  compassSize: number;
  /** Whether to use compact controls layout */
  hasCompactControls: boolean;
  /** Height of the bottom action bar */
  bottomBarHeight: number;
  /** Safe area insets */
  insets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  /** Screen dimensions */
  screen: {
    width: number;
    height: number;
  };
  /** Available content height (screen minus safe areas and action bar) */
  availableContentHeight: number;
}

/**
 * Hook to get responsive layout values for the Wind screen
 * Memoized to prevent unnecessary re-renders
 */
export function useWindScreenLayout(): WindScreenLayout {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const layoutMode = getLayoutMode(height);
    const compassSize = getCompassSizeByMode(layoutMode, width);
    const bottomBarHeight = getActionBarHeight(layoutMode);

    // Calculate available content height
    // Screen height - safe areas - action bar - estimated header height
    const headerEstimate = layoutMode === 'compact' ? 44 : 56;
    const availableContentHeight =
      height - insets.top - insets.bottom - bottomBarHeight - headerEstimate;

    return {
      layoutMode,
      compassSize,
      hasCompactControls: layoutMode === 'compact',
      bottomBarHeight,
      insets: {
        top: insets.top,
        bottom: insets.bottom,
        left: insets.left,
        right: insets.right,
      },
      screen: {
        width,
        height,
      },
      availableContentHeight,
    };
  }, [width, height, insets.top, insets.bottom, insets.left, insets.right]);
}
