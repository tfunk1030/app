import { Alert, Platform } from 'react-native';
import { logger } from '../telemetry/logger';

export interface NotificationOptions {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

/**
 * Error notification service for displaying user-friendly error messages
 */
class ErrorNotificationService {
  /**
   * Show a toast notification
   */
  public showToast(options: NotificationOptions): void {
    try {
      // Log the notification
      logger.info('Showing toast notification', { 
        message: options.message, 
        type: options.type || 'info' 
      });
      
      // In a real implementation, this would use a toast library
      // For now, just log to console
      console.log(`[${options.type || 'info'}] ${options.message}`);
    } catch (error) {
      // Prevent notification errors from crashing the app
      logger.error('Error showing toast notification', error as Error);
    }
  }

  /**
   * Show an error dialog
   */
  public showErrorDialog(options: NotificationOptions): void {
    try {
      // Log the error dialog
      logger.info('Showing error dialog', { 
        title: options.title || 'Error', 
        message: options.message 
      });
      
      // Use React Native Alert API
      Alert.alert(
        options.title || 'Error',
        options.message,
        options.action ? [
          {
            text: options.action.label,
            onPress: options.action.onPress
          },
          { text: 'OK', style: 'cancel' }
        ] : [
          { text: 'OK', style: 'cancel' }
        ]
      );
    } catch (error) {
      // Prevent notification errors from crashing the app
      logger.error('Error showing error dialog', error as Error);
    }
  }

  /**
   * Show a service status notification
   */
  public showServiceStatus(options: NotificationOptions): void {
    try {
      // Log the service status
      logger.info('Showing service status', { 
        message: options.message, 
        type: options.type || 'info' 
      });
      
      // In a real implementation, this would use a status bar or banner
      // For now, just log to console
      console.log(`[Service Status] ${options.message}`);
    } catch (error) {
      // Prevent notification errors from crashing the app
      logger.error('Error showing service status', error as Error);
    }
  }

  /**
   * Handle an error and show appropriate notification
   */
  public async handleError(error: Error, options?: Partial<NotificationOptions>): Promise<void> {
    try {
      // Log the error
      logger.error('Handling error', error, options);
      
      const errorMessage = options?.message || error.message || 'An unknown error occurred';
      
      // Determine if this is a critical error
      const isCritical = this.isCriticalError(error);
      
      if (isCritical) {
        // Show error dialog for critical errors
        this.showErrorDialog({
          title: options?.title || 'Error',
          message: errorMessage,
          action: options?.action
        });
      } else {
        // Show toast for non-critical errors
        this.showToast({
          message: errorMessage,
          type: 'error',
          duration: options?.duration || 5000
        });
      }
    } catch (handlingError) {
      // Last resort error handling to prevent crashes
      logger.error('Error in error handling', handlingError as Error);
      console.error('Original error:', error);
      console.error('Error handling error:', handlingError);
    }
  }

  /**
   * Determine if an error is critical
   */
  private isCriticalError(error: Error): boolean {
    // Check error type or message to determine criticality
    // This is a simplified implementation
    return error.message.includes('permission') || 
           error.message.includes('critical') ||
           error.message.includes('configuration');
  }
}

// Export singleton instance
export const errorNotificationService = new ErrorNotificationService();