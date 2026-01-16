/**
 * WindMagnitudeLegend Component
 *
 * Minimal icon-based legend showing current wind speed.
 * Non-intrusive placement below compass with accessibility support.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Wind } from 'lucide-react-native';
import { WindMagnitudeLegendProps } from './types';

const WindMagnitudeLegend: React.FC<WindMagnitudeLegendProps> = ({
  windSpeed,
  unit,
  colors,
}) => {
  return (
    <View
      style={styles.container}
      accessibilityRole="text"
      accessibilityLabel={`Wind speed: ${windSpeed} ${unit}`}
    >
      <Wind size={14} color={colors.icon} />
      <Text style={[styles.value, { color: colors.text }]}>
        {windSpeed}
      </Text>
      <Text style={[styles.unit, { color: colors.subtext }]}>
        {unit}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default React.memo(WindMagnitudeLegend);
