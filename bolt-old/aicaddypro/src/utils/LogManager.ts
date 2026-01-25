/**
 * LogManager.ts
 * Enhanced diagnostic logging utility that provides environment-specific logging behavior
 * with persistent storage for production troubleshooting.
 *
 * Part of the Enhanced Diagnostics Pattern implementation for troubleshooting
 * environment-specific issues between development and production builds.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { FeatureFlags } from './FeatureFlags';

// Log levels with color codes for console output
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Log entry structure for consistent formatting
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
  environment: 'development' | 'production';
  sessionId: string;
}

// Storage keys for persistent logs
const STORAGE_KEYS = {
  LOGS: 'diagnostic_logs',
  SESSION_ID: 'diagnostic_session_id',
  LAST_EXPORT: 'diagnostic_last_export',
};

// Generate a unique session ID for grouping logs
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Current session ID
let currentSessionId = '';

// Store logs in memory for retrieval
const logs: LogEntry[] = [];
const MAX_LOGS_IN_MEMORY = 1000;
const MAX_LOGS_IN_STORAGE = 5000;

// Determine if running in production
const isProduction = !__DEV__;

/**
 * Initialize the LogManager
 * This should be called early in the app lifecycle
 */
async function initializeLogManager(): Promise<void> {
  try {
    // Get or create session ID
    let sessionId = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_ID);
    if (!sessionId) {
      sessionId = generateSessionId();
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
    }
    currentSessionId = sessionId;

    // Load recent logs from storage if in diagnostic mode
    if (FeatureFlags.ENHANCED_LOGGING || FeatureFlags.ALLOW_DEBUG_OVERLAY) {
      await loadLogsFromStorage();
    }

    // Log initialization
    const logger = new Logger('LogManager');
    logger.info('LogManager initialized', {
      sessionId: currentSessionId,
      environment: isProduction ? 'production' : 'development',
      enhancedLogging: FeatureFlags.ENHANCED_LOGGING,
      debugOverlay: FeatureFlags.ALLOW_DEBUG_OVERLAY,
    });
  } catch (error) {
    console.error('Failed to initialize LogManager:', error);
  }
}

/**
 * Load logs from AsyncStorage
 */
async function loadLogsFromStorage(): Promise<void> {
  try {
    const storedLogs = await AsyncStorage.getItem(STORAGE_KEYS.LOGS);
    if (storedLogs) {
      const parsedLogs = JSON.parse(storedLogs) as LogEntry[];

      // Only load the most recent logs to avoid memory issues
      const recentLogs = parsedLogs.slice(-MAX_LOGS_IN_MEMORY);
      logs.push(...recentLogs);

      console.info(`Loaded ${recentLogs.length} logs from storage`);
    }
  } catch (error) {
    console.error('Failed to load logs from storage:', error);
  }
}

/**
 * Save logs to AsyncStorage
 * This is throttled to avoid excessive writes
 */
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
async function saveLogsToStorage(): Promise<void> {
  // Debounce storage operations
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(async () => {
    try {
      // Only save logs if enhanced logging is enabled
      if (FeatureFlags.ENHANCED_LOGGING) {
        // Get existing logs
        const storedLogs = await AsyncStorage.getItem(STORAGE_KEYS.LOGS);
        let allLogs: LogEntry[] = [];

        if (storedLogs) {
          allLogs = JSON.parse(storedLogs) as LogEntry[];
        }

        // Add new logs
        allLogs.push(...logs);

        // Keep only the most recent logs
        if (allLogs.length > MAX_LOGS_IN_STORAGE) {
          allLogs = allLogs.slice(-MAX_LOGS_IN_STORAGE);
        }

        // Save to storage
        await AsyncStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(allLogs));
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_EXPORT, new Date().toISOString());
      }
    } catch (error) {
      console.error('Failed to save logs to storage:', error);
    }
  }, 5000); // Save every 5 seconds at most
}

/**
 * Logger class for component-specific logging
 */
class Logger {
  private component: string;

  constructor(component: string) {
    this.component = component;
  }

  /**
   * Log a debug message (development only unless forceProd is true)
   */
  debug(message: string, data?: any, forceProd: boolean = false): void {
    if (!isProduction || forceProd || FeatureFlags.ENHANCED_LOGGING) {
      this._addEntry('debug', message, data);
      console.debug(`[${this.component}] ${message}`, data || '');
    }
  }

  /**
   * Log an info message
   */
  info(message: string, data?: any): void {
    this._addEntry('info', message, data);
    console.info(`[${this.component}] ${message}`, data || '');
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: any): void {
    this._addEntry('warn', message, data);
    console.warn(`[${this.component}] ${message}`, data || '');
  }

  /**
   * Log an error message
   */
  error(message: string, data?: any): void {
    this._addEntry('error', message, data);
    console.error(`[${this.component}] ${message}`, data || '');

    // In production, we might want to send critical errors to a monitoring service
    if (isProduction) {
      this._sendToMonitoring('error', message, data);
    }
  }

  /**
   * Log a lifecycle event such as component mount/unmount
   */
  lifecycle(action: string, data?: any): void {
    this._addEntry('info', `Lifecycle: ${action}`, data);

    // Always log lifecycle events in production if enhanced logging is enabled
    if (!isProduction || FeatureFlags.ENHANCED_LOGGING) {
      console.info(`[${this.component}] Lifecycle: ${action}`, data || '');
    }
  }

  /**
   * Log a state transition with detailed before/after state
   */
  stateTransition(from: any, to: any, cause?: string): void {
    const message = cause ? `State transition (${cause})` : 'State transition';

    const data = {
      from,
      to,
      timestamp: Date.now(),
      timeSinceStart: Date.now() - new Date(currentSessionId.split('_')[1]).getTime(),
    };

    this._addEntry('info', message, data);

    // Log state transitions in production if enhanced logging is enabled
    if (!isProduction || FeatureFlags.ENHANCED_LOGGING) {
      console.info(`[${this.component}] ${message}`, data);
    }
  }

