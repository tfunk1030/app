import { GlassCard } from '@/src/core/components/ui/GlassCard';
import { Slider } from '@/src/core/components/ui/slider';
import { SkeletonScreen } from '@/src/core/components/ui/Skeleton';
import { useAccessibleAnimations } from '@/src/hooks/useAccessibility';
import { useEnhancedEnvironmental } from '@/src/providers/EnhancedEnvironmentalProvider';
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
import { Platform, ScrollView, Text, View, ViewStyle, TextStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../../../src/core/context/settings';
import { useShotCalc } from '../../../src/core/context/shotcalc';
import { SkillLevel, YardageModelEnhanced } from '../../../src/core/models/YardageModel';
import { useClubSettings } from '../../../src/features/settings/context/clubs';
import { normalizeClubName } from '../../../src/features/settings/utils/club-mapping';
import type { Tokens } from '@/src/theme/tokens';

const convertDistance = (value: number, unit: 'meters' | 'yards'): number => {
  return unit === 'meters' ? value * 0.9144 : value;
};

export default function ShotCalculatorScreen() {
  const { conditions } = useEnhancedEnvironmental();
  const { getRecommendedClub } = useClubSettings();
  const { settings, formatDistance, formatTemperature, formatAltitude } = useSettings();
  const { setShotCalcData } = useShotCalc();
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const { headerEntering, cardEntering } = useAccessibleAnimations();
  const [targetYardage, setTargetYardage] = React.useState(150);
  const [lastUpdate, setLastUpdate] = React.useState<number | null>(null);
  const [yardageModel] = React.useState(() => new YardageModelEnhanced());

  const padding = getScrollPadding(t.spacing.md, { minPadding: t.spacing.base, maxPadding: t.spacing.xl });
  const styles = React.useMemo(() => createStyles(t), [t]);

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
      <View style={[styles.loadingContainer, { backgroundColor: t.colors.background, paddingTop: insets.top + t.spacing.md }]}>
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
      style={[styles.container, { backgroundColor: t.colors.background }]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top + t.spacing.md, paddingHorizontal: padding },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={headerEntering}>
        <Text
          style={[styles.title, { color: t.colors.textPrimary }]}
          accessibilityRole="header"
        >
          Shot Calculator
        </Text>
        <Text style={[styles.subtitle, { color: t.colors.textMuted }]}>
          Environmental shot adjustments
        </Text>
      </Animated.View>

      {/* Conditions Row */}
      <Animated.View entering={cardEntering(0)}>
        <GlassCard style={styles.conditionsCard}>
          <View style={styles.conditionsRow}>
            <ConditionChip
              icon={<Gauge size={t.fontSize.sm} color={t.colors.brandAlt} />}
              value={conditions?.density?.toFixed(3) ?? 'N/A'}
              tokens={t}
            />
            <ConditionChip
              icon={<Mountain size={t.fontSize.sm} color={t.colors.brandAlt} />}
              value={formatAltitude(conditions.altitude)}
              tokens={t}
            />
            <ConditionChip
              icon={<Thermometer size={t.fontSize.sm} color={t.colors.brandAlt} />}
              value={formatTemperature(conditions.temperature)}
              tokens={t}
            />
            <ConditionChip
              icon={<Droplets size={t.fontSize.sm} color={t.colors.brandAlt} />}
              value={`${conditions.humidity.toFixed(0)}%`}
              tokens={t}
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
                      ? t.colors.dangerBackgroundAlpha
                      : t.colors.successBackgroundAlpha,
                  },
                ]}
              >
                {isPositive ? (
                  <ArrowUp size={t.fontSize.xl} color={t.colors.danger} />
                ) : (
                  <ArrowDown size={t.fontSize.xl} color={t.colors.success} />
                )}
              </View>
              <View style={styles.adjustmentText}>
                <Text style={[styles.adjustmentLabel, { color: t.colors.textMuted }]}>
                  Shot Adjustment
                </Text>
                <Text
                  style={[
                    styles.adjustmentValue,
                    { color: isPositive ? t.colors.danger : t.colors.success },
                  ]}
                >
                  {formatAdjustment(totalAdjustment)}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: t.colors.border }]} />

            <View style={styles.playsLikeContainer}>
              <Text style={[styles.playsLikeLabel, { color: t.colors.textMuted }]}>
                Plays Like
              </Text>
              <View style={styles.playsLikeValueRow}>
                <Text style={[styles.playsLikeValue, { color: t.colors.textPrimary }]}>
                  {Math.round(shotData.result.carryDistance)}
                </Text>
                <Text style={[styles.playsLikeUnit, { color: t.colors.textMuted }]}>
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
              <Target size={t.fontSize.xl} color={t.colors.brand} />
              <Text style={[styles.clubLabel, { color: t.colors.textMuted }]}>
                Recommended Club
              </Text>
            </View>
            <Text style={[styles.clubName, { color: t.colors.textPrimary }]}>
              {shotData.recommendedClub.name}
            </Text>
            <Text style={[styles.clubRange, { color: t.colors.textMuted }]}>
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
  tokens: Tokens;
}

