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
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useAccessibleAnimations } from '@/src/hooks/useAccessibility';
import * as Haptics from 'expo-haptics';
import { Wind, Compass, Lock, Crown, ChevronRight, Navigation, AlertTriangle } from 'lucide-react-native';

import { useRedesignTheme } from '@/src/theme/redesign';
import { ResultCard } from '@/src/components/redesign/ResultCard';
import { QuickAction } from '@/src/components/redesign/QuickAction';
import { MetricPill } from '@/src/components/redesign/MetricPill';
import { Slider } from '@/src/core/components/ui/slider';
import { usePremium } from '@/src/features/settings/context/premium';
import { useSettings, Settings } from '@/src/core/context/settings';
import { useEnhancedEnvironmental } from '@/src/providers/EnhancedEnvironmentalProvider';
import { useWindCalculator } from '@/src/features/wind/hooks/useWindCalculator';
import { useSensorData } from '@/src/features/wind/context/sensor-data';
import { CompassLockProvider, useCompassLock } from '@/src/features/wind/context/compass-lock';
import WindDirectionCompass from '@/src/features/wind/components/compass';
import { FeatureFlags } from '@/src/utils/FeatureFlags';

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

function getMaxWindSpeed(speedUnit: Settings['speedUnit']): number {
  switch (speedUnit) {
    case 'mph': return 40;
    case 'kph': return Math.round(40 * 1.60934); // ~64 kph
    case 'kts': return Math.round(40 * 0.868976); // ~35 kts
    case 'mps': return Math.round(40 * 0.44704); // ~18 m/s
    default: return 40;
  }
}

// =============================================================================
// WIND CALCULATOR REDESIGN COMPONENT
// =============================================================================

