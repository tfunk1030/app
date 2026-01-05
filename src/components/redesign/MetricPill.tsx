/**
 * MetricPill - Compact data display for conditions and stats
 *
 * Used for showing environmental data, quick stats, and
 * secondary information in a space-efficient format.
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useRedesignTheme } from '@/src/theme/redesign';

// =============================================================================
// TYPES
// =============================================================================

interface MetricPillProps {
  /** Label (e.g., "Wind") */
  label: string;

  /** Value (e.g., "12 mph") */
  value: string;

  /** Optional icon */
  icon?: React.ReactNode;

  /** Display variant */
  variant?: 'default' | 'inline' | 'stacked';

  /** Semantic status for coloring */
  status?: 'neutral' | 'good' | 'warning' | 'danger';

  /** Custom style */
  style?: ViewStyle;

  /** Test ID */
  testID?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const MetricPill = memo(function MetricPill({
  label,
  value,
  icon,
  variant = 'default',
  status = 'neutral',
  style,
  testID,
}: MetricPillProps) {
  const { colors, tokens } = useRedesignTheme();

  // Status colors
  const getStatusColor = () => {
    switch (status) {
      case 'good':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'danger':
        return colors.error;
      default:
        return colors.textPrimary;
    }
  };

  if (variant === 'stacked') {
    return (
      <View
        style={[styles.stackedContainer, { backgroundColor: colors.surface }, style]}
        accessible
        accessibilityRole="text"
        accessibilityLabel={`${label}: ${value}`}
        testID={testID}
      >
        <Text style={[styles.stackedLabel, { color: colors.textMuted }]}>
          {label}
        </Text>
        <View style={styles.stackedValueRow}>
          {icon && <View style={styles.iconSmall}>{icon}</View>}
          <Text
            style={[
              styles.stackedValue,
              { color: getStatusColor() },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {value}
          </Text>
        </View>
      </View>
    );
  }

  if (variant === 'inline') {
    return (
      <View
        style={[styles.inlineContainer, style]}
        accessible
        accessibilityRole="text"
        accessibilityLabel={`${label}: ${value}`}
        testID={testID}
      >
        <Text style={[styles.inlineLabel, { color: colors.textMuted }]}>
          {label}
        </Text>
        <Text style={[styles.inlineValue, { color: colors.textPrimary }]}>
          {value}
        </Text>
      </View>
    );
  }

  // Default pill style
  return (
    <View
      style={[
        styles.pillContainer,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${value}`}
      testID={testID}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.pillLabel, { color: colors.textMuted }]}>
        {label}
      </Text>
      <Text
        style={[styles.pillValue, { color: getStatusColor() }]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
});

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  // Default pill
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },

  iconContainer: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pillLabel: {
    fontSize: 13,
    fontWeight: '500',
  },

  pillValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Inline
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  inlineLabel: {
    fontSize: 14,
    fontWeight: '500',
  },

  inlineValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Stacked
  stackedContainer: {
    padding: 12,
    borderRadius: 12,
    minWidth: 80,
  },

  stackedLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  stackedValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  iconSmall: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stackedValue: {
    fontSize: 18,
    fontWeight: '700',
  },
});

export default MetricPill;
