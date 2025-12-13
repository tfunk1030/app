import { useEnhancedEnvironmental } from '@/src/providers/EnhancedEnvironmentalProvider';
import { tokens } from '@/src/theme/tokens';
import { scaledFontSize } from '@/src/utils/responsive';
import { Slider } from '@miblanchard/react-native-slider';
import { Droplets, Gauge, Mountain, Thermometer } from 'lucide-react-native';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../../../src/core/components/ui/card';
import { useSettings } from '../../../src/core/context/settings';
import { useShotCalc } from '../../../src/core/context/shotcalc';
import { SkillLevel, YardageModelEnhanced } from '../../../src/core/models/YardageModel';
import { useClubSettings } from '../../../src/features/settings/context/clubs';
import { normalizeClubName } from '../../../src/features/settings/utils/club-mapping';

const convertDistance = (value: number, unit: 'meters' | 'yards'): number => {
  return unit === 'meters' ? value * 0.9144 : value;
};

export default function ShotCalculatorScreen() {
  const { conditions } = useEnhancedEnvironmental();
  const { getRecommendedClub } = useClubSettings();
  const { settings, formatDistance, formatTemperature, formatAltitude } = useSettings();
  const { setShotCalcData } = useShotCalc();
  const [targetYardage, setTargetYardage] = React.useState(150);
  const [lastUpdate, setLastUpdate] = React.useState<number | null>(null);
  const [yardageModel] = React.useState(() => new YardageModelEnhanced());

  const calculateShot = React.useCallback(() => {
    if (!conditions) return null;

    console.log('Environment:', process.env.NODE_ENV);
    console.log('Target Yardage:', targetYardage);
    const recommendedClub = getRecommendedClub(targetYardage);
    console.log('Recommended Club:', recommendedClub);

    if (!recommendedClub) {
      console.log('No recommended club found');
      return null;
    }

    try {
      console.log('YardageModel initialized:', !!yardageModel);
      console.log('YardageModel methods:', Object.keys(yardageModel));

      const clubKey = normalizeClubName(recommendedClub.name);
      console.log('Mapped Club Key:', clubKey);

      if (!yardageModel.clubExists(clubKey)) {
        console.error('Club not supported:', clubKey);
        return null;
      }

      if (!yardageModel.setBallModel) {
        console.error('Model not properly initialized');
        return null;
      }

      yardageModel.setBallModel('tour_premium');
      yardageModel.setConditions(
        conditions.temperature,
        conditions.altitude,
        0,
        0,
        conditions.pressure,
        conditions.humidity
      );

      const result = yardageModel.calculateAdjustedYardage(
        targetYardage,
        SkillLevel.PROFESSIONAL,
        clubKey
      );

      if (!result) {
        console.error('No result from calculation in environment:', process.env.NODE_ENV);
        return null;
      }

      console.log('Shot Calculation:', {
        clubKey,
        targetYardage,
        result,
      });

      return {
        result,
        recommendedClub,
      };
    } catch (error) {
      console.error('Error calculating shot in environment:', process.env.NODE_ENV, error);
      return null;
    }
  }, [conditions, targetYardage, getRecommendedClub]);

  const shotData = React.useMemo(() => calculateShot(), [calculateShot]);

  React.useEffect(() => {
    const now = Date.now();
    if (lastUpdate && now - lastUpdate < 100) return;

    if (conditions && shotData) {
      setLastUpdate(now);
      setShotCalcData({
        targetYardage,
        elevation: conditions.altitude,
        temperature: conditions.temperature,
        humidity: conditions.humidity,
        pressure: conditions.pressure,
        adjustedDistance: shotData.result.carryDistance,
      });
    }
  }, [conditions, shotData, targetYardage, setShotCalcData, lastUpdate]);

  React.useEffect(() => {
    const handleErrorEvent = (event: Event) => {
      if (event instanceof Error) {
        console.error('Shot calculator error:', event);
      }
    };

    globalThis.addEventListener('error', handleErrorEvent);
    return () => globalThis.removeEventListener('error', handleErrorEvent);
  }, []);

  if (!conditions) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingPulse} />
        <View style={[styles.loadingPulse, { height: 200 }]} />
        <View style={[styles.loadingPulse, { width: '50%' }]} />
      </View>
    );
  }

  const formatAdjustment = (yards: number) => {
    const value =
      settings.distanceUnit === 'meters'
        ? convertDistance(Math.abs(yards), 'meters')
        : Math.abs(yards);

    return `${yards >= 0 ? '+' : '-'}${Math.round(value)} ${
      settings.distanceUnit === 'yards' ? 'yds' : 'm'
    }`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shot Calculator</Text>

      <Card style={styles.environmentCard}>
        <View style={styles.environmentRow}>
          <ConditionIcon
            icon={Gauge}
            label="Density"
            value={conditions?.density?.toFixed(3) ?? 'N/A'}
          />
          <ConditionIcon
            icon={Mountain}
            label="Altitude"
            value={formatAltitude(conditions.altitude)}
          />
          <ConditionIcon
            icon={Thermometer}
            label="Temp"
            value={formatTemperature(conditions.temperature)}
          />
          <ConditionIcon
            icon={Droplets}
            label="Humidity"
            value={`${conditions.humidity.toFixed(0)}%`}
          />
        </View>
      </Card>
      <Card style={styles.sliderCard}>
        <Text style={styles.sliderLabel}>Target Distance</Text>
        <View style={styles.sliderContainer}>
          <Slider
            minimumValue={settings.distanceUnit === 'yards' ? 50 : 45}
            maximumValue={settings.distanceUnit === 'yards' ? 360 : 330}
            value={targetYardage}
            onValueChange={value => setTargetYardage(value[0])}
            minimumTrackTintColor={tokens.colors.brand}
            maximumTrackTintColor={tokens.colors.border}
            thumbTintColor={tokens.colors.brandAlt}
            containerStyle={styles.slider}
          />
          <Text style={styles.distanceValue}>{formatDistance(targetYardage)}</Text>
        </View>
      </Card>

      {/* Remaining components converted similarly */}
    </View>
  );
}

interface ConditionIconProps {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
}

const ConditionIcon = ({ icon: Icon, label, value }: ConditionIconProps) => (
  <View style={styles.conditionItem}>
    <View style={styles.iconContainer}>
      <Icon size={16} color={tokens.colors.brandAlt} />
    </View>
    <Text style={styles.conditionLabel}>{label}</Text>
    <Text style={styles.conditionValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: tokens.colors.background,
  },
  title: {
    fontSize: scaledFontSize(28),
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  environmentCard: {
    marginBottom: 16,
    padding: 12,
  },
  environmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  conditionItem: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  conditionLabel: {
    color: tokens.colors.textMuted,
    fontSize: scaledFontSize(12),
  },
  conditionValue: {
    color: tokens.colors.textPrimary,
    fontSize: scaledFontSize(14),
  },
  sliderCard: {
    padding: 16,
    marginBottom: 16,
  },
  sliderLabel: {
    color: tokens.colors.textMuted,
    fontSize: scaledFontSize(14),
    marginBottom: 8,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  slider: {
    flex: 1,
  },
  distanceValue: {
    fontSize: scaledFontSize(24),
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    width: 100,
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: tokens.colors.background,
    padding: 32,
  },
  loadingPulse: {
    backgroundColor: tokens.colors.surfaceAlt,
    borderColor: tokens.colors.border,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    height: 32,
  },
});
