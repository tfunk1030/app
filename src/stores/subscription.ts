/**
 * Subscription Store
 *
 * Manages subscription state with RevenueCat integration.
 * Persists subscription status to AsyncStorage for offline access.
 * Follows the pattern from navigationPreference.ts.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  PurchasesPackage,
  PurchasesOffering,
  PurchasesError,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';
import { create } from 'zustand';

import { RevenueCatConfig } from '@/src/config/revenuecat';
import { LogManager } from '@/src/utils/LogManager';

const logger = LogManager.getLogger('SubscriptionStore');
const STORAGE_KEY = '@aicaddy/subscription_state';

/**
 * Subscription status types
 */
export type SubscriptionStatus =
  | 'unknown'
  | 'not_subscribed'
  | 'trial'
  | 'active'
  | 'expired'
  | 'grace_period'
  | 'lifetime';

/**
 * Subscription plan types
 */
export type PlanType = 'monthly' | 'yearly' | 'lifetime' | null;

/**
 * Cached subscription state for offline access
 */
interface CachedSubscriptionState {
  status: SubscriptionStatus;
  isPremium: boolean;
  expirationDate: string | null;
  isTrialActive: boolean;
  isLifetime: boolean;
  planType: PlanType;
  lastUpdated: string;
}

/**
 * Subscription store state and actions
 */
export interface SubscriptionState {
  /** Current subscription status */
  status: SubscriptionStatus;
  /** Whether the user has premium entitlement */
  isPremium: boolean;
  /** Whether the store has been initialized */
  isInitialized: boolean;
  /** Whether a purchase/restore operation is in progress */
  isLoading: boolean;
  /** Current offerings from RevenueCat */
  offerings: PurchasesOffering | null;
  /** Active subscription expiration date (ISO string) */
  expirationDate: string | null;
  /** Whether user is in free trial period */
  isTrialActive: boolean;
  /** Whether user has lifetime access */
  isLifetime: boolean;
  /** Current plan type (monthly, yearly, lifetime) */
  planType: PlanType;
  /** Error message if any operation failed */
  error: string | null;
  /** Full customer info from RevenueCat */
  customerInfo: CustomerInfo | null;

  // Actions
  /** Initialize RevenueCat SDK and load subscription state */
  initialize: () => Promise<void>;
  /** Refresh subscription status from RevenueCat */
  refreshStatus: () => Promise<void>;
  /** Purchase a subscription package */
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  /** Restore previous purchases */
  restorePurchases: () => Promise<boolean>;
  /** Load available offerings */
  loadOfferings: () => Promise<void>;
  /** Clear any error state */
  clearError: () => void;
  /** Identify user for RevenueCat (optional, for cross-platform sync) */
  identifyUser: (userId: string) => Promise<void>;
  /** Log out current user (for anonymous purchases) */
  logOut: () => Promise<void>;
}

/**
 * Parse CustomerInfo to extract subscription state
 */
function parseCustomerInfo(info: CustomerInfo): {
  status: SubscriptionStatus;
  isPremium: boolean;
  expirationDate: string | null;
  isTrialActive: boolean;
  isLifetime: boolean;
  planType: PlanType;
} {
  const entitlement = info.entitlements.active[RevenueCatConfig.entitlements.premium];

  if (!entitlement) {
    return {
      status: 'not_subscribed',
      isPremium: false,
      expirationDate: null,
      isTrialActive: false,
      isLifetime: false,
      planType: null,
    };
  }

  const isTrialActive = entitlement.periodType === 'TRIAL';
  const isGracePeriod = entitlement.billingIssueDetectedAt !== null;

  // Check if this is a lifetime purchase (no expiration date)
  const isLifetime = entitlement.expirationDate === null || entitlement.productIdentifier?.includes('lifetime');

  // Determine plan type from product identifier
  let planType: PlanType = null;
  const productId = entitlement.productIdentifier?.toLowerCase() ?? '';
  if (productId.includes('lifetime')) {
    planType = 'lifetime';
  } else if (productId.includes('year') || productId.includes('annual')) {
    planType = 'yearly';
  } else if (productId.includes('month')) {
    planType = 'monthly';
  }

  let status: SubscriptionStatus = 'active';
  if (isLifetime) status = 'lifetime';
  else if (isTrialActive) status = 'trial';
  else if (isGracePeriod) status = 'grace_period';

  return {
    status,
    isPremium: true,
    expirationDate: entitlement.expirationDate,
    isTrialActive,
    isLifetime,
    planType,
  };
}

