import { GlassCard } from '@/src/core/components/ui/GlassCard';
import { Slider } from '@/src/core/components/ui/slider';
import { SkeletonScreen } from '@/src/core/components/ui/Skeleton';
import { useAccessibleAnimations } from '@/src/hooks/useAccessibility';
import { useEnhancedEnvironmental } from '@/src/providers/EnhancedEnvironmentalProvider';
import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import { safeScaledFontSize, getScrollPadding } from '@/src/utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  ArrowDown,
  ArrowUp,
  Droplets,
  Gauge,
  Mountain,
  Target,
  Thermometer,
} from 'lucide-react-native';
import * as React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../../../src/core/context/settings';
import { useShotCalc } from '../../../src/core/context/shotcalc';
import { SkillLevel, YardageModelEnhanced } from '../../../src/core/models/YardageModel';
import { useClubSettings } from '../../../src/features/settings/context/clubs';
import { normalizeClubName } from '../../../src/features/settings/utils/club-mapping';

const convertDistance = (value: number, unit: 'meters' | 'yards'): number => {
  return unit === 'meters' ? value * 0.9144 : value;
};

export default function ShotCalculatorScreen() {
  const { conditions } = useEnhancedEnvironmental();
  const { getRecommendedClub } = useClubSettings();
  const { settings, formatDistance, formatTemperature, formatAltitude } = useSettings();
  const { setShotCalcData } = useShotCalc();
  const tokens = useTokens();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark' || mode === 'system';
  const insets = useSafeAreaInsets();
  const { headerEntering, cardEntering } = useAccessibleAnimations();
  const [targetYardage, setTargetYardage] = React.useState(150);
  const [lastUpdate, setLastUpdate] = React.useState<number | null>(null);
  const [yardageModel] = React.useState(() => new YardageModelEnhanced());

  const padding = getScrollPadding(16, { minPadding: 12, maxPadding: 20 });

  const calculateShot = React.useCallback(() => {
    if (!conditions) return null;

    const recommendedClub = getRecommendedClub(targetYardage);
    if (!recommendedClub) return null;

    try {
      const clubKey = normalizeClubName(recommendedClub.name);
      if (!yardageModel.clubExists(clubKey)) return null;
      if (!yardageModel.setBallModel) return null;

      yardageModel.setBallModel('tour_premium');
      yardageModel.setConditions(
        conditions.temperature,
        conditions.altitude,
        0,
        0,
        conditions.pressure,
        conditions.humidity
      );

      const result = yardageModel.calculateAdjustedYardage(
        targetYardage,
        SkillLevel.PROFESSIONAL,
        clubKey
      );

      if (!result) return null;

      return { result, recommendedClub };
    } catch {
      return null;
    }
  }, [conditions, targetYardage, getRecommendedClub, yardageModel]);

  const shotData = React.useMemo(() => calculateShot(), [calculateShot]);

  // Track previous shot data to detect new calculations
  const prevShotDataRef = React.useRef<typeof shotData>(null);

  React.useEffect(() => {
    const now = Date.now();
    if (lastUpdate && now - lastUpdate < 100) return;

    if (conditions && shotData) {
      // Provide success haptic feedback when new calculation is ready
      if (prevShotDataRef.current?.result.carryDistance !== shotData.result.carryDistance) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      prevShotDataRef.current = shotData;

      setLastUpdate(now);
      setShotCalcData({
        targetYardage,
        elevation: conditions.altitude,
        temperature: conditions.temperature,
        humidity: conditions.humidity,
        pressure: conditions.pressure,
        adjustedDistance: shotData.result.carryDistance,
      });
    }
  }, [conditions, shotData, targetYardage, setShotCalcData, lastUpdate]);

  if (!conditions) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: tokens.colors.background, paddingTop: insets.top + 16 }]}>
        <SkeletonScreen showHero={true} cardCount={1} />
      </View>
    );
  }

  const formatAdjustment = (yards: number) => {
    const value =
      settings.distanceUnit === 'meters'
        ? convertDistance(Math.abs(yards), 'meters')
        : Math.abs(yards);

    return `${yards >= 0 ? '+' : '-'}${Math.round(value)} ${
      settings.distanceUnit === 'yards' ? 'yds' : 'm'
    }`;
  };

  // Calculate total adjustment
  const totalAdjustment = shotData
    ? shotData.result.carryDistance - targetYardage
    : 0;
  const isPositive = totalAdjustment >= 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: tokens.colors.background }]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top + 16, paddingHorizontal: padding },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={headerEntering}>
        <Text style={[styles.title, { color: tokens.colors.textPrimary }]}>Shot Calculator</Text>
        <Text style={[styles.subtitle, { color: tokens.colors.textMuted }]}>
          Environmental shot adjustments
        </Text>
      </Animated.View>

      {/* Conditions Row */}
      <Animated.View entering={cardEntering(0)}>
        <GlassCard style={styles.conditionsCard}>
          <View style={styles.conditionsRow}>
            <ConditionChip
              icon={<Gauge size={14} color={tokens.colors.brandAlt} />}
              value={conditions?.density?.toFixed(3) ?? 'N/A'}
              tokens={tokens}
            />
            <ConditionChip
              icon={<Mountain size={14} color={tokens.colors.brandAlt} />}
              value={formatAltitude(conditions.altitude)}
              tokens={tokens}
            />
            <ConditionChip
              icon={<Thermometer size={14} color={tokens.colors.brandAlt} />}
              value={formatTemperature(conditions.temperature)}
              tokens={tokens}
            />
            <ConditionChip
              icon={<Droplets size={14} color={tokens.colors.brandAlt} />}
              value={`${conditions.humidity.toFixed(0)}%`}
              tokens={tokens}
            />
          </View>
        </GlassCard>
      </Animated.View>

      {/* Target Distance Slider */}
      <Animated.View entering={cardEntering(1)}>
        <GlassCard style={styles.sliderCard}>
          <Slider
            label="Target Distance"
            value={targetYardage}
            onValueChange={setTargetYardage}
            min={settings.distanceUnit === 'yards' ? 50 : 45}
            max={settings.distanceUnit === 'yards' ? 360 : 330}
            step={1}
            unit={settings.distanceUnit === 'yards' ? 'yds' : 'm'}
          />
        </GlassCard>
      </Animated.View>

      {/* Shot Adjustment Result */}
      {shotData && (
        <Animated.View entering={cardEntering(2)}>
          <GlassCard gradient glow style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View
                style={[
                  styles.adjustmentIndicator,
                  {
                    backgroundColor: isPositive
                      ? `${tokens.colors.danger}20`
                      : `${tokens.colors.success}20`,
                  },
                ]}
              >
                {isPositive ? (
                  <ArrowUp size={20} color={tokens.colors.danger} />
                ) : (
                  <ArrowDown size={20} color={tokens.colors.success} />
                )}
              </View>
              <View style={styles.adjustmentText}>
                <Text style={[styles.adjustmentLabel, { color: tokens.colors.textMuted }]}>
                  Shot Adjustment
                </Text>
                <Text
                  style={[
                    styles.adjustmentValue,
                    { color: isPositive ? tokens.colors.danger : tokens.colors.success },
                  ]}
                >
                  {formatAdjustment(totalAdjustment)}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: tokens.colors.border }]} />

            <View style={styles.playsLikeContainer}>
              <Text style={[styles.playsLikeLabel, { color: tokens.colors.textMuted }]}>
                Plays Like
              </Text>
              <View style={styles.playsLikeValueRow}>
                <Text style={[styles.playsLikeValue, { color: tokens.colors.textPrimary }]}>
                  {Math.round(shotData.result.carryDistance)}
                </Text>
                <Text style={[styles.playsLikeUnit, { color: tokens.colors.textMuted }]}>
                  {settings.distanceUnit === 'yards' ? 'yds' : 'm'}
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      )}

      {/* Club Recommendation */}
      {shotData?.recommendedClub && (
        <Animated.View entering={cardEntering(3)}>
          <GlassCard accent style={styles.clubCard}>
            <View style={styles.clubHeader}>
              <Target size={20} color={tokens.colors.brand} />
              <Text style={[styles.clubLabel, { color: tokens.colors.textMuted }]}>
                Recommended Club
              </Text>
            </View>
            <Text style={[styles.clubName, { color: tokens.colors.textPrimary }]}>
              {shotData.recommendedClub.name}
            </Text>
            <Text style={[styles.clubRange, { color: tokens.colors.textMuted }]}>
              {Math.round(shotData.recommendedClub.normalYardage * 0.9)} - {Math.round(shotData.recommendedClub.normalYardage * 1.1)} yds
            </Text>
          </GlassCard>
        </Animated.View>
      )}
    </ScrollView>
  );
}

