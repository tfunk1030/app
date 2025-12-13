/**
 * Shot Calculator Screen
 *
 * Optimized implementation using:
 * - Enhanced environmental service with throttling
 * - Skeleton loading states
 * - Progressive loading
 * - Memoization
 */

import { LoadPriority, ProgressiveLoader } from '@/src/components/ui/ProgressiveLoader';
import { SkeletonLoader } from '@/src/components/ui/SkeletonLoader';
import { GlassCard } from '@/src/core/components/ui/GlassCard';
import { MetricTile } from '@/src/core/components/ui/MetricTile';
import { PageTitle } from '@/src/core/components/ui/page-title';
import { SectionHeader } from '@/src/core/components/ui/SectionHeader';
import { Slider } from '@/src/core/components/ui/slider';
import { Button } from '@/src/core/components/ui/button';
import { ConnectivityBanner } from '@/src/core/components/ui/ConnectivityBanner';
import { RetryCard } from '@/src/core/components/ui/RetryCard';
import { useSettings } from '@/src/core/context/settings';
import { useShotCalc } from '@/src/core/context/shotcalc';
import { SkillLevel, YardageModelEnhanced } from '@/src/core/models/YardageModel';
import { useClubSettings } from '@/src/features/settings/context/clubs';
import { normalizeClubName } from '@/src/features/settings/utils/club-mapping';
import { useEnhancedEnvironmental } from '@/src/providers/EnhancedEnvironmentalProvider';
import { useTokens as useThemeTokens } from '@/src/theme/useTokens';
import { moderateScale, scaledFontSize, getScrollPadding } from '@/src/utils/responsive';
import { Droplets, Gauge, Mountain, Thermometer } from 'lucide-react-native';
import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Themed styles factory
function getThemedStyles(palette: ReturnType<typeof useThemeTokens>) {
  const scrollPadding = getScrollPadding(16);
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.colors.background },
    contentContainer: {
      paddingHorizontal: scrollPadding,
      paddingTop: 16,
      paddingBottom: moderateScale(32)
    },
    centerContent: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: palette.colors.textPrimary, fontSize: scaledFontSize(16) },
    errorText: { color: palette.colors.danger, fontSize: scaledFontSize(16) },
    timestampText: {
      fontSize: scaledFontSize(12),
      color: palette.colors.textMuted,
      textAlign: 'center',
      marginBottom: 12,
      opacity: 0.8,
    },
    // Compact freshness/observation/source pill
    metaPill: {
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: moderateScale(8),
      borderWidth: 1,
      borderRadius: 999,
      paddingVertical: 6,
      paddingHorizontal: 10,
      marginBottom: 12,
    },
    metaDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    metaText: {
      fontSize: scaledFontSize(12),
    },
    title: {
      fontSize: scaledFontSize(24),
      fontWeight: 'bold',
      color: palette.colors.textPrimary,
      marginBottom: 24,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    conditionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: moderateScale(12),
    },
    tileHalf: { width: '48%' },
    conditionItem: { alignItems: 'center', width: '48%', marginBottom: moderateScale(8) },
    iconContainer: {
      width: 24,
      height: 24,
      backgroundColor: 'transparent',
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    conditionLabel: { color: palette.colors.textMuted, fontSize: scaledFontSize(12) },
    conditionValue: {
      color: palette.colors.textPrimary,
      fontSize: scaledFontSize(14),
      fontWeight: '500',
    },
    distanceCard: {
      marginBottom: 16,
      padding: 16,
      backgroundColor: palette.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.colors.border,
    },
    cardLabel: { color: palette.colors.textMuted, fontSize: scaledFontSize(14), marginBottom: 8 },
    distanceInputContainer: { marginTop: 4 },
    adjustmentCard: {
      marginBottom: 16,
      padding: 16,
      backgroundColor: palette.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.colors.border,
    },
    adjustmentContent: { backgroundColor: palette.colors.surfaceAlt, borderRadius: 8, padding: 12 },
    adjustmentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    adjustmentLabel: { color: palette.colors.textMuted, fontSize: scaledFontSize(14) },
    adjustmentValue: { fontSize: scaledFontSize(16), fontWeight: '500' },
    adjustmentPositive: { color: palette.colors.success },
    adjustmentNegative: { color: palette.colors.danger },
    playsLikeValue: {
      color: palette.colors.textPrimary,
      fontSize: scaledFontSize(20),
      fontWeight: 'bold',
    },
    clubCard: {
      marginBottom: 16,
      padding: 16,
      backgroundColor: palette.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.colors.border,
    },
    clubContent: { backgroundColor: palette.colors.surfaceAlt, borderRadius: 8 },
    exactMatch: { padding: 16 },
    clubTitle: { color: palette.colors.textMuted, fontSize: scaledFontSize(14), marginBottom: 8 },
    clubRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    clubName: {
      color: palette.colors.textPrimary,
      fontSize: scaledFontSize(16),
      fontWeight: '600',
    },
    clubValue: { color: palette.colors.textPrimary, fontSize: scaledFontSize(14) },
    divider: { height: 1, backgroundColor: palette.colors.border, marginVertical: 12 },
    clubOptions: { padding: 16 },
    clubOption: { marginBottom: 12 },
  });
}

