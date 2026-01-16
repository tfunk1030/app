/**
 * WindArrow Component
 *
 * Animated arrow showing wind direction with flowing animation effect.
 * Memoized with proportional scaling for performance.
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { getCenterElementSizes } from '@/src/utils/responsive';
import { WindArrowProps } from './types';
import { arrowStyles as styles } from './styles';

/**
 * Calculate arrow scale factor based on wind magnitude
 * Maps 0-30mph to 0.4-1.0 scale range
 */
function getMagnitudeScale(magnitude: number): number {
  const MIN_SCALE = 0.4;
  const MAX_SCALE = 1.0;
  const MAX_WIND = 30; // mph

  const clampedMagnitude = Math.min(Math.max(magnitude, 0), MAX_WIND);
  const normalized = clampedMagnitude / MAX_WIND;
  return MIN_SCALE + normalized * (MAX_SCALE - MIN_SCALE);
}

/**
 * Calculate base opacity based on wind magnitude
 * Stronger wind = more opaque (0.3-0.8 range)
 */
function getMagnitudeOpacity(magnitude: number): number {
  const MIN_OPACITY = 0.3;
  const MAX_OPACITY = 0.8;
  const MAX_WIND = 30;

  const clampedMagnitude = Math.min(Math.max(magnitude, 0), MAX_WIND);
  const normalized = clampedMagnitude / MAX_WIND;
  return MIN_OPACITY + normalized * (MAX_OPACITY - MIN_OPACITY);
}

const WindArrow: React.FC<WindArrowProps> = ({
  angle,
  brandAlt,
  success,
  border,
  compassSize,
  magnitude = 10, // Default moderate wind
  reducedMotion = false,
}) => {
  const rotateAnim = useRef(new Animated.Value(angle)).current;
  const arrowAnimValues = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const { windOriginIndicator } = getCenterElementSizes(compassSize);

  // Calculate magnitude-based values
  const magnitudeScale = getMagnitudeScale(magnitude);
  const baseOpacity = getMagnitudeOpacity(magnitude);

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: angle,
      duration: reducedMotion ? 0 : 1,
      useNativeDriver: true,
    }).start();
  }, [angle, reducedMotion]);

  useEffect(() => {
    // Skip flow animation if reduced motion is enabled
    if (reducedMotion) {
      arrowAnimValues.forEach(anim => anim.setValue(0.5)); // Static middle state
      return;
    }

    const createFlowAnimation = () => {
      arrowAnimValues.forEach(anim => anim.setValue(0));
      const animations = arrowAnimValues.map((anim, index) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 700,
          delay: index * 5,
          useNativeDriver: true,
        })
      );
      const resetAnimations = arrowAnimValues.map(anim =>
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true })
      );
      animationRef.current = Animated.loop(
        Animated.sequence([...animations, Animated.delay(10), ...resetAnimations]),
        {
          iterations: -1,
        }
      );
      animationRef.current.start();
    };

    createFlowAnimation();
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
      arrowAnimValues.forEach(anim => anim.stopAnimation());
    };
  }, [reducedMotion]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const createWindArrows = () => {
    const arrows = [];
    // Number of arrows scales with magnitude (3-5)
    const arrowCount = Math.max(3, Math.min(5, Math.floor(magnitude / 6)));

    for (let i = 0; i < arrowCount; i++) {
      // Scale position based on magnitude
      const position = (0.75 - i * 0.18) * magnitudeScale;
      const opacityAnim = arrowAnimValues[i];
      // Opacity decreases for further arrows, scaled by magnitude
      const maxOpacity = baseOpacity * (1 - i * 0.1);

      arrows.push(
        <Animated.View
          key={`arrow-${i}`}
          style={[
            styles.smallWindArrow,
            {
              transform: [
                { translateY: -(position * 135) },
                { rotate: '180deg' },
                { scale: magnitudeScale }, // Scale arrow size with magnitude
              ],
              left: '50%',
              marginLeft: -6,
              opacity: reducedMotion
                ? maxOpacity * 0.5 // Static opacity for reduced motion
                : opacityAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, maxOpacity],
                  }),
              borderBottomColor: brandAlt,
            },
          ]}
          accessibilityElementsHidden
        />
      );
    }
    return arrows;
  };

  return (
    <Animated.View
      style={[styles.arrowContainer, { transform: [{ rotate: rotateInterpolate }] }]}
    >
      <View
        style={[
          styles.windOriginIndicator,
          {
            top: 1,
            width: windOriginIndicator,
            height: windOriginIndicator,
            borderRadius: windOriginIndicator / 2,
            backgroundColor: brandAlt,
            borderColor: border,
          },
        ]}
      />
      {createWindArrows()}
    </Animated.View>
  );
};

export default React.memo(
  WindArrow,
  (prevProps, nextProps) => {
    return (
      Math.abs(prevProps.angle - nextProps.angle) < 1 &&
      prevProps.brandAlt === nextProps.brandAlt &&
      prevProps.success === nextProps.success &&
      prevProps.border === nextProps.border &&
      prevProps.compassSize === nextProps.compassSize &&
      Math.abs((prevProps.magnitude ?? 10) - (nextProps.magnitude ?? 10)) < 1 &&
      prevProps.reducedMotion === nextProps.reducedMotion
    );
  }
);
