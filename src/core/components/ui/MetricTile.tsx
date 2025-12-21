import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import {
  safeScaledFontSize,
  getScrollPadding,
  getTouchTargetSize,
  getIconSize,
} from '@/src/utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface MetricTileProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string; // Separate unit for styled rendering
  style?: ViewStyle;
  highlight?: boolean; // Enable glow border effect
  trend?: 'up' | 'down' | 'neutral'; // Optional trend indicator
  onPress?: () => void;
}

export const MetricTile: React.FC<MetricTileProps> = ({
  icon,
  label,
  value,
  unit,
  style,
  highlight = false,
  trend,
  onPress,
}) => {
  const tokens = useTokens();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark' || mode === 'system';

  // Animation values
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (onPress) {
      scale.value = withSpring(0.98, {
        damping: tokens.animation.spring.damping,
        stiffness: tokens.animation.spring.stiffness,
        mass: tokens.animation.spring.mass,
      });
    }
  }, [onPress, scale, tokens.animation.spring]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, {
      damping: tokens.animation.spring.damping,
      stiffness: tokens.animation.spring.stiffness,
      mass: tokens.animation.spring.mass,
    });
  }, [scale, tokens.animation.spring]);

  // Use responsive padding that adapts to fontScale
  const padding = getScrollPadding(16, { minPadding: 12, maxPadding: 20 });
  const iconContainerSize = getIconSize(32);

  // Determine trend color
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return tokens.colors.success;
      case 'down':
        return tokens.colors.danger;
      default:
        return tokens.colors.textMuted;
    }
  };

  // Shadow style for highlight effect
  const getShadowStyle = (): ViewStyle => {
    if (highlight && isDark) {
      return {
        shadowColor: tokens.colors.glowPrimary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
      };
    }
    return {
      shadowColor: tokens.colors.shadow,
      shadowOffset: tokens.shadow.subtle.shadowOffset,
      shadowOpacity: tokens.shadow.subtle.shadowOpacity,
      shadowRadius: tokens.shadow.subtle.shadowRadius,
      elevation: tokens.shadow.subtle.elevation,
    };
  };

  const content = (
    <>
      {/* Gradient border for highlight */}
      {highlight && isDark && (
        <LinearGradient
          colors={tokens.gradients.primary as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        />
      )}

      <View
        style={[
          styles.innerCard,
          {
            backgroundColor: isDark ? tokens.colors.surface : tokens.colors.surfaceAlt,
            borderColor: highlight && isDark ? 'transparent' : tokens.colors.border,
            borderWidth: highlight && isDark ? 0 : 1,
            padding: padding,
          },
          highlight && isDark && styles.withGradientBorder,
        ]}
      >
        <View
          style={[
            styles.header,
            { marginBottom: getScrollPadding(8, { minPadding: 6, maxPadding: 10 }) },
          ]}
        >
          {/* Icon with gradient background */}
          <View
            style={[
              styles.iconContainer,
              {
                width: iconContainerSize,
                height: iconContainerSize,
                borderRadius: iconContainerSize / 2,
              },
            ]}
          >
            <LinearGradient
              colors={
                isDark
                  ? (tokens.gradients.surface as [string, string, ...string[]])
                  : ['rgba(16, 185, 129, 0.1)', 'rgba(6, 182, 212, 0.1)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              {icon}
            </LinearGradient>
          </View>
          <Text
            style={[
              styles.label,
              {
                color: tokens.colors.textMuted,
                fontSize: safeScaledFontSize(13, { maxScale: 1.2 }),
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.5}
          >
            {label}
          </Text>
        </View>

        {/* Value with separate unit styling */}
        <View style={styles.valueContainer}>
          <Text
            style={[
              styles.value,
              {
                color: trend ? getTrendColor() : tokens.colors.textPrimary,
                fontSize: safeScaledFontSize(26, { maxScale: 1.15 }),
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.5}
          >
            {value}
          </Text>
          {unit && (
            <Text
              style={[
                styles.unit,
                {
                  color: tokens.colors.textMuted,
                  fontSize: safeScaledFontSize(14, { maxScale: 1.15 }),
                },
              ]}
            >
              {unit}
            </Text>
          )}
        </View>
      </View>
    </>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, getShadowStyle(), animatedStyle, style]}
        accessible
        accessibilityLabel={`${label} ${value}${unit ? ` ${unit}` : ''}`}
        accessibilityRole="button"
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View
      style={[styles.card, getShadowStyle(), style]}
      accessible
      accessibilityLabel={`${label} ${value}${unit ? ` ${unit}` : ''}`}
    >
      {content}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: getTouchTargetSize(44),
  },
  gradientBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  innerCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  withGradientBorder: {
    margin: 1.5,
    borderRadius: 14.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    overflow: 'hidden',
    marginRight: 10,
  },
  iconGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  label: {
    flex: 1,
    flexShrink: 1,
    flexWrap: 'nowrap',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontWeight: '700',
    flexWrap: 'nowrap',
    letterSpacing: -0.5,
    // Use system monospace font for metrics
    ...Platform.select({
      ios: {
        fontFamily: 'Menlo',
      },
      android: {
        fontFamily: 'monospace',
      },
    }),
  },
  unit: {
    marginLeft: 4,
    fontWeight: '500',
  },
});
