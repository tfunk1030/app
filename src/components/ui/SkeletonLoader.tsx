/**
 * SkeletonLoader.tsx
 *
 * A component that displays skeleton loading states for various UI elements
 * to improve perceived performance and user experience during data loading.
 */

import { useTokens } from '@/src/theme/useTokens';
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
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animate && isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnimation, { toValue: 1, duration: 1200, useNativeDriver: false }),
          Animated.timing(shimmerAnimation, { toValue: 0, duration: 1200, useNativeDriver: false }),
        ])
      ).start();
    } else {
      shimmerAnimation.setValue(0);
    }
    return () => {
      shimmerAnimation.stopAnimation();
    };
  }, [animate, isLoading, shimmerAnimation]);

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

  const getSkeletonStyle = (type: SkeletonType, index = 0): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: t.colors.surfaceAlt,
      width,
      height,
      borderRadius,
      overflow: 'hidden',
      marginBottom: index < count - 1 ? spacing : 0,
    };

    switch (type) {
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
      {animate && (
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

export const SkeletonLayouts = {
  card: [
    { width: '100%', height: 120, borderRadius: 12 },
    { width: '70%', height: 20, borderRadius: 4, style: { marginTop: 12 } },
    { width: '40%', height: 16, borderRadius: 4, style: { marginTop: 8 } },
  ],
  profile: [
    { width: 60, height: 60, borderRadius: 30, style: { alignSelf: 'center' } },
    { width: '60%', height: 18, borderRadius: 4, style: { marginTop: 12, alignSelf: 'center' } },
    { width: '80%', height: 14, borderRadius: 4, style: { marginTop: 8, alignSelf: 'center' } },
  ],
  listItem: [
    { width: 40, height: 40, borderRadius: 20, style: { marginRight: 12 } },
    { width: '70%', height: 16, borderRadius: 4 },
    { width: '50%', height: 12, borderRadius: 4, style: { marginTop: 6 } },
  ],
  windResult: [
    { width: '100%', height: 60, borderRadius: 12 },
    { width: '80%', height: 24, borderRadius: 4, style: { marginTop: 16 } },
    { width: '60%', height: 16, borderRadius: 4, style: { marginTop: 8 } },
    { width: '100%', height: 100, borderRadius: 12, style: { marginTop: 16 } },
  ],
} as const;

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
});
