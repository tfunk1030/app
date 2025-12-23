/**
 * Wind Direction Compass Component
 *
 * Displays a compass that shows the current heading and wind direction.
 * Uses the native iOS compass API via the SensorDataProvider for exact heading accuracy.
 * Heading values are not affected by device tilt and match the iPhone's built-in compass.
 * Enhanced with modern design elements and improved visual hierarchy.
 */
import { useEnhancedEnvironmental } from '@/src/providers/EnhancedEnvironmentalProvider';
import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import { LogManager } from '@/src/utils/LogManager';
import {
  scaledFontSize,
  getResponsiveCompassSize,
  getTouchTargetSize,
  getCompassScaledValue,
  getLockButtonMetrics,
  getCardinalDirectionStyles,
  getTickMarkStyles,
  getCompassProgressiveFeatures,
  getCardinalDirectionRadius,
  getCenterElementSizes
} from '@/src/utils/responsive';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Platform, Pressable, StyleSheet, Text, View, AccessibilityInfo } from 'react-native';
import { useCompassLock } from '../context/compass-lock';
import { useSensorData } from '../context/sensor-data';

// Create a dedicated logger
const logger = LogManager.getLogger('WindDirectionCompass');

// Get screen dimensions for positioning
const { width: screenWidth } = Dimensions.get('window');

interface WindDirectionCompassProps {
  size?: number;
  windDirection?: number;
  shotDirection?: number;
  onChange?: (type: string, degrees: number) => void;
  lockShot?: boolean;
}

// Utility function for heading change threshold
const isSignificantHeadingChange = (prev: number, next: number, threshold = 1): boolean => {
  if (prev === next) return false;
  if (Math.abs(prev - next) > 180) {
    const diff = 360 - Math.max(prev, next) + Math.min(prev, next);
    return diff >= threshold;
  }
  return Math.abs(prev - next) >= threshold;
};

// Memoized degree marks component with improved visibility and degree labels
const DegreeMarks = React.memo(
  ({ size, heading, borderColor, textColor }: { size: number; heading: number; borderColor: string; textColor: string }) => {
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
        const containerHeight = Math.max(24, scaledFontSizeValue * 2); // Ensure sufficient height
        const containerWidth = 50; // Increased width to prevent truncation

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
                overflow: 'visible', // Allow text to be fully visible
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
                  lineHeight: scaledFontSizeValue * 1.2, // Ensure proper line height
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
  },
  (prevProps, nextProps) => {
    return (
      Math.abs(prevProps.size - nextProps.size) < 1 &&
      !isSignificantHeadingChange(prevProps.heading, nextProps.heading, 1) &&
      prevProps.borderColor === nextProps.borderColor
    );
  }
);

// Memoized cardinal directions component with proportional scaling and North prominence
const CardinalDirections = React.memo(
  ({
    size,
    heading,
    textColor,
    subTextColor,
    badgeBg,
    badgeBorder,
    brandAltColor,
  }: {
    size: number;
    heading: number;
    textColor: string;
    subTextColor: string;
    badgeBg: string;
    badgeBorder: string;
    brandAltColor?: string;
  }) => {
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

    const features = getCompassProgressiveFeatures(size);
    const outerRadius = getCardinalDirectionRadius(size);

    return (
      <>
        {directions.map(({ label, angle, degrees }) => {
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

          const shouldShowDegrees =
            (isMainDirection && features.showMainDegrees) ||
            (isIntercardinal && features.showIntercardinalDegrees);

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
                        color: label === 'N'
                          ? brandAltColor || textColor
                          : isMainDirection
                          ? subTextColor
                          : subTextColor,
                        fontSize: directionStyles.fontSize * nFontScale,
                        fontWeight: directionStyles.fontWeight as any,
                        opacity: directionStyles.opacity,
                      },
                      label === 'N' && styles.northCardinalText,
                    ]}
                  >
                    {label}
                  </Text>
                  {/* Degrees removed from cardinal directions per user feedback */}
                </View>
              </View>
            </View>
          );
        })}
      </>
    );
  },
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

