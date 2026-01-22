import { useWindowDimensions } from 'react-native';
import { 
  shouldUseHorizontalScroll, 
  getResponsiveMetrics,
  getTouchTargetSize,
  getFlexibleMinHeight,
  getScrollPadding,
  getOptimalNumberOfLines,
  safeScaledFontSize,
  getIconSize
} from '../utils/responsive';

/**
 * Hook that provides comprehensive layout information for responsive design
 * Maintains visual layout while adapting to accessibility settings
 */
export function useCompactLayout() {
  const { width, height, fontScale } = useWindowDimensions();
  
  // Core layout detection
  const isCompact = width < 380 || fontScale > 1.15;
  const isVeryCompact = width < 360 || fontScale > 1.3;
  const isAccessibilityMode = fontScale > 1.3;
  const isReducedTextMode = fontScale < 0.9;
  const isLandscape = width > height;
  
  // Get comprehensive responsive metrics
  const metrics = getResponsiveMetrics();
  
  // Layout helpers
  const needsHorizontalScroll = shouldUseHorizontalScroll({
    checkFontScale: true,
    threshold: 0.95
  });
  
  // Text scaling helpers
  const getScaledText = (size: number, options?: Parameters<typeof safeScaledFontSize>[1]) => {
    return safeScaledFontSize(size, {
      maxScale: isVeryCompact ? 1.15 : 1.35,
      factor: isCompact ? 0.25 : 0.3,
      ...options
    });
  };
  
  // Touch target helpers
  const getTouchTarget = (baseSize: number, options?: Parameters<typeof getTouchTargetSize>[1]) => {
    return getTouchTargetSize(baseSize, {
      respectScale: !isVeryCompact, // Don't scale on very small screens
      scaleFactor: isCompact ? 0.3 : 0.5,
      ...options
    });
  };
  
  // Container height helpers
  const getMinHeight = (baseHeight: number, options?: Parameters<typeof getFlexibleMinHeight>[1]) => {
    return getFlexibleMinHeight(baseHeight, {
      scaleFactor: isCompact ? 0.2 : 0.3,
      maxScaleRatio: isVeryCompact ? 1.1 : 1.2,
      ...options
    });
  };
  
  // Padding helpers
  const getPadding = (basePadding: number = 16, options?: Parameters<typeof getScrollPadding>[1]) => {
    return getScrollPadding(basePadding, {
      scaleFactor: isCompact ? 0.3 : 0.5,
      minPadding: isVeryCompact ? 6 : 8,
      maxPadding: isCompact ? 24 : 32,
      ...options
    });
  };
  
  // Line count helpers
  const getLines = (baseLines: number, options?: Parameters<typeof getOptimalNumberOfLines>[1]) => {
    return getOptimalNumberOfLines(baseLines, {
      scaleFactor: isCompact ? 0.6 : 0.8,
      maxLines: isVeryCompact ? baseLines + 1 : baseLines + 2,
      ...options
    });
  };
  
  // Icon size helpers
  const getIcon = (baseSize: number, options?: Parameters<typeof getIconSize>[1]) => {
    return getIconSize(baseSize, {
      scaleFactor: isCompact ? 0.3 : 0.5,
      scaleWithFont: !isVeryCompact, // Don't scale icons on very small screens
      ...options
    });
  };
  
  // Layout constraints
  const constraints = {
    // Maximum widths for content containers
    maxContentWidth: isCompact ? width - 32 : width - 48,
    maxCardWidth: isCompact ? width - 24 : width - 32,
    maxModalWidth: Math.min(width - 40, 400),
    
    // Minimum heights for touch targets
    minButtonHeight: getTouchTarget(44),
    minInputHeight: getTouchTarget(48),
    minCardHeight: getMinHeight(80),
    
    // Grid and spacing
    gridColumns: isVeryCompact ? 2 : isCompact ? 3 : 4,
    gridGap: isCompact ? 8 : 12,
    sectionSpacing: isCompact ? 16 : 24,
    
    // Text constraints
    maxTitleLines: getLines(1, { maxLines: 2 }),
    maxBodyLines: getLines(3, { maxLines: 5 }),
    maxCaptionLines: getLines(2, { maxLines: 3 }),
    
    // Component specific
    compassSize: Math.min(width * 0.65, isCompact ? 280 : 380),
    hourlyForecastHeight: getMinHeight(100, { maxScaleRatio: 1.15 }),
    windBarHeight: getMinHeight(60, { maxScaleRatio: 1.1 }),
  };
  
  return {
    // Core flags
    isCompact,
    isVeryCompact,
    isAccessibilityMode,
    isReducedTextMode,
    isLandscape,
    
    // Layout info
    width,
    height,
    fontScale,
    
    // Helper functions
    getScaledText,
    getTouchTarget,
    getMinHeight,
    getPadding,
    getLines,
    getIcon,
    
    // Pre-calculated metrics
    metrics,
    constraints,
    needsHorizontalScroll,
    
    // Convenience values
    spacing: metrics.spacing,
    padding: metrics.padding,
  };
}

/**
 * Type definition for the return value of useCompactLayout
 */
export type CompactLayoutInfo = ReturnType<typeof useCompactLayout>;