/**
 * Performance Monitor Component
 * Development tool for tracking animation performance and frame rates.
 *
 * Usage:
 * import { PerformanceMonitor, usePerformanceMetrics } from '@/src/utils/PerformanceMonitor';
 *
 * // As a visual overlay during development
 * <PerformanceMonitor visible={__DEV__} position="top-right" />
 *
 * // As a hook for programmatic access
 * const { fps, droppedFrames, isPerformant } = usePerformanceMetrics();
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { performanceTargets } from '../theme/animations';

// =============================================================================
// TYPES
// =============================================================================

export interface PerformanceMetrics {
  /** Current frames per second */
  fps: number;
  /** Average FPS over measurement window */
  averageFPS: number;
  /** Number of dropped frames in current window */
  droppedFrames: number;
  /** Total dropped frames since start */
  totalDroppedFrames: number;
  /** Whether performance meets targets */
  isPerformant: boolean;
  /** Last frame time in ms */
  frameTime: number;
  /** Time since monitoring started */
  uptime: number;
}

export interface PerformanceMonitorProps {
  /** Whether to show the monitor overlay */
  visible?: boolean;
  /** Position of the overlay */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Opacity of the overlay background */
  opacity?: number;
  /** Callback when performance drops below threshold */
  onPerformanceWarning?: (metrics: PerformanceMetrics) => void;
  /** Custom styles for the container */
  style?: ViewStyle;
  /** Whether to show detailed metrics */
  detailed?: boolean;
}

// =============================================================================
// PERFORMANCE TRACKING STATE
// =============================================================================

// Global performance state (singleton pattern for efficiency)
let globalMetrics: PerformanceMetrics = {
  fps: 60,
  averageFPS: 60,
  droppedFrames: 0,
  totalDroppedFrames: 0,
  isPerformant: true,
  frameTime: 16.67,
  uptime: 0,
};

let frameCount = 0;
let lastFrameTime = 0;
let windowStartTime = 0;
let monitoringActive = false;
let frameRequestId: number | null = null;
let fpsHistory: number[] = [];
const FPS_HISTORY_SIZE = 60; // Keep 1 second of history at 60fps

// Subscribers for metrics updates
const subscribers = new Set<(metrics: PerformanceMetrics) => void>();

// =============================================================================
// PERFORMANCE MONITORING ENGINE
// =============================================================================

/**
 * Start the performance monitoring loop
 */
function startMonitoring(): void {
  if (monitoringActive) return;

  monitoringActive = true;
  lastFrameTime = performance.now();
  windowStartTime = lastFrameTime;
  frameCount = 0;
  fpsHistory = [];

  const measureFrame = (currentTime: number): void => {
    if (!monitoringActive) return;

    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

    // Calculate instantaneous FPS
    const instantFPS = deltaTime > 0 ? 1000 / deltaTime : 60;
    frameCount++;

    // Check for dropped frames (frame took longer than budget)
    const droppedInFrame = Math.max(0, Math.floor(deltaTime / performanceTargets.frameBudget) - 1);
    if (droppedInFrame > 0) {
      globalMetrics.droppedFrames += droppedInFrame;
      globalMetrics.totalDroppedFrames += droppedInFrame;
    }

    // Track FPS history
    fpsHistory.push(instantFPS);
    if (fpsHistory.length > FPS_HISTORY_SIZE) {
      fpsHistory.shift();
    }

    // Update metrics every ~100ms (6 frames at 60fps)
    const windowDuration = currentTime - windowStartTime;
    if (windowDuration >= 100) {
      // Calculate average FPS from history
      const avgFPS = fpsHistory.length > 0
        ? fpsHistory.reduce((sum, fps) => sum + fps, 0) / fpsHistory.length
        : 60;

      globalMetrics = {
        fps: Math.round(instantFPS),
        averageFPS: Math.round(avgFPS),
        droppedFrames: globalMetrics.droppedFrames,
        totalDroppedFrames: globalMetrics.totalDroppedFrames,
        isPerformant: avgFPS >= performanceTargets.minAcceptableFPS &&
                       globalMetrics.droppedFrames <= performanceTargets.warnDroppedFrames,
        frameTime: deltaTime,
        uptime: currentTime - (windowStartTime - windowDuration),
      };

      // Reset window counters
      windowStartTime = currentTime;
      globalMetrics.droppedFrames = 0;

      // Notify subscribers
      notifySubscribers();
    }

    frameRequestId = requestAnimationFrame(measureFrame);
  };

  frameRequestId = requestAnimationFrame(measureFrame);
}

/**
 * Stop the performance monitoring loop
 */
function stopMonitoring(): void {
  monitoringActive = false;
  if (frameRequestId !== null) {
    cancelAnimationFrame(frameRequestId);
    frameRequestId = null;
  }
}

/**
 * Notify all subscribers of metrics update
 */
function notifySubscribers(): void {
  subscribers.forEach((callback) => callback(globalMetrics));
}

/**
 * Subscribe to performance metrics updates
 */
function subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
  subscribers.add(callback);

  // Start monitoring if this is the first subscriber
  if (subscribers.size === 1) {
    startMonitoring();
  }

  // Return unsubscribe function
  return () => {
    subscribers.delete(callback);

    // Stop monitoring if no more subscribers
    if (subscribers.size === 0) {
      stopMonitoring();
    }
  };
}

/**
 * Reset all performance counters
 */
export function resetPerformanceCounters(): void {
  globalMetrics = {
    fps: 60,
    averageFPS: 60,
    droppedFrames: 0,
    totalDroppedFrames: 0,
    isPerformant: true,
    frameTime: 16.67,
    uptime: 0,
  };
  frameCount = 0;
  fpsHistory = [];
}

