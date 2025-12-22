/**
 * ClubRecommendation.tsx
 *
 * A component that displays club recommendation information
 * including club changes and convergence details.
 */

import { useTokens } from '@/src/theme/useTokens';
import type { Tokens } from '@/src/theme/tokens';
import { safeScaledFontSize } from '@/src/utils/responsive';
import React, { memo, useMemo } from 'react';
import { Text, View } from 'react-native';

interface ClubRecommendationProps {
  recommendedClub: string;
  initialClub: string;
  clubChange: boolean;
  iterations: number;
  convergedReason: string;
}

/**
 * Creates memoized token-based styles for ClubRecommendation
 * Follows same pattern as GlassCard, MetricTile, Button components
 */
function createStyles(t: Tokens) {
  return {
    clubRecommendation: {
      backgroundColor: t.colors.surface,
      borderRadius: t.borderRadius.lg, // 12
      padding: t.spacing.base, // 12
      marginVertical: t.spacing.base, // 12
      borderWidth: t.borderWidth.thin, // 1
      borderColor: t.colors.border,
    },
    recommendationText: {
      fontSize: safeScaledFontSize(t.fontSize.base, { maxScale: 1.25 }), // 16
      color: t.colors.textPrimary,
      marginBottom: t.spacing.xs, // 4
      textAlign: 'center' as const,
    },
    clubName: {
      fontWeight: t.fontWeight.bold, // '700'
      color: t.colors.brand,
    },
    clubChangeText: {
      fontSize: safeScaledFontSize(t.fontSize.xs + 1, { maxScale: 1.2 }), // 13
      color: t.colors.textMuted,
      marginTop: t.spacing.xs, // 4
      fontStyle: 'italic' as const,
      textAlign: 'center' as const,
    },
    iterationText: {
      fontSize: safeScaledFontSize(t.fontSize.xs, { maxScale: 1.2 }), // 12
      color: t.colors.textMuted,
      marginTop: t.spacing.sm, // 8
      textAlign: 'center' as const,
    },
    convergenceText: {
      fontSize: safeScaledFontSize(t.fontSize.xs, { maxScale: 1.2 }), // 12
      color: t.colors.textMuted,
      marginTop: 2, // Small gap between related text items
      fontStyle: 'italic' as const,
      textAlign: 'center' as const,
    },
  } as const;
}

export const ClubRecommendation = memo(function ClubRecommendation({
  recommendedClub,
  initialClub,
  clubChange,
  iterations,
  convergedReason,
}: ClubRecommendationProps) {
  const t = useTokens();
  const styles = useMemo(() => createStyles(t), [t]);

  const readableConvergenceReason = useMemo(() => {
    switch (convergedReason) {
      case 'distance_threshold':
        return 'Distance change below threshold';
      case 'club_stable':
        return 'Club selection stabilized';
      case 'no_club_recommendation':
        return 'No club recommendation for calculated distance';
      case 'max_iterations':
        return 'Maximum iterations reached';
      default:
        return convergedReason || 'Unknown';
    }
  }, [convergedReason]);

  const iterationText = useMemo(() => {
    return `Calculation converged after ${iterations} ${
      iterations === 1 ? 'iteration' : 'iterations'
    }`;
  }, [iterations]);

  const clubChangeText = useMemo(() => {
    if (!clubChange) return null;
    return `Initial club (${initialClub}) adjusted due to wind effect`;
  }, [clubChange, initialClub]);

  const recommendedClubAccessibilityLabel = useMemo(() => {
    return `Recommended club: ${recommendedClub}`;
  }, [recommendedClub]);

  return (
    <View style={styles.clubRecommendation}>
      <Text
        style={styles.recommendationText}
        accessibilityRole="text"
        accessibilityLabel={recommendedClubAccessibilityLabel}
      >
        Recommended Club: <Text style={styles.clubName}>{recommendedClub}</Text>
      </Text>

      {clubChange && (
        <Text
          style={styles.clubChangeText}
          accessibilityLabel={`Initial club ${initialClub} adjusted due to wind effect`}
        >
          {clubChangeText}
        </Text>
      )}

      <Text style={styles.iterationText}>{iterationText}</Text>
      <Text style={styles.convergenceText}>{`Reason: ${readableConvergenceReason}`}</Text>
    </View>
  );
});

ClubRecommendation.displayName = 'ClubRecommendation';
