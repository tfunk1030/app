import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import { gradients, GradientColors } from '@/src/theme/gradients';
import {
  safeScaledFontSize,
  getTouchTargetSize,
  getFlexibleMinHeight,
  getOptimalNumberOfLines,
  getResponsiveSpacing,
} from '@/src/utils/responsive';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { useCallback, useMemo } from 'react';
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
import { useReduceMotionValue } from '@/src/hooks/useReduceMotion';
import { springConfigs } from '@/src/theme/animations';

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

/**
 * Button Props
 *
 * WCAG AA Accessibility Note:
 * Gradient button variants (primary, premium, destructive) use white text (#FFFFFF)
 * on vibrant gradient backgrounds. While some gradients (primary, premium) don't
 * meet the 4.5:1 contrast ratio for normal text, they DO meet WCAG AA requirements
 * because:
 * 1. Text uses fontWeight '600' (semibold)
 * 2. Font sizes are 14px (sm), 16px (default), or 18px (lg)
 * 3. Per WCAG 2.1: Bold text >= 14px qualifies as "large text" requiring only 3:1 ratio
 * 4. All button gradient/text combinations exceed 3:1 contrast ratio
 *
 * @see src/utils/accessibility/contrastCheck.ts for detailed audit
 */
export interface ButtonProps extends PressableProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  title?: string;
  glow?: boolean; // Enable glow effect on brand buttons
  /** Accessibility label for screen readers - defaults to title if not provided */
  accessibilityLabel?: string;
  /** Accessibility role - defaults to 'button' */
  accessibilityRole?: 'button' | 'link' | 'none';
}

const Button = ({
  variant = 'default',
  size = 'default',
  children,
  title,
  style,
  textStyle,
  glow = false,
  accessibilityLabel,
  accessibilityRole = 'button',
  ...props
}: ButtonProps) => {
  const t = useTokens();
  const { isDark } = useThemeMode();
  const reduceMotion = useReduceMotionValue();
  const rippleColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  // Animation values
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (!props.disabled) {
      // Haptic feedback for tactile response
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      // Use stiff spring for immediate response without prolonged bouncing
      // Skip animation entirely if reduce motion is enabled
      scale.value = reduceMotion ? 0.97 : withSpring(0.97, springConfigs.stiff);
    }
  }, [props.disabled, scale, reduceMotion]);

  const handlePressOut = useCallback(() => {
    // Use stiff spring for quick settling
    scale.value = reduceMotion ? 1 : withSpring(1, springConfigs.stiff);
  }, [scale, reduceMotion]);

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

  // Get gradient colors for variants that use gradient backgrounds
  const getGradientColors = (): GradientColors | null => {
    if (props.disabled) return gradients.button.disabled;

    switch (variant) {
      case 'primary':
      case 'default':
        return gradients.button.primary;
      case 'premium':
        return gradients.button.premium;
      case 'destructive':
        return gradients.button.danger;
      default:
        return null;
    }
  };

  // Check if this variant should use a gradient background
  const shouldUseGradient = (): boolean => {
    return (
      variant === 'primary' ||
      variant === 'default' ||
      variant === 'premium' ||
      variant === 'destructive'
    );
  };

  const buttonText = title || children;
  const effectiveAccessibilityLabel = accessibilityLabel ?? 
    (typeof buttonText === 'string' ? buttonText : undefined);
  const textFontSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;
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
      gradientButton: {
        overflow: 'hidden' as const,
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
        accessibilityLabel={effectiveAccessibilityLabel}
        accessibilityRole={accessibilityRole}
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

  // Gradient variants (primary, default, premium, destructive)
  const gradientColors = getGradientColors();
  if (shouldUseGradient() && gradientColors) {
    return (
      <AnimatedPressable
        {...props}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: rippleColor, borderless: false }}
        style={[animatedStyle, style]}
        accessibilityLabel={effectiveAccessibilityLabel}
        accessibilityRole={accessibilityRole}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.base,
            styles.gradientButton,
            getSizeStyle(),
            getShadowStyle(),
            props.disabled && styles.disabled,
          ]}
        >
          {buttonContent}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  // Non-gradient variants (outline, secondary, ghost, link)
  return (
    <AnimatedPressable
      {...props}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: rippleColor, borderless: false }}
      accessibilityLabel={effectiveAccessibilityLabel}
      accessibilityRole={accessibilityRole}
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

const staticStyles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  gradientButton: {
    overflow: 'hidden',
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