/**
 * RedesignApp - Complete Redesigned App Entry
 *
 * This file demonstrates the full redesigned app architecture.
 * To use the redesign, replace the current app entry with this.
 *
 * Features:
 * - 3-tab navigation (Play, Stats, Setup)
 * - New design system with outdoor-optimized tokens
 * - Unified shot calculator
 * - Performance analytics
 * - Streamlined settings
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RedesignThemeProvider, useRedesignTheme } from '@/src/theme/redesign';
import { RedesignTabNavigator, TabRoute } from './navigation/RedesignTabNavigator';
import { PlayScreen } from './screens/PlayScreen';
import { StatsScreen } from './screens/StatsScreen';
import { SetupScreen } from './screens/SetupScreen';

// Providers that the app needs
import { AppProvider } from '@/src/core/context/AppProvider';
import { EnhancedEnvironmentalProvider } from '@/src/providers/EnhancedEnvironmentalProvider';

// =============================================================================
// SCREEN ROUTER
// =============================================================================

function ScreenRouter({ activeTab }: { activeTab: TabRoute }) {
  switch (activeTab) {
    case 'play':
      return <PlayScreen />;
    case 'stats':
      return <StatsScreen />;
    case 'setup':
      return <SetupScreen />;
    default:
      return <PlayScreen />;
  }
}

// =============================================================================
// APP CONTENT
// =============================================================================

function AppContent() {
  const { isDark } = useRedesignTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RedesignTabNavigator>
        {(activeTab) => <ScreenRouter activeTab={activeTab} />}
      </RedesignTabNavigator>
    </>
  );
}

// =============================================================================
// MAIN APP
// =============================================================================

export function RedesignApp() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RedesignThemeProvider>
          <AppProvider>
            <EnhancedEnvironmentalProvider>
              <AppContent />
            </EnhancedEnvironmentalProvider>
          </AppProvider>
        </RedesignThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default RedesignApp;
