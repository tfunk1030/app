import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import CacheManager from './cacheManager';

// Get app version from app.json or expo constants
const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

/**
 * SegmentedCacheManager extends the base CacheManager to provide
 * more granular control over different parts of the cache.
 *
 * This helps prevent total cache invalidation when only one segment is corrupted.
 */
export class SegmentedCacheManager {
  // Define cache segment keys
  public static readonly SEGMENT_KEYS = {
    USER_PREFERENCES: 'user-preferences',
    COURSE_DATA: 'course-data',
    SHOT_HISTORY: 'shot-history',
    OFFLINE_MAPS: 'offline-maps',
    // Add more segments as needed
  };

  // Cache version for all segments - increment when cache structure changes
  private static readonly CACHE_VERSION = '1.0.0';

  // Integrity marker key prefix
  private static readonly INTEGRITY_MARKER_PREFIX = 'cache-integrity-';

  /**
   * Initialize the cache system
   * Sets up integrity markers and ensures the cache directory exists
   */
  public static async initialize(): Promise<boolean> {
    try {
      // Create cache directory if it doesn't exist
      if (FileSystem.documentDirectory) {
        const cachePath = FileSystem.documentDirectory + 'app-cache/';
        const dirInfo = await FileSystem.getInfoAsync(cachePath);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(cachePath, { intermediates: true });
        }
      }

      // Initialize integrity markers for all segments
      const segments = Object.values(this.SEGMENT_KEYS);
      await Promise.all(
        segments.map(segment => this.setIntegrityMarker(segment))
      );

      console.log('Segmented cache system initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize segmented cache system:', error);
      return false;
    }
  }

  /**
   * Get data from a specific cache segment
   */
  public static async getSegment<T>(segment: keyof typeof SegmentedCacheManager.SEGMENT_KEYS): Promise<T | null> {
    const key = this.SEGMENT_KEYS[segment];
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error retrieving segment ${segment}:`, error);
      // Only invalidate this segment
      this.clearSegment(segment).catch(e =>
        console.error(`Failed to clear segment ${segment}:`, e)
      );
      return null;
    }
  }

  /**
   * Save data to a specific cache segment
   */
  public static async setSegment<T>(
    segment: keyof typeof SegmentedCacheManager.SEGMENT_KEYS,
    data: T
  ): Promise<boolean> {
    const key = this.SEGMENT_KEYS[segment];
    try {
      // First back up the existing data
      await this.backupSegment(segment);

      // Save with metadata
      const metadata = {
        version: this.CACHE_VERSION,
        timestamp: Date.now(),
        appVersion: APP_VERSION,
        segment,
      };

      const cacheData = {
        metadata,
        data
      };

      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
      await this.setIntegrityMarker(segment);

      console.log(`Successfully saved data to segment ${segment}`);
      return true;
    } catch (error) {
      console.error(`Error setting segment ${segment}:`, error);
      return false;
    }
  }

  /**
   * Clear a specific cache segment
   */
  public static async clearSegment(
    segment: keyof typeof SegmentedCacheManager.SEGMENT_KEYS
  ): Promise<boolean> {
    const key = this.SEGMENT_KEYS[segment];
    try {
      await AsyncStorage.removeItem(key);
      // Reset the integrity marker
      await this.setIntegrityMarker(segment);
      console.log(`Successfully cleared segment ${segment}`);
      return true;
    } catch (error) {
      console.error(`Error clearing segment ${segment}:`, error);
      return false;
    }
  }

  /**
   * Validate the integrity of a specific cache segment
   */
  public static async validateSegmentIntegrity(
    segment: keyof typeof SegmentedCacheManager.SEGMENT_KEYS
  ): Promise<boolean> {
    const key = this.SEGMENT_KEYS[segment];
    const integrityKey = `${this.INTEGRITY_MARKER_PREFIX}${segment}`;

    try {
      // Check if integrity marker exists
      const integrityMarker = await AsyncStorage.getItem(integrityKey);
      if (!integrityMarker) {
        console.log(`Integrity marker missing for segment ${segment}`);
        return false;
      }

      // Check if the segment data exists and is valid JSON
      const data = await AsyncStorage.getItem(key);
      if (!data) return true; // Empty is considered valid

      try {
        // Parse and validate basic structure
        const parsed = JSON.parse(data);

        // Check that it has metadata and data
        if (!parsed || !parsed.metadata || parsed.data === undefined) {
          console.log(`Segment ${segment} has invalid structure`);
          return false;
        }

        // Check version
        if (parsed.metadata.version !== this.CACHE_VERSION) {
          console.log(`Segment ${segment} has version mismatch: ${parsed.metadata.version} vs ${this.CACHE_VERSION}`);
          return false;
        }

        // Additional segment-specific validation
        if (segment === 'USER_PREFERENCES') {
          const prefs = parsed.data;
          if (typeof prefs !== 'object') {
            console.log(`USER_PREFERENCES segment has invalid data type`);
            return false;
          }
        }

        return true;
      } catch (e) {
        console.log(`Segment ${segment} contains invalid JSON`);
        return false;
      }
    } catch (error) {
      console.error(`Error checking integrity for segment ${segment}:`, error);
      return false;
    }
  }

  /**
   * Set integrity marker for a segment
   */
  private static async setIntegrityMarker(
    segment: keyof typeof SegmentedCacheManager.SEGMENT_KEYS | string
  ): Promise<void> {
    const integrityKey = `${this.INTEGRITY_MARKER_PREFIX}${segment}`;
    try {
      await AsyncStorage.setItem(integrityKey, 'valid');
    } catch (error) {
      console.error(`Failed to set integrity marker for segment ${segment}:`, error);
    }
  }

  /**
   * Backup a specific segment before modifying
   */
  public static async backupSegment(
    segment: keyof typeof SegmentedCacheManager.SEGMENT_KEYS
  ): Promise<boolean> {
    const key = this.SEGMENT_KEYS[segment];
    try {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        await AsyncStorage.setItem(`${key}_backup`, data);
        console.log(`Successfully backed up segment ${segment}`);
      }
      return true;
    } catch (error) {
      console.error(`Failed to backup segment ${segment}:`, error);
      return false;
    }
  }

  /**
   * Recover a specific segment from backup
   */
  public static async recoverSegment(
    segment: keyof typeof SegmentedCacheManager.SEGMENT_KEYS
  ): Promise<boolean> {
    const key = this.SEGMENT_KEYS[segment];
    const backupKey = `${key}_backup`;

    try {
      // Check if we have a backup
      const backupData = await AsyncStorage.getItem(backupKey);
      if (!backupData) {
        console.log(`No backup exists for segment ${segment}`);
        return false;
      }

      // Verify backup integrity
      try {
        JSON.parse(backupData);

        // Restore from backup
        await AsyncStorage.setItem(key, backupData);
        await this.setIntegrityMarker(segment);
        console.log(`Successfully recovered segment ${segment} from backup`);
        return true;
      } catch (e) {
        console.error(`Backup for segment ${segment} is also corrupted:`, e);
        return false;
      }
    } catch (error) {
      console.error(`Error recovering segment ${segment}:`, error);
      return false;
    }
  }

  /**
   * Clear all segments of the cache
   */
  public static async clearAllSegments(): Promise<boolean> {
    try {
      const segments = Object.keys(this.SEGMENT_KEYS) as Array<keyof typeof SegmentedCacheManager.SEGMENT_KEYS>;

      // Clear each segment
      await Promise.all(
        segments.map(segment => this.clearSegment(segment))
      );

      // For compatibility, also clear using the original CacheManager
      await CacheManager.clearCache();

      // Clear file system cache
      if (FileSystem.documentDirectory) {
        const cachePath = FileSystem.documentDirectory + 'app-cache/';
        const dirInfo = await FileSystem.getInfoAsync(cachePath);
        if (dirInfo.exists) {
          await FileSystem.deleteAsync(cachePath, { idempotent: true });
          await FileSystem.makeDirectoryAsync(cachePath, { intermediates: true });
        }
      }

      console.log('Successfully cleared all cache segments');
      return true;
    } catch (error) {
      console.error('Failed to clear all cache segments:', error);
      return false;
    }
  }

  /**
   * Enhanced logging for debugging cache issues
   */
  private static logCacheError(error: unknown, operation: string, details?: Record<string, unknown>): void {
    console.error(`Cache error during ${operation}:`, error);

    // Add additional diagnostic info for debugging
    const diagnosticInfo = {
      timestamp: new Date().toISOString(),
      appVersion: APP_VERSION,
      platform: Platform.OS,
      freeMemory: (global as any).performance?.memory?.usedJSHeapSize || 'unknown',
      details
    };

    console.error('Diagnostic info:', diagnosticInfo);

    // This could be expanded to send to analytics or error reporting service
  }
}

export default SegmentedCacheManager;
