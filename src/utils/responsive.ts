import { AccessibilityInfo, Dimensions, PixelRatio, Platform } from 'react-native';

// Base dimensions from a reference device (iPhone X)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Accessibility constants
const MIN_TOUCH_TARGET = 44; // iOS minimum touch target size in points
const MAX_FONT_SCALE = 1.35; // Maximum font scale to prevent layout breaking
const MIN_FONT_SCALE = 0.85; // Minimum font scale for readability
const SAFE_FONT_SCALE_FACTOR = 0.3; // How much to respect system font scale (0-1)

// FloatingTabBar constants
const FLOATING_TAB_BAR_HEIGHT = 64; // minHeight of the FloatingTabBar component
const DEFAULT_BOTTOM_BUFFER = 16; // Additional buffer space below tab bar

function getScreen() {
  const { width, height, scale, fontScale } = Dimensions.get('window');
  return { width, height, scale, fontScale };
}

export function scale(size: number): number {
  const { width } = getScreen();
  return (width / BASE_WIDTH) * size;
}

export function verticalScale(size: number): number {
  const { height } = getScreen();
  return (height / BASE_HEIGHT) * size;
}

export function moderateScale(size: number, factor = 0.5): number {
  const scaled = scale(size);
  return size + (scaled - size) * factor;
}

export function scaledFontSize(size: number, factor = 0.5): number {
  const { fontScale } = getScreen();
  // Start with moderate scale and respect system fontScale moderately
  const ms = moderateScale(size, factor);
  // Respect the user's system font size without an artificial cap
  // RN Text respects Dynamic Type via fontScale by default; we mirror that here
  const adjusted = ms * fontScale;
  // Round to nearest pixel for crisp rendering
  return PixelRatio.roundToNearestPixel(adjusted);
}

/**
 * Safe scaled font size that prevents layout breaking while respecting accessibility
 * This function scales text with intelligent limits to maintain visual layout integrity
 */
export function safeScaledFontSize(
  size: number,
  options?: {
    maxScale?: number;
    minScale?: number;
    factor?: number;
    respectSystemScale?: boolean;
  }
): number {
  const {
    maxScale = MAX_FONT_SCALE,
    minScale = MIN_FONT_SCALE,
    factor = SAFE_FONT_SCALE_FACTOR,
    respectSystemScale = true,
  } = options || {};

  const { fontScale } = getScreen();
  const ms = moderateScale(size, 0.5);

  if (!respectSystemScale) {
    return PixelRatio.roundToNearestPixel(ms);
  }

  // Apply intelligent scaling limits
  const clampedFontScale = clamp(fontScale, minScale, maxScale);
  
  // Blend between base size and scaled size based on factor
  // This allows partial respect of system settings while maintaining layout
  const adjusted = ms * (1 + (clampedFontScale - 1) * factor);
  
  return PixelRatio.roundToNearestPixel(adjusted);
}

/**
 * Determines optimal number of lines based on font scale to prevent text truncation
 * while maintaining the visual layout
 */
export function getOptimalNumberOfLines(
  baseLines: number,
  options?: {
    minLines?: number;
    maxLines?: number;
    scaleFactor?: number;
  }
): number {
  const { minLines = 1, maxLines = 5, scaleFactor = 0.8 } = options || {};
  const { fontScale } = getScreen();

  // If fontScale is high, we might need more lines to show the same content
  // But we limit this to prevent excessive vertical growth
  const adjustedLines = Math.ceil(baseLines * (1 + (fontScale - 1) * scaleFactor));
  
  return clamp(adjustedLines, minLines, maxLines);
}

/**
 * Returns flexible minHeight values that scale appropriately with fontScale
 * to ensure content fits without breaking layout
 */
export function getFlexibleMinHeight(
  baseHeight: number,
  options?: {
    scaleFactor?: number;
    maxScaleRatio?: number;
    minScaleRatio?: number;
  }
): number {
  const {
    scaleFactor = 0.3,
    maxScaleRatio = 1.2,
    minScaleRatio = 0.9,
  } = options || {};

  const { fontScale } = getScreen();
  const vs = verticalScale(baseHeight);
  
  // Calculate scale ratio based on fontScale
  const scaleRatio = 1 + (fontScale - 1) * scaleFactor;
  const clampedRatio = clamp(scaleRatio, minScaleRatio, maxScaleRatio);
  
  return PixelRatio.roundToNearestPixel(vs * clampedRatio);
}