function WindCalculatorRedesign({ sensorAvailable = true }: { sensorAvailable?: boolean }) {
  const { colors } = useRedesignTheme();
  const { settings, convertDistance } = useSettings();
  const environmental = useEnhancedEnvironmental();
  const { isLocked, relativeWindAngle } = useCompassLock();
  const { height: screenHeight } = useWindowDimensions();
  const { headerEntering, cardEntering } = useAccessibleAnimations();

  // Adaptive compass sizing (180-240px based on screen height)
  // Smaller to make room for result card above the fold
  const reservedSpace = 650;
  const availableForCompass = Math.max(0, screenHeight - reservedSpace);
  const compassSize = Math.max(180, Math.min(240, 180 + availableForCompass * 0.5));

  // Wind calculator hook
  const {
    calculate,
    result,
    setWindSpeed,
    setTargetYardage,
  } = useWindCalculator();

  // Local state
  const [targetDistance, setTargetDistance] = useState(150);
  const [windSpeedOverride, setWindSpeedOverride] = useState<number | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>('150');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const calcTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation
  const resultScale = useSharedValue(1);

  // Get current wind data (convert from mph to user's unit)
  const currentWindSpeedMph = environmental.conditions?.windSpeed || 0;
  const currentWindDirection = environmental.conditions?.windDirection || 0;
  const currentWindGustMph = environmental.conditions?.windGust;

  // Convert to user's preferred unit for display
  const currentWindSpeedDisplay = Math.round(convertFromMph(currentWindSpeedMph, settings.speedUnit));
  const currentWindGustDisplay = currentWindGustMph ? Math.round(convertFromMph(currentWindGustMph, settings.speedUnit)) : null;
  const speedUnitLabel = getSpeedUnitLabel(settings.speedUnit);
  const maxWindSpeed = getMaxWindSpeed(settings.speedUnit);

  // Effective wind speed (override or actual) - in user's unit
  const effectiveWindSpeed = windSpeedOverride ?? currentWindSpeedDisplay;

  // Distance unit label
  const unit = settings.distanceUnit === 'meters' ? 'm' : 'yds';

  // Distance bounds based on unit
  const distMin = 50;
  const distMax = settings.distanceUnit === 'yards' ? 350 : Math.round(convertDistance(350, 'meters'));

  // Quick presets (convert to user's unit if metric)
  const presets = useMemo(() => {
    const baseYards = [100, 125, 150, 175, 200];
    if (settings.distanceUnit === 'meters') {
      return baseYards.map(y => {
        const meters = Math.round(convertDistance(y, 'meters'));
        return { id: String(meters), label: String(meters), distance: meters };
      });
    }
    return baseYards.map(y => ({ id: String(y), label: String(y), distance: y }));
  }, [settings.distanceUnit, convertDistance]);

  // Format the result for display (convert to user's unit)
  const displayResult = useMemo((): WindCalculationDisplay | null => {
    if (!result) return null;

    // lateralEffect is the crosswind (left/right push) - in yards
    const crosswindYards = result.lateralEffect || 0;
    const headwindYards = result.windEffect || 0;
    const playsLikeYards = result.effectivePlayingDistance;

    // Convert to user's distance unit
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

    let aimDirection = '';
    if (Math.abs(crosswindYards) > 0.5) {
      aimDirection = crosswindYards > 0 ? 'right' : 'left';
    }

    return {
      playsLike,
      club: result.finalClub,
      aimAdjustment: Math.abs(crosswindYards) > 0.5
        ? `${crosswind} ${unit} ${aimDirection}`
        : 'On line',
      headwindEffect,
      crosswindEffect: crosswindYards > 0 ? crosswind : -crosswind,
      totalAdjustment: headwindEffect,
    };
  }, [result, settings.distanceUnit, convertDistance, unit]);

  // Auto-calculate when inputs change (debounced)
  const triggerCalculation = useCallback(() => {
    // Clear any pending calculation
    if (calcTimeoutRef.current) {
      clearTimeout(calcTimeoutRef.current);
    }

    // Debounce calculation by 200ms
    calcTimeoutRef.current = setTimeout(() => {
      // Convert wind speed to mph for calculation (calculator expects mph)
      const windSpeedMph = Math.round(convertToMph(effectiveWindSpeed, settings.speedUnit));

      // Convert target distance to yards for calculation if in meters
      const targetInYards = settings.distanceUnit === 'meters'
        ? Math.round(targetDistance / 0.9144) // meters to yards
        : targetDistance;

      // Ensure the hook has the latest values (in yards/mph for calculation)
      setWindSpeed(windSpeedMph);
      setTargetYardage(targetInYards);

      // Run calculation with the relative wind angle
      calculate(relativeWindAngle);

      // Subtle animation on result update
      resultScale.value = withSequence(
        withSpring(1.02, { damping: 12 }),
        withSpring(1, { damping: 15 })
      );
    }, 200);
  }, [effectiveWindSpeed, targetDistance, relativeWindAngle, calculate, setWindSpeed, setTargetYardage, resultScale, settings.speedUnit, settings.distanceUnit]);

  // Trigger calculation on input changes
  React.useEffect(() => {
    triggerCalculation();
  }, [targetDistance, effectiveWindSpeed, relativeWindAngle, isLocked, triggerCalculation]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (calcTimeoutRef.current) {
        clearTimeout(calcTimeoutRef.current);
      }
    };
  }, []);

  // Handlers
  const handlePresetSelect = useCallback((preset: { id: string; distance: number }) => {
    setSelectedPreset(preset.id);
    setTargetDistance(preset.distance);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView
        ref={scrollViewRef}
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
        <Animated.View entering={headerEntering} style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Wind Calculator</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Aim adjustments for wind</Text>
        </Animated.View>

        {/* Conditions Bar */}
        <Animated.View entering={headerEntering}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.conditionsScroll}
            contentContainerStyle={styles.conditionsContainer}
          >
            <MetricPill
              icon={<Wind size={14} color={colors.textMuted} />}
              label="Wind"
              value={`${currentWindSpeedDisplay} ${speedUnitLabel}`}
            />
            <MetricPill
              icon={<Navigation size={14} color={colors.textMuted} />}
              label="Direction"
              value={`${degreesToDirection(currentWindDirection)} (${Math.round(currentWindDirection)}°)`}
            />
            {currentWindGustDisplay && currentWindGustDisplay > currentWindSpeedDisplay && (
              <MetricPill
                icon={<Wind size={14} color={colors.warning} />}
                label="Gust"
                value={`${currentWindGustDisplay} ${speedUnitLabel}`}
                status="warning"
              />
            )}
          </ScrollView>
        </Animated.View>

        {/* Compass Section */}
        <Animated.View entering={cardEntering(1)} style={styles.compassSection}>
          <View style={styles.compassWrapper}>
            <WindDirectionCompass size={compassSize} />
          </View>
        </Animated.View>

        {/* Sensor Warning - Show when compass unavailable */}
        {FeatureFlags.PHASE1_ACCESSIBILITY_ENHANCEMENTS && !sensorAvailable && (
          <View style={styles.sensorWarning}>
            <AlertTriangle size={16} color={colors.warning} />
            <Text style={[styles.warningText, { color: colors.warning }]}>
              Compass unavailable
            </Text>
          </View>
        )}

        {/* Result Card - Show immediately with live updates */}
        {displayResult && (
          <Animated.View entering={cardEntering(2)} style={resultAnimatedStyle}>
            <ResultCard
              primaryLabel="Plays like"
              primaryValue={displayResult.playsLike.toString()}
              primaryUnit={unit}
              secondaryLabel="Club"
              secondaryValue={displayResult.club}
              tertiaryLabel="Adjustment"
              tertiaryValue={`${displayResult.totalAdjustment > 0 ? '+' : ''}${displayResult.totalAdjustment} ${unit}`}
              tertiaryStatus={displayResult.totalAdjustment > 0 ? 'negative' : displayResult.totalAdjustment < 0 ? 'positive' : 'neutral'}
              variant="highlighted"
              style={styles.resultCard}
            />
          </Animated.View>
        )}

        {/* Target Distance Input with Slider */}
        <Animated.View entering={cardEntering(2)} style={styles.sliderSection}>
          <Slider
            value={targetDistance}
            onValueChange={(val) => {
              setTargetDistance(val);
              setSelectedPreset(null);
            }}
            min={distMin}
            max={distMax}
            step={1}
            label="Target Distance"
            unit={unit}
            dense
          />
        </Animated.View>

        {/* Quick Presets */}
        <Animated.View entering={cardEntering(3)} style={styles.presetsSection}>
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

        {/* Wind Speed Override with Slider */}
        <Animated.View entering={cardEntering(3)} style={styles.sliderSection}>
          <Slider
            value={effectiveWindSpeed}
            onValueChange={(val) => setWindSpeedOverride(val)}
            min={0}
            max={maxWindSpeed}
            step={1}
            label={`Wind Speed${windSpeedOverride !== null ? ' (Override)' : ''}`}
            unit={speedUnitLabel}
            dense
          />
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
                Reset to actual ({currentWindSpeedDisplay} {speedUnitLabel})
              </Text>
            </Pressable>
          )}
        </Animated.View>

        {/* Wind Effects Breakdown - Only show if there's meaningful adjustment */}
        {displayResult && Math.abs(displayResult.totalAdjustment) > 0.5 && (
          <Animated.View
            entering={cardEntering(1)}
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
                {displayResult.headwindEffect} {unit}
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
                {Math.abs(displayResult.crosswindEffect)} {unit} {displayResult.crosswindEffect > 0 ? 'R' : displayResult.crosswindEffect < 0 ? 'L' : ''}
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
                {displayResult.totalAdjustment} {unit}
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
  const { heading, isAvailable: sensorAvailable } = useSensorData();

  return (
    <CompassLockProvider
      currentHeading={heading || 0}
      windDirection={environmental.conditions?.windDirection || 0}
    >
      <WindCalculatorRedesign sensorAvailable={sensorAvailable} />
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.content, { paddingBottom: 80 }]}>
        <Animated.View entering={headerEntering} style={styles.upgradeHeader}>
          <View style={[styles.iconContainer, { backgroundColor: colors.brandMuted }]}>
            <Wind size={48} color={colors.brand} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Wind Calculator</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Premium Feature
          </Text>
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

  // Sensor Warning
  sensorWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    gap: 6,
    marginBottom: 8,
  },

  warningText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Slider Sections
  sliderSection: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  // Distance Input (legacy - kept for reference)
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
