import { useReduceMotionValue } from '@/src/hooks/useReduceMotion';
import { springConfigs } from '@/src/theme/animations';
import { gradients } from '@/src/theme/gradients';
import { useThemeMode } from '@/src/theme/ThemeProvider';
import { type Tokens } from '@/src/theme/tokens';
import { useTokens } from '@/src/theme/useTokens';
import {
  getFlexibleMinHeight,
  getResponsiveSpacing,
  getScrollPadding,
  getTouchTargetSize,
  safeScaledFontSize,
} from '@/src/utils/responsive';
import { Slider as NativeSlider } from '@miblanchard/react-native-slider';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedView = Animated.View;

// =============================================================================
// Dynamic styles factory (memoized per token set)
// =============================================================================
const createStyles = (t: Tokens) => ({
  container: {
    width: '100%' as const,
  },
  labelContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  label: {
    fontWeight: t.fontWeight.medium,
  },
  unit: {
    marginLeft: t.spacing.xs / 2, // 2px small adjustment
  },
  sliderOuterContainer: {
    position: 'relative' as const,
  },
  sliderContainer: {
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
  },
  sliderPadding: {
    width: '12%' as const,
  },
  sliderTrackContainer: {
    flex: 1,
    position: 'relative' as const,
  },
  gradientTrackWrapper: {
    position: 'absolute' as const,
    top: '50%' as const,
    left: 0,
    right: 0,
    zIndex: 1,
    transform: [{ translateY: -3 }],
  },
  gradientTrack: {
    position: 'absolute' as const,
    left: 0,
  },
  track: {},
  inputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  textInputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: t.borderRadius.lg, // 12px
    borderWidth: t.borderWidth.thin, // 1px
    flex: 1,
    marginHorizontal: t.spacing.sm, // 8px
  },
  numericInput: {
    fontWeight: t.fontWeight.semibold,
    textAlign: 'center' as const,
    minWidth: t.touchTarget.minimum, // 48px
    paddingVertical: t.spacing.xs / 2, // 2px small adjustment
  },
  button: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: t.borderWidth.thin, // 1px
  },
  buttonText: {
    fontWeight: t.fontWeight.bold,
  },
  tooltip: {
    position: 'absolute' as const,
    top: -28,
    // Transform is now applied dynamically based on edge position
    paddingHorizontal: t.spacing.sm, // 8px
    paddingVertical: t.spacing.xs, // 4px
    borderRadius: t.borderRadius.md, // 8px
    borderWidth: t.borderWidth.thin, // 1px
    zIndex: 10,
    minWidth: t.containerSize.input.sm, // 36px - slightly smaller than touch target
    alignItems: 'center' as const,
  },
  tooltipText: {
    fontWeight: t.fontWeight.semibold,
    textAlign: 'center' as const,
  },
});

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  dense?: boolean;
  glow?: boolean; // Enable glow effect on track and thumb
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  unit,
  dense = false,
  glow = true,
}: SliderProps) {
  const t = useTokens();
  const { isDark } = useThemeMode();

  // Memoize styles based on token set
  const styles = useMemo(() => createStyles(t), [t]);

  // Use token-based ripple color - fallback to semi-transparent if not defined
  const rippleColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
  const reduceMotion = useReduceMotionValue();
  const [inputValue, setInputValue] = useState(String(value));
  const [sliderValue, setSliderValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  // Per interview decision: long-press opens keypad (hidden by default)
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Track last stepped value for haptic feedback during dragging
  const lastSteppedValue = useRef(Math.round(value / step) * step);

  // Stable ref for onValueChange to prevent callback recreation during drag
  const onValueChangeRef = useRef(onValueChange);
  useEffect(() => {
    onValueChangeRef.current = onValueChange;
  }, [onValueChange]);

  // Long-press handling for +/- buttons
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Long-press timer for keypad activation
  const keypadLongPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation values
  const thumbScale = useSharedValue(1);
  const thumbGlow = useSharedValue(0.3);
  const tooltipOpacity = useSharedValue(0);
  const tooltipScale = useSharedValue(0.8);

  // Pulse animation for thumb glow - skip if reduce motion is enabled
  useEffect(() => {
    // Don't run continuous animations if reduce motion is enabled
    if (reduceMotion) {
      thumbGlow.value = 0.3;
      return;
    }

    if (glow && isDark) {
      thumbGlow.value = withRepeat(
        withSequence(withTiming(0.6, { duration: 1500 }), withTiming(0.3, { duration: 1500 })),
        -1,
        true
      );
    }

    // Cleanup: cancel animation on unmount to prevent memory leaks
    return () => {
      cancelAnimation(thumbGlow);
    };
  }, [glow, isDark, thumbGlow, reduceMotion]);

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: thumbScale.value }],
    shadowOpacity: thumbGlow.value,
  }));

  const tooltipAnimatedStyle = useAnimatedStyle(() => ({
    opacity: tooltipOpacity.value,
    transform: [{ scale: tooltipScale.value }],
  }));

  useEffect(() => {
    setInputValue(String(value));
    setSliderValue(value);
  }, [value]);

  const handleInputChange = (text: string) => {
    if (text === '') {
      setInputValue('');
      return;
    }
    if (!/^\d+$/.test(text)) {
      return;
    }
    setInputValue(text);
    const newValue = parseInt(text, 10);
    if (!isNaN(newValue)) {
      setSliderValue(Math.min(Math.max(newValue, min), max));
    }
  };

  const handleInputBlur = () => {
    if (inputValue === '' || isNaN(parseInt(inputValue, 10))) {
      setInputValue(String(value));
      setIsKeypadOpen(false);
      return;
    }
    const newValue = Math.min(Math.max(parseInt(inputValue, 10), min), max);
    setInputValue(String(newValue));
    setSliderValue(newValue);
    onValueChange(newValue);
    setIsKeypadOpen(false);
  };

  // Long-press to open keypad - per interview decision #21
  const handleValueLongPressIn = useCallback(() => {
    keypadLongPressRef.current = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsKeypadOpen(true);
      // Focus the input after a brief delay to allow state update
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }, 400); // 400ms long-press threshold
  }, []);

  const handleValuePressOut = useCallback(() => {
    if (keypadLongPressRef.current) {
      clearTimeout(keypadLongPressRef.current);
      keypadLongPressRef.current = null;
    }
  }, []);

  const handleIncrement = useCallback(() => {
    setSliderValue((prev) => {
      const newValue = Math.min(prev + step, max);
      setInputValue(String(newValue));
      onValueChange(newValue);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return newValue;
    });
  }, [step, max, onValueChange]);

  const handleDecrement = useCallback(() => {
    setSliderValue((prev) => {
      const newValue = Math.max(prev - step, min);
      setInputValue(String(newValue));
      onValueChange(newValue);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return newValue;
    });
  }, [step, min, onValueChange]);

  // Long-press handler for fast increment/decrement
  const handlePressIn = useCallback(
    (direction: 'increment' | 'decrement') => {
      // Immediate action
      if (direction === 'increment') {
        handleIncrement();
      } else {
        handleDecrement();
      }

      // Start long-press acceleration after 300ms
      longPressTimerRef.current = setTimeout(() => {
        // Fast increment every 80ms
        longPressIntervalRef.current = setInterval(() => {
          if (direction === 'increment') {
            handleIncrement();
          } else {
            handleDecrement();
          }
        }, 80);
      }, 300);
    },
    [handleIncrement, handleDecrement]
  );

  const handlePressOut = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (longPressIntervalRef.current) {
      clearInterval(longPressIntervalRef.current);
      longPressIntervalRef.current = null;
    }
  }, []);

  const handleSliderChange = useCallback(
    (values: number[]) => {
      const newValue = values[0];
      const currentSteppedValue = Math.round(newValue / step) * step;

      // Trigger haptic when crossing step boundaries
      if (currentSteppedValue !== lastSteppedValue.current) {
        // Check if crossing a 10-unit boundary for stronger haptic
        const currentTenValue = Math.floor(currentSteppedValue / 10) * 10;
        const lastTenValue = Math.floor(lastSteppedValue.current / 10) * 10;

        if (currentTenValue !== lastTenValue) {
          // Stronger haptic every 10 units
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
          // Lighter selection haptic for regular steps
          Haptics.selectionAsync();
        }

        lastSteppedValue.current = currentSteppedValue;
      }

      setSliderValue(newValue);
      setInputValue(String(Math.round(newValue)));
      // Use ref to avoid recreating callback on every render
      onValueChangeRef.current(newValue);
    },
    [step] // Removed onValueChange - now using stable ref
  );

  const handleSlidingStart = useCallback(() => {
    setIsDragging(true);
    // Use stiff spring config for snappy response without excessive bouncing
    thumbScale.value = reduceMotion ? 1.2 : withSpring(1.2, springConfigs.stiff);
    tooltipOpacity.value = reduceMotion ? 1 : withTiming(1, { duration: 150 });
    tooltipScale.value = reduceMotion ? 1 : withSpring(1, springConfigs.stiff);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [thumbScale, tooltipOpacity, tooltipScale, reduceMotion]);

  const handleSlidingComplete = useCallback(() => {
    setIsDragging(false);
    // Use stiff spring config for quick settling without prolonged animation
    thumbScale.value = reduceMotion ? 1 : withSpring(1, springConfigs.stiff);
    tooltipOpacity.value = reduceMotion ? 0 : withTiming(0, { duration: 200 });
    tooltipScale.value = reduceMotion ? 0.8 : withTiming(0.8, { duration: 200 });
  }, [thumbScale, tooltipOpacity, tooltipScale, reduceMotion]);

  // Calculate tooltip position based on slider value with edge clamping
  // This ensures the tooltip doesn't clip off the edges of the screen
  const rawTooltipPosition = ((sliderValue - min) / (max - min)) * 100;
  // Clamp the position to keep tooltip visible (accounting for tooltip width)
  const tooltipPosition = Math.max(8, Math.min(92, rawTooltipPosition));

  // Calculate dynamic transform based on position to prevent edge clipping
  const tooltipTransformX = rawTooltipPosition < 15 ? -8 : rawTooltipPosition > 85 ? -32 : -20;

  // Ensure touch targets meet 44pt minimum for accessibility
  // Use token-based sizes for consistency
  const buttonSize = getTouchTargetSize(t.containerSize.icon.md); // 44px minimum touch target
  const inputMinHeight = getFlexibleMinHeight(
    dense ? t.containerSize.input.sm : t.containerSize.input.md // 36px / 40px
  );
  const containerPadding = getScrollPadding(
    dense ? t.spacing.xs / 2 : t.spacing.xs, // 2px / 4px
    {
      minPadding: t.spacing.xs / 2, // 2px
      maxPadding: t.spacing.sm, // 8px
    }
  );

  // Custom thumb component with glow effect
  // Use token-based sizes for slider thumb
  const renderThumb = useCallback(() => {
    // Guard against undefined tokens during initial render
    if (!t?.shadow?.subtle || !t?.containerSize?.slider) {
      return (
        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#06B6D4' }} />
      );
    }

    const thumbSize = dense
      ? t.containerSize.slider.thumbDense // 22px
      : t.containerSize.slider.thumb; // 26px

    // Use token-based shadow configuration with fallback
    // Use 'glow' instead of 'glowSecondary' as per current Tokens interface
    const shadowConfig = (glow && isDark ? t.shadow?.glow : t.shadow?.subtle) ?? {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    };

    return (
      <AnimatedView
        style={[
          {
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            backgroundColor: t.colors?.brandAlt ?? '#06B6D4',
            shadowColor: shadowConfig.shadowColor,
            shadowOffset: shadowConfig.shadowOffset,
            shadowRadius: shadowConfig.shadowRadius,
            elevation: shadowConfig.elevation,
          },
          thumbAnimatedStyle,
        ]}
      />
    );
  }, [dense, t, glow, isDark, thumbAnimatedStyle]);

  // Custom track with gradient
  const renderTrackMarkComponent = useCallback(() => null, []);

  return (
    <View style={[styles.container, { paddingVertical: containerPadding }]}>
      {label && (
        <View
          style={[
            styles.labelContainer,
            { marginBottom: getResponsiveSpacing(dense ? 1 : 2, 'vertical') },
          ]}
        >
          <Text
            style={[
              styles.label,
              {
                color: t.colors.textMuted,
                fontSize: safeScaledFontSize(
                  dense ? t.fontSize.xs : t.fontSize.sm, // 12px / 14px
                  { maxScale: 1.2 }
                ),
              },
            ]}
          >
            {label}
          </Text>
        </View>
      )}

      <View style={[styles.inputContainer, { marginBottom: 0 }]}>
        <Pressable
          style={[
            styles.button,
            {
              width: buttonSize,
              height: buttonSize,
              borderRadius: buttonSize / 2,
              backgroundColor: t.colors.surface,
              borderColor: t.colors.border,
            },
          ]}
          onPressIn={() => handlePressIn('decrement')}
          onPressOut={handlePressOut}
          android_ripple={{ color: rippleColor }}
          accessibilityRole="button"
          accessibilityLabel="Decrease value"
          accessibilityHint="Press and hold for fast decrease"
        >
          <Text
            style={[
              styles.buttonText,
              {
                color: t.colors.textPrimary,
                fontSize: safeScaledFontSize(
                  dense ? t.fontSize.base : t.fontSize.lg, // 16px / 18px
                  { maxScale: 1.15 }
                ),
              },
            ]}
          >
            -
          </Text>
        </Pressable>

        <Pressable
          onPressIn={handleValueLongPressIn}
          onPressOut={handleValuePressOut}
          style={[
            styles.textInputContainer,
            {
              backgroundColor: isKeypadOpen ? t.colors.surfaceAlt : t.colors.surface,
              borderColor: isKeypadOpen ? t.colors.brand : t.colors.border,
              minHeight: inputMinHeight,
              paddingHorizontal: getResponsiveSpacing(t.spacing.base, 'horizontal'), // 12px
              paddingVertical: getResponsiveSpacing(
                dense ? t.spacing.xs : t.spacing.xs + 2, // 4px / 6px
                'vertical'
              ),
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={label ? `${label}: ${sliderValue} ${unit || ''}. Long press to edit` : `Value: ${sliderValue}. Long press to edit`}
          accessibilityHint="Long press to open numeric keypad"
        >
          {isKeypadOpen ? (
            <TextInput
              ref={inputRef}
              style={[
                styles.numericInput,
                {
                  color: t.colors.textPrimary,
                  fontSize: safeScaledFontSize(
                    dense ? t.fontSize.sm : t.fontSize.base, // 14px / 16px
                    { maxScale: 1.2 }
                  ),
                },
              ]}
              value={inputValue}
              keyboardType="numeric"
              onChangeText={handleInputChange}
              onBlur={handleInputBlur}
              selectTextOnFocus
              placeholderTextColor={t.colors.textMuted}
              accessibilityLabel={label ? `${label} value input` : 'Slider value input'}
            />
          ) : (
            <Text
              style={[
                styles.numericInput,
                {
                  color: t.colors.textPrimary,
                  fontSize: safeScaledFontSize(
                    dense ? t.fontSize.sm : t.fontSize.base,
                    { maxScale: 1.2 }
                  ),
                },
              ]}
            >
              {sliderValue}
            </Text>
          )}
          {unit && (
            <Text
              style={[
                styles.unit,
                {
                  color: t.colors.textMuted,
                  fontSize: safeScaledFontSize(
                    dense ? t.fontSize.xs : t.fontSize.sm, // 12px / 14px
                    { maxScale: 1.2 }
                  ),
                },
              ]}
            >
              {unit}
            </Text>
          )}
        </Pressable>

        <Pressable
          style={[
            styles.button,
            {
              width: buttonSize,
              height: buttonSize,
              borderRadius: buttonSize / 2,
              backgroundColor: t.colors.surface,
              borderColor: t.colors.border,
            },
          ]}
          onPressIn={() => handlePressIn('increment')}
          onPressOut={handlePressOut}
          android_ripple={{ color: rippleColor }}
          accessibilityRole="button"
          accessibilityLabel="Increase value"
          accessibilityHint="Press and hold for fast increase"
        >
          <Text
            style={[
              styles.buttonText,
              {
                color: t.colors.textPrimary,
                fontSize: safeScaledFontSize(
                  dense ? t.fontSize.base : t.fontSize.lg, // 16px / 18px
                  { maxScale: 1.15 }
                ),
              },
            ]}
          >
            +
          </Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.sliderOuterContainer,
          {
            paddingVertical: getResponsiveSpacing(
              dense ? t.spacing.xs / 2 : t.spacing.xs, // 2px / 4px
              'vertical'
            ),
            marginTop: getResponsiveSpacing(
              dense ? 1 : t.spacing.xs / 2, // 1px / 2px
              'vertical'
            ),
          },
        ]}
      >
        {/* Tooltip that appears during drag */}
        <AnimatedView
          style={[
            styles.tooltip,
            {
              left: `${tooltipPosition}%`,
              transform: [{ translateX: tooltipTransformX }],
              backgroundColor: t.colors.surface,
              borderColor: t.colors.brand,
            },
            tooltipAnimatedStyle,
          ]}
          pointerEvents="none"
        >
          <Text
            style={[
              styles.tooltipText,
              {
                color: t.colors.brand,
                fontSize: safeScaledFontSize(t.fontSize.xs, { maxScale: 1.2 }), // 12px
              },
            ]}
          >
            {Math.round(sliderValue)}
            {unit ? ` ${unit}` : ''}
          </Text>
        </AnimatedView>

        <View
          style={[
            styles.sliderContainer,
            {
              minHeight: getFlexibleMinHeight(dense ? 28 : 36),
            },
          ]}
        >
          <View style={styles.sliderPadding} />
          <View style={styles.sliderTrackContainer}>
            {/* Gradient track background - modernized with bold gradients */}
            {glow && isDark && (
              <View style={styles.gradientTrackWrapper}>
                <LinearGradient
                  colors={gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.gradientTrack,
                    {
                      width: `${((sliderValue - min) / (max - min)) * 100}%`,
                      height: dense ? 6 : 8,
                      borderRadius: dense ? 3 : 4,
                      shadowColor: t.colors.glowPrimary,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.6,
                      shadowRadius: 8,
                    },
                  ]}
                />
              </View>
            )}
            <NativeSlider
              value={sliderValue}
              onValueChange={handleSliderChange}
              onSlidingStart={handleSlidingStart}
              onSlidingComplete={handleSlidingComplete}
              minimumValue={min}
              maximumValue={max}
              step={step}
              minimumTrackTintColor={glow && isDark ? 'transparent' : t.colors.brand}
              maximumTrackTintColor={t.colors.border}
              renderThumbComponent={renderThumb}
              thumbTouchSize={{ width: 48, height: 48 }} // 48dp minimum touch target per a11y guidelines
              trackClickable={false} // Prevent accidental activation during scroll - must drag thumb
              trackStyle={StyleSheet.flatten([
                styles.track,
                {
                  height: dense ? 6 : 8,
                  borderRadius: dense ? 3 : 4,
                },
              ])}
            />
          </View>
          <View style={styles.sliderPadding} />
        </View>
      </View>
    </View>
  );
}
