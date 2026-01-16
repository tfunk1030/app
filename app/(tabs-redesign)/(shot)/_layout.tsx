/**
 * Shot Tab Stack Layout
 *
 * Uses headerLargeTitle for iOS-native large title that shrinks on scroll.
 * headerBlurEffect provides native blur behind the header.
 */

import { Stack } from "expo-router/stack";

export default function ShotStack() {
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
        options={{ title: "Shot Calculator" }}
      />
    </Stack>
  );
}
