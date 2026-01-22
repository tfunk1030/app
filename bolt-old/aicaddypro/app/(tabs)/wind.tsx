/**
 * Wind Calculator Tab
 *
 * Optimized implementation using:
 * - Enhanced environmental service with throttling
 * - Skeleton loading states
 * - Progressive loading
 * - Memoization
 */

import { Button } from '@/src/core/components/ui/button';
import { GlassCard } from '@/src/core/components/ui/GlassCard';
import { PageTitle } from '@/src/core/components/ui/page-title';
import { SectionHeader } from '@/src/core/components/ui/SectionHeader';
import { Slider } from '@/src/core/components/ui/slider';
import { useSettings } from '@/src/core/context/settings';
import { usePremium } from '@/src/features/settings/context/premium';
import WindDirectionCompass from '@/src/features/wind/components/compass';
import { WindWeatherBar } from '@/src/features/wind/components/wind-weather-bar';
import { WindCalculationResults } from '@/src/features/wind/components/WindCalculationResults';
import { WindHourlyForecastBar } from '@/src/features/wind/components/WindHourlyForecastBar';
import { CompassLockProvider, useCompassLock } from '@/src/features/wind/context/compass-lock';
import { useSensorData } from '@/src/features/wind/context/sensor-data';
import { useWindCalculator } from '@/src/features/wind/hooks/useWindCalculator';
import { useEnhancedEnvironmental } from '@/src/providers/EnhancedEnvironmentalProvider';
import { useTokens as useThemeTokens } from '@/src/theme/useTokens';
import { LogManager } from '@/src/utils/LogManager';
import { getScrollPadding, moderateScale, scaledFontSize } from '@/src/utils/responsive';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConnectivityBanner } from '@/src/core/components/ui/ConnectivityBanner';
import { RetryCard } from '@/src/core/components/ui/RetryCard';

const logger = LogManager.getLogger('WindTab');

function getThemedStyles(palette: ReturnType<typeof useThemeTokens>) {
  const scrollPadding = getScrollPadding(16);
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.colors.background },
    contentContainer: {
      paddingVertical: 12,
      paddingHorizontal: scrollPadding,
      paddingBottom: 24,
      paddingTop: 16,
      minHeight: '100%',
      alignItems: 'stretch',
    },
    centerContent: { justifyContent: 'center', alignItems: 'center' },
    title: {
      fontSize: scaledFontSize(24),
      fontWeight: 'bold',
      color: palette.colors.textPrimary,
      marginBottom: 24,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    subtitle: { fontSize: scaledFontSize(16), color: palette.colors.textMuted, marginBottom: 16 },
    mainCard: {
      marginBottom: 16,
      padding: 12,
      backgroundColor: palette.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.colors.border,
      overflow: 'hidden',
    },
    compassContainer: { marginBottom: 40, alignItems: 'center' },
    compassInstructions: { marginBottom: 8 },
    compassHint: {
      fontSize: scaledFontSize(12),
      color: palette.colors.textMuted,
      textAlign: 'center',
      opacity: 0.75,
    },
    compassWrapper: { position: 'relative' },
    inputGroup: {
      marginBottom: 4, // Further reduced from 6 to 4
      backgroundColor: palette.colors.surfaceAlt,
      padding: 0, // Removed padding completely for maximum compactness
      borderRadius: 8,
      borderWidth: 1,
      borderColor: palette.colors.border,
    },
    errorText: { color: palette.colors.danger, fontSize: scaledFontSize(16) },
    timestampText: {
      fontSize: scaledFontSize(12),
      color: palette.colors.textMuted,
      textAlign: 'center',
      marginBottom: 12,
      opacity: 0.8,
    },
  });
}

// Define input props interface
interface WindCalculatorInputProps {
  onCalculate: (params: { windSpeed: number; targetYardage: number; windAngle: number }) => void;
  initialWindSpeed?: number;
}

