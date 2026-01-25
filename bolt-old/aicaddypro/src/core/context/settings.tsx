import AsyncStorage from '@react-native-async-storage/async-storage';
import * as React from 'react';

interface Settings {
  distanceUnit: 'yards' | 'meters';
  temperatureUnit: 'celsius' | 'fahrenheit';
  altitudeUnit: 'feet' | 'meters';
  speedUnit: 'mph' | 'kph' | 'kts' | 'mps';
  locationEnabled: boolean;
  compassEnabled: boolean;
  notificationsEnabled: boolean;
  activityTrackingEnabled: boolean;
  forecastProvider: 'auto' | 'stormglass' | 'openmeteo';
  forceOpenMeteo?: boolean;
  useMetar?: boolean;
  metarIcao?: string;
  version: number; // Added version field to force re-renders
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  convertDistance: (distance: number, to?: 'yards' | 'meters') => number;
  convertTemperature: (temp: number, to?: 'celsius' | 'fahrenheit') => number;
  convertAltitude: (altitude: number, to?: 'feet' | 'meters') => number;
  convertSpeed: (speedMph: number, to?: 'mph' | 'kph' | 'kts' | 'mps') => number;
  formatDistance: (distance: number) => string;
  formatTemperature: (temp: number) => string;
  formatAltitude: (altitude: number) => string;
  formatSpeed: (speedMph: number) => string;
}

const defaultSettings: Settings = {
  distanceUnit: 'yards',
  temperatureUnit: 'fahrenheit',
  altitudeUnit: 'feet',
  speedUnit: 'mph',
  locationEnabled: false,
  compassEnabled: false,
  notificationsEnabled: false,
  activityTrackingEnabled: false,
  forecastProvider: 'auto',
  forceOpenMeteo: false,
  useMetar: false,
  metarIcao: '',
  version: 1, // Initialize version field
};

const SettingsContext = React.createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: async () => {},
  convertDistance: () => 0,
  convertTemperature: () => 0,
  convertAltitude: () => 0,
  convertSpeed: () => 0,
  formatDistance: () => '',
  formatTemperature: () => '',
  formatAltitude: () => '',
  formatSpeed: () => '',
});

// Define action types for the reducer
type SettingsAction =
  | { type: 'INITIALIZE'; settings: Settings }
  | { type: 'UPDATE'; newSettings: Partial<Settings> };

// Reducer function for settings state
function settingsReducer(state: Settings, action: SettingsAction): Settings {
  switch (action.type) {
    case 'INITIALIZE':
      return action.settings;
    case 'UPDATE':
      return {
        ...state,
        ...action.newSettings,
        version: state.version + 1, // Increment version to force re-renders
      };
    default:
      return state;
  }
}

export function SettingsProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  // Use reducer instead of useState for more predictable state updates
  const [settings, dispatch] = React.useReducer(settingsReducer, defaultSettings);

  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem('userSettings');
        if (saved) {
          const parsedSettings = JSON.parse(saved);
          // Initialize with saved settings
          dispatch({ type: 'INITIALIZE', settings: parsedSettings });
          console.log('Settings loaded from AsyncStorage:', parsedSettings);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      console.log('Updating settings:', newSettings);

      // Update state first for immediate UI response
      dispatch({ type: 'UPDATE', newSettings });

      // Then save to AsyncStorage
      const updated = { ...settings, ...newSettings, version: settings.version + 1 };
      try {
        await AsyncStorage.setItem('userSettings', JSON.stringify(updated));
        console.log('Settings saved to AsyncStorage');
      } catch (error) {
        console.error('Failed to save settings to AsyncStorage:', error);
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  // Conversion functions remain unchanged
  const convertDistance = (distance: number, to?: 'yards' | 'meters') => {
    const unit = to || settings.distanceUnit;
    return unit === 'meters' ? distance * 0.9144 : distance / 0.9144;
  };

  const convertTemperature = (temp: number, to?: 'celsius' | 'fahrenheit') => {
    const unit = to || settings.temperatureUnit;
    return unit === 'fahrenheit' ? (temp * 9) / 5 + 32 : ((temp - 32) * 5) / 9;
  };

  const convertAltitude = (altitude: number, to?: 'feet' | 'meters') => {
    const unit = to || settings.altitudeUnit;
    return unit === 'feet' ? altitude * 3.28084 : altitude / 3.28084;
  };

  const convertSpeed = (speedMph: number, to?: 'mph' | 'kph' | 'kts' | 'mps'): number => {
    const unit = to || settings.speedUnit;
    switch (unit) {
      case 'mph':
        return speedMph;
      case 'kph':
        return speedMph * 1.60934;
      case 'kts':
        return speedMph * 0.868976;
      case 'mps':
        return speedMph * 0.44704;
      default:
        return speedMph;
    }
  };

  const formatDistance = (distance: number) =>
    `${Math.round(distance)} ${settings.distanceUnit === 'yards' ? 'yds' : 'm'}`;

  const formatTemperature = (temp: number) =>
    `${(Math.round(temp * 10) / 10).toFixed(1)}°${settings.temperatureUnit[0].toUpperCase()}`;

  const formatAltitude = (altitude: number) =>
    `${Math.round(altitude)} ${settings.altitudeUnit === 'feet' ? 'ft' : 'm'}`;

  const formatSpeed = (speedMph: number) => {
    const value = Math.round(convertSpeed(speedMph));
    const unitLabel = settings.speedUnit === 'mps' ? 'm/s' : settings.speedUnit;
    return `${value} ${unitLabel}`;
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        convertDistance,
        convertTemperature,
        convertAltitude,
        convertSpeed,
        formatDistance,
        formatTemperature,
        formatAltitude,
        formatSpeed,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => React.useContext(SettingsContext);
