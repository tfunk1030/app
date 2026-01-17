/**
 * CrosswindIndicator Component
 *
 * Perpendicular tick mark showing crosswind component magnitude and direction.
 * Scales based on crosswind strength with color coding for significance.
 */
import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { CrosswindIndicatorProps } from './types';

/**
 * Determine if crosswind is significant (>5 yards typically)
 */
function isSignificantCrosswind(magnitude: number): boolean {
  return Math.abs(magnitude) >= 5;
}

/**
 * Calculate tick width based on magnitude (proportional scaling)
 * Maps 0-15+ yards to 8-32px width
 */
function getTickWidth(magnitude: number, compassSize: number): number {
  const MIN_WIDTH = 8;
  const MAX_WIDTH = compassSize * 0.15; // 15% of compass size max
  const MAX_MAGNITUDE = 15; // yards

  const clamped = Math.min(Math.abs(magnitude), MAX_MAGNITUDE);
  const normalized = clamped / MAX_MAGNITUDE;
  return MIN_WIDTH + normalized * (MAX_WIDTH - MIN_WIDTH);
}

/**
 * Calculate tick opacity based on magnitude
 * Small crosswinds are subtle, large are prominent
 */
function getTickOpacity(magnitude: number): number {
  const MIN_OPACITY = 0.3;
  const MAX_OPACITY = 0.9;
  const MAX_MAGNITUDE = 15;

  const clamped = Math.min(Math.abs(magnitude), MAX_MAGNITUDE);
  const normalized = clamped / MAX_MAGNITUDE;
  return MIN_OPACITY + normalized * (MAX_OPACITY - MIN_OPACITY);
}

const CrosswindIndicator: React.FC<CrosswindIndicatorProps> = ({
  magnitude,
  direction,
  unit,
  compassSize,
  colors,
}) => {
  // Skip rendering for negligible crosswind
  if (Math.abs(magnitude) < 1) {
    return null;
  }

  const tickWidth = getTickWidth(magnitude, compassSize);
  const opacity = getTickOpacity(magnitude);
  const isSignificant = isSignificantCrosswind(magnitude);
  const tickColor = isSignificant ? colors.warning : colors.neutral;

  // Position perpendicular to center (90 degrees from wind arrow)
  // Left crosswind = tick extends left, Right crosswind = tick extends right
  const horizontalOffset = direction === 'left' ? -tickWidth : 0;

  const accessibilityLabel = `Crosswind ${Math.round(Math.abs(magnitude))} ${unit} ${direction}`;

  return (
    <View
      style={styles.container}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      pointerEvents="none"
    >
      {/* Main tick mark */}
      <View
        style={[
          styles.tick,
          {
            width: tickWidth,
            height: 4,
            backgroundColor: tickColor,
            opacity,
            left: horizontalOffset,
          },
        ]}
      />

      {/* Arrow head indicating direction */}
      <View
        style={[
          styles.arrowHead,
          {
            borderBottomColor: tickColor,
            opacity,
            left: direction === 'left' ? -tickWidth - 6 : tickWidth - 2,
            transform: [{ rotate: direction === 'left' ? '-90deg' : '90deg' }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    // Positioned at center of compass
  },
  tick: {
    position: 'absolute',
    borderRadius: 2,
  },
  arrowHead: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});

export default React.memo(CrosswindIndicator);
