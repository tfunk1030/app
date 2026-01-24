/**
 * wind-error-handler.ts
 *
 * Specialized error handling utilities for wind calculations.
 * Extends the centralized error handling system with wind-specific error types and recovery strategies.
 */

import {
  AppError,
  ErrorDetails,
  ErrorFactory,
  ErrorHandler,
  ErrorType,
  ErrorSeverity,
  RecoveryStrategy
} from '@/src/utils/ErrorHandler';
import { LogManager } from '@/src/utils/LogManager';

// Create a logger for wind errors
const logger = LogManager.getLogger('WindErrorHandler');

/**
 * Wind-specific error types that extend the standard error types
 */
export enum WindErrorType {
  // Calculation errors
  INVALID_CLUB = 'wind_invalid_club',
  CALCULATION_FAILED = 'wind_calculation_failed',
  NO_RECOMMENDED_CLUB = 'wind_no_recommended_club',
  MAX_ITERATIONS_REACHED = 'wind_max_iterations_reached',
  CONVERGENCE_FAILED = 'wind_convergence_failed',

  // Input errors
  INVALID_WIND_SPEED = 'wind_invalid_wind_speed',
  INVALID_WIND_ANGLE = 'wind_invalid_wind_angle',
  INVALID_TARGET_YARDAGE = 'wind_invalid_target_yardage',
  INVALID_PARAMETERS = 'wind_invalid_parameters',

  // Sensor errors
  COMPASS_UNAVAILABLE = 'wind_compass_unavailable',
  COMPASS_INACCURATE = 'wind_compass_inaccurate',

  // Environmental errors
  ENVIRONMENTAL_DATA_MISSING = 'wind_environmental_data_missing'
}

/**
 * Map wind error types to standard error types for compatibility
 */
function mapToStandardErrorType(windErrorType: WindErrorType): ErrorType {
  switch (windErrorType) {
    case WindErrorType.INVALID_CLUB:
    case WindErrorType.INVALID_WIND_SPEED:
    case WindErrorType.INVALID_WIND_ANGLE:
    case WindErrorType.INVALID_TARGET_YARDAGE:
      return ErrorType.VALIDATION_ERROR;

    case WindErrorType.CALCULATION_FAILED:
    case WindErrorType.CONVERGENCE_FAILED:
    case WindErrorType.MAX_ITERATIONS_REACHED:
      return ErrorType.CALCULATION_ERROR;

    case WindErrorType.NO_RECOMMENDED_CLUB:
    case WindErrorType.ENVIRONMENTAL_DATA_MISSING:
      return ErrorType.DATA_NOT_FOUND;

    case WindErrorType.COMPASS_UNAVAILABLE:
    case WindErrorType.COMPASS_INACCURATE:
      return ErrorType.SENSOR_ERROR;

    default:
      return ErrorType.UNKNOWN_ERROR;
  }
}

/**
 * Wind-specific error class
 */
export class WindError extends AppError {
  windErrorType: WindErrorType;

  constructor(
    windErrorType: WindErrorType,
    message: string,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    recoveryStrategies: RecoveryStrategy[] = [RecoveryStrategy.NOTIFY],
    details?: ErrorDetails
  ) {
    // Map to standard error type for compatibility
    const standardErrorType = mapToStandardErrorType(windErrorType);

    super(message, standardErrorType, severity, recoveryStrategies, details);

    this.name = 'WindError';
    this.windErrorType = windErrorType;
  }

  /**
   * Get a user-friendly error message specific to wind calculations
   */
  override getUserMessage(): string {
    switch (this.windErrorType) {
      case WindErrorType.INVALID_CLUB:
        return `Invalid club selected: ${this.details?.clubName || 'Unknown'}`;

      case WindErrorType.CALCULATION_FAILED:
        return `Wind calculation failed: ${this.message}`;

      case WindErrorType.NO_RECOMMENDED_CLUB:
        return `No recommended club found for ${this.details?.distance || 'the calculated'} yards`;

      case WindErrorType.MAX_ITERATIONS_REACHED:
        return `Wind calculation did not converge after ${this.details?.iterations || 'maximum'} iterations`;

      case WindErrorType.CONVERGENCE_FAILED:
        return 'Wind calculation could not determine a stable solution';

      case WindErrorType.INVALID_WIND_SPEED:
        return `Invalid wind speed: ${this.details?.windSpeed || 'Unknown'}`;

      case WindErrorType.INVALID_WIND_ANGLE:
        return `Invalid wind angle: ${this.details?.windAngle || 'Unknown'}`;

      case WindErrorType.INVALID_TARGET_YARDAGE:
        return `Invalid target yardage: ${this.details?.targetYardage || 'Unknown'}`;

      case WindErrorType.INVALID_PARAMETERS:
        return `Invalid calculation parameters: ${this.message}`;

      case WindErrorType.COMPASS_UNAVAILABLE:
        return 'Compass sensor is not available on this device';

      case WindErrorType.COMPASS_INACCURATE:
        return 'Compass readings are currently inaccurate. Please calibrate your device.';

      case WindErrorType.ENVIRONMENTAL_DATA_MISSING:
        return 'Environmental data is not available. Please try again later.';

      default:
        return this.message || 'An unexpected error occurred during wind calculation.';
    }
  }
}

/**
 * Factory methods for creating wind-specific errors
 */
