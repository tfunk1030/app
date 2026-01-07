import { errorNotificationService, NotificationOptions } from './error-notification';
import { logger } from '../telemetry/logger';

/**
 * Safely handle an error without crashing the app
 * This wrapper ensures that even if the error notification service fails,
 * the app won't crash
 */
export const safeHandleError = (error: Error, options?: Partial<NotificationOptions>): Promise<void> => {
  try {
    // Log the error first to ensure it's captured
    logger.error('Error caught by safe handler', error, options);
    
    // Try to use the error notification service
    return errorNotificationService.handleError(error, options)
      .catch(handlingError => {
        // Catch any promise rejections
        console.error('Error in error notification service', handlingError);
        console.error('Original error:', error);
        return Promise.resolve();
      });
  } catch (handlingError) {
    // Catch any synchronous errors
    console.error('Error in safe error handler', handlingError);
    console.error('Original error:', error);
    return Promise.resolve();
  }
};

/**
 * Create a wrapped version of a function that catches and safely handles errors
 */
export const withErrorHandling = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  errorMessage?: string
): ((...args: Parameters<T>) => Promise<ReturnType<T> | undefined>) => {
  return async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
    try {
      return (await fn(...args)) as ReturnType<T>;
    } catch (error) {
      await safeHandleError(error as Error, { message: errorMessage });
      return undefined;
    }
  };
};