/**
 * Tab Layout with Enhanced Environmental Provider
 *
 * This layout wraps all tab screens with the EnhancedEnvironmentalProvider
 * to provide optimized environmental data access with throttling and
 * background mode support.
 *
 * Features a bold gradient tab bar with haptic feedback.
 */

import { useColorScheme } from '@/components/useColorScheme';
import { BoldTabBar } from '@/src/core/components/ui/BoldTabBar';
import { EnhancedEnvironmentalProvider } from '@/src/providers/EnhancedEnvironmentalProvider';
import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import { LogManager } from '@/src/utils/LogManager';
import { Tabs } from 'expo-router';
import { Settings as SettingsIcon, Target, Thermometer, Wind, Package } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

// Create a logger for the tab layout
const logger = LogManager.getLogger('TabLayout');

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const t = useTokens();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark' || mode === 'system';

  // Force refresh function that can be called from any tab
  const forceRefreshAllTabs = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Log when the tab layout is mounted
  useEffect(() => {
    logger.info('Tab layout mounted');

    // Force a refresh after component mounts
    const initialRefreshTimer = setTimeout(() => {
      logger.info('Performing initial data refresh');
      setRefreshTrigger((prev) => prev + 1);
    }, 1000); // 1 second after mount

    return () => {
      logger.info('Tab layout unmounted');
      clearTimeout(initialRefreshTimer);
    };
  }, []);

  return (
    <EnhancedEnvironmentalProvider refreshTrigger={refreshTrigger}>
      <View style={[styles.container, { backgroundColor: t.colors.background }]}>
        <Tabs
          tabBar={(props) => <BoldTabBar {...props} />}
          screenOptions={{
            headerShown: false,
            lazy: true,
            freezeOnBlur: true,
            // Hide default tab bar since we're using custom BoldTabBar
            tabBarStyle: { display: 'none' },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Weather',
              tabBarIcon: ({ color, size }) => <Thermometer size={size} color={color} />,
              tabBarAccessibilityLabel: 'Weather tab',
            }}
          />
          <Tabs.Screen
            name="shot"
            options={{
              title: 'Shot',
              tabBarIcon: ({ color, size }) => <Target size={size} color={color} />,
              tabBarAccessibilityLabel: 'Shot tab',
            }}
          />
          <Tabs.Screen
            name="wind"
            options={{
              title: 'Wind',
              tabBarIcon: ({ color, size }) => <Wind size={size} color={color} />,
              tabBarAccessibilityLabel: 'Wind tab',
            }}
          />
          <Tabs.Screen
            name="clubs"
            options={{
              title: 'Clubs',
              tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
              tabBarAccessibilityLabel: 'Club Library tab',
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              tabBarIcon: ({ color, size }) => <SettingsIcon size={size} color={color} />,
              tabBarAccessibilityLabel: 'Settings tab',
            }}
          />
        </Tabs>
      </View>
    </EnhancedEnvironmentalProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
