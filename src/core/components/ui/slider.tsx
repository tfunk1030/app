import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import {
  safeScaledFontSize,
  getTouchTargetSize,
  getFlexibleMinHeight,
  getScrollPadding,
  getResponsiveSpacing,
} from '@/src/utils/responsive';
import { Slider as NativeSlider } from '@miblanchard/react-native-slider';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedView = Animated.View;

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
  const { mode } = useThemeMode();
  const isDark = mode === 'dark' || mode === 'system';
  const rippleColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const [inputValue, setInputValue] = useState(String(value));
  const [sliderValue, setSliderValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);

  // Animation values
  const thumbScale = useSharedValue(1);
  const thumbGlow = useSharedValue(0.3);
  const tooltipOpacity = useSharedValue(0);
  const tooltipScale = useSharedValue(0.8);

  // Pulse animation for thumb glow
  useEffect(() => {
    if (glow && isDark) {
      thumbGlow.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1500 }),
          withTiming(0.3, { duration: 1500 })
        ),
        -1,
        true
      );
    }
  }, [glow, isDark, thumbGlow]);

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
      return;
    }
    const newValue = Math.min(Math.max(parseInt(inputValue, 10), min), max);
    setInputValue(String(newValue));
    setSliderValue(newValue);
    onValueChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(sliderValue + step, max);
    setSliderValue(newValue);
    setInputValue(String(newValue));
    onValueChange(newValue);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDecrement = () => {
    const newValue = Math.max(sliderValue - step, min);
    setSliderValue(newValue);
    setInputValue(String(newValue));
    onValueChange(newValue);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSliderChange = useCallback(
    (values: number[]) => {
      const newValue = values[0];
      setSliderValue(newValue);
      setInputValue(String(Math.round(newValue)));
      onValueChange(newValue);
    },
    [onValueChange]
  );

  const handleSlidingStart = useCallback(() => {
    setIsDragging(true);
    thumbScale.value = withSpring(1.2, {
      damping: t.animation.spring.damping,
      stiffness: t.animation.spring.stiffness,
    });
    tooltipOpacity.value = withTiming(1, { duration: 150 });
    tooltipScale.value = withSpring(1, {
      damping: t.animation.spring.damping,
      stiffness: t.animation.spring.stiffness,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [thumbScale, tooltipOpacity, tooltipScale, t.animation.spring]);

  const handleSlidingComplete = useCallback(() => {
    setIsDragging(false);
    thumbScale.value = withSpring(1, {
      damping: t.animation.spring.damping,
      stiffness: t.animation.spring.stiffness,
    });
    tooltipOpacity.value = withTiming(0, { duration: 200 });
    tooltipScale.value = withTiming(0.8, { duration: 200 });
  }, [thumbScale, tooltipOpacity, tooltipScale, t.animation.spring]);

  // Calculate tooltip position based on slider value with edge clamping
  // This ensures the tooltip doesn't clip off the edges of the screen
  const rawTooltipPosition = ((sliderValue - min) / (max - min)) * 100;
  // Clamp the position to keep tooltip visible (accounting for tooltip width)
  const tooltipPosition = Math.max(8, Math.min(92, rawTooltipPosition));

  // Calculate dynamic transform based on position to prevent edge clipping
  const tooltipTransformX = rawTooltipPosition < 15
    ? -8
    : rawTooltipPosition > 85
      ? -32
      : -20;

  // Ensure touch targets meet 44pt minimum for accessibility
  const buttonSize = getTouchTargetSize(44);
  const inputMinHeight = getFlexibleMinHeight(dense ? 36 : 40);
  const containerPadding = getScrollPadding(dense ? 2 : 4, {
    minPadding: 2,
    maxPadding: 8,
  });

  // Custom thumb component with glow effect
  const renderThumb = useCallback(() => {
    const thumbSize = dense ? 22 : 26;
    return (
      <AnimatedView
        style={[
          {
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            backgroundColor: t.colors.brandAlt,
            shadowColor: glow && isDark ? t.colors.glowSecondary : t.colors.shadow,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: glow && isDark ? 10 : 3,
            elevation: 4,
          },
          thumbAnimatedStyle,
        ]}
      />
    );
  }, [dense, t.colors, glow, isDark, thumbAnimatedStyle]);

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
                fontSize: safeScaledFontSize(dense ? 12 : 14),
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
          onPress={handleDecrement}
          android_ripple={{ color: rippleColor }}
          accessibilityRole="button"
          accessibilityLabel="Decrease"
        >
          <Text
            style={[
              styles.buttonText,
              {
                color: t.colors.textPrimary,
                fontSize: safeScaledFontSize(dense ? 16 : 18),
              },
            ]}
          >
            -
          </Text>
        </Pressable>

        <View
          style={[
            styles.textInputContainer,
            {
              backgroundColor: t.colors.surface,
              borderColor: t.colors.border,
              minHeight: inputMinHeight,
              paddingHorizontal: getResponsiveSpacing(12, 'horizontal'),
              paddingVertical: getResponsiveSpacing(dense ? 4 : 6, 'vertical'),
            },
          ]}
        >
          <TextInput
            style={[
              styles.numericInput,
              {
                color: t.colors.textPrimary,
                fontSize: safeScaledFontSize(dense ? 14 : 16),
              },
            ]}
            value={inputValue}
            keyboardType="numeric"
            onChangeText={handleInputChange}
            onBlur={handleInputBlur}
            selectTextOnFocus
            placeholderTextColor={t.colors.textMuted}
          />
          {unit && (
            <Text
              style={[
                styles.unit,
                {
                  color: t.colors.textMuted,
                  fontSize: safeScaledFontSize(dense ? 12 : 14),
                },
              ]}
            >
              {unit}
            </Text>
          )}
        </View>

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
          onPress={handleIncrement}
          android_ripple={{ color: rippleColor }}
          accessibilityRole="button"
          accessibilityLabel="Increase"
        >
          <Text
            style={[
              styles.buttonText,
              {
                color: t.colors.textPrimary,
                fontSize: safeScaledFontSize(dense ? 16 : 18),
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
            paddingVertical: getResponsiveSpacing(dense ? 2 : 4, 'vertical'),
            marginTop: getResponsiveSpacing(dense ? 1 : 2, 'vertical'),
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
                fontSize: safeScaledFontSize(12),
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
            {/* Gradient track background */}
            {glow && isDark && (
              <View style={styles.gradientTrackWrapper}>
                <LinearGradient
                  colors={t.gradients.primary as [string, string, ...string[]]}
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
                      shadowOpacity: 0.5,
                      shadowRadius: 6,
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
              minimumTrackTintColor={
                glow && isDark ? 'transparent' : t.colors.brand
              }
              maximumTrackTintColor={t.colors.border}
              renderThumbComponent={renderThumb}
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

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontWeight: '500',
  },
  unit: {
    marginLeft: 2,
  },
  sliderOuterContainer: {
    position: 'relative',
  },
  sliderContainer: {
    justifyContent: 'center',
    flexDirection: 'row',
  },
  sliderPadding: {
    width: '12%',
  },
  sliderTrackContainer: {
    flex: 1,
    position: 'relative',
  },
  gradientTrackWrapper: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    zIndex: 1,
    transform: [{ translateY: -3 }],
  },
  gradientTrack: {
    position: 'absolute',
    left: 0,
  },
  track: {},
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 8,
  },
  numericInput: {
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 48,
    paddingVertical: 2,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonText: {
    fontWeight: '700',
  },
  tooltip: {
    position: 'absolute',
    top: -28,
    // Transform is now applied dynamically based on edge position
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 10,
    minWidth: 40,
    alignItems: 'center',
  },
  tooltipText: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
