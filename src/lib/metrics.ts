/**
 * Metrics Collection Utilities
 *
 * Lightweight metrics collection for performance monitoring.
 * Designed for React Native with minimal overhead.
 */

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'timing';

export interface Metric {
  name: string;
  type: MetricType;
  value: number;
  tags?: Record<string, string>;
  timestamp: number;
}

export interface TimingResult {
  duration: number;
  success: boolean;
}

// In-memory metrics buffer
const metricsBuffer: Metric[] = [];
const MAX_BUFFER_SIZE = 100;

// Histogram buckets for timing metrics (ms)
const TIMING_BUCKETS = [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

/**
 * Record a counter metric (increments)
 */
export function incrementCounter(
  name: string,
  value = 1,
  tags?: Record<string, string>
): void {
  recordMetric({
    name,
    type: 'counter',
    value,
    tags,
    timestamp: Date.now(),
  });
}

/**
 * Record a gauge metric (point-in-time value)
 */
export function setGauge(
  name: string,
  value: number,
  tags?: Record<string, string>
): void {
  recordMetric({
    name,
    type: 'gauge',
    value,
    tags,
    timestamp: Date.now(),
  });
}

/**
 * Record a timing metric
 */
export function recordTiming(
  name: string,
  durationMs: number,
  tags?: Record<string, string>
): void {
  recordMetric({
    name,
    type: 'timing',
    value: durationMs,
    tags,
    timestamp: Date.now(),
  });

  // Also record histogram bucket
  const bucket = TIMING_BUCKETS.find((b) => durationMs <= b) || Infinity;
  incrementCounter(`${name}.bucket`, 1, { ...tags, le: bucket.toString() });
}

/**
 * Time an async operation
 */
export async function timeAsync<T>(
  name: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  const start = Date.now();
  let success = true;

  try {
    return await fn();
  } catch (error) {
    success = false;
    throw error;
  } finally {
    const duration = Date.now() - start;
    recordTiming(name, duration, { ...tags, success: success.toString() });
  }
}

/**
 * Time a sync operation
 */
export function timeSync<T>(
  name: string,
  fn: () => T,
  tags?: Record<string, string>
): T {
  const start = Date.now();
  let success = true;

  try {
    return fn();
  } catch (error) {
    success = false;
    throw error;
  } finally {
    const duration = Date.now() - start;
    recordTiming(name, duration, { ...tags, success: success.toString() });
  }
}

/**
 * Record a metric to buffer
 */
function recordMetric(metric: Metric): void {
  metricsBuffer.push(metric);

  // Trim buffer if too large
  if (metricsBuffer.length > MAX_BUFFER_SIZE) {
    metricsBuffer.splice(0, metricsBuffer.length - MAX_BUFFER_SIZE);
  }

  // Log in development
  if (__DEV__) {
    console.debug(`[METRIC] ${metric.name}:`, metric.value, metric.tags || '');
  }
}

/**
 * Get all buffered metrics
 */
export function getMetrics(): Metric[] {
  return [...metricsBuffer];
}

/**
 * Flush metrics buffer (call before sending to backend)
 */
export function flushMetrics(): Metric[] {
  const metrics = [...metricsBuffer];
  metricsBuffer.length = 0;
  return metrics;
}

/**
 * Get metrics summary for debugging
 */
export function getMetricsSummary(): Record<string, { count: number; total: number; avg: number }> {
  const summary: Record<string, { count: number; total: number; avg: number }> = {};

  for (const metric of metricsBuffer) {
    if (!summary[metric.name]) {
      summary[metric.name] = { count: 0, total: 0, avg: 0 };
    }
    summary[metric.name].count++;
    summary[metric.name].total += metric.value;
    summary[metric.name].avg = summary[metric.name].total / summary[metric.name].count;
  }

  return summary;
}

// Pre-defined metric names for consistency
export const MetricNames = {
  // API metrics
  API_REQUEST_DURATION: 'api.request.duration',
  API_REQUEST_COUNT: 'api.request.count',
  API_ERROR_COUNT: 'api.error.count',

  // App lifecycle
  APP_START_TIME: 'app.start.time',
  SCREEN_LOAD_TIME: 'screen.load.time',

  // Feature usage
  SHOT_CALCULATION: 'feature.shot.calculation',
  WIND_CALCULATION: 'feature.wind.calculation',
  CLUB_SELECTION: 'feature.club.selection',

  // Cache metrics
  CACHE_HIT: 'cache.hit',
  CACHE_MISS: 'cache.miss',

  // Performance
  RENDER_TIME: 'render.time',
  ANIMATION_FRAME_DROP: 'animation.frame.drop',
} as const;
