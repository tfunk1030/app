/**
 * Premium Context
 *
 * Provides premium subscription state throughout the app.
 * Integrates with RevenueCat via the subscription Zustand store.
 * Maintains backward compatibility with existing usePremium() hook usage.
 */

import * as React from 'react';
import { createContext, useCallback, useEffect, useState } from 'react';

import { useSubscription, SubscriptionStatus, PlanType } from '@/src/stores/subscription';

interface PremiumContextType {
  /** Whether the user has an active premium subscription */
  isPremium: boolean;
  /** Whether the user is in a free trial period */
  isTrialActive: boolean;
  /** Whether the user has lifetime access */
  isLifetime: boolean;
  /** Current plan type (monthly, yearly, lifetime) */
  planType: PlanType;
  /** Current subscription status */
  subscriptionStatus: SubscriptionStatus;
  /** Subscription expiration date (ISO string) */
  expirationDate: string | null;
  /** Whether the upgrade modal is visible */
  showUpgradeModal: boolean;
  /** Show or hide the upgrade modal */
  setShowUpgradeModal: (show: boolean) => void;
  /** Whether the RevenueCat paywall should be shown */
  showRevenueCatPaywall: boolean;
  /** Show or hide the RevenueCat paywall */
  setShowRevenueCatPaywall: (show: boolean) => void;
  /** Whether the Customer Center should be shown */
  showCustomerCenter: boolean;
  /** Show or hide the Customer Center */
  setShowCustomerCenter: (show: boolean) => void;
  /** Whether a purchase/restore operation is in progress */
  isLoading: boolean;
  /** Whether the subscription store has been initialized */
  isInitialized: boolean;
}

// Premium bypass: enabled via env var (works in dev and preview builds)
const FORCE_PREMIUM_BYPASS = process.env.EXPO_PUBLIC_BYPASS_PREMIUM === 'true';

const PremiumContext = createContext<PremiumContextType>({
  isPremium: FORCE_PREMIUM_BYPASS, // Bypass via EXPO_PUBLIC_BYPASS_PREMIUM env var
  isTrialActive: false,
  isLifetime: false,
  planType: null,
  subscriptionStatus: 'unknown',
  expirationDate: null,
  showUpgradeModal: false,
  setShowUpgradeModal: () => {},
  showRevenueCatPaywall: false,
  setShowRevenueCatPaywall: () => {},
  showCustomerCenter: false,
  setShowCustomerCenter: () => {},
  isLoading: false,
  isInitialized: false,
});

export function PremiumProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showRevenueCatPaywall, setShowRevenueCatPaywall] = useState(false);
  const [showCustomerCenter, setShowCustomerCenter] = useState(false);

  // Connect to subscription store
  const {
    isPremium,
    isTrialActive,
    isLifetime,
    planType,
    status,
    expirationDate,
    isLoading,
    initialize,
    isInitialized,
  } = useSubscription();

  // Initialize RevenueCat on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Memoized setters to prevent unnecessary re-renders
  const handleSetShowUpgradeModal = useCallback((show: boolean) => {
    setShowUpgradeModal(show);
  }, []);

  const handleSetShowRevenueCatPaywall = useCallback((show: boolean) => {
    setShowRevenueCatPaywall(show);
  }, []);

  const handleSetShowCustomerCenter = useCallback((show: boolean) => {
    setShowCustomerCenter(show);
  }, []);

  const value = React.useMemo(
    () => ({
      isPremium,
      isTrialActive,
      isLifetime,
      planType,
      subscriptionStatus: status,
      expirationDate,
      showUpgradeModal,
      setShowUpgradeModal: handleSetShowUpgradeModal,
      showRevenueCatPaywall,
      setShowRevenueCatPaywall: handleSetShowRevenueCatPaywall,
      showCustomerCenter,
      setShowCustomerCenter: handleSetShowCustomerCenter,
      isLoading,
      isInitialized,
    }),
    [
      isPremium,
      isTrialActive,
      isLifetime,
      planType,
      status,
      expirationDate,
      showUpgradeModal,
      handleSetShowUpgradeModal,
      showRevenueCatPaywall,
      handleSetShowRevenueCatPaywall,
      showCustomerCenter,
      handleSetShowCustomerCenter,
      isLoading,
      isInitialized,
    ]
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export const usePremium = (): PremiumContextType => {
  const context = React.useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within PremiumProvider');
  }
  return context;
};
