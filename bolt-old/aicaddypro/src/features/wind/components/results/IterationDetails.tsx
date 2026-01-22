/**
 * IterationDetails.tsx
 *
 * A component that displays detailed iteration information
 * with a collapsible interface for progressive disclosure.
 */

import { useTokens as useThemeTokens } from '@/src/theme/useTokens';
import { scaledFontSize } from '@/src/utils/responsive';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface IterationDetailsProps {
  iterationSummary?: string;
}

export const IterationDetails = memo(function IterationDetails({
  iterationSummary,
}: IterationDetailsProps) {
  const palette = useThemeTokens();
  const styles = React.useMemo(() => getThemedStyles(palette), [palette]);
  const [showDetails, setShowDetails] = useState(false);

  if (!iterationSummary) {
    return null;
  }

  const toggleDetails = useCallback(() => {
    setShowDetails(prev => !prev);
  }, []);

  const iterationDetailsAccessibilityLabel = useMemo(() => {
    if (!iterationSummary) return '';
    return `Iteration details: ${iterationSummary.replace(/\n/g, ', ')}`;
  }, [iterationSummary]);

  return (
    <>
      <Pressable
        style={styles.detailsButton}
        onPress={toggleDetails}
        accessibilityRole="button"
        accessibilityLabel={showDetails ? 'Hide calculation details' : 'Show calculation details'}
        accessibilityHint="Toggles the visibility of detailed calculation iterations"
      >
        <Text style={styles.detailsButtonText}>
          {showDetails ? 'Hide Calculation Details' : 'Show Calculation Details'}
        </Text>
      </Pressable>

      {showDetails && (
        <View
          style={styles.iterationDetails}
          accessibilityLabel="Calculation iterations details"
          accessible
        >
          <Text style={styles.iterationDetailsTitle}>Calculation Iterations</Text>
          <Text
            style={styles.iterationDetailsText}
            accessibilityLabel={iterationDetailsAccessibilityLabel}
          >
            {iterationSummary}
          </Text>
        </View>
      )}
    </>
  );
});

IterationDetails.displayName = 'IterationDetails';

function getThemedStyles(palette: ReturnType<typeof useThemeTokens>) {
  return StyleSheet.create({
    detailsButton: {
      backgroundColor: palette.colors.surfaceAlt,
      borderRadius: 12,
      padding: 10,
      marginTop: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: palette.colors.border,
    },
    detailsButtonText: {
      color: palette.colors.brand,
      fontSize: scaledFontSize(14),
      fontWeight: '600',
    },
    iterationDetails: {
      backgroundColor: palette.colors.surface,
      borderRadius: 12,
      padding: 12,
      marginTop: 12,
      borderWidth: 1,
      borderColor: palette.colors.border,
    },
    iterationDetailsTitle: {
      fontSize: scaledFontSize(14),
      color: palette.colors.textMuted,
      marginBottom: 8,
      fontWeight: '600',
    },
    iterationDetailsText: {
      fontSize: scaledFontSize(12),
      color: palette.colors.textPrimary,
      lineHeight: 18,
      fontFamily: 'monospace',
    },
  });
}
