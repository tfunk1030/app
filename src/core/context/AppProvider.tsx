/**
 * AppProvider.tsx
 *
 * A consolidated provider component that organizes all context providers
 * in the correct hierarchy to avoid dependency issues. This component
 * implements the Provider Consolidation Pattern by:
 * 1. Organizing providers in the correct dependency order
 * 2. Providing a single import point for all application providers
 * 3. Eliminating redundant providers
 * 4. Simplifying the provider tree
 */

import { ClubSettingsProvider } from '@/src/features/settings/context/clubs';
import { PremiumProvider } from '@/src/features/settings/context/premium';
import { SensorDataProvider } from '@/src/features/wind/context/sensor-data';
import React from 'react';
import { SettingsProvider } from './settings';
import { ShotCalcProvider } from './shotcalc';
// Removed legacy EnvironmentalProvider; using EnhancedEnvironmentalProvider at tab layout level
import { WindDataAdapter } from '@/src/components/diagnostics/DiagnosticOverlayAdapter';
import { DiagnosticProvider } from '@/src/components/diagnostics/DiagnosticProvider';
import { LogManager } from '@/src/utils/LogManager';

// Create a dedicated logger
const logger = LogManager.getLogger('AppProvider');

interface AppProviderProps {
  children: React.ReactNode;
}

/**
 * AppProvider component that consolidates all context providers
 * in the correct dependency order.
 *
 * Provider hierarchy:
 * 1. DiagnosticProvider - Provides diagnostic functionality
 * 2. SettingsProvider - Provides user settings
 * 3. PremiumProvider - Provides premium status
 * 4. ClubSettingsProvider - Provides club data and recommendations
 * 5. EnvironmentalProvider - Provides environmental conditions
 * 6. SensorDataProvider - Provides compass and sensor data
 * 7. ShotCalcProvider - Provides shot calculation functionality
 *
 * Note: WindDataProvider has been removed as its functionality is now
 * handled by the enhanced wind-calculator.ts service and useWindCalculator hook.
 */
export function AppProvider({ children }: AppProviderProps) {
  logger.info('Initializing AppProvider');

  return (
    <WindDataAdapter>
      <DiagnosticProvider>
        <SettingsProvider>
          <PremiumProvider>
            <ClubSettingsProvider>
              <SensorDataProvider>
                <ShotCalcProvider>{children}</ShotCalcProvider>
              </SensorDataProvider>
            </ClubSettingsProvider>
          </PremiumProvider>
        </SettingsProvider>
      </DiagnosticProvider>
    </WindDataAdapter>
  );
}
