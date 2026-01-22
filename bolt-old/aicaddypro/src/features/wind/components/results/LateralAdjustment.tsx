/**
 * LateralAdjustment.tsx
 *
 * A component that displays lateral adjustment recommendations
 * based on wind calculation results.
 */

import { useTokens as useThemeTokens } from '@/src/theme/useTokens';
import { scaledFontSize } from '@/src/utils/responsive';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

interface LateralAdjustmentProps {
  lateralEffect: number;
}

export function LateralAdjustment({ lateralEffect }: LateralAdjustmentProps) {
  const palette = useThemeTokens();
  const styles = React.useMemo(() => getThemedStyles(palette), [palette]);
  // Only show if there's a lateral effect
  if (lateralEffect === 0) {
    return null;
  }

  // Calculate rounded value and direction
  const roundedLateralEffect = Math.abs(Math.round(lateralEffect));
  const direction = lateralEffect > 0 ? 'RIGHT' : 'LEFT';

  // Create accessibility label
  const accessibilityLabel = `Aim ${roundedLateralEffect} yards ${direction.toLowerCase()}`;

  return (
    <Text
      style={styles.resultTitle}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
    >
      Aim{' '}
      <Text style={styles.resultHighlight}>
        {roundedLateralEffect} yards {direction}
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
