/**
 * WindCalculationResults.tsx
 *
 * A component that displays wind calculation results with progressive disclosure.
 * This is a refactored version that uses smaller, focused components for better
 * maintainability, performance, and accessibility.
 */

import { useSettings } from '@/src/core/context/settings';
import type { WindCalculatorResult } from '@/src/features/wind/hooks/useWindCalculator';
import React, { memo, useMemo } from 'react';

// Import sub-components
import { ClubRecommendation } from './results/ClubRecommendation';
import { DualResultCard } from './results/DualResultCard';
import { EffectsGrid } from './results/EffectsGrid';
import { IterationDetails } from './results/IterationDetails';
import { LateralAdjustment } from './results/LateralAdjustment';
import { PrimaryRecommendation } from './results/PrimaryRecommendation';
import { ResultCard } from './results/ResultCard';
import { AimOffsetViz } from './results/AimOffsetViz';

interface WindCalculationResultsProps {
  result: WindCalculatorResult;
}

/**
 * WindCalculationResults component displays the results of wind calculations
 * in a structured, accessible format with progressive disclosure of details.
 */
export const WindCalculationResults = memo(({ result }: WindCalculationResultsProps) => {
  const { formatSpeed } = useSettings();
  // Memoize props for child components to prevent unnecessary re-renders
  const primaryRecommendationProps = useMemo(
    () => ({
      effectiveDistance: result.effectivePlayingDistance,
    }),
    [result.effectivePlayingDistance]
  );

  // Props for dual result card (sustained vs gust)
  const dualResultProps = useMemo(
    () => ({
      sustainedDistance: result.effectivePlayingDistance,
      gustDistance: result.gustResult?.effectivePlayingDistance,
      unit: 'yds' as const,
    }),
    [result.effectivePlayingDistance, result.gustResult?.effectivePlayingDistance]
  );

  const hasGustResult = !!result.gustResult;

  const clubRecommendationProps = useMemo(
    () => ({
      recommendedClub: result.recommendedClub,
      initialClub: result.initialClub,
      clubChange: result.clubChange,
      iterations: result.iterations,
      convergedReason: result.convergedReason,
    }),
    [
      result.recommendedClub,
      result.initialClub,
      result.clubChange,
      result.iterations,
      result.convergedReason,
    ]
  );

  const lateralAdjustmentProps = useMemo(
    () => ({
      lateralEffect: result.lateralEffect,
    }),
    [result.lateralEffect]
  );

  const effectsGridProps = useMemo(
    () => ({
      environmentalEffect: result.environmentalEffect,
      windEffect: result.windEffect,
      lateralEffect: result.lateralEffect,
      formatSpeed,
    }),
    [result.environmentalEffect, result.windEffect, result.lateralEffect, formatSpeed]
  );

  const iterationDetailsProps = useMemo(
    () => ({
      iterationSummary: result.iterationSummary,
    }),
    [result.iterationSummary]
  );
  return (
    <ResultCard>
      {/* Primary distance recommendation - show dual card when gusts present */}
      {hasGustResult ? (
        <DualResultCard {...dualResultProps} />
      ) : (
        <PrimaryRecommendation {...primaryRecommendationProps} />
      )}

      {/* Lateral adjustment if needed - promoted for visibility */}
      <LateralAdjustment {...lateralAdjustmentProps} />
      <AimOffsetViz lateralEffect={result.lateralEffect} />

      {/* Club recommendation with convergence details */}
      <ClubRecommendation {...clubRecommendationProps} />

      {/* Grid of environmental and wind effects */}
      <EffectsGrid {...effectsGridProps} />

      {/* Collapsible iteration details */}
      <IterationDetails {...iterationDetailsProps} />
    </ResultCard>
  );
});

// Add display name for debugging
WindCalculationResults.displayName = 'WindCalculationResults';
