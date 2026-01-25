import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import { 
  safeScaledFontSize, 
  getTouchTargetSize, 
  getFlexibleMinHeight,
  getScrollPadding,
  getResponsiveSpacing
} from '@/src/utils/responsive';
import { Slider as NativeSlider } from '@miblanchard/react-native-slider';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  dense?: boolean;
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
}: SliderProps) {
  const t = useTokens();
  const { mode } = useThemeMode();
  const rippleColor = mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const [inputValue, setInputValue] = useState(String(value));
  const [sliderValue, setSliderValue] = useState(value);

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

  const handleSliderChange = (values: number[]) => {
    const newValue = values[0];
    setSliderValue(newValue);
    setInputValue(String(Math.round(newValue)));
    onValueChange(newValue);
  };

  // Reduced sizes for more compact layout with bigger slider track
  const buttonSize = getTouchTargetSize(dense ? 36 : 40);  // Smaller buttons
  const inputMinHeight = getFlexibleMinHeight(dense ? 32 : 36);  // Smaller input
  const containerPadding = getScrollPadding(dense ? 2 : 4, { minPadding: 2, maxPadding: 8 });  // Less padding

  return (
    <View style={[styles.container, { paddingVertical: containerPadding }]}>
      {label && (
        <View style={[styles.labelContainer, { marginBottom: getResponsiveSpacing(dense ? 1 : 2, 'vertical') }]}>
          <Text style={[
            styles.label,
            {
              color: t.colors.textMuted,
              fontSize: safeScaledFontSize(dense ? 12 : 14)  // Smaller label text in dense mode
            }
          ]}>
            {label}
          </Text>
        </View>
      )}

      <View style={[
        styles.inputContainer,
        { marginBottom: 0 }  // No margin between input and slider
      ]}>
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
            <Text style={[
              styles.unit, 
              { 
                color: t.colors.textMuted,
                fontSize: safeScaledFontSize(dense ? 12 : 14)
              }
            ]}>
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

      <View style={[
        styles.sliderOuterContainer,
        {
          paddingVertical: getResponsiveSpacing(dense ? 2 : 4, 'vertical'),  // Reduced padding
          marginTop: getResponsiveSpacing(dense ? 1 : 2, 'vertical'),  // Reduced margin
        },
      ]}>
        <View style={[
          styles.sliderContainer,
          {
            minHeight: getFlexibleMinHeight(dense ? 28 : 36),  // Reduced height
          },
        ]}>
          <View style={styles.sliderPadding} />
          <View style={styles.sliderTrackContainer}>
            <NativeSlider
              value={sliderValue}
              onValueChange={handleSliderChange}
              minimumValue={min}
              maximumValue={max}
              step={step}
              minimumTrackTintColor={t.colors.brand}
              maximumTrackTintColor={t.colors.border}
              thumbTintColor={t.colors.brandAlt}
              thumbStyle={StyleSheet.flatten([
                styles.thumb,
                {
                  width: dense ? 20 : 24,  // Bigger thumb for better touch target
                  height: dense ? 20 : 24,  // Bigger thumb for better touch target
                  borderRadius: dense ? 10 : 12,
                  backgroundColor: t.colors.brandAlt,
                  shadowColor: t.colors.shadow,
                },
              ])}
              trackStyle={StyleSheet.flatten([
                styles.track,
                {
                  height: dense ? 6 : 8,  // Much thicker track for better visibility and touch
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
  sliderOuterContainer: {},
  sliderContainer: {
    justifyContent: 'center',
    flexDirection: 'row',
  },
  sliderPadding: {
    width: '12%',
  },
  sliderTrackContainer: {
    flex: 1,
  },
  thumb: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
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
});