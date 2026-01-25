import { safeScaledFontSize, getOptimalNumberOfLines } from '../utils/responsive';

// Base type scale definitions
const baseTypeScale = {
  headingLg: 28,
  headingMd: 20,
  body: 16,
  caption: 12,
} as const;

export type BaseTypeScale = typeof baseTypeScale;

/**
 * Type scale with safe scaling applied for Dynamic Type support
 * These maintain visual layout while respecting accessibility settings
 */
export const typeScale = {
  headingLg: baseTypeScale.headingLg,
  headingMd: baseTypeScale.headingMd,
  body: baseTypeScale.body,
  caption: baseTypeScale.caption,
} as const;

export type TypeScale = typeof typeScale;

/**
 * Get scaled font size with safe limits to prevent layout breaking
 * @param size - The base font size or a key from typeScale
 * @param options - Options for scaling behavior
 */
export function getScaledFontSize(
  size: number | keyof TypeScale,
  options?: {
    maxScale?: number;
    minScale?: number;
    factor?: number;
    respectSystemScale?: boolean;
  }
): number {
  const baseSize = typeof size === 'number' ? size : baseTypeScale[size];
  return safeScaledFontSize(baseSize, options);
}

/**
 * Typography presets with safe scaling applied
 * Use these for consistent text styling across the app
 */
export const typography = {
  // Headings
  headingLarge: {
    fontSize: getScaledFontSize('headingLg', { maxScale: 1.25 }),
    lineHeight: getScaledFontSize('headingLg', { maxScale: 1.25 }) * 1.2,
    fontWeight: '600' as const,
    numberOfLines: getOptimalNumberOfLines(1, { maxLines: 2 }),
  },
  headingMedium: {
    fontSize: getScaledFontSize('headingMd', { maxScale: 1.3 }),
    lineHeight: getScaledFontSize('headingMd', { maxScale: 1.3 }) * 1.3,
    fontWeight: '600' as const,
    numberOfLines: getOptimalNumberOfLines(1, { maxLines: 2 }),
  },
  
  // Body text
  body: {
    fontSize: getScaledFontSize('body'),
    lineHeight: getScaledFontSize('body') * 1.5,
    fontWeight: '400' as const,
    numberOfLines: getOptimalNumberOfLines(2, { maxLines: 4 }),
  },
  bodyCompact: {
    fontSize: getScaledFontSize('body', { factor: 0.3 }),
    lineHeight: getScaledFontSize('body', { factor: 0.3 }) * 1.4,
    fontWeight: '400' as const,
    numberOfLines: getOptimalNumberOfLines(2, { maxLines: 3 }),
  },
  
  // Captions and small text
  caption: {
    fontSize: getScaledFontSize('caption'),
    lineHeight: getScaledFontSize('caption') * 1.4,
    fontWeight: '400' as const,
    numberOfLines: getOptimalNumberOfLines(1, { maxLines: 2 }),
  },
  captionBold: {
    fontSize: getScaledFontSize('caption'),
    lineHeight: getScaledFontSize('caption') * 1.4,
    fontWeight: '600' as const,
    numberOfLines: getOptimalNumberOfLines(1, { maxLines: 2 }),
  },
  
  // Special purpose
  button: {
    fontSize: getScaledFontSize('body', { maxScale: 1.2 }),
    lineHeight: getScaledFontSize('body', { maxScale: 1.2 }) * 1.2,
    fontWeight: '500' as const,
    numberOfLines: 1,
  },
  metric: {
    fontSize: getScaledFontSize(24, { maxScale: 1.15, factor: 0.25 }),
    lineHeight: getScaledFontSize(24, { maxScale: 1.15, factor: 0.25 }) * 1.1,
    fontWeight: '600' as const,
    numberOfLines: 1,
  },
  metricValue: {
    fontSize: getScaledFontSize(32, { maxScale: 1.1, factor: 0.2 }),
    lineHeight: getScaledFontSize(32, { maxScale: 1.1, factor: 0.2 }) * 1.1,
    fontWeight: '700' as const,
    numberOfLines: 1,
  },
} as const;

/**
 * Get dynamic typography props based on current context
 * @param preset - Typography preset name
 * @param options - Additional options for customization
 */
export function getTypographyProps(
  preset: keyof typeof typography,
  options?: {
    numberOfLines?: number;
    adjustsFontSizeToFit?: boolean;
    minimumFontScale?: number;
  }
) {
  const baseProps = typography[preset];
  
  return {
    ...baseProps,
    numberOfLines: options?.numberOfLines ?? baseProps.numberOfLines,
    adjustsFontSizeToFit: options?.adjustsFontSizeToFit ?? true,
    minimumFontScale: options?.minimumFontScale ?? 0.8,
  };
}

/**
 * Font family definitions
 */
export const fontFamilies = {
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System',
  mono: 'Courier New',
} as const;

/**
 * Line height multipliers for different text styles
 */
export const lineHeightMultipliers = {
  tight: 1.1,
  normal: 1.5,
  relaxed: 1.7,
  loose: 2,
} as const;

/**
 * Helper to get responsive line height
 */
export function getLineHeight(
  fontSize: number,
  multiplier: keyof typeof lineHeightMultipliers = 'normal'
): number {
  return fontSize * lineHeightMultipliers[multiplier];
}