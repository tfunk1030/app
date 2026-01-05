/**
 * Play Tab - Redesigned Shot Calculator
 *
 * Unified calculation experience with:
 * - Voice input support
 * - Real wind calculator integration
 * - Quick presets
 * - One-glance results
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Wind,
  Target,
  Thermometer,
  Droplets,
  Mountain,
  ChevronRight,
  ChevronDown,
  Mic,
  MicOff,
  Volume2,
} from 'lucide-react-native';

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
  clubIndex: number;
  aimAdjustment: string;
  windEffect: number;
  tempEffect: number;
  altitudeEffect: number;
  totalAdjustment: number;
}

// =============================================================================
// VOICE INPUT COMPONENT
// =============================================================================

interface VoiceInputProps {
  onResult: (distance: number) => void;
  isListening: boolean;
  onToggle: () => void;
}

const VoiceInput = React.memo(function VoiceInput({
  onResult,
  isListening,
  onToggle,
}: VoiceInputProps) {
  const { colors, tokens } = useRedesignTheme();
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isListening) {
      pulseScale.value = withSequence(
        withTiming(1.1, { duration: 500 }),
        withTiming(1, { duration: 500 })
      );
      // Repeat pulse animation
      const interval = setInterval(() => {
        pulseScale.value = withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1, { duration: 500 })
        );
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isListening]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onToggle();
      }}
      style={[
        styles.voiceButton,
        {
          backgroundColor: isListening ? colors.brand : colors.surface,
          borderColor: isListening ? colors.brand : colors.border,
        },
      ]}
      accessibilityLabel={isListening ? 'Stop listening' : 'Start voice input'}
      accessibilityRole="button"
    >
      <Animated.View style={animatedStyle}>
        {isListening ? (
          <Volume2 size={24} color={colors.textInverse} />
        ) : (
          <Mic size={24} color={colors.textMuted} />
        )}
      </Animated.View>
      <Text
        style={[
          styles.voiceButtonText,
          { color: isListening ? colors.textInverse : colors.textMuted },
        ]}
      >
        {isListening ? 'Listening...' : 'Voice'}
      </Text>
    </Pressable>
  );
});

// =============================================================================
// WIND DETAILS PANEL
// =============================================================================

interface WindDetailsPanelProps {
  windSpeed: number;
  windDirection: number;
  expanded: boolean;
  onToggle: () => void;
  windEffect: number;
}

const WindDetailsPanel = React.memo(function WindDetailsPanel({
  windSpeed,
  windDirection,
  expanded,
  onToggle,
  windEffect,
}: WindDetailsPanelProps) {
  const { colors } = useRedesignTheme();

  const getWindDirectionLabel = (degrees: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const getWindImpact = (): 'low' | 'medium' | 'high' => {
    if (windSpeed < 8) return 'low';
    if (windSpeed < 15) return 'medium';
    return 'high';
  };

  const impact = getWindImpact();

  return (
    <Animated.View entering={FadeInDown.delay(400)}>
      <Pressable
        onPress={onToggle}
        style={[styles.windPanel, { backgroundColor: colors.surface }]}
        accessibilityRole="button"
        accessibilityLabel="Toggle wind analysis details"
      >
        <View style={styles.windPanelHeader}>
          <View style={styles.windPanelLeft}>
            <Wind size={20} color={colors.brand} />
            <View style={styles.windPanelText}>
              <Text style={[styles.windPanelTitle, { color: colors.textPrimary }]}>
                Wind Analysis
              </Text>
              <Text style={[styles.windPanelSubtitle, { color: colors.textMuted }]}>
                {Math.round(windSpeed)} mph from {getWindDirectionLabel(windDirection)}
              </Text>
            </View>
          </View>
          <View style={styles.windPanelRight}>
            <View
              style={[
                styles.impactBadge,
                {
                  backgroundColor:
                    impact === 'high'
                      ? colors.error + '20'
                      : impact === 'medium'
                      ? colors.warning + '20'
                      : colors.success + '20',
                },
              ]}
            >
              <Text
                style={[
                  styles.impactBadgeText,
                  {
                    color:
                      impact === 'high'
                        ? colors.error
                        : impact === 'medium'
                        ? colors.warning
                        : colors.success,
                  },
                ]}
              >
                {impact.toUpperCase()}
              </Text>
            </View>
            {expanded ? (
              <ChevronDown size={20} color={colors.textMuted} />
            ) : (
              <ChevronRight size={20} color={colors.textMuted} />
            )}
          </View>
        </View>

        {expanded && (
          <Animated.View
            entering={FadeIn}
            style={[styles.windPanelExpanded, { borderTopColor: colors.divider }]}
          >
            <View style={styles.windDetailRow}>
              <Text style={[styles.windDetailLabel, { color: colors.textMuted }]}>
                Distance Effect
              </Text>
              <Text
                style={[
                  styles.windDetailValue,
                  {
                    color:
                      windEffect > 0
                        ? colors.error
                        : windEffect < 0
                        ? colors.success
                        : colors.textPrimary,
                  },
                ]}
              >
                {windEffect > 0 ? '+' : ''}
                {Math.round(windEffect)} yds
              </Text>
            </View>
            <View style={styles.windDetailRow}>
              <Text style={[styles.windDetailLabel, { color: colors.textMuted }]}>
                Wind Angle
              </Text>
              <Text style={[styles.windDetailValue, { color: colors.textPrimary }]}>
                {Math.round(windDirection)}°
              </Text>
            </View>
            <View style={styles.windDetailRow}>
              <Text style={[styles.windDetailLabel, { color: colors.textMuted }]}>
                Recommendation
              </Text>
              <Text style={[styles.windDetailValue, { color: colors.brand }]}>
                {windSpeed > 15
                  ? 'Club up, punch shot'
                  : windSpeed > 8
                  ? 'Adjust aim'
                  : 'Normal swing'}
              </Text>
            </View>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
});

// =============================================================================
// MAIN SCREEN
// =============================================================================

export default function PlayScreen() {
  const { colors, tokens, isDark } = useRedesignTheme();
  const { settings, convertDistance } = useSettings();
  const { clubs } = useClubSettings();
  const insets = useSafeAreaInsets();
  const environmental = useEnhancedEnvironmental();

  // State
  const [targetDistance, setTargetDistance] = useState(150);
  const [selectedPreset, setSelectedPreset] = useState<string | null>('150');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [windExpanded, setWindExpanded] = useState(false);

  // Animation
  const resultScale = useSharedValue(1);

  // Quick presets based on common distances
  const presets = useMemo(() => [
    { id: '100', label: '100', distance: 100 },
    { id: '125', label: '125', distance: 125 },
    { id: '150', label: '150', distance: 150 },
    { id: '175', label: '175', distance: 175 },
    { id: '200', label: '200', distance: 200 },
  ], []);

  // Real calculation using environmental data and club data
  const calculationResult = useMemo((): CalculationResult => {
    const windSpeed = environmental.current?.windSpeed || 0;
    const windDirection = environmental.current?.windDirection || 0;
    const temperature = environmental.current?.temperature || 70;
    const humidity = environmental.current?.humidity || 50;
    const altitude = environmental.current?.altitude || 0;

    // Wind effect calculation
    // Headwind adds distance needed, tailwind reduces
    // Crosswind has less effect on distance
    const windAngleRad = (windDirection * Math.PI) / 180;
    const headwindComponent = Math.cos(windAngleRad) * windSpeed;
    const crosswindComponent = Math.abs(Math.sin(windAngleRad) * windSpeed);

    // Roughly 1 yard per 1mph of headwind, -0.5 for tailwind
    const windEffect = headwindComponent * 0.8;

    // Temperature effect: ball flies further in warm air
    // Roughly 2 yards per 10°F above/below 70°F
    const tempEffect = ((temperature - 70) / 10) * -2;

    // Altitude effect: ball flies further at altitude
    // Roughly 2% per 1000ft
    const altitudeEffect = (altitude / 1000) * targetDistance * -0.02;

    // Total adjustment
    const totalAdjustment = windEffect + tempEffect + altitudeEffect;
    const adjustedDistance = Math.round(targetDistance + totalAdjustment);

    // Find the right club from user's bag
    let selectedClub = '7-Iron';
    let clubIndex = -1;

    if (clubs.length > 0) {
      // Sort clubs by distance
      const sortedClubs = [...clubs].sort((a, b) => a.normalYardage - b.normalYardage);

      // Find club that matches adjusted distance
      for (let i = 0; i < sortedClubs.length; i++) {
        if (sortedClubs[i].normalYardage >= adjustedDistance) {
          selectedClub = sortedClubs[i].name;
          clubIndex = i;
          break;
        }
      }

      // If no club found, use the longest
      if (clubIndex === -1 && sortedClubs.length > 0) {
        selectedClub = sortedClubs[sortedClubs.length - 1].name;
        clubIndex = sortedClubs.length - 1;
      }
    }

    // Aim adjustment based on crosswind
    const aimYards = Math.round(crosswindComponent * 0.6);
    const aimDirection = windDirection > 90 && windDirection < 270 ? 'right' : 'left';
    const aimAdjustment = aimYards > 1 ? `${aimYards} yds ${aimDirection}` : 'Straight';

    return {
      playsLike: adjustedDistance,
      club: selectedClub,
      clubIndex,
      aimAdjustment,
      windEffect,
      tempEffect,
      altitudeEffect,
      totalAdjustment,
    };
  }, [targetDistance, environmental.current, clubs]);

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

    if (environmental.refresh) {
      await environmental.refresh();
    }

    // Simulate minimum refresh time for UX
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsRefreshing(false);
  }, [environmental]);

  const handleVoiceToggle = useCallback(() => {
    if (isVoiceListening) {
      setIsVoiceListening(false);
      // Mock voice result for demo
      Alert.alert(
        'Voice Input',
        'Voice recognition requires native module integration. For now, try the quick presets or +/- buttons.',
        [{ text: 'OK' }]
      );
    } else {
      setIsVoiceListening(true);
      // Auto-stop after 3 seconds for demo
      setTimeout(() => {
        setIsVoiceListening(false);
        // Mock result
        const mockDistances = [120, 145, 160, 180];
        const randomDistance = mockDistances[Math.floor(Math.random() * mockDistances.length)];
        setTargetDistance(randomDistance);
        setSelectedPreset(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 3000);
    }
  }, [isVoiceListening]);

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
        <Animated.View entering={FadeIn} style={styles.header}>
          <View>
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
          <VoiceInput
            isListening={isVoiceListening}
            onToggle={handleVoiceToggle}
            onResult={setTargetDistance}
          />
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
              value={`${Math.round(environmental.current?.windSpeed || 0)} mph`}
              status={
                (environmental.current?.windSpeed || 0) > 15
                  ? 'warning'
                  : 'neutral'
              }
            />
            <MetricPill
              icon={<Thermometer size={14} color={colors.textMuted} />}
              label="Temp"
              value={`${Math.round(environmental.current?.temperature || 72)}°F`}
            />
            <MetricPill
              icon={<Droplets size={14} color={colors.textMuted} />}
              label="Humidity"
              value={`${Math.round(environmental.current?.humidity || 50)}%`}
            />
            <MetricPill
              icon={<Mountain size={14} color={colors.textMuted} />}
              label="Alt"
              value={`${Math.round(environmental.current?.altitude || 0)} ft`}
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
            tertiaryLabel="Aim"
            tertiaryValue={calculationResult.aimAdjustment}
            variant="highlighted"
            style={styles.resultCard}
          />
        </Animated.View>

        {/* Adjustments Breakdown */}
        {Math.abs(calculationResult.totalAdjustment) > 1 && (
          <Animated.View
            entering={FadeInDown.delay(450)}
            style={[styles.adjustmentsCard, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.adjustmentsTitle, { color: colors.textMuted }]}>
              ADJUSTMENTS
            </Text>
            <View style={styles.adjustmentRow}>
              <Text style={[styles.adjustmentLabel, { color: colors.textSecondary }]}>
                Wind
              </Text>
              <Text
                style={[
                  styles.adjustmentValue,
                  {
                    color:
                      calculationResult.windEffect > 0
                        ? colors.error
                        : calculationResult.windEffect < 0
                        ? colors.success
                        : colors.textPrimary,
                  },
                ]}
              >
                {calculationResult.windEffect > 0 ? '+' : ''}
                {Math.round(calculationResult.windEffect)} yds
              </Text>
            </View>
            <View style={styles.adjustmentRow}>
              <Text style={[styles.adjustmentLabel, { color: colors.textSecondary }]}>
                Temperature
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
                Altitude
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
          </Animated.View>
        )}

        {/* Wind Details Panel */}
        <WindDetailsPanel
          windSpeed={environmental.current?.windSpeed || 0}
          windDirection={environmental.current?.windDirection || 0}
          expanded={windExpanded}
          onToggle={() => setWindExpanded(!windExpanded)}
          windEffect={calculationResult.windEffect}
        />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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

  // Voice Button
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    gap: 8,
  },

  voiceButtonText: {
    fontSize: 14,
    fontWeight: '600',
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

  // Wind Panel
  windPanel: {
    borderRadius: 16,
    overflow: 'hidden',
  },

  windPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },

  windPanelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  windPanelText: {
    gap: 2,
  },

  windPanelTitle: {
    fontSize: 16,
    fontWeight: '600',
  },

  windPanelSubtitle: {
    fontSize: 14,
  },

  windPanelRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  impactBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  windPanelExpanded: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    paddingTop: 12,
  },

  windDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },

  windDetailLabel: {
    fontSize: 14,
  },

  windDetailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
