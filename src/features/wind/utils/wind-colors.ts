/**
 * Wind Color Utilities
 *
 * Extracted from WindArrow.tsx for testability.
 * These functions determine visual properties based on wind conditions.
 */

import type { WindRelationship } from '../components/compass/types';

// Design tokens (from theme/tokens.ts)
export const WIND_COLORS = {
  TAILWIND: '#16A34A', // success green
  HEADWIND: '#DC2626', // danger red
  CROSSWIND: '#F59E0B', // warning yellow
  DEFAULT: '#DAA520', // brandAlt gold
} as const;

/**
 * Get the base color for wind arrow based on wind relationship.
 *
 * - TAILWIND = green (#16A34A) - wind helps (adds distance)
 * - HEADWIND = red (#DC2626) - wind hurts (reduces distance)
 * - CROSSWIND = yellow (#F59E0B) - lateral effect only
 * - QUARTERING = gold (#DAA520) - mixed effect
 *
 * @param windRelationship - The type of wind relationship
 * @returns Hex color string
 */
export function getWindArrowColor(
  windRelationship: WindRelationship | undefined
): string {
  switch (windRelationship) {
    case 'TAILWIND':
      return WIND_COLORS.TAILWIND;
    case 'HEADWIND':
      return WIND_COLORS.HEADWIND;
    case 'CROSSWIND':
      return WIND_COLORS.CROSSWIND;
    case 'QUARTERING':
    default:
      return WIND_COLORS.DEFAULT;
  }
}

/**
 * Calculate arrow opacity based on wind magnitude.
 *
 * Formula: opacity = 0.4 + (windSpeed / 30) * 0.6
 * Range: 0.4 (0 mph) to 1.0 (30+ mph)
 *
 * @param windSpeed - Wind speed in mph
 * @returns Opacity value between 0.4 and 1.0
 */
export function getWindOpacity(windSpeed: number): number {
  const MIN_OPACITY = 0.4;
  const MAX_OPACITY = 1.0;
  const MAX_WIND = 30;

  const clampedSpeed = Math.min(Math.max(windSpeed, 0), MAX_WIND);
  const normalized = clampedSpeed / MAX_WIND;
  return MIN_OPACITY + normalized * (MAX_OPACITY - MIN_OPACITY);
}

/**
 * Calculate arrow scale based on wind magnitude.
 *
 * Formula: scale = 0.4 + (windSpeed / 30) * 0.6
 * Range: 0.4 (0 mph) to 1.0 (30+ mph)
 *
 * @param windSpeed - Wind speed in mph
 * @returns Scale factor between 0.4 and 1.0
 */
export function getWindScale(windSpeed: number): number {
  const MIN_SCALE = 0.4;
  const MAX_SCALE = 1.0;
  const MAX_WIND = 30;

  const clampedSpeed = Math.min(Math.max(windSpeed, 0), MAX_WIND);
  const normalized = clampedSpeed / MAX_WIND;
  return MIN_SCALE + normalized * (MAX_SCALE - MIN_SCALE);
}

/**
 * Determine if gust animation should be active.
 *
 * Gust animation triggers when gust speed exceeds sustained wind speed.
 *
 * @param gustSpeed - Gust speed in mph
 * @param sustainedSpeed - Sustained wind speed in mph
 * @returns true if gust pulse animation should play
 */
export function shouldShowGustPulse(
  gustSpeed: number | undefined,
  sustainedSpeed: number
): boolean {
  return gustSpeed !== undefined && gustSpeed > sustainedSpeed;
}

/**
 * Calculate wind relationship from relative angle.
 *
 * Angle zones:
 * - 0° ± 22.5° = HEADWIND (wind coming at you)
 * - 180° ± 22.5° = TAILWIND (wind from behind)
 * - 90° ± 22.5° or 270° ± 22.5° = CROSSWIND (wind from side)
 * - Everything else = QUARTERING (mixed)
 *
 * @param relativeAngle - Angle between heading and wind direction (0-360)
 * @returns WindRelationship type
 */
export function getWindRelationship(relativeAngle: number): WindRelationship {
  const normalizedAngle = ((relativeAngle % 360) + 360) % 360;

  // HEADWIND: 0° ± 22.5° (337.5° to 22.5°)
  if (normalizedAngle <= 22.5 || normalizedAngle >= 337.5) {
    return 'HEADWIND';
  }

  // TAILWIND: 180° ± 22.5° (157.5° to 202.5°)
  if (normalizedAngle >= 157.5 && normalizedAngle <= 202.5) {
    return 'TAILWIND';
  }

  // CROSSWIND: 90° ± 22.5° (67.5° to 112.5°) OR 270° ± 22.5° (247.5° to 292.5°)
  if (
    (normalizedAngle >= 67.5 && normalizedAngle <= 112.5) ||
    (normalizedAngle >= 247.5 && normalizedAngle <= 292.5)
  ) {
    return 'CROSSWIND';
  }

  return 'QUARTERING';
}

/**
 * Get color with opacity applied as hex alpha.
 *
 * @param baseColor - Hex color (e.g., '#16A34A')
 * @param opacity - Opacity value 0-1
 * @returns Hex color with alpha (e.g., '#16A34AFF')
 */
export function applyColorOpacity(baseColor: string, opacity: number): string {
  const alpha = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return `${baseColor}${alpha}`;
}
