/**
 * PrimaryRecommendation.tsx
 *
 * A component that displays the primary distance recommendation
 * for the wind calculation result, styled to match the hero pattern
 * used in the Shot Calculator's "Plays Like" display.
 */

import { useSettings } from '@/src/core/context/settings';
import type { Tokens } from '@/src/theme/tokens';
import { useTokens as useThemeTokens } from '@/src/theme/useTokens';
import { safeScaledFontSize } from '@/src/utils/responsive';
import React from 'react';
import { Platform, Text, View, TextStyle, ViewStyle } from 'react-native';

interface PrimaryRecommendationProps {
  effectiveDistance: number;
}

export function PrimaryRecommendation({ effectiveDistance }: PrimaryRecommendationProps) {
  const t = useThemeTokens();
  const styles = React.useMemo(() => createStyles(t), [t]);
  const { settings, convertDistance } = useSettings();
  const roundedDistance =
    settings.distanceUnit === 'yards'
      ? Math.round(effectiveDistance)
      : Math.round(convertDistance(effectiveDistance, 'meters'));
  const unitLabel = settings.distanceUnit === 'yards' ? 'yards' : 'm';

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel={`Plays like ${roundedDistance} ${unitLabel}`}
    >
      <Text style={styles.label} accessibilityRole="header">
        Plays Like
      </Text>
      <View style={styles.valueRow} importantForAccessibility="no-hide-descendants">
        <Text style={styles.value}>
          {roundedDistance}
        </Text>
        <Text style={styles.unit}>
          {unitLabel}
        </Text>
      </View>
    </View>
  );
}

/**
 * Creates token-based styles for PrimaryRecommendation
 * Matches the hero styling pattern from Shot Calculator's "Plays Like" display
 */
const createStyles = (t: Tokens) => ({
  container: {
    alignItems: 'center',
    marginBottom: t.spacing.md, // 16px - consistent with other result sections
  } as ViewStyle,
  label: {
    fontSize: safeScaledFontSize(t.fontSize.sm), // 14px
    fontWeight: t.fontWeight.semibold,
    color: t.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: t.letterSpacing.wider, // 1 - matches "PLAYS LIKE" label
    marginBottom: t.spacing.sm, // 8px
  } as TextStyle,
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  } as ViewStyle,
  value: {
    fontSize: safeScaledFontSize(t.containerSize.icon.lg + 8), // 56px - matches hero pattern
    fontWeight: t.fontWeight.extrabold, // '800' - hero emphasis
    color: t.colors.brand, // Brand color for the primary value
    letterSpacing: t.letterSpacing.tighter * 2, // -2 - tight tracking for large numbers
    ...Platform.select({
      ios: { fontFamily: 'Menlo' },
      android: { fontFamily: 'monospace' },
    }),
  } as TextStyle,
  unit: {
    fontSize: safeScaledFontSize(t.fontSize.lg), // 18px
    fontWeight: t.fontWeight.medium,
    color: t.colors.textMuted,
    marginLeft: t.spacing.xs, // 4px
  } as TextStyle,
});
