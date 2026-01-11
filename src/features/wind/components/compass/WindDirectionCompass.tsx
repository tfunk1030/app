/**
 * Wind Direction Compass Component
 *
 * Displays a compass that shows the current heading and wind direction.
 * Uses the native iOS compass API via the SensorDataProvider for exact heading accuracy.
 * Enhanced with modern design elements and improved visual hierarchy.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, Animated, StyleSheet, AccessibilityInfo } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useEnhancedEnvironmental } from '@/src/providers/EnhancedEnvironmentalProvider';
import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import { useSettings } from '@/src/core/context/settings';
import { LogManager } from '@/src/utils/LogManager';
import {
  getResponsiveCompassSize,
  getCenterElementSizes,
} from '@/src/utils/responsive';

import { useCompassLock } from '../../context/compass-lock';
import { useSensorData } from '../../context/sensor-data';

import DegreeMarks from './DegreeMarks';
import CardinalDirections from './CardinalDirections';
import WindArrow from './WindArrow';
import PhoneArrow from './PhoneArrow';
import LockButton from './LockButton';
import {
  WindDirectionCompassProps,
  WindRelationship,
  getWindRelationship,
  getCardinalDirection,
} from './types';
import { compassStyles as styles } from './styles';

// Create a dedicated logger
const logger = LogManager.getLogger('WindDirectionCompass');

/**
 * Get the color for the wind relationship label based on type
 */
const getWindLabelColor = (relationship: WindRelationship, tokens: ReturnType<typeof useTokens>): string => {
  switch (relationship) {
    case 'HEADWIND':
      return tokens.colors.danger;
    case 'TAILWIND':
      return tokens.colors.success;
    case 'CROSSWIND':
      return tokens.colors.warning;
    case 'QUARTERING':
    default:
      return tokens.colors.textMuted;
  }
};

/**
 * Get the glow/background color for the wind relationship label
 */
const getWindLabelGlow = (relationship: WindRelationship): string => {
  switch (relationship) {
    case 'HEADWIND':
      return 'rgba(220, 38, 38, 0.15)';
    case 'TAILWIND':
      return 'rgba(22, 163, 74, 0.15)';
    case 'CROSSWIND':
      return 'rgba(245, 158, 11, 0.15)';
    case 'QUARTERING':
    default:
      return 'rgba(0, 0, 0, 0.3)';
  }
};

const WindDirectionCompass: React.FC<WindDirectionCompassProps> = ({
  size: propSize,
  windDirection,
  shotDirection,
  onChange,
  lockShot,
  windSpeed: propWindSpeed,
  speedUnit: propSpeedUnit,
}) => {
  // Use responsive size calculation
  const size = propSize || getResponsiveCompassSize();
  const { heading, accuracy, isAvailable, lastUpdateTime } = useSensorData();
  const { conditions } = useEnhancedEnvironmental();
  const { isLocked, referenceHeading, relativeWindAngle, toggleLock, adjustOffset } =
    useCompassLock();
  const tokens = useTokens();
  const { mode } = useThemeMode();
  const { settings } = useSettings();

  // Wind speed and unit (use props or fall back to conditions)
  const windSpeed = propWindSpeed ?? conditions?.windSpeed ?? 0;
  const speedUnit = propSpeedUnit ?? 'mph';
  const windDirectionDegrees = conditions?.windDirection ?? 0;
  const cardinalDirection = getCardinalDirection(windDirectionDegrees);
  const windRelationship = getWindRelationship(relativeWindAngle);

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

  return (
    <View style={styles.wrapper}>
      {/* Removed verbose heading display - degrees shown in wind.tsx MetricPills */}

      <View
        style={[
          styles.container,
          { width: size, height: size },
          mode === 'dark' ? null : { backgroundColor: 'transparent' },
        ]}
      >
        <View
          style={[
            localStyles.compassBackground,
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
              localStyles.compassGlow,
              {
                backgroundColor: isLocked ? tokens.colors.success : tokens.colors.brandAlt,
                opacity: glowOpacity,
              },
            ]}
          />

          {/* Gradient outer ring */}
          <View style={[localStyles.gradientRingContainer, { width: size - 8, height: size - 8 }]}>
            <LinearGradient
              colors={
                isLocked
                  ? [tokens.colors.success, '#22C55E', tokens.colors.success]
                  : (tokens.gradients.primary as [string, string, ...string[]])
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={localStyles.gradientRing}
            />
            <View
              style={[
                localStyles.gradientRingInner,
                {
                  backgroundColor: mode === 'dark' ? tokens.colors.surface : tokens.colors.surfaceAlt,
                },
              ]}
            />
          </View>

          <View
            style={[
              localStyles.innerRing,
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

          <DegreeMarks
            size={size}
            heading={currentHeading}
            borderColor={tokens.colors.border}
            textColor={tokens.colors.textMuted}
          />

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
              localStyles.centerDot,
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

          {/* Wind Speed Display - Simplified, below center */}
          <View
            style={[styles.windInfoContainer, { bottom: Math.max(size * 0.24, 52) }]}
            pointerEvents="none"
            accessibilityRole="text"
            accessibilityLabel={`Wind ${Math.round(windSpeed)} ${speedUnit}`}
          >
            <Text style={[styles.windSpeedText, { color: tokens.colors.brandAlt, fontSize: Math.max(16, Math.min(20, size * 0.08)) }]}>
              {Math.round(windSpeed)} {speedUnit}
            </Text>
            {/* Removed "from NW" - already shown in MetricPills */}
          </View>
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

        {/* Top-centered Wind Label or Locked chip overlay inside compass - positioned below N cardinal */}
        <View
          pointerEvents="none"
          style={[styles.windLabelContainer, { top: Math.max(size * 0.28, 58) }]}
          accessibilityRole="text"
          accessibilityLabel={isLocked ? 'Locked' : `Wind is ${windRelationship.toLowerCase()}`}
        >
          {isLocked ? (
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
          ) : (
            <View
              style={[
                styles.windLabel,
                { backgroundColor: getWindLabelGlow(windRelationship) },
              ]}
            >
              <Text
                style={[
                  styles.windLabelText,
                  { color: getWindLabelColor(windRelationship, tokens) },
                ]}
              >
                {windRelationship}
              </Text>
            </View>
          )}
        </View>

        <LockButton
          isLocked={isLocked}
          onPress={handleLockPress}
          compassSize={size}
          tokens={tokens}
          mode={mode}
          pulseAnim={pulseAnim}
          side={settings.dominantHand}
        />
      </View>
    </View>
  );
};

// Local styles that don't need to be shared
const localStyles = StyleSheet.create({
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
  centerDot: {
    position: 'absolute',
  },
});

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
      prevProps.lockShot === nextProps.lockShot &&
      (prevProps.windSpeed === nextProps.windSpeed ||
        (prevProps.windSpeed !== undefined &&
          nextProps.windSpeed !== undefined &&
          Math.abs(prevProps.windSpeed - nextProps.windSpeed) < 0.5)) &&
      prevProps.speedUnit === nextProps.speedUnit
    );
  }
);
