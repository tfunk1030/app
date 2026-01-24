import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import { getScrollPadding, getFlexibleMinHeight } from '@/src/utils/responsive';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo } from 'react';
import { Platform, Pressable, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useReduceMotionValue } from '@/src/hooks/useReduceMotion';
import { useReduceTransparencyValue } from '@/src/hooks/useReduceTransparency';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: boolean; // Enable gradient border effect
  intensity?: number; // Blur intensity (0-100)
  accent?: boolean; // Optional top accent bar
  glow?: boolean; // Enable glow shadow effect
  /** Use iOS 26+ Liquid Glass effect. Falls back to BlurView on:
   * - Non-iOS platforms (Android, web)
   * - iOS < 26
   * - When user has "Reduce Motion" accessibility enabled
   * - When user has "Reduce Transparency" accessibility enabled (uses solid background)
   */
  liquidGlass?: boolean;
  onPress?: () => void; // Optional press handler
  disabled?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  gradient = false,
  intensity = 20,
  accent = false,
  glow = false,
  liquidGlass = false,
  onPress,
  disabled = false,
}) => {
  const t = useTokens();
  const { isDark } = useThemeMode();
  const reduceMotion = useReduceMotionValue();
  const reduceTransparency = useReduceTransparencyValue();
  const padding = getScrollPadding(t.spacing.md, { minPadding: t.spacing.base, maxPadding: 20 });

  // Token-based border radius values for consistency
  const cardBorderRadius = t.borderRadius.xl; // 16
  const gradientBorderWidth = t.borderWidth.medium; // 1.5
  const innerBorderRadius = cardBorderRadius - gradientBorderWidth; // 14.5

  // Animation value for press feedback
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (onPress && !disabled) {
      scale.value = withSpring(0.98, {
        damping: t.animation.spring.damping,
        stiffness: t.animation.spring.stiffness,
        mass: t.animation.spring.mass,
      });
    }
  }, [onPress, disabled, scale, t.animation.spring]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, {
      damping: t.animation.spring.damping,
      stiffness: t.animation.spring.stiffness,
      mass: t.animation.spring.mass,
    });
  }, [scale, t.animation.spring]);

  // Determine shadow style based on glow prop
  // Uses CSS boxShadow for New Architecture with native shadow fallbacks
  const shadowStyle = useMemo(() => {
    const glowShadow = glow ? t.shadow.glow : t.shadow.card;

    return Platform.select({
      // iOS: Use native shadow properties (works on both old and new arch)
      ios: {
        shadowColor: glow ? t.colors.glowPrimary : glowShadow.shadowColor,
        shadowOffset: glowShadow.shadowOffset,
        shadowOpacity: glowShadow.shadowOpacity,
        shadowRadius: glowShadow.shadowRadius,
      },
      // Android: Use elevation (works on both old and new arch)
      android: {
        elevation: glowShadow.elevation,
      },
      // Web/default: Use CSS boxShadow (New Architecture)
      default: {
        boxShadow: glow
          ? `0 ${t.shadow.glow.shadowOffset.height}px ${t.shadow.glow.shadowRadius}px ${t.colors.glowPrimaryAlpha}`
          : `0 ${t.shadow.card.shadowOffset.height}px ${t.shadow.card.shadowRadius}px ${t.colors.shadowAlpha}`,
      },
    });
  }, [glow, t.shadow, t.colors]);

  // Memoized dynamic styles for consistent token-based styling
  const dynamicStyles = useMemo(() => ({
    card: {
      borderRadius: cardBorderRadius,
      overflow: 'hidden' as const,
    },
    gradientBorder: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: cardBorderRadius,
    },
    blurContainer: {
      flex: 1,
      borderRadius: cardBorderRadius,
      overflow: 'hidden' as const,
    },
    lightContainer: {
      flex: 1,
      borderRadius: cardBorderRadius,
      overflow: 'hidden' as const,
    },
    withGradientBorder: {
      margin: gradientBorderWidth,
      borderRadius: innerBorderRadius,
    },
    glassInner: {
      flex: 1,
      borderRadius: innerBorderRadius,
      overflow: 'hidden' as const,
    },
    accent: {
      height: 3,
      width: '100%' as const,
    },
  }), [cardBorderRadius, gradientBorderWidth, innerBorderRadius]);

  const cardContent = (
    <>
      {/* Gradient border effect */}
      {gradient && (
        <LinearGradient
          colors={t.gradients.primary as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={dynamicStyles.gradientBorder}
        />
      )}

      {/* Glassmorphism background */}
      {isDark ? (
        // Check for Reduce Transparency accessibility setting - use solid background
        reduceTransparency ? (
          // Solid background fallback for Reduce Transparency accessibility
          <View
            style={[
              dynamicStyles.lightContainer,
              gradient && dynamicStyles.withGradientBorder,
              {
                backgroundColor: t.colors.surface,
                borderColor: gradient ? 'transparent' : t.colors.border,
                borderWidth: gradient ? 0 : t.borderWidth.thin,
              },
            ]}
          >
            {accent && (
              <LinearGradient
                colors={t.gradients.primary as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={dynamicStyles.accent}
              />
            )}
            <View style={{ padding }}>{children}</View>
          </View>
        ) : liquidGlass && Platform.OS === 'ios' && !reduceMotion ? (
          // iOS 26+ Liquid Glass effect via expo-glass-effect
          // Respects user's reduce motion and reduce transparency preferences
          <GlassView
            style={[
              dynamicStyles.blurContainer,
              gradient && dynamicStyles.withGradientBorder,
            ]}
          >
            <View
              style={[
                dynamicStyles.glassInner,
                {
                  backgroundColor: 'transparent',
                  borderColor: gradient ? 'transparent' : t.colors.border,
                  borderWidth: gradient ? 0 : t.borderWidth.thin,
                },
              ]}
            >
              {accent && (
                <LinearGradient
                  colors={t.gradients.primary as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={dynamicStyles.accent}
                />
              )}
              <View style={{ padding }}>{children}</View>
            </View>
          </GlassView>
        ) : (
          // Fallback to BlurView for non-liquidGlass or non-iOS
          <BlurView
            intensity={intensity}
            tint="dark"
            style={[
              dynamicStyles.blurContainer,
              gradient && dynamicStyles.withGradientBorder,
            ]}
          >
            <View
              style={[
                dynamicStyles.glassInner,
                {
                  backgroundColor: t.colors.surfaceGlass,
                  borderColor: gradient ? 'transparent' : t.colors.border,
                  borderWidth: gradient ? 0 : t.borderWidth.thin,
                },
              ]}
            >
              {accent && (
                <LinearGradient
                  colors={t.gradients.primary as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={dynamicStyles.accent}
                />
              )}
              <View style={{ padding }}>{children}</View>
            </View>
          </BlurView>
        )
      ) : (
        <View
          style={[
            dynamicStyles.lightContainer,
            gradient && dynamicStyles.withGradientBorder,
            {
              backgroundColor: t.colors.surface,
              borderColor: gradient ? 'transparent' : t.colors.border,
              borderWidth: gradient ? 0 : t.borderWidth.thin,
            },
          ]}
        >
          {accent && (
            <LinearGradient
              colors={t.gradients.primary as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={dynamicStyles.accent}
            />
          )}
          <View style={{ padding }}>{children}</View>
        </View>
      )}
    </>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        style={[
          dynamicStyles.card,
          shadowStyle,
          { minHeight: getFlexibleMinHeight(60) },
          animatedStyle,
          style,
        ]}
      >
        {cardContent}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View
      style={[
        dynamicStyles.card,
        shadowStyle,
        { minHeight: getFlexibleMinHeight(60) },
        style,
      ]}
    >
      {cardContent}
    </Animated.View>
  );
};
