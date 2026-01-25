/**
 * DiagnosticOverlayAdapter.tsx
 *
 * An adapter component that provides state transition functionality
 * without relying on the deprecated WindDataProvider.
 * This adapter implements the Adapter Pattern to maintain compatibility
 * with the DiagnosticOverlay component.
 */

import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogManager } from '@/src/utils/LogManager';

// State transition storage key (same as in the original WindDataProvider)
const STATE_TRANSITIONS_STORAGE_KEY = 'wind_data_state_transitions';

// Logger for the adapter
const logger = LogManager.getLogger('DiagnosticOverlayAdapter');

// Interface for state transitions
interface StateTransition {
  timestamp: string;
  fromState: any;
  toState: any;
  action: string;
  cause?: string;
}

// Context type that mimics the original WindDataContext
interface WindDataAdapterContextType {
  getStateTransitions: () => Promise<StateTransition[]>;
}

// Create a React context
const WindDataAdapterContext = React.createContext<WindDataAdapterContextType | null>(null);

/**
 * WindDataAdapter component that provides state transition functionality
 * without the full WindDataProvider implementation.
 */
export function WindDataAdapter({ children }: { children: React.ReactNode }) {
  // Function to get state transitions from AsyncStorage
  const getStateTransitions = async (): Promise<StateTransition[]> => {
    try {
      const storedTransitions = await AsyncStorage.getItem(STATE_TRANSITIONS_STORAGE_KEY);
      if (storedTransitions) {
        return JSON.parse(storedTransitions) as StateTransition[];
      }
      logger.info('No state transitions found in storage');
    } catch (error) {
      logger.error('Failed to get state transitions', { error });
    }
    return [];
  };

  // Context value
  const contextValue: WindDataAdapterContextType = {
    getStateTransitions
  };

  return (
    <WindDataAdapterContext.Provider value={contextValue}>
      {children}
    </WindDataAdapterContext.Provider>
  );
}

/**
 * Hook that provides access to the WindDataAdapter context.
 * This hook mimics the original useWindData hook for compatibility.
 */
export function useWindData() {
  const context = React.useContext(WindDataAdapterContext);
  if (!context) {
    throw new Error('useWindData must be used within a WindDataAdapter');
  }
  return context;
}
