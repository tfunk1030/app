/**
 * Subscription Components Index
 *
 * Re-exports all subscription-related components for convenient importing.
 *
 * @example
 * ```tsx
 * import {
 *   Paywall,
 *   RevenueCatPaywall,
 *   CustomerCenter,
 *   useRevenueCatPaywall,
 *   useCustomerCenter,
 * } from '@/src/core/components/ui/subscription';
 * ```
 */

// Custom Paywall Component
export { Paywall } from '../Paywall';

// RevenueCat Native Paywall
export {
  RevenueCatPaywall,
  presentRevenueCatPaywall,
  presentPaywallIfNeeded,
  useRevenueCatPaywall,
} from '../RevenueCatPaywall';

// Customer Center
export {
  CustomerCenter,
  presentCustomerCenterImperative,
  useCustomerCenter,
} from '../CustomerCenter';
export type { CustomerCenterAction } from '../CustomerCenter';

// Subscription Store
export {
  useSubscription,
} from '@/src/stores/subscription';
export type {
  SubscriptionState,
  SubscriptionStatus,
  PlanType,
} from '@/src/stores/subscription';

// Premium Context
export {
  usePremium,
  PremiumProvider,
} from '@/src/features/settings/context/premium';

// RevenueCat Config
export {
  RevenueCatConfig,
} from '@/src/config/revenuecat';
export type {
  ProductId,
  EntitlementId,
  PackageType,
} from '@/src/config/revenuecat';
