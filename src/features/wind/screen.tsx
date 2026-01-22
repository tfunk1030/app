// src/features/wind/screen.tsx

import { Button } from '@/src/core/components/ui/button';
import { GlassCard } from '@/src/core/components/ui/GlassCard';
import { Slider } from '@/src/core/components/ui/slider';
import { usePremium } from '@/src/features/settings/context/premium';
import WindDirectionCompass from '@/src/features/wind/components/compass';
import { ThumbZoneLockButton } from '@/src/features/wind/components/compass/ThumbZoneLockButton';
import { useSettings } from '@/src/core/context/settings';
import { ResultTakeoverModal } from '@/src/features/wind/components/ResultTakeoverModal';
import { WindCalculationResults } from '@/src/features/wind/components/WindCalculationResults';
import { WindHourlyForecastBar } from '@/src/features/wind/components/WindHourlyForecastBar';
import { CompassLockProvider, useCompassLock } from '@/src/features/wind/context/compass-lock';
import { useSensorData } from '@/src/features/wind/context/sensor-data';
import { useWindCalculator } from '@/src/features/wind/hooks/useWindCalculator';
import { useEnhancedEnvironmental } from '@/src/providers/EnhancedEnvironmentalProvider';
import type { Tokens } from '@/src/theme/tokens';
import { useTokens } from '@/src/theme/useTokens';
import { LogManager } from '@/src/utils/LogManager';
import { safeScaledFontSize, getScrollPadding } from '@/src/utils/responsive';
import { useAccessibleAnimations } from '@/src/hooks/useAccessibility';
import { Crown, Wind } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View, ViewStyle, TextStyle, Alert, TextInput, Animated as RNAnimated, Easing } from 'react-native';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
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

YardagePresetButton.displayName = 'YardagePresetButton';

interface InlineEditablePillProps {
  label: string;
  value: string;
  unit?: string;
  isEditing: boolean;
  isOverridden: boolean;
  onPress: () => void;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onBlur: () => void;
  tokens: Tokens;
}

