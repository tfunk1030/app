/**
 * PrimaryRecommendation.tsx
 *
 * A component that displays the primary distance recommendation
 * for the wind calculation result.
 */

import { useSettings } from '@/src/core/context/settings';
import { useTokens as useThemeTokens } from '@/src/theme/useTokens';
import { scaledFontSize } from '@/src/utils/responsive';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

interface PrimaryRecommendationProps {
  effectiveDistance: number;
}

export function PrimaryRecommendation({ effectiveDistance }: PrimaryRecommendationProps) {
  const palette = useThemeTokens();
  const styles = React.useMemo(() => getThemedStyles(palette), [palette]);
  const { settings, convertDistance } = useSettings();
  const roundedDistance =
    settings.distanceUnit === 'yards'
      ? Math.round(effectiveDistance)
      : Math.round(effectiveDistance * 0.9144);
  const unitLabel = settings.distanceUnit === 'yards' ? 'yards' : 'm';

  return (
    <Text style={styles.resultTitle} accessibilityRole="header">
      Play this shot{' '}
      <Text style={styles.resultHighlight}>
        {roundedDistance} {unitLabel}
      </Text>
    </Text>
  );
}

function getThemedStyles(palette: ReturnType<typeof useThemeTokens>) {
  return StyleSheet.create({
    resultTitle: {
      fontSize: scaledFontSize(18),
      color: palette.colors.textMuted,
      marginBottom: 8,
      textAlign: 'center',
    },
    resultHighlight: {
      fontSize: scaledFontSize(20),
      fontWeight: '600',
      color: palette.colors.brand,
    },
  });
}
