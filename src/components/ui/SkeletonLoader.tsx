/**
 * SkeletonLoader.tsx
 *
 * A comprehensive component library that displays skeleton loading states for various UI elements
 * to improve perceived performance and user experience during data loading.
 *
 * Features:
 * - Multiple skeleton types (text, card, circle, rectangle, custom)
 * - Animated shimmer effect with accessibility support
 * - Pre-built layouts for common screen patterns
 * - Screen-specific skeleton components (Shot, Wind, Clubs, Settings)
 * - Follows Bold & Colorful design system
 */

import { useTokens } from '@/src/theme/useTokens';
import { useReduceMotionValue } from '@/src/hooks/useReduceMotion';
import React, { useEffect, useRef } from 'react';
import { Animated, DimensionValue, StyleSheet, View, ViewStyle } from 'react-native';

// Types of skeleton elements
export type SkeletonType = 'text' | 'card' | 'circle' | 'rectangle' | 'custom';

interface SkeletonLoaderProps {
  /** Type of skeleton to display */
  type: SkeletonType;
  /** Width of the skeleton element */
  width?: DimensionValue;
  /** Height of the skeleton element */
  height?: DimensionValue;
  /** Border radius of the skeleton element */
  borderRadius?: number;
  /** Whether the skeleton is currently loading */
  isLoading?: boolean;
  /** Content to display when not loading */
  children?: React.ReactNode;
  /** Additional style for the skeleton container */
  style?: ViewStyle;
  /** Number of skeleton items to display (for repeating elements) */
  count?: number;
  /** Spacing between repeated elements */
  spacing?: number;
  /** Whether to animate the skeleton */
  animate?: boolean;
  /** Custom layout for complex skeletons */
  layout?: Array<{
    width: DimensionValue;
    height: DimensionValue;
    borderRadius?: number;
    style?: ViewStyle;
  }>;
}

/**
 * SkeletonLoader component for displaying loading states
 */