/**
 * Ensures touch targets meet iOS minimum requirements (44pt)
 * while respecting the visual design
 */
export function getTouchTargetSize(
  baseSize: number,
  options?: {
    minSize?: number;
    respectScale?: boolean;
    scaleFactor?: number;
  }
): number {
  const {
    minSize = MIN_TOUCH_TARGET,
    respectScale = true,
    scaleFactor = 0.5,
  } = options || {};

  const { fontScale } = getScreen();
  
  let size = respectScale ? moderateScale(baseSize, scaleFactor) : baseSize;
  
  // Ensure minimum touch target size for accessibility
  // But also scale up slightly with fontScale for users who need larger targets
  if (fontScale > 1.1) {
    size = size * (1 + (fontScale - 1) * 0.2);
  }
  
  return Math.max(PixelRatio.roundToNearestPixel(size), minSize);
}

/**
 * Calculates appropriate scroll view padding/gutters based on screen size and fontScale
 */
export function getScrollPadding(
  basePadding: number = 16,
  options?: {
    scaleFactor?: number;
    minPadding?: number;
    maxPadding?: number;
  }
): number {
  const {
    scaleFactor = 0.5,
    minPadding = 8,
    maxPadding = 32,
  } = options || {};

  const { fontScale } = getScreen();

  // Scale padding based on screen width
  let padding = scale(basePadding);
  
  // Adjust slightly for font scale - users with larger text might need more breathing room
  // But we keep changes minimal to maintain layout
  if (fontScale > 1.15) {
    padding = padding * (1 + (fontScale - 1) * scaleFactor);
  }
  
  return clamp(PixelRatio.roundToNearestPixel(padding), minPadding, maxPadding);
}

/**
 * Calculates bottom padding for ScrollView content containers to ensure content
 * is fully visible above the FloatingTabBar.
 *
 * This accounts for:
 * - FloatingTabBar height (64pt)
 * - Device safe area bottom inset (for notch devices/home indicator)
 * - Additional buffer for visual breathing room
 *
 * @param safeAreaBottom - The device's safe area bottom inset from useSafeAreaInsets()
 * @param options - Optional configuration for customizing the calculation
 * @returns The total bottom padding in pixels, rounded to nearest pixel
 */
export function getBottomPadding(
  safeAreaBottom: number = 0,
  options?: {
    tabBarHeight?: number;
    buffer?: number;
    includeTabBar?: boolean;
  }
): number {
  const {
    tabBarHeight = FLOATING_TAB_BAR_HEIGHT,
    buffer = DEFAULT_BOTTOM_BUFFER,
    includeTabBar = true,
  } = options || {};

  // Calculate total padding:
  // - Tab bar height (if included)
  // - Safe area bottom inset (accounts for home indicator on newer iPhones)
  // - Buffer for visual spacing
  let padding = safeAreaBottom + moderateScale(buffer);

  if (includeTabBar) {
    padding += tabBarHeight;
  }

  return PixelRatio.roundToNearestPixel(padding);
}

/**
 * Determines when horizontal scrolling should be enabled to prevent layout breaking
 * This helps maintain the visual layout when content would otherwise overflow
 */
export function shouldUseHorizontalScroll(options?: {
  contentWidth?: number;
  containerWidth?: number;
  threshold?: number;
  checkFontScale?: boolean;
}): boolean {
  const {
    contentWidth,
    containerWidth,
    threshold = 0.95, // Use scroll when content is 95% of container width
    checkFontScale = true,
  } = options || {};

  const { width, fontScale } = getScreen();

  // Check if font scale alone suggests horizontal scroll might be needed
  if (checkFontScale && fontScale > 1.2) {
    return true;
  }

  // Check if screen is particularly narrow
  if (width < 360) {
    return true;
  }

  // Check specific content/container relationship if provided
  if (contentWidth && containerWidth) {
    return contentWidth > containerWidth * threshold;
  }

  return false;
}

/**
 * Gets responsive spacing that adapts to screen size and fontScale
 * while maintaining visual consistency
 */
export function getResponsiveSpacing(
  baseSpacing: number,
  variant: 'horizontal' | 'vertical' = 'horizontal'
): number {
  const { fontScale } = getScreen();
  
  const scaled = variant === 'horizontal' 
    ? scale(baseSpacing)
    : verticalScale(baseSpacing);
  
  // Very minimal adjustment for fontScale to maintain layout
  // Only apply when fontScale is significantly different from 1
  let adjusted = scaled;
  if (fontScale > 1.3 || fontScale < 0.85) {
    adjusted = scaled * (1 + (fontScale - 1) * 0.1);
  }
  
  return PixelRatio.roundToNearestPixel(adjusted);
}