const InlineEditablePill = React.memo<InlineEditablePillProps>(({
  label,
  value,
  unit,
  isEditing,
  isOverridden,
  onPress,
  onChangeText,
  onSubmit,
  onBlur,
  tokens: t,
}) => {
  const pillStyles = useMemo(() => ({
    container: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.xs,
      paddingVertical: t.spacing.xs,
      paddingHorizontal: t.spacing.sm,
      borderRadius: t.borderRadius.full,
      borderWidth: t.borderWidth.thin,
      borderColor: isOverridden ? t.colors.warning : t.colors.border,
      backgroundColor: t.colors.surface,
      minHeight: t.touchTarget.minimum,
    },
    label: {
      fontSize: safeScaledFontSize(t.fontSize.xs),
      fontWeight: t.fontWeight.semibold as TextStyle['fontWeight'],
      color: t.colors.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: t.letterSpacing.wider,
    },
    value: {
      fontSize: safeScaledFontSize(t.fontSize.sm),
      fontWeight: t.fontWeight.semibold as TextStyle['fontWeight'],
      color: t.colors.textPrimary,
      minWidth: 40,
      textAlign: 'center' as const,
    },
    unit: {
      fontSize: safeScaledFontSize(t.fontSize.xs),
      color: t.colors.textMuted,
    },
    input: {
      fontSize: safeScaledFontSize(t.fontSize.sm),
      fontWeight: t.fontWeight.semibold as TextStyle['fontWeight'],
      color: t.colors.textPrimary,
      minWidth: 40,
      textAlign: 'center' as TextStyle['textAlign'],
      paddingVertical: 0,
    },
    overrideDot: {
      width: t.spacing.xs,
      height: t.spacing.xs,
      borderRadius: t.borderRadius.full,
      backgroundColor: t.colors.warning,
    },
  }), [t, isOverridden]);

  return (
    <Pressable
      onPress={onPress}
      style={pillStyles.container}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}${unit ? ` ${unit}` : ''}${isOverridden ? ', overridden' : ''}`}
      accessibilityHint="Double tap to edit"
    >
      {isOverridden && <View style={pillStyles.overrideDot} accessibilityElementsHidden={true} />}
      <Text style={pillStyles.label}>{label}</Text>
      {isEditing ? (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          onBlur={onBlur}
          keyboardType="numeric"
          style={pillStyles.input}
          accessibilityLabel={`${label} override value`}
          returnKeyType="done"
        />
      ) : (
        <Text style={pillStyles.value}>{value}</Text>
      )}
      {unit ? <Text style={pillStyles.unit}>{unit}</Text> : null}
    </Pressable>
  );
});

InlineEditablePill.displayName = 'InlineEditablePill';

// Wind calculation component
function WindCalculatorComponent() {
  // Get all required hooks
  const { isPremium } = usePremium();
  const { conditions, forceRefresh } = useEnhancedEnvironmental();
  const { relativeWindAngle, isLocked, toggleLock } = useCompassLock();
  const { isLoading, windSpeed, setWindSpeed, targetYardage, setTargetYardage, result, calculate } =
    useWindCalculator();
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const { headerEntering, cardEntering } = useAccessibleAnimations();
  const { settings } = useSettings();

  // State for result modal
  const [showResultModal, setShowResultModal] = useState(false);
  const [editingPill, setEditingPill] = useState<'wind' | 'gust' | 'direction' | null>(null);
  const [windOverride, setWindOverride] = useState<string>('');
  const [gustOverride, setGustOverride] = useState<string>('');
  const [directionOverride, setDirectionOverride] = useState<string>('');

  // Animation state for in-place swap (bolt-old pattern)
  const [showResults, setShowResults] = useState(false);
  const inputOpacity = useRef(new RNAnimated.Value(1)).current;
  const inputTranslateY = useRef(new RNAnimated.Value(0)).current;
  const resultsOpacity = useRef(new RNAnimated.Value(0)).current;
  const resultsTranslateY = useRef(new RNAnimated.Value(20)).current;
  const containerHeight = useRef(new RNAnimated.Value(0)).current;

  // Height tracking refs
  const inputMeasuredHeight = useRef<number | null>(null);
  const resultsMeasuredHeight = useRef<number | null>(null);

  // Memoized styles
  const styles = useMemo(() => createStyles(t), [t]);
  const padding = getScrollPadding(t.spacing.md, { minPadding: t.spacing.base, maxPadding: t.spacing.xl });

  // Handle calculation button press - triggers animated swap to results
  const handleCalculate = useCallback(() => {
    logger.info('Calculate button pressed', {
      windSpeed,
      targetYardage,
      windAngle: relativeWindAngle,
    });
    calculate(relativeWindAngle);
    // Trigger animation swap to results view
    setShowResults(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    RNAnimated.parallel([
      RNAnimated.timing(inputOpacity, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      RNAnimated.timing(inputTranslateY, {
        toValue: -12,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      RNAnimated.timing(resultsOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      RNAnimated.timing(resultsTranslateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // Animate container height if measured
    if (resultsMeasuredHeight.current) {
      RNAnimated.timing(containerHeight, {
        toValue: resultsMeasuredHeight.current,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    }
  }, [windSpeed, targetYardage, relativeWindAngle, calculate, inputOpacity, inputTranslateY, resultsOpacity, resultsTranslateY, containerHeight]);

  // Handle back button - returns to inputs view with animation
  const handleBackToInputs = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    RNAnimated.parallel([
      RNAnimated.timing(resultsOpacity, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      RNAnimated.timing(resultsTranslateY, {
        toValue: 20,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowResults(false);
      const targetH = inputMeasuredHeight.current || 0;
      RNAnimated.parallel([
        RNAnimated.timing(inputOpacity, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        RNAnimated.timing(inputTranslateY, {
          toValue: 0,
          duration: 240,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        RNAnimated.timing(containerHeight, {
          toValue: targetH,
          duration: 240,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]).start();
    });
  }, [resultsOpacity, resultsTranslateY, inputOpacity, inputTranslateY, containerHeight]);

  const lockButtonPosition = settings.lockButtonPosition ?? 'both';

  const speedUnitLabel = settings.speedUnit === 'mps' ? 'm/s' : settings.speedUnit;
  const windSpeedLabel = speedUnitLabel;
  const baseWindSpeed = Math.round(conditions?.windSpeed || 0);
  const baseWindGust = Math.round(conditions?.windGust || 0);
  const baseWindDirection = Math.round(conditions?.windDirection || 0);

  const effectiveWindSpeed = windOverride !== '' ? parseInt(windOverride, 10) : baseWindSpeed;
  const effectiveGust = gustOverride !== '' ? parseInt(gustOverride, 10) : baseWindGust;
  const effectiveDirection = directionOverride !== '' ? parseInt(directionOverride, 10) : baseWindDirection;

  const handlePillCommit = (type: 'wind' | 'gust' | 'direction') => {
    if (type === 'wind') {
      const value = parseInt(windOverride, 10);
      if (Number.isFinite(value)) {
        setWindSpeed(value);
      } else {
        setWindOverride('');
      }
    }
    if (type === 'gust') {
      const value = parseInt(gustOverride, 10);
      if (!Number.isFinite(value)) {
        setGustOverride('');
      }
    }
    if (type === 'direction') {
      const value = parseInt(directionOverride, 10);
      if (!Number.isFinite(value)) {
        setDirectionOverride('');
      }
    }
    setEditingPill(null);
  };

  // Handle modal dismiss
  const handleDismissModal = () => {
    setShowResultModal(false);
  };

  // Premium check
  if (!isPremium) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: t.colors.background }]}>
        <Animated.View entering={headerEntering} style={styles.premiumContainer}>
          <View style={[styles.premiumIconContainer, { backgroundColor: t.colors.brandBackgroundAlpha }]}>
            <Crown
              size={t.containerSize.icon.lg}
              color={t.colors.brand}
              accessibilityElementsHidden={true}
            />
          </View>
          <Text
            style={[styles.premiumTitle, { color: t.colors.textPrimary }]}
            accessibilityRole="header"
          >
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
            accessibilityLabel="Upgrade to premium subscription"
            accessibilityHint="Opens premium subscription options"
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
        <Animated.View
          entering={headerEntering}
          style={styles.errorContainer}
          accessibilityRole="alert"
          accessibilityLabel="Unable to load weather conditions"
        >
          <View
            style={[
              styles.errorIconContainer,
              { backgroundColor: t.colors.dangerBackgroundAlpha },
            ]}
          >
            <Wind
              size={t.containerSize.icon.md}
              color={t.colors.danger}
              accessibilityElementsHidden={true}
            />
          </View>
          <Text style={[styles.errorTitle, { color: t.colors.textPrimary }]}>
            Unable to Load Conditions
          </Text>
          <Text style={[styles.errorMessage, { color: t.colors.textMuted }]}>
            Weather data is required for wind calculations. Please check your connection and try
            again.
          </Text>
          <Button
            onPress={async () => {
              // Force refresh environmental data
              logger.info('User requested retry for wind conditions');
              await forceRefresh();
            }}
            variant="neon"
            size="lg"
            style={styles.retryButton}
            accessibilityLabel="Retry loading weather conditions"
            accessibilityHint="Attempts to reload weather data"
          >
            Try Again
          </Button>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScrollView
        testID="wind-scroll-view"
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: insets.top + t.spacing.lg, paddingHorizontal: padding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Current Wind Display - always visible */}
        <Animated.View entering={headerEntering}>
          <Text style={[styles.title, { color: t.colors.textPrimary }]} accessibilityRole="header">
            Wind Calculator
          </Text>
          {/* Current wind conditions - always visible */}
          <View style={[styles.currentWindRow, { borderColor: t.colors.border }]}>
            <InlineEditablePill
              label="Wind"
              value={String(effectiveWindSpeed)}
              unit={speedUnitLabel}
              isEditing={editingPill === 'wind'}
              isOverridden={windOverride !== ''}
              onPress={() => setEditingPill('wind')}
              onChangeText={(text) => setWindOverride(text.replace(/[^0-9]/g, ''))}
              onSubmit={() => handlePillCommit('wind')}
              onBlur={() => handlePillCommit('wind')}
              tokens={t}
            />
            <InlineEditablePill
              label="From"
              value={String(effectiveDirection)}
              unit="°"
              isEditing={editingPill === 'direction'}
              isOverridden={directionOverride !== ''}
              onPress={() => setEditingPill('direction')}
              onChangeText={(text) => setDirectionOverride(text.replace(/[^0-9]/g, ''))}
              onSubmit={() => handlePillCommit('direction')}
              onBlur={() => handlePillCommit('direction')}
              tokens={t}
            />
            {baseWindGust > baseWindSpeed && (
              <InlineEditablePill
                label="Gusts"
                value={String(effectiveGust)}
                unit={speedUnitLabel}
                isEditing={editingPill === 'gust'}
                isOverridden={gustOverride !== ''}
                onPress={() => setEditingPill('gust')}
                onChangeText={(text) => setGustOverride(text.replace(/[^0-9]/g, ''))}
                onSubmit={() => handlePillCommit('gust')}
                onBlur={() => handlePillCommit('gust')}
                tokens={t}
              />
            )}
          </View>
        </Animated.View>

        {/* Hourly forecast - always visible */}
        <Animated.View entering={cardEntering(0)}>
          <WindHourlyForecastBar />
        </Animated.View>

        {/* Animated in-place swap container (bolt-old pattern) */}
        <RNAnimated.View style={{ minHeight: containerHeight }}>
          {/* Input Section - fades out when results shown */}
          <RNAnimated.View
            style={{
              opacity: inputOpacity,
              transform: [{ translateY: inputTranslateY }],
              display: showResults ? 'none' : 'flex',
            }}
            pointerEvents={showResults ? 'none' : 'auto'}
            onLayout={(e) => {
              const h = e.nativeEvent.layout.height;
              if (!inputMeasuredHeight.current || inputMeasuredHeight.current !== h) {
                inputMeasuredHeight.current = h;
                if (!showResults) {
                  containerHeight.setValue(h);
                }
              }
            }}
          >
            {/* Compass Card */}
            <Animated.View entering={cardEntering(1)}>
              <GlassCard gradient glow style={styles.compassCard}>
                <Text style={[styles.compassHint, { color: t.colors.textMuted }]}>
                  Point phone in shot direction and tap lock
                </Text>
                <View style={styles.compassWrapper}>
                  <WindDirectionCompass windDirection={effectiveDirection} windSpeed={effectiveWindSpeed} speedUnit={speedUnitLabel} />
                </View>
              </GlassCard>
            </Animated.View>

            {/* Wind Speed Slider */}
            <Animated.View entering={cardEntering(2)}>
              <GlassCard style={styles.sliderCard}>
                <Slider
                  value={windSpeed}
                  onValueChange={(value) => {
                    setWindSpeed(value);
                    if (windOverride !== '') {
                      setWindOverride('');
                    }
                  }}
                  min={0}
                  max={50}
                  step={1}
                  label="Wind Speed"
                  unit={windSpeedLabel}
                />
              </GlassCard>
            </Animated.View>

            {/* Target Yardage Section */}
            <Animated.View entering={cardEntering(3)}>
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
            <Animated.View entering={cardEntering(4)}>
              <Button
                onPress={handleCalculate}
                variant="neon"
                size="lg"
                glow={!isLoading}
                disabled={isLoading}
                style={styles.calculateButton}
                accessibilityLabel={isLoading ? 'Calculating wind effect' : 'Calculate wind effect'}
                accessibilityHint="Calculates wind effect based on current settings"
              >
                {isLoading ? 'Calculating...' : 'Calculate Wind Effect'}
              </Button>
            </Animated.View>
          </RNAnimated.View>

          {/* Results Section - fades in when results shown */}
          <RNAnimated.View
            style={{
              opacity: resultsOpacity,
              transform: [{ translateY: resultsTranslateY }],
              display: showResults ? 'flex' : 'none',
            }}
            pointerEvents={showResults ? 'auto' : 'none'}
            onLayout={(e) => {
              const h = e.nativeEvent.layout.height;
              if (!resultsMeasuredHeight.current || resultsMeasuredHeight.current !== h) {
                resultsMeasuredHeight.current = h;
                if (showResults) {
                  RNAnimated.timing(containerHeight, {
                    toValue: h,
                    duration: 240,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: false,
                  }).start();
                }
              }
            }}
          >
            {/* Back Button */}
            <Button
              onPress={handleBackToInputs}
              variant="outline"
              size="lg"
              style={styles.backButton}
              accessibilityLabel="Back to compass and inputs"
              accessibilityHint="Returns to the input view to adjust settings"
            >
              ← Back to Compass & Inputs
            </Button>

            {/* Wind Calculation Results */}
            {result && (
              <View
                accessibilityRole="summary"
                accessibilityLabel="Wind calculation results"
              >
                <WindCalculationResults result={result} />
              </View>
            )}
          </RNAnimated.View>
        </RNAnimated.View>
      </ScrollView>

      {/* Thumb-zone lock button - positioned for one-handed use */}
      {(lockButtonPosition === 'left' || lockButtonPosition === 'both') && (
        <ThumbZoneLockButton
          side="left"
          isLocked={isLocked}
          onPress={toggleLock}
          accessibilityLabel={isLocked ? 'Unlock compass, left' : 'Lock compass, left'}
        />
      )}
      {(lockButtonPosition === 'right' || lockButtonPosition === 'both') && (
        <ThumbZoneLockButton
          side="right"
          isLocked={isLocked}
          onPress={toggleLock}
          accessibilityLabel={isLocked ? 'Unlock compass, right' : 'Lock compass, right'}
        />
      )}

      {/* Result takeover modal - kept as fallback option */}
      <ResultTakeoverModal
        visible={showResultModal && result !== null && !showResults}
        result={result}
        onDismiss={handleDismissModal}
      />
    </View>
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
          <Text
            style={[styles.errorTitle, { color: t.colors.danger }]}
            accessibilityRole="header"
          >
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
            accessibilityLabel="Retry loading wind calculator"
            accessibilityHint="Dismisses the error and attempts to reload"
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
    marginBottom: t.spacing.sm,
  } as TextStyle,
  currentWindRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: t.spacing.lg, // 24dp - section gap
    paddingVertical: t.spacing.base,
    paddingHorizontal: t.spacing.md,
    borderRadius: t.borderRadius.lg,
    borderWidth: t.borderWidth.thin,
    backgroundColor: 'transparent',
    gap: t.spacing.sm,
  } as ViewStyle,
  windStatItem: {
    alignItems: 'center',
    paddingHorizontal: t.spacing.md,
  } as ViewStyle,
  windStatDivider: {
    width: t.borderWidth.thin,
    height: t.spacing.xl,
  } as ViewStyle,
  windStatLabel: {
    fontSize: safeScaledFontSize(t.fontSize.xs),
    fontWeight: t.fontWeight.medium,
    marginBottom: t.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: t.letterSpacing.wider,
  } as TextStyle,
  windStatValue: {
    fontSize: safeScaledFontSize(t.fontSize.xl),
    fontWeight: t.fontWeight.bold,
  } as TextStyle,
  compassCard: {
    marginBottom: t.spacing.lg, // 24dp - section gap
    alignItems: 'center',
  } as ViewStyle,
  compassHint: {
    fontSize: safeScaledFontSize(t.fontSize.xs),
    fontWeight: t.fontWeight.medium,
    textAlign: 'center',
    marginBottom: t.spacing.md,
  } as TextStyle,
  compassWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  sliderCard: {
    marginBottom: t.spacing.lg, // 24dp - section gap
  } as ViewStyle,
  yardageCard: {
    marginBottom: t.spacing.lg, // 24dp - section gap
  } as ViewStyle,
  presetsContainer: {
    marginTop: t.spacing.sm, // 8dp - related element gap
    paddingTop: t.spacing.sm, // 8dp - related element gap
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
    marginBottom: t.spacing.lg, // 24dp - section gap before results
  } as ViewStyle,
  backButton: {
    marginBottom: t.spacing.lg, // 24dp - section gap before results
    backgroundColor: 'transparent',
  } as ViewStyle,
  loadingPulse: {
    borderRadius: t.borderRadius.lg,
    marginBottom: t.spacing.md,
    height: t.containerSize.icon.sm,
    width: '80%',
  } as ViewStyle,
  errorContainer: {
    alignItems: 'center',
    padding: t.spacing.xl,
    maxWidth: t.containerSize.contentMaxWidth.error,
  } as ViewStyle,
  errorIconContainer: {
    width: t.containerSize.icon['2xl'],
    height: t.containerSize.icon['2xl'],
    borderRadius: t.borderRadius['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: t.spacing.lg,
  } as ViewStyle,
  errorTitle: {
    fontSize: safeScaledFontSize(t.fontSize['2xl']),
    fontWeight: t.fontWeight.bold,
    marginBottom: t.spacing.sm,
    textAlign: 'center',
  } as TextStyle,
  errorMessage: {
    fontSize: safeScaledFontSize(t.fontSize.base),
    textAlign: 'center',
    marginBottom: t.spacing.lg,
    lineHeight: t.lineHeight.relaxed,
  } as TextStyle,
  errorText: {
    fontSize: safeScaledFontSize(t.fontSize.base),
    marginTop: t.spacing.md,
  } as TextStyle,
  retryButton: {
    minWidth: t.containerSize.buttonMinWidth.default,
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
    minWidth: t.containerSize.buttonMinWidth.wide,
  } as ViewStyle,
});