// Wind Calculator Input Component
const WindCalculatorInput = React.memo(
  ({ onCalculate, initialWindSpeed = 10 }: WindCalculatorInputProps) => {
    const { settings, convertDistance } = useSettings();
    const { relativeWindAngle } = useCompassLock();
    const [windSpeed, setWindSpeed] = useState(initialWindSpeed);
    const [targetYardage, setTargetYardage] = useState(150);
    const [isCalculating, setIsCalculating] = useState(false);
    const { height: screenHeight } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const palette = useThemeTokens();
    const styles = React.useMemo(() => getThemedStyles(palette), [palette]);

    // Update wind speed if initialWindSpeed changes
    useEffect(() => {
      if (initialWindSpeed !== windSpeed) {
        setWindSpeed(initialWindSpeed);
      }
    }, [initialWindSpeed]);

    // Load last used inputs
    useEffect(() => {
      (async () => {
        try {
          const [ws, ty] = await Promise.all([
            AsyncStorage.getItem('wind_last_windSpeed'),
            AsyncStorage.getItem('wind_last_targetYardage'),
          ]);
          if (ws) setWindSpeed(Number(ws));
          if (ty) setTargetYardage(Number(ty));
        } catch {}
      })();
    }, []);

    // Persist changes
    useEffect(() => {
      AsyncStorage.setItem('wind_last_windSpeed', String(windSpeed)).catch(() => {});
    }, [windSpeed]);
    useEffect(() => {
      AsyncStorage.setItem('wind_last_targetYardage', String(targetYardage)).catch(() => {});
    }, [targetYardage]);

    // Convert displayed wind speed to mph for calculation
    const toMph = useCallback(
      (value: number): number => {
        switch (settings.speedUnit) {
          case 'mph':
            return value;
          case 'kph':
            return value / 1.60934;
          case 'kts':
            return value / 0.868976;
          case 'mps':
            return value / 0.44704;
          default:
            return value;
        }
      },
      [settings.speedUnit]
    );

    // Calculate wind effect when button is pressed
    const handleCalculate = useCallback(() => {
      // Prevent multiple rapid presses
      if (isCalculating) return;

      // Provide haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Set calculating state to prevent multiple presses
      setIsCalculating(true);

      // Call the calculation function
      const targetInYards =
        settings.distanceUnit === 'yards'
          ? targetYardage
          : Math.round(convertDistance(targetYardage, 'yards'));
      onCalculate({
        windSpeed: Math.round(toMph(windSpeed)),
        targetYardage: targetInYards,
        windAngle: relativeWindAngle,
      });

      // Reset calculating state after a short delay
      setTimeout(() => {
        setIsCalculating(false);
      }, 500);
    }, [windSpeed, targetYardage, relativeWindAngle, onCalculate, isCalculating]);

    // Slider unit and bounds based on selected unit
    const speedUnitLabel = settings.speedUnit === 'mps' ? ' m/s' : ` ${settings.speedUnit}`;
    const maxByUnit = (() => {
      switch (settings.speedUnit) {
        case 'mph':
          return 50;
        case 'kph':
          return Math.round(50 * 1.60934);
        case 'kts':
          return Math.round(50 * 0.868976);
        case 'mps':
          return Math.round(50 * 0.44704);
        default:
          return 50;
      }
    })();

    const distanceUnitLabel = settings.distanceUnit === 'yards' ? ' yards' : ' m';
    const distMin = settings.distanceUnit === 'yards' ? 50 : 45;
    const distMax = settings.distanceUnit === 'yards' ? 350 : 318; // reasonable meter cap

    // Yardage presets row (unit-aware)
    const presetYards = [100, 125, 150, 175, 200];
    const presets =
      settings.distanceUnit === 'yards'
        ? presetYards
        : presetYards.map(y => Math.round(convertDistance(y, 'meters')));

    // Compute adaptive compass size to ensure compass + sliders + button fit together
    const reservedVerticalSpace = 120 + insets.top + insets.bottom; // header/meta and safe areas
    const estimatedSliderHeight = 60; // Further reduced for more compact inputs
    const estimatedButtonHeight = 44; // Slightly reduced button height
    const internalMargins = 20; // Reduced spacing inside card
    const maxCardHeight = Math.max(340, screenHeight - reservedVerticalSpace);
    const computedCompassSize = Math.max(
      220, // Restored minimum size back to 220 (from 180)
      Math.min(
        280, // Restored maximum size back to 280 (from 240)
        maxCardHeight - 2 * estimatedSliderHeight - estimatedButtonHeight - internalMargins
      )
    );

    return (
      <GlassCard style={styles.mainCard}>
        <SectionHeader title="Compass & Inputs" />
        {/* Wind Direction Compass */}
        <View style={styles.compassContainer}>
          <View style={styles.compassInstructions}>
            <Text style={styles.compassHint}>
              Point phone in shot direction and tap lock to set reference
            </Text>
          </View>
          <View style={styles.compassWrapper}>
            {/* Removed compassGlow element */}
            <WindDirectionCompass size={computedCompassSize} />
          </View>
        </View>

        {/* Wind Speed Slider */}
        <View style={styles.inputGroup}>
          <Slider
            value={windSpeed}
            onValueChange={setWindSpeed}
            min={0}
            max={maxByUnit}
            step={1}
            label="Wind Speed"
            unit={speedUnitLabel}
            dense
          />
        </View>

        {/* Yardage Presets */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            marginBottom: 6,
          }}
        >
          {presets.map((p, i) => (
            <Button
              key={`preset-${i}`}
              variant={Math.abs(targetYardage - p) < 1 ? 'default' : 'secondary'}
              size="sm"
              onPress={async () => {
                await Haptics.selectionAsync();
                setTargetYardage(p);
              }}
              style={{ flex: 1, minWidth: 0 }}
            >
              {p} {settings.distanceUnit === 'yards' ? 'yds' : 'm'}
            </Button>
          ))}
        </View>

        {/* Target Yardage Slider */}
        <View style={styles.inputGroup}>
          <Slider
            value={targetYardage}
            onValueChange={setTargetYardage}
            min={distMin}
            max={distMax}
            step={1}
            label="Target Yardage"
            unit={distanceUnitLabel}
            dense
          />
        </View>

        {/* Calculate Button */}
        <Button
          onPress={handleCalculate}
          variant="default"
          size="lg"
          disabled={isCalculating}
          style={{
            backgroundColor: isCalculating ? palette.colors.brandAlt : palette.colors.brand,
            paddingVertical: moderateScale(12),
            borderRadius: moderateScale(8),
            shadowColor: palette.colors.shadow,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.18,
            shadowRadius: 8,
            elevation: 3,
            opacity: isCalculating ? 0.8 : 1,
          }}
        >
          {isCalculating ? 'Calculating...' : 'Calculate Wind Effect'}
        </Button>
      </GlassCard>
    );
  }
);