// Memoized wind arrow component with proportional scaling
const WindArrow = React.memo(
  ({
    angle,
    brandAlt,
    success,
    border,
    compassSize,
  }: {
    angle: number;
    brandAlt: string;
    success: string;
    border: string;
    compassSize: number;
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
  },
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

// Memoized phone arrow component with custom comparison
const PhoneArrow = React.memo(
  ({ success }: { success: string }) => (
    <View style={[styles.arrowContainer]}>
      <View style={[styles.arrow, { backgroundColor: success }]} />
      <View style={[styles.arrowHead, { borderBottomColor: success }]} />
    </View>
  ),
  () => true
);

// Base component
const WindDirectionCompass = ({
  size: propSize,
  windDirection,
  shotDirection,
  onChange,
  lockShot,
}: WindDirectionCompassProps) => {
  // Use responsive size calculation
  const size = propSize || getResponsiveCompassSize();
  const { heading, accuracy, isAvailable, lastUpdateTime } = useSensorData();
  const { conditions } = useEnhancedEnvironmental();
  const { isLocked, referenceHeading, relativeWindAngle, toggleLock, adjustOffset } =
    useCompassLock();
  const tokens = useTokens();
  const { mode } = useThemeMode();
  const rippleColor = mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(isLocked ? 0.18 : 0.08)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
    return () => {
      pulseAnim.stopAnimation();
    };
  }, []);

  useEffect(() => {
    Animated.timing(glowOpacity, {
      toValue: isLocked ? 0.18 : 0.08,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isLocked]);

  // Announce lock state changes for accessibility
  useEffect(() => {
    if (isLocked) {
      AccessibilityInfo.announceForAccessibility?.('Compass locked');
    } else {
      AccessibilityInfo.announceForAccessibility?.('Compass unlocked');
    }
  }, [isLocked]);

  useMemo(() => {
    logger.debug('Compass render', {
      heading,
      accuracy,
      isAvailable,
      isLocked,
      referenceHeading,
      relativeWindAngle,
      lastUpdateTime,
    });
  }, [
    heading,
    accuracy,
    isAvailable,
    isLocked,
    referenceHeading,
    relativeWindAngle,
    lastUpdateTime,
  ]);

  const currentHeading = isLocked ? referenceHeading : heading;
  const displayHeadings = useMemo(
    () => ({ shot: Math.round(currentHeading), wind: Math.round(conditions?.windDirection || 0) }),
    [currentHeading, conditions?.windDirection]
  );

  const handleLockPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleLock();
  };

  const lockMetrics = getLockButtonMetrics(size);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.headingDisplay, { marginBottom: Math.max(16, Math.round(size * 0.05)) }]}>
        <Text style={styles.headingText}>
          <Text style={{ color: tokens.colors.success }}>Shot: {displayHeadings.shot}°</Text>
          <Text style={{ color: tokens.colors.textMuted }}> | </Text>
          <Text style={{ color: tokens.colors.brandAlt }}>Wind: {displayHeadings.wind}°</Text>
        </Text>
      </View>
      <View
        style={[
          styles.container,
          { width: size, height: size },
          mode === 'dark' ? null : { backgroundColor: 'transparent' },
        ]}
      >
        <View
          style={[
            styles.compassBackground,
            mode === 'dark'
              ? {
                  backgroundColor: tokens.colors.surface,
                  borderColor: tokens.colors.border,
                  shadowColor: tokens.colors.shadow,
                  shadowOpacity: 0.06,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 4,
                  elevation: 2,
                }
              : {
                  backgroundColor: tokens.colors.surface,
                  borderColor: tokens.colors.border,
                  borderWidth: StyleSheet.hairlineWidth,
                },
          ]}
        >
          <BlurView
            intensity={25}
            tint={mode === 'dark' ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View
            style={[
              styles.compassGlow,
              {
                backgroundColor: isLocked ? tokens.colors.success : tokens.colors.brandAlt,
                opacity: glowOpacity,
              },
            ]}
          />
          {/* Gradient outer ring */}
          <View style={[styles.gradientRingContainer, { width: size - 8, height: size - 8 }]}>
            <LinearGradient
              colors={
                isLocked
                  ? [tokens.colors.success, tokens.colors.successGlow, tokens.colors.success]
                  : (tokens.gradients.primary as [string, string, ...string[]])
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientRing}
            />
            <View
              style={[
                styles.gradientRingInner,
                {
                  backgroundColor: mode === 'dark' ? tokens.colors.surface : tokens.colors.surfaceAlt,
                },
              ]}
            />
          </View>
          <View
            style={[
              styles.innerRing,
              {
                width: size - 36,
                height: size - 36,
                borderColor: isLocked ? tokens.colors.success : tokens.colors.brandAlt,
                borderWidth: 2,
                shadowColor: isLocked ? tokens.colors.success : tokens.colors.glowPrimary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: mode === 'dark' ? 0.5 : 0.2,
                shadowRadius: 8,
              },
            ]}
          />
          <DegreeMarks size={size} heading={currentHeading} borderColor={tokens.colors.border} textColor={tokens.colors.textMuted} />
          <PhoneArrow success={tokens.colors.success} />
          <WindArrow
            angle={relativeWindAngle}
            brandAlt={tokens.colors.brandAlt}
            success={tokens.colors.success}
            border={tokens.colors.border}
            compassSize={size}
          />
          <Animated.View
            style={[
              styles.centerDot,
              {
                transform: [{ scale: pulseAnim }],
                width: getCenterElementSizes(size).centerDot,
                height: getCenterElementSizes(size).centerDot,
                borderRadius: getCenterElementSizes(size).centerDot / 2,
                backgroundColor: tokens.colors.brandAlt,
                shadowColor: mode === 'dark' ? tokens.colors.glowSecondary : '#000',
                shadowOpacity: mode === 'dark' ? 0.8 : 0.15,
                shadowRadius: mode === 'dark' ? 12 : 4,
                shadowOffset: { width: 0, height: 0 },
              },
            ]}
          />
        </View>
        <CardinalDirections
          size={size}
          heading={currentHeading}
          textColor={tokens.colors.textPrimary}
          subTextColor={tokens.colors.textMuted}
          badgeBg={tokens.colors.surfaceAlt}
          badgeBorder={tokens.colors.border}
          brandAltColor={tokens.colors.brandAlt}
        />
        {/* Top-centered Locked chip overlay inside compass */}
        {isLocked && (
          <View
            pointerEvents="none"
            style={[styles.lockedChipTopContainer, { top: Math.max(8, Math.round(size * 0.035)) }]}
            accessibilityRole="text"
            accessibilityLabel="Locked"
          >
            <View
              style={[
                styles.lockedChip,
                {
                  backgroundColor: tokens.colors.surfaceAlt,
                  borderColor: tokens.colors.border,
                  shadowColor: tokens.colors.shadow,
                  maxWidth: Math.round(size * 0.6),
                },
              ]}
            >
              <MaterialCommunityIcons name="lock" size={14} color={tokens.colors.success} />
              <Text
                style={[styles.lockedChipText, { color: tokens.colors.success, marginLeft: 4 }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Locked
              </Text>
            </View>
          </View>
        )}
        {/* Lock Button with Relative Positioning */}
        <View
          style={[
            styles.lockButtonContainer,
            {
              bottom: lockMetrics.bottom,
              right: lockMetrics.right,
            }
          ]}
        >
          <Pressable
            onPress={handleLockPress}
            accessibilityRole="button"
            accessibilityLabel={isLocked ? 'Unlock compass' : 'Lock compass to current direction'}
            accessibilityHint="Locks the shot direction for wind calculations"
            android_ripple={{ color: rippleColor, borderless: false }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [
              styles.lockButtonWrapper,
              pressed && Platform.OS === 'ios' && { opacity: 0.85, transform: [{ scale: 0.95 }] },
            ]}
          >
            <View
              style={[
                styles.lockButton,
                {
                  width: lockMetrics.size,
                  height: lockMetrics.size,
                  borderRadius: lockMetrics.size / 2,
                  backgroundColor: isLocked
                    ? `${tokens.colors.success}E6` // 90% opacity
                    : mode === 'dark'
                    ? `${tokens.colors.surface}80` // 50% opacity for better visibility in dark mode
                    : `${tokens.colors.surface}66`, // 40% opacity for light mode
                  borderColor: isLocked
                    ? tokens.colors.success
                    : tokens.colors.border, // Use full border color for better contrast
                  borderWidth: isLocked ? 2 : 2, // Make border thicker for unlocked state too
                  shadowColor: isLocked ? tokens.colors.success : tokens.colors.shadow,
                  shadowOpacity: isLocked ? 0.3 : 0.1,
                  shadowOffset: { width: 0, height: isLocked ? 4 : 2 },
                  shadowRadius: isLocked ? 12 : 8,
                },
              ]}
            >
              {!isLocked && <BlurView intensity={15} style={StyleSheet.absoluteFill} />}
              {isLocked && (
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    styles.lockPulse,
                    {
                      backgroundColor: tokens.colors.success,
                      opacity: pulseAnim.interpolate({
                        inputRange: [1, 1.08],
                        outputRange: [0.1, 0],
                      }),
                      transform: [{ scale: pulseAnim }],
                    }
                  ]}
                />
              )}
              <MaterialCommunityIcons
                name={isLocked ? 'lock' : 'lock-open-variant'}
                size={24}
                color={isLocked
                  ? tokens.colors.surface
                  : mode === 'dark'
                  ? tokens.colors.textPrimary
                  : tokens.colors.textPrimary
                }
              />
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
};
export default React.memo(
  WindDirectionCompass,
  (prevProps: WindDirectionCompassProps, nextProps: WindDirectionCompassProps) => {
    return (
      prevProps.size === nextProps.size &&
      (prevProps.windDirection === nextProps.windDirection ||
        (prevProps.windDirection !== undefined &&
          nextProps.windDirection !== undefined &&
          Math.abs(prevProps.windDirection - nextProps.windDirection) < 1)) &&
      (prevProps.shotDirection === nextProps.shotDirection ||
        (prevProps.shotDirection !== undefined &&
          nextProps.shotDirection !== undefined &&
          Math.abs(prevProps.shotDirection - nextProps.shotDirection) < 1)) &&
      prevProps.lockShot === nextProps.lockShot
    );
  }
);

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 8,  // Reduced from 20 to bring Shot/Wind text closer to instructions
  },
  headingDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 5,
    marginBottom: 16,  // Reduced to prevent overlap with adjacent content
  },
  headingText: {
    fontSize: scaledFontSize(14),
    fontWeight: '600',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  compassBackground: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
  },
  compassGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
  },
  gradientRingContainer: {
    position: 'absolute',
    borderRadius: 999,
    overflow: 'hidden',
  },
  gradientRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  gradientRingInner: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 999,
  },
  innerRing: {
    position: 'absolute',
    borderRadius: 999,
  },
  degreeMark: {
    position: 'absolute',
    width: 1,
    left: '50%',
    marginLeft: -0.5,
  },
  cardinalDirection: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cardinalBackground: {
    borderRadius: 4,
    padding: 2,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardinalTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCardinalText: {
    fontWeight: '700',
  },
  northCardinalText: {
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardinalText: {
    fontWeight: '600',
  },
  degreeText: {
    fontWeight: '500',
    marginTop: 1,
  },
  degreeLabel: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    zIndex: 5,
    overflow: 'visible' as const,  // Ensure text is not clipped
  },
  degreeLabelText: {
    textAlign: 'center' as const,
    fontWeight: '500' as const,
    includeFontPadding: false,  // Remove extra font padding on Android
  },
  arrowContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    position: 'absolute',
    width: 2,
    height: '50%',
    top: 0,
  },
  arrowHead: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    top: 0,
    borderTopWidth: 0,
    borderRightWidth: 6,
    borderBottomWidth: 12,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  windArrow: {
    position: 'absolute',
    width: 3,
    height: '7%',
    left: '50%',
    marginLeft: -1.5,
  },
  windArrowHead: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 0,
    borderRightWidth: 10,
    borderBottomWidth: 15,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  windOriginIndicator: {
    position: 'absolute',
    zIndex: 20,
    borderWidth: 2,
  },
  smallWindArrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 0,
    borderRightWidth: 6,
    borderBottomWidth: 12,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderLeftColor: 'transparent',
    alignSelf: 'center',
    zIndex: 15,
  },
  centerDot: {
    position: 'absolute',
  },
  lockButtonContainer: {
    position: 'absolute',
    zIndex: 20,
  },
  lockedChipTopContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 25,
  },
  lockButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockButton: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    overflow: 'hidden',
  },
  lockPulse: {
    position: 'absolute',
    borderRadius: 999,
  },
  lockedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  lockedChipText: {
    fontSize: scaledFontSize(12),
    fontWeight: '600',
  },
});
