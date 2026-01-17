/**
 * FeatureFlags.ts
 *
 * A centralized system for managing feature flags across development
 * and production environments. This allows for enabling or disabling
 * features based on environment, and for A/B testing in production.
 */

// Determine if running in development or production
const isDevelopment = __DEV__;

// Feature flag configuration
type FeatureConfiguration = {
  // Development-only value (when __DEV__ is true)
  development: boolean;
  // Production-only value (when __DEV__ is false)
  production: boolean;
  // Optional description of the feature flag for documentation
  description?: string;
  // When enabled, this feature can be remotely toggled in production
  remoteOverrideEnabled?: boolean;
};

// Define available feature flags with default values per environment
const featureConfigurations: Record<string, FeatureConfiguration> = {
  // Toggle between complex and simple state management approaches
  COMPLEX_STATE_MANAGEMENT: {
    development: true, // Use complex approach in development for testing
    production: false, // Use simpler approach in production for reliability
    description: 'Controls whether to use complex ref-based state tracking or simpler approach',
  },

  // Toggle safety timeouts that automatically clear loading states
  USE_SAFETY_TIMEOUTS: {
    development: true,
    production: true, // Keep enabled in prod to prevent stuck loading states
    description: 'Enables automatic safety timeouts to prevent stuck loading states',
  },

  // Toggle enhanced diagnostic logging in production
  ENHANCED_LOGGING: {
    development: true,
    production: true, // Keep enabled to help diagnose production issues
    description: 'Enables detailed diagnostic logging with timestamps and state information',
  },

  // Toggle permission handling approach
  SIMPLIFIED_PERMISSIONS: {
    development: false,
    production: true, // Use simplified approach in production for reliability
    description: 'Uses a simplified permission handling approach with fewer edge cases',
  },

  // Toggle debug overlay display in production builds
  ALLOW_DEBUG_OVERLAY: {
    development: true,
    production: true, // Enable in production temporarily for debugging
    description: 'Allows debug overlay to be shown in production builds',
    remoteOverrideEnabled: true,
  },

  // Toggle diagnostic mode for enhanced troubleshooting
  DIAGNOSTIC_MODE: {
    development: true,
    production: true, // Enable temporarily for troubleshooting
    description:
      'Enables comprehensive diagnostic features including overlay, persistent logs, and detailed state tracking',
    remoteOverrideEnabled: true,
  },

  // Toggle forced re-rendering for stuck components
  USE_FORCE_RENDER: {
    development: true,
    production: true,
    description: 'Enables force rendering to recover from stuck component states',
  },

  // Toggle between timed and immediate initialization
  DELAYED_INITIALIZATION: {
    development: true, // Use delay in dev to simulate slower devices
    production: true, // Also use in prod for stability
    description: 'Enables delayed component initialization for more stability',
  },

  // Toggle instant initialization pattern
  INSTANT_INITIALIZATION: {
    development: true, // Use in development for testing
    production: true, // Also use in production
    description: 'Uses instant initialization pattern with placeholder data',
    remoteOverrideEnabled: true, // Can be toggled remotely
  },

  // Phase 1 accessibility enhancements - enables instant rollback
  PHASE1_ACCESSIBILITY_ENHANCEMENTS: {
    development: true,
    production: false, // Start disabled, enable after testing
    description: 'Phase 1 accessibility and loading state improvements',
    remoteOverrideEnabled: true,
  },
};

// Remote overrides (would normally come from a server/API)
// For this implementation, we're hard-coding some example overrides
const remoteOverrides: Record<string, boolean> = {
  // Example: ALLOW_DEBUG_OVERLAY: true - enables debug overlay in production
};

/**
 * FeatureFlags singleton class that provides access to feature flags
 */
export class FeatureFlags {
  // Access feature flags directly as static properties
  static get COMPLEX_STATE_MANAGEMENT(): boolean {
    return FeatureFlags.isEnabled('COMPLEX_STATE_MANAGEMENT');
  }

  static get USE_SAFETY_TIMEOUTS(): boolean {
    return FeatureFlags.isEnabled('USE_SAFETY_TIMEOUTS');
  }

  static get ENHANCED_LOGGING(): boolean {
    return FeatureFlags.isEnabled('ENHANCED_LOGGING');
  }

  static get SIMPLIFIED_PERMISSIONS(): boolean {
    return FeatureFlags.isEnabled('SIMPLIFIED_PERMISSIONS');
  }

  static get ALLOW_DEBUG_OVERLAY(): boolean {
    return FeatureFlags.isEnabled('ALLOW_DEBUG_OVERLAY');
  }

  static get USE_FORCE_RENDER(): boolean {
    return FeatureFlags.isEnabled('USE_FORCE_RENDER');
  }

  static get DELAYED_INITIALIZATION(): boolean {
    return FeatureFlags.isEnabled('DELAYED_INITIALIZATION');
  }

  static get INSTANT_INITIALIZATION(): boolean {
    return FeatureFlags.isEnabled('INSTANT_INITIALIZATION');
  }

  static get DIAGNOSTIC_MODE(): boolean {
    return FeatureFlags.isEnabled('DIAGNOSTIC_MODE');
  }

  static get PHASE1_ACCESSIBILITY_ENHANCEMENTS(): boolean {
    return FeatureFlags.isEnabled('PHASE1_ACCESSIBILITY_ENHANCEMENTS');
  }

  /**
   * Check if a feature flag is enabled based on the current environment
   * and any remote overrides
   */
  static isEnabled(featureName: string): boolean {
    // If feature doesn't exist, default to false
    if (!featureConfigurations[featureName]) {
      console.warn(`Feature flag '${featureName}' not found`);
      return false;
    }

    const config = featureConfigurations[featureName];

    // Check for remote override in production
    if (
      !isDevelopment &&
      config.remoteOverrideEnabled &&
      remoteOverrides[featureName] !== undefined
    ) {
      return remoteOverrides[featureName];
    }

    // Use environment-specific default
    return isDevelopment ? config.development : config.production;
  }

  /**
   * Get all available feature flags and their current values
   */
  static getAllFeatures(): Record<string, boolean> {
    const features: Record<string, boolean> = {};

    Object.keys(featureConfigurations).forEach(key => {
      features[key] = FeatureFlags.isEnabled(key);
    });

    return features;
  }

  /**
   * Log all available feature flags and their current values
   */
  static logFeatureFlags(): void {
    console.group('Feature Flags Status');
    console.log(`Environment: ${isDevelopment ? 'Development' : 'Production'}`);

    Object.entries(FeatureFlags.getAllFeatures()).forEach(([name, enabled]) => {
      const config = featureConfigurations[name];
      console.log(
        `${name}: ${enabled ? 'ENABLED' : 'DISABLED'} ${
          config?.description ? `- ${config.description}` : ''
        }`
      );
    });

    console.groupEnd();
  }
}

// Log feature flags on module import in development
if (isDevelopment) {
  FeatureFlags.logFeatureFlags();
}
