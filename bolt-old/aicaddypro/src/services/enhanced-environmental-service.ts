/**
 * enhanced-environmental-service.ts
 *
 * An enhanced version of the environmental service with throttling
 * and background mode support for better performance and battery life.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
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
  validateWeatherAPIResponse,
} from './validation/environmental-validation';
import { fetchMetarWx } from './weather/metar-adapter';
import { pickMostRecent, toEnvironmentalConditions } from './weather/normalize';
import { fetchNwsWx } from './weather/nws-adapter';
import { fetchOpenMeteoEnvironmental } from './weather/openmeteo-adapter';
import { convertMslToStationPressure } from './weather/density';

// Import error notification service
import { safeHandleError } from '../services/notification';

// Read API key from environment or Expo extra; configure via EAS env or dev shell
function getPublicEnv(key: string): string | undefined {
  const fromEnv = (process.env as any)?.[key];
  // Expo SDK 49+ exposes static config via Constants.expoConfig in dev and build
  const fromExtra = (Constants?.expoConfig as any)?.extra?.[key];
  // Legacy manifest fallback (older runtimes)
  const fromManifest = (Constants as any)?.manifest?.extra?.[key];
  return fromEnv ?? fromExtra ?? fromManifest ?? undefined;
}

const STORMGLASS_API_KEY = getPublicEnv('EXPO_PUBLIC_STORMGLASS_API_KEY');

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

// Simple feature flags for controlled rollout
const FLAGS = {
  weather: {
    forceOpenMeteo: false,
  },
} as const;

// Export the interface for use in validation
export interface StormglassResponse {
  hours: Array<{
    airTemperature: {
      noaa: number;
    };
    humidity: {
      noaa: number;
    };
    pressure: {
      noaa: number;
    };
    windSpeed: {
      noaa: number;
    };
    windDirection: {
      noaa: number;
    };
    gust: {
      noaa: number;
    };
    time: string;
  }>;
  meta: {
    start: string;
    end: string;
    lat: number;
    lng: number;
    params: string[];
    source: string[];
    cost: number;
    dailyQuota: number;
    requestCount: number;
  };
}

export class EnhancedEnvironmentalService {
  private static instance: EnhancedEnvironmentalService;
  private conditions: EnvironmentalConditions;
  private readonly subscribers: Set<(conditions: EnvironmentalConditions) => void>;
  private updateInterval: ReturnType<typeof setInterval> | null;
  private lastFetchTime: number = 0;
  private forceRefreshFlag: boolean = false;
  private isActive: boolean = true;
  private appStateSubscription: { remove: () => void } | null = null;
  private lastProviderName: 'stormglass' | 'open-meteo' | 'nws' | 'none' = 'none';
  private lastProviderLatencyMs: number = 0;
  private lastFallbackUsed: boolean = false;

  // Throttle managers
  private locationThrottler: ThrottleManager<Promise<Location.LocationObject | null>>;
  private weatherThrottler: ThrottleManager<Promise<EnvironmentalConditions | null>>;
  private updateThrottler: ThrottleManager<Promise<void>>;

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
    // Optional override for testing fallback provider (from flags or saved settings)
    let forceOpenMeteo: boolean = FLAGS.weather.forceOpenMeteo;
    try {
      const saved = await AsyncStorage.getItem('userSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.forceOpenMeteo === true) {
          forceOpenMeteo = true;
        }
      }
    } catch {}

    if (forceOpenMeteo) {
      logger.info('FLAGS: Forcing Open-Meteo provider');
      const elevation = await elevationService.getElevation(lat, lon);
      const om = await fetchOpenMeteoEnvironmental(lat, lon, elevation);
      if (om) {
        this.lastProviderName = 'open-meteo';
        return om;
      }
      logger.warn('Forced Open-Meteo failed; falling back to Stormglass');
    }
    // Check cache first unless force refresh is active
    const now = Date.now();
    if (!this.forceRefreshFlag && now - this.lastFetchTime < CONFIG.CACHE_DURATION) {
      logger.info('Using cached weather conditions', { age: now - this.lastFetchTime });
      return this.conditions;
    }

    if (!STORMGLASS_API_KEY) {
      // No primary provider key configured — use fallback providers directly
      logger.warn('Stormglass API key not configured; using fallback provider(s)');
      try {
        const elevation = await elevationService.getElevation(lat, lon);
        const fallbackStart = Date.now();
        const fallback = await fetchOpenMeteoEnvironmental(lat, lon, elevation);
        if (fallback) {
          this.lastProviderName = 'open-meteo';
          this.lastProviderLatencyMs = Date.now() - fallbackStart;
          this.lastFallbackUsed = true;
          this.lastFetchTime = Date.now();
          this.forceRefreshFlag = false;
          const blended = await this.maybeBlendWithMetar(fallback, lat, lon);
          return blended;
        }
        // Try NWS as additional fallback
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
            const blended = await this.maybeBlendWithMetar(mappedEnv, lat, lon);
            return blended;
          }
        }
      } catch (e) {
        logger.error('Fallback provider sequence failed without Stormglass key', e as Error);
      }
      // If all fallbacks failed, return last known conditions (may be defaults)
      logger.warn('Using last known conditions due to missing key and failed fallbacks');
      return this.conditions ?? null;
    }

    try {
      logger.info('Fetching weather conditions', { lat, lon });

      // Fetch weather and elevation data in parallel
      const stormglassStart = Date.now();

      const providerTimeout = new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('Provider timeout')), 2000)
      );

      const stormglassFetch = fetch(
        `https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lon}&params=airTemperature,humidity,pressure,windSpeed,windDirection,gust&source=noaa&start=${new Date().toISOString()}&end=${new Date().toISOString()}`,
        {
          headers: {
            Authorization: STORMGLASS_API_KEY,
            Accept: 'application/json',
          },
        }
      ).catch(error => {
        throw new NetworkError(`Weather API request failed: ${error.message}`);
      });

      const [weatherResponse, elevation] = await Promise.all([
        Promise.race([stormglassFetch, providerTimeout]) as Promise<Response>,
        elevationService.getElevation(lat, lon),
      ]);

      if (!weatherResponse.ok) {
        const errorText = await weatherResponse.text();
        const error = new WeatherAPIError(
          weatherResponse.status,
          `Weather API error: ${weatherResponse.status} ${weatherResponse.statusText} - ${errorText}`
        );
        logger.error('Stormglass API error response:', error);
        throw error;
      }

      const data = (await weatherResponse.json()) as StormglassResponse;

      // Log raw API response
      logger.info('Raw Stormglass API response:', {
        raw: JSON.stringify(data, null, 2),
        timestamp: new Date().toISOString(),
        endpoint: `https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lon}`,
        params: 'airTemperature,humidity,pressure,windSpeed,windDirection,gust',
        source: 'noaa',
      });

      // Validate response structure
      if (!data || typeof data !== 'object') {
        const error = new WeatherAPIError(500, 'Invalid API response: Response is not an object');
        logger.error('Invalid API response structure:', error);
        throw error;
      }

      if (!Array.isArray(data.hours)) {
        const error = new WeatherAPIError(500, 'Invalid API response: Data is not an array');
        logger.error('Invalid API response structure:', error);
        throw error;
      }

      if (data.hours.length === 0) {
        const error = new WeatherAPIError(500, 'Invalid API response: No data points available');
        logger.error('Invalid API response structure:', error);
        throw error;
      }

      // Get the most recent data point
      const weatherData = data.hours[0];

      // Log timestamp information
      const currentTime = new Date();
      const dataTime = new Date(weatherData.time);
      const timeDiff = Math.abs(currentTime.getTime() - dataTime.getTime()) / 1000; // difference in seconds

      logger.info('Weather data timestamps:', {
        currentTime: currentTime.toISOString(),
        dataTime: dataTime.toISOString(),
        timeDifferenceSeconds: timeDiff,
        isRecent: timeDiff <= 3600, // Consider data recent if within last hour
      });

      // Check if data is too old (more than 1 hour)
      if (timeDiff > 3600) {
        logger.warn('Weather data may be stale', {
          timeDifferenceSeconds: timeDiff,
          dataTime: dataTime.toISOString(),
          currentTime: currentTime.toISOString(),
        });
      }

      // Check for required fields
      const requiredFields = [
        'airTemperature',
        'humidity',
        'pressure',
        'windSpeed',
        'windDirection',
        'gust',
      ] as const;

      const missingFields = requiredFields.filter(field => !weatherData[field]);
      if (missingFields.length > 0) {
        const error = new WeatherAPIError(
          500,
          `Invalid API response: Missing required fields: ${missingFields.join(', ')}`
        );
        logger.error('Missing required fields in API response:', error);
        throw error;
      }

      // Log individual data points before validation
      logger.info('Stormglass data points before validation:', {
        airTemperature: {
          raw: weatherData.airTemperature,
          value: weatherData.airTemperature?.noaa,
          unit: '°F',
        },
        humidity: {
          raw: weatherData.humidity,
          value: weatherData.humidity?.noaa,
          unit: '%',
        },
        pressure: {
          raw: weatherData.pressure,
          value: weatherData.pressure?.noaa,
          unit: 'hPa',
        },
        windSpeed: {
          raw: weatherData.windSpeed,
          value: weatherData.windSpeed?.noaa,
          unit: 'm/s',
        },
        windDirection: {
          raw: weatherData.windDirection,
          value: weatherData.windDirection?.noaa,
          unit: 'degrees',
        },
        gust: {
          raw: weatherData.gust,
          value: weatherData.gust?.noaa,
          unit: 'm/s',
        },
        meta: {
          start: data.meta?.start,
          end: data.meta?.end,
        },
      });

      // Check for missing NOAA values (treat 0 as valid)
      const missingNoaaValues = requiredFields.filter(field => {
        const container = weatherData[field as keyof typeof weatherData] as
          | { noaa?: number }
          | undefined;
        return container == null || container.noaa == null;
      });
      if (missingNoaaValues.length > 0) {
        const error = new WeatherAPIError(
          500,
          `Invalid API response: Missing NOAA values for fields: ${missingNoaaValues.join(', ')}`
        );
        logger.error('Missing NOAA values in API response:', error);
        throw error;
      }

      validateWeatherAPIResponse(data);

      logger.info('Weather data received:', {
        temp: weatherData.airTemperature.noaa,
        humidity: weatherData.humidity.noaa,
        pressure: weatherData.pressure.noaa,
        windSpeed: weatherData.windSpeed.noaa,
        windDirection: weatherData.windDirection.noaa,
        windGust: weatherData.gust.noaa,
      });

      logger.info('Elevation data received:', { elevation });

      // Ensure wind gust is never less than wind speed
      const windSpeed = weatherData.windSpeed.noaa;
      const windGust = Math.max(weatherData.gust.noaa, windSpeed);

      // Convert units
      const tempC = weatherData.airTemperature.noaa;
      const tempF = (tempC * 9) / 5 + 32;
      const windSpeedMph = windSpeed * 2.23694; // m/s to mph
      const windGustMph = windGust * 2.23694; // m/s to mph

      // Stormglass provides MSL pressure - convert to station pressure for accurate density calculation
      const pressureMsl = weatherData.pressure.noaa;
      const stationPressure = convertMslToStationPressure(pressureMsl, elevation, tempF);

      logger.info('Pressure conversion (Stormglass MSL to station):', {
        pressureMsl,
        stationPressure,
        elevation,
        tempF,
        difference: pressureMsl - stationPressure
      });

      let conditions: EnvironmentalConditions = {
        temperature: tempF,
        humidity: weatherData.humidity.noaa,
        pressure: stationPressure,
        altitude: elevation,
        windSpeed: windSpeedMph,
        windDirection: weatherData.windDirection.noaa,
        windGust: windGustMph,
        density: this.calculateAirDensity(
          tempF,
          stationPressure,
          weatherData.humidity.noaa
        ),
        // Stormglass times are ISO8601 with timezone. Normalize to UTC Z for consistency
        obTime: (() => {
          const t = weatherData.time || data.meta.start;
          if (!t) return '';
          // If already contains a timezone designator, convert to UTC string
          try {
            const dt = new Date(t);
            return dt.toISOString();
          } catch {
            return t;
          }
        })(),
        city: '', // Stormglass doesn't provide city name
      };

      logger.info('Calculated conditions:', {
        temperature: conditions.temperature,
        humidity: conditions.humidity,
        pressure: conditions.pressure,
        altitude: conditions.altitude,
        windSpeed: conditions.windSpeed,
        windDirection: conditions.windDirection,
        windGust: conditions.windGust,
        density: conditions.density,
      });

      // Validate the calculated conditions
      validateEnvironmentalConditions(conditions);

      // Default provider is Stormglass at this point
      this.lastProviderName = 'stormglass';
      this.lastProviderLatencyMs = Date.now() - stormglassStart;
      this.lastFallbackUsed = false;

      this.lastFetchTime = now;
      this.forceRefreshFlag = false; // Reset the force refresh flag after successful fetch
      logger.info('Successfully fetched weather conditions', {
        temperature: conditions.temperature,
        windSpeed: conditions.windSpeed,
        windGust: conditions.windGust,
        altitude: conditions.altitude,
      });

      // If conditions look incomplete (null/undefined), try Open-Meteo as a fallback immediately
      if (
        conditions.temperature == null ||
        conditions.humidity == null ||
        conditions.pressure == null ||
        conditions.windSpeed == null
      ) {
        const fallbackStart = Date.now();
        const fallback = await fetchOpenMeteoEnvironmental(lat, lon, elevation);
        if (fallback) {
          conditions = fallback;
          this.lastProviderName = 'open-meteo';
          this.lastProviderLatencyMs = Date.now() - fallbackStart;
          this.lastFallbackUsed = true;
        } else {
          // Try NWS as additional fallback
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
              conditions = {
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
            }
          }
        }
      }

      // Optionally blend with METAR if enabled
      conditions = await this.maybeBlendWithMetar(conditions, lat, lon);
      return conditions;
    } catch (error) {
      logger.error('Error fetching weather conditions', error as Error, { lat, lon });

      // On provider error or timeout, attempt Open-Meteo fallback immediately
      try {
        const elevation = await elevationService.getElevation(lat, lon);
        const fallbackStart = Date.now();
        const fallback = await fetchOpenMeteoEnvironmental(lat, lon, elevation);
        if (fallback) {
          this.lastProviderName = 'open-meteo';
          this.lastProviderLatencyMs = Date.now() - fallbackStart;
          this.lastFallbackUsed = true;
          const blended = await this.maybeBlendWithMetar(fallback, lat, lon);
          return blended;
        }
        // Try NWS
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
            this.lastProviderName = 'nws';
            this.lastProviderLatencyMs = Date.now() - nwsStart;
            this.lastFallbackUsed = true;
            const mappedEnv = {
              temperature: mapped.temperature!,
              humidity: mapped.humidity!,
              pressure: mapped.pressure!,
              altitude: 0,
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
            } as EnvironmentalConditions;
            const blended = await this.maybeBlendWithMetar(mappedEnv, lat, lon);
            return blended;
          }
        }
      } catch (fallbackError) {
        logger.error('Fallback (Open-Meteo) failed', fallbackError as Error);
      }

      if (this.conditions) {
        logger.warn('Using last known conditions due to fetch error and failed fallback');
        return this.conditions;
      }

      // Re-throw the error to be handled by the retry mechanism in updateConditions
      throw error;
    }
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

  /**
   * Optionally blend current conditions with METAR observations based on Settings flags
   */
  private async maybeBlendWithMetar(
    base: EnvironmentalConditions,
    lat: number,
    lon: number
  ): Promise<EnvironmentalConditions> {
    try {
      const saved = await AsyncStorage.getItem('userSettings');
      if (!saved) return base;
      const settings = JSON.parse(saved) as Partial<{
        useMetar: boolean;
        metarIcao: string;
      }>;
      if (!settings.useMetar) return base;
      const icao = (settings.metarIcao || '').trim().toUpperCase();
      if (!icao) return base;

      const metar = await fetchMetarWx(icao);
      const point = metar ? pickMostRecent(metar) : null;
      if (!point) return base;
      // Filter obviously invalid pressure values
      if (point.pressure_hpa != null && (point.pressure_hpa < 800 || point.pressure_hpa > 1200)) {
        logger.warn('Discarding METAR due to invalid pressure', {
          pressure_hpa: point.pressure_hpa,
        });
        return base;
      }

      // Age-based weighting: <=60 min: w=0.7; 60–120 min: taper to 0; >120 min: 0
      const metarTs = new Date(point.ts).getTime();
      const ageSec = Math.max(0, (Date.now() - metarTs) / 1000);
      let w = 0;
      if (ageSec <= 3600) w = 0.7;
      else if (ageSec <= 7200) w = 0.7 * (1 - (ageSec - 3600) / 3600);
      else w = 0;
      if (w <= 0) return base;

      const mapped = toEnvironmentalConditions(point);

      // Blend pressure (hPa)
      const pressure =
        mapped.pressure != null ? w * mapped.pressure + (1 - w) * base.pressure : base.pressure;

      // Blend wind vectorially (mph)
      const metarSpeed = mapped.windSpeed ?? null;
      const metarDir = mapped.windDirection ?? null;

      let windSpeed = base.windSpeed;
      let windDirection = base.windDirection;

      if (metarSpeed != null && metarDir != null) {
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const baseX = base.windSpeed * Math.cos(toRad(base.windDirection));
        const baseY = base.windSpeed * Math.sin(toRad(base.windDirection));
        const metX = metarSpeed * Math.cos(toRad(metarDir));
        const metY = metarSpeed * Math.sin(toRad(metarDir));
        const blendX = w * metX + (1 - w) * baseX;
        const blendY = w * metY + (1 - w) * baseY;
        windSpeed = Math.sqrt(blendX * blendX + blendY * blendY);
        windDirection = ((Math.atan2(blendY, blendX) * 180) / Math.PI + 360) % 360;
      }

      // Gust: keep forecast gust if METAR missing
      const windGust =
        mapped.windGust != null ? Math.max(mapped.windGust, windSpeed) : base.windGust;

      let blended: EnvironmentalConditions = {
        ...base,
        pressure,
        windSpeed,
        windDirection,
        windGust,
        // Recompute density using blended pressure; keep base temperature/humidity
        density: this.calculateAirDensity(base.temperature, pressure, base.humidity),
      };

      // Guard against invalid numbers from parsing/blend
      if (!Number.isFinite(blended.windSpeed)) {
        logger.warn('METAR blend produced invalid windSpeed; falling back to base', {
          windSpeed,
          metarSpeed,
          baseWind: base.windSpeed,
        });
        blended.windSpeed = base.windSpeed;
      }
      if (!Number.isFinite(blended.windGust)) {
        blended.windGust = Math.max(base.windGust, blended.windSpeed);
      }
      if (!Number.isFinite(blended.windDirection)) {
        blended.windDirection = base.windDirection;
      }

      return blended;
    } catch (e) {
      logger.error('METAR blend failed', e as Error);
      return base;
    }
  }

  // Constants from YardageModelEnhanced
  private static readonly MAGNUS_A = 6.1121;
  private static readonly MAGNUS_B = 17.502;
  private static readonly MAGNUS_C = 240.97;
  private static readonly GAS_CONSTANT_DRY = 287.058;
  private static readonly GAS_CONSTANT_VAPOR = 461.495;
}

export const enhancedEnvironmentalService = EnhancedEnvironmentalService.getInstance();