const ConditionChip = React.memo<ConditionChipProps>(({ icon, value, tokens: t }) => {
  const chipStyles = React.useMemo(() => ({
    chip: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: t.spacing.xs,
      paddingVertical: t.spacing.sm,
      paddingHorizontal: t.spacing.sm,
      borderRadius: t.borderRadius.md + 2, // 10px - slightly between md (8) and lg (12)
      backgroundColor: t.colors.surfaceAlt,
    } as ViewStyle,
    text: {
      fontSize: safeScaledFontSize(t.fontSize.xs + 1), // 13px - between xs (12) and sm (14)
      fontWeight: t.fontWeight.semibold,
      color: t.colors.textPrimary,
    } as TextStyle,
  }), [t]);

  return (
    <View
      style={chipStyles.chip}
      accessible
      accessibilityLabel={`${value}`}
    >
      {icon}
      <Text style={chipStyles.text}>{value}</Text>
    </View>
  );
});

ConditionChip.displayName = 'ConditionChip';

/**
 * Creates token-based styles for Shot Calculator screen
 * Uses memoized dynamic styles pattern for consistent theming
 */
const createStyles = (t: Tokens) => ({
  container: {
    flex: 1,
  } as ViewStyle,
  contentContainer: {
    paddingBottom: t.spacing['5xl'], // 120px - scroll bottom padding
  } as ViewStyle,
  loadingContainer: {
    flex: 1,
    padding: t.spacing.xl, // 32px
  } as ViewStyle,
  loadingPulse: {
    borderRadius: t.borderRadius.lg, // 12px
    marginBottom: t.spacing.md, // 16px
    height: t.spacing.xl, // 32px
  } as ViewStyle,
  title: {
    fontSize: safeScaledFontSize(t.fontSize['4xl'] - 4), // 32px hero title
    fontWeight: t.fontWeight.bold,
    letterSpacing: t.letterSpacing.tight, // -0.5
    marginBottom: t.spacing.xs, // 4px
  } as TextStyle,
  subtitle: {
    fontSize: safeScaledFontSize(t.fontSize.sm + 1), // 15px
    fontWeight: t.fontWeight.medium,
    marginBottom: t.spacing.lg, // 24px
  } as TextStyle,
  conditionsCard: {
    marginBottom: t.spacing.md, // 16px
  } as ViewStyle,
  conditionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: t.spacing.sm, // 8px
  } as ViewStyle,
  sliderCard: {
    marginBottom: t.spacing.md, // 16px
  } as ViewStyle,
  resultCard: {
    marginBottom: t.spacing.md, // 16px
  } as ViewStyle,
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.base, // 12px
  } as ViewStyle,
  adjustmentIndicator: {
    width: t.containerSize.icon.md, // 44px
    height: t.containerSize.icon.md, // 44px
    borderRadius: t.borderRadius.lg + 2, // 14px (slightly larger than lg=12)
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  adjustmentText: {
    flex: 1,
  } as ViewStyle,
  adjustmentLabel: {
    fontSize: safeScaledFontSize(t.fontSize.xs + 1), // 13px
    fontWeight: t.fontWeight.medium,
    marginBottom: 2,
  } as TextStyle,
  adjustmentValue: {
    fontSize: safeScaledFontSize(t.fontSize['2xl']), // 24px
    fontWeight: t.fontWeight.bold,
    ...Platform.select({
      ios: { fontFamily: 'Menlo' },
      android: { fontFamily: 'monospace' },
    }),
  } as TextStyle,
  divider: {
    height: t.borderWidth.thin, // 1px
    marginVertical: t.spacing.md, // 16px
  } as ViewStyle,
  playsLikeContainer: {
    alignItems: 'center',
  } as ViewStyle,
  playsLikeLabel: {
    fontSize: safeScaledFontSize(t.fontSize.sm), // 14px
    fontWeight: t.fontWeight.semibold,
    marginBottom: t.spacing.sm, // 8px
    textTransform: 'uppercase',
    letterSpacing: t.letterSpacing.wider, // 1
  } as TextStyle,
  playsLikeValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  } as ViewStyle,
  playsLikeValue: {
    fontSize: safeScaledFontSize(t.containerSize.icon.lg + 8), // 56px - matches hero pattern
    fontWeight: t.fontWeight.extrabold, // '800'
    letterSpacing: t.letterSpacing.tighter * 2, // -2 (tighter is -1)
    ...Platform.select({
      ios: { fontFamily: 'Menlo' },
      android: { fontFamily: 'monospace' },
    }),
  } as TextStyle,
  playsLikeUnit: {
    fontSize: safeScaledFontSize(t.fontSize.lg), // 18px
    fontWeight: t.fontWeight.medium,
    marginLeft: t.spacing.xs, // 4px
  } as TextStyle,
  clubCard: {
    marginBottom: t.spacing.md, // 16px
  } as ViewStyle,
  clubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm, // 8px
    marginBottom: t.spacing.sm, // 8px
  } as ViewStyle,
  clubLabel: {
    fontSize: safeScaledFontSize(t.fontSize.xs + 1), // 13px
    fontWeight: t.fontWeight.medium,
  } as TextStyle,
  clubName: {
    fontSize: safeScaledFontSize(t.fontSize.xl + 2), // 22px
    fontWeight: t.fontWeight.bold,
    marginBottom: t.spacing.xs, // 4px
  } as TextStyle,
  clubRange: {
    fontSize: safeScaledFontSize(t.fontSize.sm), // 14px
    fontWeight: t.fontWeight.medium,
  } as TextStyle,
});
