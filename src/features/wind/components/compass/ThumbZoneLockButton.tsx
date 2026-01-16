/**
 * ThumbZoneLockButton Component
 *
 * Large edge-mounted lock buttons positioned for one-handed use.
 * Positioned in the thumb zone on either edge of the screen.
 */
import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTokens } from '@/src/theme/useTokens';
import type { Tokens } from '@/src/theme/tokens';

/**
 * Button dimensions based on Apple HIG touch target requirements.
 * Minimum 44pt on iOS (React Native units map to pt on iOS, dp on Android).
 * Sized larger for outdoor/glove use as per project requirements (48dp minimum).
 *
 * Effective touch targets (with hitSlop):
 * - Width: 56 + 8 + 8 = 72pt (exceeds 44pt minimum)
 * - Height: 80 + 12 + 12 = 104pt (exceeds 44pt minimum)
 */
const BUTTON_WIDTH = 56;
const BUTTON_HEIGHT = 80;

interface ThumbZoneLockButtonProps {
  /** Which side of the screen the button appears on */
  side: 'left' | 'right';
  /** Current lock state */
  isLocked: boolean;
  /** Callback when button is pressed */
  onPress: () => void;
  /** Optional accessibility label override */
  accessibilityLabel?: string;
}

export function ThumbZoneLockButton({
  side,
  isLocked,
  onPress,
  accessibilityLabel,
}: ThumbZoneLockButtonProps) {
  const t = useTokens();
  const styles = createStyles(t);

  const handlePress = async () => {
    if (!isLocked) {
      // Locking - medium impact then success notification
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 100);
    } else {
      // Unlocking - light impact
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      style={[
        styles.button,
        side === 'left' ? styles.left : styles.right,
        {
          backgroundColor: isLocked ? t.colors.success : t.colors.surfaceAlt,
          borderColor: isLocked ? t.colors.success : t.colors.border,
        },
      ]}
      onPress={handlePress}
      hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel || (isLocked ? 'Unlock compass' : 'Lock compass direction')
      }
      accessibilityHint="Locks the shot direction for wind calculations"
    >
      <MaterialCommunityIcons
        name={isLocked ? 'lock' : 'lock-open-variant'}
        size={28}
        color={isLocked ? t.colors.surface : t.colors.textPrimary}
      />
    </Pressable>
  );
}

ThumbZoneLockButton.displayName = 'ThumbZoneLockButton';

/** Creates token-based styles for the lock button */
const createStyles = (t: Tokens) =>
  StyleSheet.create({
    button: {
      position: 'absolute',
      bottom: t.spacing['5xl'], // 120 - above tab bar
      width: BUTTON_WIDTH,
      height: BUTTON_HEIGHT,
      borderRadius: BUTTON_WIDTH / 2, // 28 - creates pill shape
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      // Shadow
      shadowColor: t.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: t.spacing.sm, // 8
      elevation: 4,
    } as ViewStyle,
    left: {
      left: t.spacing.sm, // 8
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
    } as ViewStyle,
    right: {
      right: t.spacing.sm, // 8
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
    } as ViewStyle,
  });

export default ThumbZoneLockButton;