export const WindErrorFactory = {
  /**
   * Create an invalid club error
   */
  invalidClub(clubName: string, details?: ErrorDetails): WindError {
    return new WindError(
      WindErrorType.INVALID_CLUB,
      `Invalid club: ${clubName}`,
      ErrorSeverity.WARNING,
      [RecoveryStrategy.FALLBACK, RecoveryStrategy.NOTIFY],
      { clubName, ...(details ?? {}) }
    );
  },

  /**
   * Create a calculation failed error
   */
  calculationFailed(message: string, details?: ErrorDetails): WindError {
    return new WindError(
      WindErrorType.CALCULATION_FAILED,
      message,
      ErrorSeverity.ERROR,
      [RecoveryStrategy.FALLBACK, RecoveryStrategy.NOTIFY],
      details
    );
  },

  /**
   * Create a no recommended club error
   */
  noRecommendedClub(distance: number, details?: ErrorDetails): WindError {
    return new WindError(
      WindErrorType.NO_RECOMMENDED_CLUB,
      `No recommended club for ${distance} yards`,
      ErrorSeverity.WARNING,
      [RecoveryStrategy.FALLBACK, RecoveryStrategy.NOTIFY],
      { distance, ...(details ?? {}) }
    );
  },

  /**
   * Create a max iterations reached error
   */
  maxIterationsReached(iterations: number, details?: ErrorDetails): WindError {
    return new WindError(
      WindErrorType.MAX_ITERATIONS_REACHED,
      `Maximum iterations (${iterations}) reached without convergence`,
      ErrorSeverity.WARNING,
      [RecoveryStrategy.FALLBACK, RecoveryStrategy.NOTIFY],
      { iterations, ...(details ?? {}) }
    );
  },

  /**
   * Create an invalid parameters error
   */
  invalidParameters(message: string, details?: ErrorDetails): WindError {
    return new WindError(
      WindErrorType.INVALID_PARAMETERS,
      message,
      ErrorSeverity.WARNING,
      [RecoveryStrategy.NOTIFY],
      details
    );
  },

  /**
   * Create an invalid input error
   */
  invalidInput(message: string, inputType: 'windSpeed' | 'windAngle' | 'targetYardage', value: unknown): WindError {
    let errorType: WindErrorType;

    switch (inputType) {
      case 'windSpeed':
        errorType = WindErrorType.INVALID_WIND_SPEED;
        break;
      case 'windAngle':
        errorType = WindErrorType.INVALID_WIND_ANGLE;
        break;
      case 'targetYardage':
        errorType = WindErrorType.INVALID_TARGET_YARDAGE;
        break;
      default:
        errorType = WindErrorType.INVALID_TARGET_YARDAGE;
    }

    return new WindError(
      errorType,
      message,
      ErrorSeverity.WARNING,
      [RecoveryStrategy.NOTIFY],
      { [inputType]: value }
    );
  },

  /**
   * Create a compass error
   */
  compassError(isUnavailable: boolean, details?: ErrorDetails): WindError {
    const errorType = isUnavailable
      ? WindErrorType.COMPASS_UNAVAILABLE
      : WindErrorType.COMPASS_INACCURATE;

    const message = isUnavailable
      ? 'Compass sensor is not available'
      : 'Compass readings are inaccurate';

    return new WindError(
      errorType,
      message,
      ErrorSeverity.WARNING,
      [RecoveryStrategy.FALLBACK, RecoveryStrategy.NOTIFY],
      details
    );
  },

  /**
   * Create an environmental data missing error
   */
  environmentalDataMissing(details?: ErrorDetails): WindError {
    return new WindError(
      WindErrorType.ENVIRONMENTAL_DATA_MISSING,
      'Environmental data is not available',
      ErrorSeverity.WARNING,
      [RecoveryStrategy.FALLBACK, RecoveryStrategy.NOTIFY],
      details
    );
  }
};

/**
 * Wind-specific error handler functions
 */
export const WindErrorHandler = {
  /**
   * Handle a wind-specific error
   */
  handle(error: Error | WindError | AppError, context?: string): WindError | AppError {
    // If it's already a WindError, just log it
    if (error instanceof WindError) {
      error.log();
      return error;
    }

    // If it's an AppError but not a WindError, handle it with the standard handler
    if (error instanceof AppError) {
      return ErrorHandler.handle(error, context);
    }

    // For generic errors, convert to AppError and handle
    logger.error(`Wind calculation error: ${error.message}`, { error, context });

    // Create a generic wind calculation error
    return new WindError(
      WindErrorType.CALCULATION_FAILED,
      error.message || 'Unknown wind calculation error',
      ErrorSeverity.ERROR,
      [RecoveryStrategy.FALLBACK, RecoveryStrategy.NOTIFY],
      { originalError: error, context }
    );
  },

  /**
   * Try to execute a wind calculation function and handle any errors
   */
  async tryWindCalculation<T>(
    fn: () => Promise<T>,
    context?: string,
    fallbackValue?: T
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const handledError = WindErrorHandler.handle(error as Error, context);

      // If fallback is provided and fallback strategy is available, return fallback
      if (fallbackValue !== undefined &&
          handledError.recoveryStrategies.includes(RecoveryStrategy.FALLBACK)) {
        logger.info(`Using fallback value for wind calculation: ${context || ''}`, { fallbackValue });
        return fallbackValue;
      }

      // Otherwise rethrow
      throw handledError;
    }
  }
};
