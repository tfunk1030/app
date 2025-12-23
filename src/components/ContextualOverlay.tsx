import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import { gradients, boldColors } from '@/src/theme/gradients';
import { animationPresets, durations } from '@/src/theme/animations';
import { scaledFontSize, getScrollPadding, moderateScale } from '@/src/utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { LucideIcon, X, Info, HelpCircle, Settings, Shield } from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type OverlayVariant = 'default' | 'info' | 'help' | 'settings' | 'permissions';

interface ContextualOverlayProps {
  /** Whether the overlay is visible */
  visible: boolean;
  /** Callback when overlay is dismissed */
  onClose: () => void;
  /** Title displayed at the top of the overlay */
  title: string;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Content to display in the overlay */
  children: React.ReactNode;
  /** Visual variant for different contexts */
  variant?: OverlayVariant;
  /** Optional custom icon */
  icon?: LucideIcon;
  /** Additional styles for the content container */
  contentStyle?: ViewStyle;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Maximum height as percentage of screen (0-1) */
  maxHeightPercent?: number;
}

/**
 * ContextualOverlay - Modern overlay component with Bold & Colorful design
 *
 * Replaces navigation-heavy information architecture with contextual modals.
 * Uses gradient backgrounds, smooth animations, and gesture-based dismissal.
 *
 * @example
 * // Basic usage
 * <ContextualOverlay
 *   visible={showHelp}
 *   onClose={() => setShowHelp(false)}
 *   title="How to Use"
 *   variant="help"
 * >
 *   <Text>Help content here...</Text>
 * </ContextualOverlay>
 *
 * @example
 * // With custom content
 * <ContextualOverlay
 *   visible={showSettings}
 *   onClose={handleClose}
 *   title="Advanced Settings"
 *   variant="settings"
 *   maxHeightPercent={0.7}
 * >
 *   <SettingsContent />
 * </ContextualOverlay>
 */
