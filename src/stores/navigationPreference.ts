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
  style: 'redesign', // Default to redesign (unified 3-tab layout)
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
      // Force redesign layout - ignore stored preference during transition
      // TODO: Remove this override once redesign is confirmed as final
      await AsyncStorage.setItem(STORAGE_KEY, 'redesign');
      set({ style: 'redesign', isLoaded: true });
    } catch (error) {
      console.error('Failed to load navigation preference:', error);
      set({ style: 'redesign', isLoaded: true });
    }
  },

  toggle: async () => {
    const current = get().style;
    const next: NavigationStyle = current === 'classic' ? 'redesign' : 'classic';
    await get().setStyle(next);
  },
}));
