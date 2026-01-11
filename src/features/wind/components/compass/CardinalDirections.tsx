/**
 * CardinalDirections Component
 *
 * Renders the N, NE, E, SE, S, SW, W, NW direction markers around the compass.
 * Memoized with proportional scaling and North prominence.
 */
import React from 'react';
import { View, Text } from 'react-native';
import {
  getCompassProgressiveFeatures,
  getCardinalDirectionStyles,
  getCardinalDirectionRadius,
} from '@/src/utils/responsive';
import { CardinalDirectionsProps, isSignificantHeadingChange } from './types';
import { cardinalDirectionStyles as styles } from './styles';

const directions = [
  { label: 'N', angle: 0, degrees: '0°' },
  { label: 'NE', angle: 45, degrees: '45°' },
  { label: 'E', angle: 90, degrees: '90°' },
  { label: 'SE', angle: 135, degrees: '135°' },
  { label: 'S', angle: 180, degrees: '180°' },
  { label: 'SW', angle: 225, degrees: '225°' },
  { label: 'W', angle: 270, degrees: '270°' },
  { label: 'NW', angle: 315, degrees: '315°' },
];

const CardinalDirections: React.FC<CardinalDirectionsProps> = ({
  size,
  heading,
  textColor,
  subTextColor,
  badgeBg,
  badgeBorder,
  brandAltColor,
}) => {
  const features = getCompassProgressiveFeatures(size);
  const outerRadius = getCardinalDirectionRadius(size);

  return (
    <>
      {directions.map(({ label, angle }) => {
        const isMainDirection = label.length === 1;
        const isIntercardinal = !isMainDirection;

        // Skip intercardinals on smaller compass sizes
        if (isIntercardinal && !features.showIntercardinals) {
          return null;
        }

        const radians = ((angle - heading) * Math.PI) / 180;
        const x = Math.sin(radians) * outerRadius;
        const y = -Math.cos(radians) * outerRadius;

        const directionStyles = getCardinalDirectionStyles(size, label);
        const containerHalfSize = directionStyles.containerSize / 2;

        const nScale = label === 'N' ? 0.9 : 1; // Reduce North size slightly per user preference
        const nFontScale = label === 'N' ? 0.92 : 1;

        return (
          <View
            key={label}
            style={[
              styles.cardinalDirection,
              {
                position: 'absolute',
                left: size / 2 + x - containerHalfSize,
                top: size / 2 + y - containerHalfSize,
                width: directionStyles.containerSize,
                height: directionStyles.containerSize,
                transform: [{ scale: directionStyles.sizeMultiplier * nScale }],
              },
            ]}
          >
            <View
              style={[
                styles.cardinalBackground,
                { overflow: 'hidden' }, // Prevent text bleed on accessibility scaling
                label === 'N' && {
                  backgroundColor: `${brandAltColor}15`,
                  borderColor: brandAltColor || badgeBorder,
                  borderWidth: 2,
                },
                isMainDirection && label !== 'N' && {
                  backgroundColor: 'transparent',
                  borderColor: badgeBorder,
                  borderWidth: 1,
                },
              ]}
            >
              <View style={styles.cardinalTextContainer}>
                <Text
                  style={[
                    styles.cardinalText,
                    {
                      // High contrast: N uses brand color, main cardinals use primary text, intercardinals use muted
                      color: label === 'N'
                        ? brandAltColor || textColor
                        : isMainDirection
                        ? textColor // Changed from subTextColor for better contrast
                        : subTextColor,
                      fontSize: directionStyles.fontSize * nFontScale,
                      fontWeight: directionStyles.fontWeight as any,
                      // Higher opacity for better outdoor readability
                      opacity: isMainDirection ? 1 : directionStyles.opacity,
                    },
                    label === 'N' && styles.northCardinalText,
                  ]}
                >
                  {label}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </>
  );
};

export default React.memo(
  CardinalDirections,
  (prevProps, nextProps) => {
    return (
      Math.abs(prevProps.size - nextProps.size) < 1 &&
      !isSignificantHeadingChange(prevProps.heading, nextProps.heading, 1) &&
      prevProps.textColor === nextProps.textColor &&
      prevProps.subTextColor === nextProps.subTextColor &&
      prevProps.badgeBg === nextProps.badgeBg &&
      prevProps.badgeBorder === nextProps.badgeBorder &&
      prevProps.brandAltColor === nextProps.brandAltColor
    );
  }
);
