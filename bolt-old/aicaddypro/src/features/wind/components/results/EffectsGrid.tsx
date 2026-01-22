/**
 * EffectsGrid.tsx
 *
 * A component that displays a grid of environmental and wind effects
 * with color-coded values.
 */

import { useSettings } from '@/src/core/context/settings';
import { useTokens as useThemeTokens } from '@/src/theme/useTokens';
import { scaledFontSize } from '@/src/utils/responsive';
import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
  const palette = useThemeTokens();
  const styles = React.useMemo(() => getThemedStyles(palette), [palette]);
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

function getThemedStyles(palette: ReturnType<typeof useThemeTokens>) {
  return StyleSheet.create({
    effectsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 16,
    },
    effectItem: {
      width: '48%',
      backgroundColor: palette.colors.surface,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.colors.border,
    },
    effectLabel: {
      fontSize: scaledFontSize(12),
      color: palette.colors.textMuted,
      marginBottom: 4,
    },
    effectValue: {
      fontSize: scaledFontSize(16),
      fontWeight: '600',
      color: palette.colors.textPrimary,
    },
    positive: {
      color: palette.colors.success,
    },
    negative: {
      color: palette.colors.danger,
    },
    warning: {
      color: palette.colors.brandAlt,
    },
  });
}