/**
 * PageTitle Component
 *
 * Clean H1/Screen Title aligned with brand typography.
 */

import { useTokens } from '@/src/theme/useTokens';
import { scaledFontSize } from '@/src/utils/responsive';
import React from 'react';
import { Platform, StatusBar, StyleSheet, Text, View } from 'react-native';

interface PageTitleProps {
  title: string;
  variant?: 'default' | 'large' | 'small';
  showBackground?: boolean; // kept for API compatibility (no-op)
  showGlow?: boolean; // kept for API compatibility (no-op)
  showGradient?: boolean; // kept for API compatibility (no-op)
  animate?: boolean; // kept for API compatibility (no-op)
}

export const PageTitle: React.FC<PageTitleProps> = ({ title, variant = 'default' }) => {
  const t = useTokens();
  const base = variant === 'large' ? 28 : variant === 'small' ? 22 : 24;
  const fontSize = scaledFontSize(base);

  const topPad = Platform.OS === 'ios' ? 8 : (StatusBar.currentHeight || 0) * 0.25;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <Text style={[styles.title, { fontSize, color: t.colors.textPrimary }]} numberOfLines={2} adjustsFontSizeToFit>
        {title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
