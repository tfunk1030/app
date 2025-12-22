/**
 * EffectsGrid.tsx
 *
 * A component that displays a grid of environmental and wind effects
 * with color-coded values.
 */

import { useSettings } from '@/src/core/context/settings';
import { Tokens } from '@/src/theme/tokens';
import { useTokens as useThemeTokens } from '@/src/theme/useTokens';
import { safeScaledFontSize, getScrollPadding } from '@/src/utils/responsive';
import React, { memo, useCallback, useMemo } from 'react';
import { Text, View } from 'react-native';

interface EffectsGridProps {
  environmentalEffect: number;
  windEffect: number;
  lateralEffect: number;
}

export const EffectsGrid = memo(function EffectsGrid({
  environmentalEffect,
  windEffect,
  lateralEffect,
}: EffectsGridProps) {
  const t = useThemeTokens();
  const styles = useMemo(() => createStyles(t), [t]);
  const { settings } = useSettings();
  const unitLabel = useMemo(
    () => (settings.distanceUnit === 'yards' ? 'yards' : 'm'),
    [settings.distanceUnit]
  );
  const toDisplay = useCallback(
    (yards: number) =>
      settings.distanceUnit === 'yards' ? Math.round(yards) : Math.round(yards * 0.9144),
    [settings.distanceUnit]
  );
  const roundedValues = useMemo(
    () => ({
      environmentalEffect: Math.round(environmentalEffect),
      windEffect: Math.round(windEffect),
      totalEffect: Math.round(environmentalEffect + windEffect),
      lateralEffect: Math.abs(Math.round(lateralEffect)),
    }),
    [environmentalEffect, windEffect, lateralEffect]
  );

  const lateralDirectionText = useMemo(() => {
    if (lateralEffect === 0) return '';
    return lateralEffect > 0 ? 'right' : 'left';
  }, [lateralEffect]);

  const environmentalEffectData = useMemo(() => {
    const isPositive = environmentalEffect < 0;
    const style = [styles.effectValue, isPositive ? styles.positive : styles.negative];
    const prefix = environmentalEffect > 0 ? '+' : '';
    const value = toDisplay(environmentalEffect);
    const text = `${prefix}${value} ${unitLabel}`;
    const accessibilityLabel = `Environment effect ${
      environmentalEffect > 0 ? 'plus' : 'minus'
    } ${Math.abs(value)} ${unitLabel}`;

    return { style, text, accessibilityLabel };
  }, [
    environmentalEffect,
    roundedValues.environmentalEffect,
    unitLabel,
    toDisplay,
    settings.distanceUnit,
  ]);

  const windEffectData = useMemo(() => {
    const isPositive = windEffect < 0;
    const style = [styles.effectValue, isPositive ? styles.positive : styles.negative];
    const prefix = windEffect > 0 ? '+' : '';
    const value = toDisplay(windEffect);
    const text = `${prefix}${value} ${unitLabel}`;
    const accessibilityLabel = `Wind effect ${windEffect > 0 ? 'plus' : 'minus'} ${Math.abs(
      value
    )} ${unitLabel}`;

    return { style, text, accessibilityLabel };
  }, [windEffect, roundedValues.windEffect, unitLabel, toDisplay, settings.distanceUnit]);

  const totalEffectData = useMemo(() => {
    const totalEffect = environmentalEffect + windEffect;
    const isPositive = totalEffect < 0;
    const style = [styles.effectValue, isPositive ? styles.positive : styles.negative];
    const prefix = totalEffect > 0 ? '+' : '';
    const value = toDisplay(totalEffect);
    const text = `${prefix}${value} ${unitLabel}`;
    const accessibilityLabel = `Total effect ${totalEffect > 0 ? 'plus' : 'minus'} ${Math.abs(
      value
    )} ${unitLabel}`;

    return { style, text, accessibilityLabel };
  }, [
    environmentalEffect,
    windEffect,
    roundedValues.totalEffect,
    unitLabel,
    toDisplay,
    settings.distanceUnit,
  ]);

  const lateralEffectData = useMemo(() => {
    const isMinor = Math.abs(lateralEffect) < 5;
    const style = [styles.effectValue, isMinor ? styles.positive : styles.warning];
    const text = `${toDisplay(lateralEffect)} ${unitLabel} ${
      lateralDirectionText ? lateralDirectionText : ''
    }`;
    const accessibilityLabel = `Lateral effect ${toDisplay(
      lateralEffect
    )} ${unitLabel} ${lateralDirectionText}`;

    return { style, text, accessibilityLabel };
  }, [
    lateralEffect,
    roundedValues.lateralEffect,
    lateralDirectionText,
    unitLabel,
    toDisplay,
    settings.distanceUnit,
  ]);

  return (
    <View style={styles.effectsGrid}>
      <View style={styles.effectItem}>
        <Text style={styles.effectLabel}>Environment Effect</Text>
        <Text
          style={environmentalEffectData.style}
          accessibilityLabel={environmentalEffectData.accessibilityLabel}
        >
          {environmentalEffectData.text}
        </Text>
      </View>
      <View style={styles.effectItem}>
        <Text style={styles.effectLabel}>Wind Effect</Text>
        <Text style={windEffectData.style} accessibilityLabel={windEffectData.accessibilityLabel}>
          {windEffectData.text}
        </Text>
      </View>
      <View style={styles.effectItem}>
        <Text style={styles.effectLabel}>Total Effect</Text>
        <Text style={totalEffectData.style} accessibilityLabel={totalEffectData.accessibilityLabel}>
          {totalEffectData.text}
        </Text>
      </View>
      <View style={styles.effectItem}>
        <Text style={styles.effectLabel}>Lateral Effect</Text>
        <Text
          style={lateralEffectData.style}
          accessibilityLabel={lateralEffectData.accessibilityLabel}
        >
          {lateralEffectData.text}
        </Text>
      </View>
    </View>
  );
});

EffectsGrid.displayName = 'EffectsGrid';

/**
 * Token-based styles matching MetricTile pattern
 */
function createStyles(t: Tokens) {
  // Use responsive padding that adapts to fontScale (matching MetricTile pattern)
  const tilePadding = getScrollPadding(t.spacing.md, {
    minPadding: t.spacing.base,
    maxPadding: 20,
  });

  return {
    effectsGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      justifyContent: 'space-between' as const,
      gap: t.spacing.base, // 12px - consistent grid gap
      marginTop: t.spacing.md, // 16px
    },
    effectItem: {
      width: '48%' as const,
      backgroundColor: t.colors.surface,
      padding: tilePadding,
      borderRadius: t.borderRadius.lg, // 12px - matches MetricTile inner radius
      borderWidth: t.borderWidth.thin, // 1px
      borderColor: t.colors.border,
    },
    effectLabel: {
      fontSize: safeScaledFontSize(t.fontSize.xs, { maxScale: 1.2 }), // 12px with safety limit
      color: t.colors.textMuted,
      marginBottom: t.spacing.xs, // 4px
      fontWeight: t.fontWeight.medium, // '500' - matches MetricTile label
      letterSpacing: t.letterSpacing.normal + 0.3, // Slightly wider for labels
    },
    effectValue: {
      fontSize: safeScaledFontSize(t.fontSize.base, { maxScale: 1.2 }), // 16px with safety limit
      fontWeight: t.fontWeight.semibold, // '600'
      color: t.colors.textPrimary,
      letterSpacing: t.letterSpacing.tight, // -0.5 - matches MetricTile values
    },
    positive: {
      color: t.colors.success,
    },
    negative: {
      color: t.colors.danger,
    },
    warning: {
      color: t.colors.brandAlt,
    },
  };
}