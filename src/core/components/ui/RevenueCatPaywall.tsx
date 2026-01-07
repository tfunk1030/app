/**
 * RevenueCat Paywall Component
 *
 * Presents the RevenueCat-hosted paywall UI for subscription purchases.
 * Uses react-native-purchases-ui for native paywall presentation.
 *
 * @see https://www.revenuecat.com/docs/tools/paywalls
 */

import { usePremium } from '@/src/features/settings/context/premium';
import { useSubscription } from '@/src/stores/subscription';
import { LogManager } from '@/src/utils/LogManager';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

const logger = LogManager.getLogger('RevenueCatPaywall');

/**
 * Props for RevenueCatPaywall component
 */
interface RevenueCatPaywallProps {
  /** Callback when paywall is dismissed (purchased, restored, or cancelled) */
  onDismiss?: (result: 'purchased' | 'restored' | 'cancelled' | 'error') => void;
  /** Whether to show the paywall immediately on mount */
  showOnMount?: boolean;
  /** Optional offering identifier (uses default if not specified) */
  offeringIdentifier?: string;
}

/**
 * RevenueCat Paywall Component
 *
 * This component provides a simple way to present RevenueCat paywalls.
 * The paywall UI is configured in the RevenueCat dashboard and rendered natively.
 *
 * Usage:
 * ```tsx
 * const { setShowRevenueCatPaywall } = usePremium();
 *
 * // Show the paywall
 * setShowRevenueCatPaywall(true);
 *
 * // In your component tree (usually in _layout.tsx):
 * <RevenueCatPaywall />
 * ```
 */
export function RevenueCatPaywall({
  onDismiss,
  showOnMount = false,
  offeringIdentifier,
}: RevenueCatPaywallProps): React.ReactElement | null {
  const { showRevenueCatPaywall, setShowRevenueCatPaywall, isPremium } = usePremium();
  const { refreshStatus } = useSubscription();

  /**
   * Present the RevenueCat paywall
   */
  const presentPaywall = useCallback(async () => {
    try {
      logger.info('Presenting RevenueCat paywall', { offeringIdentifier });

      // Present the paywall using RevenueCat UI
      const paywallResult = await RevenueCatUI.presentPaywall();

      logger.info('Paywall result', { result: paywallResult });

      // Handle the result
      switch (paywallResult) {
        case PAYWALL_RESULT.PURCHASED:
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await refreshStatus();
          onDismiss?.('purchased');
          break;

        case PAYWALL_RESULT.RESTORED:
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await refreshStatus();
          onDismiss?.('restored');
          break;

        case PAYWALL_RESULT.CANCELLED:
        case PAYWALL_RESULT.NOT_PRESENTED:
          onDismiss?.('cancelled');
          break;

        case PAYWALL_RESULT.ERROR:
          onDismiss?.('error');
          break;

        default:
          onDismiss?.('cancelled');
      }
    } catch (error) {
      logger.error('Failed to present paywall', { error });

      Alert.alert(
        'Paywall Error',
        'Unable to load subscription options. Please try again later.',
        [{ text: 'OK' }]
      );

      onDismiss?.('error');
    } finally {
      setShowRevenueCatPaywall(false);
    }
  }, [offeringIdentifier, refreshStatus, setShowRevenueCatPaywall, onDismiss]);

  // Present paywall when showRevenueCatPaywall becomes true
  useEffect(() => {
    if (showRevenueCatPaywall && !isPremium) {
      presentPaywall();
    } else if (showRevenueCatPaywall && isPremium) {
      // User already has premium, don't show paywall
      setShowRevenueCatPaywall(false);
      onDismiss?.('cancelled');
    }
  }, [showRevenueCatPaywall, isPremium, presentPaywall, setShowRevenueCatPaywall, onDismiss]);

  // Present on mount if requested
  useEffect(() => {
    if (showOnMount && !isPremium) {
      presentPaywall();
    }
  }, [showOnMount, isPremium, presentPaywall]);

  // This component doesn't render anything - the paywall is presented natively
  return null;
}

