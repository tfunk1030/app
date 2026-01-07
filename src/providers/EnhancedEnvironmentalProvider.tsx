/**
 * EnhancedEnvironmentalProvider.tsx
 *
 * A provider component that uses the enhanced environmental service
 * with throttling and background mode support for better performance.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { enhancedEnvironmentalService } from '../services/enhanced-environmental-service';
import { EnvironmentalConditions } from '../services/environmental-calculations';
import { AppState } from 'react-native';
import { LogManager } from '../utils/LogManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

const logger = LogManager.getLogger('EnhancedEnvironmentalProvider');

interface ThrottlingStatus {
  isThrottled: boolean;
  lastRequestTime: number | null;
  requestCount: number;
  interval: number;
}

interface EnhancedEnvironmentalContextType {
  conditions: EnvironmentalConditions | null;
  isLoading: boolean;
  isActive: boolean;
  throttlingStatus: ThrottlingStatus | null;
  lastUpdatedTimestamp: number | null; // Added timestamp
  refreshData: () => Promise<void>;
  forceRefresh: () => Promise<void>; // New method to force refresh
}

const EnhancedEnvironmentalContext = createContext<EnhancedEnvironmentalContextType>({
  conditions: null,
  isLoading: true,
  isActive: true,
  throttlingStatus: null,
  lastUpdatedTimestamp: null, // Added default timestamp
  refreshData: async () => {},
  forceRefresh: async () => {} // Default implementation
});

interface EnhancedEnvironmentalProviderProps {
  children: React.ReactNode;
  refreshTrigger?: number; // Optional prop to trigger refresh
}

/**
 * Provider component for environmental data with performance optimizations
 */
export function EnhancedEnvironmentalProvider({
  children,
  refreshTrigger = 0
}: EnhancedEnvironmentalProviderProps) {
  const [conditions, setConditions] = useState<EnvironmentalConditions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [throttlingStatus, setThrottlingStatus] = useState<ThrottlingStatus | null>(null);
  const [lastUpdatedTimestamp, setLastUpdatedTimestamp] = useState<number | null>(null); // State for timestamp

  // Load cached data immediately on mount
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cachedData = await AsyncStorage.getItem('last-known-conditions');
        if (cachedData) {
          const parsedData = JSON.parse(cachedData) as EnvironmentalConditions;
          // Set conditions immediately with cached data
          setConditions(parsedData);
          // TODO: Consider if cached data should have its own timestamp stored/retrieved
          // For now, don't set timestamp from cache, wait for live data.
          // Mark as not loading to show UI immediately
          setIsLoading(false);
          setIsActive(true);
          logger.info('Loaded cached data for immediate display');
        }
      } catch (error) {
        logger.error('Failed to load cached data', error);
      }
    };

    // Load cached data immediately
    loadCachedData();

    // Subscribe to environmental updates
    const unsubscribe = enhancedEnvironmentalService.subscribe((newConditions) => {
      logger.info('New conditions received from enhanced service');
      setConditions(newConditions);
      setLastUpdatedTimestamp(Date.now()); // Set timestamp when new data arrives
      setIsLoading(false);

      // Update throttling status for debugging
      setThrottlingStatus(enhancedEnvironmentalService.getThrottlingStatus());
    });

    // Start the monitoring service
    enhancedEnvironmentalService.startMonitoring().catch(error => {
      logger.error('Error starting enhanced environmental monitoring', error);
      setIsLoading(false);
      setIsActive(true); // Force active even on error
    });

    // Monitor app state
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setIsActive(nextAppState === 'active');

      // Update throttling status when app state changes
      setThrottlingStatus(enhancedEnvironmentalService.getThrottlingStatus());
    });

    // Clean up on unmount
    return () => {
      logger.info('Cleaning up enhanced environmental monitoring');
      unsubscribe();
      subscription.remove();
      enhancedEnvironmentalService.stopMonitoring();
    };
  }, []);

  // Add a much shorter timeout mechanism to force isActive to true if it gets stuck
  useEffect(() => {
    const forceActiveTimeout = setTimeout(() => {
      if (!isActive || isLoading) {
        logger.warn('Forcing active state after short timeout');
        setIsActive(true);
        setIsLoading(false);
      }
    }, 1000); // Reduced to 1 second timeout

    return () => clearTimeout(forceActiveTimeout);
  }, [isActive, isLoading]);

  // React to refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      logger.info('Refresh triggered externally', { refreshTrigger });
      forceRefresh();
    }
  }, [refreshTrigger]);

  // Function to manually refresh data
  const refreshData = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await enhancedEnvironmentalService.startMonitoring();
      // Throttling status will be updated via the subscription
    } catch (error) {
      logger.error('Error refreshing environmental data', error);
      setIsLoading(false);
    }
  };

  // Add a manual refresh method that can be called from screens
  const forceRefresh = useCallback(async () => {
    // Don't set loading to true to avoid flickering UI
    try {
      await enhancedEnvironmentalService.startMonitoring(true); // Add force parameter
      setIsActive(true);
      setIsLoading(false);
    } catch (error) {
      logger.error('Error force refreshing environmental data', error);
      setIsLoading(false);
      setIsActive(true);
    }
  }, []);

  // Update throttling status periodically for debugging
  useEffect(() => {
    if (!isActive) return;

    const intervalId = setInterval(() => {
      setThrottlingStatus(enhancedEnvironmentalService.getThrottlingStatus());
    }, 10000); // Update every 10 seconds when active

    return () => clearInterval(intervalId);
  }, [isActive]);

  const contextValue: EnhancedEnvironmentalContextType = {
    conditions,
    isLoading,
    isActive,
    throttlingStatus,
    lastUpdatedTimestamp, // Expose timestamp
    refreshData,
    forceRefresh
  };

  return (
    <EnhancedEnvironmentalContext.Provider value={contextValue}>
      {children}
    </EnhancedEnvironmentalContext.Provider>
  );
}

/**
 * Hook to use the enhanced environmental context
 */
export function useEnhancedEnvironmental() {
  const context = useContext(EnhancedEnvironmentalContext);
  if (!context) {
    throw new Error('useEnhancedEnvironmental must be used within an EnhancedEnvironmentalProvider');
  }
  return context;
}
