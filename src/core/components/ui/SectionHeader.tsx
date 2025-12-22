import { useTokens } from '@/src/theme/useTokens';
import {
  safeScaledFontSize,
  getOptimalNumberOfLines,
  getResponsiveSpacing,
  getScrollPadding
} from '@/src/utils/responsive';
import React, { useMemo } from 'react';
import { Text, View, ViewStyle } from 'react-native';

interface SectionHeaderProps {
  title: string;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, style }) => {
  const t = useTokens();

  // Memoized dynamic styles using tokens
  const styles = useMemo(() => ({
    container: {
      width: '100%' as const,
      paddingHorizontal: getResponsiveSpacing(t.spacing.xs, 'horizontal'), // 4px from token
      marginBottom: getResponsiveSpacing(t.spacing.sm, 'vertical'), // 8px from token
    },
    pill: {
      alignSelf: 'flex-start' as const,
      borderRadius: t.borderRadius.full, // 9999 - consistent pill shape
      borderWidth: t.borderWidth.thin, // 1px from token
      borderColor: t.colors.border,
      backgroundColor: t.colors.surfaceAlt,
      paddingVertical: getScrollPadding(t.spacing.xs, {
        minPadding: t.spacing.xs - 1, // 3px
        maxPadding: t.spacing.xs + 2, // 6px
      }),
      paddingHorizontal: getScrollPadding(t.spacing.sm + 2, {
        minPadding: t.spacing.sm, // 8px
        maxPadding: t.spacing.sm + 6, // 14px
      }),
    },
    title: {
      color: t.colors.textPrimary,
      fontSize: safeScaledFontSize(t.fontSize.xs, { maxScale: 1.15 }), // 12px from token
      fontWeight: t.fontWeight.bold, // '700' from token
      letterSpacing: t.letterSpacing.wide, // 0.6 from token
      maxWidth: 240,
    },
  }), [
    t.spacing.xs,
    t.spacing.sm,
    t.borderRadius.full,
    t.borderWidth.thin,
    t.colors.border,
    t.colors.surfaceAlt,
    t.colors.textPrimary,
    t.fontSize.xs,
    t.fontWeight.bold,
    t.letterSpacing.wide,
  ]);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.pill}>
        <Text
          style={styles.title}
          numberOfLines={getOptimalNumberOfLines(1, { maxLines: 2 })}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
        >
          {title.toUpperCase()}
        </Text>
      </View>
    </View>
  );
};