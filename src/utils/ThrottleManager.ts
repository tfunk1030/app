/**
 * ThrottleManager.ts
 *
 * A utility class for throttling frequent operations like sensor updates
 * to improve performance and battery life.
 */

import { AppState, AppStateStatus } from 'react-native';
import { LogManager } from './LogManager';

const logger = LogManager.getLogger('ThrottleManager');

export interface ThrottleOptions {
  /** Minimum time between updates in milliseconds */
  interval: number;
  /** Whether to use a more aggressive throttling when app is in background */
  backgroundMode?: boolean;
  /** Interval to use when app is in background (if backgroundMode is true) */
  backgroundInterval?: number;
  /** Whether to immediately process the first call */
  leading?: boolean;
  /** Whether to process the last call after the cooldown period */
  trailing?: boolean;
}

export class ThrottleManager<T, Args extends unknown[] = unknown[]> {
  private lastCallTime: number = 0;
  private lastArgs: Args | null = null;
  private lastResult: T | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private isAppActive: boolean = true;
  private appStateSubscription: { remove: () => void } | null = null;

  constructor(
    private readonly func: (...args: Args) => T,
    private readonly options: ThrottleOptions
  ) {
    // Set default options
    this.options = {
      leading: true,
      trailing: true,
      backgroundMode: true,
      backgroundInterval: options.interval * 5, // 5x slower in background by default
      ...options,
    };

    // Monitor app state if background mode is enabled
    if (this.options.backgroundMode) {
      this.setupAppStateListener();
    }

    logger.info('ThrottleManager initialized', {
      interval: this.options.interval,
      backgroundMode: this.options.backgroundMode,
      backgroundInterval: this.options.backgroundInterval,
    });
  }

  /**
   * Execute the throttled function
   */
  public execute(...args: Args): T | null {
    const now = Date.now();
    const currentInterval = this.getCurrentInterval();

    // Store the latest arguments
    this.lastArgs = args;

    // If enough time has passed since the last call, or this is the first call with leading=true
    if (
      now - this.lastCallTime >= currentInterval ||
      (this.options.leading && this.lastCallTime === 0)
    ) {
      logger.debug('Executing throttled function immediately', {
        timeSinceLastCall: now - this.lastCallTime,
        interval: currentInterval,
      });

      this.lastCallTime = now;
      this.lastResult = this.func(...args);
      this.lastArgs = null;

      return this.lastResult;
    }

    // If trailing execution is enabled and we don't have a timeout scheduled
    if (this.options.trailing && !this.timeoutId) {
      // Calculate time remaining until next allowed execution
      const timeRemaining = currentInterval - (now - this.lastCallTime);

      logger.debug('Scheduling trailing execution', {
        timeRemaining,
        interval: currentInterval,
      });

      // Schedule the execution
      this.timeoutId = setTimeout(() => {
        if (this.lastArgs) {
          const currentArgs = this.lastArgs;
          this.lastCallTime = Date.now();
          this.lastResult = this.func(...currentArgs);
          this.lastArgs = null;
          this.timeoutId = null;

          logger.debug('Executed trailing call');
        }
      }, timeRemaining);
    }

    return this.lastResult;
  }

  /**
   * Get the current interval based on app state
   */
  private getCurrentInterval(): number {
    if (this.options.backgroundMode && !this.isAppActive) {
      return this.options.backgroundInterval!;
    }
    return this.options.interval;
  }

  /**
   * Set up app state change listener
   */
  private setupAppStateListener(): void {
    // Handle app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      this.isAppActive = nextAppState === 'active';
      logger.info('App state changed', {
        active: this.isAppActive,
        currentInterval: this.getCurrentInterval(),
      });
    };

    // Subscribe to app state changes
    this.appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    logger.info('ThrottleManager disposed');
  }

  /**
   * Get the current throttle status
   */
  public getStatus() {
    return {
      isAppActive: this.isAppActive,
      currentInterval: this.getCurrentInterval(),
      timeSinceLastCall: Date.now() - this.lastCallTime,
      hasPendingCall: this.timeoutId !== null,
      hasLastArgs: this.lastArgs !== null,
    };
  }

  /**
   * Reset the throttle state to allow immediate execution
   */
  public reset(): void {
    this.lastCallTime = 0;
    this.lastResult = null;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.lastArgs = null;

    logger.info('ThrottleManager reset');
  }
}