/**
 * Calculates icon size that scales appropriately with text
 * while maintaining visual balance
 */
export function getIconSize(
  baseSize: number,
  options?: {
    scaleFactor?: number;
    minSize?: number;
    maxSize?: number;
    scaleWithFont?: boolean;
  }
): number {
  const {
    scaleFactor = 0.5,
    minSize = 16,
    maxSize = 48,
    scaleWithFont = true,
  } = options || {};

  const { fontScale } = getScreen();
  const ms = moderateScale(baseSize, scaleFactor);
  
  if (!scaleWithFont) {
    return clamp(PixelRatio.roundToNearestPixel(ms), minSize, maxSize);
  }
  
  // Icons should scale more conservatively than text to maintain visual balance
  const iconScale = 1 + (fontScale - 1) * 0.3;
  const adjusted = ms * iconScale;
  
  return clamp(PixelRatio.roundToNearestPixel(adjusted), minSize, maxSize);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export function getResponsiveCompassSize(): number {
  const { width, height } = getScreen();
  const base = Math.min(width, height) * 0.65;
  return clamp(base, 220, 380);
}

/**
 * Helper to get all responsive metrics for a component at once
 */
export function getResponsiveMetrics() {
  const { width, height, fontScale } = getScreen();
  
  return {
    screenWidth: width,
    screenHeight: height,
    fontScale,
    isCompact: width < 380 || fontScale > 1.15,
    isAccessibilityMode: fontScale > 1.3,
    needsHorizontalScroll: shouldUseHorizontalScroll(),
    spacing: {
      xs: getResponsiveSpacing(4),
      sm: getResponsiveSpacing(8),
      md: getResponsiveSpacing(16),
      lg: getResponsiveSpacing(24),
      xl: getResponsiveSpacing(32),
    },
    padding: {
      scroll: getScrollPadding(),
      content: getScrollPadding(16),
      card: getScrollPadding(12),
    },
  };
}

/**
 * Get current accessibility information for debugging
 * Returns detailed info about current accessibility state
 */
export async function getAccessibilityInfo() {
  const { width, height, fontScale, scale } = getScreen();
  
  // Get various accessibility states
  const [
    isReduceMotionEnabled,
    isScreenReaderEnabled,
    isBoldTextEnabled,
    isGrayscaleEnabled,
    isInvertColorsEnabled,
    isReduceTransparencyEnabled,
  ] = await Promise.all([
    AccessibilityInfo.isReduceMotionEnabled?.() ?? Promise.resolve(false),
    AccessibilityInfo.isScreenReaderEnabled?.() ?? Promise.resolve(false),
    Platform.OS === 'ios'
      ? AccessibilityInfo.isBoldTextEnabled?.() ?? Promise.resolve(false)
      : Promise.resolve(false),
    Platform.OS === 'ios'
      ? AccessibilityInfo.isGrayscaleEnabled?.() ?? Promise.resolve(false)
      : Promise.resolve(false),
    Platform.OS === 'ios'
      ? AccessibilityInfo.isInvertColorsEnabled?.() ?? Promise.resolve(false)
      : Promise.resolve(false),
    Platform.OS === 'ios'
      ? AccessibilityInfo.isReduceTransparencyEnabled?.() ?? Promise.resolve(false)
      : Promise.resolve(false),
  ]);

  return {
    screen: {
      width,
      height,
      scale,
      fontScale,
      isCompact: width < 380 || fontScale > 1.15,
      isAccessibilityMode: fontScale > 1.3,
    },
    accessibility: {
      isReduceMotionEnabled,
      isScreenReaderEnabled,
      isBoldTextEnabled,
      isGrayscaleEnabled,
      isInvertColorsEnabled,
      isReduceTransparencyEnabled,
    },
    recommendations: {
      useHorizontalScroll: shouldUseHorizontalScroll(),
      scrollPadding: getScrollPadding(),
      minTouchTarget: MIN_TOUCH_TARGET,
    },
  };
}

/**
 * Validate if a touch target meets accessibility requirements
 * Returns validation result with details
 */
export function validateTouchTarget(currentSize: number, minSize: number = MIN_TOUCH_TARGET) {
  const isValid = currentSize >= minSize;
  
  return {
    isValid,
    currentSize,
    minSize,
    deficit: isValid ? 0 : minSize - currentSize,
    message: isValid
      ? `Touch target meets requirement (${currentSize}pt >= ${minSize}pt)`
      : `Touch target too small (${currentSize}pt < ${minSize}pt). Increase by ${minSize - currentSize}pt`,
  };
}

/**
 * Get scaled value for compass elements based on compass size
 * This ensures all elements scale proportionally
 */
export function getCompassScaledValue(
  compassSize: number,
  ratio: number,
  min?: number,
  max?: number
): number {
  const scaled = compassSize * ratio;
  if (min && scaled < min) return min;
  if (max && scaled > max) return max;
  return Math.round(scaled);
}

/**
 * Get lock button position and size based on compass size
 * Returns position and size for proper placement relative to compass
 */
export function getLockButtonMetrics(compassSize: number) {
  return {
    position: 'absolute' as const,
    bottom: -getCompassScaledValue(compassSize, 0.18, 40, 50),
    right: -getCompassScaledValue(compassSize, 0.12, 26, 34),
    size: getCompassScaledValue(compassSize, 0.20, 48, 64),
  };
}

/**
 * Get cardinal direction styles based on compass size and direction
 * Implements visual hierarchy for North prominence
 */
export function getCardinalDirectionStyles(
  compassSize: number,
  direction: string
) {
  const isNorth = direction === 'N';
  const isMain = ['E', 'S', 'W'].includes(direction);
  const isIntercardinal = ['NE', 'SE', 'SW', 'NW'].includes(direction);
  
  return {
    containerSize: getCompassScaledValue(compassSize, 0.14, 32, 40),
    fontSize: getCompassScaledValue(
      compassSize,
      isNorth ? 0.072 : isMain ? 0.06 : 0.05,
      isNorth ? 16 : isMain ? 13 : 11,
      isNorth ? 20 : isMain ? 17 : 14
    ),
    fontWeight: isNorth ? '800' : isMain ? '700' : '600',
    opacity: isNorth ? 1 : isMain ? 0.9 : 0.7,
    sizeMultiplier: isNorth ? 1.2 : isMain ? 1.0 : 0.85,
    showDegrees: isMain && compassSize >= 240,
    showIntercardinalDegrees: isIntercardinal && compassSize >= 260,
  };
}

/**
 * Get degree tick mark dimensions based on compass size
 * Returns height, width, and opacity for different tick types
 */
export function getTickMarkStyles(
  compassSize: number,
  tickType: 'major' | 'minor' | 'subtle'
) {
  const styles = {
    major: {
      height: getCompassScaledValue(compassSize, 0.048, 11, 14),
      width: 2,
      opacity: 0.85,
    },
    minor: {
      height: getCompassScaledValue(compassSize, 0.032, 8, 10),
      width: 1.5,
      opacity: 0.65,
    },
    subtle: {
      height: getCompassScaledValue(compassSize, 0.016, 4, 6),
      width: 1,
      opacity: 0.45,
    },
  };
  
  return styles[tickType];
}

/**
 * Determine progressive enhancement features based on compass size
 * Returns boolean flags for features that should be enabled
 */
export function getCompassProgressiveFeatures(compassSize: number) {
  return {
    showIntercardinals: compassSize >= 240,
    showMainDegrees: compassSize >= 240,
    showIntercardinalDegrees: compassSize >= 260,
    showAllTickMarks: compassSize >= 240,
    showSubtleTickMarks: compassSize >= 260,
    enhancedVisualEffects: compassSize >= 260,
  };
}

/**
 * Get the radius for positioning cardinal directions
 * Calculates optimal distance from compass center
 */
export function getCardinalDirectionRadius(compassSize: number): number {
  // Position using formula: radius = compassSize/2 + (compassSize * 0.08)
  // Cardinals stay outside the compass for visibility
  return compassSize / 2 + getCompassScaledValue(compassSize, 0.08, 16, 22);
}

/**
 * Get center element dimensions (dot and wind origin indicator)
 * Scales proportionally with compass size
 */
export function getCenterElementSizes(compassSize: number) {
  return {
    centerDot: getCompassScaledValue(compassSize, 0.04, 9, 11),
    windOriginIndicator: getCompassScaledValue(compassSize, 0.08, 18, 22),
  };
}