/**
 * SensorManager.ts
 *
 * A utility for managing sensor data collection with active and background modes
 * to optimize performance and battery usage.
 */

import { AppState, AppStateStatus } from 'react-native';
import { LogManager } from './LogManager';
import { ThrottleManager } from './ThrottleManager';

const logger = LogManager.getLogger('SensorManager');

// Sensor update modes
export enum SensorMode {
  ACTIVE = 'active',       // High frequency updates when app is in foreground
  BACKGROUND = 'background', // Low frequency updates when app is in background
  PAUSED = 'paused',       // No updates, sensors are paused
  HIGH_ACCURACY = 'high_accuracy', // Maximum accuracy, higher battery usage
  LOW_POWER = 'low_power'  // Battery saving mode, lower accuracy
}

// Sensor types
export enum SensorType {
  LOCATION = 'location',
  COMPASS = 'compass',
  ACCELEROMETER = 'accelerometer',
  GYROSCOPE = 'gyroscope',
  BAROMETER = 'barometer',
  MAGNETOMETER = 'magnetometer'
}

// Configuration for each sensor type
interface SensorConfig {
  // Update intervals in milliseconds
  updateIntervals: Record<SensorMode, number>;
  // Whether to enable the sensor in each mode
  enabledInMode: Record<SensorMode, boolean>;
  // Accuracy level for sensors that support it (e.g., location)
  accuracy?: Record<SensorMode, number>;
}

// Default configuration for each sensor type
const DEFAULT_SENSOR_CONFIG: Record<SensorType, SensorConfig> = {
  [SensorType.LOCATION]: {
    updateIntervals: {
      [SensorMode.ACTIVE]: 10000,        // 10 seconds
      [SensorMode.BACKGROUND]: 60000,    // 1 minute
      [SensorMode.HIGH_ACCURACY]: 5000,  // 5 seconds
      [SensorMode.LOW_POWER]: 120000,    // 2 minutes
      [SensorMode.PAUSED]: 0             // No updates
    },
    enabledInMode: {
      [SensorMode.ACTIVE]: true,
      [SensorMode.BACKGROUND]: true,
      [SensorMode.PAUSED]: false,
      [SensorMode.HIGH_ACCURACY]: true,
      [SensorMode.LOW_POWER]: true
    },
    accuracy: {
      [SensorMode.ACTIVE]: 4,            // Balanced accuracy
      [SensorMode.BACKGROUND]: 2,        // Low accuracy
      [SensorMode.HIGH_ACCURACY]: 6,     // High accuracy
      [SensorMode.LOW_POWER]: 1,         // Lowest accuracy
      [SensorMode.PAUSED]: 0             // Not applicable
    }
  },
  [SensorType.COMPASS]: {
    updateIntervals: {
      [SensorMode.ACTIVE]: 500,          // 0.5 seconds
      [SensorMode.BACKGROUND]: 5000,     // 5 seconds
      [SensorMode.HIGH_ACCURACY]: 100,   // 0.1 seconds
      [SensorMode.LOW_POWER]: 10000,     // 10 seconds
      [SensorMode.PAUSED]: 0             // No updates
    },
    enabledInMode: {
      [SensorMode.ACTIVE]: true,
      [SensorMode.BACKGROUND]: true,
      [SensorMode.PAUSED]: false,
      [SensorMode.HIGH_ACCURACY]: true,
      [SensorMode.LOW_POWER]: true
    }
  },
  [SensorType.ACCELEROMETER]: {
    updateIntervals: {
      [SensorMode.ACTIVE]: 100,          // 0.1 seconds
      [SensorMode.BACKGROUND]: 1000,     // 1 second
      [SensorMode.HIGH_ACCURACY]: 50,    // 0.05 seconds
      [SensorMode.LOW_POWER]: 2000,      // 2 seconds
      [SensorMode.PAUSED]: 0             // No updates
    },
    enabledInMode: {
      [SensorMode.ACTIVE]: true,
      [SensorMode.BACKGROUND]: false,    // Disable in background
      [SensorMode.PAUSED]: false,
      [SensorMode.HIGH_ACCURACY]: true,
      [SensorMode.LOW_POWER]: true
    }
  },
  [SensorType.GYROSCOPE]: {
    updateIntervals: {
      [SensorMode.ACTIVE]: 100,          // 0.1 seconds
      [SensorMode.BACKGROUND]: 1000,     // 1 second
      [SensorMode.HIGH_ACCURACY]: 50,    // 0.05 seconds
      [SensorMode.LOW_POWER]: 2000,      // 2 seconds
      [SensorMode.PAUSED]: 0             // No updates
    },
    enabledInMode: {
      [SensorMode.ACTIVE]: true,
      [SensorMode.BACKGROUND]: false,    // Disable in background
      [SensorMode.PAUSED]: false,
      [SensorMode.HIGH_ACCURACY]: true,
      [SensorMode.LOW_POWER]: false      // Disable in low power mode
    }
  },
  [SensorType.BAROMETER]: {
    updateIntervals: {
      [SensorMode.ACTIVE]: 1000,         // 1 second
      [SensorMode.BACKGROUND]: 10000,    // 10 seconds
      [SensorMode.HIGH_ACCURACY]: 500,   // 0.5 seconds
      [SensorMode.LOW_POWER]: 30000,     // 30 seconds
      [SensorMode.PAUSED]: 0             // No updates
    },
    enabledInMode: {
      [SensorMode.ACTIVE]: true,
      [SensorMode.BACKGROUND]: true,
      [SensorMode.PAUSED]: false,
      [SensorMode.HIGH_ACCURACY]: true,
      [SensorMode.LOW_POWER]: true
    }
  },
  [SensorType.MAGNETOMETER]: {
    updateIntervals: {
      [SensorMode.ACTIVE]: 500,          // 0.5 seconds
      [SensorMode.BACKGROUND]: 5000,     // 5 seconds
      [SensorMode.HIGH_ACCURACY]: 100,   // 0.1 seconds
      [SensorMode.LOW_POWER]: 10000,     // 10 seconds
      [SensorMode.PAUSED]: 0             // No updates
    },
    enabledInMode: {
      [SensorMode.ACTIVE]: true,
      [SensorMode.BACKGROUND]: false,    // Disable in background
      [SensorMode.PAUSED]: false,
      [SensorMode.HIGH_ACCURACY]: true,
      [SensorMode.LOW_POWER]: false      // Disable in low power mode
    }
  }
};

