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
  Pressable,
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
import { useSettings } from '@/src/core/context/settings';
import { useEnhancedEnvironmental } from '@/src/providers/EnhancedEnvironmentalProvider';
import { useClubSettings } from '@/src/features/settings/context/clubs';

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
  const { settings } = useSettings();
  const { clubs } = useClubSettings();
  const environmental = useEnhancedEnvironmental();

  // State
  const [targetDistance, setTargetDistance] = useState(150);
  const [selectedPreset, setSelectedPreset] = useState<string | null>('150');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Animation
  const resultScale = useSharedValue(1);

  // Quick presets
  const presets = useMemo(() => [
    { id: '100', label: '100', distance: 100 },
    { id: '125', label: '125', distance: 125 },
    { id: '150', label: '150', distance: 150 },
    { id: '175', label: '175', distance: 175 },
    { id: '200', label: '200', distance: 200 },
  ], []);

  // FREE calculation - Environment only (NO WIND)
  const calculationResult = useMemo((): CalculationResult => {
    const temperature = environmental.conditions?.temperature || 70;
    const humidity = environmental.conditions?.humidity || 50;
    const altitude = environmental.conditions?.altitude || 0;

    // Temperature effect: ball flies further in warm air
    const tempEffect = ((temperature - 70) / 10) * -2;

    // Altitude effect: ball flies further at altitude
    const altitudeEffect = (altitude / 1000) * targetDistance * -0.02;

    // Humidity effect: humid air is less dense
    const humidityEffect = ((humidity - 50) / 25) * -1;

    // FREE tier: NO wind effect
    const totalAdjustment = tempEffect + altitudeEffect + humidityEffect;
    const adjustedDistance = Math.round(targetDistance + totalAdjustment);

    // Find the right club from user's bag
    let selectedClub = '7-Iron';

    if (clubs.length > 0) {
      const sortedClubs = [...clubs].sort((a, b) => a.normalYardage - b.normalYardage);
      for (const c of sortedClubs) {
        if (c.normalYardage >= adjustedDistance) {
          selectedClub = c.name;
          break;
        }
      }
    }

    return {
      playsLike: adjustedDistance,
      club: selectedClub,
      tempEffect,
      altitudeEffect,
      humidityEffect,
      totalAdjustment,
    };
  }, [targetDistance, environmental.conditions, clubs]);

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

  const handleDistanceChange = useCallback((delta: number) => {
    setTargetDistance((prev) => {
      const newValue = Math.max(50, Math.min(350, prev + delta));
      return newValue;
    });
    setSelectedPreset(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    resultScale.value = withSequence(
      withSpring(1.01, { damping: 15 }),
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
              value={`${Math.round(environmental.conditions?.temperature || 72)}°F`}
            />
            <MetricPill
              icon={<Mountain size={14} color={colors.textMuted} />}
              label="Altitude"
              value={`${Math.round(environmental.conditions?.altitude || 0)} ft`}
            />
            <MetricPill
              icon={<Droplets size={14} color={colors.textMuted} />}
              label="Humidity"
              value={`${Math.round(environmental.conditions?.humidity || 50)}%`}
            />
            <MetricPill
              icon={<Gauge size={14} color={colors.textMuted} />}
              label="Density"
              value={(environmental.conditions?.density || 1.225).toFixed(3)}
            />
          </ScrollView>
        </Animated.View>

        {/* Distance Input */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.distanceSection}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            TARGET DISTANCE
          </Text>
          <View style={styles.distanceRow}>
            <Pressable
              onPress={() => handleDistanceChange(-10)}
              style={[styles.adjustButton, { backgroundColor: colors.surface }]}
              accessibilityLabel="Decrease by 10"
            >
              <Text style={[styles.adjustButtonText, { color: colors.textPrimary }]}>
                -10
              </Text>
            </Pressable>

            <View style={styles.distanceValueContainer}>
              <Text style={[styles.distanceValue, { color: colors.textPrimary }]}>
                {targetDistance}
              </Text>
              <Text style={[styles.distanceUnit, { color: colors.textMuted }]}>
                {unit}
              </Text>
            </View>

            <Pressable
              onPress={() => handleDistanceChange(10)}
              style={[styles.adjustButton, { backgroundColor: colors.surface }]}
              accessibilityLabel="Increase by 10"
            >
              <Text style={[styles.adjustButtonText, { color: colors.textPrimary }]}>
                +10
              </Text>
            </Pressable>
          </View>
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
                Temperature ({Math.round(environmental.conditions?.temperature || 70)}°F)
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
                {Math.round(calculationResult.tempEffect)} yds
              </Text>
            </View>
            <View style={styles.adjustmentRow}>
              <Text style={[styles.adjustmentLabel, { color: colors.textSecondary }]}>
                Altitude ({Math.round(environmental.conditions?.altitude || 0)} ft)
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
                {Math.round(calculationResult.altitudeEffect)} yds
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
                {Math.round(calculationResult.humidityEffect)} yds
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
