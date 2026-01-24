/**
 * Compass Lock Provider
 *
 * Manages the locking of compass heading for wind calculations.
 * Works with the native iOS compass API to ensure exact heading accuracy.
 * Preserves the exact native heading values without additional processing.
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

interface CompassLockState {
  isLocked: boolean;
  referenceHeading: number;
  manualOffset: number;
}

interface CompassLockContextType {
  isLocked: boolean;
  referenceHeading: number;
  relativeWindAngle: number;
  toggleLock: () => Promise<void>;
  adjustOffset: (offset: number) => Promise<void>;
}

const STORAGE_KEYS = {
  LOCK_STATE: '@wind_compass_lock_state',
  REFERENCE_HEADING: '@wind_compass_reference',
  MANUAL_OFFSET: '@wind_compass_offset',
} as const;

const CompassLockContext = createContext<CompassLockContextType>({
  isLocked: false,
  referenceHeading: 0,
  relativeWindAngle: 0,
  toggleLock: async () => {},
  adjustOffset: async () => {},
});

export function useCompassLock() {
  return useContext(CompassLockContext);
}

interface CompassLockProviderProps {
  children: React.ReactNode;
  currentHeading: number;
  windDirection: number;
}

export function CompassLockProvider({
  children,
  currentHeading,
  windDirection,
}: CompassLockProviderProps) {
  const [lockState, setLockState] = useState<CompassLockState>({
    isLocked: false,
    referenceHeading: 0,
    manualOffset: 0,
  });

  // Load saved state on mount
  useEffect(() => {
    async function loadSavedState() {
      try {
        const [lockStateStr, referenceStr, offsetStr] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.LOCK_STATE),
          AsyncStorage.getItem(STORAGE_KEYS.REFERENCE_HEADING),
          AsyncStorage.getItem(STORAGE_KEYS.MANUAL_OFFSET),
        ]);

        if (lockStateStr && referenceStr && offsetStr) {
          setLockState({
            isLocked: JSON.parse(lockStateStr),
            referenceHeading: parseFloat(referenceStr),
            manualOffset: parseFloat(offsetStr),
          });
        }
      } catch (error) {
        console.error('Failed to load compass lock state:', error);
      }
    }

    loadSavedState();
  }, []);

  // Persist state changes
  const persistState = async (newState: CompassLockState) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.LOCK_STATE, JSON.stringify(newState.isLocked)),
        AsyncStorage.setItem(STORAGE_KEYS.REFERENCE_HEADING, String(newState.referenceHeading)),
        AsyncStorage.setItem(STORAGE_KEYS.MANUAL_OFFSET, String(newState.manualOffset)),
      ]);
    } catch (error) {
      console.error('Failed to save compass lock state:', error);
    }
  };

  const toggleLock = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const newState = {
        isLocked: !lockState.isLocked,
        referenceHeading: !lockState.isLocked ? currentHeading : lockState.referenceHeading,
        manualOffset: !lockState.isLocked ? 0 : lockState.manualOffset,
      };

      setLockState(newState);
      await persistState(newState);
    } catch (error) {
      console.error('Error toggling lock:', error);
    }
  };

  const adjustOffset = async (offset: number) => {
    if (!lockState.isLocked) return;

    try {
      await Haptics.selectionAsync();

      const newState = {
        ...lockState,
        manualOffset: offset,
      };

      setLockState(newState);
      await persistState(newState);
    } catch (error) {
      console.error('Error adjusting offset:', error);
    }
  };

  // Calculate relative wind angle - memoized to prevent stale state during rapid updates
  const relativeWindAngle = useMemo(
    () => ((windDirection - (lockState.isLocked ? lockState.referenceHeading : currentHeading) + lockState.manualOffset + 360) % 360),
    [windDirection, lockState.isLocked, lockState.referenceHeading, lockState.manualOffset, currentHeading]
  );

  return (
    <CompassLockContext.Provider
      value={{
        isLocked: lockState.isLocked,
        referenceHeading: lockState.referenceHeading,
        relativeWindAngle,
        toggleLock,
        adjustOffset,
      }}
    >
      {children}
    </CompassLockContext.Provider>
  );
}
