import { GlassCard } from '@/src/core/components/ui/GlassCard';
import { SectionHeader } from '@/src/core/components/ui/SectionHeader';
import { useSettings } from '@/src/core/context/settings';
import { fetchHourlyWind, HourlyWindPoint } from '@/src/services/weather/hourly-forecast';
import type { Tokens } from '@/src/theme/tokens';
import { useTokens } from '@/src/theme/useTokens';
import { useReduceMotionValue } from '@/src/hooks/useReduceMotion';
import { LogManager } from '@/src/utils/LogManager';
import { safeScaledFontSize, getTouchTargetSize } from '@/src/utils/responsive';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import { ArrowUp, MapPin, Settings, ChevronDown, ChevronUp, Wind } from 'lucide-react-native';
import React, { useMemo, useCallback, useState } from 'react';
import { Text, View, Pressable, Platform, LayoutAnimation } from 'react-native';
import * as Haptics from 'expo-haptics';

const logger = LogManager.getLogger('WindHourlyForecastBar');

/**
 * Creates memoized styles from theme tokens
 */
const createStyles = (t: Tokens) => ({
  container: {
    marginBottom: t.spacing.base, // 12
  },
  // Collapsed ticker header
  tickerHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: t.spacing.sm, // 8
    paddingHorizontal: t.spacing.sm, // 8
    minHeight: 44,
  },
  tickerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: t.spacing.sm, // 8
  },
  tickerTitle: {
    fontSize: safeScaledFontSize(t.fontSize.sm, { maxScale: 1.2 }), // 14
    fontWeight: t.fontWeight.semibold,
  },
  // Mini timeline in collapsed state
  tickerTimeline: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: t.spacing.xs, // 4
    flex: 1,
    marginLeft: t.spacing.sm, // 8
  },
  tickerItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 2,
  },
  tickerSpeed: {
    fontSize: safeScaledFontSize(t.fontSize.xs, { maxScale: 1.2 }), // 12
    fontWeight: t.fontWeight.medium,
  },
  tickerArrow: {
    marginRight: 1,
  },
  tickerDivider: {
    width: 1,
    height: 12,
    marginHorizontal: t.spacing.xs / 2, // 2
  },
  // Expanded view styles
  row: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    gap: t.spacing.sm, // 8
    paddingHorizontal: t.spacing.xs, // 4
    paddingTop: t.spacing.sm, // 8
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
  const reduceMotion = useReduceMotionValue();
  const { convertSpeed, settings } = useSettings();

  // Memoize styles based on token set
  const styles = useMemo(() => createStyles(t), [t]);

  const [points, setPoints] = React.useState<HourlyWindPoint[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  // Per interview decision: Forecast collapsed by default with mini timeline
  const [isExpanded, setIsExpanded] = useState(false);

  // Toggle expand/collapse with animation (skip animation if reduce motion)
  const handleToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!reduceMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setIsExpanded((prev) => !prev);
  }, [reduceMotion]);

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

  // Permission error CTA handlers - MUST be defined before any early returns
  const handleRequestPermission = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        // Re-trigger the effect by clearing error state
        setError(null);
        setLoading(true);
      }
    } catch (e) {
      logger.error('Failed to request location permission', e as Error);
    }
  }, []);

  const handleOpenSettings = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openSettings();
  }, []);

  // Use getTouchTargetSize to ensure 44pt minimum for icon circles
  const iconSize = getTouchTargetSize(t.containerSize.icon.sm + 4, { minSize: t.containerSize.icon.md });
  // Arrow icon size based on icon circle
  const arrowSize = t.fontSize.lg; // 18

  // Derived state - safe after all hooks
  const isPermissionError = error?.includes('permission') || error?.includes('Location');

  if (loading) {
    return (
      <GlassCard style={styles.container}>
        <View style={styles.tickerHeader}>
          <View style={styles.tickerLeft}>
            <Wind size={16} color={t.colors.brand} />
            <Text style={[styles.tickerTitle, { color: t.colors.textPrimary }]}>Forecast</Text>
          </View>
          <Text style={[styles.loadingText, { color: t.colors.textMuted }]}>Loading...</Text>
        </View>
      </GlassCard>
    );
  }

  if (error || !points || points.length === 0) {
    return (
      <GlassCard style={styles.container}>
        <View style={styles.tickerHeader}>
          <View style={styles.tickerLeft}>
            <Wind size={16} color={t.colors.brand} />
            <Text style={[styles.tickerTitle, { color: t.colors.textPrimary }]}>Forecast</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs }}>
            {isPermissionError && <MapPin size={12} color={t.colors.danger} />}
            <Text style={[styles.errorText, { color: t.colors.danger }]}>
              {error || 'Unavailable'}
            </Text>
          </View>
        </View>
        {isPermissionError && (
          <View style={{ flexDirection: 'row', gap: t.spacing.sm, paddingHorizontal: t.spacing.sm, paddingBottom: t.spacing.sm }}>
            <Pressable
              onPress={handleRequestPermission}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: t.spacing.xs,
                backgroundColor: t.colors.brand,
                paddingVertical: t.spacing.sm,
                paddingHorizontal: t.spacing.base,
                borderRadius: t.borderRadius.md,
                minHeight: 44,
              }}
              accessibilityRole="button"
              accessibilityLabel="Grant location permission"
              accessibilityHint="Opens permission request to allow location access for weather forecast"
            >
              <MapPin size={t.fontSize.sm} color={t.colors.textInverse} />
              <Text style={{ color: t.colors.textInverse, fontWeight: t.fontWeight.semibold, fontSize: safeScaledFontSize(t.fontSize.sm) }}>
                Grant Permission
              </Text>
            </Pressable>
            <Pressable
              onPress={handleOpenSettings}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: t.spacing.xs,
                backgroundColor: t.colors.surfaceAlt,
                paddingVertical: t.spacing.sm,
                paddingHorizontal: t.spacing.base,
                borderRadius: t.borderRadius.md,
                borderWidth: t.borderWidth.thin,
                borderColor: t.colors.border,
                minHeight: 44,
              }}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              accessibilityHint="Opens app settings to manage location permissions"
            >
              <Settings size={t.fontSize.sm} color={t.colors.textMuted} />
              <Text style={{ color: t.colors.textPrimary, fontWeight: t.fontWeight.medium, fontSize: safeScaledFontSize(t.fontSize.sm) }}>
                Settings
              </Text>
            </Pressable>
          </View>
        )}
      </GlassCard>
    );
  }

  // Get current + next 2 hours for collapsed ticker preview
  const tickerPoints = (points || []).slice(0, 3);
  const unit = settings.speedUnit === 'mps' ? 'm/s' : settings.speedUnit;

  // Find max gust in forecast for ticker display
  const maxGust = useMemo(() => {
    if (!points) return null;
    const gusts = points.map((p) => p.gustMph).filter((g) => g > 0);
    return gusts.length > 0 ? Math.max(...gusts) : null;
  }, [points]);

  return (
    <GlassCard style={styles.container}>
      {/* Collapsible Ticker Header - Always visible */}
      <Pressable
        onPress={handleToggle}
        style={styles.tickerHeader}
        accessibilityRole="button"
        accessibilityLabel={isExpanded ? 'Collapse wind forecast' : 'Expand wind forecast'}
        accessibilityHint="Double tap to toggle forecast details"
        accessibilityState={{ expanded: isExpanded }}
      >
        <View style={styles.tickerLeft}>
          <Wind size={16} color={t.colors.brand} />
          <Text style={[styles.tickerTitle, { color: t.colors.textPrimary }]}>Forecast</Text>
        </View>

        {/* Mini Timeline - visible when collapsed */}
        {!isExpanded && (
          <View style={styles.tickerTimeline}>
            {tickerPoints.map((p, idx) => {
              const speed = Math.round(convertSpeed(p.speedMph));
              return (
                <React.Fragment key={`ticker-${p.time}-${idx}`}>
                  {idx > 0 && (
                    <View style={[styles.tickerDivider, { backgroundColor: t.colors.border }]} />
                  )}
                  <View style={styles.tickerItem}>
                    <ArrowUp
                      size={10}
                      color={t.colors.brand}
                      style={[
                        styles.tickerArrow,
                        { transform: [{ rotate: `${(Math.round(p.directionDeg) + 180) % 360}deg` }] },
                      ]}
                    />
                    <Text style={[styles.tickerSpeed, { color: t.colors.textPrimary }]}>
                      {speed}
                    </Text>
                  </View>
                </React.Fragment>
              );
            })}
            {/* Show max gust if significant */}
            {maxGust && maxGust > (tickerPoints[0]?.speedMph || 0) * 1.3 && (
              <>
                <View style={[styles.tickerDivider, { backgroundColor: t.colors.border }]} />
                <Text style={[styles.tickerSpeed, { color: t.colors.warning }]}>
                  G{Math.round(convertSpeed(maxGust))}
                </Text>
              </>
            )}
          </View>
        )}

        {/* Expand/Collapse chevron */}
        {isExpanded ? (
          <ChevronUp size={18} color={t.colors.textMuted} />
        ) : (
          <ChevronDown size={18} color={t.colors.textMuted} />
        )}
      </Pressable>

      {/* Expanded 5-hour Detail View */}
      {isExpanded && (
        <View style={styles.row}>
          {(points || []).slice(0, 5).map((p, idx) => {
            const speed = Math.round(convertSpeed(p.speedMph));
            const gust = p.gustMph > 0 ? Math.round(convertSpeed(p.gustMph)) : null;
            return (
              <View key={`${p.time}-${idx}`} style={styles.item}>
                <Text style={[styles.timeLabel, { color: t.colors.textMuted }]}>
                  {formatHour(p.time)}
                </Text>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      borderWidth: t.borderWidth.thin,
                      borderColor: t.colors.border,
                      width: iconSize,
                      height: iconSize,
                      borderRadius: iconSize / 2,
                    },
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
                {/* Show gusts if significantly higher than sustained */}
                {gust && gust > speed * 1.2 && (
                  <Text style={[styles.speed, { color: t.colors.warning, fontSize: safeScaledFontSize(10) }]}>
                    G{gust}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}
    </GlassCard>
  );
}
