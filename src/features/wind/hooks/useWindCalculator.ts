// src/features/wind/hooks/useWindCalculator.ts

import { useShotCalc } from '@/src/core/context/shotcalc';
import { useClubSettings } from '@/src/features/settings/context/clubs';
import { useEnhancedEnvironmental } from '@/src/providers/EnhancedEnvironmentalProvider';
import {
    calculateWindEffectRecursive,
    RecursiveWindCalculationResult,
    WindCalculatorLogger
} from '@/src/services/calculations/wind-calculator';
import { LogManager } from '@/src/utils/LogManager';
import { useCallback, useEffect, useRef, useState } from 'react';

// Import the new error handling system
import {
    WindError
} from '@/src/features/wind/utils/wind-error-handler';

// Create a logger for this hook
const logger = LogManager.getLogger('useWindCalculator');

// Create a wind calculator logger that uses LogManager
const windCalcLogger: WindCalculatorLogger = {
  debug: (message, data) => logger.debug(message, data),
  info: (message, data) => logger.info(message, data),
  warn: (message, data) => logger.warn(message, data),
  error: (message, error) => logger.error(message, error)
};

/**
 * Extended result type with UI-specific properties
 */
export interface WindCalculatorResult extends RecursiveWindCalculationResult {
  recommendedClub: string;
  clubChange: boolean;
  clubChangeMessage: string;
  iterationSummary?: string;
}

/**
 * Custom hook for wind calculations with recursive club selection
 */
