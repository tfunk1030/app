/**
 * usePresets.ts
 *
 * A custom hook for managing user presets with AsyncStorage persistence.
 * Presets allow users to save and quickly restore common configurations
 * for shot parameters, wind conditions, and environmental settings.
 *
 * Storage Keys (namespaced as 'presets:'):
 * - 'presets:metadata' - Array of preset metadata (id, name, type, timestamps)
 * - 'presets:{id}' - Individual preset data
 */

import { useState, useEffect, useCallback, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Types
// ============================================================================

/**
 * Types of presets that can be saved
 */
export type PresetType = 'shot' | 'wind' | 'environmental' | 'combined';

/**
 * Shot-related preset data
 */
export interface ShotPresetData {
  distance?: number;
  elevation?: number;
  lie?: string;
  targetType?: string;
}

/**
 * Wind-related preset data
 */
export interface WindPresetData {
  windSpeed?: number;
  windDirection?: number;
  gustSpeed?: number;
}

/**
 * Environmental preset data
 */
export interface EnvironmentalPresetData {
  temperature?: number;
  humidity?: number;
  altitude?: number;
  pressure?: number;
}

/**
 * Combined preset data structure
 */
export interface PresetData {
  shot?: ShotPresetData;
  wind?: WindPresetData;
  environmental?: EnvironmentalPresetData;
}

/**
 * Preset metadata stored in the metadata index
 */
export interface PresetMetadata {
  id: string;
  name: string;
  type: PresetType;
  createdAt: string;
  updatedAt: string;
  version: number;
}

/**
 * Full preset structure with data
 */
export interface Preset extends PresetMetadata {
  data: PresetData;
}

/**
 * Input for creating a new preset
 */
export interface CreatePresetInput {
  name: string;
  type: PresetType;
  data: PresetData;
}

/**
 * Input for updating an existing preset
 */
export interface UpdatePresetInput {
  id: string;
  name?: string;
  data?: PresetData;
}

/**
 * Hook state
 */
interface PresetsState {
  presets: Preset[];
  isLoading: boolean;
  error: string | null;
  version: number;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY_METADATA = 'presets:metadata';
const PRESET_KEY_PREFIX = 'presets:';
const CURRENT_VERSION = 1;
const MAX_PRESETS = 50; // Limit to prevent excessive storage usage

// ============================================================================
// Reducer
// ============================================================================

type PresetsAction =
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'INITIALIZE'; presets: Preset[] }
  | { type: 'ADD_PRESET'; preset: Preset }
  | { type: 'UPDATE_PRESET'; preset: Preset }
  | { type: 'DELETE_PRESET'; id: string }
  | { type: 'CLEAR_ALL' };

function presetsReducer(state: PresetsState, action: PresetsAction): PresetsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'INITIALIZE':
      return {
        ...state,
        presets: action.presets,
        isLoading: false,
        error: null,
        version: state.version + 1,
      };
    case 'ADD_PRESET':
      return {
        ...state,
        presets: [...state.presets, action.preset],
        version: state.version + 1,
      };
    case 'UPDATE_PRESET':
      return {
        ...state,
        presets: state.presets.map((p) =>
          p.id === action.preset.id ? action.preset : p
        ),
        version: state.version + 1,
      };
    case 'DELETE_PRESET':
      return {
        ...state,
        presets: state.presets.filter((p) => p.id !== action.id),
        version: state.version + 1,
      };
    case 'CLEAR_ALL':
      return {
        ...state,
        presets: [],
        version: state.version + 1,
      };
    default:
      return state;
  }
}

