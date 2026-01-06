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

const WindArrow: React.FC<WindArrowProps> = ({
  angle,
  brandAlt,
  success,
  border,
  compassSize,
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

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: angle,
      duration: 1,
      useNativeDriver: true,
    }).start();
  }, [angle]);

  useEffect(() => {
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
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const createWindArrows = () => {
    const arrows = [];
    for (let i = 0; i < 5; i++) {
      const position = 0.75 - i * 0.18;
      const opacityAnim = arrowAnimValues[i];
      arrows.push(
        <Animated.View
          key={`arrow-${i}`}
          style={[
            styles.smallWindArrow,
            {
              transform: [{ translateY: -(position * 135) }, { rotate: '180deg' }],
              left: '50%',
              marginLeft: -6,
              opacity: opacityAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] }),
              borderBottomColor: brandAlt,
            },
          ]}
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
      prevProps.compassSize === nextProps.compassSize
    );
  }
);
