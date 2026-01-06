/**
 * Wind Tab - Premium Wind Calculator (Redesign)
 *
 * Full wind calculation with compass heading, aim adjustments.
 * This is a PREMIUM feature - free users see upgrade prompt.
 *
 * Matches the Shot screen aesthetic with:
 * - MetricPills for conditions
 * - ResultCard for calculation output
 * - QuickAction for presets
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  TextInput,
  Keyboard,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Wind, Compass, Lock, Crown, ChevronRight, Navigation } from 'lucide-react-native';

import { useRedesignTheme } from '@/src/theme/redesign';
import { ResultCard } from '@/src/components/redesign/ResultCard';
import { QuickAction } from '@/src/components/redesign/QuickAction';
import { MetricPill } from '@/src/components/redesign/MetricPill';
import { usePremium } from '@/src/features/settings/context/premium';
import { useSettings } from '@/src/core/context/settings';
import { useEnhancedEnvironmental } from '@/src/providers/EnhancedEnvironmentalProvider';
import { useWindCalculator } from '@/src/features/wind/hooks/useWindCalculator';
import { useSensorData } from '@/src/features/wind/context/sensor-data';
import { CompassLockProvider, useCompassLock } from '@/src/features/wind/context/compass-lock';
import WindDirectionCompass from '@/src/features/wind/components/compass';

// =============================================================================
// TYPES
// =============================================================================

interface WindCalculationDisplay {
  playsLike: number;
  club: string;
  aimAdjustment: string;
  headwindEffect: number;
  crosswindEffect: number;
  totalAdjustment: number;
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
// WIND CALCULATOR REDESIGN COMPONENT
// =============================================================================

function WindCalculatorRedesign() {
  const { colors } = useRedesignTheme();
  const { settings } = useSettings();
  const environmental = useEnhancedEnvironmental();
  const { isLocked, relativeWindAngle } = useCompassLock();
  const { height: screenHeight } = useWindowDimensions();

  // Adaptive compass sizing (180-260px based on screen height)
  // Reserve space for: header(60) + conditions(40) + distance(140) + presets(60) + wind(100) + button(80) + result(~150) + padding(100)
  const reservedSpace = 730;
  const availableForCompass = Math.max(0, screenHeight - reservedSpace);
  const compassSize = Math.max(180, Math.min(260, 180 + availableForCompass));

  // Wind calculator hook
  const {
    calculate,
    result,
    windSpeed: hookWindSpeed,
    setWindSpeed,
    targetYardage: hookTargetYardage,
    setTargetYardage,
  } = useWindCalculator();

  // Local state
  const [targetDistance, setTargetDistance] = useState(150);
  const [windSpeedOverride, setWindSpeedOverride] = useState<number | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>('150');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [isEditingDistance, setIsEditingDistance] = useState(false);
  const [distanceInputValue, setDistanceInputValue] = useState('150');
  const distanceInputRef = useRef<TextInput>(null);

  // Animation
  const resultScale = useSharedValue(1);

  // Get current wind data
  const currentWindSpeed = environmental.conditions?.windSpeed || 0;
  const currentWindDirection = environmental.conditions?.windDirection || 0;
  const currentWindGust = environmental.conditions?.windGust;

  // Effective wind speed (override or actual)
  const effectiveWindSpeed = windSpeedOverride ?? Math.round(currentWindSpeed);

  // Quick presets
  const presets = useMemo(() => [
    { id: '100', label: '100', distance: 100 },
    { id: '125', label: '125', distance: 125 },
    { id: '150', label: '150', distance: 150 },
    { id: '175', label: '175', distance: 175 },
    { id: '200', label: '200', distance: 200 },
  ], []);

  // Format the result for display
  const displayResult = useMemo((): WindCalculationDisplay | null => {
    if (!result) return null;

    // lateralEffect is the crosswind (left/right push)
    const crosswind = result.lateralEffect || 0;
    let aimDirection = '';
    if (Math.abs(crosswind) > 0.5) {
      aimDirection = crosswind > 0 ? 'right' : 'left';
    }

    return {
      playsLike: Math.round(result.effectivePlayingDistance),
      club: result.finalClub,
      aimAdjustment: Math.abs(crosswind) > 0.5
        ? `${Math.abs(Math.round(crosswind))} yds ${aimDirection}`
        : 'On line',
      headwindEffect: Math.round(result.windEffect || 0),
      crosswindEffect: Math.round(crosswind),
      totalAdjustment: Math.round(result.windEffect || 0),
    };
  }, [result]);

  // Handlers
  const handlePresetSelect = useCallback((preset: { id: string; distance: number }) => {
    setSelectedPreset(preset.id);
    setTargetDistance(preset.distance);
    setTargetYardage(preset.distance);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [setTargetYardage]);

  const handleDistanceChange = useCallback((delta: number) => {
    setTargetDistance((prev) => {
      const newValue = Math.max(50, Math.min(350, prev + delta));
      setTargetYardage(newValue);
      return newValue;
    });
    setSelectedPreset(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [setTargetYardage]);

  const handleWindSpeedChange = useCallback((delta: number) => {
    setWindSpeedOverride((prev) => {
      const current = prev ?? Math.round(currentWindSpeed);
      const newValue = Math.max(0, Math.min(50, current + delta));
      setWindSpeed(newValue);
      return newValue;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [currentWindSpeed, setWindSpeed]);

  const handleDistanceTap = useCallback(() => {
    setDistanceInputValue(targetDistance.toString());
    setIsEditingDistance(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Focus the input after a brief delay to ensure it's mounted
    setTimeout(() => {
      distanceInputRef.current?.focus();
    }, 50);
  }, [targetDistance]);

  const handleDistanceInputSubmit = useCallback(() => {
    const parsed = parseInt(distanceInputValue, 10);
    if (!isNaN(parsed)) {
      const newValue = Math.max(50, Math.min(350, parsed));
      setTargetDistance(newValue);
      setTargetYardage(newValue);
      setSelectedPreset(null);
    }
    setIsEditingDistance(false);
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [distanceInputValue, setTargetYardage]);

  const handleDistanceInputBlur = useCallback(() => {
    handleDistanceInputSubmit();
  }, [handleDistanceInputSubmit]);

  const handleCalculate = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Ensure the hook has the latest values
    setWindSpeed(effectiveWindSpeed);
    setTargetYardage(targetDistance);

    // Run calculation with the relative wind angle
    calculate(relativeWindAngle);
    setHasCalculated(true);

    // Animate result
    resultScale.value = withSequence(
      withSpring(1.03, { damping: 10 }),
      withSpring(1, { damping: 15 })
    );
  }, [effectiveWindSpeed, targetDistance, relativeWindAngle, calculate, setWindSpeed, setTargetYardage, resultScale]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (environmental.forceRefresh) {
      await environmental.forceRefresh();
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    setWindSpeedOverride(null); // Reset override on refresh
    setIsRefreshing(false);
  }, [environmental.forceRefresh]);

  const resultAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resultScale.value }],
  }));

  const unit = settings.distanceUnit === 'meters' ? 'm' : 'yds';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 80 }, // 64 (tab bar) + 16 (buffer) - insets already in tab bar
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brand}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn} style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Wind Calculator</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Aim adjustments for wind</Text>
        </Animated.View>

        {/* Conditions Bar */}
        <Animated.View entering={FadeIn.delay(100)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.conditionsScroll}
            contentContainerStyle={styles.conditionsContainer}
          >
            <MetricPill
              icon={<Wind size={14} color={colors.textMuted} />}
              label="Wind"
              value={`${Math.round(currentWindSpeed)} mph`}
            />
            <MetricPill
              icon={<Navigation size={14} color={colors.textMuted} />}
              label="Direction"
              value={`${degreesToDirection(currentWindDirection)} (${Math.round(currentWindDirection)}°)`}
            />
            {currentWindGust && currentWindGust > currentWindSpeed && (
              <MetricPill
                icon={<Wind size={14} color={colors.warning} />}
                label="Gust"
                value={`${Math.round(currentWindGust)} mph`}
                status="warning"
              />
            )}
          </ScrollView>
        </Animated.View>

        {/* Compass Section */}
        <Animated.View entering={FadeInDown.delay(150)} style={styles.compassSection}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            SHOT DIRECTION
          </Text>
          <View style={styles.compassWrapper}>
            <WindDirectionCompass size={compassSize} />
          </View>
          <Text style={[styles.compassHint, { color: colors.textMuted }]}>
            {isLocked
              ? 'Compass locked - tap lock to adjust'
              : 'Point phone in shot direction, then lock'
            }
          </Text>
        </Animated.View>

        {/* Target Distance Input */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.distanceSection}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            TARGET DISTANCE
          </Text>
          <View style={styles.distanceRow}>
            <Pressable
              onPress={() => handleDistanceChange(-10)}
              style={[styles.adjustButton, { backgroundColor: colors.surface }]}
              accessibilityLabel="Decrease by 10"
              accessibilityRole="button"
            >
              <Text style={[styles.adjustButtonText, { color: colors.textPrimary }]}>
                -10
              </Text>
            </Pressable>

            <Pressable
              onPress={handleDistanceTap}
              style={styles.distanceValueContainer}
              accessibilityLabel={`Distance ${targetDistance} ${unit}. Tap to edit`}
              accessibilityRole="button"
              accessibilityHint="Double tap to enter exact distance"
            >
              {isEditingDistance ? (
                <TextInput
                  ref={distanceInputRef}
                  style={[styles.distanceInput, { color: colors.textPrimary, borderColor: colors.brand }]}
                  value={distanceInputValue}
                  onChangeText={setDistanceInputValue}
                  onSubmitEditing={handleDistanceInputSubmit}
                  onBlur={handleDistanceInputBlur}
                  keyboardType="number-pad"
                  maxLength={3}
                  selectTextOnFocus
                  accessibilityLabel="Enter distance"
                />
              ) : (
                <Text style={[styles.distanceValue, { color: colors.textPrimary }]}>
                  {targetDistance}
                </Text>
              )}
              <Text style={[styles.distanceUnit, { color: colors.textMuted }]}>
                {unit}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleDistanceChange(10)}
              style={[styles.adjustButton, { backgroundColor: colors.surface }]}
              accessibilityLabel="Increase by 10"
              accessibilityRole="button"
            >
              <Text style={[styles.adjustButtonText, { color: colors.textPrimary }]}>
                +10
              </Text>
            </Pressable>
          </View>

          {/* Fine-tune steppers */}
          <View style={styles.stepperRow}>
            <Pressable
              onPress={() => handleDistanceChange(-1)}
              style={[styles.stepperButton, { backgroundColor: colors.surface }]}
              accessibilityLabel="Decrease by 1"
              accessibilityRole="button"
            >
              <Text style={[styles.stepperButtonText, { color: colors.textPrimary }]}>-1</Text>
            </Pressable>

            <Pressable
              onPress={() => handleDistanceChange(1)}
              style={[styles.stepperButton, { backgroundColor: colors.surface }]}
              accessibilityLabel="Increase by 1"
              accessibilityRole="button"
            >
              <Text style={[styles.stepperButtonText, { color: colors.textPrimary }]}>+1</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Quick Presets */}
        <Animated.View entering={FadeInDown.delay(250)} style={styles.presetsSection}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            QUICK SELECT
          </Text>
          <View style={styles.presetsRow}>
            {presets.map((preset) => (
              <QuickAction
                key={preset.id}
                label={preset.label}
                sublabel={unit}
                variant="secondary"
                selected={selectedPreset === preset.id}
                onPress={() => handlePresetSelect(preset)}
                style={styles.presetButton}
              />
            ))}
          </View>
        </Animated.View>

        {/* Wind Speed Override */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.windSpeedSection}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            WIND SPEED {windSpeedOverride !== null ? '(OVERRIDE)' : ''}
          </Text>
          {/* Large wind adjustments */}
          <View style={styles.windSpeedRow}>
            <Pressable
              onPress={() => handleWindSpeedChange(-5)}
              style={[styles.windAdjustButton, { backgroundColor: colors.surface }]}
              accessibilityLabel="Decrease wind speed by 5"
              accessibilityRole="button"
            >
              <Text style={[styles.windAdjustButtonText, { color: colors.textPrimary }]}>
                -5
              </Text>
            </Pressable>

            <View style={styles.windSpeedValueContainer}>
              <Wind size={18} color={colors.textMuted} />
              <Text style={[styles.windSpeedValue, { color: colors.textPrimary }]}>
                {effectiveWindSpeed}
              </Text>
              <Text style={[styles.windSpeedUnit, { color: colors.textMuted }]}>
                mph
              </Text>
            </View>

            <Pressable
              onPress={() => handleWindSpeedChange(5)}
              style={[styles.windAdjustButton, { backgroundColor: colors.surface }]}
              accessibilityLabel="Increase wind speed by 5"
              accessibilityRole="button"
            >
              <Text style={[styles.windAdjustButtonText, { color: colors.textPrimary }]}>
                +5
              </Text>
            </Pressable>
          </View>

          {/* Fine-tune wind steppers */}
          <View style={styles.windStepperRow}>
            <Pressable
              onPress={() => handleWindSpeedChange(-1)}
              style={[styles.windStepperButton, { backgroundColor: colors.surface }]}
              accessibilityLabel="Decrease wind speed by 1"
              accessibilityRole="button"
            >
              <Text style={[styles.windStepperButtonText, { color: colors.textPrimary }]}>-1</Text>
            </Pressable>

            <Pressable
              onPress={() => handleWindSpeedChange(1)}
              style={[styles.windStepperButton, { backgroundColor: colors.surface }]}
              accessibilityLabel="Increase wind speed by 1"
              accessibilityRole="button"
            >
              <Text style={[styles.windStepperButtonText, { color: colors.textPrimary }]}>+1</Text>
            </Pressable>
          </View>

          {windSpeedOverride !== null && (
            <Pressable
              onPress={() => {
                setWindSpeedOverride(null);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={styles.resetButton}
              accessibilityLabel="Reset to actual wind speed"
              accessibilityRole="button"
            >
              <Text style={[styles.resetButtonText, { color: colors.brand }]}>
                Reset to actual ({Math.round(currentWindSpeed)} mph)
              </Text>
            </Pressable>
          )}
        </Animated.View>

        {/* Calculate Button */}
        <Animated.View entering={FadeInDown.delay(350)} style={styles.calculateButtonSection}>
          <Pressable
            onPress={handleCalculate}
            style={[styles.calculateButton, { backgroundColor: colors.brand }]}
            accessibilityLabel="Calculate Wind Effect"
            accessibilityRole="button"
          >
            <Wind size={20} color={colors.textInverse} />
            <Text style={[styles.calculateButtonText, { color: colors.textInverse }]}>
              Calculate Wind Effect
            </Text>
          </Pressable>
        </Animated.View>

        {/* Result Card */}
        {hasCalculated && displayResult && (
          <Animated.View entering={FadeInDown.delay(100)} style={resultAnimatedStyle}>
            <ResultCard
              primaryLabel="Plays like"
              primaryValue={displayResult.playsLike.toString()}
              primaryUnit={unit}
              secondaryLabel="Club"
              secondaryValue={displayResult.club}
              tertiaryLabel="Aim"
              tertiaryValue={displayResult.aimAdjustment}
              variant="highlighted"
              style={styles.resultCard}
            />
          </Animated.View>
        )}

        {/* Wind Effects Breakdown */}
        {hasCalculated && displayResult && Math.abs(displayResult.totalAdjustment) > 0.5 && (
          <Animated.View
            entering={FadeInDown.delay(150)}
            style={[styles.adjustmentsCard, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.adjustmentsTitle, { color: colors.textMuted }]}>
              WIND EFFECTS
            </Text>
            <View style={styles.adjustmentRow}>
              <Text style={[styles.adjustmentLabel, { color: colors.textSecondary }]}>
                Headwind/Tailwind
              </Text>
              <Text
                style={[
                  styles.adjustmentValue,
                  {
                    color:
                      displayResult.headwindEffect > 0
                        ? colors.error
                        : displayResult.headwindEffect < 0
                        ? colors.success
                        : colors.textPrimary,
                  },
                ]}
              >
                {displayResult.headwindEffect > 0 ? '+' : ''}
                {displayResult.headwindEffect} yds
              </Text>
            </View>
            <View style={styles.adjustmentRow}>
              <Text style={[styles.adjustmentLabel, { color: colors.textSecondary }]}>
                Crosswind (Left/Right)
              </Text>
              <Text
                style={[
                  styles.adjustmentValue,
                  { color: colors.textPrimary },
                ]}
              >
                {displayResult.crosswindEffect > 0 ? '' : ''}
                {Math.abs(displayResult.crosswindEffect)} yds {displayResult.crosswindEffect > 0 ? 'R' : displayResult.crosswindEffect < 0 ? 'L' : ''}
              </Text>
            </View>
            <View style={[styles.adjustmentRow, styles.totalRow]}>
              <Text style={[styles.adjustmentLabel, { color: colors.textPrimary, fontWeight: '600' }]}>
                Total Distance Effect
              </Text>
              <Text
                style={[
                  styles.adjustmentValue,
                  {
                    color:
                      displayResult.totalAdjustment > 0
                        ? colors.error
                        : displayResult.totalAdjustment < 0
                        ? colors.success
                        : colors.textPrimary,
                    fontWeight: '700',
                  },
                ]}
              >
                {displayResult.totalAdjustment > 0 ? '+' : ''}
                {displayResult.totalAdjustment} yds
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// =============================================================================
// WRAP WITH COMPASS LOCK PROVIDER
// =============================================================================

function WindCalculatorWithCompass() {
  const environmental = useEnhancedEnvironmental();
  const { heading } = useSensorData();

  return (
    <CompassLockProvider
      currentHeading={heading || 0}
      windDirection={environmental.conditions?.windDirection || 0}
    >
      <WindCalculatorRedesign />
    </CompassLockProvider>
  );
}

// =============================================================================
// PREMIUM UPGRADE PROMPT (UNCHANGED)
// =============================================================================

function PremiumUpgradePrompt() {
  const { colors } = useRedesignTheme();
  const { setShowUpgradeModal } = usePremium();

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowUpgradeModal(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.content, { paddingBottom: 80 }]}>
        <Animated.View entering={FadeIn} style={styles.upgradeHeader}>
          <View style={[styles.iconContainer, { backgroundColor: colors.brandMuted }]}>
            <Wind size={48} color={colors.brand} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Wind Calculator</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Premium Feature
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={[styles.card, { backgroundColor: colors.surface }]}>
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

        <Animated.View entering={FadeInDown.delay(400)}>
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

        <Animated.View entering={FadeInDown.delay(500)}>
          <Text style={[styles.note, { color: colors.textMuted }]}>
            The free Shot Calculator includes temperature, altitude, and humidity adjustments.
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

export default function WindScreen() {
  const { isPremium } = usePremium();

  // Premium users get the full wind calculator
  if (isPremium) {
    return <WindCalculatorWithCompass />;
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

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  header: {
    marginBottom: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 16,
    marginTop: 4,
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

  compassHint: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },

  // Distance Input
  distanceSection: {
    alignItems: 'center',
    marginBottom: 24,
  },

  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  adjustButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  adjustButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  distanceValueContainer: {
    alignItems: 'center',
    minWidth: 140,
  },

  distanceValue: {
    fontSize: 64,
    fontWeight: '700',
    letterSpacing: -2,
    lineHeight: 72,
  },

  distanceUnit: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: -4,
  },

  distanceInput: {
    fontSize: 64,
    fontWeight: '700',
    letterSpacing: -2,
    lineHeight: 72,
    textAlign: 'center',
    minWidth: 120,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  // Distance fine-tune steppers
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 60,
    marginTop: 12,
  },

  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepperButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Presets
  presetsSection: {
    marginBottom: 24,
  },

  presetsRow: {
    flexDirection: 'row',
    gap: 8,
  },

  presetButton: {
    flex: 1,
  },

  // Wind Speed Override
  windSpeedSection: {
    alignItems: 'center',
    marginBottom: 24,
  },

  windSpeedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  // Wind large adjustment buttons
  windAdjustButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  windAdjustButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Wind fine-tune steppers
  windStepperRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 80,
    marginTop: 12,
  },

  windStepperButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  windStepperButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },

  windSpeedValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 100,
    justifyContent: 'center',
  },

  windSpeedValue: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
  },

  windSpeedUnit: {
    fontSize: 14,
    fontWeight: '500',
  },

  resetButton: {
    marginTop: 8,
    padding: 8,
  },

  resetButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Calculate Button
  calculateButtonSection: {
    marginBottom: 24,
  },

  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
  },

  calculateButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },

  // Result
  resultCard: {
    marginBottom: 16,
  },

  // Adjustments
  adjustmentsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },

  adjustmentsTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
  },

  adjustmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },

  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginTop: 8,
    paddingTop: 16,
  },

  adjustmentLabel: {
    fontSize: 15,
  },

  adjustmentValue: {
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
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
