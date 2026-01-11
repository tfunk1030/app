import * as React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClubData } from '@/src/core/models/YardageModel';

// Generate unique ID for clubs
const generateClubId = () => `club-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Club validation
export interface ClubValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateClub(club: Partial<ClubData>): ClubValidationResult {
  const errors: string[] = [];

  if (!club.name || club.name.trim().length === 0) {
    errors.push('Club name is required');
  }
  if (!club.normalYardage || club.normalYardage < 20 || club.normalYardage > 400) {
    errors.push('Distance must be between 20 and 400 yards');
  }
  if (club.ball_speed !== undefined && (club.ball_speed < 50 || club.ball_speed > 200)) {
    errors.push('Ball speed must be between 50 and 200 mph');
  }
  if (club.launch_angle !== undefined && (club.launch_angle < 0 || club.launch_angle > 45)) {
    errors.push('Launch angle must be between 0 and 45 degrees');
  }
  if (club.spin_rate !== undefined && (club.spin_rate < 1000 || club.spin_rate > 15000)) {
    errors.push('Spin rate must be between 1,000 and 15,000 rpm');
  }

  return { isValid: errors.length === 0, errors };
}

// Club presets for different skill levels
export type ClubPresetType = 'beginner' | 'amateur' | 'scratch' | 'pro';

export const CLUB_PRESETS: Record<ClubPresetType, { name: string; description: string; multiplier: number }> = {
  beginner: { name: 'Beginner', description: 'Learning the game', multiplier: 0.7 },
  amateur: { name: 'Amateur', description: 'Regular golfer', multiplier: 0.85 },
  scratch: { name: 'Scratch', description: 'Low handicap', multiplier: 1.0 },
  pro: { name: 'Pro', description: 'Tour-level distances', multiplier: 1.1 },
};

interface ClubSettingsContextType {
  clubs: ClubData[];
  addClub: (club: ClubData) => Promise<void>;
  updateClub: (clubId: string, club: ClubData) => Promise<void>;
  removeClub: (clubId: string) => Promise<void>;
  getRecommendedClub: (targetYardage: number) => ClubData | null;
  loadPreset: (preset: ClubPresetType) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const DEFAULT_CLUBS: ClubData[] = [
  { id: 'default-driver', name: "Driver", normalYardage: 300, ball_speed: 175.5, launch_angle: 11.0, spin_rate: 2575, max_height: 40, land_angle: 39, spin_decay: 0.08, wind_sensitivity: 1.0 },
  { id: 'default-3wood', name: "3-Wood", normalYardage: 260, ball_speed: 160, launch_angle: 10.5, spin_rate: 3333, max_height: 38, land_angle: 42, spin_decay: 0.09, wind_sensitivity: 1.0 },
  { id: 'default-5wood', name: "5-Wood", normalYardage: 235, ball_speed: 156, launch_angle: 10.7, spin_rate: 4622, max_height: 34, land_angle: 37, spin_decay: 0.10, wind_sensitivity: 1.0 },
  { id: 'default-hybrid', name: "Hybrid", normalYardage: 235, ball_speed: 149, launch_angle: 10.2, spin_rate: 4587, max_height: 34, land_angle: 37, spin_decay: 0.10, wind_sensitivity: 1.0 },
  { id: 'default-3iron', name: "3-Iron", normalYardage: 235, ball_speed: 144.4, launch_angle: 11.5, spin_rate: 4273, max_height: 34, land_angle: 37, spin_decay: 0.10, wind_sensitivity: 1.0 },
  { id: 'default-4iron', name: "4-Iron", normalYardage: 220, ball_speed: 135.4, launch_angle: 12.0, spin_rate: 4073, max_height: 33, land_angle: 40, spin_decay: 0.105, wind_sensitivity: 1.0 },
  { id: 'default-5iron', name: "5-Iron", normalYardage: 205, ball_speed: 132.4, launch_angle: 13.6, spin_rate: 5074, max_height: 37, land_angle: 42.6, spin_decay: 0.11, wind_sensitivity: 1.0 },
  { id: 'default-6iron', name: "6-Iron", normalYardage: 192, ball_speed: 130, launch_angle: 15.0, spin_rate: 6004, max_height: 36, land_angle: 46, spin_decay: 0.115, wind_sensitivity: 1.0 },
  { id: 'default-7iron', name: "7-Iron", normalYardage: 180, ball_speed: 124, launch_angle: 16.8, spin_rate: 7024, max_height: 35.5, land_angle: 48.2, spin_decay: 0.12, wind_sensitivity: 1.0 },
  { id: 'default-8iron', name: "8-Iron", normalYardage: 165, ball_speed: 116, launch_angle: 18.5, spin_rate: 7708, max_height: 35, land_angle: 47.3, spin_decay: 0.13, wind_sensitivity: 1.0 },
  { id: 'default-9iron', name: "9-Iron", normalYardage: 153, ball_speed: 112, launch_angle: 19.6, spin_rate: 8893, max_height: 34, land_angle: 49.6, spin_decay: 0.14, wind_sensitivity: 1.0 },
  { id: 'default-pw', name: "PW", normalYardage: 138, ball_speed: 107.5, launch_angle: 21.3, spin_rate: 9236, max_height: 34, land_angle: 50.6, spin_decay: 0.15, wind_sensitivity: 1.0 },
  { id: 'default-gw', name: "GW", normalYardage: 125, ball_speed: 95.8, launch_angle: 23.0, spin_rate: 10070, max_height: 33, land_angle: 51.1, spin_decay: 0.155, wind_sensitivity: 1.0 },
  { id: 'default-sw', name: "SW", normalYardage: 110, ball_speed: 89, launch_angle: 25.3, spin_rate: 10800, max_height: 33, land_angle: 51.4, spin_decay: 0.16, wind_sensitivity: 1.0 },
  { id: 'default-lw', name: "LW", normalYardage: 90, ball_speed: 77, launch_angle: 28.1, spin_rate: 12000, max_height: 33, land_angle: 52, spin_decay: 0.165, wind_sensitivity: 1.0 }
];

const ClubSettingsContext = React.createContext<ClubSettingsContextType>({
  clubs: DEFAULT_CLUBS,
  addClub: async () => {},
  updateClub: async () => {},
  removeClub: async () => {},
  getRecommendedClub: () => null,
  loadPreset: async () => {},
  resetToDefaults: async () => {},
});

export function ClubSettingsProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [clubs, setClubs] = React.useState<ClubData[]>(DEFAULT_CLUBS);

  React.useEffect(() => {
    const loadSavedClubs = async () => {
      try {
        const savedClubs = await AsyncStorage.getItem('clubSettings');
        if (savedClubs) {
          // Migration: ensure all clubs have IDs
          const parsedClubs = JSON.parse(savedClubs).map((club: ClubData) => ({
            ...club,
            id: club.id || generateClubId()
          }));
          setClubs(sortClubs(parsedClubs));
        }
      } catch (error) {
        console.error('Failed to load club settings:', error);
      }
    };

    loadSavedClubs();
  }, []);

  const sortClubs = (clubsToSort: ClubData[]): ClubData[] => {
    return [...clubsToSort].sort((a, b) => b.normalYardage - a.normalYardage);
  };

  const saveClubs = async (clubsToSave: ClubData[]) => {
    try {
      await AsyncStorage.setItem('clubSettings', JSON.stringify(clubsToSave));
    } catch (error) {
      console.error('Failed to save club settings:', error);
    }
  };

  const getRecommendedClub = React.useCallback((targetYardage: number): ClubData | null => {
    if (!clubs.length) return null;

    return clubs.reduce((prev, curr) => {
      if (!prev) return curr;
      return Math.abs(curr.normalYardage - targetYardage) < Math.abs(prev.normalYardage - targetYardage)
        ? curr
        : prev;
    });
  }, [clubs]);

  const addClub = React.useCallback(async (club: ClubData) => {
    // Ensure new club has an ID
    const clubWithId = { ...club, id: club.id || generateClubId() };
    setClubs(prev => {
      const newClubs = sortClubs([...prev, clubWithId]);
      saveClubs(newClubs);
      return newClubs;
    });
  }, []);

  // Changed: use clubId instead of index for stable updates after sorting
  const updateClub = React.useCallback(async (clubId: string, club: ClubData) => {
    setClubs(prev => {
      const newClubs = prev.map(c => c.id === clubId ? { ...club, id: clubId } : c);
      const sortedClubs = sortClubs(newClubs);
      saveClubs(sortedClubs);
      return sortedClubs;
    });
  }, []);

  // Changed: use clubId instead of index for stable deletes after sorting
  const removeClub = React.useCallback(async (clubId: string) => {
    setClubs(prev => {
      const newClubs = prev.filter(c => c.id !== clubId);
      saveClubs(newClubs);
      return newClubs;
    });
  }, []);

  // Load a preset with adjusted distances
  const loadPreset = React.useCallback(async (preset: ClubPresetType) => {
    const { multiplier } = CLUB_PRESETS[preset];
    const presetClubs = DEFAULT_CLUBS.map(club => ({
      ...club,
      id: generateClubId(),
      normalYardage: Math.round(club.normalYardage * multiplier),
    }));
    const sortedClubs = sortClubs(presetClubs);
    setClubs(sortedClubs);
    await saveClubs(sortedClubs);
  }, []);

  // Reset to default clubs
  const resetToDefaults = React.useCallback(async () => {
    const defaultsWithIds = DEFAULT_CLUBS.map(club => ({
      ...club,
      id: generateClubId(),
    }));
    setClubs(defaultsWithIds);
    await saveClubs(defaultsWithIds);
  }, []);

  const value = React.useMemo(() => ({
    clubs,
    addClub,
    updateClub,
    removeClub,
    getRecommendedClub,
    loadPreset,
    resetToDefaults,
  }), [clubs, addClub, updateClub, removeClub, getRecommendedClub, loadPreset, resetToDefaults]);

  return (
    <ClubSettingsContext.Provider value={value}>
      {children}
    </ClubSettingsContext.Provider>
  );
}

export function useClubSettings() {
  const context = React.useContext(ClubSettingsContext);
  if (!context) {
    throw new Error('useClubSettings must be used within a ClubSettingsProvider');
  }
  return context;
}
