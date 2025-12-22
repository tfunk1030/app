import { GlassCard } from '@/src/core/components/ui/GlassCard';
import { SectionHeader } from '@/src/core/components/ui/SectionHeader';
import { useSettings } from '@/src/core/context/settings';
import { fetchHourlyWind, HourlyWindPoint } from '@/src/services/weather/hourly-forecast';
import type { Tokens } from '@/src/theme/tokens';
import { useTokens } from '@/src/theme/useTokens';
import { LogManager } from '@/src/utils/LogManager';
import { safeScaledFontSize, getTouchTargetSize } from '@/src/utils/responsive';
import * as Location from 'expo-location';
import { ArrowUp } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

const logger = LogManager.getLogger('WindHourlyForecastBar');

/**
 * Creates memoized styles from theme tokens
 */
const createStyles = (t: Tokens) => ({
  container: {
    marginBottom: t.spacing.base, // 12
  },
  row: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    gap: t.spacing.sm, // 8
    paddingHorizontal: t.spacing.xs, // 4
  },
  item: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center' as const,
    paddingVertical: t.spacing.xs + 2, // 6 (xs + 2)
  },
  iconCircle: {
    backgroundColor: 'transparent',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginVertical: t.spacing.xs + 2, // 6 (xs + 2)
  },
  timeLabel: {
    fontSize: safeScaledFontSize(t.fontSize.xs, { maxScale: 1.2 }), // 12
    fontWeight: t.fontWeight.normal,
  },
  deg: {
    fontSize: safeScaledFontSize(t.fontSize.xs, { maxScale: 1.2 }), // 12
    fontWeight: t.fontWeight.medium,
  },
  speed: {
    fontSize: safeScaledFontSize(t.fontSize.xs + 1, { maxScale: 1.2 }), // 13
    fontWeight: t.fontWeight.semibold,
  },
  loadingText: {
    fontSize: safeScaledFontSize(t.fontSize.sm, { maxScale: 1.2 }), // 14
    textAlign: 'center' as const,
  },
  errorText: {
    fontSize: safeScaledFontSize(t.fontSize.sm, { maxScale: 1.2 }), // 14
    textAlign: 'center' as const,
  },
});

export function WindHourlyForecastBar() {
  const t = useTokens();
  const { convertSpeed, settings } = useSettings();

  // Memoize styles based on token set
  const styles = useMemo(() => createStyles(t), [t]);

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
  const iconSize = getTouchTargetSize(t.containerSize.icon.sm + 4, { minSize: t.containerSize.icon.md });
  // Arrow icon size based on icon circle
  const arrowSize = t.fontSize.lg; // 18

  if (loading) {
    return (
      <GlassCard style={styles.container}>
        <SectionHeader title="5-hour Wind Forecast" />
        <Text style={[styles.loadingText, { color: t.colors.textMuted }]}>
          Loading forecast...
        </Text>
      </GlassCard>
    );
  }

  if (error || !points || points.length === 0) {
    return (
      <GlassCard style={styles.container}>
        <SectionHeader title="5-hour Wind Forecast" />
        <Text style={[styles.errorText, { color: t.colors.danger }]}>
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
              <Text style={[styles.timeLabel, { color: t.colors.textMuted }]}>
                {formatHour(p.time)}
              </Text>
              <View
                style={[
                  styles.iconCircle,
                  {
                    borderWidth: t.borderWidth.thin, // 1
                    borderColor: t.colors.border,
                    width: iconSize,
                    height: iconSize,
                    borderRadius: iconSize / 2,
                  }
                ]}
              >
                <ArrowUp
                  size={arrowSize}
                  color={t.colors.brand}
                  style={{
                    transform: [{ rotate: `${(Math.round(p.directionDeg) + 180) % 360}deg` }],
                  }}
                />
              </View>
              <Text style={[styles.deg, { color: t.colors.textPrimary }]}>
                {Math.round(p.directionDeg)}°
              </Text>
              <Text style={[styles.speed, { color: t.colors.textPrimary }]}>
                {speed} {unit}
              </Text>
            </View>
          );
        })}
      </View>
    </GlassCard>
  );
}
