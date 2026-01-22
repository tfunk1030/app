/**
 * ErrorHandler.ts
 *
 * A centralized error handling utility that provides standardized error types,
 * error reporting, and recovery strategies.
 */

import { LogManager } from './LogManager';

// Create a logger for the error handler
const logger = LogManager.getLogger('ErrorHandler');

/**
 * Standard error types for the application
 */
export enum ErrorType {
  // Input validation errors
  VALIDATION_ERROR = 'validation_error',

  // Network and API errors
  NETWORK_ERROR = 'network_error',
  API_ERROR = 'api_error',
  TIMEOUT_ERROR = 'timeout_error',

  // Data errors
  DATA_NOT_FOUND = 'data_not_found',
  DATA_INVALID = 'data_invalid',

  // Calculation errors
  CALCULATION_ERROR = 'calculation_error',
  CONVERGENCE_ERROR = 'convergence_error',

  // Permission errors
  PERMISSION_DENIED = 'permission_denied',

  // Sensor errors
  SENSOR_UNAVAILABLE = 'sensor_unavailable',
  SENSOR_ERROR = 'sensor_error',

  // Resource errors
  RESOURCE_EXHAUSTED = 'resource_exhausted',

  // Unknown errors
  UNKNOWN_ERROR = 'unknown_error'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',       // Informational, non-critical
  WARNING = 'warning', // Warning, may affect functionality
  ERROR = 'error',     // Error, affects functionality
  CRITICAL = 'critical' // Critical, prevents core functionality
}

/**
 * Recovery strategy types
 */
export enum RecoveryStrategy {
  RETRY = 'retry',           // Retry the operation
  FALLBACK = 'fallback',     // Use fallback data or functionality
  RESET = 'reset',           // Reset to initial state
  NOTIFY = 'notify',         // Notify the user
  IGNORE = 'ignore',         // Ignore the error and continue
  TERMINATE = 'terminate'    // Terminate the operation
}

/**
 * Standard application error with enhanced properties
 */
export class AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  recoveryStrategies: RecoveryStrategy[];
  details?: any;
  timestamp: number;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN_ERROR,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    recoveryStrategies: RecoveryStrategy[] = [RecoveryStrategy.NOTIFY],
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.recoveryStrategies = recoveryStrategies;
    this.details = details;
    this.timestamp = Date.now();
  }

  /**
   * Get a user-friendly error message
   */
  getUserMessage(): string {
    switch (this.type) {
      case ErrorType.VALIDATION_ERROR:
        return `Invalid input: ${this.message}`;
      case ErrorType.NETWORK_ERROR:
        return 'Network connection issue. Please check your connection and try again.';
      case ErrorType.API_ERROR:
        return 'Service communication error. Please try again later.';
      case ErrorType.TIMEOUT_ERROR:
        return 'Request timed out. Please try again.';
      case ErrorType.DATA_NOT_FOUND:
        return `Data not found: ${this.message}`;
      case ErrorType.DATA_INVALID:
        return `Invalid data: ${this.message}`;
      case ErrorType.CALCULATION_ERROR:
        return `Calculation error: ${this.message}`;
      case ErrorType.CONVERGENCE_ERROR:
        return 'Calculation did not converge to a solution.';
      case ErrorType.PERMISSION_DENIED:
        return `Permission required: ${this.message}`;
      case ErrorType.SENSOR_UNAVAILABLE:
        return `Sensor unavailable: ${this.message}`;
      case ErrorType.SENSOR_ERROR:
        return `Sensor error: ${this.message}`;
      case ErrorType.RESOURCE_EXHAUSTED:
        return 'Resource limit reached. Please try again later.';
      default:
        return this.message || 'An unexpected error occurred.';
    }
  }

  /**
   * Get the primary recovery strategy
   */
  getPrimaryRecoveryStrategy(): RecoveryStrategy {
    return this.recoveryStrategies[0] || RecoveryStrategy.NOTIFY;
  }

  /**
   * Log the error with appropriate level
   */
  log(): void {
    const logData = {
      type: this.type,
      severity: this.severity,
      recoveryStrategies: this.recoveryStrategies,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };

    switch (this.severity) {
      case ErrorSeverity.INFO:
        logger.info(this.message, logData);
        break;
      case ErrorSeverity.WARNING:
        logger.warn(this.message, logData);
        break;
      case ErrorSeverity.ERROR:
        logger.error(this.message, logData);
        break;
      case ErrorSeverity.CRITICAL:
        logger.error(`CRITICAL: ${this.message}`, logData);
        break;
    }
  }
}