// Memoized condition icon component
const ConditionIcon = memo(
  ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => {
    const palette = useThemeTokens();
    const styles = React.useMemo(() => getThemedStyles(palette), [palette]);
    return (
      <View
        style={styles.conditionItem}
        accessible
        accessibilityRole="summary"
        accessibilityLabel={`${label}: ${value}`}
      >
        <View style={styles.iconContainer}>
          <Icon size={16} color={palette.colors.brandAlt} />
        </View>
        <Text style={styles.conditionLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text
          style={styles.conditionValue}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
        >
          {value}
        </Text>
      </View>
    );
  }
);

ConditionIcon.displayName = 'ConditionIcon';

// Memoized conditions display component (modern tiles inside a GlassCard)
const ConditionsDisplay = memo(({ conditions }: { conditions: any }) => {
  const { settings } = useSettings();
  const palette = useThemeTokens();
  const styles = React.useMemo(() => getThemedStyles(palette), [palette]);
  const altitudeText =
    conditions?.altitude != null
      ? `${Math.round(
          settings.altitudeUnit === 'feet' ? conditions.altitude : conditions.altitude / 3.28084
        )} ${settings.altitudeUnit === 'feet' ? 'ft' : 'm'}`
      : '-';
  const tempText =
    conditions?.temperature != null
      ? `${Math.round(
          settings.temperatureUnit === 'fahrenheit'
            ? conditions.temperature
            : ((conditions.temperature - 32) * 5) / 9
        )}°${settings.temperatureUnit === 'fahrenheit' ? 'F' : 'C'}`
      : '-';

  return (
    <GlassCard style={{ marginBottom: 16 }}>
      <SectionHeader title="Conditions" />
      <View style={styles.conditionsGrid}>
        <MetricTile
          style={styles.tileHalf}
          icon={<Gauge size={18} color={palette.colors.brandAlt} />}
          label="Density"
          value={`${conditions?.density?.toFixed(3) || '-'}`}
        />
        <MetricTile
          style={styles.tileHalf}
          icon={<Mountain size={18} color={palette.colors.brandAlt} />}
          label="Altitude"
          value={altitudeText}
        />
        <MetricTile
          style={styles.tileHalf}
          icon={<Thermometer size={18} color={palette.colors.brandAlt} />}
          label="Temp"
          value={tempText}
        />
        <MetricTile
          style={styles.tileHalf}
          icon={<Droplets size={18} color={palette.colors.brandAlt} />}
          label="Humidity"
          value={`${conditions?.humidity?.toFixed(0) || '-'}%`}
        />
      </View>
    </GlassCard>
  );
});

ConditionsDisplay.displayName = 'ConditionsDisplay';

// Memoized target distance input component
const TargetDistanceInput = memo(
  ({
    targetYardage,
    setTargetYardage,
    settings,
  }: {
    targetYardage: number;
    setTargetYardage: (value: number) => void;
    settings: any;
  }) => (
    <GlassCard style={{ marginBottom: 16 }}>
      <SectionHeader title="Target Distance" />
      <View style={styles.distanceInputContainer}>
        <Slider
          value={targetYardage}
          onValueChange={setTargetYardage}
          min={settings.distanceUnit === 'yards' ? 50 : 45}
          max={settings.distanceUnit === 'yards' ? 360 : 330}
          step={1}
          label="Target Distance"
          unit={settings.distanceUnit === 'yards' ? ' yds' : ' m'}
        />
      </View>
    </GlassCard>
  ));

// Memoized shot adjustment display component
const ShotAdjustmentDisplay = memo(
  ({ shotData, targetYardage }: { shotData: any; targetYardage: number }) => {
    const palette = useThemeTokens();
    const styles = React.useMemo(() => getThemedStyles(palette), [palette]);
    const { settings, convertDistance } = useSettings();
    const unitLabel = settings.distanceUnit === 'yards' ? 'yds' : 'm';
    // Use model-provided environmentalEffect (in yards, signed). Convert only for display
    const envEffectYardsSigned = Math.round(shotData.result.environmentalEffect);
    const envEffectAbs = Math.abs(envEffectYardsSigned);
    const envEffectDisplay =
      settings.distanceUnit === 'yards' ? envEffectAbs : Math.round(envEffectAbs * 0.9144);
    const playsLikeDisplay =
      settings.distanceUnit === 'yards'
        ? Math.round(shotData.result.totalDistance)
        : Math.round(shotData.result.totalDistance * 0.9144);

    return (
      <GlassCard style={{ marginBottom: 16 }}>
        <SectionHeader title="Shot Adjustment" />
        <View style={styles.adjustmentContent}>
          <View style={styles.adjustmentRow}>
            <Text style={styles.adjustmentLabel}>Environmental Effect</Text>
            <Text
              style={[
                styles.adjustmentValue,
                envEffectYardsSigned >= 0 ? styles.adjustmentNegative : styles.adjustmentPositive,
              ]}
            >
              {envEffectYardsSigned >= 0 ? '+' : '-'}
              {envEffectDisplay} {unitLabel}
            </Text>
          </View>
          <Text style={styles.adjustmentLabel}>Play's Like</Text>
          <Text
            style={styles.playsLikeValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {playsLikeDisplay} {unitLabel}
          </Text>
        </View>
        <Text
          style={{ color: palette.colors.textMuted, fontSize: scaledFontSize(12), marginTop: 6 }}
          accessibilityRole="text"
        >
          Environmental effect = target minus carry. "Play's Like" approximates carry required after conditions.
        </Text>
      </GlassCard>
    );
  }
);

ShotAdjustmentDisplay.displayName = 'ShotAdjustmentDisplay';

// Memoized club recommendations component
const ClubRecommendations = memo(
  ({
    shotData,
    getRecommendedClub,
  }: {
    shotData: any;
    getRecommendedClub: (distance: number) => any;
  }) => {
    const palette = useThemeTokens();
    const styles = React.useMemo(() => getThemedStyles(palette), [palette]);
    const { settings, convertDistance } = useSettings();
    const unitLabel = settings.distanceUnit === 'yards' ? 'yds' : 'm';
    const playsLikeDistance = shotData.result.totalDistance;
    const exactClub = getRecommendedClub(playsLikeDistance);
    const isExactMatch = exactClub?.normalYardage === Math.round(playsLikeDistance);

    return (
      <GlassCard style={{ marginBottom: 16 }}>
        <SectionHeader title="Recommended Clubs" />
        <View style={styles.clubContent}>
          {isExactMatch ? (
            <View style={styles.exactMatch}>
              <Text style={styles.clubTitle}>Perfect Club</Text>
              <View style={styles.clubRow}>
                <Text style={styles.clubName}>{exactClub.name}</Text>
                <Text style={styles.clubValue}>
                  {settings.distanceUnit === 'yards'
                    ? Math.round(exactClub.normalYardage)
                    : Math.round(convertDistance(exactClub.normalYardage, 'meters'))}{' '}
                  {unitLabel}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.clubOptions}>
              {/* Longer Club Option */}
              <View style={styles.clubOption}>
                <Text style={styles.clubTitle}>Longer Option</Text>
                <View style={styles.clubRow}>
                  <Text style={styles.clubName}>
                    {getRecommendedClub(playsLikeDistance + 7)?.name ||
                      shotData.recommendedClub.name}
                  </Text>
                  <Text style={styles.clubValue}>
                    {(() => {
                      const v =
                        getRecommendedClub(playsLikeDistance + 7)?.normalYardage ||
                        shotData.recommendedClub.normalYardage;
                      return settings.distanceUnit === 'yards'
                        ? Math.round(v)
                        : Math.round(convertDistance(v, 'meters'));
                    })()}{' '}
                    {unitLabel}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Shorter Club Option */}
              <View style={styles.clubOption}>
                <Text style={styles.clubTitle}>Shorter Option</Text>
                <View style={styles.clubRow}>
                  <Text style={styles.clubName}>
                    {getRecommendedClub(playsLikeDistance)?.name || shotData.recommendedClub.name}
                  </Text>
                  <Text style={styles.clubValue}>
                    {(() => {
                      const v =
                        getRecommendedClub(playsLikeDistance)?.normalYardage ||
                        shotData.recommendedClub.normalYardage;
                      return settings.distanceUnit === 'yards'
                        ? Math.round(v)
                        : Math.round(convertDistance(v, 'meters'));
                    })()}{' '}
                    {unitLabel}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </GlassCard>
    );
  }
);

ClubRecommendations.displayName = 'ClubRecommendations';

// Format observation time helper
const formatObservationTime = (timeString: string) => {
  try {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.error('Error formatting observation time:', error);
    return 'N/A';
  }
};

// Main shot calculator component
export default function ShotCalculatorScreen() {
  const { conditions, isActive, forceRefresh, lastUpdatedTimestamp, throttlingStatus } = useEnhancedEnvironmental();
  const { getRecommendedClub } = useClubSettings();
  const { settings, formatTemperature, formatAltitude, convertDistance } = useSettings();
  const { setShotCalcData } = useShotCalc();
  const palette = useThemeTokens();
  const styles = React.useMemo(() => getThemedStyles(palette), [palette]);
  const [targetYardage, setTargetYardage] = useState(150);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [yardageModel] = useState(() => new YardageModelEnhanced());
  const [shotData, setShotData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { width, fontScale } = useWindowDimensions();
  const compactLayout = width < 380 || fontScale > 1.15;

  // Handle user-triggered refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      console.log('User triggered refresh in ShotCalculatorScreen'); // Using console.log for consistency
      await forceRefresh(); // Call the forceRefresh function from context
    } catch (error) {
      console.error('Error during manual refresh:', error);
      // Optionally, display an error message to the user here
    } finally {
      setRefreshing(false); // Ensure refreshing state is reset
    }
  }, [forceRefresh]); // Dependency: forceRefresh function

  // Calculate shot data
  const calculateShot = useCallback(() => {
    if (!conditions) return null;

    // Normalize target to yards for the model (model expects yards)
    const targetInYards =
      settings.distanceUnit === 'yards'
        ? targetYardage
        : Math.round(convertDistance(targetYardage, 'yards'));

    const club = getRecommendedClub(targetInYards);
    if (!club) return null;

    try {
      const clubKey = normalizeClubName(club.name);
      if (!yardageModel.clubExists(clubKey)) return null;

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
        targetInYards,
        SkillLevel.PROFESSIONAL,
        clubKey
      );

      if (!result) return null;

      // Calculate plays like distance using web version formula
      const playsLikeDistance = targetInYards * (targetInYards / result.carryDistance);

      return {
        result: {
          carryDistance: result.carryDistance,
          environmentalEffect: targetInYards - result.carryDistance,
          totalDistance: playsLikeDistance,
        },
        recommendedClub: club,
      };
    } catch (error) {
      console.error('Error calculating shot:', error);
      return null;
    }
  }, [conditions, targetYardage, getRecommendedClub, yardageModel]);

  // Update shot data when dependencies change
  useEffect(() => {
    setShotData(calculateShot());
  }, [calculateShot]);

  // Update shot calc context
  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdate < 100) return;

    if (conditions && shotData) {
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

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <ScrollView
        style={[styles.container, { backgroundColor: palette.colors.background }]}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.colors.textMuted}
            colors={[palette.colors.textMuted]}
            progressBackgroundColor={palette.colors.surfaceAlt}
          />
        }
      >
        <ConnectivityBanner />
        <PageTitle title="Shot Calculator" showGlow={true} showGradient={true} />

        {/* Compact Meta Pill: freshness • observation • source */}
        {(() => {
          const parts: string[] = [];
          if (lastUpdatedTimestamp) {
            parts.push(
              `Updated ${formatObservationTime(new Date(lastUpdatedTimestamp).toISOString())}`
            );
          }
          if (conditions?.obTime) {
            parts.push(`Obs ${formatObservationTime((conditions.obTime || '').toString())}`);
          }
          const provider = throttlingStatus?.provider;
          const label =
            provider === 'open-meteo'
              ? 'Open‑Meteo'
              : provider === 'stormglass'
              ? 'Stormglass'
              : provider === 'nws'
              ? 'NWS'
              : null;
          if (label) parts.push(label);

          const ageMs = lastUpdatedTimestamp ? Date.now() - lastUpdatedTimestamp : Number.MAX_SAFE_INTEGER;
          const freshnessColor =
            ageMs <= 5 * 60 * 1000
              ? palette.colors.success
              : ageMs <= 30 * 60 * 1000
              ? palette.colors.brandAlt
              : palette.colors.danger;

          return parts.length ? (
            <View style={[styles.metaPill, { borderColor: palette.colors.border, backgroundColor: palette.colors.surfaceAlt }]}>
              <View style={[styles.metaDot, { backgroundColor: freshnessColor }]} />
              <Text style={[styles.metaText, { color: palette.colors.textMuted }]}>{parts.join(' • ')}</Text>
            </View>
          ) : null;
        })()}

        {/* Environmental Conditions Card with Progressive Loading */}
        <ProgressiveLoader
          priority={LoadPriority.HIGH}
          isLoading={!isActive}
          skeleton={<SkeletonLoader type="rectangle" height={60} borderRadius={8} />}
          error={!conditions && isActive ? 'Unable to load conditions' : null}
          errorComponent={<RetryCard title="Unable to load conditions" onRetry={onRefresh} />}
        >
          {conditions && (
            <View style={[compactLayout && { paddingHorizontal: 4 }]}>
              <ConditionsDisplay conditions={conditions} />
            </View>
          )}
        </ProgressiveLoader>

        {/* Target Distance Card with Progressive Loading */}
        <ProgressiveLoader
          priority={LoadPriority.HIGH}
          isLoading={!isActive}
          skeleton={<SkeletonLoader type="rectangle" height={80} borderRadius={8} />}
        >
          <TargetDistanceInput
            targetYardage={targetYardage}
            setTargetYardage={setTargetYardage}
            settings={settings}
          />
        </ProgressiveLoader>

        {/* Shot Adjustment Card with Progressive Loading */}
        {shotData && (
          <ProgressiveLoader
            priority={LoadPriority.MEDIUM}
            isLoading={!isActive}
            skeleton={<SkeletonLoader type="rectangle" height={120} borderRadius={8} />}
          >
            <ShotAdjustmentDisplay shotData={shotData} targetYardage={targetYardage} />
          </ProgressiveLoader>
        )}

        {/* Recommended Clubs Card with Progressive Loading */}
        {shotData?.recommendedClub && (
          <ProgressiveLoader
            priority={LoadPriority.LOW}
            isLoading={!isActive}
            skeleton={<SkeletonLoader type="rectangle" height={150} borderRadius={8} />}
          >
            <ClubRecommendations shotData={shotData} getRecommendedClub={getRecommendedClub} />
          </ProgressiveLoader>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: moderateScale(32),
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {},
  errorText: {},
  timestampText: {},
  title: {},
  conditionsCard: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.5)',
  },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  tileHalf: {
    width: '48%',
  },
  conditionItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: moderateScale(8),
  },
  iconContainer: {
    width: 24,
    height: 24,
    backgroundColor: 'transparent',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  conditionLabel: {},
  conditionValue: {},
  distanceCard: {},
  cardLabel: {},
  distanceInputContainer: {
    marginTop: 4,
  },
  adjustmentCard: {},
  sectionTitle: {},
  adjustmentContent: {},
  adjustmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  adjustmentLabel: {},
  adjustmentValue: {
    fontSize: scaledFontSize(16),
    fontWeight: '500',
  },
  adjustmentPositive: {},
  adjustmentNegative: {},
  playsLikeValue: {},
  metaPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  metaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metaText: {
    fontSize: scaledFontSize(12),
  },
  clubCard: {},
  clubContent: {},
  exactMatch: {
    padding: 16,
  },
  clubTitle: {},
  clubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clubName: {},
  clubValue: {},
  divider: {},
  clubOptions: {},
  clubOption: {},
});
