import { useEnhancedEnvironmental } from '@/src/providers/EnhancedEnvironmentalProvider';
import { tokens } from '@/src/theme/tokens';
import { scaledFontSize } from '@/src/utils/responsive';
import { Droplets, Gauge, Mountain, Thermometer, Wind } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSettings } from '../../core/context/settings';

export default function WeatherScreen() {
  const { conditions } = useEnhancedEnvironmental();
  const { formatTemperature, formatAltitude } = useSettings();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (!isLoaded || !conditions) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading conditions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Current Conditions</Text>

      <View style={styles.mainCard}>
        <View style={styles.temperatureContainer}>
          <View style={styles.iconWrapper}>
            <Thermometer size={24} color={tokens.colors.brandAlt} />
          </View>
          <Text style={styles.temperatureText}>{formatTemperature(conditions.temperature)}</Text>
        </View>
      </View>

      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          <ConditionItem
            icon={<Droplets size={20} color={tokens.colors.brandAlt} />}
            label="Humidity"
            value={`${conditions.humidity.toFixed(0)}%`}
          />
          <ConditionItem
            icon={<Mountain size={20} color={tokens.colors.brandAlt} />}
            label="Altitude"
            value={formatAltitude(conditions.altitude)}
          />
        </View>

        <View style={styles.gridRow}>
          <ConditionItem
            icon={<Gauge size={20} color={tokens.colors.brandAlt} />}
            label="Pressure"
            value={`${conditions.pressure.toFixed(0)} hPa`}
          />
          <ConditionItem
            icon={<Wind size={20} color={tokens.colors.brandAlt} />}
            label="Air Density"
            value={`${conditions.density?.toFixed(3)} kg/m³`}
          />
        </View>
      </View>
    </View>
  );
}

const ConditionItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <View style={styles.conditionCard}>
    <View style={styles.conditionHeader}>
      <View style={styles.iconWrapper}>{icon}</View>
      <Text style={styles.conditionLabel}>{label}</Text>
    </View>
    <Text style={styles.conditionValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: tokens.colors.background },
  title: {
    fontSize: scaledFontSize(28),
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginBottom: 24,
    textAlign: 'center',
  },
  mainCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    shadowColor: tokens.colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  temperatureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  temperatureText: {
    fontSize: scaledFontSize(32),
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  gridContainer: {
    flexDirection: 'column',
    gap: 16,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  conditionCard: {
    flex: 1,
    backgroundColor: tokens.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    shadowColor: tokens.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  conditionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  conditionLabel: {
    color: tokens.colors.textMuted,
    fontSize: scaledFontSize(14),
    marginLeft: 8,
  },
  conditionValue: {
    color: tokens.colors.textPrimary,
    fontSize: scaledFontSize(18),
    fontWeight: '600',
    marginLeft: 8,
  },
});
