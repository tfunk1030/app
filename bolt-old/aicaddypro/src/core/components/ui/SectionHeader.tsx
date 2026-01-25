import { useTokens } from '@/src/theme/useTokens';
import { 
  safeScaledFontSize,
  getOptimalNumberOfLines,
  getResponsiveSpacing,
  getScrollPadding
} from '@/src/utils/responsive';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface SectionHeaderProps {
  title: string;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, style }) => {
  const t = useTokens();
  
  return (
    <View style={[
      styles.container,
      {
        paddingHorizontal: getResponsiveSpacing(4, 'horizontal'),
        marginBottom: getResponsiveSpacing(8, 'vertical'),
      },
      style
    ]}>
      <View style={[
        styles.pill,
        {
          borderColor: t.colors.border,
          backgroundColor: t.colors.surfaceAlt,
          paddingVertical: getScrollPadding(4, { minPadding: 3, maxPadding: 6 }),
          paddingHorizontal: getScrollPadding(10, { minPadding: 8, maxPadding: 14 }),
        }
      ]}>
        <Text 
          style={[
            styles.title,
            {
              color: t.colors.textPrimary,
              fontSize: safeScaledFontSize(12, { maxScale: 1.15 }),
            }
          ]}
          numberOfLines={getOptimalNumberOfLines(1, { maxLines: 2 })}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
        >
          {title.toUpperCase()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
  },
  title: {
    fontWeight: '700',
    letterSpacing: 0.6,
    maxWidth: 240,
  },
});