/**
 * Wind Tab - Premium Wind Calculator (Redesign)
 *
 * Full wind calculation with compass heading, aim adjustments.
 * This is a PREMIUM feature - free users see upgrade prompt.
 *
 * Matches the Shot screen aesthetic with:
 * - MetricPills for conditions
 * - Full-screen results with explicit calculate action
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  TextInput,
  AccessibilityInfo,
} from 'react-native';
import { ErrorBoundary } from '@/src/components/error-boundary/ErrorBoundary';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useAccessibleAnimations } from '@/src/hooks/useAccessibility';
import { useReduceMotionValue } from '@/src/hooks/useReduceMotion';
import * as Haptics from 'expo-haptics';
import { Wind, Compass, Lock, Crown, ChevronRight, Navigation, AlertTriangle, ChevronLeft } from 'lucide-react-native';

import { useRedesignTheme } from '@/src/theme/redesign';
import { MetricPill } from '@/src/components/redesign/MetricPill';
import { Slider } from '@/src/core/components/ui/slider';
import { usePremium } from '@/src/features/settings/context/premium';
import { useSettings, Settings } from '@/src/core/context/settings';
import { useEnhancedEnvironmental } from '@/src/providers/EnhancedEnvironmentalProvider';
import { useWindCalculator } from '@/src/features/wind/hooks/useWindCalculator';
import { useSensorData } from '@/src/features/wind/context/sensor-data';
import { CompassLockProvider, useCompassLock } from '@/src/features/wind/context/compass-lock';
import WindDirectionCompass from '@/src/features/wind/components/compass';
import InlineResult from '@/src/features/wind/components/InlineResult';
import { useWindScreenLayout } from '@/src/features/wind/hooks/useWindScreenLayout';

// =============================================================================
// TYPES
// =============================================================================

interface WindCalculationDisplay {
  playsLike: number;
  club: string;
  aimAdjustment: string;
  headwindEffect: number;
  crosswindEffect: number;
  environmentalEffect: number;
  totalAdjustment: number;
}

interface WindDualResult {
  steady: WindCalculationDisplay;
  gust?: WindCalculationDisplay;
}

// =============================================================================
// HELPER - Convert compass degrees to direction
// =============================================================================

function degreesToDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((degrees % 360) + 360) % 360 / 45) % 8;
  return directions[index];
}

// =============================================================================
// HELPER - Unit conversions
// =============================================================================

function getSpeedUnitLabel(speedUnit: Settings['speedUnit']): string {
  return speedUnit === 'mps' ? 'm/s' : speedUnit;
}

function convertFromMph(mph: number, speedUnit: Settings['speedUnit']): number {
  switch (speedUnit) {
    case 'mph': return mph;
    case 'kph': return mph * 1.60934;
    case 'kts': return mph * 0.868976;
    case 'mps': return mph * 0.44704;
    default: return mph;
  }
}

function convertToMph(value: number, speedUnit: Settings['speedUnit']): number {
  switch (speedUnit) {
    case 'mph': return value;
    case 'kph': return value / 1.60934;
    case 'kts': return value / 0.868976;
    case 'mps': return value / 0.44704;
    default: return value;
  }
}



// =============================================================================
// WIND CALCULATOR REDESIGN COMPONENT
// =============================================================================

interface WindCalculatorRedesignProps {
  sensorAvailable?: boolean;
  compassAccuracy?: 'high' | 'medium' | 'low' | 'unreliable';
}

function WindCalculatorRedesign({ sensorAvailable = true, compassAccuracy = 'high' }: WindCalculatorRedesignProps) {
  const [showCalibrationHint, setShowCalibrationHint] = useState(true);
  const { colors, tokens } = useRedesignTheme();
  const { settings, convertDistance } = useSettings();
  const environmental = useEnhancedEnvironmental();
  const { isLocked, relativeWindAngle } = useCompassLock();
  const { headerEntering, cardEntering } = useAccessibleAnimations();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotionValue();

  // Use responsive layout hook for adaptive sizing
  const { compassSize, bottomBarHeight, screen } = useWindScreenLayout();
  const tabBarHeight = tokens.components.tabBar.height;
  const topContentPadding = insets.top + tokens.spacing.md;
  const bottomContentPadding = bottomBarHeight + tabBarHeight + insets.bottom + tokens.spacing.lg;

  // Wind calculator hook
  const {
    calculate,
    result,
    error,
    setWindSpeed,
    setTargetYardage,
  } = useWindCalculator();

  // Local state
  const [targetDistance, setTargetDistance] = useState(150);
  const [manualSpeedOverride, setManualSpeedOverride] = useState<string>('');
  const [manualDirectionOverride, setManualDirectionOverride] = useState<string>('');
  const [manualOpen, setManualOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dualResult, setDualResult] = useState<WindDualResult | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const pendingResultRef = useRef<((value: WindCalculationDisplay | null) => void) | null>(null);

  // Animation
  const slideOffset = useSharedValue(0);

  // Get current wind data (convert from mph to user's unit)
  const currentWindSpeedMph = environmental.conditions?.windSpeed || 0;
  const currentWindDirection = environmental.conditions?.windDirection || 0;
  const currentWindGustMph = environmental.conditions?.windGust;

  // Convert to user's preferred unit for display
  const currentWindSpeedDisplay = Math.round(convertFromMph(currentWindSpeedMph, settings.speedUnit));
  const currentWindGustDisplay = currentWindGustMph ? Math.round(convertFromMph(currentWindGustMph, settings.speedUnit)) : null;
  const hasGust = Boolean(currentWindGustDisplay && currentWindGustDisplay > currentWindSpeedDisplay);
  const speedUnitLabel = getSpeedUnitLabel(settings.speedUnit);
  // Effective wind speed (actual) - in user's unit
  const effectiveWindSpeed = currentWindSpeedDisplay;

  // Distance unit label
  const unit = settings.distanceUnit === 'meters' ? 'm' : 'yds';

  // Distance bounds based on unit
  const distMin = 50;
  const distMax = settings.distanceUnit === 'yards' ? 350 : Math.round(convertDistance(350, 'meters'));

  const formatResult = useCallback((resultData: typeof result): WindCalculationDisplay | null => {
    if (!resultData) return null;

    const crosswindYards = resultData.lateralEffect || 0;
    const headwindYards = resultData.windEffect || 0;
    const environmentalYards = resultData.environmentalEffect || 0;
    const playsLikeYards = resultData.effectivePlayingDistance;

    const isMetric = settings.distanceUnit === 'meters';
    const playsLike = isMetric
      ? Math.round(convertDistance(playsLikeYards, 'meters'))
      : Math.round(playsLikeYards);
    const crosswind = isMetric
      ? Math.round(convertDistance(Math.abs(crosswindYards), 'meters'))
      : Math.round(Math.abs(crosswindYards));
    const headwindEffect = isMetric
      ? Math.round(convertDistance(headwindYards, 'meters'))
      : Math.round(headwindYards);
    const environmentalEffect = isMetric
      ? Math.round(convertDistance(environmentalYards, 'meters'))
      : Math.round(environmentalYards);

    let aimDirection = '';
    if (Math.abs(crosswindYards) > 0.5) {
      aimDirection = crosswindYards > 0 ? 'LEFT' : 'RIGHT';
    }

    return {
      playsLike,
      club: resultData.finalClub,
      aimAdjustment: Math.abs(crosswindYards) > 0.5
        ? `Aim ${crosswind} ${unit} ${aimDirection}`
        : 'On line',
      headwindEffect,
      crosswindEffect: crosswindYards > 0 ? crosswind : -crosswind,
      environmentalEffect,
      totalAdjustment: headwindEffect + environmentalEffect,
    };
  }, [convertDistance, settings.distanceUnit, unit]);

  React.useEffect(() => {
    if (pendingResultRef.current) {
      pendingResultRef.current(formatResult(result));
      pendingResultRef.current = null;
    }
  }, [formatResult, result]);

  React.useEffect(() => {
    if (pendingResultRef.current && error) {
      pendingResultRef.current(null);
      pendingResultRef.current = null;
    }
  }, [error]);

  // Handlers
  const handleManualToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setManualOpen((prev) => !prev);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await environmental.forceRefresh?.();
    await new Promise((resolve) => setTimeout(resolve, 500));
    setCalcError(null);
    setIsRefreshing(false);
  }, [environmental]);

  React.useEffect(() => {
    if (error) {
      setCalcError(error);
    }
  }, [error]);

  // Announce errors to screen readers for accessibility
  useEffect(() => {
    if (calcError) {
      AccessibilityInfo.announceForAccessibility(`Error: ${calcError}`);
    }
  }, [calcError]);

  const compassAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(slideOffset.value, [0, 1], [0, -screen.height]) }],
    opacity: interpolate(slideOffset.value, [0, 0.4], [1, 0]),
  }));

  const resultsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(slideOffset.value, [0, 1], [screen.height, 0]) }],
    opacity: interpolate(slideOffset.value, [0.6, 1], [0, 1]),
  }));

  const handleManualSpeedChange = useCallback((text: string) => {
    setManualSpeedOverride(text.replace(/[^0-9]/g, ''));
  }, []);

  const handleManualDirectionChange = useCallback((text: string) => {
    const numeric = text.replace(/[^0-9]/g, '');
    setManualDirectionOverride(numeric);
  }, []);

  const handleDistanceStep = useCallback((delta: number) => {
    setTargetDistance((prev) => {
      const next = Math.min(distMax, Math.max(distMin, prev + delta));
      return next;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [distMax, distMin]);

  const buildCalculationInput = useCallback((speedOverrideMph: number) => {
    const targetInYards = settings.distanceUnit === 'meters'
      ? Math.round(targetDistance / 0.9144)
      : targetDistance;
    setWindSpeed(speedOverrideMph);
    setTargetYardage(targetInYards);
  }, [settings.distanceUnit, setWindSpeed, setTargetYardage, targetDistance]);

  const calculateWithSpeed = useCallback((speedMph: number, windAngleOverride?: number) => {
    buildCalculationInput(speedMph);
    calculate(typeof windAngleOverride === 'number' ? windAngleOverride : relativeWindAngle);
  }, [buildCalculationInput, calculate, relativeWindAngle]);

  const handleCalculate = useCallback(async () => {
    if (!isLocked) return;

    setCalcError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const manualSpeed = manualSpeedOverride ? parseInt(manualSpeedOverride, 10) : null;
    const manualDirection = manualDirectionOverride ? parseInt(manualDirectionOverride, 10) : null;
    const manualSpeedMph = manualSpeed !== null && Number.isFinite(manualSpeed)
      ? Math.round(convertToMph(manualSpeed, settings.speedUnit))
      : null;
    const steadySpeedMph = Math.round(convertToMph(effectiveWindSpeed, settings.speedUnit));
    const gustSpeedMph = hasGust && currentWindGustDisplay !== null
      ? Math.round(convertToMph(currentWindGustDisplay, settings.speedUnit))
      : null;
    const angleOverride = manualDirection !== null ? manualDirection : undefined;

    try {
      const calculateOnce = async (speed: number) => new Promise<WindCalculationDisplay | null>((resolve) => {
        pendingResultRef.current = resolve;
        calculateWithSpeed(speed, angleOverride);
      });

      const steady = await calculateOnce(manualSpeedMph ?? steadySpeedMph);
      if (!steady) {
        setCalcError('Unable to calculate steady wind result.');
        return;
      }

      let gust: WindCalculationDisplay | undefined;
      if (gustSpeedMph !== null && gustSpeedMph !== (manualSpeedMph ?? steadySpeedMph)) {
        gust = (await calculateOnce(gustSpeedMph)) ?? undefined;
        if (!gust) {
          setCalcError('Unable to calculate gust result.');
        }
      }

      setDualResult({ steady, gust });
      slideOffset.value = reduceMotion
        ? 1
        : withSpring(1, { damping: 18, stiffness: 160 });
      setManualOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setCalcError('Unable to calculate wind adjustment.');
    }
  }, [
    isLocked,
    manualSpeedOverride,
    manualDirectionOverride,
    settings.speedUnit,
    effectiveWindSpeed,
    currentWindGustDisplay,
    calculateWithSpeed,
    slideOffset,
    reduceMotion,
    hasGust,
  ]);

  const handleBackToCompass = useCallback(() => {
    slideOffset.value = reduceMotion
      ? 0
      : withSpring(0, { damping: 18, stiffness: 160 });
  }, [reduceMotion, slideOffset]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topContentPadding, paddingBottom: bottomContentPadding },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brand}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={compassAnimatedStyle}>
          {/* Conditions Bar - Compact wind info */}
          <Animated.View entering={headerEntering}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.conditionsScroll}
              contentContainerStyle={styles.conditionsContainer}
            >
              <MetricPill
                icon={<Wind size={14} color={manualSpeedOverride ? colors.warning : colors.textMuted} />}
                label="Wind"
                value={manualSpeedOverride ? `${manualSpeedOverride} ${speedUnitLabel}` : `${currentWindSpeedDisplay} ${speedUnitLabel}`}
                isOverridden={Boolean(manualSpeedOverride)}
              />
              {currentWindGustDisplay && currentWindGustDisplay > currentWindSpeedDisplay && !manualSpeedOverride && (
                <MetricPill
                  icon={<Wind size={14} color={colors.warning} />}
                  label="Gust"
                  value={`${currentWindGustDisplay} ${speedUnitLabel}`}
                  status="warning"
                />
              )}
              <MetricPill
                icon={<Navigation size={14} color={manualDirectionOverride ? colors.warning : colors.textMuted} />}
                label="Direction"
                value={manualDirectionOverride
                  ? `${degreesToDirection(parseInt(manualDirectionOverride, 10))} (${manualDirectionOverride}°)`
                  : `${degreesToDirection(currentWindDirection)} (${Math.round(currentWindDirection)}°)`}
                isOverridden={Boolean(manualDirectionOverride)}
              />
            </ScrollView>
          </Animated.View>

          {/* Target Distance Input */}
          <Animated.View entering={cardEntering(1)} style={styles.sliderSection}>
            <Slider
              value={targetDistance}
              onValueChange={(val) => setTargetDistance(val)}
              min={distMin}
              max={distMax}
              step={1}
              label="Target Distance"
              unit={unit}
              dense
            />
            <View style={styles.stepperRowInline}>
              <Pressable
                onPress={() => handleDistanceStep(-1)}
                style={[styles.stepperButtonInline, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                accessibilityRole="button"
                accessibilityLabel={`Decrease distance by 1 ${unit}. Current: ${targetDistance} ${unit}`}
                accessibilityHint={`Range: ${distMin} to ${distMax} ${unit}`}
              >
                <Text style={[styles.stepperTextInline, { color: colors.textPrimary }]}>-1</Text>
              </Pressable>
              <Pressable
                onPress={() => handleDistanceStep(1)}
                style={[styles.stepperButtonInline, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                accessibilityRole="button"
                accessibilityLabel={`Increase distance by 1 ${unit}. Current: ${targetDistance} ${unit}`}
                accessibilityHint={`Range: ${distMin} to ${distMax} ${unit}`}
              >
                <Text style={[styles.stepperTextInline, { color: colors.textPrimary }]}>+1</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Compass Section */}
          <Animated.View entering={cardEntering(2)} style={styles.compassSection}>
            <View style={styles.compassWrapper}>
              <WindDirectionCompass
                size={compassSize}
                windSpeed={currentWindSpeedMph}
                speedUnit={speedUnitLabel}
              />
            </View>

            {/* Inline Result - visible when locked and calculated */}
            {isLocked && dualResult && (
              <InlineResult
                playsLikeDistance={dualResult.steady.playsLike}
                actualDistance={targetDistance}
                unit={unit}
                isVisible={true}
                breakdown={{
                  headwind: dualResult.steady.headwindEffect,
                  crosswind: dualResult.steady.crosswindEffect,
                  altitude: 0,
                  temperature: dualResult.steady.environmentalEffect,
                }}
                colors={{
                  background: colors.surfaceElevated,
                  border: colors.border,
                  text: colors.textPrimary,
                  textMuted: colors.textMuted,
                  accent: colors.brand,
                  success: colors.success,
                  warning: colors.warning,
                }}
              />
            )}
          </Animated.View>

          {!sensorAvailable && (
            <View style={styles.manualHeadingSection}>
              <View
                style={[styles.sensorWarning, { backgroundColor: colors.warning + '1A' }]}
                accessibilityRole="alert"
                accessibilityLabel={__DEV__ ? 'Warning: Compass limited in Expo Go. Use compass to set direction' : 'Warning: Compass unavailable'}
              >
                <AlertTriangle size={16} color={colors.warning} accessibilityElementsHidden={true} />
                <Text style={[styles.warningText, { color: colors.warning }]} importantForAccessibility="no">
                  {__DEV__ ? 'Compass limited in Expo Go - use compass to set direction' : 'Compass unavailable'}
                </Text>
              </View>
            </View>
          )}

          {/* Calibration hint - shows when accuracy is low/unreliable */}
          {showCalibrationHint && (compassAccuracy === 'low' || compassAccuracy === 'unreliable') && (
            <Pressable
              onPress={() => setShowCalibrationHint(false)}
              style={[styles.calibrationHint, { backgroundColor: colors.brandMuted, borderColor: colors.brand }]}
              accessibilityRole="alert"
              accessibilityLabel="Compass accuracy is low. Move phone in figure-8 pattern to calibrate. Tap to dismiss."
            >
              <Compass size={16} color={colors.brand} />
              <Text style={[styles.calibrationText, { color: colors.brand }]}>
                Move phone in figure-8 to calibrate compass
              </Text>
              <Text style={[styles.calibrationDismiss, { color: colors.textMuted }]}>Dismiss</Text>
            </Pressable>
          )}

          {/* Manual Input */}
          <View style={[styles.manualSection, { backgroundColor: colors.surfaceElevated, borderRadius: tokens.borderRadius.lg }]}>
            <Pressable
              onPress={handleManualToggle}
              style={[styles.manualToggle, { borderBottomWidth: manualOpen ? 1 : 0, borderBottomColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel={manualOpen ? 'Collapse manual input' : 'Edit manually'}
              accessibilityState={{ expanded: manualOpen }}
            >
              <Text style={[styles.manualToggleText, { color: colors.textPrimary }]}>Edit manually</Text>
              <ChevronRight
                size={18}
                color={colors.textMuted}
                style={{ transform: [{ rotate: manualOpen ? '90deg' : '0deg' }] }}
              />
            </Pressable>
            {manualOpen && (
              <View style={styles.manualInputs}>
                <View style={styles.manualInputWrapper}>
                  <Text style={[styles.manualInputLabel, { color: colors.textMuted }]}>Wind Speed</Text>
                  <TextInput
                    value={manualSpeedOverride}
                    onChangeText={handleManualSpeedChange}
                    placeholder={`Enter ${speedUnitLabel}`}
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    style={[styles.manualInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                    accessibilityLabel="Manual wind speed override"
                  />
                </View>
                <View style={styles.manualInputWrapper}>
                  <Text style={[styles.manualInputLabel, { color: colors.textMuted }]}>Wind Direction</Text>
                  <TextInput
                    value={manualDirectionOverride}
                    onChangeText={handleManualDirectionChange}
                    placeholder="Enter degrees (0-360)"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    style={[styles.manualInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                    accessibilityLabel="Manual wind direction in degrees"
                  />
                </View>
              </View>
            )}
          </View>

          {calcError && (
            <View style={[styles.errorBanner, { borderColor: colors.error, backgroundColor: colors.error + '1A' }]}
              accessibilityRole="alert"
            >
              <AlertTriangle size={16} color={colors.error} />
              <Text style={[styles.errorBannerText, { color: colors.error }]}>{calcError}</Text>
            </View>
          )}
        </Animated.View>

        {/* Results Full Screen */}
        <Animated.View
          style={[
            styles.resultsContainer,
            resultsAnimatedStyle,
            { paddingTop: topContentPadding, paddingBottom: bottomContentPadding },
          ]}
        >
          <View style={styles.resultsHeader}>
            <Pressable
              onPress={handleBackToCompass}
              accessibilityRole="button"
              accessibilityLabel="Back to compass"
              style={styles.resultsBack}
            >
              <ChevronLeft size={18} color={colors.textPrimary} />
              <Text style={[styles.resultsBackText, { color: colors.textPrimary }]}>Back</Text>
            </Pressable>
            <Text style={[styles.resultsTitle, { color: colors.textPrimary }]}>Shot Results</Text>
            <View style={styles.resultsSpacer} />
          </View>

          {!dualResult && (
            <View style={styles.resultsBody}>
              <Text style={[styles.resultSub, { color: colors.textMuted }]}>No calculation results yet.</Text>
            </View>
          )}

          {dualResult && (
            <View style={styles.resultsBody}>
              <View style={[styles.resultCard, { borderColor: colors.brand, backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.resultLabel, { color: colors.textMuted }]}>STEADY WIND ({currentWindSpeedDisplay} {speedUnitLabel})</Text>
                <Text style={[styles.resultValue, { color: colors.textPrimary }]}>{dualResult.steady.playsLike} {unit}</Text>
                <Text style={[styles.resultSub, { color: colors.textSecondary }]}>Club: {dualResult.steady.club}</Text>
                <Text style={[styles.resultSub, { color: colors.textSecondary }]}>{dualResult.steady.aimAdjustment}</Text>
                <Text style={[styles.resultBreakdown, { color: colors.textMuted }]}>Wind {dualResult.steady.headwindEffect > 0 ? '+' : ''}{dualResult.steady.headwindEffect} · Env {dualResult.steady.environmentalEffect > 0 ? '+' : ''}{dualResult.steady.environmentalEffect} · Total {dualResult.steady.totalAdjustment > 0 ? '+' : ''}{dualResult.steady.totalAdjustment}</Text>
              </View>

              {dualResult.gust && (
                <View style={[styles.resultCard, { borderColor: colors.warning, backgroundColor: colors.surfaceElevated }]}>
                  <Text style={[styles.resultLabel, { color: colors.warning }]}>GUSTS ({currentWindGustDisplay} {speedUnitLabel})</Text>
                  <Text style={[styles.resultValue, { color: colors.textPrimary }]}>{dualResult.gust.playsLike} {unit}</Text>
                  <Text style={[styles.resultSub, { color: colors.textSecondary }]}>Club: {dualResult.gust.club}</Text>
                  <Text style={[styles.resultSub, { color: colors.textSecondary }]}>{dualResult.gust.aimAdjustment}</Text>
                  <Text style={[styles.resultBreakdown, { color: colors.textMuted }]}>Wind {dualResult.gust.headwindEffect > 0 ? '+' : ''}{dualResult.gust.headwindEffect} · Env {dualResult.gust.environmentalEffect > 0 ? '+' : ''}{dualResult.gust.environmentalEffect} · Total {dualResult.gust.totalAdjustment > 0 ? '+' : ''}{dualResult.gust.totalAdjustment}</Text>
                </View>
              )}
            </View>
          )}

          <Pressable
            style={[styles.recalculateButton, { backgroundColor: colors.brand }]}
            onPress={handleBackToCompass}
            accessibilityRole="button"
            accessibilityLabel="Recalculate wind adjustment"
          >
            <Text style={[styles.recalculateText, { color: colors.textInverse }]}>Recalculate</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* Bottom Action Bar - simplified to just Calculate */}
      <View
        style={[
          styles.bottomBar,
          {
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
            bottom: tabBarHeight + insets.bottom,
            paddingBottom: tokens.spacing.sm,
          },
        ]}
        accessibilityRole="toolbar"
      >
        <Pressable
          onPress={handleCalculate}
          disabled={!isLocked}
          style={[styles.calculateButton, { backgroundColor: isLocked ? colors.brand : colors.border }]}
          accessibilityRole="button"
          accessibilityLabel={isLocked ? "Calculate wind adjustment" : "Lock compass direction first, then calculate"}
          accessibilityHint={!isLocked ? "Point phone at target and tap the lock button on the compass" : undefined}
          accessibilityState={{ disabled: !isLocked }}
        >
          <Text style={[styles.calculateButtonText, { color: isLocked ? colors.textInverse : colors.textMuted }]}>
            {isLocked ? 'Calculate' : 'Lock Direction First'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// =============================================================================
// WRAP WITH COMPASS LOCK PROVIDER
// =============================================================================

function WindCalculatorWithCompass() {
  const environmental = useEnhancedEnvironmental();
  const { heading, isAvailable, accuracy, lastUpdateTime } = useSensorData();

  // Determine if compass is actually working:
  // - Must be available
  // - Must have received an update recently (8 seconds for stability after app backgrounding)
  // - Must have better than "unreliable" accuracy OR have a non-zero heading
  const COMPASS_TIMEOUT_MS = 8000; // 8 seconds - more lenient to handle app backgrounding
  const isCompassWorking = isAvailable &&
    lastUpdateTime > 0 &&
    Date.now() - lastUpdateTime < COMPASS_TIMEOUT_MS &&
    (accuracy !== 'unreliable' || heading !== 0);

  return (
    <CompassLockProvider
      currentHeading={heading || 0}
      windDirection={environmental.conditions?.windDirection || 0}
    >
      <WindCalculatorRedesign
        sensorAvailable={isCompassWorking}
        compassAccuracy={accuracy}
      />
    </CompassLockProvider>
  );
}

// =============================================================================
// PREMIUM UPGRADE PROMPT (UNCHANGED)
// =============================================================================

function PremiumUpgradePrompt() {
  const { colors } = useRedesignTheme();
  const { setShowUpgradeModal } = usePremium();
  const { headerEntering, cardEntering } = useAccessibleAnimations();

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowUpgradeModal(true);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.upgradeContent}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Animated.View entering={headerEntering} style={styles.upgradeHeader}>
        <View style={[styles.iconContainer, { backgroundColor: colors.brandMuted }]}>
          <Wind size={48} color={colors.brand} />
        </View>
      </Animated.View>

        <Animated.View entering={cardEntering(2)} style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            Unlock Advanced Wind Analysis
          </Text>
          <Text style={[styles.cardDescription, { color: colors.textMuted }]}>
            Get precise shot adjustments with real-time wind calculations, compass heading, and aim recommendations.
          </Text>

          <View style={styles.features}>
            <View style={styles.feature}>
              <Compass size={20} color={colors.brand} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                Set shot heading with compass
              </Text>
            </View>
            <View style={styles.feature}>
              <Wind size={20} color={colors.brand} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                Wind speed & direction effects
              </Text>
            </View>
            <View style={styles.feature}>
              <Lock size={20} color={colors.brand} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                Aim adjustment recommendations
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={cardEntering(4)}>
          <Pressable
            onPress={handleUpgrade}
            style={[styles.upgradeButton, { backgroundColor: colors.brand }]}
            accessibilityLabel="Upgrade to Premium"
            accessibilityRole="button"
          >
            <Crown size={20} color={colors.textInverse} />
            <Text style={[styles.upgradeButtonText, { color: colors.textInverse }]}>
              Upgrade to Premium
            </Text>
            <ChevronRight size={20} color={colors.textInverse} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={cardEntering(5)}>
          <Text style={[styles.note, { color: colors.textMuted }]}>
            The free Shot Calculator includes temperature, altitude, and humidity adjustments.
          </Text>
        </Animated.View>
    </ScrollView>
  );
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

export default function WindScreen() {
  const { isPremium } = usePremium();

  // Premium users get the full wind calculator wrapped in error boundary
  if (isPremium) {
    return (
      <ErrorBoundary>
        <WindCalculatorWithCompass />
      </ErrorBoundary>
    );
  }

  // Free users see upgrade prompt
  return <PremiumUpgradePrompt />;
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },

  upgradeContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: 'center',
    gap: 24,
  },

  // Conditions
  conditionsScroll: {
    marginBottom: 20,
    marginHorizontal: -16,
  },

  conditionsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },

  // Sections
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },

  // Compass
  compassSection: {
    alignItems: 'center',
    marginBottom: 24,
  },

  compassWrapper: {
    marginVertical: 8,
  },

  // Sensor Warning - background color applied dynamically via inline style
  sensorWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    marginBottom: 8,
  },

  warningText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Calibration hint
  calibrationHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },

  calibrationText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },

  calibrationDismiss: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Manual Heading Fallback
  manualHeadingSection: {
    marginBottom: 16,
  },

  // Slider Sections
  sliderSection: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  stepperRowInline: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginTop: 12,
  },

  stepperButtonInline: {
    minWidth: 64,
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepperTextInline: {
    fontSize: 14,
    fontWeight: '600',
  },

  manualSection: {
    marginBottom: 16,
  },

  manualToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 48,
  },

  manualToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },

  manualInputs: {
    gap: 16,
    padding: 12,
  },

  manualInputWrapper: {
    gap: 6,
  },

  manualInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  manualInput: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '500',
  },

  errorBanner: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },

  errorBannerText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  resultsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    minHeight: '100%',
    paddingHorizontal: 16,
  },

  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  resultsBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  resultsBackText: {
    fontSize: 14,
    fontWeight: '600',
  },

  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  resultsSpacer: {
    width: 48,
  },

  resultsBody: {
    gap: 16,
  },

  resultCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    // Note: backgroundColor applied inline via colors.surfaceElevated for theme support
  },

  resultLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },

  resultValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },

  resultSub: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },

  resultBreakdown: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },

  recalculateButton: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  recalculateText: {
    fontSize: 16,
    fontWeight: '700',
  },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },

  lockButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  calculateButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  calculateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Premium Upgrade Prompt Styles
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  upgradeHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },

  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  card: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },

  cardDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },

  features: {
    gap: 16,
  },

  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  featureText: {
    fontSize: 15,
  },

  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
  },

  upgradeButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },

  note: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
  },
});
