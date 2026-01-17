/**
 * GradientHero Component
 *
 * Full-screen gradient hero background for screen headers.
 * Uses the Bold & Colorful gradient system for consistent theming.
 *
 * Usage:
 * <GradientHero variant="primary">
 *   <PageTitle title="Shot" />
 * </GradientHero>
 */

import { useTokens } from '@/src/theme/useTokens';
import { gradients, GradientColors } from '@/src/theme/gradients';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
  View,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Available hero gradient variants mapped to screen types */
type HeroVariant =
  | 'primary' // Shot screen - emerald accent
  | 'wind' // Wind screen - cyan accent
  | 'settings' // Settings screen - violet accent
  | 'clubs' // Club library - teal accent
  | 'premium' // Premium features - violet to fuchsia
  | 'sunset'; // Warm gradient - orange to coral

/** Height mode for the hero section */
type HeightMode =
  | 'auto' // Fit content with padding
  | 'compact' // Fixed compact height (120px)
  | 'standard' // Fixed standard height (180px)
  | 'large' // Fixed large height (240px)
  | 'full'; // Full screen height

interface GradientHeroProps {
  children?: React.ReactNode;
  /** Hero gradient variant matching the screen context */
  variant?: HeroVariant;
  /** Custom gradient colors (overrides variant) */
  colors?: GradientColors;
  /** Height mode for the hero section */
  height?: HeightMode;
  /** Custom fixed height in pixels (overrides height mode) */
  customHeight?: number;
  /** Include safe area inset at top */
  safeAreaTop?: boolean;
  /** Additional padding at bottom */
  paddingBottom?: number;
  /** Show bottom fade overlay for content scrolling underneath */
  showBottomFade?: boolean;
  /** Container style overrides */
  style?: ViewStyle;
  /** Content container style overrides */
  contentStyle?: ViewStyle;
}

/**
 * GradientHero - Bold gradient background for screen headers
 *
 * Replaces flat backgrounds with vibrant gradient hero sections.
 * Supports different variants for each main screen type.
 *
 * @example
 * // Basic usage for Shot screen
 * <GradientHero variant="primary">
 *   <PageTitle title="Shot Calculator" />
 * </GradientHero>
 *
 * @example
 * // Full screen hero with safe area
 * <GradientHero variant="wind" height="large" safeAreaTop>
 *   <View>
 *     <Text>Wind Analysis</Text>
 *   </View>
 * </GradientHero>
 *
 * @example
 * // Custom gradient colors
 * <GradientHero colors={['#1a1a2e', '#16213e', '#0f3460']}>
 *   <Text>Custom Hero</Text>
 * </GradientHero>
 */
export const GradientHero: React.FC<GradientHeroProps> = ({
  children,
  variant = 'primary',
  colors,
  height = 'auto',
  customHeight,
  safeAreaTop = true,
  paddingBottom = 16,
  showBottomFade = false,
  style,
  contentStyle,
}) => {
  const t = useTokens();
  const insets = useSafeAreaInsets();

  // Get gradient colors based on variant or custom colors
  const getGradientColors = (): GradientColors => {
    if (colors) {
      return colors;
    }

    switch (variant) {
      case 'wind':
        return gradients.hero.wind;
      case 'settings':
        return gradients.hero.settings;
      case 'clubs':
        return gradients.hero.clubs;
      case 'premium':
        return gradients.hero.premium;
      case 'sunset':
        return gradients.hero.sunset;
      case 'primary':
      default:
        return gradients.hero.primary;
    }
  };

  // Calculate height based on mode
  const getHeight = (): number | 'auto' | undefined => {
    if (customHeight !== undefined) {
      return customHeight;
    }

    const { height: screenHeight } = Dimensions.get('window');

    switch (height) {
      case 'compact':
        return 120;
      case 'standard':
        return 180;
      case 'large':
        return 240;
      case 'full':
        return screenHeight;
      case 'auto':
      default:
        return undefined;
    }
  };

  // Calculate top padding for safe area
  const getTopPadding = (): number => {
    if (!safeAreaTop) {
      return Platform.OS === 'ios' ? 8 : (StatusBar.currentHeight || 0) * 0.25;
    }

    // Use safe area insets for proper spacing
    const safeTop = insets.top || (Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24);
    return safeTop + 8; // Add small buffer
  };

  const calculatedHeight = getHeight();
  const topPadding = getTopPadding();

  return (
    <View
      style={[
        styles.container,
        calculatedHeight !== undefined && { height: calculatedHeight },
        style,
      ]}
    >
      {/* Main gradient background */}
      <LinearGradient
        colors={getGradientColors() as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      />

      {/* Content container */}
      <View
        style={[
          styles.content,
          {
            paddingTop: topPadding,
            paddingBottom: paddingBottom,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>

      {/* Optional bottom fade for content scrolling underneath */}
      {showBottomFade && (
        <LinearGradient
          colors={gradients.overlay.bottomFade as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.bottomFade}
          pointerEvents="none"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
    zIndex: 1,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 40,
  },
});

export default GradientHero;
