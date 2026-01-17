/**
 * LateralAdjustment.tsx
 *
 * A component that displays lateral adjustment recommendations
 * based on wind calculation results. Promoted to prominent position in results.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTokens } from '@/src/theme/useTokens';
import type { Tokens } from '@/src/theme/tokens';
import { safeScaledFontSize } from '@/src/utils/responsive';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

interface LateralAdjustmentProps {
  lateralEffect: number;
}

/**
 * Creates memoized token-based styles for LateralAdjustment
 * Follows same pattern as GlassCard, MetricTile, Button components
 */
function createStyles(t: Tokens) {
  return {
    container: {
      backgroundColor: t.colors.surfaceAlt,
      borderRadius: t.borderRadius.lg,
      padding: t.spacing.md,
      marginBottom: t.spacing.md,
      alignItems: 'center' as const,
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
      gap: t.spacing.sm,
    },
    label: {
      fontSize: safeScaledFontSize(t.fontSize.base, { maxScale: 1.25 }), // 16
      color: t.colors.textMuted,
    },
    value: {
      fontSize: safeScaledFontSize(t.fontSize.xl, { maxScale: 1.25 }), // 20
      fontWeight: '700' as const,
      color: t.colors.warning, // Stand out color
    },
    direction: {
      fontSize: safeScaledFontSize(t.fontSize.lg, { maxScale: 1.25 }), // 18
      fontWeight: '600' as const,
      color: t.colors.warning,
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
  const iconName = lateralEffect > 0 ? 'arrow-right' : 'arrow-left';

  // Create accessibility label
  const accessibilityLabel = `Aim ${roundedLateralEffect} yards ${direction.toLowerCase()}`;

  return (
    <View
      style={styles.container}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={styles.label}>Aim</Text>
      <MaterialCommunityIcons name={iconName} size={24} color={t.colors.warning} />
      <Text style={styles.value}>{roundedLateralEffect}</Text>
      <Text style={styles.direction}>yds {direction}</Text>
    </View>
  );
}
