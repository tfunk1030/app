/**
 * Wind Direction Compass Component
 *
 * This file re-exports from the modular compass components.
 * The original monolithic component has been split into separate modules:
 * - DegreeMarks: Tick marks and degree labels
 * - CardinalDirections: N, NE, E, SE, S, SW, W, NW markers
 * - WindArrow: Animated wind direction indicator
 * - PhoneArrow: Phone/shot direction indicator
 * - LockButton: Lock/unlock compass button
 * - WindDirectionCompass: Main orchestrating component
 *
 * @see ./compass/ for the modular implementation
 */
export {
  default,
  WindDirectionCompass,
  DegreeMarks,
  CardinalDirections,
  WindArrow,
  PhoneArrow,
  LockButton,
  getWindRelationship,
  getCardinalDirection,
  isSignificantHeadingChange,
} from './compass/index';

export type {
  WindDirectionCompassProps,
  WindRelationship,
  DegreeMarksProps,
  CardinalDirectionsProps,
  WindArrowProps,
  PhoneArrowProps,
} from './compass/index';
