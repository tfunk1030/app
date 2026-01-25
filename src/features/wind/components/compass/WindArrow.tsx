/**
 * WindArrow Component
 *
 * Animated arrow showing wind direction with flowing animation effect.
 * Uses react-native-reanimated for UI-thread animations.
 * Memoized with proportional scaling for performance.
 */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  useReducedMotion,
  interpolate,
  cancelAnimation,
  SharedValue,
} from 'react-native-reanimated';
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
 * Stronger wind = more opaque (0.4-1.0 range)
 */
function getMagnitudeOpacity(magnitude: number): number {
  const MIN_OPACITY = 0.4;
  const MAX_OPACITY = 1.0;
  const MAX_WIND = 30;

  const clampedMagnitude = Math.min(Math.max(magnitude, 0), MAX_WIND);
  const normalized = clampedMagnitude / MAX_WIND;
  return MIN_OPACITY + normalized * (MAX_OPACITY - MIN_OPACITY);
}

/**
 * Get arrow color based on wind relationship
 * TAILWIND = green (helps), HEADWIND = red (hurts), CROSSWIND = yellow (lateral)
 */
function getWindArrowColor(
  windRelationship: 'HEADWIND' | 'TAILWIND' | 'CROSSWIND' | 'QUARTERING' | undefined,
  colors: { success: string; danger: string; warning: string; brandAlt: string }
): string {
  switch (windRelationship) {
    case 'TAILWIND':
      return colors.success;  // Green - helps (adds distance)
    case 'HEADWIND':
      return colors.danger;   // Red - hurts (reduces distance)
    case 'CROSSWIND':
      return colors.warning;  // Yellow - lateral effect
    case 'QUARTERING':
    default:
      return colors.brandAlt; // Default brand color
  }
}

/**
 * Animated small arrow component for flow effect
 */
const AnimatedArrow: React.FC<{
  index: number;
  position: number;
  maxOpacity: number;
  magnitudeScale: number;
  arrowColor: string;
  animProgress: SharedValue<number>;
  reducedMotion: boolean;
}> = React.memo(({ index, position, maxOpacity, magnitudeScale, arrowColor, animProgress, reducedMotion }) => {
  const animatedStyle = useAnimatedStyle(() => {
    // Each arrow fades in sequence based on index offset
    const localProgress = (animProgress.value - index * 0.05 + 1) % 1;
    const opacity = reducedMotion
      ? maxOpacity * 0.5
      : interpolate(localProgress, [0, 0.5, 1], [0, maxOpacity, 0]);

    return {
      opacity,
      transform: [
        { translateY: -(position * 135) },
        { rotate: '180deg' },
        { scale: magnitudeScale },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.smallWindArrow,
        {
          left: '50%',
          marginLeft: -6,
          borderBottomColor: arrowColor,
        },
        animatedStyle,
      ]}
      accessibilityElementsHidden
    />
  );
});

const WindArrow: React.FC<WindArrowProps> = ({
  angle,
  brandAlt,
  success,
  border,
  compassSize,
  magnitude = 10, // Default moderate wind
  reducedMotion: reducedMotionProp = false,
  windRelationship,
  danger,
  warning,
  gustSpeed,
}) => {
  // Use reanimated's reduced motion hook, but also respect prop
  const systemReducedMotion = useReducedMotion();
  const reducedMotion = reducedMotionProp || systemReducedMotion;

  // Calculate dynamic arrow color based on wind relationship
  const baseArrowColor = getWindArrowColor(windRelationship, {
    success,
    danger,
    warning,
    brandAlt,
  });

  // Apply opacity to color based on wind magnitude (pale for weak, vivid for strong)
  const colorOpacity = getMagnitudeOpacity(magnitude);
  const arrowColor = `${baseArrowColor}${Math.round(colorOpacity * 255).toString(16).padStart(2, '0')}`;

  // Shared values for animations
  const rotateValue = useSharedValue(angle);
  const scaleValue = useSharedValue(1);
  const flowProgress = useSharedValue(0);

  const { windOriginIndicator } = getCenterElementSizes(compassSize);

  // Calculate magnitude-based values
  const magnitudeScale = getMagnitudeScale(magnitude);
  const baseOpacity = getMagnitudeOpacity(magnitude);

  // Rotation animation - instant update with spring
  useEffect(() => {
    if (reducedMotion) {
      rotateValue.value = angle;
    } else {
      rotateValue.value = withSpring(angle, {
        damping: 20,
        stiffness: 300,
      });
    }
  }, [angle, reducedMotion]);

  // Flow animation - continuous looping
  useEffect(() => {
    if (reducedMotion) {
      flowProgress.value = 0.5; // Static middle state
      return;
    }

    // Continuous 0-1 progress for flow effect
    flowProgress.value = 0;
    flowProgress.value = withRepeat(
      withTiming(1, { duration: 700 }),
      -1,
      false
    );

    return () => {
      cancelAnimation(flowProgress);
    };
  }, [reducedMotion]);

  // Gust pulse animation - pulses when gustSpeed > wind speed
  const gustActive = gustSpeed !== undefined && gustSpeed > magnitude;

  useEffect(() => {
    if (gustActive && !reducedMotion) {
      // Pulse animation when gusts are active - reduced to 200ms per direction
      scaleValue.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 200 }),
          withTiming(1, { duration: 200 })
        ),
        -1,
        true
      );
    } else {
      // Reset scale when gusts stop
      scaleValue.value = reducedMotion ? 1 : withSpring(1, { damping: 15, stiffness: 200 });
    }

    return () => {
      cancelAnimation(scaleValue);
    };
  }, [gustActive, reducedMotion]);

  // Animated style for main container
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotateValue.value}deg` },
      { scale: scaleValue.value },
    ],
  }));

  // Generate arrow elements
  const arrowCount = Math.max(3, Math.min(5, Math.floor(magnitude / 6)));
  const arrows = [];
  for (let i = 0; i < arrowCount; i++) {
    const position = (0.75 - i * 0.18) * magnitudeScale;
    const maxOpacity = baseOpacity * (1 - i * 0.1);

    arrows.push(
      <AnimatedArrow
        key={`arrow-${i}`}
        index={i}
        position={position}
        maxOpacity={maxOpacity}
        magnitudeScale={magnitudeScale}
        arrowColor={arrowColor}
        animProgress={flowProgress}
        reducedMotion={reducedMotion}
      />
    );
  }

  return (
    <Animated.View style={[styles.arrowContainer, containerAnimatedStyle]}>
      <View
        style={[
          styles.windOriginIndicator,
          {
            top: 1,
            width: windOriginIndicator,
            height: windOriginIndicator,
            borderRadius: windOriginIndicator / 2,
            backgroundColor: arrowColor,
            borderColor: border,
          },
        ]}
      />
      {arrows}
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
      prevProps.reducedMotion === nextProps.reducedMotion &&
      prevProps.windRelationship === nextProps.windRelationship &&
      prevProps.danger === nextProps.danger &&
      prevProps.warning === nextProps.warning &&
      Math.abs((prevProps.gustSpeed ?? 0) - (nextProps.gustSpeed ?? 0)) < 1
    );
  }
);
