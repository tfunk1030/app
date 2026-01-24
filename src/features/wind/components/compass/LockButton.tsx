/**
 * LockButton Component
 *
 * Button to lock/unlock the compass direction for wind calculations.
 * Includes haptic feedback, animations, and accessibility support.
 * Uses react-native-reanimated for UI-thread animations.
 */
import React from 'react';
import { View, Pressable, Platform, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getLockButtonMetrics } from '@/src/utils/responsive';
import { lockButtonStyles as styles } from './styles';
import { useReduceMotionValue } from '@/src/hooks/useReduceMotion';
import { useReduceTransparencyValue } from '@/src/hooks/useReduceTransparency';

interface LockButtonProps {
  isLocked: boolean;
  onPress: () => void;
  compassSize: number;
  tokens: {
    colors: {
      success: string;
      surface: string;
      border: string;
      shadow: string;
      shadowAlpha: string;
      textPrimary: string;
      ripple: string;
    };
  };
  mode: string; // 'light' | 'dark' | 'system' - only 'dark' check is used
  pulseAnim: SharedValue<number>;
  /** Which side to position the button - based on dominant hand */
  side?: 'left' | 'right';
}

const LockButton: React.FC<LockButtonProps> = ({
  isLocked,
  onPress,
  compassSize,
  tokens,
  mode,
  pulseAnim,
  side = 'right',
}) => {
  const reduceMotion = useReduceMotionValue();
  const reduceTransparency = useReduceTransparencyValue();
  const rippleColor = tokens.colors.ripple;
  const lockMetrics = getLockButtonMetrics(compassSize, side);
  const glowSize = lockMetrics.size + 8;

  // Animated style for outer glow ring
  const outerGlowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulseAnim.value, [1, 1.08], [0.6, 0.2]),
    transform: [{ scale: pulseAnim.value }],
  }));

  // Animated style for lock pulse overlay
  const lockPulseAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulseAnim.value, [1, 1.08], [0.1, 0]),
    transform: [{ scale: pulseAnim.value }],
  }));

  return (
    <View
      style={[
        styles.lockButtonContainer,
        {
          bottom: lockMetrics.bottom,
          // Position based on dominant hand preference
          ...(side === 'left'
            ? { left: lockMetrics.left, right: undefined }
            : { right: lockMetrics.right, left: undefined }),
        },
      ]}
    >
      {/* Outer glow ring when locked */}
      {isLocked && !reduceMotion && (
        <Animated.View
          style={[
            localStyles.outerGlow,
            {
              width: glowSize,
              height: glowSize,
              borderRadius: glowSize / 2,
              borderColor: tokens.colors.success,
            },
            outerGlowAnimatedStyle,
          ]}
        />
      )}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={isLocked ? 'Unlock compass' : 'Lock compass to current direction'}
        accessibilityHint="Locks the shot direction for wind calculations"
        android_ripple={{ color: rippleColor, borderless: false }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={({ pressed }) => [
          styles.lockButtonWrapper,
          pressed && Platform.OS === 'ios' && { opacity: 0.85, transform: [{ scale: 0.95 }] },
        ]}
      >
        <View
          style={[
            styles.lockButton,
            {
              width: lockMetrics.size,
              height: lockMetrics.size,
              borderRadius: lockMetrics.size / 2,
              backgroundColor: isLocked
                ? `${tokens.colors.success}E6` // 90% opacity
                : mode === 'dark'
                ? `${tokens.colors.surface}80` // 50% opacity for better visibility in dark mode
                : `${tokens.colors.surface}66`, // 40% opacity for light mode
              borderColor: isLocked
                ? tokens.colors.success
                : tokens.colors.border,
              borderWidth: 2,
              // CSS boxShadow (New Architecture)
              boxShadow: isLocked
                ? `0 4px 12px ${tokens.colors.success}4D` // 30% opacity
                : `0 2px 8px ${tokens.colors.shadowAlpha}`,
            },
          ]}
        >
          {/* Blur effect when unlocked - falls back to solid when Reduce Transparency is enabled */}
          {!isLocked && (
            reduceTransparency ? (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: tokens.colors.surface }]} />
            ) : (
              <BlurView intensity={15} style={StyleSheet.absoluteFill} />
            )
          )}
          {isLocked && !reduceMotion && (
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                styles.lockPulse,
                {
                  backgroundColor: tokens.colors.success,
                },
                lockPulseAnimatedStyle,
              ]}
            />
          )}
          <MaterialCommunityIcons
            name={isLocked ? 'lock' : 'lock-open-variant'}
            size={24}
            color={isLocked
              ? tokens.colors.surface
              : tokens.colors.textPrimary
            }
          />
        </View>
      </Pressable>
    </View>
  );
};

const localStyles = StyleSheet.create({
  outerGlow: {
    position: 'absolute',
    borderWidth: 2,
    top: -4,
    left: -4,
  },
});

export default React.memo(LockButton);
