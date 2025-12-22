import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import {
  safeScaledFontSize,
  getScrollPadding,
  getTouchTargetSize,
  getIconSize,
} from '@/src/utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo } from 'react';
import { Pressable, Text, View, ViewStyle, Platform } from 'react-native';
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
  const t = useTokens();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark' || mode === 'system';

  // Token-based border radius values for consistency with GlassCard
  const cardBorderRadius = t.borderRadius.xl; // 16
  const gradientBorderWidth = t.borderWidth.medium; // 1.5
  const innerBorderRadius = cardBorderRadius - gradientBorderWidth; // 14.5

  // Animation values
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (onPress) {
      scale.value = withSpring(0.98, {
        damping: t.animation.spring.damping,
        stiffness: t.animation.spring.stiffness,
        mass: t.animation.spring.mass,
      });
    }
  }, [onPress, scale, t.animation.spring]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, {
      damping: t.animation.spring.damping,
      stiffness: t.animation.spring.stiffness,
      mass: t.animation.spring.mass,
    });
  }, [scale, t.animation.spring]);

  // Use responsive padding that adapts to fontScale (using token values)
  const padding = getScrollPadding(t.spacing.md, { minPadding: t.spacing.base, maxPadding: 20 });
  const iconContainerSize = getIconSize(t.containerSize.icon.sm);

  // Determine trend color
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return t.colors.success;
      case 'down':
        return t.colors.danger;
      default:
        return t.colors.textMuted;
    }
  };

  // Shadow style for highlight effect (using token values)
  const getShadowStyle = (): ViewStyle => {
    if (highlight && isDark) {
      return {
        shadowColor: t.shadow.glow.shadowColor,
        shadowOffset: t.shadow.glow.shadowOffset,
        shadowOpacity: t.shadow.glow.shadowOpacity * 0.65, // Slightly reduced for tiles
        shadowRadius: t.shadow.glow.shadowRadius,
        elevation: t.shadow.glow.elevation,
      };
    }
    return {
      shadowColor: t.colors.shadow,
      shadowOffset: t.shadow.subtle.shadowOffset,
      shadowOpacity: t.shadow.subtle.shadowOpacity,
      shadowRadius: t.shadow.subtle.shadowRadius,
      elevation: t.shadow.subtle.elevation,
    };
  };

  // Memoized dynamic styles for consistent token-based styling
  const dynamicStyles = useMemo(() => ({
    card: {
      borderRadius: cardBorderRadius,
      overflow: 'hidden' as const,
      minHeight: getTouchTargetSize(t.touchTarget.minimum),
    },
    gradientBorder: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: cardBorderRadius,
    },
    innerCard: {
      flex: 1,
      borderRadius: cardBorderRadius,
      overflow: 'hidden' as const,
    },
    withGradientBorder: {
      margin: gradientBorderWidth,
      borderRadius: innerBorderRadius,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    iconContainer: {
      overflow: 'hidden' as const,
      marginRight: t.spacing.sm + 2, // 10px spacing between icon and label
    },
    iconGradient: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: t.borderRadius.full,
    },
    label: {
      flex: 1,
      flexShrink: 1,
      flexWrap: 'nowrap' as const,
      fontWeight: t.fontWeight.medium,
      letterSpacing: t.letterSpacing.normal + 0.3, // Slightly wider for labels
    },
    valueContainer: {
      flexDirection: 'row' as const,
      alignItems: 'baseline' as const,
    },
    value: {
      fontWeight: t.fontWeight.bold,
      flexWrap: 'nowrap' as const,
      letterSpacing: t.letterSpacing.tight,
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
      marginLeft: t.spacing.xs,
      fontWeight: t.fontWeight.medium,
    },
  }), [cardBorderRadius, gradientBorderWidth, innerBorderRadius, t]);

  const content = (
    <>
      {/* Gradient border for highlight */}
      {highlight && isDark && (
        <LinearGradient
          colors={t.gradients.primary as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={dynamicStyles.gradientBorder}
        />
      )}

      <View
        style={[
          dynamicStyles.innerCard,
          {
            backgroundColor: isDark ? t.colors.surface : t.colors.surfaceAlt,
            borderColor: highlight && isDark ? 'transparent' : t.colors.border,
            borderWidth: highlight && isDark ? 0 : t.borderWidth.thin,
            padding: padding,
          },
          highlight && isDark && dynamicStyles.withGradientBorder,
        ]}
      >
        <View
          style={[
            dynamicStyles.header,
            { marginBottom: getScrollPadding(t.spacing.sm, { minPadding: 6, maxPadding: 10 }) },
          ]}
        >
          {/* Icon with gradient background */}
          <View
            style={[
              dynamicStyles.iconContainer,
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
                  ? (t.gradients.surface as [string, string, ...string[]])
                  : (t.gradients.iconBackground as [string, string, ...string[]])
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={dynamicStyles.iconGradient}
            >
              {icon}
            </LinearGradient>
          </View>
          <Text
            style={[
              dynamicStyles.label,
              {
                color: t.colors.textMuted,
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
        <View style={dynamicStyles.valueContainer}>
          <Text
            style={[
              dynamicStyles.value,
              {
                color: trend ? getTrendColor() : t.colors.textPrimary,
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
                dynamicStyles.unit,
                {
                  color: t.colors.textMuted,
                  fontSize: safeScaledFontSize(t.fontSize.sm, { maxScale: 1.15 }),
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
        style={[dynamicStyles.card, getShadowStyle(), animatedStyle, style]}
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
      style={[dynamicStyles.card, getShadowStyle(), style]}
      accessible
      accessibilityLabel={`${label} ${value}${unit ? ` ${unit}` : ''}`}
    >
      {content}
    </Animated.View>
  );
};
