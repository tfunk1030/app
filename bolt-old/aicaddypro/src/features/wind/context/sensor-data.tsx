import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { LogManager } from '@/src/utils/LogManager';
import { useDiagnostics } from '@/src/components/diagnostics/DiagnosticContext';
import { DeviceMotion, Magnetometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create a dedicated logger
const logger = LogManager.getLogger('SensorDataProvider');

// Cache validation constants
const SENSOR_CACHE_KEY = 'sensor_data_cache';
const SENSOR_CACHE_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes

type AccuracyLevel = 'high' | 'medium' | 'low' | 'unreliable';

// Define cache structure for validation
interface SensorCache {
  timestamp: number;
  heading?: number;
  accuracy?: AccuracyLevel;
}

interface SensorDataContextType {
  heading: number;
  accuracy: AccuracyLevel;
  isAvailable: boolean;
  lastUpdateTime: number; // Added for performance tracking
  cacheState: 'valid' | 'invalid' | 'unknown';
  cacheTimestamp: number | null;
  validateCache: () => Promise<boolean>;
  updateCache: (data: SensorCache) => Promise<void>;
}

const SensorDataContext = createContext<SensorDataContextType>({
  heading: 0,
  accuracy: 'unreliable',
  isAvailable: false,
  lastUpdateTime: 0,
  cacheState: 'unknown',
  cacheTimestamp: null,
  validateCache: async () => false,
  updateCache: async () => {},
});

export function useSensorData() {
  return useContext(SensorDataContext);
}

interface SensorDataProviderProps {
  children: React.ReactNode;
}

// Utility function to calculate average heading
function calculateAverageHeading(readings: number[]): number {
  if (readings.length === 0) return 0;
  return readings.reduce((sum, val) => sum + val, 0) / readings.length;
}

// Utility function to calculate heading stability
function calculateStability(readings: number[], avgHeading: number): number {
  if (readings.length === 0) return 10; // High instability by default
  return readings.reduce((sum, val) => {
    const diff = Math.abs(val - avgHeading);
    return sum + (diff > 180 ? 360 - diff : diff);
  }, 0) / readings.length;
}

// Utility function to determine accuracy from stability
function getAccuracyFromStability(stability: number): AccuracyLevel {
  if (stability < 2) return 'high';
  if (stability < 5) return 'medium';
  return 'low';
}

// Define types for DeviceMotion data
type DeviceMotionRotation = {
  alpha: number;
  beta: number;
  gamma: number;
};

type DeviceMotionMeasurement = {
  rotation: DeviceMotionRotation;
};

// Reference to track potential magnetic interference
let hasMagneticInterference = false;

// Previous heading readings for smoothing
const previousHeadings: number[] = [];
const MAX_SMOOTHING_READINGS = 12; // Increased for even smoother movement

// Last known device orientation for tilt compensation
let lastKnownOrientation = {
  beta: 0,
  gamma: 0
};

// Function to calculate heading from Magnetometer data
function calculateHeadingFromMagnetometer(
  magnetometerData: { x: number; y: number; z: number },
  deviceMotionData?: DeviceMotionMeasurement
): number {
  // Extract magnetometer values
  const { x, y, z } = magnetometerData;

  // Update device orientation if available
  if (deviceMotionData) {
    lastKnownOrientation.beta = deviceMotionData.rotation.beta || 0;
    lastKnownOrientation.gamma = deviceMotionData.rotation.gamma || 0;
  }

  // Apply tilt compensation using device orientation
  let tiltCompensatedX = x;
  let tiltCompensatedY = y;

  // Only apply tilt compensation if we have significant tilt
  if (Math.abs(lastKnownOrientation.beta) > 10 || Math.abs(lastKnownOrientation.gamma) > 10) {
    const beta = lastKnownOrientation.beta * (Math.PI / 180); // Convert to radians
    const gamma = lastKnownOrientation.gamma * (Math.PI / 180); // Convert to radians

    // Apply tilt compensation formulas
    tiltCompensatedX = x * Math.cos(beta) + z * Math.sin(beta);
    tiltCompensatedY = x * Math.sin(gamma) * Math.sin(beta) +
                       y * Math.cos(gamma) -
                       z * Math.sin(gamma) * Math.cos(beta);
  }

  // Calculate heading from compensated magnetometer data
  let heading = Math.atan2(-tiltCompensatedY, tiltCompensatedX) * (180 / Math.PI);

  // Normalize to 0-360 range
  heading = (heading + 360) % 360;

  // Apply low-pass filter for initial smoothing (reduce jitter)
  if (previousHeadings.length > 0) {
    const lastHeading = previousHeadings[previousHeadings.length - 1];
    const diff = Math.abs(heading - lastHeading);

    // If the difference is too large (> 40 degrees), it might be a jump or anomaly
    // In that case, use a stronger smoothing factor
    const smoothingFactor = diff > 40 ? 0.1 : 0.3;

    // Apply smoothing
    heading = lastHeading + smoothingFactor * ((diff > 180) ?
      ((heading > lastHeading) ? -(360 - diff) : (360 - diff)) :
      (heading - lastHeading));

    // Normalize again after smoothing
    heading = (heading + 360) % 360;
  }

  // Add to smoothing buffer
  previousHeadings.push(heading);
  if (previousHeadings.length > MAX_SMOOTHING_READINGS) {
    previousHeadings.shift(); // Remove oldest reading
  }

  // Apply additional weighted moving average for final smoothing
  if (previousHeadings.length > 3) {
    let totalWeight = 0;
    let weightedSum = 0;

    for (let i = 0; i < previousHeadings.length; i++) {
      // Weight increases exponentially with index (newer readings have much higher weight)
      const weight = Math.pow(1.5, i);
      totalWeight += weight;
      weightedSum += previousHeadings[i] * weight;
    }

    heading = weightedSum / totalWeight;
  }

  return heading;
}

// Function to determine accuracy level with magnetic interference consideration
function determineAccuracyLevel(
  readings: number[],
  avgHeading: number
): AccuracyLevel {
  // Calculate stability
  const stability = calculateStability(readings, avgHeading);

  // Adjust for known magnetic interference
  if (hasMagneticInterference) {
    return stability < 3 ? 'medium' : 'low';
  }

  // Standard accuracy determination
  if (stability < 2) return 'high';
  if (stability < 5) return 'medium';
  return 'low';
}

// Throttle function to limit update frequency
function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * SensorDataProvider - Uses iOS Native Compass API
 *
 * This provider uses the iOS native compass API (via Expo's Location API) as the primary
 * and only source for compass heading data. This ensures the heading values exactly match
 * the iPhone's built-in compass and are not affected by device tilt.
 *
 * The implementation removes custom processing and smoothing to maintain perfect accuracy
 * with the native compass readings.
 */
export function SensorDataProvider({ children }: SensorDataProviderProps) {
  const [heading, setHeading] = useState(0);
  const [accuracy, setAccuracy] = useState<AccuracyLevel>('unreliable');
  const [isAvailable, setIsAvailable] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);

  // Cache validation state
  const [cacheState, setCacheState] = useState<'valid' | 'invalid' | 'unknown'>('unknown');
  const [cacheTimestamp, setCacheTimestamp] = useState<number | null>(null);

  // Get diagnostic functions
  const { saveSensorStatus, isDiagnosticModeEnabled } = useDiagnostics();

  // Using immutable readings array with useRef to avoid unnecessary renders
  const readingsRef = useRef<number[]>([]);
  const MAX_READINGS = 8; // Increased number of readings to average for smoother movement
  const UPDATE_INTERVAL = 100; // 10 updates per second for smoother movement

  // Throttled heading update function to reduce state changes
  const updateHeadingThrottled = useCallback(
    throttle((newHeading: number, newAccuracy: AccuracyLevel) => {
      setHeading(newHeading);
      setAccuracy(newAccuracy);
      setLastUpdateTime(Date.now());
    }, UPDATE_INTERVAL),
    []
  );

  // Add a reading to the array immutably
  const addReading = useCallback((heading: number) => {
    // Create a new array instead of mutating
    const newReadings = [...readingsRef.current, heading];

    // Keep only the last MAX_READINGS
    if (newReadings.length > MAX_READINGS) {
      readingsRef.current = newReadings.slice(-MAX_READINGS);
    } else {
      readingsRef.current = newReadings;
    }

    // Calculate average and stability
    const avgHeading = calculateAverageHeading(readingsRef.current);
    const newAccuracy = determineAccuracyLevel(readingsRef.current, avgHeading);

    // Update state with throttling
    updateHeadingThrottled(avgHeading, newAccuracy);
  }, [updateHeadingThrottled]);

  // Request permissions as soon as the provider loads
  useEffect(() => {
    logger.info('Initializing SensorDataProvider');

    async function requestPermissions() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          logger.error('Location permission not granted');
          setIsAvailable(false);
          setAccuracy('unreliable');
        }
      } catch (error) {
        logger.error('Error requesting location permissions:', error);
        setIsAvailable(false);
        setAccuracy('unreliable');
      }
    }

    requestPermissions();
  }, []);

  // Use iOS native compass API exclusively for accurate heading data
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    async function setupNativeCompass() {
      logger.info('Setting up iOS native compass API for heading data');

      try {
        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          logger.error('Location permission not granted');
          setIsAvailable(false);
          setAccuracy('unreliable');
          return;
        }

        // Check if compass is available
        const isCompassAvailable = await Location.hasServicesEnabledAsync();
        if (!isCompassAvailable) {
          logger.error('Compass not available via Location API');
          setIsAvailable(false);
          setAccuracy('unreliable');
          return;
        }

        // Start watching compass heading
        locationSubscription = await Location.watchHeadingAsync((data) => {
          // Use trueHeading when available, fallback to magHeading
          const nativeHeading = data.trueHeading ?? data.magHeading;

          // Set heading directly without any custom processing
          // This ensures exact match with iPhone's native compass
          setHeading(nativeHeading);
          setLastUpdateTime(Date.now());

          // For iOS, we can use the provided accuracy directly
          if (Platform.OS === 'ios' && data.accuracy != null) {
            let newAccuracy: AccuracyLevel;
            if (data.accuracy <= 5) {
              newAccuracy = 'high';
            } else if (data.accuracy <= 15) {
              newAccuracy = 'medium';
            } else {
              newAccuracy = 'low';
            }
            setAccuracy(newAccuracy);
          }
        });

        setIsAvailable(true);
        logger.info('iOS native compass setup successful');
      } catch (error) {
        logger.error('Error setting up iOS native compass:', error);
        setIsAvailable(false);
        setAccuracy('unreliable');
      }
    }

    // Initialize the native compass
    setupNativeCompass();

    return () => {
      logger.info('Cleaning up compass subscription');
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // Save sensor status to diagnostic system when values change
  useEffect(() => {
    if (isDiagnosticModeEnabled) {
      // Save sensor status for diagnostic purposes
      saveSensorStatus('compass', {
        available: isAvailable,
        data: {
          heading,
          accuracy,
          lastUpdateTime,
          readingsCount: readingsRef.current.length,
          source: 'iOS Native Compass API',
          cacheState,
          cacheTimestamp: cacheTimestamp ? new Date(cacheTimestamp).toISOString() : null
        }
      });
    }
  }, [heading, accuracy, isAvailable, lastUpdateTime, cacheState, cacheTimestamp, isDiagnosticModeEnabled, saveSensorStatus]);

  // Validate the cache data
  const validateCache = useCallback(async (): Promise<boolean> => {
    try {
      logger.info('Starting sensor cache validation');
      setCacheState('unknown');

      // Get the cached data
      const cachedData = await AsyncStorage.getItem(SENSOR_CACHE_KEY);
      if (!cachedData) {
        logger.info('No sensor cache data found');
        setCacheState('invalid');
        return false;
      }

      // Parse the cached data
      const cache: SensorCache = JSON.parse(cachedData);

      // Check if the cache is too old
      const now = Date.now();
      const cacheAge = now - cache.timestamp;
      const isValid = cacheAge <= SENSOR_CACHE_MAX_AGE_MS;

      logger.info('Sensor cache validation result', {
        isValid,
        cacheAge: `${Math.round(cacheAge / 1000 / 60)} minutes`,
        maxAge: `${SENSOR_CACHE_MAX_AGE_MS / 1000 / 60} minutes`
      });

      // Update the state with the validation result
      setCacheState(isValid ? 'valid' : 'invalid');
      setCacheTimestamp(cache.timestamp);

      return isValid;
    } catch (error: any) {
      logger.error('Sensor cache validation error', { error: error?.message });
      setCacheState('unknown');
      return false;
    }
  }, []);

  // Update the cache with new data
  const updateCache = useCallback(async (data: SensorCache): Promise<void> => {
    try {
      logger.info('Updating sensor cache data');

      // Ensure timestamp is set
      if (!data.timestamp) {
        data.timestamp = Date.now();
      }

      // Save to AsyncStorage
      await AsyncStorage.setItem(SENSOR_CACHE_KEY, JSON.stringify(data));

      // Update state
      setCacheState('valid');
      setCacheTimestamp(data.timestamp);

      logger.info('Sensor cache updated successfully', { timestamp: new Date(data.timestamp).toISOString() });
    } catch (error: any) {
      logger.error('Sensor cache update error', { error: error?.message });
    }
  }, []);

  // Memoize context value to prevent unnecessary renders
  const contextValue = useMemo(() => ({
    heading,
    accuracy,
    isAvailable,
    lastUpdateTime,
    cacheState,
    cacheTimestamp,
    validateCache,
    updateCache
  }), [heading, accuracy, isAvailable, lastUpdateTime, cacheState, cacheTimestamp, validateCache, updateCache]);

  return (
    <SensorDataContext.Provider value={contextValue}>
      {children}
    </SensorDataContext.Provider>
  );
}