  /**
   * Log permission status changes
   */
  permissionChange(type: string, from: string, to: string): void {
    const message = `Permission change: ${type}`;
    const data = {
      from,
      to,
      timestamp: Date.now(),
      timeSinceStart: Date.now() - new Date(currentSessionId.split('_')[1]).getTime(),
    };

    this._addEntry('info', message, data);

    // Always log permission changes in both dev and prod
    console.info(`[${this.component}] ${message}`, data);
  }

  /**
   * Log initialization events with timing information
   */
  initialization(stage: string, data?: any): void {
    const message = `Initialization: ${stage}`;
    const enhancedData = {
      ...data,
      timestamp: Date.now(),
      timeSinceStart: Date.now() - new Date(currentSessionId.split('_')[1]).getTime(),
    };

    this._addEntry('info', message, enhancedData);

    // Always log initialization in both environments
    console.info(`[${this.component}] ${message}`, enhancedData);
  }

  /**
   * Log sensor availability and status
   */
  sensorStatus(sensor: string, available: boolean, data?: any): void {
    const message = `Sensor ${sensor}: ${available ? 'Available' : 'Unavailable'}`;
    const enhancedData = {
      ...data,
      sensor,
      available,
      timestamp: Date.now(),
    };

    this._addEntry('info', message, enhancedData);

    // Always log sensor status in both environments
    console.info(`[${this.component}] ${message}`, enhancedData);
  }

  /**
   * Log performance metrics
   */
  performance(operation: string, durationMs: number, data?: any): void {
    const message = `Performance: ${operation} took ${durationMs}ms`;
    const enhancedData = {
      ...data,
      operation,
      durationMs,
      timestamp: Date.now(),
    };

    this._addEntry('info', message, enhancedData);

    // Log performance in production if enhanced logging is enabled
    if (!isProduction || FeatureFlags.ENHANCED_LOGGING) {
      console.info(`[${this.component}] ${message}`, enhancedData);
    }
  }

  private _addEntry(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component: this.component,
      message,
      data,
      environment: isProduction ? 'production' : 'development',
      sessionId: currentSessionId,
    };

    logs.push(entry);

    // Trim in-memory logs if needed
    if (logs.length > MAX_LOGS_IN_MEMORY) {
      logs.shift(); // Remove oldest entry if we exceed max
    }

    // Save to persistent storage if in production or if enhanced logging is enabled
    if (isProduction || FeatureFlags.ENHANCED_LOGGING) {
      saveLogsToStorage();
    }
  }

  private _sendToMonitoring(level: LogLevel, message: string, data?: any): void {
    // In a real app, this would send data to a monitoring service
    // For now, we'll just store it in logs but in the future it could
    // use expo-server-sdk or another service to report errors
  }
}

/**
 * Static LogManager class to get loggers for components
 */
export class LogManager {
  /**
   * Initialize the LogManager
   * This should be called early in the app lifecycle
   */
  static async initialize(): Promise<void> {
    await initializeLogManager();
  }

  /**
   * Get a logger for a specific component
   */
  static getLogger(component: string): Logger {
    return new Logger(component);
  }

  /**
   * Get all logs stored in memory
   */
  static getLogs(): LogEntry[] {
    return [...logs];
  }

  /**
   * Get logs filtered by component
   */
  static getLogsByComponent(component: string): LogEntry[] {
    return logs.filter(entry => entry.component === component);
  }

  /**
   * Get logs filtered by level
   */
  static getLogsByLevel(level: LogLevel): LogEntry[] {
    return logs.filter(entry => entry.level === level);
  }

  /**
   * Get logs filtered by session ID
   */
  static getLogsBySession(sessionId: string): LogEntry[] {
    return logs.filter(entry => entry.sessionId === sessionId);
  }

  /**
   * Get logs from persistent storage
   */
  static async getStoredLogs(): Promise<LogEntry[]> {
    try {
      const storedLogs = await AsyncStorage.getItem(STORAGE_KEYS.LOGS);
      if (storedLogs) {
        return JSON.parse(storedLogs) as LogEntry[];
      }
    } catch (error) {
      console.error('Failed to get logs from storage:', error);
    }
    return [];
  }

  /**
   * Clear all stored logs
   */
  static clearLogs(): void {
    logs.length = 0;
  }

  /**
   * Clear persistent logs
   */
  static async clearStoredLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.LOGS);
      console.info('Cleared stored logs');
    } catch (error) {
      console.error('Failed to clear stored logs:', error);
    }
  }

  /**
   * Export logs as a string (for debugging or reporting)
   */
  static exportLogs(): string {
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Export all logs including those in storage
   */
  static async exportAllLogs(): Promise<string> {
    try {
      const storedLogs = await LogManager.getStoredLogs();
      const allLogs = [...storedLogs, ...logs];

      // Remove duplicates by timestamp and component
      const uniqueLogs = allLogs.filter(
        (log, index, self) =>
          index ===
          self.findIndex(
            l =>
              l.timestamp === log.timestamp &&
              l.component === log.component &&
              l.message === log.message
          )
      );

      // Sort by timestamp
      uniqueLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      return JSON.stringify(uniqueLogs, null, 2);
    } catch (error) {
      console.error('Failed to export all logs:', error);
      return JSON.stringify(logs, null, 2);
    }
  }

  /**
   * Get the current session ID
   */
  static getCurrentSessionId(): string {
    return currentSessionId;
  }
}

// Initialize LogManager when imported
// This is a no-op if already initialized
LogManager.initialize().catch(console.error);
