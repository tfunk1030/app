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

    // Add degree labels for major ticks (every 45 degrees)
    if (isMajor && features.showMainDegrees) {
      const labelRadius = (size - 70) / 2; // Position labels inside the compass ring
      const radians = ((degrees - heading) * Math.PI) / 180;
      const x = Math.sin(radians) * labelRadius;
      const y = -Math.cos(radians) * labelRadius;

      // Calculate scaled dimensions for the label container
      const scaledFontSizeValue = scaledFontSize(10);
      const containerHeight = Math.max(24, scaledFontSizeValue * 2);
      const containerWidth = 50;

      marks.push(
        <View
          key={`degree-${i}`}
          style={[
            styles.degreeLabel,
            {
              position: 'absolute',
              left: size / 2 + x - containerWidth / 2,
              top: size / 2 + y - containerHeight / 2,
              width: containerWidth,
              height: containerHeight,
              overflow: 'visible',
            },
          ]}
        >
          <Text
            style={[
              styles.degreeLabelText,
              {
                color: textColor,
                fontSize: scaledFontSizeValue,
                opacity: 0.5,
                lineHeight: scaledFontSizeValue * 1.2,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.6}
          >
            {degrees}°
          </Text>
        </View>
      );
    }
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
