import { useTokens } from '@/src/theme/useTokens';
import React from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

export const Button = ({
  onPress,
  children,
  style,
}: {
  onPress: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) => {
  const t = useTokens();
  return (
    <Pressable
      style={[
        styles.button,
        { backgroundColor: t.colors.brand, shadowColor: t.colors.shadow },
        style,
      ]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.12)' }}
    >
      <Text style={[styles.text, { color: t.colors.textPrimary }]}>{children}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    minHeight: 44,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
