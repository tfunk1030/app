/**
 * LockButton Storybook Stories
 *
 * Visual testing variants for the LockButton component.
 * Run Storybook with: yarn storybook-generate && yarn start
 */

import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import LockButton from './LockButton';

// Design token colors
const lightColors = {
  success: '#059669',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowAlpha: 'rgba(0, 0, 0, 0.1)',
  textPrimary: '#0F172A',
  ripple: 'rgba(0, 0, 0, 0.08)',
};

const darkColors = {
  success: '#10B981',
  surface: '#1E293B',
  border: 'rgba(71, 85, 105, 0.6)',
  shadow: 'rgba(0, 0, 0, 0.4)',
  shadowAlpha: 'rgba(0, 0, 0, 0.25)',
  textPrimary: '#F8FAFC',
  ripple: 'rgba(255, 255, 255, 0.12)',
};

// Create a mock SharedValue for stories (static, no animation)
const createMockSharedValue = (initialValue: number): SharedValue<number> => ({
  value: initialValue,
  get: () => initialValue,
  set: () => {},
  modify: () => {},
  addListener: () => -1,
  removeListener: () => {},
});

const staticPulse = createMockSharedValue(1);

const meta: Meta<typeof LockButton> = {
  title: 'Wind/LockButton',
  component: LockButton,
  decorators: [
    Story => (
      <View
        style={{
          width: 200,
          height: 200,
          backgroundColor: '#1E293B',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Story />
      </View>
    ),
  ],
  args: {
    isLocked: false,
    onPress: () => console.log('LockButton pressed'),
    compassSize: 180,
    tokens: { colors: darkColors },
    mode: 'dark',
    pulseAnim: staticPulse,
    side: 'right',
  },
};

export default meta;

type Story = StoryObj<typeof LockButton>;

// Lock state stories
export const Unlocked: Story = {
  name: 'Unlocked State',
  args: {
    isLocked: false,
  },
};

export const Locked: Story = {
  name: 'Locked State',
  args: {
    isLocked: true,
  },
};

// Theme stories
export const LightModeUnlocked: Story = {
  name: 'Light Mode - Unlocked',
  decorators: [
    Story => (
      <View
        style={{
          width: 200,
          height: 200,
          backgroundColor: '#FAFAFA',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Story />
      </View>
    ),
  ],
  args: {
    isLocked: false,
    tokens: { colors: lightColors },
    mode: 'light',
  },
};

export const LightModeLocked: Story = {
  name: 'Light Mode - Locked',
  decorators: [
    Story => (
      <View
        style={{
          width: 200,
          height: 200,
          backgroundColor: '#FAFAFA',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Story />
      </View>
    ),
  ],
  args: {
    isLocked: true,
    tokens: { colors: lightColors },
    mode: 'light',
  },
};

// Position stories
export const LeftSide: Story = {
  name: 'Left Side Position',
  args: {
    isLocked: false,
    side: 'left',
  },
};

export const RightSide: Story = {
  name: 'Right Side Position',
  args: {
    isLocked: false,
    side: 'right',
  },
};

// Size stories
export const SmallCompass: Story = {
  name: 'Small Compass (150px)',
  args: {
    compassSize: 150,
    isLocked: true,
  },
};

export const LargeCompass: Story = {
  name: 'Large Compass (220px)',
  args: {
    compassSize: 220,
    isLocked: true,
  },
};

// Combined comparison
export const AllStates: Story = {
  name: 'All States Comparison',
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 40 }}>
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: 100, height: 100, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' }}>
          <LockButton
            isLocked={false}
            onPress={() => {}}
            compassSize={80}
            tokens={{ colors: darkColors }}
            mode="dark"
            pulseAnim={staticPulse}
            side="right"
          />
        </View>
      </View>
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: 100, height: 100, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' }}>
          <LockButton
            isLocked={true}
            onPress={() => {}}
            compassSize={80}
            tokens={{ colors: darkColors }}
            mode="dark"
            pulseAnim={staticPulse}
            side="right"
          />
        </View>
      </View>
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: 100, height: 100, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center' }}>
          <LockButton
            isLocked={false}
            onPress={() => {}}
            compassSize={80}
            tokens={{ colors: lightColors }}
            mode="light"
            pulseAnim={staticPulse}
            side="right"
          />
        </View>
      </View>
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: 100, height: 100, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center' }}>
          <LockButton
            isLocked={true}
            onPress={() => {}}
            compassSize={80}
            tokens={{ colors: lightColors }}
            mode="light"
            pulseAnim={staticPulse}
            side="right"
          />
        </View>
      </View>
    </View>
  ),
};
