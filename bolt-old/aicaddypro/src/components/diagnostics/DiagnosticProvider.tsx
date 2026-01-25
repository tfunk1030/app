/**
 * DiagnosticProvider.tsx
 *
 * A provider component that manages the visibility of the DiagnosticOverlay
 * and provides a way to toggle it. This component is part of the Enhanced
 * Diagnostics Pattern implementation.
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { FeatureFlags } from '@/src/utils/FeatureFlags';
import DiagnosticOverlay from './DiagnosticOverlay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogManager } from '@/src/utils/LogManager';
import { DiagnosticContext, DiagnosticContextType } from './DiagnosticContext';

// Storage key for diagnostic overlay visibility
const DIAGNOSTIC_OVERLAY_VISIBLE_KEY = 'diagnostic_overlay_visible';

interface DiagnosticProviderProps {
  children: React.ReactNode;
}

/**
 * DiagnosticProvider component that provides diagnostic functionality
 * and manages the visibility of the DiagnosticOverlay.
 */
export const DiagnosticProvider: React.FC<DiagnosticProviderProps> = ({ children }) => {
  // State for diagnostic mode and overlay visibility
  const [isDiagnosticModeEnabled, setIsDiagnosticModeEnabled] = useState<boolean>(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState<boolean>(false);

  // Logger for the DiagnosticProvider
  const logger = LogManager.getLogger('DiagnosticProvider');

  // Initialize diagnostic mode based on feature flags
  useEffect(() => {
    const checkDiagnosticMode = () => {
      const diagnosticEnabled = FeatureFlags.DIAGNOSTIC_MODE;
      const debugOverlayEnabled = FeatureFlags.ALLOW_DEBUG_OVERLAY;

      // Enable diagnostic mode if either flag is enabled
      const enabled = diagnosticEnabled || debugOverlayEnabled;
      setIsDiagnosticModeEnabled(enabled);

      logger.info('Diagnostic mode status', {
        diagnosticEnabled,
        debugOverlayEnabled,
        enabled
      });

      // If diagnostic mode is disabled, ensure overlay is hidden
      if (!enabled && isOverlayVisible) {
        setIsOverlayVisible(false);
      }
    };

    // Check diagnostic mode on mount
    checkDiagnosticMode();

    // Re-check when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkDiagnosticMode();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isOverlayVisible]);

  // Load overlay visibility from AsyncStorage on mount
  useEffect(() => {
    const loadOverlayVisibility = async () => {
      try {
        const storedVisibility = await AsyncStorage.getItem(DIAGNOSTIC_OVERLAY_VISIBLE_KEY);
        if (storedVisibility !== null) {
          setIsOverlayVisible(storedVisibility === 'true');
          logger.info('Loaded overlay visibility', { visible: storedVisibility === 'true' });
        }
      } catch (error) {
        logger.error('Failed to load overlay visibility', { error });
      }
    };

    if (isDiagnosticModeEnabled) {
      loadOverlayVisibility();
    }
  }, [isDiagnosticModeEnabled]);

  // Toggle overlay visibility
  const toggleOverlay = async () => {
    const newVisibility = !isOverlayVisible;
    setIsOverlayVisible(newVisibility);

    // Save visibility state to AsyncStorage
    try {
      await AsyncStorage.setItem(DIAGNOSTIC_OVERLAY_VISIBLE_KEY, newVisibility.toString());
      logger.info('Toggled overlay visibility', { visible: newVisibility });
    } catch (error) {
      logger.error('Failed to save overlay visibility', { error });
    }
  };

  // Save sensor status to AsyncStorage
  const saveSensorStatus = async (sensor: string, status: any) => {
    try {
      // Get existing sensor status
      const storedStatus = await AsyncStorage.getItem('sensor_status');
      let sensorStatus: Record<string, any> = {};

      if (storedStatus) {
        sensorStatus = JSON.parse(storedStatus);
      }

      // Update sensor status
      sensorStatus[sensor] = {
        ...status,
        timestamp: new Date().toISOString()
      };

      // Save updated sensor status
      await AsyncStorage.setItem('sensor_status', JSON.stringify(sensorStatus));
      logger.info('Saved sensor status', { sensor, status });
    } catch (error) {
      logger.error('Failed to save sensor status', { error, sensor });
    }
  };

  // Context value
  const contextValue: DiagnosticContextType = {
    isDiagnosticModeEnabled,
    isOverlayVisible,
    toggleOverlay,
    saveSensorStatus
  };

  return (
    <DiagnosticContext.Provider value={contextValue}>
      <View style={styles.container}>
        {children}
        {isDiagnosticModeEnabled && (
          <DiagnosticOverlay
            isVisible={isOverlayVisible}
            onClose={toggleOverlay}
          />
        )}
      </View>
    </DiagnosticContext.Provider>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default DiagnosticProvider;