/**
 * Error factory methods for common error types
 */
export const ErrorFactory = {
  /**
   * Create a validation error
   */
  validation(message: string, details?: any): AppError {
    return new AppError(
      message,
      ErrorType.VALIDATION_ERROR,
      ErrorSeverity.WARNING,
      [RecoveryStrategy.NOTIFY],
      details
    );
  },

  /**
   * Create a network error
   */
  network(message: string, details?: any): AppError {
    return new AppError(
      message,
      ErrorType.NETWORK_ERROR,
      ErrorSeverity.ERROR,
      [RecoveryStrategy.RETRY, RecoveryStrategy.NOTIFY],
      details
    );
  },

  /**
   * Create a calculation error
   */
  calculation(message: string, details?: any): AppError {
    return new AppError(
      message,
      ErrorType.CALCULATION_ERROR,
      ErrorSeverity.ERROR,
      [RecoveryStrategy.FALLBACK, RecoveryStrategy.NOTIFY],
      details
    );
  },

  /**
   * Create a permission error
   */
  permission(message: string, details?: any): AppError {
    return new AppError(
      message,
      ErrorType.PERMISSION_DENIED,
      ErrorSeverity.ERROR,
      [RecoveryStrategy.NOTIFY],
      details
    );
  },

  /**
   * Create a sensor error
   */
  sensor(message: string, details?: any): AppError {
    return new AppError(
      message,
      ErrorType.SENSOR_ERROR,
      ErrorSeverity.WARNING,
      [RecoveryStrategy.FALLBACK, RecoveryStrategy.NOTIFY],
      details
    );
  },

  /**
   * Create a data not found error
   */
  dataNotFound(message: string, details?: any): AppError {
    return new AppError(
      message,
      ErrorType.DATA_NOT_FOUND,
      ErrorSeverity.WARNING,
      [RecoveryStrategy.FALLBACK, RecoveryStrategy.NOTIFY],
      details
    );
  }
};

/**
 * Error handler utility functions
 */
export const ErrorHandler = {
  /**
   * Handle an error with appropriate logging and recovery
   */
  handle(error: Error | AppError, context?: string): AppError {
    // Convert to AppError if it's not already
    const appError = error instanceof AppError
      ? error
      : new AppError(
          error.message || 'Unknown error',
          ErrorType.UNKNOWN_ERROR,
          ErrorSeverity.ERROR,
          [RecoveryStrategy.NOTIFY],
          { originalError: error }
        );

    // Add context if provided
    if (context) {
      appError.details = { ...appError.details, context };
    }

    // Log the error
    appError.log();

    return appError;
  },

  /**
   * Create and handle an error in one step
   */
  createAndHandle(
    message: string,
    type: ErrorType,
    severity: ErrorSeverity,
    recoveryStrategies: RecoveryStrategy[],
    details?: any,
    context?: string
  ): AppError {
    const error = new AppError(message, type, severity, recoveryStrategies, details);
    return ErrorHandler.handle(error, context);
  },

  /**
   * Try to execute a function and handle any errors
   */
  async tryAsync<T>(
    fn: () => Promise<T>,
    context?: string,
    fallbackValue?: T
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const appError = ErrorHandler.handle(error as Error, context);

      // If fallback is provided and fallback strategy is available, return fallback
      if (fallbackValue !== undefined &&
          appError.recoveryStrategies.includes(RecoveryStrategy.FALLBACK)) {
        return fallbackValue;
      }

      // Otherwise rethrow
      throw appError;
    }
  },

  /**
   * Try to execute a function and handle any errors (synchronous version)
   */
  try<T>(
    fn: () => T,
    context?: string,
    fallbackValue?: T
  ): T {
    try {
      return fn();
    } catch (error) {
      const appError = ErrorHandler.handle(error as Error, context);

      // If fallback is provided and fallback strategy is available, return fallback
      if (fallbackValue !== undefined &&
          appError.recoveryStrategies.includes(RecoveryStrategy.FALLBACK)) {
        return fallbackValue;
      }

      // Otherwise rethrow
      throw appError;
    }
  }
};
