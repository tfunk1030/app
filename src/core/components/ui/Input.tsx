import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import { gradients, boldColors } from '@/src/theme/gradients';
import { scaledFontSize } from '@/src/utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { useState, useCallback } from 'react';
import { StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

export interface InputProps extends TextInputProps {
  /** Container style wrapper */
  containerStyle?: ViewStyle;
}

const Input = React.forwardRef<TextInput, InputProps>(
  ({ style, containerStyle, onFocus, onBlur, ...props }, ref) => {
    const t = useTokens();
    const { isDark } = useThemeMode();
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = useCallback(
      (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      [onFocus]
    );

    const handleBlur = useCallback(
      (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
        setIsFocused(false);
        onBlur?.(e);
      },
      [onBlur]
    );

    // Glow shadow style when focused
    const glowStyle: ViewStyle = isFocused
      ? {
          shadowColor: boldColors.glowEmerald,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 8,
          elevation: 4,
        }
      : {};

    const inputElement = (
      <TextInput
        ref={ref}
        style={[
          styles.input,
          {
            backgroundColor: isDark ? t.colors.surfaceAlt : t.colors.surface,
            color: t.colors.textPrimary,
          },
          // Remove border when focused (gradient border will show instead)
          !isFocused && {
            borderColor: t.colors.border,
            borderWidth: 1,
          },
          isFocused && styles.inputFocused,
          style,
        ]}
        placeholderTextColor={t.colors.textMuted}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    );

    // When focused, wrap with gradient border
    if (isFocused) {
      return (
        <View style={[styles.container, glowStyle, containerStyle]}>
          <LinearGradient
            colors={gradients.primary as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          >
            {inputElement}
          </LinearGradient>
        </View>
      );
    }

    // When not focused, render input directly
    return (
      <View style={[styles.container, containerStyle]}>
        {inputElement}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientBorder: {
    padding: 2, // Creates the gradient border effect
    borderRadius: 12,
  },
  input: {
    height: 56,
    width: '100%',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: scaledFontSize(16),
  },
  inputFocused: {
    borderRadius: 10, // Slightly smaller to fit inside gradient
    borderWidth: 0,
  },
});

export { Input };
