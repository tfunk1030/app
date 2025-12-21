import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get app version from app.json or expo constants
const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

// Cache version should be bumped whenever the cache structure changes
const CACHE_VERSION = '1.0.0';
const CACHE_VERSION_KEY = 'app-cache-version';
const CACHE_DATA_KEY = 'app-cache-data';

// Default max age of cache data (7 days in milliseconds)
const DEFAULT_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

type CacheMetadata = {
  version: string;
  timestamp: number;
  appVersion: string;
  buildNumber?: string;
  platformOS?: string;
};

/**
 * CacheManager handles caching operations with version control and data validation
 * to prevent app crashes due to corrupted or incompatible cache data.
 */
export class CacheManager {
  /**
   * Save data to cache with versioning
   */
  static async saveCache<T>(data: T, key: string = CACHE_DATA_KEY): Promise<void> {
    try {
      // Create metadata
      const metadata: CacheMetadata = {
        version: CACHE_VERSION,
        timestamp: Date.now(),
        appVersion: APP_VERSION,
        buildNumber: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode?.toString(),
        platformOS: Platform.OS,
      };

      // Save both metadata and data
      const cacheData = {
        metadata,
        data
      };

      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
      await AsyncStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);

      console.log(`Cache saved successfully for key [${key}] with version ${CACHE_VERSION}`);
    } catch (error) {
      console.error(`Failed to save cache for key [${key}]:`, error);
      throw error;
    }
  }

  /**
   * Load data from cache with validation
   */
  static async loadCache<T>(
    key: string = CACHE_DATA_KEY,
    options: { maxAge?: number; skipVersionCheck?: boolean } = {}
  ): Promise<T | null> {
    try {
      // Set defaults
      const maxAge = options.maxAge || DEFAULT_MAX_AGE;
      const skipVersionCheck = options.skipVersionCheck || false;

      // Check version first, unless skipped
      if (!skipVersionCheck) {
        const cacheVersion = await AsyncStorage.getItem(CACHE_VERSION_KEY);

        // If version mismatch or missing, clear and return null
        if (cacheVersion !== CACHE_VERSION) {
          console.log(`Cache version mismatch (stored: ${cacheVersion}, current: ${CACHE_VERSION}), clearing cache`);
          await this.clearCache(key);
          return null;
        }
      }

      // Load the actual data
      const cacheDataStr = await AsyncStorage.getItem(key);
      if (!cacheDataStr) {
        console.log(`No cache data found for key [${key}]`);
        return null;
      }

      // Parse and validate
      try {
        const cacheData = JSON.parse(cacheDataStr);

        // Validate basic structure
        if (!cacheData.metadata || !cacheData.data) {
          throw new Error('Invalid cache format');
        }

        // Validate metadata
        const { metadata } = cacheData;
        if (!skipVersionCheck && metadata.version !== CACHE_VERSION) {
          throw new Error('Cache version mismatch');
        }

        // Check if cache is too old
        const cacheAge = Date.now() - metadata.timestamp;
        if (cacheAge > maxAge) {
          throw new Error('Cache too old');
        }

        // Additional integrity checks based on app version
        if (metadata.appVersion !== APP_VERSION) {
          console.warn(`Cache was created with different app version (stored: ${metadata.appVersion}, current: ${APP_VERSION})`);
          // You might choose to invalidate cache here depending on how breaking your version changes are
        }

        return cacheData.data as T;
      } catch (error) {
        console.error(`Error parsing or validating cache for key [${key}]:`, error);
        await this.clearCache(key);
        return null;
      }
    } catch (error) {
      console.error(`Failed to load cache for key [${key}]:`, error);
      return null;
    }
  }

  /**
   * Clear specific cache data
   */
  static async clearCache(key: string = CACHE_DATA_KEY): Promise<void> {
    try {
      // Clear AsyncStorage cache
      await AsyncStorage.removeItem(key);
      console.log(`Successfully cleared cache for key [${key}]`);
    } catch (error) {
      console.error(`Failed to clear cache for key [${key}]:`, error);
      throw error;
    }
  }

  /**
   * Clear all app cache data
   */
  static async clearAllCache(): Promise<void> {
    try {
      // Get all keys
      const keys = await AsyncStorage.getAllKeys();

      // Filter to app-specific keys if desired
      const appKeys = keys.filter(k =>
        k.startsWith('app-') ||
        k === CACHE_VERSION_KEY
      );

      // Clear all app keys
      if (appKeys.length > 0) {
        await AsyncStorage.multiRemove(appKeys);
      }

      // Also clear file system cache if it exists
      if (FileSystem.documentDirectory) {
        const cachePath = FileSystem.documentDirectory + 'app-cache/';
        const cacheInfo = await FileSystem.getInfoAsync(cachePath);

        if (cacheInfo.exists) {
          await FileSystem.deleteAsync(cachePath, { idempotent: true });
        }
      }

      console.log('All cache data cleared successfully');
    } catch (error) {
      console.error('Failed to clear all cache:', error);
      throw error;
    }
  }

  /**
   * Validate cache integrity
   */
  static async validateCacheIntegrity(key: string = CACHE_DATA_KEY): Promise<boolean> {
    try {
      const cacheDataStr = await AsyncStorage.getItem(key);
      if (!cacheDataStr) return false;

      // Try to parse the JSON
      try {
        const cacheData = JSON.parse(cacheDataStr);
        return (
          cacheData &&
          typeof cacheData === 'object' &&
          cacheData.metadata &&
          typeof cacheData.metadata === 'object' &&
          cacheData.data !== undefined
        );
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Backup important cache data before potentially destructive operations
   */
  static async backupCache(key: string = CACHE_DATA_KEY): Promise<boolean> {
    try {
      const cacheDataStr = await AsyncStorage.getItem(key);
      if (!cacheDataStr) return false;

      await AsyncStorage.setItem(`${key}_backup`, cacheDataStr);
      console.log(`Successfully backed up cache data for key [${key}]`);
      return true;
    } catch (error) {
      console.error(`Failed to backup cache for key [${key}]:`, error);
      return false;
    }
  }

  /**
   * Restore from backup if main cache is corrupted
   */
  static async restoreFromBackup(key: string = CACHE_DATA_KEY): Promise<boolean> {
    try {
      const backupDataStr = await AsyncStorage.getItem(`${key}_backup`);
      if (!backupDataStr) {
        console.log(`No backup found for key [${key}]`);
        return false;
      }

      // Validate backup data integrity
      try {
        JSON.parse(backupDataStr);
      } catch {
        console.error(`Backup data for key [${key}] is corrupted`);
        return false;
      }

      await AsyncStorage.setItem(key, backupDataStr);
      console.log(`Successfully restored cache from backup for key [${key}]`);
      return true;
    } catch (error) {
      console.error(`Failed to restore cache from backup for key [${key}]:`, error);
      return false;
    }
  }
}

export default CacheManager;
