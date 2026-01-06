/**
 * Compass Components
 *
 * Modular compass components for the wind direction display.
 * Each component is memoized for optimal performance.
 */

// Main component
export { default as WindDirectionCompass } from './WindDirectionCompass';
export { default } from './WindDirectionCompass';

// Sub-components (for advanced usage or testing)
export { default as DegreeMarks } from './DegreeMarks';
export { default as CardinalDirections } from './CardinalDirections';
export { default as WindArrow } from './WindArrow';
export { default as PhoneArrow } from './PhoneArrow';
export { default as LockButton } from './LockButton';

// Types and utilities
export * from './types';

// Styles (for extending or testing)
export * from './styles';
