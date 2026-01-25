/**
 * ClubRecommendation.tsx
 *
 * A component that displays club recommendation information
 * including club changes and convergence details.
 */

import { useTokens as useThemeTokens } from '@/src/theme/useTokens';
import { scaledFontSize } from '@/src/utils/responsive';
import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ClubRecommendationProps {
  recommendedClub: string;
  initialClub: string;
  clubChange: boolean;
  iterations: number;
  convergedReason: string;
}

export const ClubRecommendation = memo(function ClubRecommendation({
  recommendedClub,
  initialClub,
  clubChange,
  iterations,
  convergedReason,
}: ClubRecommendationProps) {
  const palette = useThemeTokens();
  const styles = React.useMemo(() => getThemedStyles(palette), [palette]);
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

function getThemedStyles(palette: ReturnType<typeof useThemeTokens>) {
  return StyleSheet.create({
    clubRecommendation: {
      backgroundColor: palette.colors.surface,
      borderRadius: 12,
      padding: 12,
      marginVertical: 12,
      borderWidth: 1,
      borderColor: palette.colors.border,
    },
    recommendationText: {
      fontSize: scaledFontSize(16),
      color: palette.colors.textPrimary,
      marginBottom: 4,
      textAlign: 'center',
    },
    clubName: {
      fontWeight: '700',
      color: palette.colors.brand,
    },
    clubChangeText: {
      fontSize: scaledFontSize(13),
      color: palette.colors.textMuted,
      marginTop: 4,
      fontStyle: 'italic',
      textAlign: 'center',
    },
    iterationText: {
      fontSize: scaledFontSize(12),
      color: palette.colors.textMuted,
      marginTop: 8,
      textAlign: 'center',
    },
    convergenceText: {
      fontSize: scaledFontSize(12),
      color: palette.colors.textMuted,
      marginTop: 2,
      fontStyle: 'italic',
      textAlign: 'center',
    },
  });
}
