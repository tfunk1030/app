import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import { getScrollPadding, getFlexibleMinHeight } from '@/src/utils/responsive';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: boolean; // Enable gradient border effect
  intensity?: number; // Blur intensity (0-100)
  accent?: boolean; // Optional top accent bar
  glow?: boolean; // Enable glow shadow effect
  onPress?: () => void; // Optional press handler
  disabled?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  gradient = false,
  intensity = 20,
  accent = false,
  glow = false,
  onPress,
  disabled = false,
}) => {
  const t = useTokens();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark' || mode === 'system';
  const padding = getScrollPadding(16, { minPadding: 12, maxPadding: 20 });

  // Animation values
  const scale = useSharedValue(1);
  const isPressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (onPress && !disabled) {
      scale.value = withSpring(0.98, {
        damping: t.animation.spring.damping,
        stiffness: t.animation.spring.stiffness,
        mass: t.animation.spring.mass,
      });
      isPressed.value = true;
    }
  }, [onPress, disabled, scale, isPressed, t.animation.spring]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, {
      damping: t.animation.spring.damping,
      stiffness: t.animation.spring.stiffness,
      mass: t.animation.spring.mass,
    });
    isPressed.value = false;
  }, [scale, isPressed, t.animation.spring]);

  // Determine shadow style based on glow prop
  const shadowStyle = glow
    ? {
        shadowColor: t.colors.glowPrimary,
        shadowOffset: t.shadow.glow.shadowOffset,
        shadowOpacity: t.shadow.glow.shadowOpacity,
        shadowRadius: t.shadow.glow.shadowRadius,
        elevation: t.shadow.glow.elevation,
      }
    : {
        shadowColor: t.colors.shadow,
        shadowOffset: t.shadow.card.shadowOffset,
        shadowOpacity: t.shadow.card.shadowOpacity,
        shadowRadius: t.shadow.card.shadowRadius,
        elevation: t.shadow.card.elevation,
      };

  const cardContent = (
    <>
      {/* Gradient border effect */}
      {gradient && (
        <LinearGradient
          colors={t.gradients.primary as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        />
      )}

      {/* Glassmorphism background */}
      {isDark ? (
        <BlurView
          intensity={intensity}
          tint="dark"
          style={[
            styles.blurContainer,
            gradient && styles.withGradientBorder,
          ]}
        >
          {/* Inner surface with glass effect */}
          <View
            style={[
              styles.glassInner,
              {
                backgroundColor: t.colors.surfaceGlass,
                borderColor: gradient ? 'transparent' : t.colors.border,
                borderWidth: gradient ? 0 : 1,
              },
            ]}
          >
            {accent && (
              <LinearGradient
                colors={t.gradients.primary as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.accent}
              />
            )}
            <View style={[styles.inner, { padding }]}>{children}</View>
          </View>
        </BlurView>
      ) : (
        <View
          style={[
            styles.lightContainer,
            gradient && styles.withGradientBorder,
            {
              backgroundColor: t.colors.surface,
              borderColor: gradient ? 'transparent' : t.colors.border,
              borderWidth: gradient ? 0 : 1,
            },
          ]}
        >
          {accent && (
            <LinearGradient
              colors={t.gradients.primary as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.accent}
            />
          )}
          <View style={[styles.inner, { padding }]}>{children}</View>
        </View>
      )}
    </>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.card,
          shadowStyle,
          { minHeight: getFlexibleMinHeight(60) },
          animatedStyle,
          style,
        ]}
      >
        {cardContent}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View
      style={[
        styles.card,
        shadowStyle,
        { minHeight: getFlexibleMinHeight(60) },
        style,
      ]}
    >
      {cardContent}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  blurContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  lightContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  withGradientBorder: {
    margin: 1.5, // Creates the gradient border effect
    borderRadius: 14.5,
  },
  glassInner: {
    flex: 1,
    borderRadius: 14.5,
    overflow: 'hidden',
  },
  accent: {
    height: 3,
    width: '100%',
  },
  inner: {},
});
