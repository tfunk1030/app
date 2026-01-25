// src/features/wind/screen.tsx

import { Button } from '@/src/core/components/ui/button';
import { Card } from '@/src/core/components/ui/card';
import { Slider } from '@/src/core/components/ui/slider';
import { usePremium } from '@/src/features/settings/context/premium';
import WindDirectionCompass from '@/src/features/wind/components/compass';
import { WindWeatherBar } from '@/src/features/wind/components/wind-weather-bar';
import { WindCalculationResults } from '@/src/features/wind/components/WindCalculationResults';
import { WindHourlyForecastBar } from '@/src/features/wind/components/WindHourlyForecastBar';
import { CompassLockProvider, useCompassLock } from '@/src/features/wind/context/compass-lock';
import { useSensorData } from '@/src/features/wind/context/sensor-data';
import { useWindCalculator } from '@/src/features/wind/hooks/useWindCalculator';
import { useEnhancedEnvironmental } from '@/src/providers/EnhancedEnvironmentalProvider';
import { tokens } from '@/src/theme/tokens';
import { LogManager } from '@/src/utils/LogManager';
import { scaledFontSize } from '@/src/utils/responsive';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

// Create a logger for the wind screen
const logger = LogManager.getLogger('WindScreen');

// Wind calculation component
function WindCalculatorComponent() {
  // Get all required hooks
  const { isPremium } = usePremium();
  const { conditions, isLoading: envLoading } = useEnhancedEnvironmental();
  const { relativeWindAngle } = useCompassLock();
  const { isLoading, windSpeed, setWindSpeed, targetYardage, setTargetYardage, result, calculate } =
    useWindCalculator();

  // Handle calculation button press
  const handleCalculate = () => {
    logger.info('Calculate button pressed', {
      windSpeed,
      targetYardage,
      windAngle: relativeWindAngle,
    });
    calculate(relativeWindAngle);
  };

  // Premium check
  if (!isPremium) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.premiumText}>Wind calculator is a premium feature</Text>
        <Button
          onPress={() => {}} // Handle premium upgrade
          variant="default"
          size="lg"
          style={{ marginTop: 16 }}
        >
          Upgrade to Premium
        </Button>
      </View>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading conditions...</Text>
      </View>
    );
  }

  // Error state
  if (!conditions) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Unable to load conditions</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Wind Calculator</Text>

      {/* Weather Bar */}
      <WindHourlyForecastBar />
      <WindWeatherBar />

      {/* Main Calculator Card */}
      <Card style={styles.mainCard}>
        {/* Wind Direction Compass */}
        <View style={styles.compassContainer}>
          <View style={styles.compassInstructions}>
            <Text style={styles.compassHint}>
              Point phone in shot direction and tap lock to set reference
            </Text>
          </View>
          <View style={styles.compassWrapper}>
            <View style={styles.compassGlow} />
            <WindDirectionCompass size={280} />
          </View>
        </View>

        {/* Wind Speed Slider */}
        <View style={styles.inputGroup}>
          <Slider
            value={windSpeed}
            onValueChange={setWindSpeed}
            min={0}
            max={50}
            step={1}
            label="Wind Speed"
            unit=" mph"
          />
        </View>

        {/* Target Yardage Slider */}
        <View style={styles.inputGroup}>
          <Slider
            value={targetYardage}
            onValueChange={setTargetYardage}
            min={50}
            max={300}
            step={1}
            label="Target Yardage"
            unit=" yards"
          />
        </View>

        {/* Calculate Button */}
        <Button
          onPress={handleCalculate}
          variant="default"
          size="lg"
          style={styles.calculateButton}
        >
          Calculate Wind Effect
        </Button>
      </Card>

      {/* Results Panel - with the enhanced results component */}
      {result && <WindCalculationResults result={result} />}
    </ScrollView>
  );
}

// Wind calculator screen with compass lock provider
function WindCalculatorScreen() {
  const [error, setError] = useState<Error | null>(null);
  const { conditions } = useEnhancedEnvironmental();
  const { heading } = useSensorData();

  // Error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>An error occurred while loading the wind calculator</Text>
        <Text style={[styles.errorText, { fontSize: 12, marginTop: 8 }]}>
          {error?.message || 'Unknown error'}
        </Text>
        <Button
          onPress={() => setError(null)}
          variant="default"
          size="lg"
          style={{ marginTop: 16 }}
        >
          Try Again
        </Button>
      </View>
    );
  }

  // Wrap calculator in compass lock provider
  return (
    <CompassLockProvider
      currentHeading={heading || 0}
      windDirection={conditions?.windDirection || 0}
    >
      <WindCalculatorComponent />
    </CompassLockProvider>
  );
}

// Main screen wrapper with initialization
export default function WindScreen() {
  const [initialized, setInitialized] = useState(false);

  // Handle initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialized(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (!initialized) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Initializing wind calculator...</Text>
      </View>
    );
  }

  return <WindCalculatorScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContent: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: scaledFontSize(24),
    fontWeight: 'bold',
    color: tokens.colors.textPrimary,
    marginBottom: 24,
    // avoid additional shadows in light mode to reduce glare
  },
  mainCard: {
    marginBottom: 16,
    padding: 24,
    backgroundColor: tokens.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    overflow: 'hidden',
  },
  compassContainer: {
    marginBottom: 48,  // Increased from 24 to push sliders down
    alignItems: 'center',
  },
  compassInstructions: {
    marginBottom: 8,
  },
  compassHint: {
    fontSize: scaledFontSize(12),
    color: tokens.colors.textMuted,
    textAlign: 'center',
    opacity: 0.75,
  },
  compassWrapper: {
    position: 'relative',
  },
  compassGlow: { position: 'absolute', inset: -20, opacity: 0.05, borderRadius: 999, zIndex: -1 },
  inputGroup: {
    marginBottom: 24,
    backgroundColor: tokens.colors.surfaceAlt,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  calculateButton: {
    backgroundColor: tokens.colors.brand,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: tokens.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  loadingText: {
    color: tokens.colors.textPrimary,
    fontSize: scaledFontSize(16),
  },
  errorText: {
    color: tokens.colors.danger,
    fontSize: scaledFontSize(16),
  },
  premiumText: {
    color: tokens.colors.textPrimary,
    fontSize: scaledFontSize(18),
    textAlign: 'center',
  },
});
