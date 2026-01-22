import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import { getScrollPadding, getFlexibleMinHeight } from '@/src/utils/responsive';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: boolean; // kept for API compatibility (no-op)
  intensity?: number; // kept for API compatibility (no-op)
  accent?: boolean; // optional top accent bar
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, accent = false }) => {
  const t = useTokens();
  const { mode } = useThemeMode();
  const padding = getScrollPadding(16, { minPadding: 12, maxPadding: 20 });
  
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
          minHeight: getFlexibleMinHeight(60), // Flexible minimum height
        },
        style,
      ]}
    >
      {accent && <View style={[styles.accent, { backgroundColor: t.colors.brandAlt }]} />}
      <View style={[styles.inner, { padding: padding }]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  accent: {
    height: 4,
    width: '100%',
  },
  inner: {},
});