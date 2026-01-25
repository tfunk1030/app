/**
 * useClubData.ts
 *
 * A custom hook for managing club data and selection.
 * Provides a centralized way to access and update club data
 * with persistence and validation.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettings } from '@/src/core/context/settings';
import { LogManager } from '@/src/utils/LogManager';

// Create a logger for club data
const logger = LogManager.getLogger('useClubData');

// Storage keys
const STORAGE_KEY_CLUBS = 'user_clubs';
const STORAGE_KEY_ACTIVE_CLUB = 'active_club';

// Club types
export enum ClubType {
  DRIVER = 'driver',
  WOOD = 'wood',
  HYBRID = 'hybrid',
  IRON = 'iron',
  WEDGE = 'wedge',
  PUTTER = 'putter',
}

// Club data interface
export interface Club {
  id: string;
  name: string;
  type: ClubType;
  loft: number;
  distance: number; // Average distance in yards
  minDistance?: number; // Minimum comfortable distance
  maxDistance?: number; // Maximum comfortable distance
  notes?: string;
  isDefault?: boolean;
}

// Club set interface
export interface ClubSet {
  id: string;
  name: string;
  clubs: Club[];
  isDefault?: boolean;
}

// Default clubs data
const DEFAULT_CLUBS: Club[] = [
  { id: 'driver-1', name: 'Driver', type: ClubType.DRIVER, loft: 10.5, distance: 230, isDefault: true },
  { id: '3-wood', name: '3 Wood', type: ClubType.WOOD, loft: 15, distance: 215 },
  { id: '5-wood', name: '5 Wood', type: ClubType.WOOD, loft: 18, distance: 200 },
  { id: '4-hybrid', name: '4 Hybrid', type: ClubType.HYBRID, loft: 22, distance: 190 },
  { id: '5-iron', name: '5 Iron', type: ClubType.IRON, loft: 25, distance: 180 },
  { id: '6-iron', name: '6 Iron', type: ClubType.IRON, loft: 28, distance: 170 },
  { id: '7-iron', name: '7 Iron', type: ClubType.IRON, loft: 32, distance: 160 },
  { id: '8-iron', name: '8 Iron', type: ClubType.IRON, loft: 36, distance: 150 },
  { id: '9-iron', name: '9 Iron', type: ClubType.IRON, loft: 40, distance: 140 },
  { id: 'pw', name: 'PW', type: ClubType.WEDGE, loft: 45, distance: 130 },
  { id: 'gw', name: 'GW', type: ClubType.WEDGE, loft: 50, distance: 115 },
  { id: 'sw', name: 'SW', type: ClubType.WEDGE, loft: 56, distance: 100 },
  { id: 'lw', name: 'LW', type: ClubType.WEDGE, loft: 60, distance: 85 },
  { id: 'putter', name: 'Putter', type: ClubType.PUTTER, loft: 3, distance: 0 },
];

// Default club set
const DEFAULT_CLUB_SET: ClubSet = {
  id: 'default-set',
  name: 'Default Set',
  clubs: DEFAULT_CLUBS,
  isDefault: true,
};

/**
 * Custom hook for managing club data
 */
