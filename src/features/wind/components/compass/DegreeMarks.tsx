/**
 * DegreeMarks Component
 *
 * Renders the tick marks and degree labels around the compass ring.
 * Memoized with custom comparison for performance optimization.
 */
import React from 'react';
import { View } from 'react-native';
import { getTickMarkStyles } from '@/src/utils/responsive';
import { DegreeMarksProps, isSignificantHeadingChange } from './types';
import { degreeMarkStyles as styles } from './styles';

const DegreeMarks: React.FC<DegreeMarksProps> = ({ size, heading, borderColor, textColor }) => {
  const marks = [];

  // Simplified: Only show 8 major tick marks (every 45 degrees)
  // This reduces visual clutter while maintaining orientation reference
  for (let i = 0; i < 8; i++) {
    const rotation = i * 45 - heading;
    const tickStyles = getTickMarkStyles(size, 'major');

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
