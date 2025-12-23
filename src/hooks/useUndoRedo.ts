/**
 * useUndoRedo.ts
 *
 * A custom hook for managing undo/redo functionality with action history.
 * Implements the command pattern to allow reversible operations throughout
 * the application with optional AsyncStorage persistence.
 *
 * Storage Keys (namespaced as 'undo:'):
 * - 'undo:{context}:stack' - Action history stack for a specific context
 * - 'undo:{context}:index' - Current position in the history stack
 *
 * Features:
 * - Per-screen/context action history
 * - Configurable stack limit (default: 10 actions)
 * - Optional AsyncStorage persistence
 * - Clear separation of undo and redo stacks via index tracking
 */

import { useState, useCallback, useEffect, useReducer, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Types
// ============================================================================

/**
 * Supported action types for undo/redo tracking
 */
export type UndoableActionType =
  | 'parameter_change'
  | 'preset_apply'
  | 'setting_change'
  | 'value_adjustment'
  | 'selection_change'
  | 'custom';

/**
 * Structure of an undoable action
 */
export interface UndoableAction<T = unknown> {
  id: string;
  type: UndoableActionType;
  label: string;
  timestamp: string;
  previousValue: T;
  newValue: T;
  metadata?: Record<string, unknown>;
}

/**
 * Configuration options for the undo/redo hook
 */
export interface UndoRedoConfig {
  /** Unique identifier for this context (e.g., 'shot', 'wind', 'settings') */
  context: string;
  /** Maximum number of actions to keep in history (default: 10) */
  maxHistorySize?: number;
  /** Whether to persist history to AsyncStorage (default: false) */
  persistHistory?: boolean;
  /** Debounce time in ms for rapid changes (default: 0, no debounce) */
  debounceMs?: number;
}

/**
 * Internal state for the undo/redo hook
 */
interface UndoRedoState<T = unknown> {
  /** All recorded actions */
  history: UndoableAction<T>[];
  /** Current position in history (points to the last applied action) */
  currentIndex: number;
  /** Loading state for async operations */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** State version for reactivity */
  version: number;
}

/**
 * Input for recording a new action
 */
export interface RecordActionInput<T = unknown> {
  type: UndoableActionType;
  label: string;
  previousValue: T;
  newValue: T;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY_PREFIX = 'undo:';
const DEFAULT_MAX_HISTORY_SIZE = 10;

// ============================================================================
// Reducer
// ============================================================================

type UndoRedoAction<T = unknown> =
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'INITIALIZE'; history: UndoableAction<T>[]; currentIndex: number }
  | { type: 'RECORD_ACTION'; action: UndoableAction<T>; maxSize: number }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'CLEAR_FUTURE' };

function undoRedoReducer<T>(
  state: UndoRedoState<T>,
  action: UndoRedoAction<T>
): UndoRedoState<T> {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };

    case 'SET_ERROR':
      return { ...state, error: action.error };

    case 'INITIALIZE':
      return {
        ...state,
        history: action.history,
        currentIndex: action.currentIndex,
        isLoading: false,
        error: null,
        version: state.version + 1,
      };

    case 'RECORD_ACTION': {
      // Remove any "future" actions when recording a new action
      const truncatedHistory = state.history.slice(0, state.currentIndex + 1);

      // Add new action
      const newHistory = [...truncatedHistory, action.action];

      // Trim history if it exceeds max size
      const trimmedHistory =
        newHistory.length > action.maxSize
          ? newHistory.slice(newHistory.length - action.maxSize)
          : newHistory;

      return {
        ...state,
        history: trimmedHistory,
        currentIndex: trimmedHistory.length - 1,
        version: state.version + 1,
      };
    }

    case 'UNDO':
      if (state.currentIndex < 0) {
        return state;
      }
      return {
        ...state,
        currentIndex: state.currentIndex - 1,
        version: state.version + 1,
      };

    case 'REDO':
      if (state.currentIndex >= state.history.length - 1) {
        return state;
      }
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        version: state.version + 1,
      };

    case 'CLEAR_HISTORY':
      return {
        ...state,
        history: [],
        currentIndex: -1,
        version: state.version + 1,
      };

    case 'CLEAR_FUTURE': {
      // Remove all actions after the current index
      const historyUpToCurrent = state.history.slice(0, state.currentIndex + 1);
      return {
        ...state,
        history: historyUpToCurrent,
        version: state.version + 1,
      };
    }

    default:
      return state;
  }
}

const createInitialState = <T>(): UndoRedoState<T> => ({
  history: [],
  currentIndex: -1,
  isLoading: false,
  error: null,
  version: 0,
});

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique ID for an action
 */
