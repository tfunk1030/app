/**
 * OnboardingFlow Component
 *
 * Full-screen onboarding flow for first-run experience.
 * Introduces key app features with bold visuals and smooth animations.
 *
 * Features:
 * - Shows on first app launch (persists completion to AsyncStorage)
 * - Introduces 3-5 key features with visual steps
 * - Skippable at any point
 * - Re-accessible from Settings
 *
 * Usage:
 * <OnboardingFlow
 *   visible={showOnboarding}
 *   onComplete={() => setShowOnboarding(false)}
 * />
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import { gradients, boldColors, GradientColors } from '@/src/theme/gradients';
import { animationPresets, durations } from '@/src/theme/animations';
import { useReduceMotionValue } from '@/src/hooks/useReduceMotion';
import { scaledFontSize, moderateScale } from '@/src/utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import {
  Target,
  Wind,
  Layers,
  Sliders,
  Sparkles,
  LucideIcon,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingStep } from './OnboardingStep';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// AsyncStorage key for onboarding completion
export const ONBOARDING_STORAGE_KEY = 'onboarding:completed';

/**
 * Onboarding step data structure
 */
interface OnboardingStepData {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  accentColor: string;
  gradientColors: GradientColors;
}

/**
 * Default onboarding steps introducing key app features
 */
const DEFAULT_STEPS: OnboardingStepData[] = [
  {
    id: 'shot-calculator',
    icon: Target,
    title: 'Precision Shot Calculator',
    description:
      'Get accurate yardage adjustments based on wind, elevation, and environmental conditions. Never second-guess your club selection again.',
    accentColor: boldColors.emerald,
    gradientColors: gradients.hero.primary,
  },
  {
    id: 'wind-analysis',
    icon: Wind,
    title: 'Real-Time Wind Analysis',
    description:
      'Access live wind data with intuitive visualizations. Understand how wind affects your shot with our smart compass display.',
    accentColor: boldColors.cyan,
    gradientColors: gradients.hero.wind,
  },
  {
    id: 'club-library',
    icon: Layers,
    title: 'Your Club Library',
    description:
      'Store your clubs with their precise distances. AI Caddy learns your game and recommends the perfect club for every shot.',
    accentColor: boldColors.teal,
    gradientColors: gradients.hero.clubs,
  },
  {
    id: 'presets',
    icon: Sliders,
    title: 'Quick Presets',
    description:
      'Save your favorite conditions as presets. Quickly switch between wind setups and environmental profiles with one tap.',
    accentColor: boldColors.violet,
    gradientColors: gradients.hero.settings,
  },
  {
    id: 'get-started',
    icon: Sparkles,
    title: 'Ready to Play Better Golf?',
    description:
      'Your AI-powered caddy is ready. Make smarter decisions, hit better shots, and lower your scores starting today.',
    accentColor: boldColors.amber,
    gradientColors: gradients.hero.sunset,
  },
];

interface OnboardingFlowProps {
  /** Whether the onboarding flow is visible */
  visible: boolean;
  /** Callback when onboarding is completed or skipped */
  onComplete: () => void;
  /** Custom steps (defaults to app feature introduction) */
  steps?: OnboardingStepData[];
  /** Skip the AsyncStorage completion flag (useful for re-showing from Settings) */
  skipPersistence?: boolean;
}

/**
 * Check if onboarding has been completed
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark onboarding as completed
 */
export async function markOnboardingComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
  } catch {
    // Silently fail - onboarding will show again if storage fails
  }
}

/**
 * Reset onboarding completion flag (for testing or re-showing)
 */
export async function resetOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch {
    // Silently fail
  }
}

/**
 * OnboardingFlow - Full-screen onboarding experience
 *
 * Features gradient hero backgrounds, paginated steps, skip functionality,
 * and automatic completion tracking via AsyncStorage.
 *
 * @example
 * // Basic usage with auto-persistence
 * const [showOnboarding, setShowOnboarding] = useState(false);
 *
 * useEffect(() => {
 *   hasCompletedOnboarding().then(completed => {
 *     if (!completed) setShowOnboarding(true);
 *   });
 * }, []);
 *
 * <OnboardingFlow
 *   visible={showOnboarding}
 *   onComplete={() => setShowOnboarding(false)}
 * />
 *
 * @example
 * // Re-show from Settings (skip persistence)
 * <OnboardingFlow
 *   visible={showHelp}
 *   onComplete={() => setShowHelp(false)}
 *   skipPersistence
 * />
 */
