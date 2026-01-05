/**
 * Redesign Tab Layout - Expo Router Version
 *
 * New 3-tab navigation structure using Expo Router.
 * This can coexist with the existing (tabs) folder for A/B testing.
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Target, BarChart3, Settings } from 'lucide-react-native';

import { RedesignThemeProvider, useRedesignTheme } from '@/src/theme/redesign';
import { AppProvider } from '@/src/core/context/AppProvider';
import { EnhancedEnvironmentalProvider } from '@/src/providers/EnhancedEnvironmentalProvider';

// =============================================================================
// TAB BAR ICON COMPONENT
// =============================================================================

interface TabBarIconProps {
  name: 'play' | 'stats' | 'setup';
  color: string;
  focused: boolean;
}

function TabBarIcon({ name, color, focused }: TabBarIconProps) {
  const size = 24;

  switch (name) {
    case 'play':
      return <Target size={size} color={color} strokeWidth={focused ? 2.5 : 2} />;
    case 'stats':
      return <BarChart3 size={size} color={color} strokeWidth={focused ? 2.5 : 2} />;
    case 'setup':
      return <Settings size={size} color={color} strokeWidth={focused ? 2.5 : 2} />;
    default:
      return null;
  }
}

// =============================================================================
// TAB NAVIGATOR CONTENT
// =============================================================================

function TabNavigatorContent() {
  const { colors, tokens } = useRedesignTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Play',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="play" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="stats" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="setup"
        options={{
          title: 'Setup',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="setup" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

// =============================================================================
// LAYOUT WITH PROVIDERS
// =============================================================================

export default function RedesignTabLayout() {
  return (
    <RedesignThemeProvider>
      <AppProvider>
        <EnhancedEnvironmentalProvider>
          <TabNavigatorContent />
        </EnhancedEnvironmentalProvider>
      </AppProvider>
    </RedesignThemeProvider>
  );
}