export function useClubData() {
  // Get global settings
  const { settings: globalSettings } = useSettings();

  // Local state for club data
  const [clubSets, setClubSets] = useState<ClubSet[]>([DEFAULT_CLUB_SET]);
  const [activeClubSetId, setActiveClubSetId] = useState<string>(DEFAULT_CLUB_SET.id);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derived state for active club set
  const activeClubSet = useMemo(() => {
    return clubSets.find(set => set.id === activeClubSetId) || DEFAULT_CLUB_SET;
  }, [clubSets, activeClubSetId]);

  // Load club data from storage
  useEffect(() => {
    const loadClubData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load club sets from AsyncStorage
        const clubSetsStr = await AsyncStorage.getItem(STORAGE_KEY_CLUBS);
        const activeClubSetIdStr = await AsyncStorage.getItem(STORAGE_KEY_ACTIVE_CLUB);

        // Parse club sets
        let loadedClubSets: ClubSet[] = [];
        if (clubSetsStr) {
          try {
            const parsed = JSON.parse(clubSetsStr);
            if (Array.isArray(parsed)) {
              loadedClubSets = parsed;
            } else {
              logger.warn('Invalid club sets data format', parsed);
            }
          } catch (err) {
            logger.error('Error parsing club sets data', err);
          }
        }

        // Ensure we have at least the default set
        if (loadedClubSets.length === 0) {
          loadedClubSets = [DEFAULT_CLUB_SET];
        } else {
          // Ensure each club set has a valid structure
          loadedClubSets = loadedClubSets.map(set => ({
            ...set,
            clubs: Array.isArray(set.clubs) ? set.clubs : DEFAULT_CLUBS,
          }));
        }

        // Set club sets
        setClubSets(loadedClubSets);

        // Set active club set
        if (activeClubSetIdStr) {
          const setExists = loadedClubSets.some(set => set.id === activeClubSetIdStr);
          if (setExists) {
            setActiveClubSetId(activeClubSetIdStr);
          } else {
            // If the active set doesn't exist, use the default or first available
            const defaultSet = loadedClubSets.find(set => set.isDefault) || loadedClubSets[0];
            setActiveClubSetId(defaultSet.id);
          }
        } else {
          // If no active set is stored, use the default or first available
          const defaultSet = loadedClubSets.find(set => set.isDefault) || loadedClubSets[0];
          setActiveClubSetId(defaultSet.id);
        }

        logger.info('Club data loaded', {
          clubSets: loadedClubSets.length,
          activeSet: activeClubSetIdStr
        });
      } catch (err) {
        logger.error('Error loading club data', err);
        setError('Failed to load club data');
        setClubSets([DEFAULT_CLUB_SET]);
        setActiveClubSetId(DEFAULT_CLUB_SET.id);
      } finally {
        setIsLoading(false);
      }
    };

    loadClubData();
  }, []);

  // Save club sets to storage
  const saveClubSets = useCallback(async (sets: ClubSet[]): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_CLUBS, JSON.stringify(sets));
      setClubSets(sets);
      logger.info('Club sets saved', { count: sets.length });
      return true;
    } catch (err) {
      logger.error('Error saving club sets', err);
      setError('Failed to save club sets');
      return false;
    }
  }, []);

  // Save active club set ID
  const saveActiveClubSetId = useCallback(async (id: string): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_ACTIVE_CLUB, id);
      setActiveClubSetId(id);
      logger.info('Active club set saved', { id });
      return true;
    } catch (err) {
      logger.error('Error saving active club set', err);
      setError('Failed to save active club set');
      return false;
    }
  }, []);

  // Add a new club set
  const addClubSet = useCallback(async (newSet: Omit<ClubSet, 'id'>): Promise<string | null> => {
    try {
      const id = `set-${Date.now()}`;
      const clubSet: ClubSet = {
        ...newSet,
        id,
      };

      const updatedSets = [...clubSets, clubSet];
      const success = await saveClubSets(updatedSets);

      if (success) {
        // If this is the first non-default set or marked as default, make it active
        if (clubSets.length === 1 || newSet.isDefault) {
          await saveActiveClubSetId(id);
        }
        return id;
      }
      return null;
    } catch (err) {
      logger.error('Error adding club set', err);
      setError('Failed to add club set');
      return null;
    }
  }, [clubSets, saveClubSets, saveActiveClubSetId]);

  // Update an existing club set
  const updateClubSet = useCallback(async (id: string, updates: Partial<Omit<ClubSet, 'id'>>): Promise<boolean> => {
    try {
      const index = clubSets.findIndex(set => set.id === id);
      if (index === -1) {
        logger.warn(`Club set not found: ${id}`);
        return false;
      }

      const updatedSet = {
        ...clubSets[index],
        ...updates,
        id, // Ensure ID doesn't change
      };

      const updatedSets = [...clubSets];
      updatedSets[index] = updatedSet;

      return await saveClubSets(updatedSets);
    } catch (err) {
      logger.error(`Error updating club set ${id}`, err);
      setError('Failed to update club set');
      return false;
    }
  }, [clubSets, saveClubSets]);

  // Delete a club set
  const deleteClubSet = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Don't allow deleting the last set
      if (clubSets.length <= 1) {
        logger.warn('Cannot delete the only club set');
        setError('Cannot delete the only club set');
        return false;
      }

      // Filter out the set to delete
      const updatedSets = clubSets.filter(set => set.id !== id);

      // If we're deleting the active set, switch to another one
      if (id === activeClubSetId) {
        const newActiveSet = updatedSets.find(set => set.isDefault) || updatedSets[0];
        await saveActiveClubSetId(newActiveSet.id);
      }

      return await saveClubSets(updatedSets);
    } catch (err) {
      logger.error(`Error deleting club set ${id}`, err);
      setError('Failed to delete club set');
      return false;
    }
  }, [clubSets, activeClubSetId, saveClubSets, saveActiveClubSetId]);

  // Set active club set
  const setActiveClubSet = useCallback(async (id: string): Promise<boolean> => {
    try {
      const setExists = clubSets.some(set => set.id === id);
      if (!setExists) {
        logger.warn(`Club set not found: ${id}`);
        return false;
      }

      return await saveActiveClubSetId(id);
    } catch (err) {
      logger.error(`Error setting active club set ${id}`, err);
      setError('Failed to set active club set');
      return false;
    }
  }, [clubSets, saveActiveClubSetId]);

  // Add a club to the active set
  const addClub = useCallback(async (newClub: Omit<Club, 'id'>): Promise<string | null> => {
    try {
      const id = `club-${Date.now()}`;
      const club: Club = {
        ...newClub,
        id,
      };

      // Find the active set
      const activeSetIndex = clubSets.findIndex(set => set.id === activeClubSetId);
      if (activeSetIndex === -1) {
        logger.warn(`Active club set not found: ${activeClubSetId}`);
        return null;
      }

      // Create updated club set with the new club
      const updatedSet = {
        ...clubSets[activeSetIndex],
        clubs: [...clubSets[activeSetIndex].clubs, club],
      };

      // Update club sets
      const updatedSets = [...clubSets];
      updatedSets[activeSetIndex] = updatedSet;

      const success = await saveClubSets(updatedSets);
      return success ? id : null;
    } catch (err) {
      logger.error('Error adding club', err);
      setError('Failed to add club');
      return null;
    }
  }, [clubSets, activeClubSetId, saveClubSets]);

  // Update a club in the active set
  const updateClub = useCallback(async (id: string, updates: Partial<Omit<Club, 'id'>>): Promise<boolean> => {
    try {
      // Find the active set
      const activeSetIndex = clubSets.findIndex(set => set.id === activeClubSetId);
      if (activeSetIndex === -1) {
        logger.warn(`Active club set not found: ${activeClubSetId}`);
        return false;
      }

      // Find the club
      const clubIndex = clubSets[activeSetIndex].clubs.findIndex(club => club.id === id);
      if (clubIndex === -1) {
        logger.warn(`Club not found: ${id}`);
        return false;
      }

      // Create updated club
      const updatedClub = {
        ...clubSets[activeSetIndex].clubs[clubIndex],
        ...updates,
        id, // Ensure ID doesn't change
      };

      // Create updated clubs array
      const updatedClubs = [...clubSets[activeSetIndex].clubs];
      updatedClubs[clubIndex] = updatedClub;

      // Create updated club set
      const updatedSet = {
        ...clubSets[activeSetIndex],
        clubs: updatedClubs,
      };

      // Update club sets
      const updatedSets = [...clubSets];
      updatedSets[activeSetIndex] = updatedSet;

      return await saveClubSets(updatedSets);
    } catch (err) {
      logger.error(`Error updating club ${id}`, err);
      setError('Failed to update club');
      return false;
    }
  }, [clubSets, activeClubSetId, saveClubSets]);

  // Delete a club from the active set
  const deleteClub = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Find the active set
      const activeSetIndex = clubSets.findIndex(set => set.id === activeClubSetId);
      if (activeSetIndex === -1) {
        logger.warn(`Active club set not found: ${activeClubSetId}`);
        return false;
      }

      // Don't allow deleting all clubs
      if (clubSets[activeSetIndex].clubs.length <= 1) {
        logger.warn('Cannot delete the only club');
        setError('Cannot delete the only club');
        return false;
      }

      // Create updated clubs array without the deleted club
      const updatedClubs = clubSets[activeSetIndex].clubs.filter(club => club.id !== id);

      // Create updated club set
      const updatedSet = {
        ...clubSets[activeSetIndex],
        clubs: updatedClubs,
      };

      // Update club sets
      const updatedSets = [...clubSets];
      updatedSets[activeSetIndex] = updatedSet;

      return await saveClubSets(updatedSets);
    } catch (err) {
      logger.error(`Error deleting club ${id}`, err);
      setError('Failed to delete club');
      return false;
    }
  }, [clubSets, activeClubSetId, saveClubSets]);

  // Get recommended club for a distance
  const getRecommendedClub = useCallback((distance: number): Club | null => {
    if (!activeClubSet || !activeClubSet.clubs || activeClubSet.clubs.length === 0) {
      return null;
    }

    // Sort clubs by distance (descending)
    const sortedClubs = [...activeClubSet.clubs]
      .filter(club => club.type !== ClubType.PUTTER) // Exclude putter
      .sort((a, b) => b.distance - a.distance);

    // Find the first club with a distance less than or equal to the target
    for (const club of sortedClubs) {
      if (club.distance <= distance) {
        return club;
      }
    }

    // If no club is found (distance is shorter than all clubs), return the shortest club
    return sortedClubs[sortedClubs.length - 1] || null;
  }, [activeClubSet]);

  // Reset to defaults
  const resetToDefaults = useCallback(async (): Promise<boolean> => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEY_CLUBS),
        AsyncStorage.removeItem(STORAGE_KEY_ACTIVE_CLUB),
      ]);

      setClubSets([DEFAULT_CLUB_SET]);
      setActiveClubSetId(DEFAULT_CLUB_SET.id);
      logger.info('Club data reset to defaults');
      return true;
    } catch (err) {
      logger.error('Error resetting club data', err);
      setError('Failed to reset club data');
      return false;
    }
  }, []);

  return {
    clubSets,
    activeClubSet,
    activeClubSetId,
    isLoading,
    error,
    addClubSet,
    updateClubSet,
    deleteClubSet,
    setActiveClubSet,
    addClub,
    updateClub,
    deleteClub,
    getRecommendedClub,
    resetToDefaults,
  };
}
