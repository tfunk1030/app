import * as React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClubData } from '@/src/core/models/YardageModel';

interface ClubSettingsContextType {
  clubs: ClubData[];
  addClub: (club: ClubData) => Promise<void>;
  updateClub: (index: number, club: ClubData) => Promise<void>;
  removeClub: (index: number) => Promise<void>;
  getRecommendedClub: (targetYardage: number) => ClubData | null;
}

const DEFAULT_CLUBS: ClubData[] = [
  { name: "Driver", normalYardage: 300, ball_speed: 175.5, launch_angle: 11.0, spin_rate: 2575, max_height: 40, land_angle: 39, spin_decay: 0.08, wind_sensitivity: 1.0 },
  { name: "3-Wood", normalYardage: 260, ball_speed: 160, launch_angle: 10.5, spin_rate: 3333, max_height: 38, land_angle: 42, spin_decay: 0.09, wind_sensitivity: 1.0 },
  { name: "5-Wood", normalYardage: 235, ball_speed: 156, launch_angle: 10.7, spin_rate: 4622, max_height: 34, land_angle: 37, spin_decay: 0.10, wind_sensitivity: 1.0 },
  { name: "Hybrid", normalYardage: 235, ball_speed: 149, launch_angle: 10.2, spin_rate: 4587, max_height: 34, land_angle: 37, spin_decay: 0.10, wind_sensitivity: 1.0 },
  { name: "3-Iron", normalYardage: 235, ball_speed: 144.4, launch_angle: 11.5, spin_rate: 4273, max_height: 34, land_angle: 37, spin_decay: 0.10, wind_sensitivity: 1.0 },
  { name: "4-Iron", normalYardage: 220, ball_speed: 135.4, launch_angle: 12.0, spin_rate: 4073, max_height: 33, land_angle: 40, spin_decay: 0.105, wind_sensitivity: 1.0 },
  { name: "5-Iron", normalYardage: 205, ball_speed: 132.4, launch_angle: 13.6, spin_rate: 5074, max_height: 37, land_angle: 42.6, spin_decay: 0.11, wind_sensitivity: 1.0 },
  { name: "6-Iron", normalYardage: 192, ball_speed: 130, launch_angle: 15.0, spin_rate: 6004, max_height: 36, land_angle: 46, spin_decay: 0.115, wind_sensitivity: 1.0 },
  { name: "7-Iron", normalYardage: 180, ball_speed: 124, launch_angle: 16.8, spin_rate: 7024, max_height: 35.5, land_angle: 48.2, spin_decay: 0.12, wind_sensitivity: 1.0 },
  { name: "8-Iron", normalYardage: 165, ball_speed: 116, launch_angle: 18.5, spin_rate: 7708, max_height: 35, land_angle: 47.3, spin_decay: 0.13, wind_sensitivity: 1.0 },
  { name: "9-Iron", normalYardage: 153, ball_speed: 112, launch_angle: 19.6, spin_rate: 8893, max_height: 34, land_angle: 49.6, spin_decay: 0.14, wind_sensitivity: 1.0 },
  { name: "PW", normalYardage: 138, ball_speed: 107.5, launch_angle: 21.3, spin_rate: 9236, max_height: 34, land_angle: 50.6, spin_decay: 0.15, wind_sensitivity: 1.0 },
  { name: "GW", normalYardage: 125, ball_speed: 95.8, launch_angle: 23.0, spin_rate: 10070, max_height: 33, land_angle: 51.1, spin_decay: 0.155, wind_sensitivity: 1.0 },
  { name: "SW", normalYardage: 110, ball_speed: 89, launch_angle: 25.3, spin_rate: 10800, max_height: 33, land_angle: 51.4, spin_decay: 0.16, wind_sensitivity: 1.0 },
  { name: "LW", normalYardage: 90, ball_speed: 77, launch_angle: 28.1, spin_rate: 12000, max_height: 33, land_angle: 52, spin_decay: 0.165, wind_sensitivity: 1.0 }
];

const ClubSettingsContext = React.createContext<ClubSettingsContextType>({
  clubs: DEFAULT_CLUBS,
  addClub: async () => {},
  updateClub: async () => {},
  removeClub: async () => {},
  getRecommendedClub: () => null
});

export function ClubSettingsProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [clubs, setClubs] = React.useState<ClubData[]>(DEFAULT_CLUBS);

  React.useEffect(() => {
    const loadSavedClubs = async () => {
      try {
        const savedClubs = await AsyncStorage.getItem('clubSettings');
        if (savedClubs) {
          const parsedClubs = JSON.parse(savedClubs);
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
    setClubs(prev => {
      const newClubs = sortClubs([...prev, club]);
      saveClubs(newClubs);
      return newClubs;
    });
  }, []);

  const updateClub = React.useCallback(async (index: number, club: ClubData) => {
    setClubs(prev => {
      const newClubs = [...prev];
      newClubs[index] = club;
      const sortedClubs = sortClubs(newClubs);
      saveClubs(sortedClubs);
      return sortedClubs;
    });
  }, []);

  const removeClub = React.useCallback(async (index: number) => {
    setClubs(prev => {
      const newClubs = prev.filter((_, i) => i !== index);
      saveClubs(newClubs);
      return newClubs;
    });
  }, []);

  const value = React.useMemo(() => ({
    clubs,
    addClub,
    updateClub,
    removeClub,
    getRecommendedClub
  }), [clubs, addClub, updateClub, removeClub, getRecommendedClub]);

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
