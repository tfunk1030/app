import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useReduceMotionValue } from '@/src/hooks/useReduceMotion';
import { Button } from '@/src/core/components/ui/button';
import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import { gradients, boldColors, GradientColors } from '@/src/theme/gradients';
import { scaledFontSize } from '@/src/utils/responsive';
import { LucideIcon } from 'lucide-react-native';

type EmptyStateVariant = 'default' | 'elevated' | 'subtle';
type GlowColor = 'primary' | 'cyan' | 'amber' | 'violet';

interface EmptyStateProps {
  /** Title displayed prominently */
  title?: string;
  /** Descriptive message below the title */
  message?: string;
  /** Lucide icon component to display */
  icon?: LucideIcon;
  /** Text for the action button */
  actionLabel?: string;
  /** Callback when action button is pressed */
  onAction?: () => void | Promise<void>;
  /** Gradient colors for the icon background */
  gradientColors?: GradientColors;
  /** Style variant for the empty state */
  variant?: EmptyStateVariant;
  /** Enable glow effect on the icon */
  glow?: boolean;
  /** Glow color variant */
  glowColor?: GlowColor;
  /** Show animated pulse on the icon */
  animated?: boolean;
  /** Additional container styles */
  style?: ViewStyle;
}

/**
 * EmptyState - Bold & Colorful empty state component
 *
 * Displays a visually engaging empty state with gradient icon,
 * supportive message, and optional action button to guide users.
 *
 * @example
 * // Basic usage
 * <EmptyState
 *   icon={FolderIcon}
 *   title="No clubs yet"
 *   message="Add your first club to get started"
 *   actionLabel="Add Club"
 *   onAction={() => navigation.navigate('AddClub')}
 * />
 *
 * @example
 * // With glow effect
 * <EmptyState
 *   icon={WindIcon}
 *   title="No wind data"
 *   glow
 *   glowColor="cyan"
 *   variant="elevated"
 * />
 */
export function EmptyState({
  title = 'Nothing here yet',
  message,
  icon: Icon,
  actionLabel = 'Get Started',
  onAction,
  gradientColors = gradients.primary,
  variant = 'default',
  glow = false,
  glowColor = 'primary',
  animated = false,
  style,
}: EmptyStateProps) {
  const t = useTokens();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark' || mode === 'system';
  const reduceMotion = useReduceMotionValue();

  // Animation for subtle pulse effect
  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    // Skip continuous animations if reduce motion is enabled
    if (reduceMotion) {
      pulseScale.value = 1;
      return;
    }

    if (animated) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }

    // Cleanup: cancel animation on unmount to prevent memory leaks
    return () => {
      cancelAnimation(pulseScale);
    };
  }, [animated, pulseScale, reduceMotion]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Get glow color based on prop
  const getGlowColor = (): string => {
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

  // Shadow style with optional glow
  const iconShadowStyle = glow
    ? {
        shadowColor: getGlowColor(),
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 12,
      }
    : {
        shadowColor: isDark ? '#000' : boldColors.slate900,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
      };

  // Get surface gradient based on variant
  const getSurfaceGradient = (): GradientColors => {
    if (variant === 'elevated') {
      return isDark ? gradients.surface.elevated : gradients.surface.light;
    }
    if (variant === 'subtle') {
      return isDark ? gradients.surface.dark : gradients.surface.light;
    }
    // Default - transparent
    return ['transparent', 'transparent'] as GradientColors;
  };

  // Get entering animation or undefined if reduce motion is enabled
  const getEnteringAnimation = (delay: number) =>
    reduceMotion ? undefined : FadeInDown.duration(500).delay(delay);

  const containerContent = (
    <>
      {Icon && (
        <Animated.View
          entering={reduceMotion ? undefined : FadeInDown.duration(500).delay(100).springify()}
          style={[styles.iconWrapper, iconShadowStyle, iconAnimatedStyle]}
        >
          <LinearGradient
            colors={gradientColors as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <Icon size={40} color="#FFFFFF" strokeWidth={2} />
          </LinearGradient>
        </Animated.View>
      )}

      <Animated.Text
        entering={getEnteringAnimation(200)}
        style={[styles.title, { color: t.colors.textPrimary }]}
      >
        {title}
      </Animated.Text>

      {message ? (
        <Animated.Text
          entering={getEnteringAnimation(300)}
          style={[styles.message, { color: t.colors.textMuted }]}
        >
          {message}
        </Animated.Text>
      ) : null}

      {onAction && (
        <Animated.View entering={getEnteringAnimation(400)}>
          <Button variant="default" onPress={onAction}>
            {actionLabel}
          </Button>
        </Animated.View>
      )}
    </>
  );

  // For elevated/subtle variants, wrap in gradient surface
  if (variant !== 'default') {
    return (
      <Animated.View
        entering={reduceMotion ? undefined : FadeIn.duration(400)}
        accessibilityRole="text"
        accessibilityLabel={title}
        style={[styles.container, style]}
      >
        <LinearGradient
          colors={getSurfaceGradient() as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[
            styles.surfaceContainer,
            {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              borderWidth: 1,
            },
          ]}
        >
          <View style={styles.innerContent}>{containerContent}</View>
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(400)}
      accessibilityRole="text"
      accessibilityLabel={title}
      style={[styles.container, style]}
    >
      {containerContent}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  surfaceContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 340,
  },
  innerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconWrapper: {
    marginBottom: 24,
    borderRadius: 44,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: scaledFontSize(22),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: scaledFontSize(15),
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
    maxWidth: 280,
  },
});
