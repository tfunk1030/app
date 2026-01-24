/**
 * ErrorBanner - Dismissible error/warning banner
 */

import { useAccessibleAnimations } from '@/src/hooks/useAccessibility';
import { useTokens } from '@/src/theme/useTokens';
import { AlertCircle, AlertTriangle, Info, X, RefreshCw } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeOutUp } from 'react-native-reanimated';

export type ErrorBannerVariant = 'error' | 'warning' | 'info';

export interface ErrorBannerProps {
  message: string;
  variant?: ErrorBannerVariant;
  onRetry?: () => void;
  onDismiss?: () => void;
  autoDismissMs?: number;
  visible?: boolean;
}

const variantConfig = {
  error: { icon: AlertCircle, bgOpacity: 0.12 },
  warning: { icon: AlertTriangle, bgOpacity: 0.1 },
  info: { icon: Info, bgOpacity: 0.08 },
};

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  variant = 'error',
  onRetry,
  onDismiss,
  autoDismissMs = 0,
  visible = true,
}) => {
  const tokens = useTokens();
  const { cardEntering } = useAccessibleAnimations();
  const [isVisible, setIsVisible] = useState(visible);

  const config = variantConfig[variant];
  const Icon = config.icon;

  const color = variant === 'error'
    ? tokens.colors.danger
    : variant === 'warning'
      ? tokens.colors.warning
      : tokens.colors.brand;

  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

  useEffect(() => {
    if (autoDismissMs > 0 && isVisible) {
      const timer = setTimeout(() => handleDismiss(), autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [autoDismissMs, isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <Animated.View
      entering={cardEntering(0)}
      exiting={FadeOutUp.duration(200)}
      style={[
        styles.container,
        {
          backgroundColor: `${color}${Math.round(config.bgOpacity * 255).toString(16).padStart(2, '0')}`,
          borderColor: color,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Icon size={18} color={color} />
      <Text style={[styles.message, { color: tokens.colors.textPrimary }]} numberOfLines={2}>
        {message}
      </Text>
      <View style={styles.actions}>
        {onRetry && (
          <Pressable
            onPress={onRetry}
            style={[styles.actionButton, { backgroundColor: `${color}20` }]}
            accessibilityLabel="Retry"
            accessibilityRole="button"
          >
            <RefreshCw size={14} color={color} />
          </Pressable>
        )}
        {onDismiss && (
          <Pressable
            onPress={handleDismiss}
            style={styles.dismissButton}
            accessibilityLabel="Dismiss"
            accessibilityRole="button"
          >
            <X size={16} color={tokens.colors.textMuted} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 10,
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
  },
  dismissButton: {
    padding: 4,
  },
});

export default ErrorBanner;
