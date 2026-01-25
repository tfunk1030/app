/**
 * WindArrow Storybook Stories
 *
 * Visual testing variants for the WindArrow component.
 * Run Storybook with: yarn storybook-generate && yarn start
 */

import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import WindArrow from './WindArrow';

// Design token colors
const colors = {
  success: '#16A34A', // Tailwind green
  danger: '#DC2626', // Headwind red
  warning: '#F59E0B', // Crosswind yellow
  brandAlt: '#DAA520', // Default gold
  border: '#E5E7EB',
};

const meta: Meta<typeof WindArrow> = {
  title: 'Wind/WindArrow',
  component: WindArrow,
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
    angle: 0,
    brandAlt: colors.brandAlt,
    success: colors.success,
    danger: colors.danger,
    warning: colors.warning,
    border: colors.border,
    compassSize: 180,
    magnitude: 15,
    reducedMotion: false,
  },
};

export default meta;

type Story = StoryObj<typeof WindArrow>;

// Wind relationship stories - testing dynamic colors
export const Tailwind: Story = {
  name: 'Tailwind (Green)',
  args: {
    angle: 180,
    windRelationship: 'TAILWIND',
    magnitude: 15,
  },
};

export const Headwind: Story = {
  name: 'Headwind (Red)',
  args: {
    angle: 0,
    windRelationship: 'HEADWIND',
    magnitude: 15,
  },
};

export const Crosswind: Story = {
  name: 'Crosswind (Yellow)',
  args: {
    angle: 90,
    windRelationship: 'CROSSWIND',
    magnitude: 15,
  },
};

export const Quartering: Story = {
  name: 'Quartering (Gold)',
  args: {
    angle: 45,
    windRelationship: 'QUARTERING',
    magnitude: 15,
  },
};

// Wind magnitude stories - testing opacity/intensity
export const WeakWind: Story = {
  name: 'Weak Wind (5 mph)',
  args: {
    angle: 180,
    windRelationship: 'TAILWIND',
    magnitude: 5,
  },
};

export const ModerateWind: Story = {
  name: 'Moderate Wind (15 mph)',
  args: {
    angle: 180,
    windRelationship: 'TAILWIND',
    magnitude: 15,
  },
};

export const StrongWind: Story = {
  name: 'Strong Wind (25 mph)',
  args: {
    angle: 180,
    windRelationship: 'TAILWIND',
    magnitude: 25,
  },
};

export const MaxWind: Story = {
  name: 'Max Wind (30 mph)',
  args: {
    angle: 180,
    windRelationship: 'HEADWIND',
    magnitude: 30,
  },
};

// Gust animation stories
export const GustActive: Story = {
  name: 'Gust Active (Pulsing)',
  args: {
    angle: 0,
    windRelationship: 'HEADWIND',
    magnitude: 15,
    gustSpeed: 25,
  },
};

export const NoGust: Story = {
  name: 'No Gust (No Pulse)',
  args: {
    angle: 0,
    windRelationship: 'HEADWIND',
    magnitude: 15,
    gustSpeed: 15,
  },
};

// Accessibility stories
export const ReducedMotion: Story = {
  name: 'Reduced Motion',
  args: {
    angle: 180,
    windRelationship: 'TAILWIND',
    magnitude: 20,
    reducedMotion: true,
  },
};

// All directions for visual comparison
export const AllDirections: Story = {
  name: 'All Wind Relationships',
  render: args => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
      <View style={{ width: 100, height: 100, backgroundColor: '#1E293B' }}>
        <WindArrow {...args} windRelationship="TAILWIND" angle={180} />
      </View>
      <View style={{ width: 100, height: 100, backgroundColor: '#1E293B' }}>
        <WindArrow {...args} windRelationship="HEADWIND" angle={0} />
      </View>
      <View style={{ width: 100, height: 100, backgroundColor: '#1E293B' }}>
        <WindArrow {...args} windRelationship="CROSSWIND" angle={90} />
      </View>
      <View style={{ width: 100, height: 100, backgroundColor: '#1E293B' }}>
        <WindArrow {...args} windRelationship="QUARTERING" angle={45} />
      </View>
    </View>
  ),
  args: {
    compassSize: 80,
    magnitude: 15,
  },
};
