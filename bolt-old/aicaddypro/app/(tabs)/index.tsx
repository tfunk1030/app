/**
 * Weather Screen
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
import { useSettings } from '@/src/core/context/settings';
import { useCompactLayout } from '@/src/hooks/useCompactLayout';
import { useEnhancedEnvironmental } from '@/src/providers/EnhancedEnvironmentalProvider';
import { useTokens as useThemeTokens } from '@/src/theme/useTokens';
import { moderateScale, scaledFontSize, getScrollPadding } from '@/src/utils/responsive';
import {
  Compass,
  Droplets,
  Gauge,
  Mountain,
  Navigation,
  Thermometer,
  Wind,
} from 'lucide-react-native';
import React, { memo, useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConnectivityBanner } from '@/src/core/components/ui/ConnectivityBanner';
import { RetryCard } from '@/src/core/components/ui/RetryCard';

// Memoized condition item component
const ConditionItem = memo(
  ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => {
    const palette = useThemeTokens();
    return (
      <View
        style={[
          styles.conditionCard,
          {
            backgroundColor: palette.colors.surface,
            borderColor: palette.colors.border,
            shadowColor: palette.colors.shadow,
          },
        ]}
        accessible
        accessibilityRole="summary"
        accessibilityLabel={`${label}: ${value}`}
        testID={`condition-${label.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <View style={styles.conditionHeader}>
          <View style={styles.iconWrapper}>{icon}</View>
          <Text style={[styles.conditionLabel, { color: palette.colors.textMuted }]}>{label}</Text>
        </View>
        <Text style={[styles.conditionValue, { color: palette.colors.textPrimary }]}>{value}</Text>
      </View>
    );
  }
);

ConditionItem.displayName = 'ConditionItem';

// Memoized temperature display component
const TemperatureDisplay = memo(({ temperature }: { temperature: string }) => {
  const palette = useThemeTokens();
  return (
    <GlassCard style={styles.mainCard}>
      <View style={styles.temperatureContainer}>
        <View style={styles.iconWrapper}>
          <Thermometer size={32} color={palette.colors.brandAlt} />
        </View>
        <Text
          style={[styles.temperatureText, { color: palette.colors.textPrimary }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {temperature}
        </Text>
      </View>
    </GlassCard>
  );
});

TemperatureDisplay.displayName = 'TemperatureDisplay';

// Memoized weather column component using GlassCard + SectionHeader
const WeatherColumn = memo(
  ({
    humidity,
    density,
    altitude,
    cardHeight,
    onLayout,
  }: {
    humidity: string;
    density: string;
    altitude: string;
    cardHeight?: number | undefined;
    onLayout?: (h: number) => void;
  }) => {
    const palette = useThemeTokens();
    return (
      <GlassCard
        style={{ marginBottom: moderateScale(8), flex: 1, minWidth: 0, minHeight: cardHeight }}
        accent
      >
        <SectionHeader title="Weather" />
        <View
          style={styles.columnContent}
          onLayout={e => onLayout && onLayout(e.nativeEvent.layout.height)}
        >
          <MetricTile
            icon={<Droplets size={20} color={palette.colors.brandAlt} />}
            label="Humidity"
            value={humidity}
          />
          <MetricTile
            icon={<Gauge size={20} color={palette.colors.brandAlt} />}
            label="Air Density"
            value={density}
          />
          <MetricTile
            icon={<Mountain size={20} color={palette.colors.brandAlt} />}
            label="Altitude"
            value={altitude}
          />
        </View>
      </GlassCard>
    );
  }
);

WeatherColumn.displayName = 'WeatherColumn';

// Memoized wind column component using GlassCard + SectionHeader
const WindColumn = memo(
  ({
    windSpeed,
    windDirection,
    windGust,
    cardHeight,
    onLayout,
  }: {
    windSpeed: string;
    windDirection: string;
    windGust: string;
    cardHeight?: number | undefined;
    onLayout?: (h: number) => void;
  }) => {
    const palette = useThemeTokens();
    return (
      <GlassCard
        style={{ marginBottom: moderateScale(8), flex: 1, minWidth: 0, minHeight: cardHeight }}
        accent
      >
        <SectionHeader title="Wind" />
        <View
          style={styles.columnContent}
          onLayout={e => onLayout && onLayout(e.nativeEvent.layout.height)}
        >
          <MetricTile
            icon={<Wind size={20} color={palette.colors.brandAlt} />}
            label="Wind Speed"
            value={windSpeed}
          />
          <MetricTile
            icon={<Navigation size={20} color={palette.colors.brandAlt} />}
            label="Direction"
            value={windDirection}
          />
          <MetricTile
            icon={<Compass size={20} color={palette.colors.brandAlt} />}
            label="Gusts"
            value={windGust}
          />
        </View>
      </GlassCard>
    );
  }
);

WindColumn.displayName = 'WindColumn';

// Main weather display component
const WeatherDisplay = memo(({ conditions, settings }: { conditions: any; settings: any }) => {
  const [weatherHeight, setWeatherHeight] = React.useState<number | undefined>(undefined);
  const [windHeight, setWindHeight] = React.useState<number | undefined>(undefined);
  const syncedHeight =
    weatherHeight && windHeight ? Math.max(weatherHeight, windHeight) : undefined;
  const temperature =
    conditions.temperature !== undefined
      ? `${(
          Math.round(
            (settings.temperatureUnit === 'fahrenheit'
              ? conditions.temperature
              : ((conditions.temperature - 32) * 5) / 9) * 10
          ) / 10
        ).toFixed(1)}°${settings.temperatureUnit[0].toUpperCase()}`
      : settings.temperatureUnit === 'fahrenheit'
      ? '--°F'
      : '--°C';

  const altitude =
    conditions.altitude !== undefined
      ? `${Math.round(
          settings.altitudeUnit === 'feet' ? conditions.altitude : conditions.altitude / 3.28084
        )} ${settings.altitudeUnit === 'feet' ? 'ft' : 'm'}`
      : settings.altitudeUnit === 'feet'
      ? '-- ft'
      : '-- m';

  const humidity = conditions.humidity !== undefined ? `${Math.round(conditions.humidity)}%` : '--';
  const density =
    conditions.density !== undefined ? `${conditions.density.toFixed(3)}` : '--';
  const windSpeed =
    conditions.windSpeed !== undefined
      ? `${Math.round(
          settings.speedUnit === 'mph'
            ? conditions.windSpeed
            : settings.speedUnit === 'kph'
            ? conditions.windSpeed * 1.60934
            : settings.speedUnit === 'kts'
            ? conditions.windSpeed * 0.868976
            : conditions.windSpeed * 0.44704
        )} ${settings.speedUnit === 'mps' ? 'm/s' : settings.speedUnit}`
      : '--';
  const windDirection =
    conditions.windDirection !== undefined ? `${Math.round(conditions.windDirection)}°` : '--';
  const windGust =
    conditions.windGust !== undefined
      ? `${Math.round(
          settings.speedUnit === 'mph'
            ? conditions.windGust
            : settings.speedUnit === 'kph'
            ? conditions.windGust * 1.60934
            : settings.speedUnit === 'kts'
            ? conditions.windGust * 0.868976
            : conditions.windGust * 0.44704
        )} ${settings.speedUnit === 'mps' ? 'm/s' : settings.speedUnit}`
      : '--';

  return (
    <>
      <TemperatureDisplay temperature={temperature} />

      <View style={styles.columnsContainer}>
        <WeatherColumn
          humidity={humidity}
          density={density}
          altitude={altitude}
          cardHeight={syncedHeight}
          onLayout={h => setWeatherHeight(h)}
        />
        <WindColumn
          windSpeed={windSpeed}
          windDirection={windDirection}
          windGust={windGust}
          cardHeight={syncedHeight}
          onLayout={h => setWindHeight(h)}
        />
      </View>
    </>
  );
});

WeatherDisplay.displayName = 'WeatherDisplay';

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

// Main weather screen component
export default function WeatherScreen() {
  const { conditions, isActive, forceRefresh, lastUpdatedTimestamp, throttlingStatus } =
    useEnhancedEnvironmental();
  const { settings } = useSettings();
  const [refreshing, setRefreshing] = useState(false);
  const { isCompact: compactLayout } = useCompactLayout();
  const palette = useThemeTokens();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await forceRefresh();
    } catch (error) {
      console.error('Error during manual refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, [forceRefresh]);

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
        <PageTitle title="Current Conditions" variant="small" />

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


        <ProgressiveLoader
          priority={LoadPriority.HIGH}
          isLoading={!isActive}
          skeleton={
            <>
              <SkeletonLoader type="card" height={150} style={{ marginBottom: 24 }} />
              <View
                style={[styles.columnsContainer, compactLayout && styles.columnsContainerCompact]}
              >
                <View style={{ flex: 1 }}>
                  <SkeletonLoader
                    type="text"
                    width="70%"
                    height={20}
                    style={{ marginBottom: 16 }}
                  />
                  <SkeletonLoader type="card" height={80} style={{ marginBottom: 8 }} />
                  <SkeletonLoader type="card" height={80} style={{ marginBottom: 8 }} />
                  <SkeletonLoader type="card" height={80} />
                </View>
                <View style={{ flex: 1 }}>
                  <SkeletonLoader
                    type="text"
                    width="70%"
                    height={20}
                    style={{ marginBottom: 16 }}
                  />
                  <SkeletonLoader type="card" height={80} style={{ marginBottom: 8 }} />
                  <SkeletonLoader type="card" height={80} style={{ marginBottom: 8 }} />
                  <SkeletonLoader type="card" height={80} />
                </View>
              </View>
            </>
          }
          error={!conditions && isActive ? 'Unable to fetch weather conditions' : null}
          errorComponent={<RetryCard title="Unable to fetch weather conditions" onRetry={onRefresh} />}
        >
          {conditions && (
            <View style={[styles.columnsWrapper, compactLayout && styles.columnsWrapperCompact]}>
              <WeatherDisplay conditions={conditions} settings={settings} />
            </View>
          )}
        </ProgressiveLoader>
      </ScrollView>
    </SafeAreaView>
  );
}

const scrollPadding = getScrollPadding(16);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: scrollPadding,
    paddingTop: 16,
    paddingBottom: moderateScale(32),
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: scaledFontSize(28),
    fontWeight: 'bold',
    marginBottom: 24,
  },
  mainCard: {
    borderRadius: 16,
    padding: moderateScale(8),
    marginBottom: moderateScale(8),
    alignItems: 'center',
  },
  temperatureContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  temperatureText: {
    fontSize: scaledFontSize(40),
    fontWeight: '700',
  },
  columnsContainer: {
    flexDirection: 'row',
    gap: moderateScale(16),
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  columnsContainerCompact: {
    flexDirection: 'column',
    width: '100%',
  },
  columnsWrapper: {
    width: '100%',
  },
  columnsWrapperCompact: {
    gap: moderateScale(16),
  },
  column: {
    flex: 1,
    alignItems: 'stretch',
    minWidth: 0,
  },
  columnTitle: {
    fontSize: scaledFontSize(20),
    fontWeight: '600',
    marginBottom: 16,
  },
  columnContent: {
    gap: moderateScale(12),
    minWidth: 0,
    paddingBottom: 4,
  },
  conditionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    minWidth: 0,
  },
  conditionCard: {
    borderRadius: 16,
    padding: moderateScale(16),
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  conditionLabel: {
    fontSize: scaledFontSize(16),
    marginLeft: 8,
    flexShrink: 1,
  },
  conditionValue: {
    fontSize: scaledFontSize(24),
    fontWeight: '600',
    flexShrink: 1,
  },
  timestampText: {
    fontSize: scaledFontSize(12),
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
});
