/**
 * Skeleton Loading Components
 *
 * Provides animated skeleton placeholders for loading states.
 * Uses a subtle shimmer effect that respects reduced motion preferences.
 */

import { useAccessibleAnimations } from '@/src/hooks/useAccessibility';
import { useTokens } from '@/src/theme/useTokens';
import { getScrollPadding } from '@/src/utils/responsive';
import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Basic skeleton placeholder with shimmer animation
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const tokens = useTokens();
  const { prefersReducedMotion } = useAccessibleAnimations();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (!prefersReducedMotion) {
      shimmer.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [prefersReducedMotion, shimmer]);

  const animatedStyle = useAnimatedStyle(() => {
    if (prefersReducedMotion) {
      return { opacity: 0.7 };
    }
    return {
      opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.5, 0.8, 0.5]),
    };
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: tokens.colors.surfaceAlt,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

/**
 * Card-shaped skeleton that matches GlassCard dimensions
 */
export const SkeletonCard: React.FC<{ height?: number; style?: ViewStyle }> = ({
  height = 120,
  style,
}) => {
  const tokens = useTokens();
  const padding = getScrollPadding(16, { minPadding: 12, maxPadding: 20 });

  return (
    <View
      style={[
        styles.card,
        {
          height,
          backgroundColor: tokens.colors.surface,
          borderColor: tokens.colors.border,
          padding,
        },
        style,
      ]}
    >
      <View style={styles.cardContent}>
        <Skeleton width={120} height={16} style={{ marginBottom: 12 }} />
        <Skeleton width="60%" height={32} style={{ marginBottom: 8 }} />
        <Skeleton width="40%" height={14} />
      </View>
    </View>
  );
};

/**
 * Hero card skeleton for main display cards
 */
export const SkeletonHeroCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const tokens = useTokens();
  const padding = getScrollPadding(16, { minPadding: 12, maxPadding: 20 });

  return (
    <View
      style={[
        styles.card,
        styles.heroCard,
        {
          backgroundColor: tokens.colors.surface,
          borderColor: tokens.colors.border,
          padding,
        },
        style,
      ]}
    >
      <View style={styles.heroContent}>
        <Skeleton width={64} height={64} borderRadius={20} style={{ marginRight: 16 }} />
        <View style={styles.heroText}>
          <Skeleton width={100} height={14} style={{ marginBottom: 8 }} />
          <Skeleton width={140} height={48} />
        </View>
      </View>
    </View>
  );
};

/**
 * Grid of metric tile skeletons (2x2)
 */
export const SkeletonMetricsGrid: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={[styles.gridContainer, style]}>
      <View style={styles.gridRow}>
        <SkeletonMetricTile />
        <SkeletonMetricTile />
      </View>
      <View style={styles.gridRow}>
        <SkeletonMetricTile />
        <SkeletonMetricTile />
      </View>
    </View>
  );
};

/**
 * Single metric tile skeleton
 */
export const SkeletonMetricTile: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const tokens = useTokens();
  const padding = getScrollPadding(12, { minPadding: 10, maxPadding: 16 });

  return (
    <View
      style={[
        styles.metricTile,
        {
          backgroundColor: tokens.colors.surface,
          borderColor: tokens.colors.border,
          padding,
        },
        style,
      ]}
    >
      <View style={styles.metricHeader}>
        <Skeleton width={32} height={32} borderRadius={16} style={{ marginRight: 8 }} />
        <Skeleton width={60} height={13} />
      </View>
      <Skeleton width={80} height={26} style={{ marginTop: 8 }} />
    </View>
  );
};

/**
 * Text line skeleton for lists
 */
export const SkeletonText: React.FC<{
  lines?: number;
  lastLineWidth?: number | `${number}%`;
  style?: ViewStyle;
}> = ({ lines = 3, lastLineWidth = '60%' as const, style }) => {
  return (
    <View style={style}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : ('100%' as const)}
          height={14}
          style={{ marginBottom: index < lines - 1 ? 8 : 0 }}
        />
      ))}
    </View>
  );
};

/**
 * Screen loading state with header and cards
 */
export const SkeletonScreen: React.FC<{
  showHero?: boolean;
  cardCount?: number;
}> = ({ showHero = true, cardCount = 2 }) => {
  const padding = getScrollPadding(16, { minPadding: 12, maxPadding: 20 });

  return (
    <View style={[styles.screen, { paddingHorizontal: padding }]}>
      {/* Header skeleton */}
      <View style={styles.header}>
        <Skeleton width={200} height={32} style={{ marginBottom: 4 }} />
        <Skeleton width={160} height={15} />
      </View>

      {/* Hero card */}
      {showHero && <SkeletonHeroCard style={{ marginBottom: 16 }} />}

      {/* Metrics grid */}
      <SkeletonMetricsGrid style={{ marginBottom: 16 }} />

      {/* Additional cards */}
      {Array.from({ length: cardCount }).map((_, index) => (
        <SkeletonCard key={index} height={100} style={{ marginBottom: 16 }} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  heroCard: {
    marginBottom: 16,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroText: {
    flex: 1,
  },
  gridContainer: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricTile: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 90,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  screen: {
    flex: 1,
    paddingTop: 16,
  },
  header: {
    marginBottom: 24,
  },
});
