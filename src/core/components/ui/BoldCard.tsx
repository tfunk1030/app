import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import { getScrollPadding, getFlexibleMinHeight } from '@/src/utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { gradients, boldColors } from '@/src/theme/gradients';
import { useReduceMotionValue } from '@/src/hooks/useReduceMotion';
import { springConfigs } from '@/src/theme/animations';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type CardVariant = 'default' | 'elevated' | 'highlight' | 'premium';

interface BoldCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: CardVariant; // Card style variant
  gradient?: boolean; // Enable gradient border effect
  accent?: boolean; // Optional top accent bar
  glow?: boolean; // Enable glow shadow effect
  glowColor?: 'primary' | 'cyan' | 'amber' | 'violet'; // Glow color variant
  onPress?: () => void; // Optional press handler
  disabled?: boolean;
}

/**
 * BoldCard - Modern card component with Bold & Colorful design language
 *
 * Replaces GlassCard's glassmorphism with gradient surfaces and vibrant accents.
 * Uses the gradient system for consistent theming across the app.
 *
 * @example
 * // Basic usage
 * <BoldCard>
 *   <Text>Content</Text>
 * </BoldCard>
 *
 * @example
 * // With gradient border and accent
 * <BoldCard variant="elevated" gradient accent>
 *   <Text>Premium Content</Text>
 * </BoldCard>
 *
 * @example
 * // Interactive card with glow
 * <BoldCard glow glowColor="cyan" onPress={() => handlePress()}>
 *   <Text>Tap me</Text>
 * </BoldCard>
 */
export const BoldCard: React.FC<BoldCardProps> = ({
  children,
  style,
  variant = 'default',
  gradient = false,
  accent = false,
  glow = false,
  glowColor = 'primary',
  onPress,
  disabled = false,
}) => {
  const t = useTokens();
  const { isDark } = useThemeMode();
  const reduceMotion = useReduceMotionValue();
  const padding = getScrollPadding(16, { minPadding: 12, maxPadding: 20 });

  // Animation values
  const scale = useSharedValue(1);
  const isPressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (onPress && !disabled) {
      // Use stiff spring for immediate response without prolonged bouncing
      // Skip animation entirely if reduce motion is enabled
      scale.value = reduceMotion ? 0.98 : withSpring(0.98, springConfigs.stiff);
      isPressed.value = true;
    }
  }, [onPress, disabled, scale, isPressed, reduceMotion]);

  const handlePressOut = useCallback(() => {
    // Use stiff spring for quick settling
    scale.value = reduceMotion ? 1 : withSpring(1, springConfigs.stiff);
    isPressed.value = false;
  }, [scale, isPressed, reduceMotion]);

  // Determine glow color based on prop
  const getGlowColor = () => {
    switch (glowColor) {
      case 'cyan':
        return boldColors.glowCyan;
      case 'amber':
        return boldColors.glowAmber;
      case 'violet':
        return boldColors.glowViolet;
      case 'primary':
      default:
        return boldColors.glowEmerald;
    }
  };

  // Determine shadow style based on glow prop
  const shadowStyle = glow
    ? {
        shadowColor: getGlowColor(),
        shadowOffset: t.shadow.glow.shadowOffset,
        shadowOpacity: t.shadow.glow.shadowOpacity,
        shadowRadius: t.shadow.glow.shadowRadius,
        elevation: t.shadow.glow.elevation,
      }
    : {
        shadowColor: t.colors.shadow,
        shadowOffset: t.shadow.card.shadowOffset,
        shadowOpacity: t.shadow.card.shadowOpacity,
        shadowRadius: t.shadow.card.shadowRadius,
        elevation: t.shadow.card.elevation,
      };

  // Get surface gradient colors based on variant and theme
  const getSurfaceGradient = (): readonly [string, string, ...string[]] => {
    if (variant === 'highlight') {
      return gradients.surface.highlight;
    }
    if (variant === 'premium') {
      return isDark
        ? [boldColors.slate800, boldColors.slate900]
        : gradients.surface.light;
    }
    if (variant === 'elevated') {
      return isDark ? gradients.surface.elevated : gradients.surface.light;
    }
    // Default variant
    return isDark ? gradients.surface.dark : gradients.surface.light;
  };

  // Get accent gradient based on variant
  const getAccentGradient = (): readonly [string, string, ...string[]] => {
    if (variant === 'premium') {
      return gradients.button.premium;
    }
    return gradients.primary;
  };

  const cardContent = (
    <>
      {/* Gradient border effect */}
      {gradient && (
        <LinearGradient
          colors={
            variant === 'premium'
              ? (gradients.button.premium as [string, string, ...string[]])
              : (gradients.primary as [string, string, ...string[]])
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        />
      )}

      {/* Surface gradient background */}
      <LinearGradient
        colors={getSurfaceGradient() as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.surfaceContainer,
          gradient && styles.withGradientBorder,
          !gradient && {
            borderColor: t.colors.border,
            borderWidth: 1,
          },
        ]}
      >
        {/* Top accent bar */}
        {accent && (
          <LinearGradient
            colors={getAccentGradient() as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.accent}
          />
        )}
        <View style={[styles.inner, { padding }]}>{children}</View>
      </LinearGradient>
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
          styles.card,
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
        styles.card,
        shadowStyle,
        { minHeight: getFlexibleMinHeight(60) },
        style,
      ]}
    >
      {cardContent}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  surfaceContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  withGradientBorder: {
    margin: 1.5, // Creates the gradient border effect
    borderRadius: 14.5,
  },
  accent: {
    height: 3,
    width: '100%',
  },
  inner: {},
});
