/**
 * Redesign Tab Layout - NativeTabs (iOS Native Tab Bar)
 *
 * Uses Expo Router v6 NativeTabs for:
 * - Native iOS tab bar with Liquid Glass on iOS 26+
 * - SF Symbols via expo-symbols
 * - Hardware-accelerated animations
 *
 * Tab Structure:
 * - Shot (FREE): Environmental adjustments only
 * - Wind (PREMIUM): Full wind calculator with compass
 * - Setup: Clubs + settings
 */

import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

import { RedesignThemeProvider } from '@/src/theme/redesign';
import { EnhancedEnvironmentalProvider } from '@/src/providers/EnhancedEnvironmentalProvider';

// =============================================================================
// TAB NAVIGATOR WITH NATIVE TABS
// =============================================================================

function TabNavigatorContent() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(shot)">
        <Icon sf={{ default: "scope", selected: "scope" }} />
        <Label>Shot</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(wind)">
        <Icon sf={{ default: "wind", selected: "wind" }} />
        <Label>Wind</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(setup)">
        <Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} />
        <Label>Setup</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

// =============================================================================
// LAYOUT WITH PROVIDERS
// =============================================================================

export default function RedesignTabLayout() {
  // Note: AppProvider is already at root _layout.tsx level
  // Only EnhancedEnvironmentalProvider is needed here for weather data
  return (
    <RedesignThemeProvider>
      <EnhancedEnvironmentalProvider>
        <TabNavigatorContent />
      </EnhancedEnvironmentalProvider>
    </RedesignThemeProvider>
  );
}
