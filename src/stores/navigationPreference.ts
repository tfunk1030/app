/**
 * Navigation Preference Store
 *
 * Manages the user's preference between the original 5-tab navigation
 * and the redesigned 3-tab navigation.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = '@aicaddy/navigation_preference';

export type NavigationStyle = 'classic' | 'redesign';

interface NavigationPreferenceState {
  /** Current navigation style preference */
  style: NavigationStyle;
  /** Whether the preference has been loaded from storage */
  isLoaded: boolean;
  /** Set the navigation style and persist to storage */
  setStyle: (style: NavigationStyle) => Promise<void>;
  /** Load the preference from storage */
  loadPreference: () => Promise<void>;
  /** Toggle between classic and redesign */
  toggle: () => Promise<void>;
}

export const useNavigationPreference = create<NavigationPreferenceState>((set, get) => ({
  style: 'classic',
  isLoaded: false,

  setStyle: async (style: NavigationStyle) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, style);
      set({ style });
    } catch (error) {
      console.error('Failed to save navigation preference:', error);
    }
  },

  loadPreference: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored === 'classic' || stored === 'redesign') {
        set({ style: stored, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch (error) {
      console.error('Failed to load navigation preference:', error);
      set({ isLoaded: true });
    }
  },

  toggle: async () => {
    const current = get().style;
    const next: NavigationStyle = current === 'classic' ? 'redesign' : 'classic';
    await get().setStyle(next);
  },
}));
