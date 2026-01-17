import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

type ErrorDetail = {
  location?: string;
  context?: string;
  timestamp?: number;
  message?: string;
  [key: string]: unknown;
};

type NativeErrorEvent = {
  type: 'errorRecoveryFailure' | 'startupProcedureError';
  details: ErrorDetail;
};

// Define listeners type
type ErrorListener = (event: NativeErrorEvent) => void;

class NativeErrorBridge {
  private eventEmitter: NativeEventEmitter | null = null;
  private listeners: ErrorListener[] = [];

  constructor() {
    // Only initialize on iOS where we have this native module
    if (Platform.OS === 'ios' && NativeModules.NativeErrorModule) {
      this.eventEmitter = new NativeEventEmitter(NativeModules.NativeErrorModule);

      // Initialize the native module
      NativeModules.NativeErrorModule.install();

      // Listen for native errors
      this.eventEmitter.addListener('nativeErrorEvent', this.handleNativeError);
      console.log('NativeErrorBridge: Successfully initialized');
    } else {
      console.log('NativeErrorBridge: Native module not available');
    }
  }

  private handleNativeError = (event: NativeErrorEvent) => {
    console.error(`Native error event received: ${event.type}`, event.details);

    // Execute all registered listeners
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in native error listener:', error);
      }
    });

    // Specific handling for different error types
    switch (event.type) {
      case 'errorRecoveryFailure':
        this.handleErrorRecoveryFailure(event.details);
        break;
      case 'startupProcedureError':
        this.handleStartupProcedureError(event.details);
        break;
    }
  };

  private handleErrorRecoveryFailure(details: ErrorDetail) {
    // Clear any problematic app state or cache
    this.clearProblemCache();
  }

  private handleStartupProcedureError(details: ErrorDetail) {
    // Reset to default startup state
    this.resetToDefaultState();
  }

  private async clearProblemCache() {
    try {
      // Clear AsyncStorage cache
      await AsyncStorage.removeItem('app-cache-data');
      console.log('Successfully cleared app cache data from JavaScript');

      // Try to clear file system cache if available
      try {
        if (FileSystem.documentDirectory) {
          const cachePath = FileSystem.documentDirectory + 'app-cache/';

          // Check if directory exists before attempting deletion
          const dirInfo = await FileSystem.getInfoAsync(cachePath);
          if (dirInfo.exists) {
            await FileSystem.deleteAsync(cachePath, { idempotent: true });
            console.log('Successfully cleared file system cache');
          }
        }
      } catch (fsError) {
        console.warn('Error clearing file system cache:', fsError);
      }
    } catch (error) {
      console.error('Failed to clear app cache from JavaScript:', error);
    }
  }

  private resetToDefaultState() {
    // Reset app to default state
    // This depends on your state management solution (Redux, Context, etc.)
    console.log('Resetting app to default state');

    // Broadcast a reset event that components can listen for
    const resetEvent: NativeErrorEvent = {
      type: 'startupProcedureError',
      details: {
        action: 'reset_state',
        timestamp: Date.now()
      }
    };

    this.listeners.forEach(listener => {
      try {
        listener(resetEvent);
      } catch (error) {
        console.error('Error in reset state listener:', error);
      }
    });
  }

  // Public API
  public addListener(listener: ErrorListener): () => void {
    this.listeners.push(listener);

    // Return function to remove this listener
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Method to simulate native errors (for testing)
  public simulateNativeError(type: NativeErrorEvent['type'], details: ErrorDetail = {}) {
    if (__DEV__) {
      console.log(`Simulating native error: ${type}`);
      this.handleNativeError({
        type,
        details: {
          timestamp: Date.now(),
          ...details
        }
      });
    }
  }
}

// Create singleton instance
export const nativeErrorBridge = new NativeErrorBridge();

export default nativeErrorBridge;
