import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTokens as useThemeTokens } from '@/src/theme/useTokens';
import { useConnectivity } from '@/src/hooks/useConnectivity';

/**
 * ConnectivityBanner
 *
 * Lightweight banner that shows network connectivity status.
 * Uses a ping-based check; does not add new dependencies.
 */
export function ConnectivityBanner() {
  const palette = useThemeTokens();
  const { online, checking, lastChangeTs } = useConnectivity();

  if (online && !checking) return null;

  const bg = online ? palette.colors.surfaceAlt : palette.colors.offlineBackground;
  const border = online ? palette.colors.border : palette.colors.offlineBorder;
  const text = online ? palette.colors.textMuted : palette.colors.offlineText;

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={online ? 'Reconnecting…' : 'Offline'}
      style={[styles.container, { backgroundColor: bg, borderColor: border }]}
    >
      <View style={[styles.dot, { backgroundColor: online ? palette.colors.brandAlt : palette.colors.danger }]} />
      <Text style={[styles.label, { color: text }]}>
        {online ? 'Reconnecting…' : 'Offline — some data may be stale'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
