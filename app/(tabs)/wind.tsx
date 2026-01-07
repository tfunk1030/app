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
import { BoldCard } from '@/src/core/components/ui/BoldCard';
import { PageTitle } from '@/src/core/components/ui/page-title';
import { Slider } from '@/src/core/components/ui/slider';
import { useSettings } from '@/src/core/context/settings';
import WindDirectionCompass from '@/src/features/wind/components/compass';
import { WindCalculationResults } from '@/src/features/wind/components/WindCalculationResults';
import { CompassLockProvider, useCompassLock } from '@/src/features/wind/context/compass-lock';
import { useSensorData } from '@/src/features/wind/context/sensor-data';
import { useWindCalculator } from '@/src/features/wind/hooks/useWindCalculator';
import { useEnhancedEnvironmental } from '@/src/providers/EnhancedEnvironmentalProvider';
import { useTokens as useThemeTokens } from '@/src/theme/useTokens';
import { LogManager } from '@/src/utils/LogManager';
import { getScrollPadding, moderateScale, scaledFontSize, getBottomPadding } from '@/src/utils/responsive';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
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
  const horizontalPadding = getScrollPadding(16);
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.colors.background },
    staticContainer: {
      flex: 1,
      paddingHorizontal: horizontalPadding,
      paddingTop: 8, // Compact top padding
    },
    centerContent: { justifyContent: 'center', alignItems: 'center' },
    mainCard: {
      padding: 12,
      backgroundColor: palette.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.colors.border,
      overflow: 'hidden',
    },
    compassContainer: { marginBottom: 16, alignItems: 'center' }, // Reduced from 40 to 16
    compassWrapper: { position: 'relative' },
    inputGroup: {
      marginBottom: 2, // Further reduced from 4 to 2
      backgroundColor: palette.colors.surfaceAlt,
      padding: 0,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: palette.colors.border,
    },
    errorText: { color: palette.colors.danger, fontSize: scaledFontSize(16) },
    timestampText: {
      fontSize: scaledFontSize(11),
      color: palette.colors.textMuted,
      textAlign: 'center',
      marginBottom: 8,
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
          return 40;
        case 'kph':
          return Math.round(40 * 1.60934); // ~64 kph
        case 'kts':
          return Math.round(40 * 0.868976); // ~35 kts
        case 'mps':
          return Math.round(40 * 0.44704); // ~18 m/s
        default:
          return 40;
      }
    })();

    const distanceUnitLabel = settings.distanceUnit === 'yards' ? ' yards' : ' m';
    const distMin = 1; // Start from 1 for both yards and meters
    const distMax = settings.distanceUnit === 'yards' ? 400 : Math.round(400 * 0.9144); // 400 yds or ~366m

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
      <BoldCard accent style={styles.mainCard}>
        {/* Wind Direction Compass - Hero Size */}
        <View style={styles.compassContainer}>
          <View style={styles.compassWrapper}>
            <WindDirectionCompass size={computedCompassSize} />
          </View>
        </View>

        {/* Wind Speed Slider with +/- buttons */}
        <View style={styles.inputGroup}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Button
              variant="secondary"
              size="default"
              onPress={async () => {
                await Haptics.selectionAsync();
                setWindSpeed(Math.max(0, windSpeed - 1));
              }}
              style={{ minWidth: 44, minHeight: 44, paddingHorizontal: 12 }}
              accessibilityLabel="Decrease wind speed by 1"
            >
              -1
            </Button>
            <View style={{ flex: 1 }}>
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
            <Button
              variant="secondary"
              size="default"
              onPress={async () => {
                await Haptics.selectionAsync();
                setWindSpeed(Math.min(maxByUnit, windSpeed + 1));
              }}
              style={{ minWidth: 44, minHeight: 44, paddingHorizontal: 12 }}
              accessibilityLabel="Increase wind speed by 1"
            >
              +1
            </Button>
          </View>
        </View>

        {/* Yardage Presets - Larger touch targets */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 6,
            marginBottom: 4,
          }}
        >
          {presets.map((p, i) => (
            <Button
              key={`preset-${i}`}
              variant={Math.abs(targetYardage - p) < 1 ? 'default' : 'secondary'}
              size="default"
              onPress={async () => {
                await Haptics.selectionAsync();
                setTargetYardage(p);
              }}
              style={{ flex: 1, minWidth: 0, minHeight: 44, paddingVertical: 10 }}
            >
              {p} {settings.distanceUnit === 'yards' ? 'yds' : 'm'}
            </Button>
          ))}
        </View>

        {/* Target Yardage Slider with +/- buttons */}
        <View style={styles.inputGroup}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Button
              variant="secondary"
              size="default"
              onPress={async () => {
                await Haptics.selectionAsync();
                setTargetYardage(Math.max(distMin, targetYardage - 1));
              }}
              style={{ minWidth: 44, minHeight: 44, paddingHorizontal: 12 }}
              accessibilityLabel="Decrease yardage by 1"
            >
              -1
            </Button>
            <View style={{ flex: 1 }}>
              <Slider
                value={targetYardage}
                onValueChange={setTargetYardage}
                min={distMin}
                max={distMax}
                step={1}
                label="Target"
                unit={distanceUnitLabel}
                dense
              />
            </View>
            <Button
              variant="secondary"
              size="default"
              onPress={async () => {
                await Haptics.selectionAsync();
                setTargetYardage(Math.min(distMax, targetYardage + 1));
              }}
              style={{ minWidth: 44, minHeight: 44, paddingHorizontal: 12 }}
              accessibilityLabel="Increase yardage by 1"
            >
              +1
            </Button>
          </View>
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
      </BoldCard>
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
  const { conditions, isActive, forceRefresh, lastUpdatedTimestamp, throttlingStatus } =
    useEnhancedEnvironmental();
  const { convertSpeed } = useSettings();
  const palette = useThemeTokens();
  const styles = React.useMemo(() => getThemedStyles(palette), [palette]);
  const { calculate, result, setWindSpeed, setTargetYardage } = useWindCalculator();
  const insets = useSafeAreaInsets();

  // Calculate bottom padding to account for FloatingTabBar and safe area
  const bottomPadding = getBottomPadding(insets.bottom);
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

  // When a result arrives, animate to the results view with haptic feedback
  useEffect(() => {
    if (result) {
      // Haptic feedback on calculation complete
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <View style={[styles.staticContainer, { paddingBottom: bottomPadding }]}>
        <ConnectivityBanner />
        <PageTitle title="Wind Calculator" showGlow={false} showGradient={false} />

        {/* Compact meta line: Last updated • Source */}
        {(() => {
          const parts: string[] = [];
          if (lastUpdatedTimestamp) {
            parts.push(
              `Updated ${formatObservationTime(new Date(lastUpdatedTimestamp).toISOString())}`
            );
          }
          const provider = throttlingStatus?.provider;
          const sourceLabel =
            provider === 'open-meteo'
              ? 'Open-Meteo'
              : provider === 'stormglass'
              ? 'Stormglass'
              : null;
          if (sourceLabel) {
            parts.push(sourceLabel);
          }
          const meta = parts.join(' | ');
          return meta ? (
            <Text style={styles.timestampText}>{meta}</Text>
          ) : null;
        })()}

        {/* Inline retry if conditions missing but app is active */}
        {(!conditions && isActive) && (
          <RetryCard title="Unable to load wind data" onRetry={forceRefresh} />
        )}

        {/* Animated in-place swap with absolute overlay and animated container height */}
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
      </View>
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
  const [error, setError] = useState<Error | null>(null);
  const palette = useThemeTokens();
  const themedStyles = React.useMemo(() => getThemedStyles(palette), [palette]);

  // Error boundary pattern
  if (error) {
    return (
      <View style={[themedStyles.container, themedStyles.centerContent]}>
        <Text style={themedStyles.errorText}>An error occurred in the Wind Calculator</Text>
        <Text style={[themedStyles.errorText, { fontSize: scaledFontSize(12), marginTop: 8 }]}>
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
    <View style={themedStyles.container}>
      <WindCalcScreenWithCompass />
    </View>
  );
}
