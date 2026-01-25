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
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: mode === 'dark' ? t.colors.surface : t.colors.surfaceAlt,
          borderColor: t.colors.border,
          shadowColor: t.colors.shadow,
          shadowOffset: t.shadow.card.shadowOffset,
          shadowOpacity: t.shadow.card.shadowOpacity,
          shadowRadius: t.shadow.card.shadowRadius,
          elevation: t.shadow.card.elevation,
          marginVertical: getResponsiveSpacing(8, 'vertical'),
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
  const padding = getScrollPadding(16, { minPadding: 12, maxPadding: 20 });
  
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
          fontSize: safeScaledFontSize(22, { maxScale: 1.25 }),
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
          fontSize: safeScaledFontSize(14),
          marginTop: getResponsiveSpacing(4, 'vertical'),
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
  const padding = getScrollPadding(16, { minPadding: 12, maxPadding: 20 });
  
  return (
    <View style={[styles.content, { padding: padding }, style]}>
      {children}
    </View>
  );
};

export const CardFooter = ({ children, style }: CardViewProps) => {
  const t = useTokens();
  const padding = getScrollPadding(16, { minPadding: 12, maxPadding: 20 });
  const gap = getResponsiveSpacing(8, 'horizontal');
  
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
  card: {
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
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