export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  visible,
  onComplete,
  steps = DEFAULT_STEPS,
  skipPersistence = false,
}) => {
  const t = useTokens();
  const { isDark } = useThemeMode();
  const reduceMotion = useReduceMotionValue();
  const insets = useSafeAreaInsets();

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Animation values
  const backgroundOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  // Animate in when visible (skip animations if reduce motion is enabled)
  useEffect(() => {
    if (reduceMotion) {
      // Skip animations for reduce motion
      backgroundOpacity.value = visible ? 1 : 0;
      contentOpacity.value = visible ? 1 : 0;
      if (visible) setCurrentIndex(0);
    } else if (visible) {
      backgroundOpacity.value = withTiming(1, { duration: durations.overlay });
      contentOpacity.value = withTiming(1, {
        duration: durations.normal,
      });
      setCurrentIndex(0);
    } else {
      backgroundOpacity.value = withTiming(0, { duration: durations.fast });
      contentOpacity.value = withTiming(0, { duration: durations.fast });
    }
  }, [visible, reduceMotion, backgroundOpacity, contentOpacity]);

  // Handle scroll to update current index
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(
        event.nativeEvent.contentOffset.x / SCREEN_WIDTH
      );
      if (index !== currentIndex && index >= 0 && index < steps.length) {
        setCurrentIndex(index);
        // Haptic feedback on page change
        try {
          Haptics.selectionAsync();
        } catch {
          // Haptics not available
        }
      }
    },
    [currentIndex, steps.length]
  );

  // Handle complete
  const handleComplete = useCallback(async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics not available
    }

    if (!skipPersistence) {
      await markOnboardingComplete();
    }
    onComplete();
  }, [onComplete, skipPersistence]);

  // Handle skip
  const handleSkip = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics not available
    }

    if (!skipPersistence) {
      await markOnboardingComplete();
    }
    onComplete();
  }, [onComplete, skipPersistence]);

  // Handle next
  const handleNext = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics not available
    }

    if (currentIndex < steps.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  }, [currentIndex, steps.length]);

  // Animated styles
  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  // Get current step gradient for background
  const currentStep = steps[currentIndex];
  const backgroundGradient = currentStep?.gradientColors || gradients.hero.primary;

  // Is last step?
  const isLastStep = currentIndex === steps.length - 1;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={false}
      onRequestClose={handleSkip}
      statusBarTranslucent
    >
      <Animated.View style={[styles.container, backgroundAnimatedStyle]}>
        {/* Gradient background */}
        <LinearGradient
          colors={backgroundGradient as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Content container */}
        <Animated.View style={[styles.content, contentAnimatedStyle]}>
          {/* Skip button */}
          {!isLastStep && (
            <Animated.View
              entering={FadeInDown.delay(300).duration(400)}
              style={[
                styles.skipButtonContainer,
                { top: insets.top + 16, right: 20 },
              ]}
            >
              <Pressable
                style={[
                  styles.skipButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.1)',
                  },
                ]}
                onPress={handleSkip}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Skip onboarding"
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.skipText,
                    { color: isDark ? t.colors.textMuted : boldColors.slate700 },
                  ]}
                >
                  Skip
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Steps carousel */}
          <FlatList
            ref={flatListRef}
            data={steps}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            keyExtractor={(item) => item.id}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            renderItem={({ item, index }) => (
              <OnboardingStep
                icon={item.icon}
                title={item.title}
                description={item.description}
                accentColor={item.accentColor}
                gradientColors={item.gradientColors}
                isActive={index === currentIndex}
                stepNumber={index + 1}
                totalSteps={steps.length}
              />
            )}
            contentContainerStyle={{
              paddingTop: insets.top + 60,
              paddingBottom: 120,
            }}
          />

          {/* Bottom controls */}
          <Animated.View
            entering={FadeInUp.delay(400).duration(400)}
            style={[
              styles.bottomControls,
              { paddingBottom: insets.bottom + 24 },
            ]}
          >
            {/* Page indicators */}
            <View style={styles.indicators}>
              {steps.map((_, index) => {
                const isActive = index === currentIndex;
                return (
                  <Animated.View
                    key={index}
                    style={[
                      styles.indicator,
                      {
                        backgroundColor: isActive
                          ? '#FFFFFF'
                          : 'rgba(255, 255, 255, 0.3)',
                        width: isActive ? 24 : 8,
                      },
                    ]}
                  />
                );
              })}
            </View>

            {/* Action button */}
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                {
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
              onPress={isLastStep ? handleComplete : handleNext}
              accessibilityLabel={isLastStep ? 'Get Started' : 'Next step'}
              accessibilityRole="button"
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.actionButtonGradient}
              >
                <Text style={styles.actionButtonText}>
                  {isLastStep ? "Let's Go!" : 'Next'}
                </Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  skipButtonContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  skipText: {
    fontSize: scaledFontSize(14),
    fontWeight: '600',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 24,
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
  },
  actionButton: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: scaledFontSize(18),
    fontWeight: '700',
    color: boldColors.slate900,
    letterSpacing: -0.3,
  },
});

export default OnboardingFlow;
