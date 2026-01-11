/**
 * Product Analytics
 *
 * Analytics abstraction layer for user behavior tracking.
 * Configure with your preferred provider (PostHog, Mixpanel, Amplitude).
 */

export interface AnalyticsUser {
  userId?: string;
  anonymousId: string;
  traits?: Record<string, unknown>;
}

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: number;
}

// Analytics provider interface
interface AnalyticsProvider {
  identify(user: AnalyticsUser): void;
  track(event: AnalyticsEvent): void;
  screen(name: string, properties?: Record<string, unknown>): void;
  reset(): void;
}

// Default no-op provider
const noopProvider: AnalyticsProvider = {
  identify: () => {},
  track: () => {},
  screen: () => {},
  reset: () => {},
};

// Current provider (configure at app init)
let provider: AnalyticsProvider = noopProvider;
let currentUser: AnalyticsUser | null = null;
let isEnabled = true;

/**
 * Initialize analytics with a provider
 *
 * Example with PostHog:
 * ```typescript
 * import PostHog from 'posthog-react-native';
 *
 * initAnalytics({
 *   identify: (user) => PostHog.identify(user.userId, user.traits),
 *   track: (event) => PostHog.capture(event.name, event.properties),
 *   screen: (name, props) => PostHog.screen(name, props),
 *   reset: () => PostHog.reset(),
 * });
 * ```
 */
export function initAnalytics(analyticsProvider: AnalyticsProvider): void {
  provider = analyticsProvider;
}

/**
 * Enable/disable analytics (for user consent)
 */
export function setAnalyticsEnabled(enabled: boolean): void {
  isEnabled = enabled;
}

/**
 * Identify a user
 */
export function identify(user: AnalyticsUser): void {
  if (!isEnabled) return;

  currentUser = user;
  provider.identify(user);

  if (__DEV__) {
    console.debug('[ANALYTICS] Identify:', user);
  }
}

/**
 * Track an event
 */
export function track(name: string, properties?: Record<string, unknown>): void {
  if (!isEnabled) return;

  const event: AnalyticsEvent = {
    name,
    properties: {
      ...properties,
      timestamp: Date.now(),
    },
  };

  provider.track(event);

  if (__DEV__) {
    console.debug('[ANALYTICS] Track:', name, properties);
  }
}

/**
 * Track a screen view
 */
export function screen(name: string, properties?: Record<string, unknown>): void {
  if (!isEnabled) return;

  provider.screen(name, properties);

  if (__DEV__) {
    console.debug('[ANALYTICS] Screen:', name, properties);
  }
}

/**
 * Reset analytics (on logout)
 */
export function reset(): void {
  currentUser = null;
  provider.reset();

  if (__DEV__) {
    console.debug('[ANALYTICS] Reset');
  }
}

/**
 * Get current user
 */
export function getCurrentUser(): AnalyticsUser | null {
  return currentUser;
}

// Pre-defined event names for consistency
export const AnalyticsEvents = {
  // Onboarding
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_SKIPPED: 'onboarding_skipped',

  // Core features
  SHOT_CALCULATED: 'shot_calculated',
  WIND_CALCULATED: 'wind_calculated',
  CLUB_ADDED: 'club_added',
  CLUB_EDITED: 'club_edited',
  CLUB_DELETED: 'club_deleted',

  // Settings
  UNITS_CHANGED: 'units_changed',
  THEME_CHANGED: 'theme_changed',

  // Premium
  PAYWALL_VIEWED: 'paywall_viewed',
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',

  // Errors
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',

  // Engagement
  APP_OPENED: 'app_opened',
  APP_BACKGROUNDED: 'app_backgrounded',
  SESSION_STARTED: 'session_started',
} as const;

// Screen names for consistency
export const AnalyticsScreens = {
  SHOT_CALCULATOR: 'Shot Calculator',
  WIND_CALCULATOR: 'Wind Calculator',
  CLUB_SETUP: 'Club Setup',
  SETTINGS: 'Settings',
  PAYWALL: 'Paywall',
  ONBOARDING: 'Onboarding',
} as const;
