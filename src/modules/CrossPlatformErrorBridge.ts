import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

// Type definitions for error events and details
export type ErrorDetail = {
  location?: string;
  context?: string;
  timestamp?: number;
  message?: string;
  stack?: string;
  isFatal?: boolean;
  [key: string]: any;
};

export type NativeErrorEvent = {
  type: 'errorRecoveryFailure' | 'startupProcedureError';
  details: ErrorDetail;
};

// Define listeners type
export type ErrorListener = (event: NativeErrorEvent) => void;

/**
 * Base Error Bridge class with common functionality
 * Provides the foundation for platform-specific implementations
 */
class ErrorBridgeBase {
  protected listeners: ErrorListener[] = [];

  /**
   * Register a listener for error events
   * @param listener Function to call when errors occur
   * @returns Function to remove this listener
   */
  public addListener(listener: ErrorListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Clear problem cache when errors occur
   * This handles both AsyncStorage and FileSystem cache
   */
  public async clearProblemCache() {
    try {
      await AsyncStorage.removeItem('app-cache-data');
      console.log('Successfully cleared cache for key [app-cache-data]');

      try {
        if (FileSystem.documentDirectory) {
          const cachePath = FileSystem.documentDirectory + 'app-cache/';
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
      console.error('Failed to clear app cache:', error);
    }
  }

  /**
   * Simulate a native error (for testing in development)
   * @param type Error type
   * @param details Error details
   */
  public simulateNativeError(type: NativeErrorEvent['type'], details: ErrorDetail = {}) {
    if (__DEV__) {
      console.log(`Simulating error: ${type}`);
      this.notifyListeners({
        type,
        details: {
          timestamp: Date.now(),
          ...details
        }
      });
    }
  }

  /**
   * Notify all registered listeners of an error event
   * @param event Error event to broadcast
   */
  protected notifyListeners(event: NativeErrorEvent) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in error listener:', error);
      }
    });
  }
}

/**
 * Native implementation for iOS
 * Uses the NativeErrorModule when available
 */
class NativeErrorBridge extends ErrorBridgeBase {
  private eventEmitter: NativeEventEmitter | null = null;

  constructor() {
    super();
    if (Platform.OS === 'ios' && NativeModules.NativeErrorModule) {
      try {
        this.eventEmitter = new NativeEventEmitter(NativeModules.NativeErrorModule);
        NativeModules.NativeErrorModule.install();
        this.eventEmitter.addListener('nativeErrorEvent', this.handleNativeError);
        console.log('NativeErrorBridge: Successfully initialized');
      } catch (error) {
        console.warn('NativeErrorBridge: Failed to initialize native module:', error);
      }
    } else {
      // Just log without failing - we'll use JS fallback
      console.log('NativeErrorBridge: Native module not available, using JS fallback');
    }
  }

  private handleNativeError = (event: NativeErrorEvent) => {
    console.warn(`Native error received: ${event.type}`, event.details);
    this.notifyListeners(event);

    // Specific handling for different error types
    switch (event.type) {
      case 'errorRecoveryFailure':
        this.clearProblemCache();
        break;
      case 'startupProcedureError':
        // Handle startup errors
        console.warn('Startup procedure error detected');
        break;
    }
  };
}

/**
 * JavaScript fallback implementation for all platforms
 * Uses global error handlers when available
 */
class JSErrorBridge extends ErrorBridgeBase {
  constructor() {
    super();
    this.setupErrorHandlers();
  }

  private setupErrorHandlers() {
    // React Native has a global ErrorUtils but TypeScript doesn't know about it
    const globalAny = global as any;

    // Set up global error handler for uncaught errors
    if (globalAny.ErrorUtils &&
        typeof globalAny.ErrorUtils.getGlobalHandler === 'function' &&
        typeof globalAny.ErrorUtils.setGlobalHandler === 'function') {

      // Store the original handler to chain to it
      const originalHandler = globalAny.ErrorUtils.getGlobalHandler();

      globalAny.ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
        // Call original handler first
        if (originalHandler) {
          originalHandler(error, isFatal);
        }

        // Handle in our system too
        this.handleJSError(error, isFatal);
      });
      console.log('JSErrorBridge: Successfully initialized global error handler');
    } else {
      console.log('JSErrorBridge: ErrorUtils not available, using fallback');

      // Fallback to window.onerror
      const originalOnError = global.onerror;
      global.onerror = (message, source, lineno, colno, error) => {
        this.handleJSError(error || new Error(String(message)));
        return originalOnError ? originalOnError(message, source, lineno, colno, error) : true;
      };
    }
  }

  private handleJSError = (error: Error, isFatal?: boolean) => {
    // Only handle cache-related errors automatically
    const isCacheError =
      error.message?.includes('cache') ||
      error.stack?.includes('cache') ||
      error.message?.includes('Cache');

    if (isCacheError) {
      console.warn('JS error related to cache detected, clearing cache');
      this.clearProblemCache();

      this.notifyListeners({
        type: 'errorRecoveryFailure',
        details: {
          message: error.message,
          stack: error.stack,
          isFatal,
          timestamp: Date.now(),
          source: 'js-error-handler'
        }
      });
    } else if (isFatal) {
      // Handle other fatal errors
      console.error('Fatal error caught by JSErrorBridge:', error);

      this.notifyListeners({
        type: 'startupProcedureError',
        details: {
          message: error.message,
          stack: error.stack,
          isFatal: true,
          timestamp: Date.now(),
          source: 'js-error-handler'
        }
      });
    }
  };
}

/**
 * Factory function to create the appropriate error bridge implementation
 * Creates a composite bridge that uses both native and JS implementations
 */
function createErrorBridge() {
  try {
    const nativeBridge = new NativeErrorBridge();
    const jsBridge = new JSErrorBridge();

    return {
      // Allow listening to both native and JS errors
      addListener: (listener: ErrorListener) => {
        const removeNative = nativeBridge.addListener(listener);
        const removeJS = jsBridge.addListener(listener);
        return () => {
          removeNative();
          removeJS();
        };
      },

      // Enable simulating errors for testing
      simulateNativeError: (type: NativeErrorEvent['type'], details: ErrorDetail = {}) => {
        nativeBridge.simulateNativeError(type, details);
      },

      // Provide direct access to cache clearing
      clearProblemCache: async () => {
        await nativeBridge.clearProblemCache();
      }
    };
  } catch (error) {
    console.error('Failed to initialize error bridges:', error);
    // Fallback to just JS bridge in case of initialization error
    return new JSErrorBridge();
  }
}

// Create and export singleton instance
export const errorBridge = createErrorBridge();
export default errorBridge;
