import { useTokens } from '@/src/theme/useTokens';
import { 
  safeScaledFontSize, 
  getFlexibleMinHeight,
  getOptimalNumberOfLines,
  getScrollPadding,
  getTouchTargetSize,
  getIconSize
} from '@/src/utils/responsive';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface MetricTileProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  style?: ViewStyle;
}

export const MetricTile: React.FC<MetricTileProps> = ({ icon, label, value, style }) => {
  const tokens = useTokens();
  
  // Use responsive padding that adapts to fontScale
  const padding = getScrollPadding(16, { minPadding: 12, maxPadding: 20 });
  
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: tokens.colors.surfaceAlt,
          borderColor: tokens.colors.border,
          padding: padding,
          minHeight: getTouchTargetSize(44), // Ensure minimum touch target
        },
        style,
      ]}
      accessible
      accessibilityLabel={`${label} ${value}`}
    >
      <View style={[styles.header, { marginBottom: getScrollPadding(8, { minPadding: 6, maxPadding: 10 }) }]}>
        <View style={[
          styles.icon,
          {
            width: getIconSize(28),
            height: getIconSize(28),
            borderRadius: getIconSize(28) / 2,
          }
        ]}>
          {icon}
        </View>
        <Text
          style={[
            styles.label,
            {
              color: tokens.colors.textMuted,
              fontSize: safeScaledFontSize(14, { maxScale: 1.2 }),
            }
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.5}
        >
          {label}
        </Text>
      </View>
      <Text
        style={[
          styles.value,
          {
            color: tokens.colors.textPrimary,
            fontSize: safeScaledFontSize(22, { maxScale: 1.15 }),
          }
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit={true}
        minimumFontScale={0.5}
      >
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  label: {
    flex: 1,
    flexShrink: 1,
    flexWrap: 'nowrap',
  },
  value: {
    fontWeight: '700',
    flexWrap: 'nowrap',
  },
});