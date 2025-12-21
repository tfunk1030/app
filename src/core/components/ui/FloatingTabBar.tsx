/**
 * FloatingTabBar Component
 *
 * A custom floating tab bar with glassmorphism and glow effects.
 * Designed to replace the default expo-router tab bar with a modern,
 * floating design that matches the app's design system.
 */

import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import { getResponsiveSpacing } from '@/src/utils/responsive';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
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
  index,
  isFocused,
  onPress,
  onLongPress,
  options,
}) => {
  const t = useTokens();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark' || mode === 'system';

  // Animation values
  const scale = useSharedValue(isFocused ? 1 : 0.9);
  const glowOpacity = useSharedValue(isFocused ? 1 : 0);

  React.useEffect(() => {
    scale.value = withSpring(isFocused ? 1 : 0.9, {
      damping: t.animation.spring.damping,
      stiffness: t.animation.spring.stiffness,
      mass: t.animation.spring.mass,
    });
    glowOpacity.value = withSpring(isFocused ? 1 : 0, {
      damping: t.animation.spring.damping,
      stiffness: t.animation.spring.stiffness,
      mass: t.animation.spring.mass,
    });
  }, [isFocused, scale, glowOpacity, t.animation.spring]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const label = options.tabBarLabel ?? options.title ?? route.name;
  const icon = options.tabBarIcon
    ? options.tabBarIcon({
        focused: isFocused,
        color: isFocused ? t.colors.brand : t.colors.textMuted,
        size: 24,
      })
    : null;

  const activeColor = t.colors.brand;
  const inactiveColor = t.colors.textMuted;

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.tabButton, animatedStyle]}
      android_ripple={{
        color: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
        borderless: true,
      }}
    >
      <View style={styles.tabButtonContent}>
        {/* Glow effect for active tab */}
        {isFocused && (
          <Animated.View
            style={[
              styles.glowContainer,
              glowStyle,
              {
                shadowColor: t.colors.glowPrimary,
                shadowOffset: t.shadow.glow.shadowOffset,
                shadowOpacity: t.shadow.glow.shadowOpacity * 0.6,
                shadowRadius: t.shadow.glow.shadowRadius,
                elevation: t.shadow.glow.elevation,
              },
            ]}
          >
            <LinearGradient
              colors={t.gradients.primary as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.glowGradient}
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
                fontSize: 11,
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

export const FloatingTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const t = useTokens();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark' || mode === 'system';
  const insets = useSafeAreaInsets();

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
      {/* Glassmorphism container */}
      {isDark ? (
        <View
          style={[
            styles.shadowWrapper,
            {
              // Subtle top shadow for better elevation perception in dark mode
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 12,
            },
          ]}
        >
          <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
            <View
              style={[
                styles.tabBar,
                {
                  backgroundColor: t.colors.surfaceGlass,
                  borderColor: t.colors.border,
                },
              ]}
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
          </BlurView>
        </View>
      ) : (
        <View
          style={[
            styles.tabBar,
            {
              backgroundColor: t.colors.surface,
              borderColor: t.colors.border,
              shadowColor: t.colors.shadow,
              shadowOffset: t.shadow.card.shadowOffset,
              shadowOpacity: t.shadow.card.shadowOpacity,
              shadowRadius: t.shadow.card.shadowRadius,
              elevation: t.shadow.card.elevation,
            },
          ]}
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
      )}
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
  blurContainer: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1,
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
  glowContainer: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  glowGradient: {
    flex: 1,
    opacity: 0.3,
  },
  iconContainer: {
    marginBottom: 4,
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
