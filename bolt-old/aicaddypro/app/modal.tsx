import { GlassCard } from '@/src/core/components/ui/GlassCard';
import { SectionHeader } from '@/src/core/components/ui/SectionHeader';
import { useEnhancedEnvironmental } from '@/src/providers/EnhancedEnvironmentalProvider';
import { useTokens } from '@/src/theme/useTokens';
import { LogManager } from '@/src/utils/LogManager';
import React from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

const logger = LogManager.getLogger('DebugModal');

export default function DebugModal() {
  const { conditions, isActive, throttlingStatus, lastUpdatedTimestamp, forceRefresh } =
    useEnhancedEnvironmental();
  const tokens = useTokens();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await forceRefresh();
    } catch (e) {
      logger.error('Manual refresh failed', e as Error);
    } finally {
      setRefreshing(false);
    }
  }, [forceRefresh]);

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <GlassCard style={styles.card}>
          <SectionHeader title="Environment (normalized)" />
          <Text style={[styles.item, styles.mono, { color: tokens.colors.textPrimary }]}>
            {JSON.stringify(
              {
                temp_F: Math.round(conditions?.temperature ?? 0),
                humidity_pct: Math.round(conditions?.humidity ?? 0),
                pressure_hpa: Math.round(conditions?.pressure ?? 0),
                altitude_ft: Math.round(conditions?.altitude ?? 0),
                wind_mph: Math.round(conditions?.windSpeed ?? 0),
                wind_dir_deg: Math.round(conditions?.windDirection ?? 0),
                gust_mph: Math.round(conditions?.windGust ?? 0),
                density: conditions?.density ?? 0,
                obTime: conditions?.obTime,
              },
              null,
              2
            )}
          </Text>
        </GlassCard>

        <GlassCard style={styles.card}>
          <SectionHeader title="Throttling Status" />
          <Text style={[styles.item, styles.mono, { color: tokens.colors.textPrimary }]}>
            {JSON.stringify(throttlingStatus, null, 2)}
          </Text>
          {(() => {
            const provider = (throttlingStatus as any)?.provider;
            const label = provider ? `Provider: ${provider}` : null;
            return label ? (
              <Text style={[styles.item, { color: tokens.colors.textMuted }]}>{label}</Text>
            ) : null;
          })()}
          <Text style={[styles.item, { color: tokens.colors.textMuted }]}>
            Active: {String(isActive)}
          </Text>
          <Text style={[styles.item, { color: tokens.colors.textMuted }]}>
            Last Updated:{' '}
            {lastUpdatedTimestamp ? new Date(lastUpdatedTimestamp).toLocaleString() : '—'}
          </Text>
          {conditions?.obTime ? (
            <Text style={[styles.item, { color: tokens.colors.textMuted }]}>
              Obs Time: {conditions.obTime}
            </Text>
          ) : null}
          {(() => {
            // Simple indicator if METAR blend likely applied: provider open-meteo/stormglass + useMetar flag is true
            // We cannot read settings here directly; show hint when provider is forecast and obTime exists
            const usedProvider = (throttlingStatus as any)?.provider;
            const mayBlend =
              usedProvider === 'stormglass' ||
              usedProvider === 'open-meteo' ||
              usedProvider === 'nws';
            return mayBlend ? (
              <Text style={[styles.item, { color: tokens.colors.textMuted }]}>
                METAR blend: check Settings ▸ Use METAR
              </Text>
            ) : null;
          })()}
        </GlassCard>

        <GlassCard style={styles.card}>
          <SectionHeader title="Actions" />
          <Text
            onPress={onRefresh}
            accessibilityRole="button"
            style={[styles.button, { color: tokens.colors.brand }]}
          >
            Force Refresh
          </Text>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    marginBottom: 12,
  },
  item: {
    fontSize: 12,
    marginTop: 4,
  },
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  button: {
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: 4,
  },
});
