/**
 * CrosswindIndicator Storybook Stories
 *
 * Visual testing variants for the CrosswindIndicator component.
 * Run Storybook with: yarn storybook-generate && yarn start
 */

import type { Meta, StoryObj } from '@storybook/react';
import { View, Text } from 'react-native';
import CrosswindIndicator from './CrosswindIndicator';

// Design token colors
const colors = {
  warning: '#F59E0B', // Significant crosswind (yellow)
  neutral: '#94A3B8', // Minor crosswind (muted)
  text: '#F8FAFC',
};

const meta: Meta<typeof CrosswindIndicator> = {
  title: 'Wind/CrosswindIndicator',
  component: CrosswindIndicator,
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
    magnitude: 8,
    direction: 'left',
    unit: 'yds',
    compassSize: 180,
    colors,
  },
};

export default meta;

type Story = StoryObj<typeof CrosswindIndicator>;

// Direction stories
export const LeftCrosswind: Story = {
  name: 'Left Crosswind',
  args: {
    magnitude: 8,
    direction: 'left',
  },
};

export const RightCrosswind: Story = {
  name: 'Right Crosswind',
  args: {
    magnitude: 8,
    direction: 'right',
  },
};

// Magnitude stories
export const MinorCrosswind: Story = {
  name: 'Minor Crosswind (2 yds)',
  args: {
    magnitude: 2,
    direction: 'left',
  },
};

export const ModerateCrosswind: Story = {
  name: 'Moderate Crosswind (6 yds)',
  args: {
    magnitude: 6,
    direction: 'left',
  },
};

export const SignificantCrosswind: Story = {
  name: 'Significant Crosswind (10 yds)',
  args: {
    magnitude: 10,
    direction: 'left',
  },
};

export const MaxCrosswind: Story = {
  name: 'Max Crosswind (15 yds)',
  args: {
    magnitude: 15,
    direction: 'right',
  },
};

// Edge cases
export const NegligibleCrosswind: Story = {
  name: 'Negligible (Hidden < 1 yd)',
  args: {
    magnitude: 0.5,
    direction: 'left',
  },
};

export const JustVisible: Story = {
  name: 'Just Visible (1 yd)',
  args: {
    magnitude: 1,
    direction: 'left',
  },
};

// Comparison view
export const AllMagnitudes: Story = {
  name: 'All Magnitudes Comparison',
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
      {[2, 5, 8, 12, 15].map(mag => (
        <View key={mag} style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 100,
              height: 100,
              backgroundColor: '#1E293B',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <CrosswindIndicator
              magnitude={mag}
              direction="left"
              unit="yds"
              compassSize={80}
              colors={colors}
            />
          </View>
          <Text style={{ color: '#F8FAFC', marginTop: 4, fontSize: 12 }}>{mag} yds</Text>
        </View>
      ))}
    </View>
  ),
};

export const LeftVsRight: Story = {
  name: 'Left vs Right Direction',
  render: () => (
    <View style={{ flexDirection: 'row', gap: 40 }}>
      <View style={{ alignItems: 'center' }}>
        <View
          style={{
            width: 120,
            height: 120,
            backgroundColor: '#1E293B',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <CrosswindIndicator
            magnitude={10}
            direction="left"
            unit="yds"
            compassSize={100}
            colors={colors}
          />
        </View>
        <Text style={{ color: '#F8FAFC', marginTop: 8 }}>Left 10 yds</Text>
      </View>
      <View style={{ alignItems: 'center' }}>
        <View
          style={{
            width: 120,
            height: 120,
            backgroundColor: '#1E293B',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <CrosswindIndicator
            magnitude={10}
            direction="right"
            unit="yds"
            compassSize={100}
            colors={colors}
          />
        </View>
        <Text style={{ color: '#F8FAFC', marginTop: 8 }}>Right 10 yds</Text>
      </View>
    </View>
  ),
};
