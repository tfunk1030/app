import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import { 
  safeScaledFontSize, 
  getTouchTargetSize, 
  getFlexibleMinHeight,
  getOptimalNumberOfLines,
  getResponsiveSpacing
} from '@/src/utils/responsive';
import * as React from 'react';
import {
  Platform,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';

type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link'
  | 'primary'
  | 'premium';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends PressableProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  title?: string;
}

const Button = ({
  variant = 'default',
  size = 'default',
  children,
  title,
  style,
  textStyle,
  ...props
}: ButtonProps) => {
  const t = useTokens();
  const { mode } = useThemeMode();
  const rippleColor = mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: getResponsiveSpacing(12, 'horizontal'),
          paddingVertical: getResponsiveSpacing(10, 'vertical'),
          minHeight: getTouchTargetSize(44), // Ensure 44pt minimum even for small buttons
        };
      case 'lg':
        return {
          paddingHorizontal: getResponsiveSpacing(20, 'horizontal'),
          paddingVertical: getResponsiveSpacing(14, 'vertical'),
          minHeight: getFlexibleMinHeight(52),
        };
      case 'icon':
        return {
          width: getTouchTargetSize(44),
          height: getTouchTargetSize(44),
          padding: 0,
          justifyContent: 'center' as const,
          alignItems: 'center' as const,
          borderRadius: getTouchTargetSize(44) / 2,
        };
      default:
        return {
          paddingHorizontal: getResponsiveSpacing(16, 'horizontal'),
          paddingVertical: getResponsiveSpacing(12, 'vertical'),
          minHeight: getTouchTargetSize(44),
        };
    }
  };

  const getVariantBackground = (): ViewStyle => {
    switch (variant) {
      case 'destructive':
        return { backgroundColor: t.colors.danger };
      case 'outline':
        return {
          backgroundColor: t.colors.surfaceAlt,
          borderWidth: 1,
          borderColor: t.colors.brand,
        };
      case 'secondary':
        // Transparent with brand border for strong contrast in dark mode
        return { backgroundColor: 'transparent', borderWidth: 1, borderColor: t.colors.brand };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      case 'link':
        return { backgroundColor: 'transparent' };
      case 'primary':
        return { backgroundColor: t.colors.brand };
      case 'premium':
        return { backgroundColor: t.colors.brandAlt };
      default:
        return { backgroundColor: t.colors.brand };
    }
  };

  const getTextColor = (): TextStyle => {
    switch (variant) {
      case 'outline':
        return { color: t.colors.brand };
      case 'secondary':
        return { color: t.colors.textPrimary };
      case 'ghost':
        return { color: t.colors.textPrimary };
      case 'link':
        return { color: t.colors.brandAlt, textDecorationLine: 'underline' };
      default:
        return { color: '#FFFFFF' };
    }
  };

  const buttonText = title || children;
  const textFontSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;

  return (
    <Pressable
      {...props}
      android_ripple={{ color: rippleColor, borderless: false }}
      style={({ pressed }) => [
        styles.base,
        getSizeStyle(),
        getVariantBackground(),
        {
          shadowColor: t.colors.shadow,
          shadowOpacity: 0.12,
        },
        props.disabled && styles.disabled,
        pressed && Platform.OS === 'ios' && styles.pressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: safeScaledFontSize(textFontSize, {
              maxScale: 1.2, // Prevent text from breaking button layout
              respectSystemScale: true,
            }),
          },
          getTextColor(),
          textStyle,
        ]}
        numberOfLines={getOptimalNumberOfLines(1, { maxLines: 2 })}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
      >
        {buttonText}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  pressed: {
    opacity: 0.88,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});

export { Button };