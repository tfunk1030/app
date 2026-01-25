/**
 * ProgressiveLoader.tsx
 *
 * A component that implements progressive loading for data-heavy screens
 * to improve perceived performance and user experience.
 */

import { useTokens } from '@/src/theme/useTokens';
import { LogManager } from '@/src/utils/LogManager';
import { scaledFontSize } from '@/src/utils/responsive';
import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';

// Priority levels for loading content
export enum LoadPriority {
  CRITICAL = 0, // Load immediately (header, navigation)
  HIGH = 1, // Load quickly (main content)
  MEDIUM = 2, // Load after high priority (secondary content)
  LOW = 3, // Load last (details, supplementary info)
  LAZY = 4, // Load only when visible or on demand
}

interface ProgressiveLoaderProps {
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Error message if loading failed */
  error?: string | null;
  /** Content to display when loaded */
  children: ReactNode;
  /** Priority level for this content */
  priority?: LoadPriority;
  /** Skeleton to show while loading */
  skeleton?: ReactNode;
  /** Minimum time to show skeleton (ms) */
  minimumLoadTime?: number;
  /** Whether to fade in content when loaded */
  fadeIn?: boolean;
  /** Fade in duration (ms) */
  fadeInDuration?: number;
  /** Callback when content is fully loaded */
  onLoaded?: () => void;
  /** Whether to retry loading on error */
  retryOnError?: boolean;
  /** Retry callback function */
  onRetry?: () => void;
  /** Custom error component */
  errorComponent?: ReactNode;
  /** Whether to show loading indicator */
  showLoadingIndicator?: boolean;
}

/**
 * ProgressiveLoader component for implementing progressive loading
 */
