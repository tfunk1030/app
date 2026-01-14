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
import type { Tokens } from '@/src/theme/tokens';
import { useTokens } from '@/src/theme/useTokens';
import { LogManager } from '@/src/utils/LogManager';
import { safeScaledFontSize, getScrollPadding } from '@/src/utils/responsive';
import { useAccessibleAnimations } from '@/src/hooks/useAccessibility';
import { Crown, Wind } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View, ViewStyle, TextStyle, Alert } from 'react-native';
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
  tokens: Tokens;
}

const YardagePresetButton = React.memo<YardagePresetButtonProps>(({
  value,
  isSelected,
  onPress,
  tokens: t,
}) => {
  // Memoized styles for preset button
  const buttonStyle = useMemo((): ViewStyle => ({
    flex: 1,
    minHeight: t.touchTarget.minimum,
    paddingVertical: t.spacing.base,
    paddingHorizontal: t.spacing.sm,
    borderRadius: t.borderRadius.lg,
    borderWidth: t.borderWidth.thin,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isSelected ? t.colors.brandBackgroundAlpha : t.colors.surfaceAlt,
    borderColor: isSelected ? t.colors.brand : t.colors.border,
  }), [t, isSelected]);

  const textStyle = useMemo((): TextStyle => ({
    fontSize: safeScaledFontSize(t.fontSize.sm),
    fontWeight: t.fontWeight.semibold as TextStyle['fontWeight'],
    color: isSelected ? t.colors.brand : t.colors.textMuted,
    ...Platform.select({
      ios: { fontFamily: 'Menlo' },
      android: { fontFamily: 'monospace' },
    }),
  }), [t, isSelected]);

  return (
    <Pressable
      onPress={onPress}
      style={buttonStyle}
      accessibilityRole="button"
      accessibilityLabel={`Select ${value} yards`}
      accessibilityState={{ selected: isSelected }}
    >
      <Text style={textStyle}>{value}</Text>
    </Pressable>
  );
});

// Wind calculation component
function WindCalculatorComponent() {
  // Get all required hooks
  const { isPremium } = usePremium();
  const { conditions, isLoading: envLoading } = useEnhancedEnvironmental();
  const { relativeWindAngle } = useCompassLock();
  const { isLoading, windSpeed, setWindSpeed, targetYardage, setTargetYardage, result, calculate } =
    useWindCalculator();
  const t = useTokens();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark' || mode === 'system';
  const insets = useSafeAreaInsets();
  const { headerEntering, cardEntering } = useAccessibleAnimations();

  // Memoized styles
  const styles = useMemo(() => createStyles(t), [t]);
  const padding = getScrollPadding(t.spacing.md, { minPadding: t.spacing.base, maxPadding: t.spacing.xl });

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
      <View style={[styles.container, styles.centerContent, { backgroundColor: t.colors.background }]}>
        <Animated.View entering={headerEntering} style={styles.premiumContainer}>
          <View style={[styles.premiumIconContainer, { backgroundColor: t.colors.brandBackgroundAlpha }]}>
            <Crown size={t.containerSize.icon.lg} color={t.colors.brand} />
          </View>
          <Text style={[styles.premiumTitle, { color: t.colors.textPrimary }]}>
            Premium Feature
          </Text>
          <Text style={[styles.premiumText, { color: t.colors.textMuted }]}>
            Wind calculator is available with premium
          </Text>
          <Button
            onPress={() => Alert.alert('Premium', 'Wind calculator requires a Premium subscription.')}
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
      <View
        style={[styles.container, styles.centerContent, { backgroundColor: t.colors.background }]}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading wind calculator"
      >
        <View style={[styles.loadingPulse, { backgroundColor: t.colors.surfaceAlt }]} />
        <View style={[styles.loadingPulse, { backgroundColor: t.colors.surfaceAlt, width: '60%' }]} />
      </View>
    );
  }

  // Error state
  if (!conditions) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: t.colors.background }]}>
        <Wind
          size={t.containerSize.icon.lg}
          color={t.colors.textMuted}
          accessibilityElementsHidden={true}
        />
        <Text style={[styles.errorText, { color: t.colors.textMuted }]}>
          Unable to load conditions
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.colors.background }]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top + t.spacing.md, paddingHorizontal: padding },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={headerEntering}>
        <Text style={[styles.title, { color: t.colors.textPrimary }]} accessibilityRole="header">
          Wind Calculator
        </Text>
        <Text style={[styles.subtitle, { color: t.colors.textMuted }]}>
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
          <Text style={[styles.compassHint, { color: t.colors.textMuted }]}>
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
          <View style={[styles.presetsContainer, { borderTopColor: t.colors.border }]}>
            <Text style={[styles.presetsLabel, { color: t.colors.textMuted }]}>
              Quick Select
            </Text>
            <View style={styles.presetsRow}>
              {YARDAGE_PRESETS.map((preset) => (
                <YardagePresetButton
                  key={preset}
                  value={preset}
                  isSelected={targetYardage === preset}
                  onPress={() => setTargetYardage(preset)}
                  tokens={t}
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
        <Animated.View
          entering={cardEntering(0)}
          accessibilityRole="summary"
          accessibilityLabel="Wind calculation results"
        >
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
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const { headerEntering } = useAccessibleAnimations();

  // Memoized styles
  const styles = useMemo(() => createStyles(t), [t]);

  // Error state
  if (error) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: t.colors.background, paddingTop: insets.top },
        ]}
      >
        <Animated.View entering={headerEntering} style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: t.colors.danger }]}>
            Something went wrong
          </Text>
          <Text style={[styles.errorMessage, { color: t.colors.textMuted }]}>
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
  const t = useTokens();
  const { headerEntering } = useAccessibleAnimations();

  // Memoized styles
  const styles = useMemo(() => createStyles(t), [t]);

  // Handle initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialized(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  if (!initialized) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: t.colors.background }]}>
        <Animated.View entering={headerEntering}>
          <Wind
            size={t.containerSize.icon.sm}
            color={t.colors.textMuted}
            accessibilityElementsHidden={true}
          />
        </Animated.View>
      </View>
    );
  }

  return <WindCalculatorScreen />;
}

