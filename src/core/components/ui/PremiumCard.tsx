/**
 * PremiumCard Component
 *
 * A polished premium upsell card with animated crown and gradient effects.
 * Designed to encourage premium subscriptions with subtle, engaging animations.
 */

import { Button } from '@/src/core/components/ui/button';
import { GlassCard } from '@/src/core/components/ui/GlassCard';
import { useAccessibleAnimations } from '@/src/hooks/useAccessibility';
import { useTokens } from '@/src/theme/useTokens';
import { safeScaledFontSize } from '@/src/utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Sparkles, Star } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface PremiumCardProps {
  onUpgrade: () => void;
  title?: string;
  description?: string;
  buttonText?: string;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({
  onUpgrade,
  title = 'Unlock Premium',
  description = 'Get wind calculations, advanced analytics, and more',
  buttonText = 'Upgrade Now',
}) => {
  const tokens = useTokens();
  const { prefersReducedMotion } = useAccessibleAnimations();

  // Animation values
  const crownFloat = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0);

  useEffect(() => {
    if (prefersReducedMotion) return;

    // Crown floating animation
    crownFloat.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Shimmer effect on gradient
    shimmer.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );

    // Sparkle pulse
    sparkleOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1,
      true
    );
  }, [prefersReducedMotion, crownFloat, shimmer, sparkleOpacity]);

  const crownStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: crownFloat.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.1, 0.3, 0.1]),
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
  }));

  return (
    <GlassCard gradient glow style={styles.card}>
      <View style={styles.content}>
        {/* Animated crown icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            { backgroundColor: `${tokens.colors.brand}20` },
            crownStyle,
          ]}
        >
          <Crown size={32} color={tokens.colors.brand} />

          {/* Sparkle decorations */}
          {!prefersReducedMotion && (
            <>
              <Animated.View style={[styles.sparkle, styles.sparkleTopRight, sparkleStyle]}>
                <Sparkles size={12} color={tokens.colors.brandAlt} />
              </Animated.View>
              <Animated.View style={[styles.sparkle, styles.sparkleBottomLeft, sparkleStyle]}>
                <Star size={10} color={tokens.colors.brand} />
              </Animated.View>
            </>
          )}
        </Animated.View>

        {/* Text content */}
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: tokens.colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.description, { color: tokens.colors.textMuted }]}>
            {description}
          </Text>
        </View>
      </View>

      {/* Shimmer overlay */}
      {!prefersReducedMotion && (
        <Animated.View style={[styles.shimmerOverlay, shimmerStyle]}>
          <LinearGradient
            colors={['transparent', tokens.colors.brand + '20', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

      <Button variant="neon" size="lg" glow onPress={onUpgrade} style={styles.button}>
        {buttonText}
      </Button>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 24,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    position: 'relative',
  },
  sparkle: {
    position: 'absolute',
  },
  sparkleTopRight: {
    top: -4,
    right: -4,
  },
  sparkleBottomLeft: {
    bottom: -2,
    left: -2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: safeScaledFontSize(18),
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    fontSize: safeScaledFontSize(13),
    lineHeight: 18,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  button: {
    marginTop: 4,
  },
});
