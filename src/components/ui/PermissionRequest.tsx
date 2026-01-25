/**
 * PermissionRequest.tsx
 *
 * A component that displays a permission request UI with explanation
 * and handles the permission request flow.
 */

import { Button } from '@/src/core/components/ui/button';
import { useTokens } from '@/src/theme/useTokens';
import {
  hasPermission,
  PermissionState,
  PermissionType,
  requestPermission,
} from '@/src/utils/permissions';
import { scaledFontSize } from '@/src/utils/responsive';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';

// Permission icons
const PERMISSION_ICONS: Record<PermissionType, ImageSourcePropType> = {
  [PermissionType.LOCATION]: require('@/assets/icons/location.png'),
  [PermissionType.COMPASS]: require('@/assets/icons/compass.png'),
  [PermissionType.NOTIFICATIONS]: require('@/assets/icons/notification.png'),
};

// Permission descriptions
const PERMISSION_DESCRIPTIONS: Record<PermissionType, string> = {
  [PermissionType.LOCATION]:
    'We need your location to provide accurate wind calculations based on your current position.',
  [PermissionType.COMPASS]:
    'The compass is used to determine wind direction relative to your shot direction.',
  [PermissionType.NOTIFICATIONS]:
    "We'll send you notifications about weather changes that might affect your game.",
};

interface PermissionRequestProps {
  type: PermissionType;
  onGranted: () => void;
  onDenied: () => void;
  explanation?: string;
  showSkip?: boolean;
  onSkip?: () => void;
}

export function PermissionRequest({
  type,
  onGranted,
  onDenied,
  explanation,
  showSkip = false,
  onSkip,
}: PermissionRequestProps) {
  const t = useTokens();
  const [permissionState, setPermissionState] = useState<PermissionState>(
    PermissionState.UNDETERMINED
  );
  const [isChecking, setIsChecking] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);

  // Generate theme-aware styles
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: t.spacing.xl,
          backgroundColor: t.colors.overlay,
        },
        card: {
          backgroundColor: t.colors.surfaceAlt,
          borderRadius: t.borderRadius.xl,
          padding: t.spacing['2xl'],
          width: '100%',
          maxWidth: 400,
          borderWidth: 1,
          borderColor: t.colors.border,
          shadowColor: t.colors.shadow,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 3,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: t.spacing.md,
        },
        icon: {
          width: 32,
          height: 32,
          marginRight: t.spacing.base,
        },
        title: {
          fontSize: scaledFontSize(20),
          fontWeight: '700',
          color: t.colors.textPrimary,
        },
        description: {
          fontSize: scaledFontSize(16),
          color: t.colors.textMuted,
          marginBottom: t.spacing['2xl'],
          lineHeight: 24,
        },
        buttonContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        allowButton: {
          flex: 1,
          backgroundColor: t.colors.brand,
          padding: t.spacing.base,
          borderRadius: t.borderRadius.lg,
          marginRight: t.spacing.sm,
        },
        allowButtonText: {
          color: t.colors.onBrand,
          fontSize: scaledFontSize(16),
          fontWeight: '600',
          textAlign: 'center',
        },
        skipButton: {
          flex: 1,
          backgroundColor: t.colors.surface,
          padding: t.spacing.base,
          borderRadius: t.borderRadius.lg,
          borderWidth: 1,
          borderColor: t.colors.brand,
          marginLeft: t.spacing.sm,
        },
        skipButtonText: {
          color: t.colors.brand,
          fontSize: scaledFontSize(16),
          fontWeight: '600',
          textAlign: 'center',
        },
        deniedMessage: {
          marginTop: t.spacing.md,
          color: t.colors.danger,
          fontSize: scaledFontSize(14),
          textAlign: 'center',
        },
      }),
    [t]
  );

  useEffect(() => {
    const checkPermission = async () => {
      setIsChecking(true);
      try {
        const granted = await hasPermission(type);
        if (granted) {
          setPermissionState(PermissionState.GRANTED);
          onGranted();
        } else {
          setPermissionState(PermissionState.UNDETERMINED);
        }
      } catch (error) {
        console.error(`Error checking ${type} permission:`, error);
        setPermissionState(PermissionState.UNDETERMINED);
      } finally {
        setIsChecking(false);
      }
    };

    checkPermission();
  }, [type, onGranted]);

  const handleRequestPermission = useCallback(async () => {
    setIsRequesting(true);
    try {
      const result = await requestPermission(type);
      setPermissionState(result);

      if (result === PermissionState.GRANTED) {
        onGranted();
      } else {
        onDenied();
      }
    } catch (error) {
      console.error(`Error requesting ${type} permission:`, error);
      setPermissionState(PermissionState.DENIED);
      onDenied();
    } finally {
      setIsRequesting(false);
    }
  }, [type, onGranted, onDenied]);

  const handleSkip = useCallback(() => {
    if (onSkip) {
      onSkip();
    } else {
      onDenied();
    }
  }, [onSkip, onDenied]);

  if (permissionState === PermissionState.GRANTED || isChecking) {
    return null;
  }

  return (
    <View style={styles.container} accessibilityRole="alert">
      <View style={styles.card}>
        <View style={styles.header}>
          <Image
            source={PERMISSION_ICONS[type]}
            style={styles.icon}
            accessibilityLabel={`${type} permission icon`}
          />
          <Text style={styles.title}>{`${
            type.charAt(0).toUpperCase() + type.slice(1)
          } Permission`}</Text>
        </View>

        <Text style={styles.description}>{explanation || PERMISSION_DESCRIPTIONS[type]}</Text>

        <View style={styles.buttonContainer}>
          <Button
            onPress={handleRequestPermission}
            disabled={isRequesting}
            style={styles.allowButton}
            accessibilityLabel={`Allow ${type} permission`}
            accessibilityHint={`Grants the app permission to use your ${type}`}
          >
            <Text style={styles.allowButtonText}>{isRequesting ? 'Requesting...' : 'Allow'}</Text>
          </Button>

          {showSkip && (
            <Button
              onPress={handleSkip}
              disabled={isRequesting}
              variant="secondary"
              style={styles.skipButton}
              accessibilityLabel={`Skip ${type} permission`}
              accessibilityHint={`Continues without ${type} permission`}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </Button>
          )}
        </View>

        {permissionState === PermissionState.DENIED && (
          <Text style={styles.deniedMessage}>
            Permission was denied. Some features may not work correctly.
          </Text>
        )}
      </View>
    </View>
  );
}

