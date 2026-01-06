/**
 * Customer Center Component
 *
 * Provides subscription management UI using RevenueCat's Customer Center.
 * Allows users to:
 * - View their current subscription status
 * - Manage subscription (upgrade/downgrade)
 * - Restore purchases
 * - Cancel subscription
 * - Contact support
 *
 * @see https://www.revenuecat.com/docs/tools/customer-center
 */

import { usePremium } from '@/src/features/settings/context/premium';
import { useSubscription } from '@/src/stores/subscription';
import { LogManager } from '@/src/utils/LogManager';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import RevenueCatUI, { CUSTOMER_CENTER_MANAGEMENT_OPTION } from 'react-native-purchases-ui';

const logger = LogManager.getLogger('CustomerCenter');

/**
 * Props for CustomerCenter component
 */
interface CustomerCenterProps {
  /** Callback when customer center is dismissed */
  onDismiss?: (action: CustomerCenterAction) => void;
}

/**
 * Customer Center action types
 */
export type CustomerCenterAction =
  | 'dismissed'
  | 'restored'
  | 'cancelled_subscription'
  | 'changed_subscription'
  | 'refund_requested'
  | 'error';

/**
 * Customer Center Component
 *
 * This component manages the presentation of RevenueCat's Customer Center.
 * The Customer Center provides a self-service UI for subscription management.
 *
 * Usage:
 * ```tsx
 * const { setShowCustomerCenter } = usePremium();
 *
 * // Show the customer center
 * setShowCustomerCenter(true);
 *
 * // In your component tree (usually in _layout.tsx):
 * <CustomerCenter />
 * ```
 */
export function CustomerCenter({ onDismiss }: CustomerCenterProps): React.ReactElement | null {
  const { showCustomerCenter, setShowCustomerCenter, isPremium } = usePremium();
  const { refreshStatus } = useSubscription();

  /**
   * Present the Customer Center
   */
  const presentCustomerCenter = useCallback(async () => {
    try {
      logger.info('Presenting Customer Center');

      // Present the customer center
      await RevenueCatUI.presentCustomerCenter();

      // Refresh status after customer center is dismissed
      // (user may have made changes to their subscription)
      await refreshStatus();

      logger.info('Customer Center dismissed');
      onDismiss?.('dismissed');
    } catch (error) {
      logger.error('Failed to present Customer Center', { error });

      Alert.alert(
        'Error',
        'Unable to open subscription management. Please try again later.',
        [{ text: 'OK' }]
      );

      onDismiss?.('error');
    } finally {
      setShowCustomerCenter(false);
    }
  }, [refreshStatus, setShowCustomerCenter, onDismiss]);

  // Present customer center when showCustomerCenter becomes true
  useEffect(() => {
    if (showCustomerCenter) {
      presentCustomerCenter();
    }
  }, [showCustomerCenter, presentCustomerCenter]);

  // This component doesn't render anything - the customer center is presented natively
  return null;
}

/**
 * Present the Customer Center imperatively
 *
 * Use this function when you need to show the customer center outside of React context.
 *
 * @returns Promise that resolves when the customer center is dismissed
 *
 * Usage:
 * ```tsx
 * await presentCustomerCenter();
 * // Refresh subscription status after dismissal
 * ```
 */
export async function presentCustomerCenterImperative(): Promise<CustomerCenterAction> {
  try {
    logger.info('Presenting Customer Center (imperative)');

    await RevenueCatUI.presentCustomerCenter();

    logger.info('Customer Center dismissed (imperative)');
    return 'dismissed';
  } catch (error) {
    logger.error('Failed to present Customer Center (imperative)', { error });
    return 'error';
  }
}

/**
 * Hook to use Customer Center functionality
 *
 * Provides convenient methods to present the customer center
 * and refresh subscription status.
 *
 * Usage:
 * ```tsx
 * const { openCustomerCenter, isPremium } = useCustomerCenter();
 *
 * // Open customer center
 * await openCustomerCenter();
 * ```
 */
export function useCustomerCenter() {
  const { setShowCustomerCenter, isPremium } = usePremium();
  const { refreshStatus, isLifetime, planType, expirationDate, status } = useSubscription();

  const openCustomerCenter = useCallback(async () => {
    try {
      await presentCustomerCenterImperative();
      await refreshStatus();
    } catch (error) {
      logger.error('Failed to open customer center', { error });
    }
  }, [refreshStatus]);

  const showCustomerCenter = useCallback(() => {
    setShowCustomerCenter(true);
  }, [setShowCustomerCenter]);

  return {
    openCustomerCenter,
    showCustomerCenter,
    isPremium,
    isLifetime,
    planType,
    expirationDate,
    subscriptionStatus: status,
  };
}

export default CustomerCenter;