export function ProgressiveLoader({
  isLoading,
  error,
  children,
  priority = LoadPriority.HIGH,
  skeleton,
  minimumLoadTime = 100, // Reduced from 500ms to 100ms
  fadeIn = true,
  fadeInDuration = 150, // Reduced from 300ms to 150ms
  onLoaded,
  retryOnError = true,
  onRetry,
  errorComponent,
  showLoadingIndicator = true,
  immediateRenderThreshold = 1000, // New parameter - force render after 1 second
}: ProgressiveLoaderProps & { immediateRenderThreshold?: number }) {
  const t = useTokens();
  // State to track whether content should be visible
  const [shouldRender, setShouldRender] = useState(priority === LoadPriority.CRITICAL);
  // State to track minimum load time
  const [minimumTimeElapsed, setMinimumTimeElapsed] = useState(false);
  // Animation value for fade-in effect
  const [fadeAnim] = useState(new Animated.Value(0));
  // Logger for debugging
  const logger = LogManager.getLogger ? LogManager.getLogger('ProgressiveLoader') : console;

  // Calculate delay based on priority
  const getDelayForPriority = useCallback(() => {
    switch (priority) {
      case LoadPriority.CRITICAL:
        return 0;
      case LoadPriority.HIGH:
        return 50; // Reduced from 100ms
      case LoadPriority.MEDIUM:
        return 100; // Reduced from 300ms
      case LoadPriority.LOW:
        return 200; // Reduced from 600ms
      case LoadPriority.LAZY:
        return 300; // Reduced from 1000ms
      default:
        return 0;
    }
  }, [priority]);

  // Handle retry action
  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry();
    }
  }, [onRetry]);

  // Effect to handle progressive loading based on priority
  useEffect(() => {
    const delay = getDelayForPriority();

    // Set timeout to render content based on priority
    const renderTimeout = setTimeout(() => {
      setShouldRender(true);
    }, delay);

    return () => clearTimeout(renderTimeout);
  }, [getDelayForPriority]);

  // Effect to handle minimum load time
  useEffect(() => {
    if (isLoading) {
      setMinimumTimeElapsed(false);
      const timer = setTimeout(() => {
        setMinimumTimeElapsed(true);
      }, minimumLoadTime);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [isLoading, minimumLoadTime]);

  // Add aggressive timeout to prevent any loading delay
  useEffect(() => {
    if (isLoading) {
      const loadingTimeout = setTimeout(() => {
        if (isLoading) {
          logger.warn('Loading timeout reached, forcing render');
          // Force render content even if still technically loading
          setMinimumTimeElapsed(true);
        }
      }, 2000); // Reduced to 2 seconds maximum loading time

      return () => clearTimeout(loadingTimeout);
    }
  }, [isLoading]);

  // Add immediate check to ensure content is shown quickly
  useEffect(() => {
    // If loading takes too long, force content to show
    const forceRenderTimeout = setTimeout(() => {
      if (!minimumTimeElapsed) {
        setMinimumTimeElapsed(true);
        logger.warn('Force rendering content after short loading period');
      }
    }, immediateRenderThreshold || 1000); // 1 second absolute maximum by default

    return () => clearTimeout(forceRenderTimeout);
  }, [minimumTimeElapsed, immediateRenderThreshold]);

  // Effect to handle fade-in animation
  useEffect(() => {
    if (!isLoading && minimumTimeElapsed && fadeIn) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: fadeInDuration,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start(() => {
        if (onLoaded) {
          onLoaded();
        }
      });
    }
  }, [isLoading, minimumTimeElapsed, fadeIn, fadeAnim, fadeInDuration, onLoaded]);

  // If we shouldn't render yet based on priority, return null
  if (!shouldRender) {
    return null;
  }

  // If there's an error, show error state
  if (error) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }

    return (
      <View style={[styles.errorContainer, { backgroundColor: t.colors.surfaceAlt }]}>
        <Text style={[styles.errorText, { color: t.colors.danger }]} accessibilityRole="alert">
          {error}
        </Text>
        {retryOnError && (
          <Text style={[styles.retryText, { color: t.colors.brandAlt }]} onPress={handleRetry}>
            Tap to retry
          </Text>
        )}
      </View>
    );
  }

  // If still loading or minimum time not elapsed, show skeleton
  if (isLoading || !minimumTimeElapsed) {
    return (
      <View style={styles.container}>
        {skeleton || (
          <View style={styles.defaultSkeletonContainer}>
            <SkeletonLoader type="rectangle" count={2} />
            {showLoadingIndicator && (
              <ActivityIndicator style={styles.loader} color={t.colors.brandAlt} />
            )}
          </View>
        )}
      </View>
    );
  }

  // Content is ready to display, possibly with fade-in animation
  return (
    <Animated.View style={[styles.container, { opacity: fadeIn ? fadeAnim : 1 }]}>
      {children}
    </Animated.View>
  );
}

// Component for lazy loading content only when needed
export function LazyLoader({
  children,
  isVisible = true,
  placeholder,
  ...props
}: ProgressiveLoaderProps & { isVisible?: boolean; placeholder?: ReactNode }) {
  const [shouldLoad, setShouldLoad] = useState(false);

  // Only load content when it becomes visible
  useEffect(() => {
    if (isVisible && !shouldLoad) {
      setShouldLoad(true);
    }
  }, [isVisible, shouldLoad]);

  if (!isVisible) {
    return <>{placeholder}</> || null;
  }

  if (!shouldLoad) {
    return <>{placeholder}</> || <View style={styles.placeholder} />;
  }

  return (
    <ProgressiveLoader priority={LoadPriority.LAZY} {...props}>
      {children}
    </ProgressiveLoader>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  defaultSkeletonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loader: {
    marginTop: 16,
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  errorText: {
    fontSize: scaledFontSize(14),
    textAlign: 'center',
    marginBottom: 8,
  },
  retryText: {
    fontSize: scaledFontSize(14),
    fontWeight: '500',
    textAlign: 'center',
  },
  placeholder: {
    width: '100%',
    height: 100,
  },
});
