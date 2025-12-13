/**
 * CacheService.ts
 *
 * A unified caching service for the application.
 * Provides a consistent way to cache and retrieve data
 * with support for TTL and versioning.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogManager } from '@/src/utils/LogManager';

// Create a logger for cache service
const logger = LogManager.getLogger('CacheService');

/**
 * Cache options interface
 */
export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  version?: number; // Cache version for invalidation
  namespace?: string; // Optional namespace for key grouping
}

/**
 * Cache item interface
 */
interface CacheItem<T> {
  data: T;
  timestamp: number;
  version: number;
}

/**
 * Default cache options
 */
const DEFAULT_OPTIONS: CacheOptions = {
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  version: 1,
  namespace: 'app',
};

/**
 * Cache service class
 * Implements the Singleton pattern
 */
export class CacheService {
  private static instance: CacheService;
  private defaultOptions: CacheOptions;

  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {
    this.defaultOptions = { ...DEFAULT_OPTIONS };
    logger.info('CacheService initialized');
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Set default options
   */
  public setDefaultOptions(options: CacheOptions): void {
    this.defaultOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
    logger.debug('Default cache options updated', this.defaultOptions);
  }

  /**
   * Get the full cache key with namespace
   */
  private getFullKey(key: string, namespace?: string): string {
    const ns = namespace || this.defaultOptions.namespace;
    return ns ? `${ns}:${key}` : key;
  }

  /**
   * Set cache item
   * @param key Cache key
   * @param data Data to cache
   * @param options Cache options
   * @returns Promise resolving to true if successful
   */
  public async set<T>(key: string, data: T, options?: CacheOptions): Promise<boolean> {
    const opts = { ...this.defaultOptions, ...options };
    const fullKey = this.getFullKey(key, opts.namespace);

    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        version: opts.version!,
      };

      await AsyncStorage.setItem(fullKey, JSON.stringify(item));
      logger.debug(`Cache set: ${fullKey}`, { size: JSON.stringify(item).length });
      return true;
    } catch (error) {
      logger.error(`Error setting cache for key ${fullKey}:`, error);
      return false;
    }
  }

  /**
   * Get cache item
   * @param key Cache key
   * @param options Cache options
   * @returns Promise resolving to cached data or null if not found
   */
  public async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const opts = { ...this.defaultOptions, ...options };
    const fullKey = this.getFullKey(key, opts.namespace);

    try {
      const value = await AsyncStorage.getItem(fullKey);
      if (!value) {
        logger.debug(`Cache miss: ${fullKey}`);
        return null;
      }

      const item: CacheItem<T> = JSON.parse(value);

      // Check version
      if (item.version !== opts.version) {
        logger.debug(`Cache version mismatch for ${fullKey}`, {
          cached: item.version,
          current: opts.version,
        });
        await this.remove(key, opts.namespace);
        return null;
      }

      // Check TTL
      if (opts.ttl && Date.now() - item.timestamp > opts.ttl) {
        logger.debug(`Cache expired for ${fullKey}`, {
          age: Date.now() - item.timestamp,
          ttl: opts.ttl,
        });
        await this.remove(key, opts.namespace);
        return null;
      }

      logger.debug(`Cache hit: ${fullKey}`);
      return item.data;
    } catch (error) {
      logger.error(`Error getting cache for key ${fullKey}:`, error);
      return null;
    }
  }

  /**
   * Remove cache item
   * @param key Cache key
   * @param namespace Optional namespace
   * @returns Promise resolving to true if successful
   */
  public async remove(key: string, namespace?: string): Promise<boolean> {
    const fullKey = this.getFullKey(key, namespace);
    try {
      await AsyncStorage.removeItem(fullKey);
      logger.debug(`Cache removed: ${fullKey}`);
      return true;
    } catch (error) {
      logger.error(`Error removing cache for key ${fullKey}:`, error);
      return false;
    }
  }

  /**
   * Clear all cache items in a namespace
   * @param namespace Namespace to clear, defaults to the default namespace
   * @returns Promise resolving to true if successful
   */
  public async clearNamespace(namespace?: string): Promise<boolean> {
    const ns = namespace || this.defaultOptions.namespace;
    if (!ns) {
      logger.warn('Cannot clear cache without a namespace');
      return false;
    }

    try {
      const keys = await AsyncStorage.getAllKeys();
      const namespacePrefix = `${ns}:`;
      const namespaceKeys = keys.filter(key => key.startsWith(namespacePrefix));

      if (namespaceKeys.length === 0) {
        logger.debug(`No cache items found in namespace: ${ns}`);
        return true;
      }

      await AsyncStorage.multiRemove(namespaceKeys);
      logger.info(`Cleared cache namespace: ${ns}`, { count: namespaceKeys.length });
      return true;
    } catch (error) {
      logger.error(`Error clearing cache namespace ${ns}:`, error);
      return false;
    }
  }

  /**
   * Clear all cache
   * @returns Promise resolving to true if successful
   */
  public async clearAll(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      logger.info('All cache cleared');
      return true;
    } catch (error) {
      logger.error('Error clearing all cache:', error);
      return false;
    }
  }

  /**
   * Get all keys in a namespace
   * @param namespace Namespace to get keys from, defaults to the default namespace
   * @returns Promise resolving to array of keys
   */
  public async getKeys(namespace?: string): Promise<string[]> {
    const ns = namespace || this.defaultOptions.namespace;
    if (!ns) {
      return [];
    }

    try {
      const keys = await AsyncStorage.getAllKeys();
      const namespacePrefix = `${ns}:`;
      const namespaceKeys = keys
        .filter(key => key.startsWith(namespacePrefix))
        .map(key => key.substring(namespacePrefix.length));

      return namespaceKeys;
    } catch (error) {
      logger.error(`Error getting keys for namespace ${ns}:`, error);
      return [];
    }
  }

  /**
   * Get cache info for a key
   * @param key Cache key
   * @param namespace Optional namespace
   * @returns Promise resolving to cache info or null if not found
   */
  public async getInfo<T>(key: string, namespace?: string): Promise<{
    key: string;
    timestamp: number;
    version: number;
    ttl: number;
    size: number;
    expired: boolean;
  } | null> {
    const opts = { ...this.defaultOptions };
    const fullKey = this.getFullKey(key, namespace);

    try {
      const value = await AsyncStorage.getItem(fullKey);
      if (!value) {
        return null;
      }

      const item: CacheItem<T> = JSON.parse(value);
      const now = Date.now();
      const age = now - item.timestamp;
      const expired = opts.ttl ? age > opts.ttl : false;

      return {
        key,
        timestamp: item.timestamp,
        version: item.version,
        ttl: opts.ttl!,
        size: value.length,
        expired,
      };
    } catch (error) {
      logger.error(`Error getting cache info for key ${fullKey}:`, error);
      return null;
    }
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();