/**
 * Get user-friendly error message from RevenueCat error
 */
function getErrorMessage(error: PurchasesError): string {
  switch (error.code) {
    case PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR:
      return 'Purchase cancelled';
    case PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR:
      return 'Store is temporarily unavailable. Please try again.';
    case PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR:
      return 'Purchases are not allowed on this device.';
    case PURCHASES_ERROR_CODE.PURCHASE_INVALID_ERROR:
      return 'The purchase was invalid. Please try again.';
    case PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR:
      return 'This product is not available for purchase.';
    case PURCHASES_ERROR_CODE.NETWORK_ERROR:
      return 'Network error. Please check your connection.';
    case PURCHASES_ERROR_CODE.RECEIPT_ALREADY_IN_USE_ERROR:
      return 'This subscription is already linked to another account.';
    default:
      return 'Purchase failed. Please try again.';
  }
}

/**
 * Subscription Zustand store
 */
// Only allow premium bypass in development when explicitly enabled via env var
const FORCE_PREMIUM_BYPASS = __DEV__ && process.env.EXPO_PUBLIC_DEV_PREMIUM === 'true';

export const useSubscription = create<SubscriptionState>((set, get) => ({
  status: 'unknown',
  isPremium: FORCE_PREMIUM_BYPASS || __DEV__, // Default to premium in dev mode for testing
  isInitialized: false,
  isLoading: false,
  offerings: null,
  expirationDate: null,
  isTrialActive: false,
  isLifetime: false,
  planType: null,
  error: null,
  customerInfo: null,

  initialize: async (): Promise<void> => {
    try {
      logger.info('Initializing RevenueCat SDK');

      // Get platform-specific API key
      const apiKey = Platform.select({
        ios: RevenueCatConfig.apiKeys.ios,
        android: RevenueCatConfig.apiKeys.android,
        default: '',
      });

      // If no API key configured, skip initialization (dev mode)
      if (!apiKey) {
        logger.warn('RevenueCat API key not configured, skipping initialization');
        set({ isInitialized: true, isPremium: FORCE_PREMIUM_BYPASS || __DEV__ });
        return;
      }

      // Load cached state first for immediate UI
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          const parsed: CachedSubscriptionState = JSON.parse(cached);
          set({
            isPremium: parsed.isPremium || __DEV__,
            status: parsed.status || 'unknown',
            expirationDate: parsed.expirationDate,
            isTrialActive: parsed.isTrialActive,
            isLifetime: parsed.isLifetime ?? false,
            planType: parsed.planType ?? null,
          });
          logger.debug('Loaded cached subscription state', { status: parsed.status, planType: parsed.planType });
        } catch {
          logger.warn('Failed to parse cached subscription state');
        }
      }

      // Configure RevenueCat SDK
      await Purchases.configure({ apiKey });

      // Refresh status from server
      await get().refreshStatus();

      // Load available offerings
      await get().loadOfferings();

      set({ isInitialized: true });
      logger.info('RevenueCat initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize RevenueCat', { error });
      set({
        isInitialized: true,
        error: 'Failed to initialize purchases',
        isPremium: FORCE_PREMIUM_BYPASS || __DEV__, // Fallback with bypass support
      });
    }
  },

  refreshStatus: async (): Promise<void> => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const { status, isPremium, expirationDate, isTrialActive, isLifetime, planType } = parseCustomerInfo(customerInfo);

      // Update store state
      set({
        status,
        isPremium: isPremium || __DEV__,
        expirationDate,
        isTrialActive,
        isLifetime,
        planType,
        customerInfo,
        error: null,
      });

      // Persist to AsyncStorage for offline access
      const cachedState: CachedSubscriptionState = {
        status,
        isPremium: isPremium || __DEV__,
        expirationDate,
        isTrialActive,
        isLifetime,
        planType,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cachedState));

      logger.info('Subscription status refreshed', { status, isPremium, isTrialActive, isLifetime, planType });
    } catch (error) {
      logger.error('Failed to refresh subscription status', { error });
      set({ error: 'Failed to check subscription status' });
    }
  },

  purchasePackage: async (pkg: PurchasesPackage): Promise<boolean> => {
    set({ isLoading: true, error: null });

    try {
      logger.info('Starting purchase', { packageId: pkg.identifier });

      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const { status, isPremium, expirationDate, isTrialActive, isLifetime, planType } = parseCustomerInfo(customerInfo);

      // Update store state
      set({
        status,
        isPremium,
        expirationDate,
        isTrialActive,
        isLifetime,
        planType,
        customerInfo,
        isLoading: false,
      });

      // Persist to AsyncStorage
      const cachedState: CachedSubscriptionState = {
        status,
        isPremium,
        expirationDate,
        isTrialActive,
        isLifetime,
        planType,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cachedState));

      logger.info('Purchase completed successfully', { status, isPremium, planType });
      return true;
    } catch (error) {
      const purchasesError = error as PurchasesError;
      const message = getErrorMessage(purchasesError);

      // Don't show error for user cancellation
      if (purchasesError.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        set({ isLoading: false, error: null });
        logger.debug('Purchase cancelled by user');
        return false;
      }

      set({ isLoading: false, error: message });
      logger.error('Purchase failed', { error: purchasesError.code, message });
      return false;
    }
  },

  restorePurchases: async (): Promise<boolean> => {
    set({ isLoading: true, error: null });

    try {
      logger.info('Restoring purchases');

      const customerInfo = await Purchases.restorePurchases();
      const { status, isPremium, expirationDate, isTrialActive, isLifetime, planType } = parseCustomerInfo(customerInfo);

      // Update store state
      set({
        status,
        isPremium: isPremium || __DEV__,
        expirationDate,
        isTrialActive,
        isLifetime,
        planType,
        customerInfo,
        isLoading: false,
      });

      // Persist to AsyncStorage
      const cachedState: CachedSubscriptionState = {
        status,
        isPremium: isPremium || __DEV__,
        expirationDate,
        isTrialActive,
        isLifetime,
        planType,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cachedState));

      if (!isPremium) {
        set({ error: 'No active subscription found to restore' });
        logger.info('No active subscription found during restore');
        return false;
      }

      logger.info('Purchases restored successfully', { status, isPremium, planType });
      return true;
    } catch (error) {
      const purchasesError = error as PurchasesError;
      const message = getErrorMessage(purchasesError);

      set({ isLoading: false, error: message });
      logger.error('Restore failed', { error: purchasesError.code });
      return false;
    }
  },

  loadOfferings: async (): Promise<void> => {
    try {
      const offerings = await Purchases.getOfferings();
      set({ offerings: offerings.current });

      if (offerings.current) {
        logger.info('Offerings loaded', {
          offeringId: offerings.current.identifier,
          packageCount: offerings.current.availablePackages.length,
        });
      } else {
        logger.warn('No current offering available');
      }
    } catch (error) {
      logger.error('Failed to load offerings', { error });
    }
  },

  clearError: (): void => {
    set({ error: null });
  },

  identifyUser: async (userId: string): Promise<void> => {
    try {
      logger.info('Identifying user', { userId });
      const { customerInfo } = await Purchases.logIn(userId);
      const { status, isPremium, expirationDate, isTrialActive, isLifetime, planType } = parseCustomerInfo(customerInfo);

      set({
        status,
        isPremium: isPremium || __DEV__,
        expirationDate,
        isTrialActive,
        isLifetime,
        planType,
        customerInfo,
      });

      logger.info('User identified successfully', { userId, isPremium });
    } catch (error) {
      logger.error('Failed to identify user', { error });
    }
  },

  logOut: async (): Promise<void> => {
    try {
      logger.info('Logging out user');
      const customerInfo = await Purchases.logOut();
      const { status, isPremium, expirationDate, isTrialActive, isLifetime, planType } = parseCustomerInfo(customerInfo);

      set({
        status,
        isPremium: isPremium || __DEV__,
        expirationDate,
        isTrialActive,
        isLifetime,
        planType,
        customerInfo,
      });

      // Clear cached state
      await AsyncStorage.removeItem(STORAGE_KEY);

      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Failed to log out user', { error });
    }
  },
}));
