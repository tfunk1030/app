/**
 * InlineResult Component
 *
 * Shows "plays like" distance when locked, with expandable detail view.
 * Uses flat MetricPill style for design consistency.
 * Animates in/out on lock state change.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { ChevronDown, ChevronUp, Wind, ArrowUp, ArrowRight } from 'lucide-react-native';
import { useReduceMotionValue } from '@/src/hooks/useReduceMotion';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface BreakdownItem {
  label: string;
  value: string;
  icon: 'wind' | 'headwind' | 'crosswind';
}

interface InlineResultProps {
  /** The "plays like" distance */
  playsLikeDistance: number;
  /** The original distance */
  actualDistance: number;
  /** Distance unit (yards/meters) */
  unit: string;
  /** Whether result is currently visible */
  isVisible: boolean;
  /** Breakdown data for expanded view */
  breakdown?: {
    headwind: number;
    crosswind: number;
    altitude: number;
    temperature: number;
  };
  /** Theme colors */
  colors: {
    background: string;
    border: string;
    text: string;
    textMuted: string;
    accent: string;
    success: string;
    warning: string;
  };
}

/**
 * Get icon component for breakdown item
 */
function BreakdownIcon({ type, color, size }: { type: string; color: string; size: number }) {
  switch (type) {
    case 'headwind':
      return <ArrowUp size={size} color={color} />;
    case 'crosswind':
      return <ArrowRight size={size} color={color} />;
    default:
      return <Wind size={size} color={color} />;
  }
}

const InlineResult: React.FC<InlineResultProps> = ({
  playsLikeDistance,
  actualDistance,
  unit,
  isVisible,
  breakdown,
  colors,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const reducedMotion = useReduceMotionValue();

  if (!isVisible) {
    return null;
  }

  const difference = playsLikeDistance - actualDistance;
  const differenceSign = difference > 0 ? '+' : '';
  const differenceColor = difference > 0 ? colors.warning : colors.success;

  const handleToggleExpand = () => {
    if (!reducedMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setIsExpanded(!isExpanded);
  };

  const breakdownItems: BreakdownItem[] = breakdown
    ? [
        {
          label: 'Headwind',
          value: `${breakdown.headwind > 0 ? '+' : ''}${breakdown.headwind} ${unit}`,
          icon: 'headwind',
        },
        {
          label: 'Crosswind',
          value: `${breakdown.crosswind > 0 ? '+' : ''}${breakdown.crosswind} ${unit}`,
          icon: 'crosswind',
        },
        {
          label: 'Altitude',
          value: `${breakdown.altitude > 0 ? '+' : ''}${breakdown.altitude} ${unit}`,
          icon: 'wind',
        },
        {
          label: 'Temperature',
          value: `${breakdown.temperature > 0 ? '+' : ''}${breakdown.temperature} ${unit}`,
          icon: 'wind',
        },
      ]
    : [];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Plays like ${Math.round(playsLikeDistance)} ${unit}, ${Math.abs(difference)} ${unit} ${difference > 0 ? 'longer' : 'shorter'} than actual`}
    >
      {/* Main result row */}
      <View style={styles.mainRow}>
        <View style={styles.labelSection}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Plays like</Text>
        </View>

        <View style={styles.valueSection}>
          <Text style={[styles.playsLikeValue, { color: colors.text }]}>
            {Math.round(playsLikeDistance)}
          </Text>
          <Text style={[styles.unit, { color: colors.textMuted }]}>{unit}</Text>
        </View>

        <View style={styles.differenceSection}>
          <Text style={[styles.difference, { color: differenceColor }]}>
            {differenceSign}{Math.round(difference)}
          </Text>
        </View>
      </View>

      {/* Expandable breakdown section */}
      {breakdown && (
        <>
          <Pressable
            onPress={handleToggleExpand}
            style={styles.expandButton}
            accessibilityRole="button"
            accessibilityLabel={isExpanded ? 'Hide breakdown' : 'Show breakdown'}
            hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
          >
            <Text style={[styles.expandText, { color: colors.accent }]}>
              {isExpanded ? 'Hide details' : 'See breakdown'}
            </Text>
            {isExpanded ? (
              <ChevronUp size={16} color={colors.accent} />
            ) : (
              <ChevronDown size={16} color={colors.accent} />
            )}
          </Pressable>

          {isExpanded && (
            <View style={styles.breakdownContainer}>
              {breakdownItems.map((item, index) => (
                <View
                  key={item.label}
                  style={[
                    styles.breakdownRow,
                    index < breakdownItems.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.breakdownLeft}>
                    <BreakdownIcon type={item.icon} color={colors.textMuted} size={14} />
                    <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>
                      {item.label}
                    </Text>
                  </View>
                  <Text style={[styles.breakdownValue, { color: colors.text }]}>{item.value}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelSection: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  valueSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  playsLikeValue: {
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontSize: 14,
    fontWeight: '500',
  },
  differenceSection: {
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difference: {
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    paddingVertical: 4,
  },
  expandText: {
    fontSize: 13,
    fontWeight: '600',
  },
  breakdownContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});

export default React.memo(InlineResult);