/**
 * Present the RevenueCat paywall imperatively
 *
 * Use this function when you need to show the paywall outside of React context.
 *
 * @param offeringIdentifier Optional offering identifier
 * @returns Promise with the paywall result
 *
 * Usage:
 * ```tsx
 * const result = await presentRevenueCatPaywall();
 * if (result === 'purchased') {
 *   // Handle successful purchase
 * }
 * ```
 */
export async function presentRevenueCatPaywall(
  offeringIdentifier?: string
): Promise<'purchased' | 'restored' | 'cancelled' | 'error'> {
  try {
    logger.info('Presenting RevenueCat paywall (imperative)', { offeringIdentifier });

    const paywallResult = await RevenueCatUI.presentPaywall();

    switch (paywallResult) {
      case PAYWALL_RESULT.PURCHASED:
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return 'purchased';

      case PAYWALL_RESULT.RESTORED:
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return 'restored';

      case PAYWALL_RESULT.ERROR:
        return 'error';

      default:
        return 'cancelled';
    }
  } catch (error) {
    logger.error('Failed to present paywall (imperative)', { error });
    return 'error';
  }
}

/**
 * Present the RevenueCat paywall conditionally based on entitlement
 *
 * Only shows the paywall if the user doesn't have the specified entitlement.
 *
 * @param entitlementIdentifier The entitlement to check
 * @param offeringIdentifier Optional offering identifier
 * @returns Promise with the paywall result
 */
export async function presentPaywallIfNeeded(
  entitlementIdentifier: string,
  offeringIdentifier?: string
): Promise<'purchased' | 'restored' | 'cancelled' | 'error' | 'already_entitled'> {
  try {
    logger.info('Presenting paywall if needed', { entitlementIdentifier, offeringIdentifier });

    const paywallResult = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: entitlementIdentifier,
    });

    switch (paywallResult) {
      case PAYWALL_RESULT.PURCHASED:
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return 'purchased';

      case PAYWALL_RESULT.RESTORED:
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return 'restored';

      case PAYWALL_RESULT.NOT_PRESENTED:
        // User already has the entitlement
        return 'already_entitled';

      case PAYWALL_RESULT.ERROR:
        return 'error';

      default:
        return 'cancelled';
    }
  } catch (error) {
    logger.error('Failed to present paywall if needed', { error });
    return 'error';
  }
}

/**
 * Hook to use RevenueCat Paywall functionality
 *
 * Provides convenient methods to present paywalls and check entitlements.
 *
 * Usage:
 * ```tsx
 * const { presentPaywall, presentIfNeeded } = useRevenueCatPaywall();
 *
 * // Present the paywall
 * const result = await presentPaywall();
 *
 * // Or present only if user doesn't have premium
 * const result = await presentIfNeeded('Aicaddypro Premium');
 * ```
 */
export function useRevenueCatPaywall() {
  const { setShowRevenueCatPaywall, isPremium } = usePremium();
  const { refreshStatus } = useSubscription();

  const presentPaywall = useCallback(
    async (offeringIdentifier?: string) => {
      if (isPremium) {
        return 'already_entitled' as const;
      }

      const result = await presentRevenueCatPaywall(offeringIdentifier);
      if (result === 'purchased' || result === 'restored') {
        await refreshStatus();
      }
      return result;
    },
    [isPremium, refreshStatus]
  );

  const presentIfNeeded = useCallback(
    async (entitlementIdentifier: string, offeringIdentifier?: string) => {
      const result = await presentPaywallIfNeeded(entitlementIdentifier, offeringIdentifier);
      if (result === 'purchased' || result === 'restored') {
        await refreshStatus();
      }
      return result;
    },
    [refreshStatus]
  );

  const showPaywall = useCallback(() => {
    setShowRevenueCatPaywall(true);
  }, [setShowRevenueCatPaywall]);

  return {
    presentPaywall,
    presentIfNeeded,
    showPaywall,
    isPremium,
  };
}

export default RevenueCatPaywall;