/**
 * Creates token-based styles for Wind Calculator screen
 * Uses memoized dynamic styles pattern for consistent theming
 */
const createStyles = (t: Tokens) => ({
  container: {
    flex: 1,
  } as ViewStyle,
  contentContainer: {
    paddingBottom: t.spacing['5xl'], // 120px scroll bottom padding
  } as ViewStyle,
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  title: {
    fontSize: safeScaledFontSize(t.fontSize['4xl'] - 4), // 32px hero title
    fontWeight: t.fontWeight.bold,
    letterSpacing: t.letterSpacing.tight,
    marginBottom: t.spacing.xs,
  } as TextStyle,
  subtitle: {
    fontSize: safeScaledFontSize(t.fontSize.sm + 1), // 15px subtitle
    fontWeight: t.fontWeight.medium,
    marginBottom: t.spacing.lg,
  } as TextStyle,
  compassCard: {
    marginBottom: t.spacing.md,
    alignItems: 'center',
  } as ViewStyle,
  compassHint: {
    fontSize: safeScaledFontSize(t.fontSize.xs),
    fontWeight: t.fontWeight.medium,
    textAlign: 'center',
    marginBottom: t.spacing.md,
    opacity: t.opacity.subtle,
  } as TextStyle,
  compassWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  sliderCard: {
    marginBottom: t.spacing.md,
  } as ViewStyle,
  yardageCard: {
    marginBottom: t.spacing.md,
  } as ViewStyle,
  presetsContainer: {
    marginTop: t.spacing.md + t.spacing.xs, // 20px
    paddingTop: t.spacing.md,
    borderTopWidth: t.borderWidth.thin,
  } as ViewStyle,
  presetsLabel: {
    fontSize: safeScaledFontSize(t.fontSize.xs),
    fontWeight: t.fontWeight.medium,
    marginBottom: t.spacing.base,
    textAlign: 'center',
  } as TextStyle,
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: t.spacing.sm,
  } as ViewStyle,
  calculateButton: {
    marginBottom: t.spacing.md,
  } as ViewStyle,
  loadingPulse: {
    borderRadius: t.borderRadius.lg,
    marginBottom: t.spacing.md,
    height: t.containerSize.icon.sm,
    width: '80%',
  } as ViewStyle,
  errorContainer: {
    alignItems: 'center',
    padding: t.spacing.lg,
  } as ViewStyle,
  errorTitle: {
    fontSize: safeScaledFontSize(t.fontSize.xl),
    fontWeight: t.fontWeight.bold,
    marginBottom: t.spacing.sm,
  } as TextStyle,
  errorMessage: {
    fontSize: safeScaledFontSize(t.fontSize.sm),
    textAlign: 'center',
    marginBottom: t.spacing.lg,
  } as TextStyle,
  errorText: {
    fontSize: safeScaledFontSize(t.fontSize.base),
    marginTop: t.spacing.md,
  } as TextStyle,
  retryButton: {
    minWidth: t.spacing['4xl'] + t.spacing['3xl'] + t.spacing.xs, // ~160px
  } as ViewStyle,
  premiumContainer: {
    alignItems: 'center',
    padding: t.spacing.xl,
  } as ViewStyle,
  premiumIconContainer: {
    width: t.containerSize.icon['2xl'],
    height: t.containerSize.icon['2xl'],
    borderRadius: t.borderRadius['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: t.spacing.lg,
  } as ViewStyle,
  premiumTitle: {
    fontSize: safeScaledFontSize(t.fontSize['2xl']),
    fontWeight: t.fontWeight.bold,
    marginBottom: t.spacing.sm,
  } as TextStyle,
  premiumText: {
    fontSize: safeScaledFontSize(t.fontSize.base),
    textAlign: 'center',
    marginBottom: t.spacing.lg,
  } as TextStyle,
  premiumButton: {
    minWidth: t.spacing['4xl'] + t.spacing['3xl'] + t.spacing['2xl'] - t.spacing.sm, // ~200px
  } as ViewStyle,
});
