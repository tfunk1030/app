/**
 * LateralAdjustment.tsx
 *
 * A component that displays lateral adjustment recommendations
 * based on wind calculation results.
 */

import { useTokens } from '@/src/theme/useTokens';
import type { Tokens } from '@/src/theme/tokens';
import { safeScaledFontSize } from '@/src/utils/responsive';
import React, { useMemo } from 'react';
import { Text } from 'react-native';

interface LateralAdjustmentProps {
  lateralEffect: number;
}

/**
 * Creates memoized token-based styles for LateralAdjustment
 * Follows same pattern as GlassCard, MetricTile, Button components
 */
function createStyles(t: Tokens) {
  return {
    resultTitle: {
      fontSize: safeScaledFontSize(t.fontSize.lg, { maxScale: 1.25 }), // 18
      color: t.colors.textMuted,
      marginBottom: t.spacing.sm, // 8
      textAlign: 'center' as const,
    },
    resultHighlight: {
      fontSize: safeScaledFontSize(t.fontSize.xl, { maxScale: 1.25 }), // 20
      fontWeight: t.fontWeight.semibold, // '600'
      color: t.colors.brand,
    },
  } as const;
}

export function LateralAdjustment({ lateralEffect }: LateralAdjustmentProps) {
  const t = useTokens();
  const styles = useMemo(() => createStyles(t), [t]);

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
