/**
 * OnboardingStep Component
 *
 * Individual step component for the onboarding flow.
 * Displays an icon, title, and description with Bold & Colorful styling.
 *
 * Usage:
 * <OnboardingStep
 *   icon={Target}
 *   title="Shot Calculator"
 *   description="Get precise yardage adjustments based on conditions"
 *   accentColor={boldColors.emerald}
 * />
 */

import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import { gradients, boldColors, GradientColors } from '@/src/theme/gradients';
import { scaledFontSize, moderateScale } from '@/src/utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ViewStyle,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useReduceMotionValue } from '@/src/hooks/useReduceMotion';
import { LucideIcon } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingStepProps {
  /** Lucide icon to display */
  icon: LucideIcon;
  /** Main title for this step */
  title: string;
  /** Description text explaining the feature */
  description: string;
  /** Accent color for the icon background glow */
  accentColor?: string;
  /** Custom gradient colors for icon background */
  gradientColors?: GradientColors;
  /** Whether this step is currently active (for animations) */
  isActive?: boolean;
  /** Step number (1-based) */
  stepNumber?: number;
  /** Total number of steps */
  totalSteps?: number;
  /** Additional container styles */
  style?: ViewStyle;
}

/**
 * OnboardingStep - Individual step in the onboarding flow
 *
 * Features gradient icon backgrounds, animated entrance, and Bold & Colorful styling.
 *
 * @example
 * // Basic usage
 * <OnboardingStep
 *   icon={Target}
 *   title="Precision Yardage"
 *   description="Get exact adjustments for every shot"
 * />
 *
 * @example
 * // With custom accent
 * <OnboardingStep
 *   icon={Wind}
 *   title="Wind Analysis"
 *   description="Real-time wind data integration"
 *   accentColor={boldColors.cyan}
 *   gradientColors={gradients.hero.wind}
 * />
 */
export const OnboardingStep: React.FC<OnboardingStepProps> = ({
  icon: IconComponent,
  title,
  description,
  accentColor = boldColors.emerald,
  gradientColors = gradients.primary,
  isActive = true,
  stepNumber,
  totalSteps,
  style,
}) => {
  const t = useTokens();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark' || mode === 'system';
  const reduceMotion = useReduceMotionValue();

  // Subtle pulse animation for active step icon
  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    // Skip continuous animations if reduce motion is enabled
    if (reduceMotion) {
      pulseScale.value = 1;
      return;
    }

    if (isActive) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
    }

    // Cleanup: cancel animation on unmount to prevent memory leaks
    return () => {
      cancelAnimation(pulseScale);
    };
  }, [isActive, pulseScale, reduceMotion]);

  // Helper to get entering animation based on reduce motion preference
  const getEntering = (delay: number, duration = 400) =>
    reduceMotion ? undefined : FadeInUp.delay(delay).duration(duration);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Calculate icon container size based on screen
  const iconSize = Math.min(SCREEN_WIDTH * 0.35, 140);

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(400)}
      style={[
        styles.container,
        {
          width: SCREEN_WIDTH,
          paddingHorizontal: 32,
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${title}: ${description}`}
    >
      {/* Step indicator */}
      {stepNumber && totalSteps && (
        <Animated.View
          entering={getEntering(100, 300)}
          style={styles.stepIndicatorContainer}
        >
          <Text
            style={[
              styles.stepIndicator,
              { color: isDark ? t.colors.textMuted : boldColors.slate700 },
            ]}
          >
            {stepNumber} of {totalSteps}
          </Text>
        </Animated.View>
      )}

      {/* Icon with gradient background */}
      <Animated.View
        entering={getEntering(200)}
        style={[
          styles.iconWrapper,
          iconAnimatedStyle,
          {
            width: iconSize,
            height: iconSize,
            borderRadius: iconSize / 2,
            shadowColor: accentColor,
          },
        ]}
      >
        <LinearGradient
          colors={gradientColors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.iconGradient,
            {
              width: iconSize,
              height: iconSize,
              borderRadius: iconSize / 2,
            },
          ]}
        >
          <IconComponent
            size={iconSize * 0.45}
            color="#FFFFFF"
            strokeWidth={1.5}
          />
        </LinearGradient>
      </Animated.View>

      {/* Title */}
      <Animated.Text
        entering={getEntering(300)}
        style={[
          styles.title,
          {
            color: isDark ? t.colors.textPrimary : boldColors.slate900,
            fontSize: scaledFontSize(28),
          },
        ]}
      >
        {title}
      </Animated.Text>

      {/* Description */}
      <Animated.Text
        entering={getEntering(400)}
        style={[
          styles.description,
          {
            color: isDark ? t.colors.textMuted : boldColors.slate700,
            fontSize: scaledFontSize(16),
          },
        ]}
      >
        {description}
      </Animated.Text>

      {/* Decorative accent line */}
      <Animated.View
        entering={getEntering(500)}
        style={styles.accentContainer}
      >
        <LinearGradient
          colors={[accentColor, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.accentLine}
        />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  stepIndicatorContainer: {
    position: 'absolute',
    top: 24,
    alignSelf: 'center',
  },
  stepIndicator: {
    fontSize: scaledFontSize(13),
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  iconGradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
    marginBottom: 24,
  },
  accentContainer: {
    width: 80,
    alignItems: 'center',
  },
  accentLine: {
    height: 3,
    width: '100%',
    borderRadius: 2,
  },
});

export default OnboardingStep;
