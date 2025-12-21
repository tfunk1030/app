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
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../../core/context/settings';

export default function WeatherScreen() {
  const { conditions } = useEnhancedEnvironmental();
  const { formatTemperature, formatAltitude } = useSettings();
  const tokens = useTokens();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark' || mode === 'system';
  const insets = useSafeAreaInsets();
  const { headerEntering, cardEntering } = useAccessibleAnimations();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const padding = getScrollPadding(16, { minPadding: 12, maxPadding: 20 });

  if (!isLoaded || !conditions) {
    return (
      <View style={[styles.container, { backgroundColor: tokens.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Cloud size={48} color={tokens.colors.textMuted} />
          <Text style={[styles.loadingText, { color: tokens.colors.textMuted }]}>
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
      style={[styles.container, { backgroundColor: tokens.colors.background }]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top + 16, paddingHorizontal: padding },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={headerEntering}>
        <Text style={[styles.title, { color: tokens.colors.textPrimary }]}>
          Current Conditions
        </Text>
        <Text style={[styles.subtitle, { color: tokens.colors.textMuted }]}>
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
                { backgroundColor: `${tokens.colors.brand}15` },
              ]}
            >
              <LinearGradient
                colors={tokens.gradients.primary as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroIconGradient}
              >
                <Thermometer size={32} color={tokens.colors.textPrimary} />
              </LinearGradient>
            </View>
            <View style={styles.heroTextContainer}>
              <Text style={[styles.heroLabel, { color: tokens.colors.textMuted }]}>
                Temperature
              </Text>
              <View style={styles.heroValueRow}>
                <Text style={[styles.heroValue, { color: tokens.colors.textPrimary }]}>
                  {tempValue}
                </Text>
                <Text style={[styles.heroUnit, { color: tokens.colors.textMuted }]}>
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
            icon={<Droplets size={18} color={tokens.colors.brandAlt} />}
            label="Humidity"
            value={conditions.humidity.toFixed(0)}
            unit="%"
            style={styles.gridItem}
          />
          <MetricTile
            icon={<Mountain size={18} color={tokens.colors.brandAlt} />}
            label="Altitude"
            value={altValue}
            unit={altUnit}
            style={styles.gridItem}
          />
        </View>

        <View style={styles.gridRow}>
          <MetricTile
            icon={<Gauge size={18} color={tokens.colors.brandAlt} />}
            label="Pressure"
            value={conditions.pressure.toFixed(0)}
            unit="hPa"
            style={styles.gridItem}
            highlight={isDark}
          />
          <MetricTile
            icon={<Wind size={18} color={tokens.colors.brandAlt} />}
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
              <Wind size={20} color={tokens.colors.brandAlt} />
              <Text style={[styles.windLabel, { color: tokens.colors.textMuted }]}>
                Wind Conditions
              </Text>
            </View>
            <View style={styles.windRow}>
              <View style={styles.windItem}>
                <Text style={[styles.windItemLabel, { color: tokens.colors.textMuted }]}>
                  Speed
                </Text>
                <Text style={[styles.windItemValue, { color: tokens.colors.textPrimary }]}>
                  {(conditions.windSpeed || 0).toFixed(1)} mph
                </Text>
              </View>
              <View style={[styles.windDivider, { backgroundColor: tokens.colors.border }]} />
              <View style={styles.windItem}>
                <Text style={[styles.windItemLabel, { color: tokens.colors.textMuted }]}>
                  Direction
                </Text>
                <Text style={[styles.windItemValue, { color: tokens.colors.textPrimary }]}>
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
            { backgroundColor: tokens.colors.successGlow },
          ]}
        />
        <Text style={[styles.freshnessText, { color: tokens.colors.textMuted }]}>
          Data updated just now
        </Text>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: safeScaledFontSize(16),
    fontWeight: '500',
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
  heroCard: {
    marginBottom: 16,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 16,
  },
  heroIconGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextContainer: {
    flex: 1,
  },
  heroLabel: {
    fontSize: safeScaledFontSize(14),
    fontWeight: '500',
    marginBottom: 4,
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  heroValue: {
    fontSize: safeScaledFontSize(48),
    fontWeight: '700',
    letterSpacing: -1,
    ...Platform.select({
      ios: { fontFamily: 'Menlo' },
      android: { fontFamily: 'monospace' },
    }),
  },
  heroUnit: {
    fontSize: safeScaledFontSize(20),
    fontWeight: '500',
    marginLeft: 4,
  },
  gridContainer: {
    gap: 12,
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridItem: {
    flex: 1,
  },
  windCard: {
    marginBottom: 16,
  },
  windContent: {},
  windHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  windLabel: {
    fontSize: safeScaledFontSize(14),
    fontWeight: '600',
  },
  windRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  windItem: {
    flex: 1,
    alignItems: 'center',
  },
  windItemLabel: {
    fontSize: safeScaledFontSize(12),
    fontWeight: '500',
    marginBottom: 4,
  },
  windItemValue: {
    fontSize: safeScaledFontSize(24),
    fontWeight: '700',
    ...Platform.select({
      ios: { fontFamily: 'Menlo' },
      android: { fontFamily: 'monospace' },
    }),
  },
  windDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
  },
  freshness: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  freshnessIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  freshnessText: {
    fontSize: safeScaledFontSize(12),
    fontWeight: '500',
  },
});
