/**
 * Paywall Component
 *
 * Displays subscription options with pricing, free trial info,
 * and purchase/restore functionality. Integrates with RevenueCat
 * via the subscription store.
 */

import { useTokens } from '@/src/theme/useTokens';
import { useSubscription } from '@/src/stores/subscription';
import { usePremium } from '@/src/features/settings/context/premium';
import { Button } from './button';
import { GlassCard } from './GlassCard';
import { safeScaledFontSize } from '@/src/utils/responsive';
import * as Haptics from 'expo-haptics';
import { Crown, Check, X, Sparkles } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Platform,
  ViewStyle,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PurchasesPackage } from 'react-native-purchases';

/**
 * Premium features displayed in the paywall
 */
const PREMIUM_FEATURES = [
  'Advanced Wind Calculator with compass',
  'Real-time aim adjustment recommendations',
  'Wind speed & direction analysis',
  'Detailed shot analytics',
  'Priority customer support',
];

/**
 * Plan Card Component
 */
interface PlanCardProps {
  pkg: PurchasesPackage;
  isSelected: boolean;
  onSelect: () => void;
  isBestValue?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({
  pkg,
  isSelected,
  onSelect,
  isBestValue = false,
}) => {
  const t = useTokens();
  const isAnnual = pkg.identifier.includes('annual');

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelect();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${isAnnual ? 'Annual' : 'Monthly'} subscription at ${pkg.product.priceString}`}
    >
      <GlassCard
        style={StyleSheet.flatten([
          styles.planCard,
          isSelected && { borderColor: t.colors.brand, borderWidth: 2 },
        ]) as ViewStyle}
      >
        {isBestValue && (
          <View style={[styles.badge, { backgroundColor: t.colors.success }]}>
            <Text style={styles.badgeText}>BEST VALUE</Text>
          </View>
        )}

        <Text style={[styles.planTitle, { color: t.colors.textPrimary }]}>
          {isAnnual ? 'Annual' : 'Monthly'}
        </Text>

        <Text style={[styles.planPrice, { color: t.colors.brand }]}>
          {pkg.product.priceString}
          <Text style={[styles.planPeriod, { color: t.colors.textMuted }]}>
            {isAnnual ? '/year' : '/month'}
          </Text>
        </Text>

        {isAnnual && (
          <Text style={[styles.savings, { color: t.colors.success }]}>
            Save ~50% vs monthly
          </Text>
        )}

        {pkg.product.introPrice && (
          <Text style={[styles.trial, { color: t.colors.textSecondary }]}>
            7-day free trial
          </Text>
        )}

        {isSelected && (
          <View style={[styles.selectedIndicator, { backgroundColor: t.colors.brand }]}>
            <Check size={16} color="#fff" />
          </View>
        )}
      </GlassCard>
    </Pressable>
  );
};

/**
 * Main Paywall Component
 */
export function Paywall(): React.ReactElement | null {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const { showUpgradeModal, setShowUpgradeModal } = usePremium();
  const {
    offerings,
    purchasePackage,
    restorePurchases,
    isLoading,
    error,
    clearError,
  } = useSubscription();

  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);

  // Animation for crown
  const crownFloat = useSharedValue(0);

  useEffect(() => {
    crownFloat.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [crownFloat]);

  const crownStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: crownFloat.value }],
  }));

  // Get available packages
  const packages = useMemo(() => {
    if (!offerings?.availablePackages) return [];
    return offerings.availablePackages;
  }, [offerings]);

  // Auto-select annual by default when packages load
  useEffect(() => {
    if (packages.length > 0 && !selectedPackage) {
      const annual = packages.find((p) => p.identifier.includes('annual'));
      setSelectedPackage(annual || packages[0]);
    }
  }, [packages, selectedPackage]);

  // Clear error when modal opens
  useEffect(() => {
    if (showUpgradeModal) {
      clearError();
    }
  }, [showUpgradeModal, clearError]);

  const handlePurchase = async (): Promise<void> => {
    if (!selectedPackage) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await purchasePackage(selectedPackage);

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowUpgradeModal(false);
    }
  };

  const handleRestore = async (): Promise<void> => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const success = await restorePurchases();

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowUpgradeModal(false);
    }
  };

  const handleClose = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowUpgradeModal(false);
  };

  // Generate legal text based on selected package
  const legalText = useMemo(() => {
    if (!selectedPackage) return '';
    const isAnnual = selectedPackage.identifier.includes('annual');
    const price = selectedPackage.product.priceString;
    const period = isAnnual ? 'year' : 'month';
    const store = Platform.OS === 'ios' ? 'App Store' : 'Google Play';

    return `After your 7-day free trial, you'll be charged ${price}/${period}. Cancel anytime in your ${store} settings.`;
  }, [selectedPackage]);

  if (!showUpgradeModal) return null;

  return (
    <Modal
      visible={showUpgradeModal}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
      >
        <Animated.View
          entering={FadeInDown.springify().damping(20).stiffness(300)}
          style={[
            styles.container,
            {
              backgroundColor: t.colors.surface,
              borderColor: t.colors.border,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          {/* Close Button */}
          <Pressable
            onPress={handleClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={24} color={t.colors.textMuted} />
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <Animated.View
              style={[
                styles.crownContainer,
                { backgroundColor: `${t.colors.brand}20` },
                crownStyle,
              ]}
            >
              <Crown size={32} color={t.colors.brand} />
              <Sparkles
                size={14}
                color={t.colors.brandAlt}
                style={styles.sparkle}
              />
            </Animated.View>

            <Text style={[styles.title, { color: t.colors.textPrimary }]}>
              Unlock Premium
            </Text>
            <Text style={[styles.subtitle, { color: t.colors.textMuted }]}>
              Start your 7-day free trial
            </Text>
          </View>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Features */}
            <View style={styles.features}>
              {PREMIUM_FEATURES.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <View
                    style={[
                      styles.checkContainer,
                      { backgroundColor: `${t.colors.success}20` },
                    ]}
                  >
                    <Check size={14} color={t.colors.success} strokeWidth={3} />
                  </View>
                  <Text style={[styles.featureText, { color: t.colors.textSecondary }]}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>

            {/* Plan Selection */}
            {packages.length > 0 ? (
              <View style={styles.plans}>
                {packages.map((pkg) => (
                  <PlanCard
                    key={pkg.identifier}
                    pkg={pkg}
                    isSelected={selectedPackage?.identifier === pkg.identifier}
                    onSelect={() => setSelectedPackage(pkg)}
                    isBestValue={pkg.identifier.includes('annual')}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.loadingPlans}>
                <ActivityIndicator size="small" color={t.colors.brand} />
                <Text style={[styles.loadingText, { color: t.colors.textMuted }]}>
                  Loading plans...
                </Text>
              </View>
            )}

            {/* Error Message */}
            {error && (
              <View style={[styles.errorContainer, { backgroundColor: `${t.colors.danger}20` }]}>
                <Text style={[styles.errorText, { color: t.colors.danger }]}>
                  {error}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              variant="premium"
              size="lg"
              onPress={handlePurchase}
              disabled={isLoading || !selectedPackage}
              style={styles.purchaseButton}
              accessibilityLabel="Start free trial"
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                'Start Free Trial'
              )}
            </Button>

            <Pressable
              onPress={handleRestore}
              disabled={isLoading}
              style={styles.restoreButton}
              accessibilityRole="button"
              accessibilityLabel="Restore purchases"
            >
              <Text style={[styles.restoreText, { color: t.colors.textMuted }]}>
                Restore Purchases
              </Text>
            </Pressable>

            <Text style={[styles.legal, { color: t.colors.textMuted }]}>
              {legalText}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '92%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  crownContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  sparkle: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  title: {
    fontSize: safeScaledFontSize(26),
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: safeScaledFontSize(16),
  },
  scrollContent: {
    maxHeight: 380,
  },
  features: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: safeScaledFontSize(15),
    flex: 1,
    lineHeight: 20,
  },
  plans: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  planCard: {
    flex: 1,
    padding: 16,
    position: 'relative',
    minHeight: 120,
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: safeScaledFontSize(10),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planTitle: {
    fontSize: safeScaledFontSize(16),
    fontWeight: '600',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: safeScaledFontSize(22),
    fontWeight: '700',
  },
  planPeriod: {
    fontSize: safeScaledFontSize(14),
    fontWeight: '400',
  },
  savings: {
    fontSize: safeScaledFontSize(12),
    fontWeight: '600',
    marginTop: 6,
  },
  trial: {
    fontSize: safeScaledFontSize(12),
    marginTop: 8,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingPlans: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: safeScaledFontSize(14),
  },
  errorContainer: {
    marginHorizontal: 24,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: safeScaledFontSize(14),
    textAlign: 'center',
  },
  actions: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  purchaseButton: {
    marginBottom: 12,
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  restoreText: {
    fontSize: safeScaledFontSize(14),
    fontWeight: '500',
  },
  legal: {
    textAlign: 'center',
    fontSize: safeScaledFontSize(11),
    lineHeight: 16,
    marginTop: 8,
  },
});
