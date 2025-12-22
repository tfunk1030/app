/**
 * FloatingTabBar Component
 *
 * A custom floating tab bar with glassmorphism and glow effects.
 * Designed to replace the default expo-router tab bar with a modern,
 * floating design that matches the app's design system.
 */

import { useThemeMode } from '@/src/theme/ThemeProvider';
import type { Tokens } from '@/src/theme/tokens';
import { useTokens } from '@/src/theme/useTokens';
import { getResponsiveSpacing, safeScaledFontSize } from '@/src/utils/responsive';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
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
  const styles = useMemo(() => createStyles(t), [t]);

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
        size: t.containerSize.icon.xs, // 24 - tab bar icon size
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
        color: t.colors.ripple,
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
  const styles = useMemo(() => createStyles(t), [t]);

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, getResponsiveSpacing(t.spacing.base, 'vertical')),
          paddingTop: getResponsiveSpacing(t.spacing.sm, 'vertical'),
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
              shadowColor: t.colors.shadow,
              shadowOffset: { width: 0, height: -t.spacing.xs },
              shadowOpacity: 0.25,
              shadowRadius: t.spacing.md,
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

/**
 * Create memoized styles based on theme tokens
 * This ensures consistent token usage and theme-aware styling
 */
const createStyles = (t: Tokens) => ({
  container: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: getResponsiveSpacing(t.spacing.md, 'horizontal'),
  },
  shadowWrapper: {
    borderRadius: t.borderRadius['3xl'], // 24
  },
  blurContainer: {
    borderRadius: t.borderRadius['3xl'], // 24
    overflow: 'hidden' as const,
  },
  tabBar: {
    flexDirection: 'row' as const,
    borderRadius: t.borderRadius['3xl'], // 24
    borderWidth: t.borderWidth.thin, // 1
    paddingHorizontal: getResponsiveSpacing(t.spacing.sm, 'horizontal'),
    paddingVertical: getResponsiveSpacing(t.spacing.sm, 'vertical'),
    minHeight: 64, // Custom tab bar height
    alignItems: 'center' as const,
    justifyContent: 'space-around' as const,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: t.touchTarget.minimum, // 48
  },
  tabButtonContent: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    position: 'relative' as const,
  },
  glowContainer: {
    position: 'absolute' as const,
    top: -t.spacing.sm, // -8
    left: -t.spacing.sm, // -8
    right: -t.spacing.sm, // -8
    bottom: -t.spacing.sm, // -8
    borderRadius: t.borderRadius['2xl'], // 20
    overflow: 'hidden' as const,
  },
  glowGradient: {
    flex: 1,
    opacity: 0.3,
  },
  iconContainer: {
    marginBottom: t.spacing.xs, // 4
  },
  label: {
    fontWeight: t.fontWeight.semibold as '600', // '600'
    textAlign: 'center' as const,
    fontSize: safeScaledFontSize(t.fontSize.xs - 1, { maxScale: 1.15 }), // 11 - tab bar label size
  },
});
