import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useTokens } from '@/src/theme/useTokens';
import type { Tokens } from '@/src/theme/tokens';

/**
 * Creates memoized token-based styles for AimOffsetViz
 * Follows same pattern as GlassCard, MetricTile, Button components
 */
function createStyles(t: Tokens) {
  return {
    container: {
      position: 'relative' as const,
      height: t.spacing.md, // 16
      marginVertical: t.spacing.sm, // 8
    },
    centerLine: {
      position: 'absolute' as const,
      left: '50%' as const,
      width: t.borderWidth.thin, // 1
      height: '100%' as const,
    },
    arrow: {
      position: 'absolute' as const,
      height: 2, // Arrow stroke width
      top: '50%' as const,
    },
    arrowHead: {
      position: 'absolute' as const,
      width: 0,
      height: 0,
      borderStyle: 'solid' as const,
      borderTopWidth: 6, // Arrow head triangle dimensions
      borderBottomWidth: 6,
      borderLeftWidth: t.spacing.sm, // 8
      borderRightWidth: t.spacing.sm, // 8
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
    },
  } as const;
}

/**
 * AimOffsetViz
 *
 * Visualizes the lateral effect as a horizontal bar with a center line and
 * an arrow pointing LEFT/RIGHT. Magnitude controls arrow length (capped).
 */
export function AimOffsetViz({ lateralEffect }: { lateralEffect: number }) {
  const t = useTokens();
  const styles = useMemo(() => createStyles(t), [t]);

  if (!lateralEffect) return null;

  const dirRight = lateralEffect > 0;
  const magnitude = Math.min(Math.abs(Math.round(lateralEffect)), 30); // cap at 30 yds
  const pxPerYard = 3; // 3px per yard
  const arrowLen = Math.max(t.spacing.base, Math.min(t.spacing['5xl'], magnitude * pxPerYard)); // 12-120

  return (
    <View
      style={styles.container}
      accessibilityRole="summary"
      accessibilityLabel={`Lateral aim offset ${Math.abs(Math.round(lateralEffect))} yards ${dirRight ? 'right' : 'left'}`}
    >
      {/* Center line */}
      <View style={[styles.centerLine, { backgroundColor: t.colors.border }]} />
      {/* Arrow body anchored at center */}
      <View
        style={[
          styles.arrow,
          {
            backgroundColor: t.colors.brand,
            width: arrowLen,
            left: '50%',
            transform: [{ translateX: dirRight ? 0 : -arrowLen }, { translateY: -1 }],
          },
        ]}
      />
      {/* Arrow head positioned from center with translateX */}
      <View
        style={[
          styles.arrowHead,
          {
            borderLeftColor: dirRight ? t.colors.brand : 'transparent',
            borderRightColor: dirRight ? 'transparent' : t.colors.brand,
            left: '50%',
            transform: [{ translateX: dirRight ? arrowLen : -arrowLen }, { translateY: -6 }],
          },
        ]}
      />
    </View>
  );
}
