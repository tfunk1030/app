import { GlassCard } from '@/src/core/components/ui/GlassCard';
import { MetricTile } from '@/src/core/components/ui/MetricTile';
import { useEnhancedEnvironmental } from '@/src/providers/EnhancedEnvironmentalProvider';
import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import { safeScaledFontSize, getScrollPadding } from '@/src/utils/responsive';
import { useAccessibleAnimations } from '@/src/hooks/useAccessibility';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Cloud,
  Droplets,
  Gauge,
  Mountain,
  Thermometer,
  Wind,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, Text, View, ViewStyle, TextStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../../core/context/settings';
import type { Tokens } from '@/src/theme/tokens';

export default function WeatherScreen() {
  const { conditions } = useEnhancedEnvironmental();
  const { formatTemperature, formatAltitude } = useSettings();
  const t = useTokens();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark' || mode === 'system';
  const insets = useSafeAreaInsets();
  const { headerEntering, cardEntering } = useAccessibleAnimations();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const padding = getScrollPadding(t.spacing.md, { minPadding: t.spacing.base, maxPadding: t.spacing.xl });
  const styles = useMemo(() => createStyles(t), [t]);

  if (!isLoaded || !conditions) {
    return (
      <View style={[styles.container, { backgroundColor: t.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Cloud size={t.containerSize.icon.lg} color={t.colors.textMuted} />
          <Text style={[styles.loadingText, { color: t.colors.textMuted }]}>
            Loading conditions...
          </Text>
        </View>
      </View>
    );
  }

  // Parse temperature value for display
  const tempString = formatTemperature(conditions.temperature);
  const tempMatch = tempString.match(/^([\d.-]+)\s*(.*)$/);
  const tempValue = tempMatch ? tempMatch[1] : tempString;
  const tempUnit = tempMatch ? tempMatch[2] : '';

  // Parse altitude
  const altString = formatAltitude(conditions.altitude);
  const altMatch = altString.match(/^([\d.,]+)\s*(.*)$/);
  const altValue = altMatch ? altMatch[1] : altString;
  const altUnit = altMatch ? altMatch[2] : '';

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
        <Text style={[styles.title, { color: t.colors.textPrimary }]}>
          Current Conditions
        </Text>
        <Text style={[styles.subtitle, { color: t.colors.textMuted }]}>
          Real-time environmental data
        </Text>
      </Animated.View>

      {/* Temperature Card - Hero section */}
      <Animated.View entering={cardEntering(0)}>
        <GlassCard gradient glow style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View
              style={[
                styles.heroIconContainer,
                { backgroundColor: t.colors.brandBackgroundAlpha },
              ]}
            >
              <LinearGradient
                colors={t.gradients.primary as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroIconGradient}
              >
                <Thermometer size={t.containerSize.icon.sm} color={t.colors.textPrimary} />
              </LinearGradient>
            </View>
            <View style={styles.heroTextContainer}>
              <Text style={[styles.heroLabel, { color: t.colors.textMuted }]}>
                Temperature
              </Text>
              <View style={styles.heroValueRow}>
                <Text style={[styles.heroValue, { color: t.colors.textPrimary }]}>
                  {tempValue}
                </Text>
                <Text style={[styles.heroUnit, { color: t.colors.textMuted }]}>
                  {tempUnit}
                </Text>
              </View>
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Metrics Grid */}
      <Animated.View
        entering={cardEntering(1)}
        style={styles.gridContainer}
      >
        <View style={styles.gridRow}>
          <MetricTile
            icon={<Droplets size={t.fontSize.lg} color={t.colors.brandAlt} />}
            label="Humidity"
            value={conditions.humidity.toFixed(0)}
            unit="%"
            style={styles.gridItem}
          />
          <MetricTile
            icon={<Mountain size={t.fontSize.lg} color={t.colors.brandAlt} />}
            label="Altitude"
            value={altValue}
            unit={altUnit}
            style={styles.gridItem}
          />
        </View>

        <View style={styles.gridRow}>
          <MetricTile
            icon={<Gauge size={t.fontSize.lg} color={t.colors.brandAlt} />}
            label="Pressure"
            value={conditions.pressure.toFixed(0)}
            unit="hPa"
            style={styles.gridItem}
            highlight={isDark}
          />
          <MetricTile
            icon={<Wind size={t.fontSize.lg} color={t.colors.brandAlt} />}
            label="Air Density"
            value={conditions.density?.toFixed(3) || '0.000'}
            unit="kg/m³"
            style={styles.gridItem}
          />
        </View>
      </Animated.View>

      {/* Wind Info Card */}
      <Animated.View entering={cardEntering(2)}>
        <GlassCard accent style={styles.windCard}>
          <View style={styles.windContent}>
            <View style={styles.windHeader}>
              <Wind size={t.fontSize.xl} color={t.colors.brandAlt} />
              <Text style={[styles.windLabel, { color: t.colors.textMuted }]}>
                Wind Conditions
              </Text>
            </View>
            <View style={styles.windRow}>
              <View style={styles.windItem}>
                <Text style={[styles.windItemLabel, { color: t.colors.textMuted }]}>
                  Speed
                </Text>
                <Text style={[styles.windItemValue, { color: t.colors.textPrimary }]}>
                  {(conditions.windSpeed || 0).toFixed(1)} mph
                </Text>
              </View>
              <View style={[styles.windDivider, { backgroundColor: t.colors.border }]} />
              <View style={styles.windItem}>
                <Text style={[styles.windItemLabel, { color: t.colors.textMuted }]}>
                  Direction
                </Text>
                <Text style={[styles.windItemValue, { color: t.colors.textPrimary }]}>
                  {Math.round(conditions.windDirection || 0)}°
                </Text>
              </View>
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Data freshness indicator */}
      <Animated.View entering={cardEntering(3)} style={styles.freshness}>
        <View
          style={[
            styles.freshnessIndicator,
            { backgroundColor: t.colors.successGlow },
          ]}
        />
        <Text style={[styles.freshnessText, { color: t.colors.textMuted }]}>
          Data updated just now
        </Text>
      </Animated.View>
    </ScrollView>
  );
}

