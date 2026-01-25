/**
 * windCalculatorReducer.ts
 *
 * A reducer for managing wind calculator state.
 * Provides a predictable way to manage complex state transitions
 * for the wind calculation feature.
 */

import { WindCalculatorResult } from '@/src/features/wind/hooks/useWindCalculator';

// Action types
export enum WindCalculatorActionType {
  SET_WIND_SPEED = 'SET_WIND_SPEED',
  SET_TARGET_YARDAGE = 'SET_TARGET_YARDAGE',
  SET_WIND_ANGLE = 'SET_WIND_ANGLE',
  SET_CALCULATION_RESULT = 'SET_CALCULATION_RESULT',
  SET_ERROR = 'SET_ERROR',
  CLEAR_ERROR = 'CLEAR_ERROR',
  SET_LOADING = 'SET_LOADING',
  RESET = 'RESET',
}

// Action interfaces
interface SetWindSpeedAction {
  type: WindCalculatorActionType.SET_WIND_SPEED;
  payload: number;
}

interface SetTargetYardageAction {
  type: WindCalculatorActionType.SET_TARGET_YARDAGE;
  payload: number;
}

interface SetWindAngleAction {
  type: WindCalculatorActionType.SET_WIND_ANGLE;
  payload: number;
}

interface SetCalculationResultAction {
  type: WindCalculatorActionType.SET_CALCULATION_RESULT;
  payload: WindCalculatorResult;
}

interface SetErrorAction {
  type: WindCalculatorActionType.SET_ERROR;
  payload: string;
}

interface ClearErrorAction {
  type: WindCalculatorActionType.CLEAR_ERROR;
}

interface SetLoadingAction {
  type: WindCalculatorActionType.SET_LOADING;
  payload: boolean;
}

interface ResetAction {
  type: WindCalculatorActionType.RESET;
}

// Union type for all actions
export type WindCalculatorAction =
  | SetWindSpeedAction
  | SetTargetYardageAction
  | SetWindAngleAction
  | SetCalculationResultAction
  | SetErrorAction
  | ClearErrorAction
  | SetLoadingAction
  | ResetAction;

// State interface
export interface WindCalculatorState {
  windSpeed: number;
  targetYardage: number;
  windAngle: number;
  result: WindCalculatorResult | null;
  error: string | null;
  isLoading: boolean;
  lastUpdated: number;
}

// Initial state
export const initialState: WindCalculatorState = {
  windSpeed: 10,
  targetYardage: 150,
  windAngle: 0,
  result: null,
  error: null,
  isLoading: false,
  lastUpdated: Date.now(),
};

/**
 * Action creators
 */

export const setWindSpeed = (speed: number): SetWindSpeedAction => ({
  type: WindCalculatorActionType.SET_WIND_SPEED,
  payload: speed,
});

export const setTargetYardage = (yardage: number): SetTargetYardageAction => ({
  type: WindCalculatorActionType.SET_TARGET_YARDAGE,
  payload: yardage,
});

export const setWindAngle = (angle: number): SetWindAngleAction => ({
  type: WindCalculatorActionType.SET_WIND_ANGLE,
  payload: angle,
});

export const setCalculationResult = (result: WindCalculatorResult): SetCalculationResultAction => ({
  type: WindCalculatorActionType.SET_CALCULATION_RESULT,
  payload: result,
});

export const setError = (error: string): SetErrorAction => ({
  type: WindCalculatorActionType.SET_ERROR,
  payload: error,
});

export const clearError = (): ClearErrorAction => ({
  type: WindCalculatorActionType.CLEAR_ERROR,
});

export const setLoading = (isLoading: boolean): SetLoadingAction => ({
  type: WindCalculatorActionType.SET_LOADING,
  payload: isLoading,
});

export const reset = (): ResetAction => ({
  type: WindCalculatorActionType.RESET,
});

/**
 * Wind calculator reducer
 */
export function windCalculatorReducer(
  state: WindCalculatorState = initialState,
  action: WindCalculatorAction
): WindCalculatorState {
  switch (action.type) {
    case WindCalculatorActionType.SET_WIND_SPEED:
      return {
        ...state,
        windSpeed: action.payload,
        lastUpdated: Date.now(),
      };

    case WindCalculatorActionType.SET_TARGET_YARDAGE:
      return {
        ...state,
        targetYardage: action.payload,
        lastUpdated: Date.now(),
      };

    case WindCalculatorActionType.SET_WIND_ANGLE:
      return {
        ...state,
        windAngle: action.payload,
        lastUpdated: Date.now(),
      };

    case WindCalculatorActionType.SET_CALCULATION_RESULT:
      return {
        ...state,
        result: action.payload,
        error: null,
        isLoading: false,
        lastUpdated: Date.now(),
      };

    case WindCalculatorActionType.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        lastUpdated: Date.now(),
      };

    case WindCalculatorActionType.CLEAR_ERROR:
      return {
        ...state,
        error: null,
        lastUpdated: Date.now(),
      };

    case WindCalculatorActionType.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
        lastUpdated: Date.now(),
      };

    case WindCalculatorActionType.RESET:
      return {
        ...initialState,
        lastUpdated: Date.now(),
      };

    default:
      return state;
  }
}

/**
 * Custom hook for using the wind calculator reducer with useReducer
 */
export function useWindCalculatorReducer() {
  return { windCalculatorReducer, initialState };
}
