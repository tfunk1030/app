/**
 * Wind Tab Stack Layout
 *
 * Uses headerLargeTitle for iOS-native large title that shrinks on scroll.
 * headerBlurEffect provides native blur behind the header.
 */

import { Stack } from "expo-router/stack";

export default function WindStack() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerTransparent: true,
        headerBlurEffect: "systemMaterial",
        headerLargeTitleShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
        headerLargeStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "Wind Calculator" }}
      />
    </Stack>
  );
}
