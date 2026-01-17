/**
 * RedesignTabNavigator - 3-Tab Navigation
 *
 * Simplified navigation structure:
 * - Play (primary) - Shot calculator
 * - Stats - Performance analytics
 * - Setup - Clubs & settings
 *
 * Features:
 * - Large touch targets
 * - Haptic feedback
 * - Clean, minimal design
 */

import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Target, BarChart3, Settings } from 'lucide-react-native';

import { useRedesignTheme } from '@/src/theme/redesign';

// =============================================================================
// TYPES
// =============================================================================

export type TabRoute = 'play' | 'stats' | 'setup';

interface TabConfig {
  key: TabRoute;
  label: string;
  icon: (props: { size: number; color: string; focused: boolean }) => React.ReactNode;
}

interface RedesignTabBarProps {
  activeTab: TabRoute;
  onTabPress: (tab: TabRoute) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const TABS: TabConfig[] = [
  {
    key: 'play',
    label: 'Play',
    icon: ({ size, color }) => <Target size={size} color={color} />,
  },
  {
    key: 'stats',
    label: 'Stats',
    icon: ({ size, color }) => <BarChart3 size={size} color={color} />,
  },
  {
    key: 'setup',
    label: 'Setup',
    icon: ({ size, color }) => <Settings size={size} color={color} />,
  },
];

// =============================================================================
// TAB ITEM
// =============================================================================

interface TabItemProps {
  tab: TabConfig;
  isActive: boolean;
  onPress: () => void;
}

const TabItem = memo(function TabItem({ tab, isActive, onPress }: TabItemProps) {
  const { colors, tokens } = useRedesignTheme();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.9, {
      damping: 15,
      stiffness: 400,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 400,
    });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconColor = isActive ? colors.brand : colors.textMuted;
  const labelColor = isActive ? colors.brand : colors.textMuted;

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabItem}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View style={[styles.tabItemContent, animatedStyle]}>
        {/* Active indicator */}
        {isActive && (
          <View
            style={[
              styles.activeIndicator,
              { backgroundColor: colors.brandMuted },
            ]}
          />
        )}

        {/* Icon */}
        <View style={styles.iconContainer}>
          {tab.icon({ size: 24, color: iconColor, focused: isActive })}
        </View>

        {/* Label */}
        <Text
          style={[
            styles.tabLabel,
            {
              color: labelColor,
              fontWeight: isActive ? '600' : '500',
            },
          ]}
        >
          {tab.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

// =============================================================================
// TAB BAR
// =============================================================================

export const RedesignTabBar = memo(function RedesignTabBar({
  activeTab,
  onTabPress,
}: RedesignTabBarProps) {
  const { colors, tokens } = useRedesignTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
      accessibilityRole="tablist"
    >
      {TABS.map((tab) => (
        <TabItem
          key={tab.key}
          tab={tab}
          isActive={activeTab === tab.key}
          onPress={() => onTabPress(tab.key)}
        />
      ))}
    </View>
  );
});

// =============================================================================
// TAB NAVIGATOR
// =============================================================================

interface RedesignTabNavigatorProps {
  children: (activeTab: TabRoute) => React.ReactNode;
  initialTab?: TabRoute;
}

export function RedesignTabNavigator({
  children,
  initialTab = 'play',
}: RedesignTabNavigatorProps) {
  const [activeTab, setActiveTab] = React.useState<TabRoute>(initialTab);

  const handleTabPress = useCallback((tab: TabRoute) => {
    setActiveTab(tab);
  }, []);

  return (
    <View style={styles.container}>
      {/* Screen Content */}
      <View style={styles.content}>{children(activeTab)}</View>

      {/* Tab Bar */}
      <RedesignTabBar activeTab={activeTab} onTabPress={handleTabPress} />
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
  },

  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },

  tabItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },

  activeIndicator: {
    position: 'absolute',
    top: -4,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },

  iconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabLabel: {
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.3,
  },
});

export default RedesignTabNavigator;