/**
 * Get current performance metrics (snapshot)
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  return { ...globalMetrics };
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to access performance metrics with automatic updates
 * @returns Current performance metrics
 */
export function usePerformanceMetrics(): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(globalMetrics);

  useEffect(() => {
    const unsubscribe = subscribe(setMetrics);
    return unsubscribe;
  }, []);

  return metrics;
}

/**
 * Hook to track animation performance for a specific component
 * @param componentName - Name for logging/debugging
 * @returns Object with start/end tracking functions
 */
export function useAnimationPerformance(componentName: string) {
  const animationStart = useRef<number>(0);
  const droppedAtStart = useRef<number>(0);

  const startTracking = useCallback(() => {
    animationStart.current = performance.now();
    droppedAtStart.current = globalMetrics.totalDroppedFrames;
  }, []);

  const endTracking = useCallback(() => {
    const duration = performance.now() - animationStart.current;
    const droppedDuring = globalMetrics.totalDroppedFrames - droppedAtStart.current;

    if (__DEV__ && droppedDuring > performanceTargets.warnDroppedFrames) {
      console.warn(
        `[PerformanceMonitor] ${componentName}: Animation dropped ${droppedDuring} frames over ${duration.toFixed(0)}ms`
      );
    }

    return {
      duration,
      droppedFrames: droppedDuring,
      isPerformant: droppedDuring <= performanceTargets.maxDroppedFrames,
    };
  }, [componentName]);

  return { startTracking, endTracking };
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Visual performance monitor overlay
 * Shows FPS, dropped frames, and performance status
 */
export function PerformanceMonitor({
  visible = __DEV__,
  position = 'top-right',
  opacity = 0.9,
  onPerformanceWarning,
  style,
  detailed = false,
}: PerformanceMonitorProps): React.ReactElement | null {
  const metrics = usePerformanceMetrics();
  const hasWarned = useRef(false);

  // Trigger warning callback when performance drops
  useEffect(() => {
    if (!metrics.isPerformant && onPerformanceWarning && !hasWarned.current) {
      hasWarned.current = true;
      onPerformanceWarning(metrics);
    } else if (metrics.isPerformant) {
      hasWarned.current = false;
    }
  }, [metrics, onPerformanceWarning]);

  if (!visible) {
    return null;
  }

  const positionStyle = getPositionStyle(position);
  const statusColor = getStatusColor(metrics);

  return (
    <View
      style={[
        styles.container,
        positionStyle,
        { backgroundColor: `rgba(0, 0, 0, ${opacity})` },
        style,
      ]}
      pointerEvents="none"
    >
      <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
      <View style={styles.metricsContainer}>
        <Text style={[styles.fpsText, { color: statusColor }]}>
          {metrics.fps} FPS
        </Text>
        {detailed && (
          <>
            <Text style={styles.detailText}>
              Avg: {metrics.averageFPS} FPS
            </Text>
            <Text style={styles.detailText}>
              Frame: {metrics.frameTime.toFixed(1)}ms
            </Text>
            <Text style={styles.detailText}>
              Dropped: {metrics.totalDroppedFrames}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getPositionStyle(position: PerformanceMonitorProps['position']): ViewStyle {
  switch (position) {
    case 'top-left':
      return { top: 50, left: 10 };
    case 'top-right':
      return { top: 50, right: 10 };
    case 'bottom-left':
      return { bottom: 100, left: 10 };
    case 'bottom-right':
      return { bottom: 100, right: 10 };
    default:
      return { top: 50, right: 10 };
  }
}

function getStatusColor(metrics: PerformanceMetrics): string {
  if (metrics.averageFPS >= 58) {
    return '#10B981'; // Green - excellent
  } else if (metrics.averageFPS >= performanceTargets.minAcceptableFPS) {
    return '#F59E0B'; // Amber - acceptable
  } else {
    return '#EF4444'; // Red - poor
  }
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  metricsContainer: {
    alignItems: 'flex-start',
  },
  fpsText: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  detailText: {
    fontSize: 10,
    color: '#94A3B8',
    fontVariant: ['tabular-nums'],
  },
});

// =============================================================================
// EXPORTS
// =============================================================================

export default PerformanceMonitor;

/**
 * Utility function to wrap an animation callback with performance tracking
 * @param callback - The animation callback to wrap
 * @param label - Label for debugging output
 */
export function withPerformanceTracking<T extends (...args: any[]) => any>(
  callback: T,
  label: string = 'Animation'
): T {
  return ((...args: Parameters<T>) => {
    const startTime = performance.now();
    const startDropped = globalMetrics.totalDroppedFrames;

    const result = callback(...args);

    // Log after a delay to capture any dropped frames
    setTimeout(() => {
      const duration = performance.now() - startTime;
      const droppedDuring = globalMetrics.totalDroppedFrames - startDropped;

      if (__DEV__ && droppedDuring > performanceTargets.warnDroppedFrames) {
        console.warn(
          `[Performance] ${label}: ${droppedDuring} dropped frames in ${duration.toFixed(0)}ms`
        );
      }
    }, 100);

    return result;
  }) as T;
}

/**
 * Create a performance report for debugging
 */
export function createPerformanceReport(): string {
  const metrics = getPerformanceMetrics();
  return `
Performance Report
==================
Current FPS: ${metrics.fps}
Average FPS: ${metrics.averageFPS}
Frame Time: ${metrics.frameTime.toFixed(2)}ms
Total Dropped Frames: ${metrics.totalDroppedFrames}
Uptime: ${(metrics.uptime / 1000).toFixed(1)}s
Status: ${metrics.isPerformant ? 'PERFORMANT' : 'DEGRADED'}
Platform: ${Platform.OS}
`.trim();
}
