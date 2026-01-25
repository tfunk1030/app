import { GlassCard } from '@/src/core/components/ui/GlassCard';
import { SectionHeader } from '@/src/core/components/ui/SectionHeader';
import { useSettings } from '@/src/core/context/settings';
import { useEnhancedEnvironmental } from '@/src/providers/EnhancedEnvironmentalProvider';
import { useTokens } from '@/src/theme/useTokens';
import { LogManager } from '@/src/utils/LogManager';
import { scaledFontSize } from '@/src/utils/responsive';
import { ArrowUpRight, Compass, Wind } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const logger = LogManager.getLogger('WindWeatherBar');

interface WindItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  rotation?: number;
}

const WindItem: React.FC<WindItemProps> = ({ icon: Icon, label, value, rotation }) => {
  const palette = useTokens();
  return (
    <View style={styles.windItem}>
      <View style={styles.iconContainer}>
        <Icon
          size={20}
          color={palette.colors.brand}
          style={rotation ? { transform: [{ rotate: `${rotation}deg` }] } : undefined}
        />
      </View>
      <Text style={[styles.itemLabel, { color: palette.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.itemValue, { color: palette.colors.textPrimary }]}>{value}</Text>
    </View>
  );
};

export function WindWeatherBar() {
  const { conditions, isLoading, lastUpdatedTimestamp } = useEnhancedEnvironmental();
  const { settings, convertSpeed } = useSettings();

  React.useEffect(() => {
    if (conditions) {
      logger.info('Wind conditions updated:', {
        windSpeed: conditions.windSpeed,
        windDirection: conditions.windDirection,
        windGust: conditions.windGust,
        lastUpdated: lastUpdatedTimestamp,
        obTime: conditions.obTime,
      });
    }
  }, [conditions, lastUpdatedTimestamp]);

  const tokens = useTokens();

  if (isLoading) {
    return (
      <GlassCard style={styles.container}>
        <SectionHeader title="Wind Conditions" />
        <Text style={[styles.loadingText, { color: tokens.colors.textMuted }]}>
          Loading conditions...
        </Text>
      </GlassCard>
    );
  }

  if (!conditions) {
    return (
      <GlassCard style={styles.container}>
        <SectionHeader title="Wind Conditions" />
        <Text style={[styles.errorText, { color: tokens.colors.danger }]}>
          Unable to load conditions
        </Text>
      </GlassCard>
    );
  }

  const formatObservationTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      logger.error('Error formatting observation time:', error);
      return 'N/A';
    }
  };

  const getCardinalDirection = (degrees: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((degrees + 360) % 360) / 45) % 8;
    return directions[index];
  };

  const windSpeed = Math.round(convertSpeed(conditions.windSpeed || 0));
  const windDegrees = Math.round(conditions.windDirection || 0);
  const windDirection = getCardinalDirection(windDegrees);
  const windGust = Math.round(convertSpeed(conditions.windGust || 0));

  return (
    <GlassCard style={styles.container}>
      <SectionHeader title="Wind Conditions" />
      {conditions.obTime && (
        <Text style={[styles.observationTime, { color: tokens.colors.textMuted }]}>
          Observed at {formatObservationTime(conditions.obTime)}
        </Text>
      )}
      <View style={styles.windGrid}>
        <WindItem
          icon={Compass}
          label="Direction"
          value={`${windDegrees}° ${windDirection}`}
          rotation={windDegrees}
        />
        <WindItem
          icon={Wind}
          label="Speed"
          value={`${windSpeed} ${settings.speedUnit === 'mps' ? 'm/s' : settings.speedUnit}`}
        />
        <WindItem
          icon={ArrowUpRight}
          label="Gusts"
          value={`${windGust} ${settings.speedUnit === 'mps' ? 'm/s' : settings.speedUnit}`}
        />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  windGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  windItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemLabel: {
    fontSize: scaledFontSize(12),
    marginBottom: 4,
  },
  itemValue: {
    fontSize: scaledFontSize(14),
    fontWeight: '600',
  },
  loadingText: {
    fontSize: scaledFontSize(16),
    textAlign: 'center',
  },
  errorText: {
    fontSize: scaledFontSize(16),
    textAlign: 'center',
  },
  observationTime: {
    fontSize: scaledFontSize(12),
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.8,
  },
});