interface ConditionChipProps {
  icon: React.ReactNode;
  value: string;
  tokens: ReturnType<typeof useTokens>;
}

const ConditionChip = React.memo<ConditionChipProps>(({ icon, value, tokens }) => (
  <View
    style={[styles.conditionChip, { backgroundColor: tokens.colors.surfaceAlt }]}
    accessible
    accessibilityLabel={`${value}`}
  >
    {icon}
    <Text style={[styles.conditionChipText, { color: tokens.colors.textPrimary }]}>{value}</Text>
  </View>
));

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    padding: 32,
  },
  loadingPulse: {
    borderRadius: 12,
    marginBottom: 16,
    height: 32,
  },
  title: {
    fontSize: safeScaledFontSize(32),
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: safeScaledFontSize(15),
    fontWeight: '500',
    marginBottom: 24,
  },
  conditionsCard: {
    marginBottom: 16,
  },
  conditionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  conditionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  conditionChipText: {
    fontSize: safeScaledFontSize(13),
    fontWeight: '600',
  },
  sliderCard: {
    marginBottom: 16,
  },
  resultCard: {
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adjustmentIndicator: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustmentText: {
    flex: 1,
  },
  adjustmentLabel: {
    fontSize: safeScaledFontSize(13),
    fontWeight: '500',
    marginBottom: 2,
  },
  adjustmentValue: {
    fontSize: safeScaledFontSize(24),
    fontWeight: '700',
    ...Platform.select({
      ios: { fontFamily: 'Menlo' },
      android: { fontFamily: 'monospace' },
    }),
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  playsLikeContainer: {
    alignItems: 'center',
  },
  playsLikeLabel: {
    fontSize: safeScaledFontSize(14),
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  playsLikeValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  playsLikeValue: {
    fontSize: safeScaledFontSize(56),
    fontWeight: '800',
    letterSpacing: -2,
    ...Platform.select({
      ios: { fontFamily: 'Menlo' },
      android: { fontFamily: 'monospace' },
    }),
  },
  playsLikeUnit: {
    fontSize: safeScaledFontSize(18),
    fontWeight: '500',
    marginLeft: 4,
  },
  clubCard: {
    marginBottom: 16,
  },
  clubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  clubLabel: {
    fontSize: safeScaledFontSize(13),
    fontWeight: '500',
  },
  clubName: {
    fontSize: safeScaledFontSize(22),
    fontWeight: '700',
    marginBottom: 4,
  },
  clubRange: {
    fontSize: safeScaledFontSize(14),
    fontWeight: '500',
  },
});
