/**
 * RevenueCat Configuration
 *
 * Contains API keys, product IDs, and entitlement identifiers
 * for the RevenueCat SDK integration.
 *
 * @see https://www.revenuecat.com/docs/getting-started/installation/reactnative
 */

export const RevenueCatConfig = {
  /**
   * API keys for iOS and Android platforms.
   * For development/testing, you can use the same key for both platforms.
   * In production, use platform-specific keys from RevenueCat dashboard.
   *
   * Set these in your .env file:
   * - EXPO_PUBLIC_REVENUECAT_IOS_KEY
   * - EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
   *
   * Or use the test key directly for development:
   */
  apiKeys: {
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? 'test_mDXXzLHCuaHHUPSoSZnePHUSzpM',
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? 'test_mDXXzLHCuaHHUPSoSZnePHUSzpM',
  },

  /**
   * Product identifiers matching those configured in
   * App Store Connect and Google Play Console.
   * These should also be configured in RevenueCat dashboard.
   */
  productIds: {
    monthly: 'monthly',
    yearly: 'yearly',
    lifetime: 'lifetime',
  },

  /**
   * Entitlement identifiers configured in RevenueCat dashboard.
   * Used to check if user has access to premium features.
   *
   * The entitlement ID should match what's configured in RevenueCat:
   * Dashboard > Project > Entitlements
   */
  entitlements: {
    premium: 'Aicaddypro Premium',
  },

  /**
   * Offering identifier for the default subscription offering.
   * This is the offering ID from RevenueCat dashboard.
   */
  defaultOffering: 'default',

  /**
   * Package types for easier identification.
   * Maps to RevenueCat package identifiers.
   */
  packageTypes: {
    monthly: '$rc_monthly',
    annual: '$rc_annual',
    lifetime: '$rc_lifetime',
  },
} as const;

export type ProductId = (typeof RevenueCatConfig.productIds)[keyof typeof RevenueCatConfig.productIds];
export type EntitlementId = (typeof RevenueCatConfig.entitlements)[keyof typeof RevenueCatConfig.entitlements];
export type PackageType = (typeof RevenueCatConfig.packageTypes)[keyof typeof RevenueCatConfig.packageTypes];
