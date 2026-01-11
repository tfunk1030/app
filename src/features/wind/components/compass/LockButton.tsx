/**
 * LockButton Component
 *
 * Button to lock/unlock the compass direction for wind calculations.
 * Includes haptic feedback, animations, and accessibility support.
 */
import React from 'react';
import { View, Pressable, Platform, Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getLockButtonMetrics } from '@/src/utils/responsive';
import { lockButtonStyles as styles } from './styles';
import { useReduceMotionValue } from '@/src/hooks/useAccessibility';

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
      textPrimary: string;
    };
  };
  mode: string; // 'light' | 'dark' | 'system' - only 'dark' check is used
  pulseAnim: Animated.Value;
}

const LockButton: React.FC<LockButtonProps> = ({
  isLocked,
  onPress,
  compassSize,
  tokens,
  mode,
  pulseAnim,
}) => {
  const reduceMotion = useReduceMotionValue();
  const rippleColor = mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const lockMetrics = getLockButtonMetrics(compassSize);
  const glowSize = lockMetrics.size + 8;

  return (
    <View
      style={[
        styles.lockButtonContainer,
        {
          bottom: lockMetrics.bottom,
          right: lockMetrics.right,
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
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.08],
                outputRange: [0.6, 0.2],
              }),
              transform: [{ scale: pulseAnim }],
            },
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
              shadowColor: isLocked ? tokens.colors.success : tokens.colors.shadow,
              shadowOpacity: isLocked ? 0.3 : 0.1,
              shadowOffset: { width: 0, height: isLocked ? 4 : 2 },
              shadowRadius: isLocked ? 12 : 8,
            },
          ]}
        >
          {!isLocked && <BlurView intensity={15} style={StyleSheet.absoluteFill} />}
          {isLocked && (
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                styles.lockPulse,
                {
                  backgroundColor: tokens.colors.success,
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.08],
                    outputRange: [0.1, 0],
                  }),
                  transform: [{ scale: pulseAnim }],
                },
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
