/**
 * AccuracyIndicator Component
 *
 * Subtle visual indicator for compass reliability.
 * Three states: high (hidden), medium (subtle dot), low (warning icon).
 * Positioned in corner of compass with accessibility support.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

type AccuracyLevel = 'high' | 'medium' | 'low' | 'unreliable';

interface AccuracyIndicatorProps {
  /** Current accuracy level from sensor data */
  accuracy: AccuracyLevel;
  /** Theme colors */
  colors: {
    success: string;
    warning: string;
    error: string;
    background: string;
  };
  /** Size of the indicator */
  size?: number;
}

/**
 * Get accessibility label for accuracy level
 */
function getAccessibilityLabel(accuracy: AccuracyLevel): string {
  switch (accuracy) {
    case 'high':
      return 'Compass accuracy: high';
    case 'medium':
      return 'Compass accuracy: medium - readings may vary slightly';
    case 'low':
      return 'Compass accuracy: low - consider calibrating';
    case 'unreliable':
      return 'Compass accuracy: unreliable - calibration needed';
    default:
      return 'Compass accuracy unknown';
  }
}

const AccuracyIndicator: React.FC<AccuracyIndicatorProps> = ({
  accuracy,
  colors,
  size = 20,
}) => {
  // Don't show indicator for high accuracy
  if (accuracy === 'high') {
    return null;
  }

  const isWarning = accuracy === 'low' || accuracy === 'unreliable';
  const dotColor = isWarning ? colors.warning : colors.success;
  const dotSize = isWarning ? size : size * 0.5;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor: isWarning ? `${colors.warning}20` : 'transparent',
          borderRadius: size / 2,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={getAccessibilityLabel(accuracy)}
    >
      {isWarning ? (
        <AlertTriangle size={size * 0.7} color={colors.warning} />
      ) : (
        <View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: dotColor,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    opacity: 0.8,
  },
});

export default React.memo(AccuracyIndicator);
