// src/features/wind/screen.tsx

import { Button } from '@/src/core/components/ui/button';
import { GlassCard } from '@/src/core/components/ui/GlassCard';
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
import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import { LogManager } from '@/src/utils/LogManager';
import { safeScaledFontSize, getScrollPadding } from '@/src/utils/responsive';
import { useAccessibleAnimations } from '@/src/hooks/useAccessibility';
import { Crown, Wind } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Create a logger for the wind screen
const logger = LogManager.getLogger('WindScreen');

// Quick yardage presets
const YARDAGE_PRESETS = [100, 125, 150, 175, 200];

interface YardagePresetButtonProps {
  value: number;
  isSelected: boolean;
  onPress: () => void;
  tokens: ReturnType<typeof useTokens>;
}

const YardagePresetButton = React.memo<YardagePresetButtonProps>(({
  value,
  isSelected,
  onPress,
  tokens,
}) => (
  <Pressable
    onPress={onPress}
    style={[
      styles.presetButton,
      {
        backgroundColor: isSelected ? `${tokens.colors.brand}20` : tokens.colors.surfaceAlt,
        borderColor: isSelected ? tokens.colors.brand : tokens.colors.border,
      },
    ]}
  >
    <Text
      style={[
        styles.presetButtonText,
        {
          color: isSelected ? tokens.colors.brand : tokens.colors.textMuted,
        },
      ]}
    >
      {value}
    </Text>
  </Pressable>
));

// Wind calculation component
function WindCalculatorComponent() {
  // Get all required hooks
  const { isPremium } = usePremium();
  const { conditions, isLoading: envLoading } = useEnhancedEnvironmental();
  const { relativeWindAngle } = useCompassLock();
  const { isLoading, windSpeed, setWindSpeed, targetYardage, setTargetYardage, result, calculate } =
    useWindCalculator();
  const tokens = useTokens();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark' || mode === 'system';
  const insets = useSafeAreaInsets();
  const { headerEntering, cardEntering } = useAccessibleAnimations();

  const padding = getScrollPadding(16, { minPadding: 12, maxPadding: 20 });

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
      <View style={[styles.container, styles.centerContent, { backgroundColor: tokens.colors.background }]}>
        <Animated.View entering={headerEntering} style={styles.premiumContainer}>
          <View style={[styles.premiumIconContainer, { backgroundColor: `${tokens.colors.brand}20` }]}>
            <Crown size={48} color={tokens.colors.brand} />
          </View>
          <Text style={[styles.premiumTitle, { color: tokens.colors.textPrimary }]}>
            Premium Feature
          </Text>
          <Text style={[styles.premiumText, { color: tokens.colors.textMuted }]}>
            Wind calculator is available with premium
          </Text>
          <Button
            onPress={() => {}} // Handle premium upgrade
            variant="neon"
            size="lg"
            style={styles.premiumButton}
          >
            Upgrade to Premium
          </Button>
        </Animated.View>
      </View>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: tokens.colors.background }]}>
        <View style={[styles.loadingPulse, { backgroundColor: tokens.colors.surfaceAlt }]} />
        <View style={[styles.loadingPulse, { backgroundColor: tokens.colors.surfaceAlt, width: '60%' }]} />
      </View>
    );
  }

  // Error state
  if (!conditions) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: tokens.colors.background }]}>
        <Wind size={48} color={tokens.colors.textMuted} />
        <Text style={[styles.errorText, { color: tokens.colors.textMuted }]}>
          Unable to load conditions
        </Text>
      </View>
    );
  }

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
        <Text style={[styles.title, { color: tokens.colors.textPrimary }]}>Wind Calculator</Text>
        <Text style={[styles.subtitle, { color: tokens.colors.textMuted }]}>
          Calculate wind effect on your shot
        </Text>
      </Animated.View>

      {/* Weather Bars - Collapsible sections */}
      <Animated.View entering={cardEntering(0)}>
        <WindHourlyForecastBar />
      </Animated.View>

      <Animated.View entering={cardEntering(1)}>
        <WindWeatherBar />
      </Animated.View>

      {/* Compass Card */}
      <Animated.View entering={cardEntering(2)}>
        <GlassCard gradient glow style={styles.compassCard}>
          <Text style={[styles.compassHint, { color: tokens.colors.textMuted }]}>
            Point phone in shot direction and tap lock
          </Text>
          <View style={styles.compassWrapper}>
            <WindDirectionCompass size={260} />
          </View>
        </GlassCard>
      </Animated.View>

      {/* Wind Speed Slider */}
      <Animated.View entering={cardEntering(3)}>
        <GlassCard style={styles.sliderCard}>
          <Slider
            value={windSpeed}
            onValueChange={setWindSpeed}
            min={0}
            max={50}
            step={1}
            label="Wind Speed"
            unit="mph"
          />
        </GlassCard>
      </Animated.View>

      {/* Target Yardage Section */}
      <Animated.View entering={cardEntering(4)}>
        <GlassCard style={styles.yardageCard}>
          <Slider
            value={targetYardage}
            onValueChange={setTargetYardage}
            min={50}
            max={300}
            step={1}
            label="Target Yardage"
            unit="yds"
          />

          {/* Quick Presets */}
          <View style={[styles.presetsContainer, { borderTopColor: tokens.colors.border }]}>
            <Text style={[styles.presetsLabel, { color: tokens.colors.textMuted }]}>
              Quick Select
            </Text>
            <View style={styles.presetsRow}>
              {YARDAGE_PRESETS.map((preset) => (
                <YardagePresetButton
                  key={preset}
                  value={preset}
                  isSelected={targetYardage === preset}
                  onPress={() => setTargetYardage(preset)}
                  tokens={tokens}
                />
              ))}
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Calculate Button */}
      <Animated.View entering={cardEntering(5)}>
        <Button
          onPress={handleCalculate}
          variant="neon"
          size="lg"
          glow
          style={styles.calculateButton}
        >
          Calculate Wind Effect
        </Button>
      </Animated.View>

      {/* Results Panel */}
      {result && (
        <Animated.View entering={cardEntering(0)}>
          <WindCalculationResults result={result} />
        </Animated.View>
      )}
    </ScrollView>
  );
}

