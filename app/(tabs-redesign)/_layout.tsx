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
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { Target, Wind, Settings } from 'lucide-react-native';

import { RedesignThemeProvider } from '@/src/theme/redesign';
import { EnhancedEnvironmentalProvider } from '@/src/providers/EnhancedEnvironmentalProvider';
import { useTokens } from '@/src/theme/useTokens';

// =============================================================================
// TAB NAVIGATOR - NATIVE (iOS/Android)
// =============================================================================

function NativeTabNavigator() {
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
// TAB NAVIGATOR - WEB
// =============================================================================

function WebTabNavigator() {
  const t = useTokens();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.colors.brand,
        tabBarInactiveTintColor: t.colors.textMuted,
        tabBarStyle: {
          backgroundColor: t.colors.surface,
          borderTopColor: t.colors.border,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="(shot)"
        options={{
          title: 'Shot',
          tabBarIcon: ({ color, size }) => <Target size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(wind)"
        options={{
          title: 'Wind',
          tabBarIcon: ({ color, size }) => <Wind size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(setup)"
        options={{
          title: 'Setup',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

// =============================================================================
// PLATFORM-SPECIFIC TAB NAVIGATOR
// =============================================================================

function TabNavigatorContent() {
  // Use NativeTabs on iOS for native tab bar experience
  // Use regular Tabs on web/Android for proper rendering
  if (Platform.OS === 'ios') {
    return <NativeTabNavigator />;
  }
  return <WebTabNavigator />;
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
