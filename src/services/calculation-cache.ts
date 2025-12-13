interface CacheEntry<T> {
  value: T;
  timestamp: number;
  params: string;
}

interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
}

export class CalculationCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.cache = new Map();
    this.config = {
      maxSize: config.maxSize || 100,
      ttl: config.ttl || 5 * 60 * 1000 // 5 minutes default
    };
  }

  /**
   * Generates a cache key from parameters
   */
  private generateKey(params: Record<string, any>): string {
    return JSON.stringify(params);
  }

  /**
   * Gets a value from cache if it exists and is valid
   */
  get(params: Record<string, any>): T | null {
    const key = this.generateKey(params);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Sets a value in the cache
   */
  set(params: Record<string, any>, value: T): void {
    const key = this.generateKey(params);

    // If cache is at max size, remove oldest entry
    if (this.cache.size >= this.config.maxSize) {
      const oldestEntry = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0];
      if (oldestEntry) {
        this.cache.delete(oldestEntry[0]);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      params: JSON.stringify(params)
    });
  }

  /**
   * Clears expired entries from the cache
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clears the entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Gets the current size of the cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Gets cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    ttl: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    let oldestTimestamp = Infinity;
    let newestTimestamp = -Infinity;

    for (const entry of this.cache.values()) {
      oldestTimestamp = Math.min(oldestTimestamp, entry.timestamp);
      newestTimestamp = Math.max(newestTimestamp, entry.timestamp);
    }

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      ttl: this.config.ttl,
      oldestEntry: oldestTimestamp === Infinity ? null : oldestTimestamp,
      newestEntry: newestTimestamp === -Infinity ? null : newestTimestamp
    };
  }
}

// Create instances for different calculation types
export const yardageCache = new CalculationCache<{
  carry_distance: number;
  lateral_movement: number;
}>({
  maxSize: 200,  // Store up to 200 yardage calculations
  ttl: 5 * 60 * 1000  // Cache for 5 minutes
});

export const environmentalCache = new CalculationCache<{
  density: number;
  factor: number;
}>({
  maxSize: 50,   // Store up to 50 environmental calculations
  ttl: 30 * 1000 // Cache for 30 seconds
});

export const windEffectCache = new CalculationCache<{
  distance_effect: number;
  lateral_movement: number;
}>({
  maxSize: 100,  // Store up to 100 wind effect calculations
  ttl: 60 * 1000 // Cache for 1 minute
});