export function SkeletonLoader({
  type = 'rectangle',
  width = '100%',
  height = 20,
  borderRadius = 4,
  isLoading = true,
  children,
  style,
  count = 1,
  spacing = 8,
  animate = true,
  layout,
}: SkeletonLoaderProps) {
  const t = useTokens();
  const reduceMotion = useReduceMotionValue();
  const shimmerAnimation = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Determine if animation should run (respects reduce motion preference)
  const shouldAnimate = animate && isLoading && !reduceMotion;

  useEffect(() => {
    if (shouldAnimate) {
      // Create and start the animation loop
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnimation, { toValue: 1, duration: 1200, useNativeDriver: false }),
          Animated.timing(shimmerAnimation, { toValue: 0, duration: 1200, useNativeDriver: false }),
        ])
      );
      animationRef.current.start();
    } else {
      shimmerAnimation.setValue(0);
    }

    // Cleanup: stop animation on unmount or when conditions change
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      shimmerAnimation.stopAnimation();
    };
  }, [shouldAnimate, shimmerAnimation]);

  const shimmerTranslate = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [
      typeof width === 'number' ? -width : -100,
      typeof width === 'number' ? width : 100,
    ],
  });

  if (!isLoading) {
    return <>{children}</>;
  }

  const getSkeletonStyle = (skeletonType: SkeletonType, index = 0): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: t.colors.surfaceAlt,
      width,
      height,
      borderRadius,
      overflow: 'hidden',
      marginBottom: index < count - 1 ? spacing : 0,
    };

    switch (skeletonType) {
      case 'text':
        return { ...baseStyle, height: 16, borderRadius: 4 };
      case 'card':
        return { ...baseStyle, height: 120, borderRadius: 12 };
      case 'circle':
        return {
          ...baseStyle,
          width: typeof width === 'number' ? width : 40,
          height: typeof height === 'number' ? height : 40,
          borderRadius: typeof width === 'number' ? width / 2 : 20,
        };
      case 'custom':
        return { ...baseStyle, ...style };
      default:
        return baseStyle;
    }
  };

  const renderSkeletonItem = (
    itemType: SkeletonType,
    itemStyle: ViewStyle,
    key: string | number
  ) => (
    <View key={key} style={[getSkeletonStyle(itemType), itemStyle]}>
      {/* Only render shimmer when animation is enabled and reduce motion is not active */}
      {shouldAnimate && (
        <Animated.View
          style={[styles.shimmer, { transform: [{ translateX: shimmerTranslate }] }]}
        />
      )}
    </View>
  );

  if (layout && type === 'custom') {
    return (
      <View style={[styles.container, style]}>
        {layout.map((item, index) =>
          renderSkeletonItem(
            'custom',
            {
              width: item.width,
              height: item.height,
              borderRadius: item.borderRadius || borderRadius,
              ...item.style,
            },
            `skeleton-custom-${index}`
          )
        )}
      </View>
    );
  }

  if (count > 1) {
    return (
      <View style={[styles.container, style]}>
        {Array.from({ length: count }).map((_, index) =>
          renderSkeletonItem(type, {}, `skeleton-${type}-${index}`)
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {renderSkeletonItem(type, {}, `skeleton-${type}`)}
    </View>
  );
}

// ============================================================================
// Pre-built Layout Configurations
// ============================================================================

/**
 * Pre-built skeleton layouts for common UI patterns
 */
export const SkeletonLayouts = {
  /** Card with title and description */
  card: [
    { width: '100%', height: 120, borderRadius: 12 },
    { width: '70%', height: 20, borderRadius: 4, style: { marginTop: 12 } as ViewStyle },
    { width: '40%', height: 16, borderRadius: 4, style: { marginTop: 8 } as ViewStyle },
  ],
  /** Profile with avatar, name, and subtitle */
  profile: [
    { width: 60, height: 60, borderRadius: 30, style: { alignSelf: 'center' } as ViewStyle },
    { width: '60%', height: 18, borderRadius: 4, style: { marginTop: 12, alignSelf: 'center' } as ViewStyle },
    { width: '80%', height: 14, borderRadius: 4, style: { marginTop: 8, alignSelf: 'center' } as ViewStyle },
  ],
  /** List item with avatar and text */
  listItem: [
    { width: 40, height: 40, borderRadius: 20, style: { marginRight: 12 } as ViewStyle },
    { width: '70%', height: 16, borderRadius: 4 },
    { width: '50%', height: 12, borderRadius: 4, style: { marginTop: 6 } as ViewStyle },
  ],
  /** Wind result display */
  windResult: [
    { width: '100%', height: 60, borderRadius: 12 },
    { width: '80%', height: 24, borderRadius: 4, style: { marginTop: 16 } as ViewStyle },
    { width: '60%', height: 16, borderRadius: 4, style: { marginTop: 8 } as ViewStyle },
    { width: '100%', height: 100, borderRadius: 12, style: { marginTop: 16 } as ViewStyle },
  ],
  /** Hero section with large display */
  hero: [
    { width: '100%', height: 80, borderRadius: 16 },
    { width: '60%', height: 28, borderRadius: 6, style: { marginTop: 16, alignSelf: 'center' } as ViewStyle },
    { width: '40%', height: 16, borderRadius: 4, style: { marginTop: 8, alignSelf: 'center' } as ViewStyle },
  ],
  /** Metric tile with icon and value */
  metricTile: [
    { width: 32, height: 32, borderRadius: 16, style: { marginBottom: 8 } as ViewStyle },
    { width: '60%', height: 12, borderRadius: 4 },
    { width: '80%', height: 24, borderRadius: 4, style: { marginTop: 8 } as ViewStyle },
  ],
  /** Settings row with icon and label */
  settingsRow: [
    { width: 24, height: 24, borderRadius: 6, style: { marginRight: 12 } as ViewStyle },
    { width: '60%', height: 16, borderRadius: 4 },
    { width: 24, height: 24, borderRadius: 12, style: { marginLeft: 'auto' } as ViewStyle },
  ],
  /** Club card with icon, name and distance */
  clubCard: [
    { width: 48, height: 48, borderRadius: 24, style: { marginRight: 16 } as ViewStyle },
    { width: '50%', height: 18, borderRadius: 4 },
    { width: '30%', height: 14, borderRadius: 4, style: { marginTop: 6 } as ViewStyle },
  ],
  /** Weather bar with multiple data points */
  weatherBar: [
    { width: 80, height: 60, borderRadius: 12, style: { marginRight: 12 } as ViewStyle },
    { width: 80, height: 60, borderRadius: 12, style: { marginRight: 12 } as ViewStyle },
    { width: 80, height: 60, borderRadius: 12, style: { marginRight: 12 } as ViewStyle },
    { width: 80, height: 60, borderRadius: 12 },
  ],
  /** Input field skeleton */
  input: [
    { width: '30%', height: 14, borderRadius: 4, style: { marginBottom: 8 } as ViewStyle },
    { width: '100%', height: 48, borderRadius: 12 },
  ],
  /** Button skeleton */
  button: [
    { width: '100%', height: 52, borderRadius: 12 },
  ],
  /** Compact stat display */
  statCompact: [
    { width: 60, height: 14, borderRadius: 4 },
    { width: 80, height: 20, borderRadius: 4, style: { marginTop: 4 } as ViewStyle },
  ],
} as const;

// ============================================================================
// Convenience Wrapper Components
// ============================================================================

interface ScreenSkeletonProps {
  /** Additional style for the container */
  style?: ViewStyle;
}

/**
 * Skeleton loader for Shot screen loading state
 */
export function ShotScreenSkeleton({ style }: ScreenSkeletonProps) {
  const t = useTokens();
  return (
    <View style={[styles.screenContainer, { backgroundColor: t.colors.background }, style]}>
      {/* Hero Section */}
      <View style={styles.section}>
        <SkeletonLoader type="rectangle" height={100} borderRadius={16} />
      </View>

      {/* Environmental Conditions Card */}
      <View style={styles.section}>
        <SkeletonLoader type="rectangle" height={100} borderRadius={12} />
      </View>

      {/* Target Distance Input */}
      <View style={styles.section}>
        <SkeletonLoader type="rectangle" height={90} borderRadius={12} />
      </View>

      {/* 2x2 Metrics Grid */}
      <View style={[styles.section, styles.metricsGrid]}>
        <View style={styles.gridRow}>
          <View style={styles.gridCell}>
            <SkeletonLoader type="rectangle" height={80} borderRadius={12} />
          </View>
          <View style={styles.gridCell}>
            <SkeletonLoader type="rectangle" height={80} borderRadius={12} />
          </View>
        </View>
        <View style={styles.gridRow}>
          <View style={styles.gridCell}>
            <SkeletonLoader type="rectangle" height={80} borderRadius={12} />
          </View>
          <View style={styles.gridCell}>
            <SkeletonLoader type="rectangle" height={80} borderRadius={12} />
          </View>
        </View>
      </View>

      {/* Adjustment Display */}
      <View style={styles.section}>
        <SkeletonLoader type="rectangle" height={100} borderRadius={12} />
      </View>
    </View>
  );
}

/**
 * Skeleton loader for Wind screen loading state
 */
export function WindScreenSkeleton({ style }: ScreenSkeletonProps) {
  const t = useTokens();
  return (
    <View style={[styles.screenContainer, { backgroundColor: t.colors.background }, style]}>
      {/* Gradient Hero */}
      <View style={styles.section}>
        <SkeletonLoader type="rectangle" height={120} borderRadius={16} />
      </View>

      {/* Wind Compass/Visualization */}
      <View style={[styles.section, styles.centeredSection]}>
        <SkeletonLoader type="circle" width={180} height={180} />
      </View>

      {/* Weather Bar */}
      <View style={styles.section}>
        <View style={styles.weatherBar}>
          <SkeletonLoader type="rectangle" width={80} height={60} borderRadius={12} />
          <SkeletonLoader type="rectangle" width={80} height={60} borderRadius={12} />
          <SkeletonLoader type="rectangle" width={80} height={60} borderRadius={12} />
          <SkeletonLoader type="rectangle" width={80} height={60} borderRadius={12} />
        </View>
      </View>

      {/* Wind Details Card */}
      <View style={styles.section}>
        <SkeletonLoader type="rectangle" height={100} borderRadius={12} />
      </View>

      {/* Hourly Forecast */}
      <View style={styles.section}>
        <SkeletonLoader type="rectangle" width="40%" height={16} borderRadius={4} style={{ marginBottom: 12 }} />
        <View style={styles.forecastRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonLoader key={`forecast-${i}`} type="rectangle" width={56} height={72} borderRadius={8} />
          ))}
        </View>
      </View>
    </View>
  );
}

