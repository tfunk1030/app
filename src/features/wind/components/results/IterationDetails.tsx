/**
 * IterationDetails.tsx
 *
 * A component that displays detailed iteration information
 * with a collapsible interface for progressive disclosure.
 */

import { useTokens } from '@/src/theme/useTokens';
import type { Tokens } from '@/src/theme/tokens';
import { safeScaledFontSize } from '@/src/utils/responsive';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

interface IterationDetailsProps {
  iterationSummary?: string;
  defaultExpanded?: boolean;
}

/**
 * Creates memoized token-based styles for IterationDetails
 * Follows same pattern as GlassCard, MetricTile, Button components
 */
function createStyles(t: Tokens) {
  return {
    detailsButton: {
      backgroundColor: t.colors.surfaceAlt,
      borderRadius: t.borderRadius.lg, // 12
      padding: t.spacing.sm + 2, // 10 - slightly larger than sm(8) for touch target
      marginTop: t.spacing.md, // 16
      alignItems: 'center' as const,
      borderWidth: t.borderWidth.thin, // 1
      borderColor: t.colors.border,
      minHeight: t.touchTarget.minimum, // 48 - touch target compliance
      justifyContent: 'center' as const,
    },
    detailsButtonText: {
      color: t.colors.brand,
      fontSize: safeScaledFontSize(t.fontSize.sm, { maxScale: 1.25 }), // 14
      fontWeight: t.fontWeight.semibold, // '600'
    },
    iterationDetails: {
      backgroundColor: t.colors.surface,
      borderRadius: t.borderRadius.lg, // 12
      padding: t.spacing.base, // 12
      marginTop: t.spacing.base, // 12
      borderWidth: t.borderWidth.thin, // 1
      borderColor: t.colors.border,
    },
    iterationDetailsTitle: {
      fontSize: safeScaledFontSize(t.fontSize.sm, { maxScale: 1.2 }), // 14
      color: t.colors.textMuted,
      marginBottom: t.spacing.sm, // 8
      fontWeight: t.fontWeight.semibold, // '600'
    },
    iterationDetailsText: {
      fontSize: safeScaledFontSize(t.fontSize.xs, { maxScale: 1.2 }), // 12
      color: t.colors.textPrimary,
      lineHeight: 18, // Comfortable line height for monospace
      fontFamily: 'monospace',
    },
  } as const;
}

export const IterationDetails = memo(function IterationDetails({
  iterationSummary,
  defaultExpanded = false,
}: IterationDetailsProps) {
  const t = useTokens();
  const styles = useMemo(() => createStyles(t), [t]);
  const [showDetails, setShowDetails] = useState(defaultExpanded);

  const toggleDetails = useCallback(() => {
    setShowDetails(prev => !prev);
  }, []);

  const iterationDetailsAccessibilityLabel = useMemo(() => {
    if (!iterationSummary) return '';
    return `Iteration details: ${iterationSummary.replace(/\n/g, ', ')}`;
  }, [iterationSummary]);

  if (!iterationSummary) {
    return null;
  }

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
