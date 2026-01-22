/**
 * useWindSettings.ts
 *
 * A custom hook for managing wind-specific settings.
 * Provides a centralized way to access and update wind settings
 * with persistence and validation.
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettings } from '@/src/core/context/settings';
import { LogManager } from '@/src/utils/LogManager';

// Create a logger for wind settings
const logger = LogManager.getLogger('useWindSettings');

// Storage keys
const STORAGE_KEY_WIND_SPEED_UNIT = 'wind_speed_unit';
const STORAGE_KEY_DEFAULT_WIND_SPEED = 'default_wind_speed';
const STORAGE_KEY_WIND_VISUALIZATION = 'wind_visualization';

// Wind speed units
export enum WindSpeedUnit {
  MPH = 'mph',
  KPH = 'kph',
  KNOTS = 'knots',
}

// Wind visualization types
export enum WindVisualizationType {
  ARROW = 'arrow',
  COMPASS = 'compass',
  BOTH = 'both',
}

// Wind settings interface
export interface WindSettings {
  speedUnit: WindSpeedUnit;
  defaultWindSpeed: number;
  visualizationType: WindVisualizationType;
}

// Default wind settings
const DEFAULT_SETTINGS: WindSettings = {
  speedUnit: WindSpeedUnit.MPH,
  defaultWindSpeed: 10,
  visualizationType: WindVisualizationType.BOTH,
};

/**
 * Custom hook for managing wind settings
 */
export function useWindSettings() {
  // Get global settings
  const { settings: globalSettings } = useSettings();

  // Local state for wind settings
  const [settings, setSettings] = useState<WindSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings from storage
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load settings from AsyncStorage
        const [speedUnitStr, defaultWindSpeedStr, visualizationTypeStr] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_WIND_SPEED_UNIT),
          AsyncStorage.getItem(STORAGE_KEY_DEFAULT_WIND_SPEED),
          AsyncStorage.getItem(STORAGE_KEY_WIND_VISUALIZATION),
        ]);

        // Parse and validate settings
        const loadedSettings: Partial<WindSettings> = {};

        // Parse speed unit
        if (speedUnitStr) {
          const parsedUnit = speedUnitStr as WindSpeedUnit;
          if (Object.values(WindSpeedUnit).includes(parsedUnit)) {
            loadedSettings.speedUnit = parsedUnit;
          } else {
            logger.warn(`Invalid wind speed unit: ${speedUnitStr}`);
          }
        }

        // Parse default wind speed
        if (defaultWindSpeedStr) {
          const parsedSpeed = parseFloat(defaultWindSpeedStr);
          if (!isNaN(parsedSpeed) && parsedSpeed >= 0) {
            loadedSettings.defaultWindSpeed = parsedSpeed;
          } else {
            logger.warn(`Invalid default wind speed: ${defaultWindSpeedStr}`);
          }
        }

        // Parse visualization type
        if (visualizationTypeStr) {
          const parsedType = visualizationTypeStr as WindVisualizationType;
          if (Object.values(WindVisualizationType).includes(parsedType)) {
            loadedSettings.visualizationType = parsedType;
          } else {
            logger.warn(`Invalid wind visualization type: ${visualizationTypeStr}`);
          }
        }

        // Merge with defaults
        setSettings({
          ...DEFAULT_SETTINGS,
          ...loadedSettings,
        });

        logger.info('Wind settings loaded', loadedSettings);
      } catch (err) {
        logger.error('Error loading wind settings', err);
        setError('Failed to load wind settings');
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save a specific setting
  const saveSetting = useCallback(async <K extends keyof WindSettings>(
    key: K,
    value: WindSettings[K]
  ): Promise<boolean> => {
    try {
      // Determine storage key
      let storageKey: string;
      switch (key) {
        case 'speedUnit':
          storageKey = STORAGE_KEY_WIND_SPEED_UNIT;
          break;
        case 'defaultWindSpeed':
          storageKey = STORAGE_KEY_DEFAULT_WIND_SPEED;
          break;
        case 'visualizationType':
          storageKey = STORAGE_KEY_WIND_VISUALIZATION;
          break;
        default:
          throw new Error(`Unknown setting key: ${key}`);
      }

      // Save to AsyncStorage
      await AsyncStorage.setItem(storageKey, value.toString());

      // Update local state
      setSettings(prev => ({
        ...prev,
        [key]: value,
      }));

      logger.info(`Wind setting saved: ${key}=${value}`);
      return true;
    } catch (err) {
      logger.error(`Error saving wind setting ${key}`, err);
      setError(`Failed to save ${key} setting`);
      return false;
    }
  }, []);

  // Update speed unit
  const setSpeedUnit = useCallback((unit: WindSpeedUnit) => {
    return saveSetting('speedUnit', unit);
  }, [saveSetting]);

  // Update default wind speed
  const setDefaultWindSpeed = useCallback((speed: number) => {
    if (speed < 0) {
      setError('Wind speed cannot be negative');
      return Promise.resolve(false);
    }
    return saveSetting('defaultWindSpeed', speed);
  }, [saveSetting]);

  // Update visualization type
  const setVisualizationType = useCallback((type: WindVisualizationType) => {
    return saveSetting('visualizationType', type);
  }, [saveSetting]);

  // Reset to defaults
  const resetToDefaults = useCallback(async (): Promise<boolean> => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEY_WIND_SPEED_UNIT),
        AsyncStorage.removeItem(STORAGE_KEY_DEFAULT_WIND_SPEED),
        AsyncStorage.removeItem(STORAGE_KEY_WIND_VISUALIZATION),
      ]);

      setSettings(DEFAULT_SETTINGS);
      logger.info('Wind settings reset to defaults');
      return true;
    } catch (err) {
      logger.error('Error resetting wind settings', err);
      setError('Failed to reset wind settings');
      return false;
    }
  }, []);

  // Convert wind speed between units
  const convertWindSpeed = useCallback((speed: number, fromUnit: WindSpeedUnit, toUnit: WindSpeedUnit): number => {
    if (fromUnit === toUnit) return speed;

    // Convert to MPH first (as base unit)
    let speedInMph = speed;
    if (fromUnit === WindSpeedUnit.KPH) {
      speedInMph = speed / 1.60934;
    } else if (fromUnit === WindSpeedUnit.KNOTS) {
      speedInMph = speed * 1.15078;
    }

    // Convert from MPH to target unit
    if (toUnit === WindSpeedUnit.KPH) {
      return speedInMph * 1.60934;
    } else if (toUnit === WindSpeedUnit.KNOTS) {
      return speedInMph / 1.15078;
    }

    return speedInMph;
  }, []);

  // Get wind speed in a specific unit
  const getWindSpeedIn = useCallback((speed: number, unit: WindSpeedUnit): number => {
    return convertWindSpeed(speed, settings.speedUnit, unit);
  }, [settings.speedUnit, convertWindSpeed]);

  // Format wind speed with unit
  const formatWindSpeed = useCallback((speed: number, unit?: WindSpeedUnit): string => {
    const displayUnit = unit || settings.speedUnit;
    const convertedSpeed = unit ? getWindSpeedIn(speed, unit) : speed;

    return `${Math.round(convertedSpeed)} ${displayUnit}`;
  }, [settings.speedUnit, getWindSpeedIn]);

  return {
    settings,
    isLoading,
    error,
    setSpeedUnit,
    setDefaultWindSpeed,
    setVisualizationType,
    resetToDefaults,
    convertWindSpeed,
    getWindSpeedIn,
    formatWindSpeed,
  };
}
