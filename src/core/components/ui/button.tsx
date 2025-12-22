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
import { useCallback, useMemo } from 'react';
import {
  Pressable,
  PressableProps,
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
  const rippleColor = t.colors.ripple;

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
    // Use token values for consistent sizing
    const minTouchTarget = t.touchTarget.minimum; // 48px

    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: getResponsiveSpacing(t.spacing.base, 'horizontal'), // 12px
          paddingVertical: getResponsiveSpacing(t.spacing.sm + 2, 'vertical'), // 10px
          minHeight: getTouchTargetSize(t.containerSize.icon.md), // 44px minimum
        };
      case 'lg':
        return {
          paddingHorizontal: getResponsiveSpacing(t.spacing.md + 4, 'horizontal'), // 20px
          paddingVertical: getResponsiveSpacing(t.spacing.sm + 6, 'vertical'), // 14px
          minHeight: getFlexibleMinHeight(52),
        };
      case 'icon':
        return {
          width: getTouchTargetSize(t.containerSize.icon.md), // 44px
          height: getTouchTargetSize(t.containerSize.icon.md),
          padding: 0,
          justifyContent: 'center' as const,
          alignItems: 'center' as const,
          borderRadius: t.borderRadius.full, // Circular
        };
      default:
        return {
          paddingHorizontal: getResponsiveSpacing(t.spacing.md, 'horizontal'), // 16px
          paddingVertical: getResponsiveSpacing(t.spacing.base, 'vertical'), // 12px
          minHeight: getTouchTargetSize(t.containerSize.icon.md), // 44px minimum
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
          borderWidth: t.borderWidth.thin,
          borderColor: t.colors.brand,
        };
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          borderWidth: t.borderWidth.thin,
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
      case 'destructive':
        return { color: t.colors.onDanger };
      case 'primary':
      case 'premium':
      default:
        return { color: t.colors.onBrand };
    }
  };

  // Determine shadow style based on variant and glow prop
  const getShadowStyle = (): ViewStyle => {
    const shouldGlow =
      glow || variant === 'primary' || variant === 'premium' || variant === 'neon';

    // Primary/neon/premium buttons get glow effect in dark mode
    if (shouldGlow && isDark) {
      const glowShadow =
        variant === 'neon' || variant === 'primary'
          ? t.shadow.glow
          : variant === 'premium'
          ? t.shadow.glowSecondary
          : t.shadow.glow;

      return {
        shadowColor: glowShadow.shadowColor,
        shadowOffset: glowShadow.shadowOffset,
        shadowOpacity: glowShadow.shadowOpacity * 0.7, // Reduced for buttons to prevent over-saturation
        shadowRadius: glowShadow.shadowRadius,
        elevation: glowShadow.elevation,
      };
    }

    // Destructive buttons get danger glow
    if (variant === 'destructive') {
      return {
        shadowColor: t.shadow.dangerGlow.shadowColor,
        shadowOffset: t.shadow.dangerGlow.shadowOffset,
        shadowOpacity: t.shadow.dangerGlow.shadowOpacity * 0.8,
        shadowRadius: t.shadow.dangerGlow.shadowRadius,
        elevation: t.shadow.dangerGlow.elevation,
      };
    }

    // Default subtle shadow for other variants
    return {
      shadowColor: t.shadow.subtle.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: t.shadow.subtle.shadowOpacity * 1.2,
      shadowRadius: t.shadow.subtle.shadowRadius * 2,
      elevation: t.shadow.subtle.elevation * 2,
    };
  };

  const buttonText = title || children;
  // Use token-based font sizes for consistency
  const textFontSize =
    size === 'sm' ? t.fontSize.sm : size === 'lg' ? t.fontSize.lg : t.fontSize.base; // 14 / 18 / 16
  const isNeon = variant === 'neon';

  // Memoized dynamic styles using tokens
  const styles = useMemo(() => {
    // Calculate neon border values
    const buttonBorderRadius = t.borderRadius.lg; // 12px
    const gradientBorderWidth = t.borderWidth.medium; // 1.5px
    const innerBorderRadius = buttonBorderRadius - gradientBorderWidth; // 10.5px

    return {
      base: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        borderRadius: buttonBorderRadius,
      },
      text: {
        fontWeight: t.fontWeight.semibold,
        textAlign: 'center' as const,
      },
      disabled: {
        opacity: t.opacity.disabled,
      },
      neonContainer: {
        borderRadius: buttonBorderRadius,
        overflow: 'hidden' as const,
      },
      neonGradient: {
        padding: gradientBorderWidth, // Creates the gradient border effect (1.5px)
        borderRadius: buttonBorderRadius,
      },
      neonInner: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        borderRadius: innerBorderRadius,
      },
    };
  }, [t.borderRadius.lg, t.borderWidth.medium, t.fontWeight.semibold, t.opacity.disabled]);

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

export { Button };
