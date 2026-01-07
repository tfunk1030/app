/**
 * DegreeMarks Component
 *
 * Renders the tick marks and degree labels around the compass ring.
 * Memoized with custom comparison for performance optimization.
 */
import React from 'react';
import { View, Text } from 'react-native';
import {
  scaledFontSize,
  getCompassProgressiveFeatures,
  getTickMarkStyles,
} from '@/src/utils/responsive';
import { DegreeMarksProps, isSignificantHeadingChange } from './types';
import { degreeMarkStyles as styles } from './styles';

const DegreeMarks: React.FC<DegreeMarksProps> = ({ size, heading, borderColor, textColor }) => {
  const features = getCompassProgressiveFeatures(size);
  const marks = [];

  for (let i = 0; i < 72; i++) {
    const rotation = i * 5 - heading;
    const isMajor = i % 9 === 0; // Every 45 degrees (N, NE, E, etc.)
    const isMinor = i % 3 === 0; // Every 15 degrees
    const isSubtle = !isMajor && !isMinor; // Every 5 degrees
    const degrees = i * 5;

    // Skip subtle ticks on smaller compass sizes
    if (isSubtle && !features.showSubtleTickMarks) {
      continue;
    }

    const tickType = isMajor ? 'major' : isMinor ? 'minor' : 'subtle';
    const tickStyles = getTickMarkStyles(size, tickType);

    // Add tick mark
    marks.push(
      <View
        key={`tick-${i}`}
        style={[
          styles.degreeMark,
          {
            transform: [{ rotate: `${rotation}deg` }, { translateY: -(size - 30) / 2 }],
            height: tickStyles.height,
            opacity: tickStyles.opacity,
            width: tickStyles.width,
            backgroundColor: borderColor,
          },
        ]}
      />
    );

    // Degree labels removed - cardinal directions (N, NE, E, etc.) already cover these positions
    // This eliminates the overlap issue between degree numbers and cardinal letters
  }

  return <>{marks}</>;
};

export default React.memo(
  DegreeMarks,
  (prevProps, nextProps) => {
    return (
      Math.abs(prevProps.size - nextProps.size) < 1 &&
      !isSignificantHeadingChange(prevProps.heading, nextProps.heading, 1) &&
      prevProps.borderColor === nextProps.borderColor
    );
  }
);
