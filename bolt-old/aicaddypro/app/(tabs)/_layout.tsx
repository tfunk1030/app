/**
 * Tab Layout with Enhanced Environmental Provider
 *
 * This layout wraps all tab screens with the EnhancedEnvironmentalProvider
 * to provide optimized environmental data access with throttling and
 * background mode support.
 */

import { useColorScheme } from '@/components/useColorScheme';
import { EnhancedEnvironmentalProvider } from '@/src/providers/EnhancedEnvironmentalProvider';
import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import { LogManager } from '@/src/utils/LogManager';
import { Tabs } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Thermometer, Wind, Target, Settings as SettingsIcon } from 'lucide-react-native';

// Create a logger for the tab layout
const logger = LogManager.getLogger('TabLayout');

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const t = useTokens();
  const { mode } = useThemeMode();

  // Force refresh function that can be called from any tab
  const forceRefreshAllTabs = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Log when the tab layout is mounted
  useEffect(() => {
    logger.info('Tab layout mounted');

    // Force a refresh after component mounts
    const initialRefreshTimer = setTimeout(() => {
      logger.info('Performing initial data refresh');
      setRefreshTrigger(prev => prev + 1);
    }, 1000); // 1 second after mount

    return () => {
      logger.info('Tab layout unmounted');
      clearTimeout(initialRefreshTimer);
    };
  }, []);

  return (
    <EnhancedEnvironmentalProvider refreshTrigger={refreshTrigger}>
      <Tabs
        screenOptions={{
          headerShown: false,
          lazy: true,
          freezeOnBlur: true,
          tabBarStyle: {
            backgroundColor: mode === 'dark' ? t.colors.surface : t.colors.surfaceAlt,
            borderTopColor: t.colors.border,
            borderTopWidth: 1,
            height: 60,
          },
          tabBarActiveTintColor: t.colors.brand,
          tabBarInactiveTintColor: t.colors.textMuted,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Weather',
            tabBarIcon: ({ color }) => <Thermometer size={20} color={color} />,
            tabBarAccessibilityLabel: 'Weather tab',
          }}
        />
        <Tabs.Screen
          name="shot"
          options={{
            title: 'Shot',
            tabBarIcon: ({ color }) => <Target size={20} color={color} />,
            tabBarAccessibilityLabel: 'Shot tab',
          }}
        />
        <Tabs.Screen
          name="wind"
          options={{
            title: 'Wind',
            tabBarIcon: ({ color }) => <Wind size={20} color={color} />,
            tabBarAccessibilityLabel: 'Wind tab',
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => <SettingsIcon size={20} color={color} />,
            tabBarAccessibilityLabel: 'Settings tab',
          }}
        />
      </Tabs>
    </EnhancedEnvironmentalProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
