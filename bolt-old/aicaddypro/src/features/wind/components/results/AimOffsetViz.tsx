import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTokens as useThemeTokens } from '@/src/theme/useTokens';

/**
 * AimOffsetViz
 *
 * Visualizes the lateral effect as a horizontal bar with a center line and
 * an arrow pointing LEFT/RIGHT. Magnitude controls arrow length (capped).
 */
export function AimOffsetViz({ lateralEffect }: { lateralEffect: number }) {
  const tokens = useThemeTokens();
  if (!lateralEffect) return null;

  const dirRight = lateralEffect > 0;
  const magnitude = Math.min(Math.abs(Math.round(lateralEffect)), 30); // cap at 30 yds
  const pxPerYard = 3; // 3px per yard
  const arrowLen = Math.max(12, Math.min(120, magnitude * pxPerYard));

  return (
    <View
      style={[styles.container]}
      accessibilityRole="summary"
      accessibilityLabel={`Lateral aim offset ${Math.abs(Math.round(lateralEffect))} yards ${dirRight ? 'right' : 'left'}`}
    >
      {/* Center line */}
      <View style={[styles.centerLine, { backgroundColor: tokens.colors.border }]} />
      {/* Arrow body anchored at center */}
      <View
        style={[
          styles.arrow,
          {
            backgroundColor: tokens.colors.brand,
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
            borderLeftColor: dirRight ? tokens.colors.brand : 'transparent',
            borderRightColor: dirRight ? 'transparent' : tokens.colors.brand,
            left: '50%',
            transform: [{ translateX: dirRight ? arrowLen : -arrowLen }, { translateY: -6 }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: 16,
    marginVertical: 8,
  },
  centerLine: {
    position: 'absolute',
    left: '50%',
    width: 1,
    height: '100%',
  },
  arrow: {
    position: 'absolute',
    height: 2,
    top: '50%',
  },
  arrowHead: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
});
