/**
 * ResultCard.tsx
 *
 * A reusable card component for displaying calculation results
 * with consistent styling and layout.
 */

import { GlassCard } from '@/src/core/components/ui/GlassCard';
import { SectionHeader } from '@/src/core/components/ui/SectionHeader';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface ResultCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  title?: string;
  showHeader?: boolean;
}

export function ResultCard({
  children,
  style,
  title = 'Results',
  showHeader = true,
}: ResultCardProps) {
  return (
    <GlassCard style={StyleSheet.flatten([styles.resultsCard, style])}>
      {showHeader && <SectionHeader title={title} />}
      <View style={styles.resultsContent}>{children}</View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  resultsCard: {
    marginTop: 16,
  },
  resultsContent: {
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
});
