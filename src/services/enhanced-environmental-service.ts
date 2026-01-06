/**
 * enhanced-environmental-service.ts
 *
 * An enhanced version of the environmental service with throttling
 * and background mode support for better performance and battery life.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import { AppState } from 'react-native';
import { ThrottleManager } from '../utils/ThrottleManager';
import { elevationService } from './elevation-service';
import { EnvironmentalConditions } from './environmental-calculations';
import {
  LocationPermissionError,
  NetworkError,
  WeatherAPIError,
} from './errors/environmental-errors';
import { logger } from './telemetry/logger';
import {
  validateCoordinates,
  validateEnvironmentalConditions,
} from './validation/environmental-validation';
import { pickMostRecent, toEnvironmentalConditions } from './weather/normalize';
import { fetchNwsWx } from './weather/nws-adapter';
import { fetchOpenMeteoEnvironmental } from './weather/openmeteo-adapter';

// Import error notification service
import { safeHandleError } from '../services/notification';

// Configuration constants
const CONFIG = {
  // Update intervals
  STANDARD_UPDATE_INTERVAL: 60000, // 1 minute in active mode
  BACKGROUND_UPDATE_INTERVAL: 300000, // 5 minutes in background mode
  LOCATION_UPDATE_INTERVAL: 30000, // 30 seconds for location updates
  WEATHER_UPDATE_INTERVAL: 600000, // 10 minutes for weather API calls

  // Cache settings
  CACHE_DURATION: 600000, // 10 minutes cache validity

  // Retry settings
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second base delay with exponential backoff

  // Throttling settings
  THROTTLE_LEADING: true, // Process first call immediately
  THROTTLE_TRAILING: true, // Process last call after cooldown
};

export class EnhancedEnvironmentalService {
  private static instance: EnhancedEnvironmentalService;
  private conditions: EnvironmentalConditions;
  private readonly subscribers: Set<(conditions: EnvironmentalConditions) => void>;
  private updateInterval: ReturnType<typeof setInterval> | null;
  private lastFetchTime: number = 0;
  private forceRefreshFlag: boolean = false;
  private isActive: boolean = true;
  private appStateSubscription: { remove: () => void } | null = null;
  private lastProviderName: 'open-meteo' | 'nws' | 'none' = 'none';
  private lastProviderLatencyMs: number = 0;
  private lastFallbackUsed: boolean = false;

  // Throttle managers - Args type is inferred from constructor
  private locationThrottler: ThrottleManager<Promise<Location.LocationObject | null>, []>;
  private weatherThrottler: ThrottleManager<Promise<EnvironmentalConditions | null>, [lat: number, lon: number, altitude: number]>;
  private updateThrottler: ThrottleManager<Promise<void>, []>;

  private constructor() {
    // Initialize with default values
    this.conditions = {
      temperature: 75,
      humidity: 70,
      pressure: 1013.25,
      altitude: 0,
      windSpeed: 5,
      windDirection: 0,
      windGust: 0,
      density: 1.225,
      obTime: '',
      city: '',
    };

    this.subscribers = new Set();
    this.updateInterval = null;

    // Create throttlers for different operations
    this.locationThrottler = new ThrottleManager(this.getLocationThrottled.bind(this), {
      interval: CONFIG.LOCATION_UPDATE_INTERVAL,
      backgroundMode: true,
      backgroundInterval: CONFIG.LOCATION_UPDATE_INTERVAL * 3,
      leading: CONFIG.THROTTLE_LEADING,
      trailing: CONFIG.THROTTLE_TRAILING,
    });

    this.weatherThrottler = new ThrottleManager(this.fetchWeatherThrottled.bind(this), {
      interval: CONFIG.WEATHER_UPDATE_INTERVAL,
      backgroundMode: true,
      backgroundInterval: CONFIG.WEATHER_UPDATE_INTERVAL * 2,
      leading: CONFIG.THROTTLE_LEADING,
      trailing: CONFIG.THROTTLE_TRAILING,
    });

    this.updateThrottler = new ThrottleManager(this.updateConditionsThrottled.bind(this), {
      interval: CONFIG.STANDARD_UPDATE_INTERVAL,
      backgroundMode: true,
      backgroundInterval: CONFIG.BACKGROUND_UPDATE_INTERVAL,
      leading: CONFIG.THROTTLE_LEADING,
      trailing: CONFIG.THROTTLE_TRAILING,
    });

    // Set up app state monitoring
    this.setupAppStateMonitoring();
  }

  public static getInstance(): EnhancedEnvironmentalService {
    try {
      if (!EnhancedEnvironmentalService.instance) {
        EnhancedEnvironmentalService.instance = new EnhancedEnvironmentalService();
      }
      return EnhancedEnvironmentalService.instance;
    } catch (error) {
      logger.error('Error creating EnhancedEnvironmentalService instance', error as Error);
      // Create a minimal working instance with default values
      const fallbackInstance = new EnhancedEnvironmentalService();
      // Disable automatic updates to prevent further errors
      fallbackInstance.updateInterval = null;
      return fallbackInstance;
    }
  }

  public subscribe(callback: (conditions: EnvironmentalConditions) => void): () => void {
    this.subscribers.add(callback);
    callback(this.conditions);
    return () => this.subscribers.delete(callback);
  }

  public async startMonitoring(force: boolean = false): Promise<void> {
    if (!this.updateInterval || force) {
      try {
        // Clear existing interval if forcing
        if (force && this.updateInterval) {
          clearInterval(this.updateInterval);
          this.updateInterval = null;
        }

        // Reset throttling status if forcing
        if (force) {
          this.locationThrottler.reset();
          this.weatherThrottler.reset();
          this.updateThrottler.reset();
          this.forceRefreshFlag = true; // Set flag to bypass cache
        }

        // First update conditions safely
        await this.updateThrottler.execute()?.catch((error: Error) => {
          logger.error('Failed to update conditions during startup', error);
          // Don't rethrow - use default values instead
        });

        // Then set up the interval
        this.updateInterval = setInterval(() => {
          this.updateThrottler.execute()?.catch((error: Error) => {
            logger.error('Failed to update conditions in interval', error);
          });
        }, CONFIG.STANDARD_UPDATE_INTERVAL);

        logger.info('Environmental monitoring started', {
          updateInterval: CONFIG.STANDARD_UPDATE_INTERVAL,
          isActive: this.isActive,
          forced: force,
        });
      } catch (error) {
        logger.error('Error in startMonitoring', error as Error);
        // Don't let startup errors crash the app
      }
    }
  }

  public stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      logger.info('Environmental monitoring stopped');
    }
  }

  /**
   * Get the current throttling status for debugging
   */
  public getThrottlingStatus() {
    return {
      location: this.locationThrottler.getStatus(),
      weather: this.weatherThrottler.getStatus(),
      update: this.updateThrottler.getStatus(),
      isActive: this.isActive,
      lastFetchTime: this.lastFetchTime,
      timeSinceLastFetch: Date.now() - this.lastFetchTime,
      provider: this.lastProviderName,
      providerLatencyMs: this.lastProviderLatencyMs,
      fallbackUsed: this.lastFallbackUsed,
    };
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.stopMonitoring();
    this.locationThrottler.dispose();
    this.weatherThrottler.dispose();
    this.updateThrottler.dispose();

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    logger.info('EnhancedEnvironmentalService disposed');
  }

  private setupAppStateMonitoring(): void {
    // Handle app state changes
    const handleAppStateChange = (nextAppState: string) => {
      this.isActive = nextAppState === 'active';

      logger.info('App state changed', {
        active: this.isActive,
        updateInterval: this.isActive
          ? CONFIG.STANDARD_UPDATE_INTERVAL
          : CONFIG.BACKGROUND_UPDATE_INTERVAL,
      });

      // Adjust update interval based on app state
      if (this.updateInterval) {
        clearInterval(this.updateInterval);

        if (this.isActive) {
          // App is active, use standard interval
          this.updateInterval = setInterval(() => {
            this.updateThrottler.execute()?.catch((error: Error) => {
              logger.error('Failed to update conditions in interval', error);
            });
          }, CONFIG.STANDARD_UPDATE_INTERVAL);

          // Force an immediate update when coming to foreground
          this.updateThrottler.execute()?.catch((error: Error) => {
            logger.error('Failed to update conditions on foreground', error);
          });
        } else {
          // App is in background, use longer interval
          this.updateInterval = setInterval(() => {
            this.updateThrottler.execute()?.catch((error: Error) => {
              logger.error('Failed to update conditions in background', error);
            });
          }, CONFIG.BACKGROUND_UPDATE_INTERVAL);
        }
      }
    };

    // Subscribe to app state changes
    this.appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
  }

  private async updateConditionsThrottled(): Promise<void> {
    try {
      // Add timeout promise to prevent hanging
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error('Update timed out')), 10000); // 10 second timeout
      });

      // Create the implementation function to race against the timeout
      const updateConditionsImpl = async (): Promise<void> => {
        let attempt = 0;
        while (attempt < CONFIG.MAX_RETRY_ATTEMPTS) {
          try {
            logger.info('Updating environmental conditions', {
              attempt,
              isActive: this.isActive,
            });

            // Get location (throttled)
            const locationPromise = this.locationThrottler.execute();
            if (!locationPromise) {
              logger.warn('Location throttler returned null');
              return;
            }

            const location = await locationPromise;
            if (!location) {
              logger.warn('No location data available, using default values');
              return;
            }

            validateCoordinates(location.coords.latitude, location.coords.longitude);

            // Fetch weather (throttled)
            const weatherPromise = this.weatherThrottler.execute(
              location.coords.latitude,
              location.coords.longitude,
              location.coords.altitude || 0
            );

            if (!weatherPromise) {
              logger.warn('Weather throttler returned null');
              return;
            }

            const conditions = await weatherPromise;
            if (conditions) {
              validateEnvironmentalConditions(conditions);

              this.conditions = conditions;
              this.notifySubscribers();

              await AsyncStorage.setItem('last-known-conditions', JSON.stringify(conditions));
              logger.info('Successfully updated environmental conditions');
            }

            return; // Success, exit retry loop
          } catch (error) {
            attempt++;
            logger.error('Failed to update conditions', error as Error, { attempt });

            if (error instanceof LocationPermissionError) {
              // Don't retry permission errors
              break;
            }

            if (attempt < CONFIG.MAX_RETRY_ATTEMPTS) {
              // Wait before retrying with exponential backoff
              await new Promise(resolve =>
                setTimeout(resolve, CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1))
              );
              continue;
            }

            // All retries failed, try to recover from cache
            try {
              const lastConditions = await AsyncStorage.getItem('last-known-conditions');
              if (lastConditions) {
                const cachedConditions = JSON.parse(lastConditions) as EnvironmentalConditions;

                // Ensure wind gust is at least equal to wind speed
                cachedConditions.windGust = Math.max(
                  cachedConditions.windGust,
                  cachedConditions.windSpeed
                );

                validateEnvironmentalConditions(cachedConditions);
                this.conditions = cachedConditions;
                this.notifySubscribers();
                logger.warn('Using cached environmental conditions', {
                  age: Date.now() - this.lastFetchTime,
                  windSpeed: cachedConditions.windSpeed,
                  windGust: cachedConditions.windGust,
                });
              }
            } catch (storageError) {
              logger.error('Failed to retrieve cached conditions', storageError as Error);
              // If we can't recover from cache, we'll keep using the last known conditions
              // but we should notify the user that the data might be stale
              this.notifyError('Unable to update environmental conditions. Data may be outdated.');
            }
          }
        }
      };

      // Race the update against a timeout
      await Promise.race([updateConditionsImpl(), timeoutPromise]);
    } catch (error) {
      // Handle timeout or other errors
      logger.error('Update failed or timed out', error as Error);
      // Notify subscribers anyway with last known data
      this.notifySubscribers();
    }
  }

  private async getLocationThrottled(): Promise<Location.LocationObject | null> {
    try {
      // Check for existing permissions first
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();

      // If permission already denied, use default values instead of crashing
      if (existingStatus === 'denied') {
        logger.warn('Location permission already denied, using default values');
        // Notify user but don't crash
        this.notifyError(
          new LocationPermissionError(),
          'Location permission denied. Using default values.'
        );
        return null;
      }

      // Request permissions if not already granted
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        logger.warn('Location permission denied by user, using default values');
        // Notify user but don't crash
        this.notifyError(
          new LocationPermissionError(),
          'Location permission denied. Using default values.'
        );
        return null;
      }

      // Get location only if permission granted
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return location;
    } catch (error) {
      logger.error('Error getting location', error as Error);
      return null;
    }
  }

  private async fetchWeatherThrottled(
    lat: number,
    lon: number,
    _altitude: number
  ): Promise<EnvironmentalConditions | null> {
    // Check cache first unless force refresh is active
    const now = Date.now();
    if (!this.forceRefreshFlag && now - this.lastFetchTime < CONFIG.CACHE_DURATION) {
      logger.info('Using cached weather conditions', { age: now - this.lastFetchTime });
      return this.conditions;
    }

    // Use Open-Meteo as primary provider, fallback to NWS
    try {
      logger.info('Fetching weather conditions', { lat, lon });
      const elevation = await elevationService.getElevation(lat, lon);
      const openMeteoStart = Date.now();
      const openMeteoResult = await fetchOpenMeteoEnvironmental(lat, lon, elevation);
      if (openMeteoResult) {
        this.lastProviderName = 'open-meteo';
        this.lastProviderLatencyMs = Date.now() - openMeteoStart;
        this.lastFallbackUsed = false;
        this.lastFetchTime = Date.now();
        this.forceRefreshFlag = false;
        return openMeteoResult;
      }
      // Fallback to NWS if Open-Meteo fails
      logger.warn('Open-Meteo failed; falling back to NWS');
      const nwsStart = Date.now();
      const nws = await fetchNwsWx(lat, lon);
      const mostRecent = nws ? pickMostRecent(nws) : null;
      if (mostRecent) {
        const mapped = toEnvironmentalConditions(mostRecent);
        if (
          mapped.temperature != null &&
          mapped.humidity != null &&
          mapped.pressure != null &&
          mapped.windSpeed != null
        ) {
          const mappedEnv: EnvironmentalConditions = {
            temperature: mapped.temperature!,
            humidity: mapped.humidity!,
            pressure: mapped.pressure!,
            altitude: elevation,
            windSpeed: mapped.windSpeed!,
            windDirection: mapped.windDirection ?? 0,
            windGust: mapped.windGust ?? mapped.windSpeed!,
            density: this.calculateAirDensity(
              mapped.temperature!,
              mapped.pressure!,
              mapped.humidity!
            ),
            obTime: mapped.obTime,
            city: '',
          };
          this.lastProviderName = 'nws';
          this.lastProviderLatencyMs = Date.now() - nwsStart;
          this.lastFallbackUsed = true;
          this.lastFetchTime = Date.now();
          this.forceRefreshFlag = false;
          return mappedEnv;
        }
      }
    } catch (e) {
      logger.error('Weather provider sequence failed', e as Error);
    }
    // If all providers failed, return last known conditions (may be defaults)
    logger.warn('Using last known conditions due to failed providers');
    return this.conditions ?? null;
  }

  private async notifyError(error: Error | string, message?: string): Promise<void> {
    const errorMsg = typeof error === 'string' ? error : error.message;
    logger.warn(message || errorMsg);

    // Use the safe error handler to prevent crashes
    await safeHandleError(typeof error === 'string' ? new Error(error) : error, {
      message: message || 'Unable to update environmental conditions',
      action:
        error instanceof LocationPermissionError
          ? {
              label: 'Open Settings',
              onPress: () => Linking.openSettings(),
            }
          : undefined,
    });
  }

  private calculateAirDensity(tempF: number, pressureMb: number, humidity: number): number {
    const tempC = ((tempF - 32) * 5) / 9;
    const pressurePa = pressureMb * 100;

    const svp =
      EnhancedEnvironmentalService.MAGNUS_A *
      Math.exp(
        (EnhancedEnvironmentalService.MAGNUS_B * tempC) /
          (tempC + EnhancedEnvironmentalService.MAGNUS_C)
      );
    const vaporPressure = (humidity / 100) * svp;

    return (
      (pressurePa - vaporPressure * 100) /
        (EnhancedEnvironmentalService.GAS_CONSTANT_DRY * (tempC + 273.15)) +
      (vaporPressure * 100) / (EnhancedEnvironmentalService.GAS_CONSTANT_VAPOR * (tempC + 273.15))
    );
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback({ ...this.conditions }));
  }

  // Constants from YardageModelEnhanced
  private static readonly MAGNUS_A = 6.1121;
  private static readonly MAGNUS_B = 17.502;
  private static readonly MAGNUS_C = 240.97;
  private static readonly GAS_CONSTANT_DRY = 287.058;
  private static readonly GAS_CONSTANT_VAPOR = 461.495;
}

export const enhancedEnvironmentalService = EnhancedEnvironmentalService.getInstance();
