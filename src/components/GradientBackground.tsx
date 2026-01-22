/**
 * GradientBackground - Premium background gradient component
 *
 * Provides the dark navy gradient background (#0a0f1a → #1a2035)
 * that gives the app its premium visual polish.
 *
 * Usage:
 * <GradientBackground>
 *   <YourContent />
 * </GradientBackground>
 */

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Premium dark navy gradient colors from OLD version design
const GRADIENT_COLORS = {
  dark: ['#0a0f1a', '#1a2035'] as const,
  light: ['#FAFAFA', '#F1F5F9'] as const,
} as const;

interface GradientBackgroundProps {
  children: React.ReactNode;
  /** Override gradient colors */
  colors?: readonly [string, string, ...string[]];
  /** Style override for the container */
  style?: ViewStyle;
  /** Use light mode gradient */
  light?: boolean;
}

export function GradientBackground({
  children,
  colors,
  style,
  light = false,
}: GradientBackgroundProps): React.ReactElement {
  const gradientColors = colors ?? (light ? GRADIENT_COLORS.light : GRADIENT_COLORS.dark);

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default GradientBackground;
