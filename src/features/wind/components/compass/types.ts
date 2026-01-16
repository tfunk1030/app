/**
 * Shared types and utilities for compass components
 */

// Wind relationship types
export type WindRelationship = 'HEADWIND' | 'TAILWIND' | 'CROSSWIND' | 'QUARTERING';

export interface WindDirectionCompassProps {
  size?: number;
  windDirection?: number;
  shotDirection?: number;
  onChange?: (type: string, degrees: number) => void;
  lockShot?: boolean;
  windSpeed?: number;
  speedUnit?: string;
  /** Hide the internal lock button (when using ActionBar instead) */
  hideLockButton?: boolean;
}

export interface DegreeMarksProps {
  size: number;
  heading: number;
  borderColor: string;
  textColor: string;
}

export interface CardinalDirectionsProps {
  size: number;
  heading: number;
  textColor: string;
  subTextColor: string;
  badgeBg: string;
  badgeBorder: string;
  brandAltColor?: string;
}

export interface WindArrowProps {
  angle: number;
  brandAlt: string;
  success: string;
  border: string;
  compassSize: number;
  /** Wind speed in mph for magnitude encoding (0-30mph range) */
  magnitude?: number;
  /** Whether to respect reduced motion accessibility setting */
  reducedMotion?: boolean;
  /** Wind relationship type for dynamic coloring */
  windRelationship?: WindRelationship;
  /** Danger color for headwind */
  danger?: string;
  /** Warning color for crosswind */
  warning?: string;
  /** Wind gust speed in mph - triggers pulse animation when > magnitude */
  gustSpeed?: number;
}

export interface CrosswindIndicatorProps {
  /** Crosswind magnitude in the user's preferred unit */
  magnitude: number;
  /** Direction of crosswind: 'left' | 'right' */
  direction: 'left' | 'right';
  /** Unit label for accessibility */
  unit: string;
  /** Compass size for proportional scaling */
  compassSize: number;
  /** Theme colors */
  colors: {
    warning: string;
    neutral: string;
    text: string;
  };
}

export interface WindMagnitudeLegendProps {
  /** Current wind speed value */
  windSpeed: number;
  /** Unit label (e.g., 'mph', 'kph') */
  unit: string;
  /** Theme colors */
  colors: {
    text: string;
    subtext: string;
    icon: string;
  };
}

export interface PhoneArrowProps {
  /** Arrow color - use white/neutral for user heading arrow */
  color: string;
}

export interface LockButtonProps {
  isLocked: boolean;
  onPress: () => void;
  size: number;
  tokens: {
    colors: {
      success: string;
      surface: string;
      border: string;
      shadow: string;
      textPrimary: string;
    };
  };
  mode: 'light' | 'dark';
  pulseAnim: import('react-native').Animated.Value;
}

/**
 * Get wind relationship based on relative angle
 * @param angle - The relative wind angle in degrees
 * @returns The wind relationship type
 */
export const getWindRelationship = (angle: number): WindRelationship => {
  const normalizedAngle = ((angle % 360) + 360) % 360;
  if (normalizedAngle <= 22.5 || normalizedAngle >= 337.5) return 'HEADWIND';
  if (normalizedAngle >= 157.5 && normalizedAngle <= 202.5) return 'TAILWIND';
  if ((normalizedAngle >= 67.5 && normalizedAngle <= 112.5) ||
      (normalizedAngle >= 247.5 && normalizedAngle <= 292.5)) return 'CROSSWIND';
  return 'QUARTERING';
};

/**
 * Get cardinal direction from degrees
 * @param degrees - The wind direction in degrees
 * @returns Cardinal direction string (N, NE, E, etc.)
 */
export const getCardinalDirection = (degrees: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((degrees % 360) + 360) % 360 / 45) % 8;
  return directions[index];
};

/**
 * Utility function for heading change threshold
 */
export const isSignificantHeadingChange = (prev: number, next: number, threshold = 1): boolean => {
  if (prev === next) return false;
  if (Math.abs(prev - next) > 180) {
    const diff = 360 - Math.max(prev, next) + Math.min(prev, next);
    return diff >= threshold;
  }
  return Math.abs(prev - next) >= threshold;
};