/**
 * Creates token-based styles for Weather screen
 * Uses memoized dynamic styles pattern for consistent theming
 */
const createStyles = (t: Tokens) => ({
  container: {
    flex: 1,
  } as ViewStyle,
  contentContainer: {
    paddingBottom: t.spacing['5xl'],
  } as ViewStyle,
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.md,
  } as ViewStyle,
  loadingText: {
    fontSize: safeScaledFontSize(t.fontSize.base),
    fontWeight: t.fontWeight.medium,
  } as TextStyle,
  title: {
    fontSize: safeScaledFontSize(t.fontSize['4xl'] - 4), // 32px hero title (between 3xl and 4xl)
    fontWeight: t.fontWeight.bold,
    letterSpacing: t.letterSpacing.tight,
    marginBottom: t.spacing.xs,
  } as TextStyle,
  subtitle: {
    fontSize: safeScaledFontSize(t.fontSize.sm + 1), // 15px (close to sm=14)
    fontWeight: t.fontWeight.medium,
    marginBottom: t.spacing.lg,
  } as TextStyle,
  heroCard: {
    marginBottom: t.spacing.md,
  } as ViewStyle,
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  heroIconContainer: {
    width: t.containerSize.icon.xl,
    height: t.containerSize.icon.xl,
    borderRadius: t.borderRadius['2xl'],
    overflow: 'hidden',
    marginRight: t.spacing.md,
  } as ViewStyle,
  heroIconGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  heroTextContainer: {
    flex: 1,
  } as ViewStyle,
  heroLabel: {
    fontSize: safeScaledFontSize(t.fontSize.sm),
    fontWeight: t.fontWeight.medium,
    marginBottom: t.spacing.xs,
  } as TextStyle,
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  } as ViewStyle,
  heroValue: {
    fontSize: safeScaledFontSize(t.containerSize.icon.lg), // 48px - matches large hero values
    fontWeight: t.fontWeight.bold,
    letterSpacing: t.letterSpacing.tighter,
    ...Platform.select({
      ios: { fontFamily: 'Menlo' },
      android: { fontFamily: 'monospace' },
    }),
  } as TextStyle,
  heroUnit: {
    fontSize: safeScaledFontSize(t.fontSize.xl),
    fontWeight: t.fontWeight.medium,
    marginLeft: t.spacing.xs,
  } as TextStyle,
  gridContainer: {
    gap: t.spacing.base,
    marginBottom: t.spacing.md,
  } as ViewStyle,
  gridRow: {
    flexDirection: 'row',
    gap: t.spacing.base,
  } as ViewStyle,
  gridItem: {
    flex: 1,
  } as ViewStyle,
  windCard: {
    marginBottom: t.spacing.md,
  } as ViewStyle,
  windContent: {} as ViewStyle,
  windHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    marginBottom: t.spacing.md,
  } as ViewStyle,
  windLabel: {
    fontSize: safeScaledFontSize(t.fontSize.sm),
    fontWeight: t.fontWeight.semibold,
  } as TextStyle,
  windRow: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  windItem: {
    flex: 1,
    alignItems: 'center',
  } as ViewStyle,
  windItemLabel: {
    fontSize: safeScaledFontSize(t.fontSize.xs),
    fontWeight: t.fontWeight.medium,
    marginBottom: t.spacing.xs,
  } as TextStyle,
  windItemValue: {
    fontSize: safeScaledFontSize(t.fontSize['2xl']),
    fontWeight: t.fontWeight.bold,
    ...Platform.select({
      ios: { fontFamily: 'Menlo' },
      android: { fontFamily: 'monospace' },
    }),
  } as TextStyle,
  windDivider: {
    width: t.borderWidth.thin,
    height: t.containerSize.input.md, // 40px divider height
    marginHorizontal: t.spacing.md,
  } as ViewStyle,
  freshness: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.sm,
  } as ViewStyle,
  freshnessIndicator: {
    width: t.spacing.sm,
    height: t.spacing.sm,
    borderRadius: t.borderRadius.full, // Perfect circle
  } as ViewStyle,
  freshnessText: {
    fontSize: safeScaledFontSize(t.fontSize.xs),
    fontWeight: t.fontWeight.medium,
  } as TextStyle,
});