// Set display name for debugging
WindCalculatorInput.displayName = 'WindCalculatorInput';

// Format observation time helper
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

// Main Wind Calculator Component
function WindCalculatorScreen() {
  const { conditions, isLoading, isActive, forceRefresh, lastUpdatedTimestamp, throttlingStatus } =
    useEnhancedEnvironmental();
  const { isPremium } = usePremium();
  const { settings, convertSpeed } = useSettings();
  const palette = useThemeTokens();
  const styles = React.useMemo(() => getThemedStyles(palette), [palette]);
  const { heading } = useSensorData();
  const { calculate, result, setWindSpeed, setTargetYardage } = useWindCalculator();
  const [refreshing, setRefreshing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputOpacity = useRef(new Animated.Value(1)).current;
  const inputTranslateY = useRef(new Animated.Value(0)).current;
  const resultsOpacity = useRef(new Animated.Value(0)).current;
  const resultsTranslateY = useRef(new Animated.Value(20)).current;
  const containerHeight = useRef(new Animated.Value(0)).current;
  const inputMeasuredHeight = useRef<number | null>(null);
  const resultsMeasuredHeight = useRef<number | null>(null);

  // Debug logging for wind conditions
  useEffect(() => {
    if (conditions) {
      logger.info('Wind conditions in WindCalculatorScreen:', {
        windSpeed: conditions.windSpeed,
        windDirection: conditions.windDirection,
        windGust: conditions.windGust,
        lastUpdated: lastUpdatedTimestamp,
        obTime: conditions.obTime,
        isActive,
      });
    }
  }, [conditions, lastUpdatedTimestamp, isActive]);

  // Get current wind speed from environmental conditions
  const currentWindSpeed = conditions?.windSpeed
    ? Math.round(convertSpeed(conditions.windSpeed))
    : 10;

  // Store the latest calculation parameters
  const latestParamsRef = useRef({
    windSpeed: currentWindSpeed,
    targetYardage: 150,
    windAngle: 0,
  });

  // Force a refresh if needed on mount and periodically
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (!conditions || !isActive) {
        logger.info('Forcing periodic refresh in WindCalculatorScreen');
        forceRefresh();
      }
    }, 300000); // Refresh every 5 minutes if needed

    // Initial refresh
    if (!conditions || !isActive) {
      logger.info('Forcing initial refresh in WindCalculatorScreen');
      forceRefresh();
    }

    return () => clearInterval(refreshInterval);
  }, [conditions, isActive, forceRefresh]);

  // Enable LayoutAnimation on Android once
  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  // Handle calculation from input component
  const handleCalculate = useCallback(
    (params: { windSpeed: number; targetYardage: number; windAngle: number }) => {
      if (!conditions) return;

      // Store the latest parameters
      latestParamsRef.current = params;

      // Update the wind speed and target yardage in the hook
      // We need to ensure these are updated before calling calculate
      setWindSpeed(params.windSpeed);
      setTargetYardage(params.targetYardage);

      // Use setTimeout to ensure state updates have been processed
      setTimeout(() => {
        // Call calculate with just the wind angle
        calculate(params.windAngle);
      }, 0);
    },
    [conditions, setWindSpeed, setTargetYardage, calculate]
  );

  // When a result arrives, animate to the results view
  useEffect(() => {
    if (result) {
      setShowResults(true);
      Animated.parallel([
        Animated.timing(inputOpacity, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(inputTranslateY, {
          toValue: -12,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(resultsOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(resultsTranslateY, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      // If we already have measured results height, animate container to it
      if (resultsMeasuredHeight.current && resultsMeasuredHeight.current > 0) {
        Animated.timing(containerHeight, {
          toValue: resultsMeasuredHeight.current,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }).start();
      }
    }
  }, [result]);

  // Handle user-triggered refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      logger.info('User triggered refresh in WindCalculatorScreen');
      await forceRefresh(); // Call the forceRefresh function from context
    } catch (error) {
      logger.error('Error during manual refresh:', error);
      // Optionally, display an error message to the user here
    } finally {
      setRefreshing(false); // Ensure refreshing state is reset
    }
  }, [forceRefresh]); // Dependency: forceRefresh function

  // Collapsible sections for forecast and weather details (default collapsed)
  const [showForecast, setShowForecast] = useState(false);
  const [showWeather, setShowWeather] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <ScrollView
        style={[styles.container, { backgroundColor: palette.colors.background }]}
        contentContainerStyle={styles.contentContainer}
        scrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.colors.textMuted}
            colors={[palette.colors.textMuted]}
            progressBackgroundColor={palette.colors.surfaceAlt}
          />
        }
      >
        <ConnectivityBanner />
        <PageTitle title="Wind Calculator" showGlow={true} showGradient={true} />

        {/* Compact meta line: Last updated • Observation time • Source */}
        {(() => {
          const parts: string[] = [];
          if (lastUpdatedTimestamp) {
            parts.push(
              `Last updated: ${formatObservationTime(new Date(lastUpdatedTimestamp).toISOString())}`
            );
          }
          if (conditions?.obTime) {
            parts.push(`Observation time: ${formatObservationTime(conditions.obTime)}`);
          }
          const provider = throttlingStatus?.provider;
          const sourceLabel =
            provider === 'open-meteo'
              ? 'Open‑Meteo'
              : provider === 'stormglass'
              ? 'Stormglass'
              : null;
          if (sourceLabel) {
            parts.push(`Source: ${sourceLabel}`);
          }
          const meta = parts.join(' • ');
          return meta ? (
            <Text style={[styles.timestampText, { color: palette.colors.textMuted }]}>{meta}</Text>
          ) : null;
        })()}

        {/* Inline retry if conditions missing but app is active */}
        {(!conditions && isActive) && (
          <RetryCard title="Unable to load wind data" onRetry={onRefresh} />
        )}

        {/* Collapsible Sections at top */}
        <View style={{ gap: 8, marginTop: 4, marginBottom: 8 }}>
          <Button
            variant={showForecast ? 'default' : 'secondary'}
            onPress={() => setShowForecast(v => !v)}
          >
            {showForecast ? 'Hide Hourly Forecast' : 'Show Hourly Forecast'}
          </Button>
          {showForecast && <WindHourlyForecastBar />}

          <Button
            variant={showWeather ? 'default' : 'secondary'}
            onPress={() => setShowWeather(v => !v)}
          >
            {showWeather ? 'Hide Current Wind Details' : 'Show Current Wind Details'}
          </Button>
          {showWeather && <WindWeatherBar />}
        </View>

        {/* Animated in-place swap (no scroll) with absolute overlay and animated container height */}
        <Animated.View style={{ position: 'relative', height: containerHeight }}>
          <Animated.View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              opacity: inputOpacity,
              transform: [{ translateY: inputTranslateY }],
            }}
            pointerEvents={showResults ? 'none' : 'auto'}
            onLayout={e => {
              const h = e.nativeEvent.layout.height;
              if (!inputMeasuredHeight.current || inputMeasuredHeight.current !== h) {
                inputMeasuredHeight.current = h;
                if (!showResults) {
                  containerHeight.setValue(h);
                }
              }
            }}
          >
            <WindCalculatorInput
              onCalculate={handleCalculate}
              initialWindSpeed={currentWindSpeed}
            />
          </Animated.View>

          <Animated.View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              opacity: resultsOpacity,
              transform: [{ translateY: resultsTranslateY }],
            }}
            pointerEvents={showResults ? 'auto' : 'none'}
            onLayout={e => {
              const h = e.nativeEvent.layout.height;
              if (!resultsMeasuredHeight.current || resultsMeasuredHeight.current !== h) {
                resultsMeasuredHeight.current = h;
                if (showResults) {
                  Animated.timing(containerHeight, {
                    toValue: h,
                    duration: 240,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: false,
                  }).start();
                }
              }
            }}
          >
            {showResults && (
              <View style={{ marginBottom: 12 }}>
                <Button
                  variant="default"
                  size="lg"
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    Animated.parallel([
                      Animated.timing(resultsOpacity, {
                        toValue: 0,
                        duration: 200,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: true,
                      }),
                      Animated.timing(resultsTranslateY, {
                        toValue: 20,
                        duration: 200,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: true,
                      }),
                    ]).start(() => {
                      setShowResults(false);
                      const targetH = inputMeasuredHeight.current || 0;
                      Animated.parallel([
                        Animated.timing(inputOpacity, {
                          toValue: 1,
                          duration: 240,
                          easing: Easing.out(Easing.quad),
                          useNativeDriver: true,
                        }),
                        Animated.timing(inputTranslateY, {
                          toValue: 0,
                          duration: 240,
                          easing: Easing.out(Easing.quad),
                          useNativeDriver: true,
                        }),
                        Animated.timing(containerHeight, {
                          toValue: targetH,
                          duration: 240,
                          easing: Easing.out(Easing.quad),
                          useNativeDriver: false,
                        }),
                      ]).start();
                    });
                  }}
                  style={{
                    backgroundColor: palette.colors.brand,
                    borderRadius: moderateScale(10),
                    paddingVertical: moderateScale(12),
                    alignSelf: 'stretch',
                  }}
                >
                  ← Back to Compass & Inputs
                </Button>
              </View>
            )}
            {result && <WindCalculationResults result={result} />}
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Wrap with CompassLockProvider
function WindCalcScreenWithCompass() {
  const { conditions, forceRefresh } = useEnhancedEnvironmental();
  const { heading } = useSensorData();

  // Force a refresh if needed on mount
  useEffect(() => {
    if (!conditions) {
      logger.info('Forcing refresh in WindCalcScreenWithCompass');
      forceRefresh();
    }
  }, []);

  return (
    <CompassLockProvider
      currentHeading={heading || 0}
      windDirection={conditions?.windDirection || 0}
    >
      <WindCalculatorScreen />
    </CompassLockProvider>
  );
}

// Export the wrapper component with error handling
export default function WindTab() {
  const { isActive } = useEnhancedEnvironmental();
  const [error, setError] = useState<Error | null>(null);
  const palette = useThemeTokens();
  const styles = React.useMemo(() => getThemedStyles(palette), [palette]);

  // Error boundary pattern
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>An error occurred in the Wind Calculator</Text>
        <Text style={[styles.errorText, { fontSize: scaledFontSize(12), marginTop: 8 }]}>
          {error?.message || 'Unknown error'}
        </Text>
        <Button
          onPress={() => setError(null)}
          variant="default"
          size="lg"
          style={{
            backgroundColor: palette.colors.brand,
            marginTop: 20,
            paddingVertical: 12,
            borderRadius: 12,
          }}
        >
          Retry
        </Button>
      </View>
    );
  }

  // Render directly without ProgressiveLoader to ensure content is visible
  return (
    <View style={styles.container}>
      <WindCalcScreenWithCompass />
    </View>
  );
}

const styles = StyleSheet.create({});
