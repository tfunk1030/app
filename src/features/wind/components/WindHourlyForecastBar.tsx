import { GlassCard } from '@/src/core/components/ui/GlassCard';
import { SectionHeader } from '@/src/core/components/ui/SectionHeader';
import { useSettings } from '@/src/core/context/settings';
import { fetchHourlyWind, HourlyWindPoint } from '@/src/services/weather/hourly-forecast';
import { useTokens } from '@/src/theme/useTokens';
import { LogManager } from '@/src/utils/LogManager';
import { scaledFontSize, getTouchTargetSize } from '@/src/utils/responsive';
import * as Location from 'expo-location';
import { ArrowUp } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const logger = LogManager.getLogger('WindHourlyForecastBar');

export function WindHourlyForecastBar() {
  const tokens = useTokens();
  const { convertSpeed, settings } = useSettings();

  const [points, setPoints] = React.useState<HourlyWindPoint[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const perm = await Location.getForegroundPermissionsAsync();
        if (perm.status !== 'granted') {
          logger.warn('Location permission not granted for hourly forecast');
          setError('Location permission required for forecast');
          setLoading(false);
          return;
        }

        const lastKnown = await Location.getLastKnownPositionAsync();
        const position =
          lastKnown ??
          (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        if (!position) {
          setError('Unable to determine location');
          setLoading(false);
          return;
        }

        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const preference = 'auto' as 'auto' | 'openmeteo' | 'nws';
        const data = await fetchHourlyWind(lat, lon, 5, preference);
        if (!cancelled) {
          setPoints(data);
          setLoading(false);
        }
      } catch (e) {
        logger.error('Failed to load hourly forecast', e as Error);
        if (!cancelled) {
          setError('Failed to load forecast');
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatHour = React.useCallback((isoLike: string) => {
    try {
      const d = new Date(isoLike);
      return d.toLocaleTimeString([], { hour: 'numeric' });
    } catch {
      return isoLike;
    }
  }, []);

  // Use getTouchTargetSize to ensure 44pt minimum for icon circles
  const iconSize = getTouchTargetSize(36, { minSize: 44 });

  if (loading) {
    return (
      <GlassCard style={styles.container}>
        <SectionHeader title="5-hour Wind Forecast" />
        <Text style={[styles.loadingText, { color: tokens.colors.textMuted }]}>
          Loading forecast...
        </Text>
      </GlassCard>
    );
  }

  if (error || !points || points.length === 0) {
    return (
      <GlassCard style={styles.container}>
        <SectionHeader title="5-hour Wind Forecast" />
        <Text style={[styles.errorText, { color: tokens.colors.danger }]}>
          {error || 'Forecast unavailable'}
        </Text>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={styles.container}>
      <SectionHeader title="5-hour Wind Forecast" />
      <View style={styles.row}>
        {(points || []).slice(0, 5).map((p, idx) => {
          const speed = Math.round(convertSpeed(p.speedMph));
          const unit = settings.speedUnit === 'mps' ? 'm/s' : settings.speedUnit;
          return (
            <View key={`${p.time}-${idx}`} style={styles.item}>
              <Text style={[styles.timeLabel, { color: tokens.colors.textMuted }]}>
                {formatHour(p.time)}
              </Text>
              <View
                style={[
                  styles.iconCircle,
                  {
                    borderWidth: 1,
                    borderColor: tokens.colors.border,
                    width: iconSize,
                    height: iconSize,
                    borderRadius: iconSize / 2,
                  }
                ]}
              >
                <ArrowUp
                  size={18}
                  color={tokens.colors.brand}
                  style={{
                    transform: [{ rotate: `${(Math.round(p.directionDeg) + 180) % 360}deg` }],
                  }}
                />
              </View>
              <Text style={[styles.deg, { color: tokens.colors.textPrimary }]}>
                {Math.round(p.directionDeg)}°
              </Text>
              <Text style={[styles.speed, { color: tokens.colors.textPrimary }]}>
                {speed} {unit}
              </Text>
            </View>
          );
        })}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  item: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingVertical: 6,
  },
  iconCircle: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  timeLabel: {
    fontSize: scaledFontSize(12),
  },
  deg: {
    fontSize: scaledFontSize(12),
  },
  speed: {
    fontSize: scaledFontSize(13),
    fontWeight: '600',
  },
  loadingText: {
    fontSize: scaledFontSize(14),
    textAlign: 'center',
  },
  errorText: {
    fontSize: scaledFontSize(14),
    textAlign: 'center',
  },
});
