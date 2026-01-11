/**
 * ResultCard - Primary output display for shot calculations
 *
 * The hero component of the redesign - shows the main recommendation
 * at a glance with large, readable typography.
 *
 * Design principles:
 * - Large, bold primary result
 * - Secondary details below
 * - High contrast for outdoor readability
 * - Minimal decoration (no gradients, subtle shadows only)
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, ViewStyle, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRedesignTheme } from '@/src/theme/redesign';

// =============================================================================
// TYPES
// =============================================================================

interface ResultCardProps {
  /** Main result text (e.g., "168 yards") */
  primaryValue: string;

  /** Unit for primary value (e.g., "yards") */
  primaryUnit?: string;

  /** Label above primary (e.g., "Plays like") */
  primaryLabel?: string;

  /** Secondary result (e.g., "7-Iron") */
  secondaryValue?: string;

  /** Label for secondary (e.g., "Club") */
  secondaryLabel?: string;

  /** Tertiary info (e.g., "Aim 8 yards left") */
  tertiaryValue?: string;

  /** Label for tertiary */
  tertiaryLabel?: string;

  /** Tertiary value semantic color: 'positive' (green/shorter), 'negative' (red/longer), 'neutral' */
  tertiaryStatus?: 'positive' | 'negative' | 'neutral';

  /** Card variant */
  variant?: 'default' | 'highlighted' | 'compact';

  /** Press handler */
  onPress?: () => void;

  /** Custom style */
  style?: ViewStyle;

  /** Test ID */
  testID?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ResultCard = memo(function ResultCard({
  primaryValue,
  primaryUnit,
  primaryLabel = 'Plays like',
  secondaryValue,
  secondaryLabel = 'Club',
  tertiaryValue,
  tertiaryLabel = 'Adjustment',
  tertiaryStatus = 'neutral',
  variant = 'default',
  onPress,
  style,
  testID,
}: ResultCardProps) {
  const { colors, tokens } = useRedesignTheme();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withTiming(0.98, { duration: tokens.animation.duration.fast });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: tokens.animation.duration.fast });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isHighlighted = variant === 'highlighted';
  const isCompact = variant === 'compact';

  const cardStyles: ViewStyle[] = [
    styles.card,
    {
      backgroundColor: colors.surface,
      borderColor: isHighlighted ? colors.brand : colors.border,
      borderWidth: isHighlighted ? 2 : 1,
      padding: isCompact ? tokens.spacing.base : tokens.spacing.lg,
      ...(isHighlighted && {
        ...tokens.shadows.lg,
        shadowColor: colors.brand,
      }),
    },
    style,
  ].filter(Boolean) as ViewStyle[];

  const content = (
    <>
      {/* Primary Result */}
      <View style={styles.primarySection}>
        {primaryLabel && (
          <Text
            style={[
              styles.label,
              { color: colors.textMuted },
            ]}
          >
            {primaryLabel}
          </Text>
        )}
        <View style={styles.primaryValueRow}>
          <Text
            style={[
              isCompact ? styles.primaryValueCompact : styles.primaryValue,
              { color: colors.textPrimary },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {primaryValue}
          </Text>
          {primaryUnit && (
            <Text
              style={[
                styles.primaryUnit,
                { color: colors.textSecondary },
              ]}
            >
              {primaryUnit}
            </Text>
          )}
        </View>
      </View>

      {/* Secondary & Tertiary Row */}
      {(secondaryValue || tertiaryValue) && (
        <View style={styles.detailsRow}>
          {secondaryValue && (
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>
                {secondaryLabel}
              </Text>
              <Text style={[styles.detailValue, { color: colors.brand }]}>
                {secondaryValue}
              </Text>
            </View>
          )}

          {tertiaryValue && (
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>
                {tertiaryLabel}
              </Text>
              <Text style={[
                styles.detailValue,
                {
                  color: tertiaryStatus === 'positive'
                    ? colors.success
                    : tertiaryStatus === 'negative'
                    ? colors.error
                    : colors.textPrimary,
                },
              ]}>
                {tertiaryValue}
              </Text>
            </View>
          )}
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
        style={[cardStyles, animatedStyle]}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${primaryLabel} ${primaryValue} ${primaryUnit || ''}`}
        testID={testID}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={cardStyles}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${primaryLabel} ${primaryValue} ${primaryUnit || ''}`}
      testID={testID}
    >
      {content}
    </Animated.View>
  );
});

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    minHeight: 140,
  },

  primarySection: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  primaryValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  primaryValue: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1.5,
    lineHeight: 56,
  },

  primaryValueCompact: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 44,
  },

  primaryUnit: {
    fontSize: 20,
    fontWeight: '500',
    marginLeft: 8,
  },

  detailsRow: {
    flexDirection: 'row',
    gap: 24,
  },

  detailItem: {
    flex: 1,
  },

  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },

  detailValue: {
    fontSize: 20,
    fontWeight: '600',
  },
});

export default ResultCard;
