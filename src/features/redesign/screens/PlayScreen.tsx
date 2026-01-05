/**
 * PlayScreen - Unified Shot Calculator
 *
 * The primary screen of the redesigned app. Combines:
 * - Shot calculation
 * - Wind analysis
 * - Quick presets
 * - Voice input (future)
 *
 * Design Philosophy:
 * "Ask and answer" - User inputs target, app answers with recommendation.
 * Everything needed for a shot decision on ONE screen.
 */

import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Wind, Target, Thermometer, Droplets, Mountain, ChevronRight } from 'lucide-react-native';

import { useRedesignTheme } from '@/src/theme/redesign';
import { ResultCard } from '@/src/components/redesign/ResultCard';
import { QuickAction } from '@/src/components/redesign/QuickAction';
import { MetricPill } from '@/src/components/redesign/MetricPill';
import { useSettings } from '@/src/core/context/settings';
import { useEnhancedEnvironmental } from '@/src/providers/EnhancedEnvironmentalProvider';

// =============================================================================
// TYPES
// =============================================================================

interface QuickPreset {
  id: string;
  label: string;
  distance: number;
  description?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const QUICK_PRESETS: QuickPreset[] = [
  { id: 'approach-150', label: '150', distance: 150, description: 'Approach' },
  { id: 'approach-125', label: '125', distance: 125, description: 'Short' },
  { id: 'approach-175', label: '175', distance: 175, description: 'Long' },
  { id: 'approach-200', label: '200', distance: 200, description: 'Fairway' },
];

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Distance Input Section
 */
const DistanceInput = memo(function DistanceInput({
  value,
  onChange,
  unit,
}: {
  value: number;
  onChange: (value: number) => void;
  unit: string;
}) {
  const { colors, tokens } = useRedesignTheme();
  const [inputValue, setInputValue] = useState(value.toString());

  return (
    <View style={styles.distanceInputContainer}>
      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
        TARGET DISTANCE
      </Text>
      <View style={styles.distanceRow}>
        <Pressable
          onPress={() => {
            const newValue = Math.max(50, value - 10);
            onChange(newValue);
            setInputValue(newValue.toString());
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={[styles.adjustButton, { backgroundColor: colors.surface }]}
          accessibilityLabel="Decrease distance by 10"
        >
          <Text style={[styles.adjustButtonText, { color: colors.textPrimary }]}>
            -10
          </Text>
        </Pressable>

        <View style={styles.distanceValueContainer}>
          <Text
            style={[styles.distanceValue, { color: colors.textPrimary }]}
            accessibilityLabel={`${value} ${unit}`}
          >
            {value}
          </Text>
          <Text style={[styles.distanceUnit, { color: colors.textMuted }]}>
            {unit}
          </Text>
        </View>

        <Pressable
          onPress={() => {
            const newValue = Math.min(350, value + 10);
            onChange(newValue);
            setInputValue(newValue.toString());
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={[styles.adjustButton, { backgroundColor: colors.surface }]}
          accessibilityLabel="Increase distance by 10"
        >
          <Text style={[styles.adjustButtonText, { color: colors.textPrimary }]}>
            +10
          </Text>
        </Pressable>
      </View>
    </View>
  );
});

/**
 * Quick Presets Row
 */
const QuickPresets = memo(function QuickPresets({
  presets,
  selectedId,
  onSelect,
  unit,
}: {
  presets: QuickPreset[];
  selectedId: string | null;
  onSelect: (preset: QuickPreset) => void;
  unit: string;
}) {
  const { colors } = useRedesignTheme();

  return (
    <View style={styles.presetsContainer}>
      <Text style={[styles.presetsLabel, { color: colors.textMuted }]}>
        QUICK SELECT
      </Text>
      <View style={styles.presetsRow}>
        {presets.map((preset) => (
          <QuickAction
            key={preset.id}
            label={preset.label}
            sublabel={unit}
            variant="secondary"
            selected={selectedId === preset.id}
            onPress={() => onSelect(preset)}
            style={styles.presetButton}
          />
        ))}
      </View>
    </View>
  );
});

/**
 * Conditions Bar
 */
const ConditionsBar = memo(function ConditionsBar({
  windSpeed,
  windDirection,
  temperature,
  humidity,
  altitude,
}: {
  windSpeed: number;
  windDirection: string;
  temperature: number;
  humidity: number;
  altitude: number;
}) {
  const { colors } = useRedesignTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.conditionsScroll}
      contentContainerStyle={styles.conditionsContainer}
    >
      <MetricPill
        icon={<Wind size={14} color={colors.textMuted} />}
        label="Wind"
        value={`${windSpeed} mph ${windDirection}`}
        status={windSpeed > 15 ? 'warning' : 'neutral'}
      />
      <MetricPill
        icon={<Thermometer size={14} color={colors.textMuted} />}
        label="Temp"
        value={`${temperature}°F`}
      />
      <MetricPill
        icon={<Droplets size={14} color={colors.textMuted} />}
        label="Humidity"
        value={`${humidity}%`}
      />
      <MetricPill
        icon={<Mountain size={14} color={colors.textMuted} />}
        label="Altitude"
        value={`${altitude} ft`}
      />
    </ScrollView>
  );
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PlayScreen() {
  const { colors, tokens, isDark } = useRedesignTheme();
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();

  // Environmental data
  const environmental = useEnhancedEnvironmental();

  // State
  const [targetDistance, setTargetDistance] = useState(150);
  const [selectedPreset, setSelectedPreset] = useState<string | null>('approach-150');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(true);

  // Mock calculation result (replace with actual calculator)
  const calculationResult = useMemo(() => {
    // This would be replaced with actual wind/shot calculation
    const windAdjustment = (environmental.current?.windSpeed || 0) * 0.8;
    const tempAdjustment = ((environmental.current?.temperature || 70) - 70) * 0.1;
    const altitudeAdjustment = ((environmental.current?.altitude || 0) / 1000) * 2;

    const adjustedDistance = Math.round(
      targetDistance + windAdjustment + tempAdjustment + altitudeAdjustment
    );

    // Mock club selection
    const clubs = [
      { name: 'PW', max: 130 },
      { name: '9-Iron', max: 145 },
      { name: '8-Iron', max: 160 },
      { name: '7-Iron', max: 175 },
      { name: '6-Iron', max: 190 },
      { name: '5-Iron', max: 205 },
      { name: '4-Iron', max: 220 },
      { name: 'Hybrid', max: 235 },
      { name: '3-Wood', max: 260 },
      { name: 'Driver', max: 300 },
    ];

    const club = clubs.find((c) => c.max >= adjustedDistance) || clubs[clubs.length - 1];

    // Wind aim adjustment
    const aimAdjustment = Math.round((environmental.current?.windSpeed || 0) * 0.6);
    const aimDirection = (environmental.current?.windDirection || 0) > 180 ? 'right' : 'left';

    return {
      playsLike: adjustedDistance,
      club: club.name,
      aimAdjustment: aimAdjustment > 0 ? `${aimAdjustment} yds ${aimDirection}` : 'Straight',
    };
  }, [targetDistance, environmental.current]);

  // Handlers
  const handlePresetSelect = useCallback((preset: QuickPreset) => {
    setSelectedPreset(preset.id);
    setTargetDistance(preset.distance);
    setHasCalculated(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleDistanceChange = useCallback((value: number) => {
    setTargetDistance(value);
    setSelectedPreset(null);
    setHasCalculated(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Refresh environmental data
    if (environmental.refresh) {
      await environmental.refresh();
    }
    setIsRefreshing(false);
  }, [environmental]);

  const unit = settings.distanceUnit === 'meters' ? 'm' : 'yds';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
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
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Your Shot
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Conditions Bar */}
        <Animated.View entering={FadeIn.delay(100)}>
          <ConditionsBar
            windSpeed={Math.round(environmental.current?.windSpeed || 0)}
            windDirection={getWindDirectionLabel(environmental.current?.windDirection || 0)}
            temperature={Math.round(environmental.current?.temperature || 72)}
            humidity={Math.round(environmental.current?.humidity || 50)}
            altitude={Math.round(environmental.current?.altitude || 0)}
          />
        </Animated.View>

        {/* Distance Input */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <DistanceInput
            value={targetDistance}
            onChange={handleDistanceChange}
            unit={unit}
          />
        </Animated.View>

        {/* Quick Presets */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <QuickPresets
            presets={QUICK_PRESETS}
            selectedId={selectedPreset}
            onSelect={handlePresetSelect}
            unit={unit}
          />
        </Animated.View>

        {/* Result Card */}
        {hasCalculated && (
          <Animated.View entering={FadeInDown.delay(400)}>
            <ResultCard
              primaryLabel="Plays like"
              primaryValue={calculationResult.playsLike.toString()}
              primaryUnit={unit}
              secondaryLabel="Club"
              secondaryValue={calculationResult.club}
              tertiaryLabel="Aim"
              tertiaryValue={calculationResult.aimAdjustment}
              variant="highlighted"
              style={styles.resultCard}
            />
          </Animated.View>
        )}

        {/* Wind Details (expandable) */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <Pressable
            style={[styles.windDetails, { backgroundColor: colors.surface }]}
            accessibilityRole="button"
            accessibilityLabel="View wind analysis details"
          >
            <View style={styles.windDetailsLeft}>
              <Wind size={20} color={colors.brand} />
              <View style={styles.windDetailsText}>
                <Text style={[styles.windDetailsTitle, { color: colors.textPrimary }]}>
                  Wind Analysis
                </Text>
                <Text style={[styles.windDetailsSubtitle, { color: colors.textMuted }]}>
                  {Math.round(environmental.current?.windSpeed || 0)} mph from{' '}
                  {getWindDirectionLabel(environmental.current?.windDirection || 0)}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textMuted} />
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function getWindDirectionLabel(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
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

  // Distance Input
  distanceInputContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
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
  presetsContainer: {
    marginBottom: 24,
  },

  presetsLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
  },

  presetsRow: {
    flexDirection: 'row',
    gap: 10,
  },

  presetButton: {
    flex: 1,
  },

  // Result
  resultCard: {
    marginBottom: 16,
  },

  // Wind Details
  windDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
  },

  windDetailsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  windDetailsText: {
    gap: 2,
  },

  windDetailsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },

  windDetailsSubtitle: {
    fontSize: 14,
  },
});

export default PlayScreen;
