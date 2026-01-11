/**
 * Shot Tab - Environmental Shot Calculator (FREE)
 *
 * Adjustments for temperature, altitude, and humidity only.
 * Wind calculator is a separate PREMIUM tab.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
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
import { Thermometer, Droplets, Mountain, Gauge } from 'lucide-react-native';

import { useRedesignTheme } from '@/src/theme/redesign';
import { ResultCard } from '@/src/components/redesign/ResultCard';
import { QuickAction } from '@/src/components/redesign/QuickAction';
import { MetricPill } from '@/src/components/redesign/MetricPill';
import { Slider } from '@/src/core/components/ui/slider';
import { useSettings, Settings } from '@/src/core/context/settings';
import { useEnhancedEnvironmental } from '@/src/providers/EnhancedEnvironmentalProvider';
import { useClubSettings } from '@/src/features/settings/context/clubs';

// =============================================================================
// HELPER - Unit conversions
// =============================================================================

function convertTemperatureForDisplay(tempF: number, tempUnit: Settings['temperatureUnit']): number {
  if (tempUnit === 'celsius') {
    return Math.round((tempF - 32) * 5 / 9);
  }
  return Math.round(tempF);
}

function getTempUnitLabel(tempUnit: Settings['temperatureUnit']): string {
  return tempUnit === 'celsius' ? '°C' : '°F';
}

function convertAltitudeForDisplay(altFt: number, distanceUnit: Settings['distanceUnit']): number {
  if (distanceUnit === 'meters') {
    return Math.round(altFt * 0.3048);
  }
  return Math.round(altFt);
}

function getAltitudeUnitLabel(distanceUnit: Settings['distanceUnit']): string {
  return distanceUnit === 'meters' ? 'm' : 'ft';
}

// =============================================================================
// TYPES
// =============================================================================

interface CalculationResult {
  playsLike: number;
  club: string;
  tempEffect: number;
  altitudeEffect: number;
  humidityEffect: number;
  totalAdjustment: number;
}

// =============================================================================
// MAIN SCREEN
// =============================================================================

export default function ShotScreen() {
  const { colors } = useRedesignTheme();
  const { settings, convertDistance } = useSettings();
  const { clubs } = useClubSettings();
  const environmental = useEnhancedEnvironmental();

  // State
  const [targetDistance, setTargetDistance] = useState(150);
  const [selectedPreset, setSelectedPreset] = useState<string | null>('150');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Animation
  const resultScale = useSharedValue(1);

  // Unit labels
  const unit = settings.distanceUnit === 'meters' ? 'm' : 'yds';
  const tempUnit = getTempUnitLabel(settings.temperatureUnit);
  const altUnit = getAltitudeUnitLabel(settings.distanceUnit);

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

  // FREE calculation - Environment only (NO WIND)
  const calculationResult = useMemo((): CalculationResult => {
    const temperatureF = environmental.conditions?.temperature || 70;
    const humidity = environmental.conditions?.humidity || 50;
    const altitudeFt = environmental.conditions?.altitude || 0;

    // Convert target distance to yards for calculation if in meters
    const targetInYards = settings.distanceUnit === 'meters'
      ? Math.round(convertDistance(targetDistance, 'yards'))
      : targetDistance;

    // Temperature effect: ball flies further in warm air (calculated in yards)
    const tempEffectYards = ((temperatureF - 70) / 10) * -2;

    // Altitude effect: ball flies further at altitude (calculated in yards)
    const altitudeEffectYards = (altitudeFt / 1000) * targetInYards * -0.02;

    // Humidity effect: humid air is less dense (calculated in yards)
    const humidityEffectYards = ((humidity - 50) / 25) * -1;

    // FREE tier: NO wind effect
    const totalAdjustmentYards = tempEffectYards + altitudeEffectYards + humidityEffectYards;
    const adjustedDistanceYards = Math.round(targetInYards + totalAdjustmentYards);

    // Find the right club from user's bag (clubs are in yards)
    let selectedClub = '7-Iron';

    if (clubs.length > 0) {
      const sortedClubs = [...clubs].sort((a, b) => a.normalYardage - b.normalYardage);
      for (const c of sortedClubs) {
        if (c.normalYardage >= adjustedDistanceYards) {
          selectedClub = c.name;
          break;
        }
      }
    }

    // Convert results back to user's unit for display
    const isMetric = settings.distanceUnit === 'meters';
    const playsLike = isMetric
      ? Math.round(convertDistance(adjustedDistanceYards, 'meters'))
      : adjustedDistanceYards;
    const tempEffect = isMetric
      ? Math.round(convertDistance(tempEffectYards, 'meters'))
      : Math.round(tempEffectYards);
    const altitudeEffect = isMetric
      ? Math.round(convertDistance(altitudeEffectYards, 'meters'))
      : Math.round(altitudeEffectYards);
    const humidityEffect = isMetric
      ? Math.round(convertDistance(humidityEffectYards, 'meters'))
      : Math.round(humidityEffectYards);
    const totalAdjustment = isMetric
      ? Math.round(convertDistance(totalAdjustmentYards, 'meters'))
      : Math.round(totalAdjustmentYards);

    return {
      playsLike,
      club: selectedClub,
      tempEffect,
      altitudeEffect,
      humidityEffect,
      totalAdjustment,
    };
  }, [targetDistance, environmental.conditions, clubs, settings.distanceUnit, convertDistance]);

  // Handlers
  const handlePresetSelect = useCallback((preset: { id: string; distance: number }) => {
    setSelectedPreset(preset.id);
    setTargetDistance(preset.distance);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animate result
    resultScale.value = withSequence(
      withSpring(1.02, { damping: 10 }),
      withSpring(1, { damping: 15 })
    );
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (environmental.forceRefresh) {
      await environmental.forceRefresh();
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsRefreshing(false);
  }, [environmental.forceRefresh]);

  const resultAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resultScale.value }],
  }));

  // Get display values for conditions
  const temperatureDisplay = convertTemperatureForDisplay(
    environmental.conditions?.temperature || 72,
    settings.temperatureUnit
  );
  const altitudeDisplay = convertAltitudeForDisplay(
    environmental.conditions?.altitude || 0,
    settings.distanceUnit
  );

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
          <Text style={[styles.title, { color: colors.textPrimary }]}>Shot Calculator</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Environmental adjustments</Text>
        </Animated.View>

        {/* Conditions Bar - NO WIND (that's premium) */}
        <Animated.View entering={FadeIn.delay(100)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.conditionsScroll}
            contentContainerStyle={styles.conditionsContainer}
          >
            <MetricPill
              icon={<Thermometer size={14} color={colors.textMuted} />}
              label="Temp"
              value={`${temperatureDisplay}${tempUnit}`}
            />
            <MetricPill
              icon={<Mountain size={14} color={colors.textMuted} />}
              label="Altitude"
              value={`${altitudeDisplay} ${altUnit}`}
            />
            <MetricPill
              icon={<Droplets size={14} color={colors.textMuted} />}
              label="Humidity"
              value={`${Math.round(environmental.conditions?.humidity || 50)}%`}
            />
            <MetricPill
              icon={<Gauge size={14} color={colors.textMuted} />}
              label="Density"
              value={`${(environmental.conditions?.density || 1.225).toFixed(3)} kg/m³`}
            />
          </ScrollView>
        </Animated.View>

        {/* Distance Input with Slider */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.sliderSection}>
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
        <Animated.View entering={FadeInDown.delay(300)} style={styles.presetsSection}>
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

        {/* Result Card */}
        <Animated.View entering={FadeInDown.delay(400)} style={resultAnimatedStyle}>
          <ResultCard
            primaryLabel="Plays like"
            primaryValue={calculationResult.playsLike.toString()}
            primaryUnit={unit}
            secondaryLabel="Club"
            secondaryValue={calculationResult.club}
            tertiaryLabel="Adjustment"
            tertiaryValue={`${calculationResult.totalAdjustment > 0 ? '+' : ''}${Math.round(calculationResult.totalAdjustment)} ${unit}`}
            tertiaryStatus={calculationResult.totalAdjustment > 0 ? 'negative' : calculationResult.totalAdjustment < 0 ? 'positive' : 'neutral'}
            variant="highlighted"
            style={styles.resultCard}
          />
        </Animated.View>

        {/* Adjustments Breakdown - Environment only */}
        {Math.abs(calculationResult.totalAdjustment) > 0.5 && (
          <Animated.View
            entering={FadeInDown.delay(450)}
            style={[styles.adjustmentsCard, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.adjustmentsTitle, { color: colors.textMuted }]}>
              ENVIRONMENTAL EFFECTS
            </Text>
            <View style={styles.adjustmentRow}>
              <Text style={[styles.adjustmentLabel, { color: colors.textSecondary }]}>
                Temperature ({temperatureDisplay}{tempUnit})
              </Text>
              <Text
                style={[
                  styles.adjustmentValue,
                  {
                    color:
                      calculationResult.tempEffect > 0
                        ? colors.error
                        : calculationResult.tempEffect < 0
                        ? colors.success
                        : colors.textPrimary,
                  },
                ]}
              >
                {calculationResult.tempEffect > 0 ? '+' : ''}
                {calculationResult.tempEffect} {unit}
              </Text>
            </View>
            <View style={styles.adjustmentRow}>
              <Text style={[styles.adjustmentLabel, { color: colors.textSecondary }]}>
                Altitude ({altitudeDisplay} {altUnit})
              </Text>
              <Text
                style={[
                  styles.adjustmentValue,
                  {
                    color:
                      calculationResult.altitudeEffect > 0
                        ? colors.error
                        : calculationResult.altitudeEffect < 0
                        ? colors.success
                        : colors.textPrimary,
                  },
                ]}
              >
                {calculationResult.altitudeEffect > 0 ? '+' : ''}
                {calculationResult.altitudeEffect} {unit}
              </Text>
            </View>
            <View style={styles.adjustmentRow}>
              <Text style={[styles.adjustmentLabel, { color: colors.textSecondary }]}>
                Humidity ({Math.round(environmental.conditions?.humidity || 50)}%)
              </Text>
              <Text
                style={[
                  styles.adjustmentValue,
                  {
                    color:
                      calculationResult.humidityEffect > 0
                        ? colors.error
                        : calculationResult.humidityEffect < 0
                        ? colors.success
                        : colors.textPrimary,
                  },
                ]}
              >
                {calculationResult.humidityEffect > 0 ? '+' : ''}
                {calculationResult.humidityEffect} {unit}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Info Note */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <Text style={[styles.infoNote, { color: colors.textMuted }]}>
            Use the Wind tab for wind-adjusted calculations with compass heading.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
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
    marginBottom: 24,
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

  // Slider Section
  sliderSection: {
    marginBottom: 16,
    paddingHorizontal: 4,
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

  adjustmentLabel: {
    fontSize: 15,
  },

  adjustmentValue: {
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  // Info Note
  infoNote: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
