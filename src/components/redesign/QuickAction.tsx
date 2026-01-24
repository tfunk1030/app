/**
 * QuickAction - Large touch-friendly action button
 *
 * Designed for glove use with minimum 64dp touch targets.
 * Used for primary actions, presets, and quick inputs.
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRedesignTheme } from '@/src/theme/redesign';

// =============================================================================
// TYPES
// =============================================================================

interface QuickActionProps {
  /** Button label */
  label: string;

  /** Optional sublabel */
  sublabel?: string;

  /** Icon component */
  icon?: React.ReactNode;

  /** Press handler */
  onPress: () => void;

  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';

  /** Button size */
  size?: 'default' | 'large' | 'hero';

  /** Is selected/active */
  selected?: boolean;

  /** Is disabled */
  disabled?: boolean;

  /** Custom style */
  style?: ViewStyle;

  /** Test ID */
  testID?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const QuickAction = memo(function QuickAction({
  label,
  sublabel,
  icon,
  onPress,
  variant = 'secondary',
  size = 'default',
  selected = false,
  disabled = false,
  style,
  testID,
}: QuickActionProps) {
  const { colors, tokens } = useRedesignTheme();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withTiming(0.96, { duration: tokens.animation.duration.fast });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: tokens.animation.duration.fast });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Size styles
  const sizeStyles = {
    default: {
      height: tokens.touchTargets.standard,
      paddingHorizontal: tokens.spacing.base,
    },
    large: {
      height: tokens.touchTargets.large,
      paddingHorizontal: tokens.spacing.lg,
    },
    hero: {
      height: tokens.touchTargets.hero,
      paddingHorizontal: tokens.spacing.xl,
    },
  };

  // Variant styles
  const getVariantStyles = (): ViewStyle => {
    const isActive = selected || variant === 'primary';

    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? colors.textMuted : colors.brand,
          borderWidth: 0,
        };
      case 'secondary':
        return {
          backgroundColor: selected ? colors.brandMuted : colors.surface,
          borderWidth: 1.5,
          borderColor: selected ? colors.brand : colors.border,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: selected ? colors.brand : colors.border,
        };
      case 'ghost':
        return {
          backgroundColor: selected ? colors.brandMuted : 'transparent',
          borderWidth: 0,
        };
      default:
        return {};
    }
  };

  // Text color
  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    if (variant === 'primary') return colors.textInverse;
    if (selected) return colors.brand;
    return colors.textPrimary;
  };

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.button,
        sizeStyles[size],
        getVariantStyles(),
        animatedStyle,
        disabled && styles.disabled,
        style,
      ]}
      accessible
      accessibilityRole="button"
      accessibilityLabel={sublabel ? `${label}, ${sublabel}` : label}
      accessibilityState={{ disabled, selected }}
      testID={testID}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}

      <View style={styles.labelContainer}>
        <Text
          style={[
            styles.label,
            size === 'hero' && styles.labelHero,
            { color: getTextColor() },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {sublabel && (
          <Text
            style={[
              styles.sublabel,
              {
                color: variant === 'primary'
                  ? colors.textInverse + 'CC' // 80% opacity
                  : colors.textMuted,
              },
            ]}
            numberOfLines={1}
          >
            {sublabel}
          </Text>
        )}
      </View>
    </AnimatedPressable>
  );
});

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    gap: 8, // spacing.sm
  },

  disabled: {
    opacity: 0.5,
  },

  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  labelContainer: {
    alignItems: 'center',
  },

  label: {
    fontSize: 18,
    fontWeight: '600',
  },

  labelHero: {
    fontSize: 22,
    fontWeight: '700',
  },

  sublabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
});

export default QuickAction;
