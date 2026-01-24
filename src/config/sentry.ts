/**
 * Sentry Error Tracking Configuration
 *
 * Configure Sentry for production error tracking.
 *
 * Installation:
 * ```bash
 * npx expo install @sentry/react-native
 * ```
 *
 * Then import and call initSentry() in app/_layout.tsx
 */

// Sentry DSN - Set this in your environment or EAS secrets
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

export interface SentryConfig {
  dsn: string;
  environment: string;
  release: string;
  debug: boolean;
  enableAutoSessionTracking: boolean;
  sessionTrackingIntervalMillis: number;
  tracesSampleRate: number;
  attachStacktrace: boolean;
}

/**
 * Get Sentry configuration
 */
export function getSentryConfig(): SentryConfig {
  return {
    dsn: SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',
    release: `aicaddypro@${require('../../app.json').expo.version}`,
    debug: __DEV__,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2, // 20% in production
    attachStacktrace: true,
  };
}

/**
 * Initialize Sentry
 *
 * Call this in app/_layout.tsx:
 * ```typescript
 * import { initSentry } from '@/src/config/sentry';
 *
 * // At the top of your root layout
 * initSentry();
 * ```
 */
export function initSentry(): void {
  const config = getSentryConfig();

  if (!config.dsn) {
    if (__DEV__) {
      console.warn('[Sentry] DSN not configured - error tracking disabled');
    }
    return;
  }

  // Sentry initialization would go here
  // Uncomment after installing @sentry/react-native:
  //
  // import * as Sentry from '@sentry/react-native';
  //
  // Sentry.init({
  //   dsn: config.dsn,
  //   environment: config.environment,
  //   release: config.release,
  //   debug: config.debug,
  //   enableAutoSessionTracking: config.enableAutoSessionTracking,
  //   sessionTrackingIntervalMillis: config.sessionTrackingIntervalMillis,
  //   tracesSampleRate: config.tracesSampleRate,
  //   attachStacktrace: config.attachStacktrace,
  //   beforeSend(event) {
  //     // Scrub sensitive data
  //     if (event.request?.headers) {
  //       delete event.request.headers['Authorization'];
  //       delete event.request.headers['x-api-key'];
  //     }
  //     return event;
  //   },
  // });

  if (__DEV__) {
    console.log('[Sentry] Initialized with config:', {
      environment: config.environment,
      release: config.release,
    });
  }
}

/**
 * Set user context for error reports
 */
export function setSentryUser(user: {
  id?: string;
  email?: string;
  isPremium?: boolean;
}): void {
  // Uncomment after installing @sentry/react-native:
  // Sentry.setUser({
  //   id: user.id,
  //   email: user.email,
  //   isPremium: user.isPremium,
  // });
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser(): void {
  // Uncomment after installing @sentry/react-native:
  // Sentry.setUser(null);
}

/**
 * Capture an exception manually
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  // Uncomment after installing @sentry/react-native:
  // Sentry.captureException(error, {
  //   extra: context,
  // });

  // Always log in development
  if (__DEV__) {
    console.error('[Sentry] Exception:', error, context);
  }
}

/**
 * Capture a message
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  // Uncomment after installing @sentry/react-native:
  // Sentry.captureMessage(message, level);

  if (__DEV__) {
    console.log(`[Sentry] ${level}:`, message);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
): void {
  // Uncomment after installing @sentry/react-native:
  // Sentry.addBreadcrumb({
  //   message,
  //   category,
  //   data,
  //   level: 'info',
  // });
}
