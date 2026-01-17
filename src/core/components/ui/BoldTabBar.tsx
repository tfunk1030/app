/**
 * BoldTabBar Component
 *
 * A custom tab bar with bold gradient styling and haptic feedback.
 * Replaces the FloatingTabBar with the new Bold & Colorful design language.
 * No glassmorphism - uses solid gradient backgrounds for better performance
 * and a more vibrant appearance.
 */

import { gradients, boldColors } from '@/src/theme/gradients';
import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import { getResponsiveSpacing } from '@/src/utils/responsive';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from 'react-native-reanimated';
import { useReduceMotionValue } from '@/src/hooks/useReduceMotion';
import { springConfigs } from '@/src/theme/animations';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TabButtonProps {
  route: BottomTabBarProps['state']['routes'][0];
  index: number;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  options: BottomTabBarProps['descriptors'][string]['options'];
}

const TabButton: React.FC<TabButtonProps> = ({
  route,
  isFocused,
  onPress,
  onLongPress,
  options,
}) => {
  const t = useTokens();
  const { isDark } = useThemeMode();
  const reduceMotion = useReduceMotionValue();

  // Use useDerivedValue for better performance - animates directly on UI thread
  // without requiring useEffect re-renders
  const targetScale = isFocused ? 1 : 0.9;
  const targetOpacity = isFocused ? 1 : 0;

  const scale = useDerivedValue(() => {
    // Skip animation if reduce motion is enabled
    if (reduceMotion) {
      return targetScale;
    }
    // Use stiff spring for snappy response without prolonged bouncing
    return withSpring(targetScale, springConfigs.stiff);
  }, [targetScale, reduceMotion]);

  const indicatorOpacity = useDerivedValue(() => {
    if (reduceMotion) {
      return targetOpacity;
    }
    return withSpring(targetOpacity, springConfigs.stiff);
  }, [targetOpacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
  }));

  const label = options.tabBarLabel ?? options.title ?? route.name;

  // Use gradient colors for active state
  // Note: Light mode uses emeraldDark (#059669) for better contrast on white backgrounds
  // Dark mode: emerald (#10B981) on slate900 = 5.12:1 ✓
  // Light mode: emeraldDark (#059669) on white = 3.63:1 ✓ (meets 3:1 for UI components/bold text)
  const activeColor = isDark ? boldColors.emerald : boldColors.emeraldDark;
  const inactiveColor = isDark ? 'rgba(148, 163, 184, 0.7)' : 'rgba(100, 116, 139, 0.8)';

  const icon = options.tabBarIcon
    ? options.tabBarIcon({
        focused: isFocused,
        color: isFocused ? activeColor : inactiveColor,
        size: 24,
      })
    : null;

  // Handle press with haptic feedback
  const handlePress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics not available
    }
    onPress();
  };

  // Handle long press with haptic feedback
  const handleLongPress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics not available
    }
    onLongPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={[styles.tabButton, animatedStyle]}
      android_ripple={{
        color: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)',
        borderless: true,
      }}
      accessibilityRole="tab"
      accessibilityLabel={typeof label === 'string' ? label : route.name}
      accessibilityState={{ selected: isFocused }}
    >
      <View style={styles.tabButtonContent}>
        {/* Active indicator with gradient */}
        {isFocused && (
          <Animated.View style={[styles.activeIndicator, indicatorStyle]}>
            <LinearGradient
              colors={gradients.tabBar.activeIndicator as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.indicatorGradient}
            />
          </Animated.View>
        )}

        {/* Icon */}
        <View style={styles.iconContainer}>{icon}</View>

        {/* Label */}
        {typeof label === 'string' && (
          <Text
            style={[
              styles.label,
              {
                color: isFocused ? activeColor : inactiveColor,
                fontWeight: isFocused ? '700' : '600',
              },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        )}
      </View>
    </AnimatedPressable>
  );
};

export const BoldTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const { isDark } = useThemeMode();
  const insets = useSafeAreaInsets();

  // Select gradient based on theme
  const backgroundGradient = isDark
    ? gradients.tabBar.backgroundDark
    : gradients.tabBar.backgroundLight;

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, getResponsiveSpacing(12, 'vertical')),
          paddingTop: getResponsiveSpacing(8, 'vertical'),
        },
      ]}
    >
      {/* Shadow wrapper for elevation */}
      <View
        style={[
          styles.shadowWrapper,
          {
            shadowColor: isDark ? boldColors.emerald : '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: isDark ? 0.3 : 0.15,
            shadowRadius: 16,
            elevation: 12,
          },
        ]}
      >
        {/* Gradient background container */}
        <LinearGradient
          colors={backgroundGradient as [string, string, ...string[]]}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={styles.gradientContainer}
        >
          {/* Top accent gradient line */}
          <View style={styles.accentLineContainer}>
            <LinearGradient
              colors={gradients.primary as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.accentLine}
            />
          </View>

          {/* Tab bar content */}
          <View
            style={[
              styles.tabBar,
              {
                borderColor: isDark
                  ? 'rgba(51, 65, 85, 0.5)'
                  : 'rgba(226, 232, 240, 0.8)',
              },
            ]}
            accessibilityRole="tablist"
          >
            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const isFocused = state.index === index;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              };

              const onLongPress = () => {
                navigation.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              };

              return (
                <TabButton
                  key={route.key}
                  route={route}
                  index={index}
                  isFocused={isFocused}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  options={options}
                />
              );
            })}
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: getResponsiveSpacing(16, 'horizontal'),
  },
  shadowWrapper: {
    borderRadius: 24,
  },
  gradientContainer: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  accentLineContainer: {
    height: 2,
    overflow: 'hidden',
  },
  accentLine: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 24,
    borderTopWidth: 0,
    borderWidth: 1,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingHorizontal: getResponsiveSpacing(8, 'horizontal'),
    paddingVertical: getResponsiveSpacing(8, 'vertical'),
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  tabButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: -10,
    left: -12,
    right: -12,
    bottom: -6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  indicatorGradient: {
    flex: 1,
    opacity: 0.15,
  },
  iconContainer: {
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
  },
});
