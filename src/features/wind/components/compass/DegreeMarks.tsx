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

  // Show tick marks every 10 degrees with major marks at cardinals (N/E/S/W)
  // Per interview decision: "Full ticks every 10° with major at N/S/E/W"
  for (let i = 0; i < 36; i++) {
    const degree = i * 10;
    const rotation = degree - heading;

    // Major marks at cardinal directions (0°, 90°, 180°, 270°)
    const isCardinal = degree % 90 === 0;
    // Medium marks at intercardinals (45°, 135°, 225°, 315°)
    const isIntercardinal = degree % 45 === 0 && !isCardinal;

    const tickType = isCardinal ? 'major' : isIntercardinal ? 'minor' : 'minor';
    const tickStyles = getTickMarkStyles(size, tickType);

    marks.push(
      <View
        key={`tick-${i}`}
        style={[
          styles.degreeMark,
          {
            transform: [{ rotate: `${rotation}deg` }, { translateY: -(size - 30) / 2 }],
            height: isCardinal ? tickStyles.height * 1.2 : tickStyles.height,
            opacity: isCardinal ? 1 : isIntercardinal ? 0.7 : 0.4,
            width: isCardinal ? tickStyles.width * 1.5 : tickStyles.width,
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