// Wind calculator screen with compass lock provider
function WindCalculatorScreen() {
  const [error, setError] = useState<Error | null>(null);
  const { conditions } = useEnhancedEnvironmental();
  const { heading } = useSensorData();
  const tokens = useTokens();
  const insets = useSafeAreaInsets();
  const { headerEntering } = useAccessibleAnimations();

  // Error state
  if (error) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: tokens.colors.background, paddingTop: insets.top },
        ]}
      >
        <Animated.View entering={headerEntering} style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: tokens.colors.danger }]}>
            Something went wrong
          </Text>
          <Text style={[styles.errorMessage, { color: tokens.colors.textMuted }]}>
            {error?.message || 'Unknown error'}
          </Text>
          <Button
            onPress={() => setError(null)}
            variant="neon"
            size="lg"
            style={styles.retryButton}
          >
            Try Again
          </Button>
        </Animated.View>
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
  const tokens = useTokens();
  const { headerEntering } = useAccessibleAnimations();

  // Handle initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialized(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  if (!initialized) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: tokens.colors.background }]}>
        <Animated.View entering={headerEntering}>
          <Wind size={32} color={tokens.colors.textMuted} />
        </Animated.View>
      </View>
    );
  }

  return <WindCalculatorScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
  compassCard: {
    marginBottom: 16,
    alignItems: 'center',
  },
  compassHint: {
    fontSize: safeScaledFontSize(12),
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.8,
  },
  compassWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderCard: {
    marginBottom: 16,
  },
  yardageCard: {
    marginBottom: 16,
  },
  presetsContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    // Note: borderTopColor is set dynamically in component via tokens.colors.border
  },
  presetsLabel: {
    fontSize: safeScaledFontSize(12),
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetButtonText: {
    fontSize: safeScaledFontSize(14),
    fontWeight: '600',
    ...Platform.select({
      ios: { fontFamily: 'Menlo' },
      android: { fontFamily: 'monospace' },
    }),
  },
  calculateButton: {
    marginBottom: 16,
  },
  loadingPulse: {
    borderRadius: 12,
    marginBottom: 16,
    height: 32,
    width: '80%',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: safeScaledFontSize(20),
    fontWeight: '700',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: safeScaledFontSize(14),
    textAlign: 'center',
    marginBottom: 24,
  },
  errorText: {
    fontSize: safeScaledFontSize(16),
    marginTop: 16,
  },
  retryButton: {
    minWidth: 160,
  },
  premiumContainer: {
    alignItems: 'center',
    padding: 32,
  },
  premiumIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  premiumTitle: {
    fontSize: safeScaledFontSize(24),
    fontWeight: '700',
    marginBottom: 8,
  },
  premiumText: {
    fontSize: safeScaledFontSize(16),
    textAlign: 'center',
    marginBottom: 24,
  },
  premiumButton: {
    minWidth: 200,
  },
});
