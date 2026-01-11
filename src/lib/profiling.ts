/**
 * Performance Profiling Utilities
 *
 * Lightweight profiling for React Native performance monitoring.
 */

import { InteractionManager } from 'react-native';

export interface ProfileResult {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  metadata?: Record<string, unknown>;
}

export interface RenderProfile {
  componentName: string;
  phase: 'mount' | 'update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
}

// Profile storage
const profiles: ProfileResult[] = [];
const renderProfiles: RenderProfile[] = [];
const MAX_PROFILES = 100;

/**
 * Profile an async operation
 */
export async function profileAsync<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const startTime = performance.now();

  try {
    return await fn();
  } finally {
    const endTime = performance.now();
    recordProfile({
      name,
      duration: endTime - startTime,
      startTime,
      endTime,
      metadata,
    });
  }
}

/**
 * Profile a sync operation
 */
export function profileSync<T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, unknown>
): T {
  const startTime = performance.now();

  try {
    return fn();
  } finally {
    const endTime = performance.now();
    recordProfile({
      name,
      duration: endTime - startTime,
      startTime,
      endTime,
      metadata,
    });
  }
}

/**
 * Create a profiler for React components
 *
 * Usage:
 * ```tsx
 * import { Profiler } from 'react';
 * import { createProfilerCallback } from '@/src/lib/profiling';
 *
 * <Profiler id="MyComponent" onRender={createProfilerCallback()}>
 *   <MyComponent />
 * </Profiler>
 * ```
 */
export function createProfilerCallback() {
  return (
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    recordRenderProfile({
      componentName: id,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime,
    });

    // Log slow renders in development
    if (__DEV__ && actualDuration > 16) {
      console.warn(
        `[PROFILE] Slow render: ${id} (${phase}) took ${actualDuration.toFixed(2)}ms`
      );
    }
  };
}

/**
 * Measure time to interactive
 */
export function measureTTI(screenName: string): () => void {
  const startTime = performance.now();

  return () => {
    InteractionManager.runAfterInteractions(() => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      recordProfile({
        name: `tti:${screenName}`,
        duration,
        startTime,
        endTime,
        metadata: { type: 'tti', screen: screenName },
      });

      if (__DEV__) {
        console.debug(`[PROFILE] TTI ${screenName}: ${duration.toFixed(2)}ms`);
      }
    });
  };
}

/**
 * Measure app startup time
 */
let appStartTime: number | null = null;

export function markAppStart(): void {
  appStartTime = performance.now();
}

export function measureAppStartup(): number | null {
  if (appStartTime === null) return null;

  const duration = performance.now() - appStartTime;

  recordProfile({
    name: 'app:startup',
    duration,
    startTime: appStartTime,
    endTime: performance.now(),
    metadata: { type: 'startup' },
  });

  if (__DEV__) {
    console.debug(`[PROFILE] App startup: ${duration.toFixed(2)}ms`);
  }

  return duration;
}

/**
 * Record a profile result
 */
function recordProfile(profile: ProfileResult): void {
  profiles.push(profile);

  // Trim old profiles
  if (profiles.length > MAX_PROFILES) {
    profiles.splice(0, profiles.length - MAX_PROFILES);
  }
}

/**
 * Record a render profile
 */
function recordRenderProfile(profile: RenderProfile): void {
  renderProfiles.push(profile);

  // Trim old profiles
  if (renderProfiles.length > MAX_PROFILES) {
    renderProfiles.splice(0, renderProfiles.length - MAX_PROFILES);
  }
}

/**
 * Get all recorded profiles
 */
export function getProfiles(): ProfileResult[] {
  return [...profiles];
}

/**
 * Get render profiles
 */
export function getRenderProfiles(): RenderProfile[] {
  return [...renderProfiles];
}

/**
 * Get profiling summary
 */
export function getProfilingSummary(): Record<string, {
  count: number;
  totalDuration: number;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
}> {
  const summary: Record<string, {
    count: number;
    totalDuration: number;
    avgDuration: number;
    maxDuration: number;
    minDuration: number;
  }> = {};

  for (const profile of profiles) {
    if (!summary[profile.name]) {
      summary[profile.name] = {
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        maxDuration: 0,
        minDuration: Infinity,
      };
    }

    const s = summary[profile.name];
    s.count++;
    s.totalDuration += profile.duration;
    s.avgDuration = s.totalDuration / s.count;
    s.maxDuration = Math.max(s.maxDuration, profile.duration);
    s.minDuration = Math.min(s.minDuration, profile.duration);
  }

  return summary;
}

/**
 * Clear all profiles
 */
export function clearProfiles(): void {
  profiles.length = 0;
  renderProfiles.length = 0;
}

/**
 * Export profiles for analysis
 */
export function exportProfiles(): string {
  return JSON.stringify({
    profiles,
    renderProfiles,
    summary: getProfilingSummary(),
    timestamp: Date.now(),
  }, null, 2);
}
