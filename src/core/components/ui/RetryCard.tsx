import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@/src/core/components/ui/button';
import { useTokens as useThemeTokens } from '@/src/theme/useTokens';

interface RetryCardProps {
  title?: string;
  message?: string;
  onRetry: () => void | Promise<void>;
}

export function RetryCard({ title = 'Unable to load', message, onRetry }: RetryCardProps) {
  const t = useThemeTokens();
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={title}
      style={[styles.card, { backgroundColor: t.colors.surfaceAlt, borderColor: t.colors.border }]}
    >
      <Text style={[styles.title, { color: t.colors.textPrimary }]}>{title}</Text>
      {message ? (
        <Text style={[styles.message, { color: t.colors.textMuted }]}>{message}</Text>
      ) : null}
      <Button variant="default" onPress={onRetry} style={{ alignSelf: 'flex-start' }}>
        Retry
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    marginBottom: 10,
  },
});
