/**
 * permissions.ts
 *
 * A utility for managing permissions with caching support.
 * Handles permission requests, checks, and caching for various
 * permission types required by the application.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import * as Sensors from 'expo-sensors';
import { LogManager } from './LogManager';

// Create a logger for permissions
const logger = LogManager.getLogger('permissions');

// Permission types
export enum PermissionType {
  LOCATION = 'location',
  COMPASS = 'compass',
  NOTIFICATIONS = 'notifications',
}

// Permission states
export enum PermissionState {
  GRANTED = 'granted',
  DENIED = 'denied',
  UNDETERMINED = 'undetermined',
}

// Permission cache keys
const PERMISSION_CACHE_PREFIX = 'permission_';
const PERMISSION_CACHE_VERSION = 1;

// Cache expiration time (24 hours)
const CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Get cached permission state
 * @param type Permission type
 * @returns Cached permission state or null if not cached
 */
async function getCachedPermissionState(type: PermissionType): Promise<PermissionState | null> {
  try {
    const key = `${PERMISSION_CACHE_PREFIX}${type}`;
    const value = await AsyncStorage.getItem(key);

    if (!value) return null;

    const cacheData = JSON.parse(value);

    // Check cache version and expiration
    if (cacheData.version !== PERMISSION_CACHE_VERSION) {
      logger.info(`Permission cache version mismatch for ${type}, clearing cache`);
      await AsyncStorage.removeItem(key);
      return null;
    }

    if (Date.now() - cacheData.timestamp > CACHE_TTL) {
      logger.info(`Permission cache expired for ${type}, clearing cache`);
      await AsyncStorage.removeItem(key);
      return null;
    }

    logger.debug(`Retrieved cached permission state for ${type}: ${cacheData.state}`);
    return cacheData.state as PermissionState;
  } catch (error) {
    logger.error('Error reading permission cache:', error);
    return null;
  }
}

/**
 * Cache permission state
 * @param type Permission type
 * @param state Permission state
 */
async function cachePermissionState(type: PermissionType, state: PermissionState): Promise<void> {
  try {
    const cacheData = {
      state,
      timestamp: Date.now(),
      version: PERMISSION_CACHE_VERSION,
    };

    await AsyncStorage.setItem(
      `${PERMISSION_CACHE_PREFIX}${type}`,
      JSON.stringify(cacheData)
    );

    logger.debug(`Cached permission state for ${type}: ${state}`);
  } catch (error) {
    logger.error('Error caching permission state:', error);
  }
}

/**
 * Request permission with caching
 * @param type Permission type
 * @returns Permission state
 */
export async function requestPermission(type: PermissionType): Promise<PermissionState> {
  // Check cache first
  const cachedState = await getCachedPermissionState(type);
  if (cachedState === PermissionState.GRANTED) {
    logger.info(`Using cached permission for ${type}: ${cachedState}`);
    return PermissionState.GRANTED;
  }

  // Request permission based on type
  let result;
  try {
    switch (type) {
      case PermissionType.LOCATION:
        logger.info('Requesting location permission');
        result = await Location.requestForegroundPermissionsAsync();
        break;

      case PermissionType.COMPASS:
        // On iOS, compass requires motion permissions
        if (Platform.OS === 'ios') {
          logger.info('Requesting motion permission for compass (iOS)');
          result = { status: 'granted' }; // Simplified as expo-sensors doesn't have requestPermissionsAsync
        } else {
          // Android doesn't require explicit permission for compass
          logger.info('No explicit permission needed for compass on Android');
          result = { status: 'granted' };
        }
        break;

      case PermissionType.NOTIFICATIONS:
        // Implement notification permission request
        // This will depend on the notification library being used
        logger.info('Notification permissions not yet implemented');
        result = { status: 'undetermined' };
        break;

      default:
        throw new Error(`Unknown permission type: ${type}`);
    }
  } catch (error) {
    logger.error(`Error requesting permission for ${type}:`, error);
    return PermissionState.UNDETERMINED;
  }

  // Cache and return result
  const state = result.status === 'granted'
    ? PermissionState.GRANTED
    : result.status === 'denied'
      ? PermissionState.DENIED
      : PermissionState.UNDETERMINED;

  await cachePermissionState(type, state);

  logger.info(`Permission request for ${type} result: ${state}`);
  return state;
}

/**
 * Check if permission is granted
 * @param type Permission type
 * @returns True if permission is granted
 */
export async function hasPermission(type: PermissionType): Promise<boolean> {
  const state = await getCachedPermissionState(type);
  if (state === PermissionState.GRANTED) {
    return true;
  }

  // If not cached or not granted, check current status
  let result;
  try {
    switch (type) {
      case PermissionType.LOCATION:
        result = await Location.getForegroundPermissionsAsync();
        break;

      case PermissionType.COMPASS:
        if (Platform.OS === 'ios') {
          result = { status: 'granted' }; // Simplified as expo-sensors doesn't have getPermissionsAsync
        } else {
          // Android doesn't require explicit permission for compass
          result = { status: 'granted' };
        }
        break;

      case PermissionType.NOTIFICATIONS:
        // Implement notification permission check
        result = { status: 'undetermined' };
        break;

      default:
        throw new Error(`Unknown permission type: ${type}`);
    }
  } catch (error) {
    logger.error(`Error checking permission for ${type}:`, error);
    return false;
  }

  // Cache and return result
  const newState = result.status === 'granted'
    ? PermissionState.GRANTED
    : result.status === 'denied'
      ? PermissionState.DENIED
      : PermissionState.UNDETERMINED;

  await cachePermissionState(type, newState);

  return newState === PermissionState.GRANTED;
}

/**
 * Clear permission cache
 * @param type Optional permission type, if not provided all permission caches will be cleared
 */
export async function clearPermissionCache(type?: PermissionType): Promise<void> {
  try {
    if (type) {
      await AsyncStorage.removeItem(`${PERMISSION_CACHE_PREFIX}${type}`);
      logger.info(`Cleared permission cache for ${type}`);
    } else {
      const keys = await AsyncStorage.getAllKeys();
      const permissionKeys = keys.filter(key => key.startsWith(PERMISSION_CACHE_PREFIX));
      await AsyncStorage.multiRemove(permissionKeys);
      logger.info(`Cleared all permission caches (${permissionKeys.length} items)`);
    }
  } catch (error) {
    logger.error('Error clearing permission cache:', error);
  }
}

/**
 * Get all cached permissions
 * @returns Object with permission types as keys and states as values
 */
export async function getAllPermissions(): Promise<Record<PermissionType, PermissionState>> {
  const result: Partial<Record<PermissionType, PermissionState>> = {};

  // Initialize with undetermined state
  Object.values(PermissionType).forEach(type => {
    result[type] = PermissionState.UNDETERMINED;
  });

  // Get all cached permissions
  try {
    const keys = await AsyncStorage.getAllKeys();
    const permissionKeys = keys.filter(key => key.startsWith(PERMISSION_CACHE_PREFIX));

    const pairs = await AsyncStorage.multiGet(permissionKeys);
    for (const [key, value] of pairs) {
      if (!value) continue;

      const type = key.replace(PERMISSION_CACHE_PREFIX, '') as PermissionType;
      const cacheData = JSON.parse(value);

      // Check cache version and expiration
      if (cacheData.version !== PERMISSION_CACHE_VERSION ||
          Date.now() - cacheData.timestamp > CACHE_TTL) {
        continue;
      }

      result[type] = cacheData.state as PermissionState;
    }
  } catch (error) {
    logger.error('Error getting all permissions:', error);
  }

  return result as Record<PermissionType, PermissionState>;
}