export function useWindCalculator() {
  const { conditions, isLoading: envLoading } = useEnhancedEnvironmental();
  const { getRecommendedClub } = useClubSettings();
  const { shotCalcData } = useShotCalc();

  // State variables
  const [isLoading, setIsLoading] = useState(!conditions && envLoading);
  const [windSpeed, setWindSpeed] = useState(10);
  const [targetYardage, setTargetYardage] = useState(150);
  const [result, setResult] = useState<WindCalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Store previous values for comparison
  const prevTargetYardageRef = useRef<number | null>(null);

  // Effect to sync with shotCalcData
  useEffect(() => {
    const targetYardage = shotCalcData?.targetYardage;

    // Only update if the value has changed and is valid
    if (targetYardage && targetYardage !== prevTargetYardageRef.current) {
      prevTargetYardageRef.current = targetYardage;
      setTargetYardage(targetYardage);
      logger.info('Updated target yardage from shotCalcData', {
        yardage: targetYardage,
      });
    }
  }, [shotCalcData]);

  // Effect to update loading state - with stable dependencies
  useEffect(() => {
    const shouldBeLoading = !conditions && envLoading;

    if (isLoading !== shouldBeLoading) {
      setIsLoading(shouldBeLoading);
    }

    // Safety timeout to prevent infinite loading
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (shouldBeLoading) {
      timer = setTimeout(() => {
        logger.warn('Safety timeout triggered - forcing loading state to false');
        setIsLoading(false);
      }, 3000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [conditions, envLoading]);

  /**
   * Generate a human-readable summary of the calculation iterations
   * Showing all iterations in the details
   */
  const generateIterationSummary = useCallback((result: RecursiveWindCalculationResult): string => {
    if (!result.iterationDetails || result.iterationDetails.length === 0) {
      return 'No iteration details available';
    }

    return result.iterationDetails.map(detail => {
      return `Iteration ${detail.iteration}: ${detail.club} - plays like ${Math.round(detail.playingDistance)} yards (${detail.environmentalEffect.toFixed(1)} env, ${detail.windEffect.toFixed(1)} wind)`;
    }).join('\n');
  }, []);

  // Store calculation parameters in refs to stabilize the callback
  const conditionsRef = useRef(conditions);
  const targetYardageRef = useRef(targetYardage);
  const windSpeedRef = useRef(windSpeed);
  const getRecommendedClubRef = useRef(getRecommendedClub);

  // Update refs when values change
  useEffect(() => {
    conditionsRef.current = conditions;
  }, [conditions]);

  useEffect(() => {
    targetYardageRef.current = targetYardage;
  }, [targetYardage]);

  useEffect(() => {
    windSpeedRef.current = windSpeed;
  }, [windSpeed]);

  useEffect(() => {
    getRecommendedClubRef.current = getRecommendedClub;
  }, [getRecommendedClub]);

  /**
   * Calculate wind effect with recursive club selection
   * Using refs for stable dependencies
   */
  const calculateWithClubRecursion = useCallback(
    (windAngle: number) => {
      // Use current values from refs
      const currentConditions = conditionsRef.current;
      const currentTargetYardage = targetYardageRef.current;
      const currentWindSpeed = windSpeedRef.current;
      const currentGetRecommendedClub = getRecommendedClubRef.current;

      if (!currentConditions) {
        logger.warn('Cannot calculate without conditions data');
        setError('Environmental conditions not available');
        return;
      }

      // Clear previous error
      setError(null);

      logger.info('Starting wind calculation', {
        targetYardage: currentTargetYardage,
        windSpeed: currentWindSpeed,
        windAngle,
        conditions: {
          temperature: currentConditions.temperature,
          altitude: currentConditions.altitude,
          windSpeed: currentConditions.windSpeed,
          windDirection: currentConditions.windDirection,
        },
      });

      try {
        // Get initial club recommendation based on target distance
        const initialClub = currentGetRecommendedClub(currentTargetYardage);
        if (!initialClub) {
          logger.warn('No recommended club found for target yardage', { targetYardage: currentTargetYardage });
          setError(`No recommended club found for ${currentTargetYardage} yards`);
          return;
        }

        // Run recursive calculation with enhanced options
        const calculationResult = calculateWindEffectRecursive(
          {
            targetYardage: currentTargetYardage,
            windSpeed: currentWindSpeed,
            windAngle,
            clubName: initialClub.name,
            conditions: currentConditions,
            logger: windCalcLogger
          },
          currentGetRecommendedClub,
          {
            maxIterations: 3,
            includeIterationDetails: true,
            convergenceThreshold: (distance) => {
              // Adaptive convergence threshold based on distance
              if (distance < 100) return 1; // 1 yard for short shots
              if (distance < 200) return 2; // 2 yards for mid-range shots
              return 3; // 3 yards for long shots
            }
          }
        );

        if (calculationResult) {
          // Prepare UI-friendly result
          const clubChanged = calculationResult.initialClub !== calculationResult.finalClub;
          const clubChangeMessage = clubChanged
            ? `Changed from ${calculationResult.initialClub} to ${calculationResult.finalClub} due to wind conditions`
            : 'No club change needed';

          // Generate iteration summary if details are available
          const iterationSummary = calculationResult.iterationDetails
            ? generateIterationSummary(calculationResult)
            : undefined;

          logger.info('Wind calculation complete', {
            initialClub: calculationResult.initialClub,
            finalClub: calculationResult.finalClub,
            effectiveDistance: calculationResult.effectivePlayingDistance,
            iterations: calculationResult.iterations,
            convergedReason: calculationResult.convergedReason,
            clubChanged,
          });

          // Set the result with UI enhancements
          setResult({
            ...calculationResult,
            recommendedClub: calculationResult.finalClub,
            clubChange: clubChanged,
            clubChangeMessage,
            iterationSummary
          });
        } else {
          logger.error('Wind calculation failed to produce a result');
          setError('Wind calculation failed to produce a result');
        }
      } catch (err) {
        // Handle wind errors using the new error handling system
        if (err instanceof WindError) {
          logger.error(`Wind calculation error: ${err.message}`, {
            windErrorType: err.windErrorType,
            details: err.details
          });

          // Provide user-friendly error messages based on error type
          setError(err.getUserMessage());
        } else {
          // Handle generic errors
          logger.error('Unexpected error in wind calculation', err);
          setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
    },
    [generateIterationSummary] // Only depends on generateIterationSummary now
  );

  return {
    isLoading,
    conditions,
    windSpeed,
    setWindSpeed,
    targetYardage,
    setTargetYardage,
    result,
    error,
    calculate: calculateWithClubRecursion,
    clearError: () => setError(null)
  };
}
