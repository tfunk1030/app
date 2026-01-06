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
}

export interface PhoneArrowProps {
  success: string;
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