// Sensor data handler type
export type SensorDataHandler<T> = (data: T) => void;

// Sensor subscription type
export interface SensorSubscription {
  remove: () => void;
}

/**
 * SensorManager class for managing sensor data collection
 */
export class SensorManager {
  private static instance: SensorManager;
  private currentMode: SensorMode = SensorMode.ACTIVE;
  private sensorConfigs: Record<SensorType, SensorConfig>;
  private sensorSubscriptions: Map<SensorType, SensorSubscription[]> = new Map();
  private dataHandlers: Map<SensorType, Set<SensorDataHandler<unknown>>> = new Map();
  private throttlers: Map<SensorType, ThrottleManager<unknown>> = new Map();
  private appStateSubscription: { remove: () => void } | null = null;
  private isInitialized: boolean = false;

  private constructor() {
    this.sensorConfigs = { ...DEFAULT_SENSOR_CONFIG };
    this.setupAppStateListener();
  }

  /**
   * Get the singleton instance of SensorManager
   */
  public static getInstance(): SensorManager {
    if (!SensorManager.instance) {
      SensorManager.instance = new SensorManager();
    }
    return SensorManager.instance;
  }

  /**
   * Initialize the sensor manager
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    logger.info('Initializing SensorManager');

    // Create throttlers for each sensor type
    Object.values(SensorType).forEach(sensorType => {
      const config = this.sensorConfigs[sensorType];
      const interval = config.updateIntervals[this.currentMode];

      this.throttlers.set(sensorType, new ThrottleManager(
        (data: unknown) => this.processSensorData(sensorType, data),
        {
          interval,
          backgroundMode: true,
          backgroundInterval: config.updateIntervals[SensorMode.BACKGROUND],
          leading: true,
          trailing: false
        }
      ));

      this.dataHandlers.set(sensorType, new Set());
      this.sensorSubscriptions.set(sensorType, []);
    });

    this.isInitialized = true;
    logger.info('SensorManager initialized');
  }

  /**
   * Set the current sensor mode
   */
  public setMode(mode: SensorMode): void {
    if (this.currentMode === mode) {
      return;
    }

    logger.info(`Changing sensor mode from ${this.currentMode} to ${mode}`);
    this.currentMode = mode;

    // Update all throttlers with new intervals
    this.throttlers.forEach((throttler, sensorType) => {
      const config = this.sensorConfigs[sensorType];
      const interval = config.updateIntervals[mode];

      // Create a new throttler with updated interval
      this.throttlers.set(sensorType, new ThrottleManager(
        (data: unknown) => this.processSensorData(sensorType, data),
        {
          interval,
          backgroundMode: true,
          backgroundInterval: config.updateIntervals[SensorMode.BACKGROUND],
          leading: true,
          trailing: false
        }
      ));
    });

    // Enable or disable sensors based on mode
    Object.values(SensorType).forEach(sensorType => {
      const config = this.sensorConfigs[sensorType];
      const shouldBeEnabled = config.enabledInMode[mode];

      if (shouldBeEnabled) {
        this.enableSensor(sensorType);
      } else {
        this.disableSensor(sensorType);
      }
    });
  }

