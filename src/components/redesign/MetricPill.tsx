/**
 * MetricPill - Compact data display for conditions and stats
 *
 * Used for showing environmental data, quick stats, and
 * secondary information in a space-efficient format.
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useRedesignTheme } from '@/src/theme/redesign';
import { Pencil } from 'lucide-react-native';

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

  /** Whether value is manually overridden (shows orange tint + pencil icon) */
  isOverridden?: boolean;

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
  isOverridden = false,
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

  // Override styles (orange tint background + pencil icon)
  const overrideBackgroundColor = isOverridden ? `${colors.warning}1A` : undefined; // 10% orange tint
  const overrideBorderColor = isOverridden ? colors.warning : undefined;

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
          backgroundColor: overrideBackgroundColor || colors.surface,
          borderColor: overrideBorderColor || colors.border,
        },
        style,
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${value}${isOverridden ? ', manually overridden' : ''}`}
      testID={testID}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.pillLabel, { color: isOverridden ? colors.warning : colors.textMuted }]}>
        {label}
      </Text>
      <Text
        style={[styles.pillValue, { color: isOverridden ? colors.warning : getStatusColor() }]}
        numberOfLines={1}
      >
        {value}
      </Text>
      {/* Pencil icon for manual override indicator */}
      {isOverridden && (
        <View style={styles.overrideIcon}>
          <Pencil size={12} color={colors.warning} />
        </View>
      )}
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

  overrideIcon: {
    marginLeft: 2,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
