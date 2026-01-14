/**
 * Redesign Tab Layout - 3 Tab Freemium Structure
 *
 * - Shot (FREE): Environmental adjustments only
 * - Wind (PREMIUM): Full wind calculator with compass
 * - Setup: Clubs + settings
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Target, Wind, Settings } from 'lucide-react-native';

import { RedesignThemeProvider, useRedesignTheme } from '@/src/theme/redesign';
// AppProvider removed - already wrapped at root _layout.tsx level
import { EnhancedEnvironmentalProvider } from '@/src/providers/EnhancedEnvironmentalProvider';

// =============================================================================
// TAB BAR ICON COMPONENT
// =============================================================================

interface TabBarIconProps {
  name: 'shot' | 'wind' | 'setup';
  color: string;
  focused: boolean;
}

function TabBarIcon({ name, color, focused }: TabBarIconProps) {
  const size = 24;

  switch (name) {
    case 'shot':
      return <Target size={size} color={color} strokeWidth={focused ? 2.5 : 2} />;
    case 'wind':
      return <Wind size={size} color={color} strokeWidth={focused ? 2.5 : 2} />;
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
          title: 'Shot',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="shot" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="wind"
        options={{
          title: 'Wind',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="wind" color={color} focused={focused} />
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
