/**
 * ResultCard.tsx
 *
 * A reusable card component for displaying calculation results
 * with consistent styling and layout.
 */

import { BoldCard } from '@/src/core/components/ui/BoldCard';
import { SectionHeader } from '@/src/core/components/ui/SectionHeader';
import { useTokens } from '@/src/theme/useTokens';
import type { Tokens } from '@/src/theme/tokens';
import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface ResultCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  title?: string;
  showHeader?: boolean;
}

/**
 * Creates memoized token-based styles for ResultCard
 * Follows same pattern as GlassCard, MetricTile, Button components
 */
function createStyles(t: Tokens) {
  return {
    resultsCard: {
      marginTop: t.spacing.md, // 16 - consistent card margin
    },
    resultsContent: {
      paddingHorizontal: t.spacing.xs, // 4 - minimal horizontal padding
      paddingBottom: t.spacing.xs, // 4 - minimal bottom padding
    },
  } as const;
}

export function ResultCard({
  children,
  style,
  title = 'Results',
  showHeader = true,
}: ResultCardProps) {
  const t = useTokens();
  const styles = useMemo(() => createStyles(t), [t]);

  return (
    <BoldCard variant="elevated" style={StyleSheet.flatten([styles.resultsCard, style])}>
      {showHeader && <SectionHeader title={title} />}
      <View style={styles.resultsContent}>{children}</View>
    </BoldCard>
  );
}