/**
 * Skeleton loader for Club Library screen loading state
 */
export function ClubsScreenSkeleton({ style }: ScreenSkeletonProps) {
  const t = useTokens();
  return (
    <View style={[styles.screenContainer, { backgroundColor: t.colors.background }, style]}>
      {/* Header Section */}
      <View style={styles.section}>
        <SkeletonLoader type="rectangle" width="50%" height={24} borderRadius={6} />
        <SkeletonLoader type="rectangle" width="30%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
      </View>

      {/* Stats Bar */}
      <View style={styles.section}>
        <View style={styles.statsBar}>
          <SkeletonLoader type="rectangle" width="30%" height={48} borderRadius={8} />
          <SkeletonLoader type="rectangle" width="30%" height={48} borderRadius={8} />
          <SkeletonLoader type="rectangle" width="30%" height={48} borderRadius={8} />
        </View>
      </View>

      {/* Club List */}
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={`club-${i}`} style={styles.section}>
          <View style={styles.clubRow}>
            <SkeletonLoader type="circle" width={48} height={48} />
            <View style={styles.clubInfo}>
              <SkeletonLoader type="rectangle" width="60%" height={18} borderRadius={4} />
              <SkeletonLoader type="rectangle" width="40%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
            <SkeletonLoader type="rectangle" width={60} height={28} borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Skeleton loader for Settings screen loading state
 */
export function SettingsScreenSkeleton({ style }: ScreenSkeletonProps) {
  const t = useTokens();
  return (
    <View style={[styles.screenContainer, { backgroundColor: t.colors.background }, style]}>
      {/* Profile Section */}
      <View style={[styles.section, styles.profileSection]}>
        <SkeletonLoader type="circle" width={72} height={72} />
        <SkeletonLoader type="rectangle" width="50%" height={20} borderRadius={4} style={{ marginTop: 12 }} />
        <SkeletonLoader type="rectangle" width="70%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
      </View>

      {/* Settings Groups */}
      {Array.from({ length: 3 }).map((_, groupIndex) => (
        <View key={`group-${groupIndex}`} style={styles.settingsGroup}>
          <SkeletonLoader type="rectangle" width="25%" height={12} borderRadius={4} style={{ marginBottom: 12 }} />
          {Array.from({ length: 3 }).map((_, rowIndex) => (
            <View key={`row-${groupIndex}-${rowIndex}`} style={styles.settingsRow}>
              <SkeletonLoader type="rectangle" width={24} height={24} borderRadius={6} />
              <SkeletonLoader type="rectangle" width="50%" height={16} borderRadius={4} style={{ marginLeft: 12 }} />
              <View style={styles.settingsRowRight}>
                <SkeletonLoader type="rectangle" width={48} height={28} borderRadius={14} />
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/**
 * Skeleton loader for a card with gradient placeholder
 */
export function CardSkeleton({
  height = 120,
  style
}: {
  height?: number;
  style?: ViewStyle;
}) {
  const t = useTokens();
  return (
    <View style={[styles.cardSkeleton, { backgroundColor: t.colors.surface, height }, style]}>
      <SkeletonLoader type="rectangle" width="40%" height={14} borderRadius={4} />
      <SkeletonLoader type="rectangle" width="70%" height={24} borderRadius={4} style={{ marginTop: 12 }} />
      <SkeletonLoader type="rectangle" width="50%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
    </View>
  );
}

/**
 * Skeleton loader for metric tiles
 */
export function MetricTileSkeleton({ style }: { style?: ViewStyle }) {
  const t = useTokens();
  return (
    <View style={[styles.metricTileSkeleton, { backgroundColor: t.colors.surface }, style]}>
      <View style={styles.metricHeader}>
        <SkeletonLoader type="circle" width={32} height={32} />
        <SkeletonLoader type="rectangle" width={60} height={12} borderRadius={4} style={{ marginLeft: 8 }} />
      </View>
      <SkeletonLoader type="rectangle" width="60%" height={26} borderRadius={4} style={{ marginTop: 12 }} />
    </View>
  );
}

/**
 * Skeleton loader for list items
 */
export function ListItemSkeleton({
  count = 1,
  style
}: {
  count?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={`list-item-${index}`} style={styles.listItemSkeleton}>
          <SkeletonLoader type="circle" width={40} height={40} />
          <View style={styles.listItemContent}>
            <SkeletonLoader type="rectangle" width="70%" height={16} borderRadius={4} />
            <SkeletonLoader type="rectangle" width="50%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Inline skeleton loader for replacing ActivityIndicator in text contexts
 */
export function InlineSkeleton({
  width = 60,
  height = 16,
  style
}: {
  width?: number;
  height?: number;
  style?: ViewStyle;
}) {
  return (
    <SkeletonLoader
      type="rectangle"
      width={width}
      height={height}
      borderRadius={4}
      style={style}
    />
  );
}

/**
 * Skeleton loader for buttons (to show where actions will appear)
 */
export function ButtonSkeleton({
  width = '100%',
  height = 52,
  style
}: {
  width?: DimensionValue;
  height?: number;
  style?: ViewStyle;
}) {
  return (
    <SkeletonLoader
      type="rectangle"
      width={width}
      height={height}
      borderRadius={12}
      style={style}
    />
  );
}

/**
 * Skeleton loader grid for multiple metric tiles
 */
export function MetricsGridSkeleton({
  columns = 2,
  rows = 2,
  style
}: {
  columns?: number;
  rows?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.metricsGrid, style]}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.gridRow}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <View key={`cell-${rowIndex}-${colIndex}`} style={styles.gridCell}>
              <MetricTileSkeleton />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    position: 'absolute',
    opacity: 0.6,
  },
  screenContainer: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  centeredSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsGrid: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCell: {
    flex: 1,
  },
  weatherBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  clubInfo: {
    flex: 1,
    marginLeft: 16,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  settingsGroup: {
    marginBottom: 24,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingsRowRight: {
    marginLeft: 'auto',
  },
  cardSkeleton: {
    borderRadius: 16,
    padding: 16,
  },
  metricTileSkeleton: {
    borderRadius: 16,
    padding: 12,
    minHeight: 90,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
});
