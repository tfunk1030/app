/**
 * DualResultCard Component
 *
 * Shows both sustained and gust wind calculation results stacked vertically.
 * Used when gusts are significantly higher than sustained wind.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTokens } from '@/src/theme/useTokens';
import { safeScaledFontSize } from '@/src/utils/responsive';

interface DualResultCardProps {
  /** Effective playing distance for sustained wind */
  sustainedDistance: number;
  /** Effective playing distance for gust wind */
  gustDistance?: number;
  /** Unit label (e.g., 'yds', 'm') */
  unit: string;
}

export function DualResultCard({ sustainedDistance, gustDistance, unit }: DualResultCardProps) {
  const t = useTokens();

  const hasGusts = gustDistance !== undefined && gustDistance !== sustainedDistance;
  const difference = hasGusts ? Math.abs(gustDistance - sustainedDistance) : 0;

  return (
    <View
      style={styles.container}
      accessibilityRole="summary"
      accessibilityLabel={
        hasGusts
          ? `Wind results: Sustained ${Math.round(sustainedDistance)} ${unit}, Gusts ${Math.round(gustDistance || 0)} ${unit}`
          : `Wind result: ${Math.round(sustainedDistance)} ${unit}`
      }
    >
      {/* Sustained Result - Stacked Row */}
      <View style={styles.resultColumn}>
        <View style={styles.labelRow}>
          <MaterialCommunityIcons name="weather-windy" size={16} color={t.colors.brand} />
          <Text style={[styles.label, { color: t.colors.textMuted }]}>Sustained</Text>
        </View>
        <Text
          style={[styles.value, { color: t.colors.brand }]}
          accessibilityLabel={`Sustained wind: ${Math.round(sustainedDistance)} ${unit}`}
        >
          {Math.round(sustainedDistance)} <Text style={styles.unit}>{unit}</Text>
        </Text>
      </View>

      {/* Horizontal Divider */}
      {hasGusts && (
        <View style={[styles.divider, { backgroundColor: t.colors.border }]} />
      )}

      {/* Gust Result - Stacked Row */}
      {hasGusts && gustDistance && (
        <View style={styles.resultColumn}>
          <View style={styles.labelRow}>
            <MaterialCommunityIcons name="weather-windy-variant" size={16} color={t.colors.warning} />
            <Text style={[styles.label, { color: t.colors.warning }]}>Gusts</Text>
            {difference > 0 && (
              <Text style={[styles.difference, { color: t.colors.textMuted }]}>
                ({gustDistance > sustainedDistance ? '+' : '-'}{Math.round(difference)})
              </Text>
            )}
          </View>
          <Text
            style={[styles.value, { color: t.colors.warning }]}
            accessibilityLabel={`Wind gusts: ${Math.round(gustDistance)} ${unit}`}
          >
            {Math.round(gustDistance)} <Text style={styles.unit}>{unit}</Text>
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  resultColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: safeScaledFontSize(13),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: safeScaledFontSize(28),
    fontWeight: '700',
  },
  unit: {
    fontSize: safeScaledFontSize(14),
    fontWeight: '500',
  },
  difference: {
    fontSize: safeScaledFontSize(11),
    marginLeft: 8,
  },
  divider: {
    height: 1,
    width: '100%',
  },
});

DualResultCard.displayName = 'DualResultCard';

export default React.memo(DualResultCard);