  /**
   * Subscribe to sensor data updates
   */
  public subscribe<T>(sensorType: SensorType, handler: SensorDataHandler<T>): () => void {
    if (!this.isInitialized) {
      this.initialize();
    }

    const handlers = this.dataHandlers.get(sensorType);
    if (!handlers) {
      logger.error(`Cannot subscribe to unknown sensor type: ${sensorType}`);
      return () => {};
    }

    // Cast is safe: handlers are called with sensor-specific data at runtime
    handlers.add(handler as SensorDataHandler<unknown>);

    // Enable the sensor if it's the first subscriber
    if (handlers.size === 1) {
      this.enableSensor(sensorType);
    }

    logger.debug(`Subscribed to ${sensorType} sensor, total subscribers: ${handlers.size}`);

    // Return unsubscribe function
    return () => {
      handlers.delete(handler as SensorDataHandler<unknown>);
      logger.debug(`Unsubscribed from ${sensorType} sensor, remaining subscribers: ${handlers.size}`);

      // Disable the sensor if there are no more subscribers
      if (handlers.size === 0) {
        this.disableSensor(sensorType);
      }
    };
  }

  /**
   * Update configuration for a specific sensor
   */
  public configureSensor(sensorType: SensorType, config: Partial<SensorConfig>): void {
    this.sensorConfigs[sensorType] = {
      ...this.sensorConfigs[sensorType],
      ...config
    };

    // Update throttler if it exists
    const throttler = this.throttlers.get(sensorType);
    if (throttler) {
      const interval = this.sensorConfigs[sensorType].updateIntervals[this.currentMode];

      this.throttlers.set(sensorType, new ThrottleManager(
        (data: unknown) => this.processSensorData(sensorType, data),
        {
          interval,
          backgroundMode: true,
          backgroundInterval: this.sensorConfigs[sensorType].updateIntervals[SensorMode.BACKGROUND],
          leading: true,
          trailing: false
        }
      ));
    }

    logger.info(`Updated configuration for ${sensorType} sensor`);
  }

  /**
   * Get the current configuration for a specific sensor
   */
  public getSensorConfig(sensorType: SensorType): SensorConfig {
    return { ...this.sensorConfigs[sensorType] };
  }

  /**
   * Get the current mode
   */
  public getCurrentMode(): SensorMode {
    return this.currentMode;
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    logger.info('Disposing SensorManager');

    // Remove all subscriptions
    this.sensorSubscriptions.forEach((subscriptions, sensorType) => {
      subscriptions.forEach(subscription => subscription.remove());
      this.sensorSubscriptions.set(sensorType, []);
    });

    // Dispose all throttlers
    this.throttlers.forEach(throttler => throttler.dispose());
    this.throttlers.clear();

    // Clear all handlers
    this.dataHandlers.forEach(handlers => handlers.clear());

    // Remove app state listener
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    this.isInitialized = false;
  }

  /**
   * Process sensor data through the appropriate throttler
   */
  private processSensorData(sensorType: SensorType, data: unknown): void {
    const handlers = this.dataHandlers.get(sensorType);
    if (!handlers || handlers.size === 0) {
      return;
    }

    // Notify all handlers
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        const errorInfo = error instanceof Error ? { message: error.message, name: error.name } : { error: String(error) };
        logger.error(`Error in ${sensorType} sensor data handler`, errorInfo);
      }
    });
  }

  /**
   * Enable a specific sensor
   */
  private enableSensor(sensorType: SensorType): void {
    // Implementation would connect to the actual sensor APIs
    // This is a placeholder for the actual implementation
    logger.info(`Enabling ${sensorType} sensor in ${this.currentMode} mode`);

    // In a real implementation, this would subscribe to the sensor
    // and add the subscription to the list
    // For example:
    // const subscription = SensorAPI.subscribe(sensorType, (data) => {
    //   const throttler = this.throttlers.get(sensorType);
    //   if (throttler) {
    //     throttler.execute(data);
    //   }
    // });
    //
    // const subscriptions = this.sensorSubscriptions.get(sensorType) || [];
    // subscriptions.push(subscription);
    // this.sensorSubscriptions.set(sensorType, subscriptions);
  }

  /**
   * Disable a specific sensor
   */
  private disableSensor(sensorType: SensorType): void {
    // Implementation would disconnect from the actual sensor APIs
    // This is a placeholder for the actual implementation
    logger.info(`Disabling ${sensorType} sensor`);

    // In a real implementation, this would unsubscribe from the sensor
    // For example:
    // const subscriptions = this.sensorSubscriptions.get(sensorType) || [];
    // subscriptions.forEach(subscription => subscription.remove());
    // this.sensorSubscriptions.set(sensorType, []);
  }

  /**
   * Set up app state listener to automatically switch modes
   */
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App is in foreground
        if (this.currentMode === SensorMode.BACKGROUND) {
          this.setMode(SensorMode.ACTIVE);
        }
      } else if (nextAppState === 'background') {
        // App is in background
        if (this.currentMode === SensorMode.ACTIVE) {
          this.setMode(SensorMode.BACKGROUND);
        }
      }
    });
  }
}

// Export singleton instance
export const sensorManager = SensorManager.getInstance();
