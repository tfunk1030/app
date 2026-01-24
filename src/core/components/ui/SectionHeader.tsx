import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import { gradients, boldColors } from '@/src/theme/gradients';
import {
  safeScaledFontSize,
  getOptimalNumberOfLines,
  getResponsiveSpacing,
  getScrollPadding
} from '@/src/utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface SectionHeaderProps {
  title: string;
  style?: ViewStyle;
  /** Optional accent variant for different gradient colors */
  variant?: 'default' | 'cyan' | 'amber' | 'violet';
}

/**
 * SectionHeader - Bold & Colorful section header with gradient styling
 *
 * Displays a pill-shaped header with gradient background for section titles.
 * Uses the gradient system for consistent theming across the app.
 *
 * @example
 * <SectionHeader title="Club Settings" />
 *
 * @example
 * // With custom variant
 * <SectionHeader title="Wind Data" variant="cyan" />
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  style,
  variant = 'default'
}) => {
  const t = useTokens();
  const { isDark } = useThemeMode();

  // Get gradient colors based on variant
  const getGradientColors = (): readonly [string, string, ...string[]] => {
    if (isDark) {
      switch (variant) {
        case 'cyan':
          return [
            'rgba(6, 182, 212, 0.2)',
            'rgba(6, 182, 212, 0.1)'
          ];
        case 'amber':
          return [
            'rgba(245, 158, 11, 0.2)',
            'rgba(245, 158, 11, 0.1)'
          ];
        case 'violet':
          return [
            'rgba(139, 92, 246, 0.2)',
            'rgba(139, 92, 246, 0.1)'
          ];
        default:
          return [
            'rgba(16, 185, 129, 0.2)',
            'rgba(6, 182, 212, 0.15)'
          ];
      }
    }
    // Light mode - subtle gradient backgrounds
    return gradients.surface.highlight;
  };

  // Get border color based on variant
  const getBorderColor = (): string => {
    if (!isDark) return t.colors.border;
    switch (variant) {
      case 'cyan':
        return 'rgba(6, 182, 212, 0.3)';
      case 'amber':
        return 'rgba(245, 158, 11, 0.3)';
      case 'violet':
        return 'rgba(139, 92, 246, 0.3)';
      default:
        return 'rgba(16, 185, 129, 0.3)';
    }
  };

  // Get text color based on variant
  const getTextColor = (): string => {
    if (!isDark) return t.colors.textPrimary;
    switch (variant) {
      case 'cyan':
        return boldColors.cyanLight;
      case 'amber':
        return boldColors.amberLight;
      case 'violet':
        return boldColors.purple;
      default:
        return boldColors.emeraldLight;
    }
  };

  // Memoized dynamic styles using tokens
  const dynamicStyles = useMemo(() => ({
    container: {
      paddingHorizontal: getResponsiveSpacing(t.spacing.xs, 'horizontal'),
      marginBottom: getResponsiveSpacing(t.spacing.sm, 'vertical'),
    },
    pill: {
      borderColor: getBorderColor(),
      paddingVertical: getScrollPadding(t.spacing.xs, {
        minPadding: t.spacing.xs - 1,
        maxPadding: t.spacing.xs + 2,
      }),
      paddingHorizontal: getScrollPadding(t.spacing.sm + 2, {
        minPadding: t.spacing.sm,
        maxPadding: t.spacing.sm + 6,
      }),
    },
    title: {
      color: getTextColor(),
      fontSize: safeScaledFontSize(t.fontSize.xs, { maxScale: 1.15 }),
      fontWeight: t.fontWeight.bold,
      letterSpacing: t.letterSpacing.wide,
    },
  }), [
    t.spacing.xs,
    t.spacing.sm,
    t.colors.border,
    t.colors.textPrimary,
    t.fontSize.xs,
    t.fontWeight.bold,
    t.letterSpacing.wide,
    variant,
    isDark,
  ]);

  return (
    <View style={[
      styles.container,
      dynamicStyles.container,
      style
    ]}>
      <View style={styles.pillWrapper}>
        <LinearGradient
          colors={getGradientColors() as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.pill,
            dynamicStyles.pill
          ]}
        >
          <Text
            style={[
              styles.title,
              dynamicStyles.title
            ]}
            numberOfLines={getOptimalNumberOfLines(1, { maxLines: 2 })}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {title.toUpperCase()}
          </Text>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  pillWrapper: {
    alignSelf: 'flex-start',
  },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  title: {
    maxWidth: 240,
  },
});