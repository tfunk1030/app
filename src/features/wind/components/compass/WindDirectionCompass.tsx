/**
 * Wind Direction Compass Component
 *
 * Displays a compass that shows the current heading and wind direction.
 * Uses the native iOS compass API via the SensorDataProvider for exact heading accuracy.
 * Enhanced with modern design elements and improved visual hierarchy.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, Animated, StyleSheet, AccessibilityInfo } from 'react-native';
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
const getWindLabelGlow = (relationship: WindRelationship, tokens: ReturnType<typeof useTokens>): string => {
  switch (relationship) {
    case 'HEADWIND':
      return tokens.colors.dangerBackgroundAlpha;
    case 'TAILWIND':
      return tokens.colors.successBackgroundAlpha;
    case 'CROSSWIND':
      // Warning color with alpha - using brandAlt with alpha as fallback
      return 'rgba(245, 158, 11, 0.15)'; // Keeping this one rgba for warning (not in tokens)
    case 'QUARTERING':
    default:
      return tokens.colors.surfaceAlt;
  }
};

const WindDirectionCompass: React.FC<WindDirectionCompassProps> = ({
  size: propSize,
  windDirection,
  shotDirection,
  onChange,
  lockShot,
  // windSpeed and speedUnit props preserved for backwards compatibility but no longer displayed
}) => {
  // Use responsive size calculation
  const size = propSize || getResponsiveCompassSize();
  const { heading, accuracy, isAvailable, lastUpdateTime } = useSensorData();
  const { conditions } = useEnhancedEnvironmental();
  const { isLocked, referenceHeading, relativeWindAngle, toggleLock, adjustOffset } =
    useCompassLock();
  const tokens = useTokens();
  const { scheme, isDark } = useThemeMode();
  const { settings } = useSettings();

  // Wind direction and relationship
  const windRelationship = getWindRelationship(relativeWindAngle);

  // Animation values - simplified, single pulse for center dot
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
    return () => {
      pulseAnim.stopAnimation();
    };
  }, []);

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
          isDark ? null : { backgroundColor: 'transparent' },
        ]}
      >
        <View
          style={[
            localStyles.compassBackground,
            {
              backgroundColor: tokens.colors.surface,
              borderColor: isLocked ? tokens.colors.success : tokens.colors.border,
              borderWidth: 2,
              shadowColor: tokens.colors.shadow,
              shadowOpacity: 0.1,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 8,
              elevation: 4,
            },
          ]}
        >
          {/* Simple outer ring - cleaner than gradient */}
          <View
            style={[
              localStyles.innerRing,
              {
                width: size - 24,
                height: size - 24,
                borderColor: isLocked ? tokens.colors.success : tokens.colors.brandAlt,
                borderWidth: 2,
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
                shadowColor: isDark ? tokens.colors.glowSecondary : tokens.colors.shadow,
                shadowOpacity: isDark ? 0.8 : 0.15,
                shadowRadius: isDark ? 12 : 4,
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
                { backgroundColor: getWindLabelGlow(windRelationship, tokens) },
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
          mode={scheme}
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
