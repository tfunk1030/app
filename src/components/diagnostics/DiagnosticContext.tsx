/**
 * DiagnosticContext.tsx
 *
 * A context provider for diagnostic functionality. This file is separated from
 * DiagnosticProvider.tsx to avoid circular dependencies between components.
 */

import React, { createContext, useContext, useState } from 'react';

/** Sensor status data structure */
export interface SensorStatus {
  available: boolean;
  permission?: string;
  lastUpdate?: number;
  error?: string;
  [key: string]: unknown;
}

// Context for diagnostic state
interface DiagnosticContextType {
  isDiagnosticModeEnabled: boolean;
  isOverlayVisible: boolean;
  toggleOverlay: () => void;
  saveSensorStatus: (sensor: string, status: SensorStatus) => Promise<void>;
}

const DiagnosticContext = createContext<DiagnosticContextType | null>(null);

/**
 * Custom hook to use the diagnostic context
 */
export const useDiagnostics = () => {
  const context = useContext(DiagnosticContext);
  if (!context) {
    throw new Error('useDiagnostics must be used within a DiagnosticProvider');
  }
  return context;
};

export { DiagnosticContext };
export type { DiagnosticContextType };
