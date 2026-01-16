/**
 * DualResultCard Component
 *
 * Shows both sustained and gust wind calculation results side by side.
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
      {/* Sustained Result */}
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

      {/* Divider */}
      {hasGusts && (
        <View style={[styles.divider, { backgroundColor: t.colors.border }]} />
      )}

      {/* Gust Result */}
      {hasGusts && gustDistance && (
        <View style={styles.resultColumn}>
          <View style={styles.labelRow}>
            <MaterialCommunityIcons name="weather-windy-variant" size={16} color={t.colors.warning} />
            <Text style={[styles.label, { color: t.colors.warning }]}>Gusts</Text>
          </View>
          <Text
            style={[styles.value, { color: t.colors.warning }]}
            accessibilityLabel={`Wind gusts: ${Math.round(gustDistance)} ${unit}`}
          >
            {Math.round(gustDistance)} <Text style={styles.unit}>{unit}</Text>
          </Text>
          {difference > 0 && (
            <Text style={[styles.difference, { color: t.colors.textMuted }]}>
              ({gustDistance > sustainedDistance ? '+' : '-'}{Math.round(difference)} range)
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  resultColumn: {
    flex: 1,
    alignItems: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  label: {
    fontSize: safeScaledFontSize(12),
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
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: '100%',
    marginHorizontal: 16,
  },
});

DualResultCard.displayName = 'DualResultCard';

export default React.memo(DualResultCard);