function generateActionId(): string {
  return `action_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get storage keys for a context
 */
function getStorageKeys(context: string) {
  return {
    stack: `${STORAGE_KEY_PREFIX}${context}:stack`,
    index: `${STORAGE_KEY_PREFIX}${context}:index`,
  };
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Custom hook for managing undo/redo functionality with action history
 *
 * @param config - Configuration options for the hook
 * @returns Undo/redo state and control functions
 *
 * @example
 * ```tsx
 * const {
 *   canUndo,
 *   canRedo,
 *   recordAction,
 *   undo,
 *   redo,
 *   undoValue,
 * } = useUndoRedo({ context: 'shot-screen' });
 *
 * // Record a change
 * const handleSliderChange = (newValue: number) => {
 *   recordAction({
 *     type: 'parameter_change',
 *     label: 'Wind speed adjustment',
 *     previousValue: currentValue,
 *     newValue: newValue,
 *   });
 *   setCurrentValue(newValue);
 * };
 *
 * // Undo the last change
 * const handleUndo = () => {
 *   const previousValue = undo();
 *   if (previousValue !== undefined) {
 *     setCurrentValue(previousValue);
 *   }
 * };
 * ```
 */
export function useUndoRedo<T = unknown>(config: UndoRedoConfig) {
  const {
    context,
    maxHistorySize = DEFAULT_MAX_HISTORY_SIZE,
    persistHistory = false,
    debounceMs = 0,
  } = config;

  const [state, dispatch] = useReducer(
    undoRedoReducer as (
      state: UndoRedoState<T>,
      action: UndoRedoAction<T>
    ) => UndoRedoState<T>,
    createInitialState<T>()
  );

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActionRef = useRef<UndoableAction<T> | null>(null);

  // --------------------------------------------------------------------------
  // Storage Keys
  // --------------------------------------------------------------------------
  const storageKeys = getStorageKeys(context);

  // --------------------------------------------------------------------------
  // Load history from storage on mount (if persistence enabled)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!persistHistory) {
      return;
    }

    const loadHistory = async () => {
      dispatch({ type: 'SET_LOADING', isLoading: true });

      try {
        const [stackJson, indexJson] = await Promise.all([
          AsyncStorage.getItem(storageKeys.stack),
          AsyncStorage.getItem(storageKeys.index),
        ]);

        const history: UndoableAction<T>[] = stackJson
          ? JSON.parse(stackJson)
          : [];
        const currentIndex: number = indexJson ? JSON.parse(indexJson) : -1;

        dispatch({
          type: 'INITIALIZE',
          history,
          currentIndex: Math.min(currentIndex, history.length - 1),
        });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', error: 'Failed to load undo history' });
        dispatch({ type: 'INITIALIZE', history: [], currentIndex: -1 });
      }
    };

    loadHistory();
  }, [persistHistory, storageKeys.stack, storageKeys.index]);

  // --------------------------------------------------------------------------
  // Persist history to storage when it changes (if persistence enabled)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!persistHistory || state.isLoading) {
      return;
    }

    const saveHistory = async () => {
      try {
        await Promise.all([
          AsyncStorage.setItem(storageKeys.stack, JSON.stringify(state.history)),
          AsyncStorage.setItem(
            storageKeys.index,
            JSON.stringify(state.currentIndex)
          ),
        ]);
      } catch (err) {
        // Silently fail persistence - don't interrupt user flow
      }
    };

    saveHistory();
  }, [
    persistHistory,
    state.history,
    state.currentIndex,
    state.isLoading,
    storageKeys.stack,
    storageKeys.index,
  ]);

  // --------------------------------------------------------------------------
  // Computed Values
  // --------------------------------------------------------------------------

  /**
   * Whether undo is available
   */
  const canUndo = state.currentIndex >= 0;

  /**
   * Whether redo is available
   */
  const canRedo = state.currentIndex < state.history.length - 1;

  /**
   * Number of actions that can be undone
   */
  const undoCount = state.currentIndex + 1;

  /**
   * Number of actions that can be redone
   */
  const redoCount = state.history.length - state.currentIndex - 1;

  /**
   * The current action (last applied action)
   */
  const currentAction: UndoableAction<T> | null =
    state.currentIndex >= 0 ? state.history[state.currentIndex] : null;

  /**
   * The action that would be undone next
   */
  const nextUndoAction: UndoableAction<T> | null =
    state.currentIndex >= 0 ? state.history[state.currentIndex] : null;

  /**
   * The action that would be redone next
   */
  const nextRedoAction: UndoableAction<T> | null =
    state.currentIndex < state.history.length - 1
      ? state.history[state.currentIndex + 1]
      : null;

  // --------------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------------

  /**
   * Record a new undoable action
   */
  const recordAction = useCallback(
    (input: RecordActionInput<T>) => {
      const action: UndoableAction<T> = {
        id: generateActionId(),
        type: input.type,
        label: input.label,
        timestamp: new Date().toISOString(),
        previousValue: input.previousValue,
        newValue: input.newValue,
        metadata: input.metadata,
      };

      // Handle debouncing for rapid changes
      if (debounceMs > 0) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        // Update the new value of the pending action
        if (
          lastActionRef.current &&
          lastActionRef.current.type === input.type &&
          lastActionRef.current.label === input.label
        ) {
          // Merge with pending action - keep original previousValue
          action.previousValue = lastActionRef.current.previousValue;
        }

        lastActionRef.current = action;

        debounceTimerRef.current = setTimeout(() => {
          if (lastActionRef.current) {
            dispatch({
              type: 'RECORD_ACTION',
              action: lastActionRef.current,
              maxSize: maxHistorySize,
            });
            lastActionRef.current = null;
          }
        }, debounceMs);
      } else {
        dispatch({
          type: 'RECORD_ACTION',
          action,
          maxSize: maxHistorySize,
        });
      }

      dispatch({ type: 'SET_ERROR', error: null });
    },
    [debounceMs, maxHistorySize]
  );

  /**
   * Undo the last action
   * @returns The previous value from the undone action, or undefined if no action to undo
   */
  const undo = useCallback((): T | undefined => {
    if (!canUndo) {
      return undefined;
    }

    const actionToUndo = state.history[state.currentIndex];
    dispatch({ type: 'UNDO' });
    dispatch({ type: 'SET_ERROR', error: null });

    return actionToUndo.previousValue;
  }, [canUndo, state.history, state.currentIndex]);

  /**
   * Redo the last undone action
   * @returns The new value from the redone action, or undefined if no action to redo
   */
  const redo = useCallback((): T | undefined => {
    if (!canRedo) {
      return undefined;
    }

    const actionToRedo = state.history[state.currentIndex + 1];
    dispatch({ type: 'REDO' });
    dispatch({ type: 'SET_ERROR', error: null });

    return actionToRedo.newValue;
  }, [canRedo, state.history, state.currentIndex]);

  /**
   * Clear all undo/redo history
   */
  const clearHistory = useCallback(async () => {
    dispatch({ type: 'CLEAR_HISTORY' });

    if (persistHistory) {
      try {
        await Promise.all([
          AsyncStorage.removeItem(storageKeys.stack),
          AsyncStorage.removeItem(storageKeys.index),
        ]);
      } catch (err) {
        // Silently fail - state is already cleared
      }
    }
  }, [persistHistory, storageKeys.stack, storageKeys.index]);

  /**
   * Clear future actions (everything after current index)
   * Useful when making a new change that should invalidate the redo stack
   */
  const clearFuture = useCallback(() => {
    dispatch({ type: 'CLEAR_FUTURE' });
  }, []);

  /**
   * Get the value to restore for undo without performing the undo
   */
  const peekUndo = useCallback((): T | undefined => {
    if (!canUndo) {
      return undefined;
    }
    return state.history[state.currentIndex].previousValue;
  }, [canUndo, state.history, state.currentIndex]);

  /**
   * Get the value to restore for redo without performing the redo
   */
  const peekRedo = useCallback((): T | undefined => {
    if (!canRedo) {
      return undefined;
    }
    return state.history[state.currentIndex + 1].newValue;
  }, [canRedo, state.history, state.currentIndex]);

  /**
   * Get a specific action from history by index
   */
  const getActionAt = useCallback(
    (index: number): UndoableAction<T> | undefined => {
      if (index < 0 || index >= state.history.length) {
        return undefined;
      }
      return state.history[index];
    },
    [state.history]
  );

  /**
   * Jump to a specific point in history
   * @param targetIndex - The index to jump to (-1 for initial state)
   * @returns The value at the target index, or undefined if invalid
   */
  const jumpTo = useCallback(
    (targetIndex: number): T | undefined => {
      if (targetIndex < -1 || targetIndex >= state.history.length) {
        return undefined;
      }

      // Simulate multiple undos or redos
      while (state.currentIndex !== targetIndex) {
        if (state.currentIndex > targetIndex) {
          dispatch({ type: 'UNDO' });
        } else {
          dispatch({ type: 'REDO' });
        }
      }

      if (targetIndex === -1) {
        // Return the initial value (from first recorded action's previousValue)
        return state.history.length > 0
          ? state.history[0].previousValue
          : undefined;
      }

      return state.history[targetIndex].newValue;
    },
    [state.history, state.currentIndex]
  );

  // --------------------------------------------------------------------------
  // Cleanup
  // --------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // --------------------------------------------------------------------------
  // Return hook interface
  // --------------------------------------------------------------------------
  return {
    // State
    history: state.history,
    currentIndex: state.currentIndex,
    isLoading: state.isLoading,
    error: state.error,

    // Computed values
    canUndo,
    canRedo,
    undoCount,
    redoCount,
    currentAction,
    nextUndoAction,
    nextRedoAction,

    // Actions
    recordAction,
    undo,
    redo,
    clearHistory,
    clearFuture,

    // Utility functions
    peekUndo,
    peekRedo,
    getActionAt,
    jumpTo,

    // Configuration
    context,
    maxHistorySize,
  };
}

// ============================================================================
// Factory function for typed instances
// ============================================================================

/**
 * Create a typed undo/redo hook for a specific value type
 *
 * @example
 * ```tsx
 * // Create a typed hook for number values
 * const useNumberUndoRedo = createUndoRedoHook<number>();
 *
 * // Use in component
 * const { recordAction, undo, redo } = useNumberUndoRedo({
 *   context: 'slider-value',
 * });
 * ```
 */
export function createUndoRedoHook<T>() {
  return (config: UndoRedoConfig) => useUndoRedo<T>(config);
}

// ============================================================================
// Export types for external use
// ============================================================================

export type { UndoRedoState, UndoRedoConfig };
