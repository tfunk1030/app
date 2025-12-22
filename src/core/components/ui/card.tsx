import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import {
  safeScaledFontSize,
  getOptimalNumberOfLines,
  getScrollPadding,
  getResponsiveSpacing
} from '@/src/utils/responsive';
import * as React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface CardViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface CardTextProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export const Card = ({ children, style }: CardProps) => {
  const t = useTokens();
  const { mode } = useThemeMode();

  // Use same border radius as GlassCard for consistency
  const cardBorderRadius = t.borderRadius.xl; // 16

  return (
    <View
      style={[
        {
          borderRadius: cardBorderRadius,
          borderWidth: t.borderWidth.thin,
          overflow: 'hidden',
          backgroundColor: mode === 'dark' ? t.colors.surface : t.colors.surfaceAlt,
          borderColor: t.colors.border,
          shadowColor: t.colors.shadow,
          shadowOffset: t.shadow.card.shadowOffset,
          shadowOpacity: t.shadow.card.shadowOpacity,
          shadowRadius: t.shadow.card.shadowRadius,
          elevation: t.shadow.card.elevation,
          marginVertical: getResponsiveSpacing(t.spacing.sm, 'vertical'),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export const CardHeader = ({ children, style }: CardViewProps) => {
  const t = useTokens();
  const padding = getScrollPadding(t.spacing.md, { minPadding: t.spacing.base, maxPadding: 20 });

  return (
    <View
      style={[
        styles.header,
        {
          borderBottomColor: t.colors.border,
          padding: padding,
        },
        style
      ]}
    >
      {children}
    </View>
  );
};

export const CardTitle = ({ children, style }: CardTextProps) => {
  const t = useTokens();
  return (
    <Text
      style={[
        styles.title,
        {
          color: t.colors.textPrimary,
          fontSize: safeScaledFontSize(t.fontSize.xl, { maxScale: 1.25 }),
        },
        style,
      ]}
      numberOfLines={getOptimalNumberOfLines(1, { maxLines: 2 })}
      adjustsFontSizeToFit
      minimumFontScale={0.85}
    >
      {children}
    </Text>
  );
};

export const CardDescription = ({ children, style }: CardTextProps) => {
  const t = useTokens();
  return (
    <Text
      style={[
        styles.description,
        {
          color: t.colors.textMuted,
          fontSize: safeScaledFontSize(t.fontSize.sm),
          marginTop: getResponsiveSpacing(t.spacing.xs, 'vertical'),
        },
        style,
      ]}
      numberOfLines={getOptimalNumberOfLines(2, { maxLines: 3 })}
      adjustsFontSizeToFit
      minimumFontScale={0.85}
    >
      {children}
    </Text>
  );
};

export const CardContent = ({ children, style }: CardViewProps) => {
  const t = useTokens();
  const padding = getScrollPadding(t.spacing.md, { minPadding: t.spacing.base, maxPadding: 20 });

  return (
    <View style={[styles.content, { padding: padding }, style]}>
      {children}
    </View>
  );
};

export const CardFooter = ({ children, style }: CardViewProps) => {
  const t = useTokens();
  const padding = getScrollPadding(t.spacing.md, { minPadding: t.spacing.base, maxPadding: 20 });
  const gap = getResponsiveSpacing(t.spacing.sm, 'horizontal');

  return (
    <View
      style={[
        styles.footer,
        {
          borderTopColor: t.colors.border,
          padding: padding,
          gap: gap,
        },
        style
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  // Note: Card styles are now applied inline using token values for consistency with GlassCard
  header: {
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: '600',
  },
  description: {},
  content: {},
  footer: {
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});