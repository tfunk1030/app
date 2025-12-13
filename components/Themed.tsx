/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */

import { Text as DefaultText, View as DefaultView, Platform } from 'react-native';

import { useThemeTokens } from '@/src/theme/ThemeProvider';
import { useColorScheme } from './useColorScheme';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof ReturnType<typeof useThemeTokens>['colors']
) {
  const theme = useColorScheme() ?? 'light';
  const tokens = useThemeTokens();
  const colorFromProps = props[theme === 'dark' ? 'dark' : 'light'];
  if (colorFromProps) return colorFromProps;
  return tokens.colors[colorName];
}

const defaultFontFamily = Platform.select({
  ios: 'SF Pro Display',
  android: 'Roboto',
  default: undefined,
});

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'textPrimary');
  return <DefaultText style={[{ color, fontFamily: defaultFontFamily }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}
