import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import {
  safeScaledFontSize,
  getTouchTargetSize,
  getFlexibleMinHeight,
  getOptimalNumberOfLines,
  getResponsiveSpacing,
} from '@/src/utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { useCallback } from 'react';
import {
  Platform,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link'
  | 'primary'
  | 'premium'
  | 'neon'; // New neon variant
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends PressableProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  title?: string;
  glow?: boolean; // Enable glow effect on brand buttons
}

const Button = ({
  variant = 'default',
  size = 'default',
  children,
  title,
  style,
  textStyle,
  glow = false,
  ...props
}: ButtonProps) => {
  const t = useTokens();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark' || mode === 'system';
  const rippleColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  // Animation values
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (!props.disabled) {
      scale.value = withSpring(0.97, {
        damping: t.animation.spring.damping,
        stiffness: t.animation.spring.stiffness,
        mass: t.animation.spring.mass,
      });
    }
  }, [props.disabled, scale, t.animation.spring]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, {
      damping: t.animation.spring.damping,
      stiffness: t.animation.spring.stiffness,
      mass: t.animation.spring.mass,
    });
  }, [scale, t.animation.spring]);

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: getResponsiveSpacing(12, 'horizontal'),
          paddingVertical: getResponsiveSpacing(10, 'vertical'),
          minHeight: getTouchTargetSize(44),
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
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: t.colors.brand,
        };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      case 'link':
        return { backgroundColor: 'transparent' };
      case 'primary':
        return { backgroundColor: t.colors.brand };
      case 'premium':
        return { backgroundColor: t.colors.brandAlt };
      case 'neon':
        return { backgroundColor: 'transparent' };
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
      case 'neon':
        return { color: t.colors.brand };
      default:
        return { color: '#FFFFFF' };
    }
  };

  // Determine shadow style based on variant and glow prop
  const getShadowStyle = (): ViewStyle => {
    const shouldGlow =
      glow || variant === 'primary' || variant === 'premium' || variant === 'neon';

    if (shouldGlow && isDark) {
      const glowColor =
        variant === 'neon' || variant === 'primary'
          ? t.colors.glowPrimary
          : variant === 'premium'
          ? t.colors.glowSecondary
          : t.colors.glowPrimary;

      return {
        shadowColor: glowColor,
        shadowOffset: t.shadow.glow.shadowOffset,
        shadowOpacity: t.shadow.glow.shadowOpacity * 0.7,
        shadowRadius: t.shadow.glow.shadowRadius,
        elevation: t.shadow.glow.elevation,
      };
    }

    if (variant === 'destructive') {
      return {
        shadowColor: t.colors.dangerGlow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
      };
    }

    return {
      shadowColor: t.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 2,
    };
  };

  const buttonText = title || children;
  const textFontSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;
  const isNeon = variant === 'neon';

  const buttonContent = (
    <Text
      style={[
        styles.text,
        {
          fontSize: safeScaledFontSize(textFontSize, {
            maxScale: 1.2,
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
  );

  // Neon variant with gradient border
  if (isNeon) {
    return (
      <AnimatedPressable
        {...props}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: rippleColor, borderless: false }}
        style={[animatedStyle, style]}
      >
        <View style={[styles.neonContainer, getShadowStyle()]}>
          <LinearGradient
            colors={t.gradients.primary as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.neonGradient}
          >
            <View
              style={[
                styles.neonInner,
                getSizeStyle(),
                {
                  backgroundColor: isDark
                    ? t.colors.background
                    : t.colors.surface,
                },
                props.disabled && styles.disabled,
              ]}
            >
              {buttonContent}
            </View>
          </LinearGradient>
        </View>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      {...props}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: rippleColor, borderless: false }}
      style={[
        styles.base,
        getSizeStyle(),
        getVariantBackground(),
        getShadowStyle(),
        props.disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {buttonContent}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  neonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  neonGradient: {
    padding: 1.5, // Creates the gradient border effect
    borderRadius: 12,
  },
  neonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10.5,
  },
});

export { Button };