export const ContextualOverlay: React.FC<ContextualOverlayProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  variant = 'default',
  icon,
  contentStyle,
  showCloseButton = true,
  maxHeightPercent = 0.8,
}) => {
  const t = useTokens();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark' || mode === 'system';
  const padding = getScrollPadding(20, { minPadding: 16, maxPadding: 24 });

  // Animation values
  const overlayOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(50);
  const contentScale = useSharedValue(0.95);

  // Get icon based on variant
  const getIcon = (): LucideIcon => {
    if (icon) return icon;
    switch (variant) {
      case 'info':
        return Info;
      case 'help':
        return HelpCircle;
      case 'settings':
        return Settings;
      case 'permissions':
        return Shield;
      default:
        return Info;
    }
  };

  // Get accent color based on variant
  const getAccentColor = (): string => {
    switch (variant) {
      case 'info':
        return boldColors.cyan;
      case 'help':
        return boldColors.amber;
      case 'settings':
        return boldColors.violet;
      case 'permissions':
        return boldColors.emerald;
      default:
        return boldColors.emerald;
    }
  };

  // Get header gradient based on variant
  const getHeaderGradient = (): readonly [string, string, ...string[]] => {
    switch (variant) {
      case 'info':
        return ['rgba(6, 182, 212, 0.2)', 'rgba(6, 182, 212, 0.05)'];
      case 'help':
        return ['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.05)'];
      case 'settings':
        return ['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.05)'];
      case 'permissions':
        return ['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.05)'];
      default:
        return ['rgba(16, 185, 129, 0.2)', 'rgba(6, 182, 212, 0.05)'];
    }
  };

  // Animate in when visible
  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, {
        duration: durations.overlay,
      });
      contentTranslateY.value = withSpring(0, animationPresets.spring.snappy);
      contentScale.value = withSpring(1, animationPresets.spring.snappy);
    } else {
      overlayOpacity.value = withTiming(0, { duration: durations.fast });
      contentTranslateY.value = withTiming(50, { duration: durations.fast });
      contentScale.value = withTiming(0.95, { duration: durations.fast });
    }
  }, [visible, overlayOpacity, contentTranslateY, contentScale]);

  // Handle backdrop press
  const handleBackdropPress = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics not available
    }
    onClose();
  }, [onClose]);

  // Handle close button press
  const handleClosePress = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics not available
    }
    onClose();
  }, [onClose]);

  // Animated styles
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: contentTranslateY.value },
      { scale: contentScale.value },
    ],
    opacity: overlayOpacity.value,
  }));

  const IconComponent = getIcon();
  const accentColor = getAccentColor();

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
        <Pressable style={styles.backdropPressable} onPress={handleBackdropPress}>
          <LinearGradient
            colors={gradients.overlay.modal as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Pressable>
      </Animated.View>

      {/* Content Container */}
      <View style={styles.contentWrapper} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.content,
            {
              maxHeight: SCREEN_HEIGHT * maxHeightPercent,
              backgroundColor: isDark ? boldColors.slate800 : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              shadowColor: t.colors.shadow,
            },
            contentAnimatedStyle,
          ]}
        >
          {/* Header with gradient */}
          <LinearGradient
            colors={getHeaderGradient() as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingHorizontal: padding }]}
          >
            {/* Icon */}
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${accentColor}20` },
              ]}
            >
              <IconComponent size={24} color={accentColor} strokeWidth={2} />
            </View>

            {/* Title and Subtitle */}
            <View style={styles.titleContainer}>
              <Text
                style={[
                  styles.title,
                  {
                    color: isDark ? t.colors.textPrimary : boldColors.slate900,
                    fontSize: scaledFontSize(18),
                  },
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
              {subtitle && (
                <Text
                  style={[
                    styles.subtitle,
                    {
                      color: isDark ? t.colors.textMuted : boldColors.slate700,
                      fontSize: scaledFontSize(13),
                    },
                  ]}
                  numberOfLines={2}
                >
                  {subtitle}
                </Text>
              )}
            </View>

            {/* Close Button */}
            {showCloseButton && (
              <Pressable
                style={[
                  styles.closeButton,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' },
                ]}
                onPress={handleClosePress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X
                  size={18}
                  color={isDark ? t.colors.textMuted : boldColors.slate700}
                  strokeWidth={2.5}
                />
              </Pressable>
            )}
          </LinearGradient>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { padding },
              contentStyle,
            ]}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {children}
          </ScrollView>

          {/* Bottom accent line */}
          <LinearGradient
            colors={[accentColor, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bottomAccent}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

/**
 * OverlaySection - Helper component for organizing overlay content
 */
interface OverlaySectionProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const OverlaySection: React.FC<OverlaySectionProps> = ({
  title,
  children,
  style,
}) => {
  const t = useTokens();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark' || mode === 'system';

  return (
    <View style={[styles.section, style]}>
      {title && (
        <Text
          style={[
            styles.sectionTitle,
            {
              color: isDark ? boldColors.emeraldLight : boldColors.emeraldDark,
              fontSize: scaledFontSize(12),
            },
          ]}
        >
          {title.toUpperCase()}
        </Text>
      )}
      {children}
    </View>
  );
};

/**
 * OverlayItem - Helper component for list items in overlays
 */
interface OverlayItemProps {
  icon?: LucideIcon;
  label: string;
  value?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export const OverlayItem: React.FC<OverlayItemProps> = ({
  icon: IconComponent,
  label,
  value,
  onPress,
  style,
}) => {
  const t = useTokens();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark' || mode === 'system';

  const content = (
    <View
      style={[
        styles.item,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        },
        style,
      ]}
    >
      {IconComponent && (
        <IconComponent
          size={18}
          color={isDark ? t.colors.textMuted : boldColors.slate700}
          strokeWidth={2}
        />
      )}
      <Text
        style={[
          styles.itemLabel,
          {
            color: isDark ? t.colors.textPrimary : boldColors.slate900,
            fontSize: scaledFontSize(14),
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {value && (
        <Text
          style={[
            styles.itemValue,
            {
              color: isDark ? t.colors.textMuted : boldColors.slate700,
              fontSize: scaledFontSize(14),
            },
          ]}
          numberOfLines={1}
        >
          {value}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropPressable: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    lineHeight: 18,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingTop: 0,
  },
  bottomAccent: {
    height: 3,
    width: '100%',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  itemLabel: {
    flex: 1,
    fontWeight: '500',
  },
  itemValue: {
    fontWeight: '400',
  },
});