const initialState: PresetsState = {
  presets: [],
  isLoading: true,
  error: null,
  version: 0,
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique ID for a preset
 */
function generatePresetId(): string {
  return `preset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get the storage key for a preset by ID
 */
function getPresetStorageKey(id: string): string {
  return `${PRESET_KEY_PREFIX}${id}`;
}

/**
 * Validate preset name
 */
function validatePresetName(name: string, existingNames: string[]): string | null {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return 'Preset name cannot be empty';
  }

  if (trimmedName.length > 50) {
    return 'Preset name cannot exceed 50 characters';
  }

  if (existingNames.includes(trimmedName)) {
    return 'A preset with this name already exists';
  }

  return null;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Custom hook for managing presets with AsyncStorage persistence
 */
export function usePresets() {
  const [state, dispatch] = useReducer(presetsReducer, initialState);

  // --------------------------------------------------------------------------
  // Load presets from storage on mount
  // --------------------------------------------------------------------------
  useEffect(() => {
    const loadPresets = async () => {
      dispatch({ type: 'SET_LOADING', isLoading: true });

      try {
        // Load metadata index
        const metadataJson = await AsyncStorage.getItem(STORAGE_KEY_METADATA);

        if (!metadataJson) {
          // No presets saved yet
          dispatch({ type: 'INITIALIZE', presets: [] });
          return;
        }

        const metadata: PresetMetadata[] = JSON.parse(metadataJson);

        // Load all preset data in parallel
        const presetPromises = metadata.map(async (meta) => {
          const dataJson = await AsyncStorage.getItem(getPresetStorageKey(meta.id));
          if (dataJson) {
            const data: PresetData = JSON.parse(dataJson);
            return { ...meta, data } as Preset;
          }
          return null;
        });

        const loadedPresets = (await Promise.all(presetPromises)).filter(
          (p): p is Preset => p !== null
        );

        dispatch({ type: 'INITIALIZE', presets: loadedPresets });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', error: 'Failed to load presets' });
        dispatch({ type: 'INITIALIZE', presets: [] });
      }
    };

    loadPresets();
  }, []);

  // --------------------------------------------------------------------------
  // Save metadata to storage
  // --------------------------------------------------------------------------
  const saveMetadata = useCallback(async (presets: Preset[]): Promise<void> => {
    const metadata: PresetMetadata[] = presets.map(({ data, ...meta }) => meta);
    await AsyncStorage.setItem(STORAGE_KEY_METADATA, JSON.stringify(metadata));
  }, []);

  // --------------------------------------------------------------------------
  // CRUD Operations
  // --------------------------------------------------------------------------

  /**
   * Create a new preset
   */
  const createPreset = useCallback(
    async (input: CreatePresetInput): Promise<Preset | null> => {
      try {
        // Validate name
        const existingNames = state.presets.map((p) => p.name);
        const nameError = validatePresetName(input.name, existingNames);
        if (nameError) {
          dispatch({ type: 'SET_ERROR', error: nameError });
          return null;
        }

        // Check preset limit
        if (state.presets.length >= MAX_PRESETS) {
          dispatch({
            type: 'SET_ERROR',
            error: `Maximum of ${MAX_PRESETS} presets reached. Delete some presets to add new ones.`,
          });
          return null;
        }

        const now = new Date().toISOString();
        const preset: Preset = {
          id: generatePresetId(),
          name: input.name.trim(),
          type: input.type,
          data: input.data,
          createdAt: now,
          updatedAt: now,
          version: CURRENT_VERSION,
        };

        // Save preset data
        await AsyncStorage.setItem(
          getPresetStorageKey(preset.id),
          JSON.stringify(preset.data)
        );

        // Update state first for immediate UI response
        dispatch({ type: 'ADD_PRESET', preset });

        // Save metadata
        await saveMetadata([...state.presets, preset]);

        dispatch({ type: 'SET_ERROR', error: null });
        return preset;
      } catch (err) {
        dispatch({ type: 'SET_ERROR', error: 'Failed to create preset' });
        return null;
      }
    },
    [state.presets, saveMetadata]
  );

  /**
   * Get all presets
   */
  const getPresets = useCallback((): Preset[] => {
    return state.presets;
  }, [state.presets]);

  /**
   * Get presets filtered by type
   */
  const getPresetsByType = useCallback(
    (type: PresetType): Preset[] => {
      return state.presets.filter((p) => p.type === type);
    },
    [state.presets]
  );

  /**
   * Get a single preset by ID
   */
  const getPresetById = useCallback(
    (id: string): Preset | undefined => {
      return state.presets.find((p) => p.id === id);
    },
    [state.presets]
  );

  /**
   * Update an existing preset
   */
  const updatePreset = useCallback(
    async (input: UpdatePresetInput): Promise<Preset | null> => {
      try {
        const existingPreset = state.presets.find((p) => p.id === input.id);
        if (!existingPreset) {
          dispatch({ type: 'SET_ERROR', error: 'Preset not found' });
          return null;
        }

        // Validate new name if provided
        if (input.name !== undefined) {
          const otherNames = state.presets
            .filter((p) => p.id !== input.id)
            .map((p) => p.name);
          const nameError = validatePresetName(input.name, otherNames);
          if (nameError) {
            dispatch({ type: 'SET_ERROR', error: nameError });
            return null;
          }
        }

        const updatedPreset: Preset = {
          ...existingPreset,
          name: input.name?.trim() ?? existingPreset.name,
          data: input.data ?? existingPreset.data,
          updatedAt: new Date().toISOString(),
          version: CURRENT_VERSION,
        };

        // Save updated preset data
        await AsyncStorage.setItem(
          getPresetStorageKey(updatedPreset.id),
          JSON.stringify(updatedPreset.data)
        );

        // Update state
        dispatch({ type: 'UPDATE_PRESET', preset: updatedPreset });

        // Update metadata
        const updatedPresets = state.presets.map((p) =>
          p.id === updatedPreset.id ? updatedPreset : p
        );
        await saveMetadata(updatedPresets);

        dispatch({ type: 'SET_ERROR', error: null });
        return updatedPreset;
      } catch (err) {
        dispatch({ type: 'SET_ERROR', error: 'Failed to update preset' });
        return null;
      }
    },
    [state.presets, saveMetadata]
  );

  /**
   * Delete a preset
   */
  const deletePreset = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const existingPreset = state.presets.find((p) => p.id === id);
        if (!existingPreset) {
          dispatch({ type: 'SET_ERROR', error: 'Preset not found' });
          return false;
        }

        // Remove preset data from storage
        await AsyncStorage.removeItem(getPresetStorageKey(id));

        // Update state
        dispatch({ type: 'DELETE_PRESET', id });

        // Update metadata
        const remainingPresets = state.presets.filter((p) => p.id !== id);
        await saveMetadata(remainingPresets);

        dispatch({ type: 'SET_ERROR', error: null });
        return true;
      } catch (err) {
        dispatch({ type: 'SET_ERROR', error: 'Failed to delete preset' });
        return false;
      }
    },
    [state.presets, saveMetadata]
  );

  /**
   * Delete all presets
   */
  const clearAllPresets = useCallback(async (): Promise<boolean> => {
    try {
      // Remove all preset data from storage
      const deletePromises = state.presets.map((p) =>
        AsyncStorage.removeItem(getPresetStorageKey(p.id))
      );
      await Promise.all(deletePromises);

      // Remove metadata
      await AsyncStorage.removeItem(STORAGE_KEY_METADATA);

      // Update state
      dispatch({ type: 'CLEAR_ALL' });
      dispatch({ type: 'SET_ERROR', error: null });

      return true;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: 'Failed to clear presets' });
      return false;
    }
  }, [state.presets]);

  /**
   * Check if a preset name already exists
   */
  const isNameTaken = useCallback(
    (name: string, excludeId?: string): boolean => {
      const trimmedName = name.trim();
      return state.presets.some(
        (p) => p.name === trimmedName && p.id !== excludeId
      );
    },
    [state.presets]
  );

  /**
   * Duplicate an existing preset with a new name
   */
  const duplicatePreset = useCallback(
    async (id: string, newName: string): Promise<Preset | null> => {
      const existingPreset = state.presets.find((p) => p.id === id);
      if (!existingPreset) {
        dispatch({ type: 'SET_ERROR', error: 'Preset not found' });
        return null;
      }

      return createPreset({
        name: newName,
        type: existingPreset.type,
        data: { ...existingPreset.data },
      });
    },
    [state.presets, createPreset]
  );

  // --------------------------------------------------------------------------
  // Return hook interface
  // --------------------------------------------------------------------------
  return {
    // State
    presets: state.presets,
    isLoading: state.isLoading,
    error: state.error,

    // CRUD operations
    createPreset,
    getPresets,
    getPresetsByType,
    getPresetById,
    updatePreset,
    deletePreset,
    clearAllPresets,

    // Utility functions
    isNameTaken,
    duplicatePreset,

    // Constants
    maxPresets: MAX_PRESETS,
    currentVersion: CURRENT_VERSION,
  };
}

// Export types for external use
export type { PresetsState };
