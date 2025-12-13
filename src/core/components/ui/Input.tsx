import { useTokens } from '@/src/theme/useTokens';
import { scaledFontSize } from '@/src/utils/responsive';
import * as React from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';

export interface InputProps extends TextInputProps {}

const Input = React.forwardRef<TextInput, InputProps>(({ style, ...props }, ref) => {
  const t = useTokens();
  return (
    <TextInput
      ref={ref}
      style={[
        styles.input,
        {
          borderColor: t.colors.border,
          backgroundColor: t.colors.surfaceAlt,
          color: t.colors.textPrimary,
        },
        style,
      ]}
      placeholderTextColor={t.colors.textMuted}
      {...props}
    />
  );
});

const styles = StyleSheet.create({
  input: {
    height: 48,
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: scaledFontSize(16),
  },
});

export { Input };
