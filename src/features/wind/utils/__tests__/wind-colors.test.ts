/**
 * Wind Color Utilities Tests
 *
 * Binary tests for wind UI behavior. AI can iterate until these pass.
 * Run with: npm test wind-colors
 */

import {
  getWindArrowColor,
  getWindOpacity,
  getWindScale,
  shouldShowGustPulse,
  getWindRelationship,
  applyColorOpacity,
  WIND_COLORS,
} from '../wind-colors';

describe('Wind Arrow Colors', () => {
  describe('getWindArrowColor', () => {
    test('TAILWIND returns green (#16A34A)', () => {
      expect(getWindArrowColor('TAILWIND')).toBe('#16A34A');
    });

    test('HEADWIND returns red (#DC2626)', () => {
      expect(getWindArrowColor('HEADWIND')).toBe('#DC2626');
    });

    test('CROSSWIND returns yellow (#F59E0B)', () => {
      expect(getWindArrowColor('CROSSWIND')).toBe('#F59E0B');
    });

    test('QUARTERING returns gold default (#DAA520)', () => {
      expect(getWindArrowColor('QUARTERING')).toBe('#DAA520');
    });

    test('undefined returns gold default (#DAA520)', () => {
      expect(getWindArrowColor(undefined)).toBe('#DAA520');
    });
  });

  describe('getWindRelationship', () => {
    // HEADWIND: 0° ± 22.5° (337.5° to 22.5°)
    test('0° (direct head-on) = HEADWIND', () => {
      expect(getWindRelationship(0)).toBe('HEADWIND');
    });

    test('10° = HEADWIND', () => {
      expect(getWindRelationship(10)).toBe('HEADWIND');
    });

    test('22° = HEADWIND (just inside threshold)', () => {
      expect(getWindRelationship(22)).toBe('HEADWIND');
    });

    test('350° = HEADWIND (wrapping around)', () => {
      expect(getWindRelationship(350)).toBe('HEADWIND');
    });

    // TAILWIND: 180° ± 22.5° (157.5° to 202.5°)
    test('180° (direct tailwind) = TAILWIND', () => {
      expect(getWindRelationship(180)).toBe('TAILWIND');
    });

    test('165° = TAILWIND', () => {
      expect(getWindRelationship(165)).toBe('TAILWIND');
    });

    test('195° = TAILWIND', () => {
      expect(getWindRelationship(195)).toBe('TAILWIND');
    });

    // CROSSWIND: 90° ± 22.5° (67.5° to 112.5°) OR 270° ± 22.5° (247.5° to 292.5°)
    test('90° (right crosswind) = CROSSWIND', () => {
      expect(getWindRelationship(90)).toBe('CROSSWIND');
    });

    test('270° (left crosswind) = CROSSWIND', () => {
      expect(getWindRelationship(270)).toBe('CROSSWIND');
    });

    test('80° = CROSSWIND', () => {
      expect(getWindRelationship(80)).toBe('CROSSWIND');
    });

    test('260° = CROSSWIND', () => {
      expect(getWindRelationship(260)).toBe('CROSSWIND');
    });

    // QUARTERING: Everything else
    test('45° = QUARTERING (between head and cross)', () => {
      expect(getWindRelationship(45)).toBe('QUARTERING');
    });

    test('135° = QUARTERING (between cross and tail)', () => {
      expect(getWindRelationship(135)).toBe('QUARTERING');
    });

    test('225° = QUARTERING (between tail and cross)', () => {
      expect(getWindRelationship(225)).toBe('QUARTERING');
    });

    test('315° = QUARTERING (between cross and head)', () => {
      expect(getWindRelationship(315)).toBe('QUARTERING');
    });

    // Normalize negative and >360 angles
    test('handles negative angles (-90° = 270° = CROSSWIND)', () => {
      expect(getWindRelationship(-90)).toBe('CROSSWIND');
    });

    test('handles angles > 360° (450° = 90° = CROSSWIND)', () => {
      expect(getWindRelationship(450)).toBe('CROSSWIND');
    });
  });
});

describe('Wind Strength Intensity', () => {
  describe('getWindOpacity', () => {
    test('0 mph = 0.4 opacity (minimum)', () => {
      expect(getWindOpacity(0)).toBeCloseTo(0.4, 2);
    });

    test('15 mph = 0.7 opacity (midpoint)', () => {
      expect(getWindOpacity(15)).toBeCloseTo(0.7, 2);
    });

    test('30 mph = 1.0 opacity (maximum)', () => {
      expect(getWindOpacity(30)).toBeCloseTo(1.0, 2);
    });

    test('5 mph = 0.5 opacity', () => {
      expect(getWindOpacity(5)).toBeCloseTo(0.5, 2);
    });

    test('25 mph = 0.9 opacity', () => {
      expect(getWindOpacity(25)).toBeCloseTo(0.9, 2);
    });

    test('clamps negative values to 0.4', () => {
      expect(getWindOpacity(-10)).toBeCloseTo(0.4, 2);
    });

    test('clamps values > 30 to 1.0', () => {
      expect(getWindOpacity(50)).toBeCloseTo(1.0, 2);
    });
  });

  describe('getWindScale', () => {
    test('0 mph = 0.4 scale (minimum)', () => {
      expect(getWindScale(0)).toBeCloseTo(0.4, 2);
    });

    test('30 mph = 1.0 scale (maximum)', () => {
      expect(getWindScale(30)).toBeCloseTo(1.0, 2);
    });
  });
});

describe('Gust Pulse Animation', () => {
  describe('shouldShowGustPulse', () => {
    test('gust > sustained = true', () => {
      expect(shouldShowGustPulse(20, 15)).toBe(true);
    });

    test('gust = sustained = false', () => {
      expect(shouldShowGustPulse(15, 15)).toBe(false);
    });

    test('gust < sustained = false', () => {
      expect(shouldShowGustPulse(10, 15)).toBe(false);
    });

    test('undefined gust = false', () => {
      expect(shouldShowGustPulse(undefined, 15)).toBe(false);
    });

    test('gust only slightly higher = true', () => {
      expect(shouldShowGustPulse(15.1, 15)).toBe(true);
    });
  });
});

describe('Color with Opacity', () => {
  describe('applyColorOpacity', () => {
    test('full opacity (1.0) = ff suffix', () => {
      expect(applyColorOpacity('#16A34A', 1.0).toLowerCase()).toBe('#16a34aff');
    });

    test('half opacity (0.5) = 80 suffix', () => {
      expect(applyColorOpacity('#16A34A', 0.5)).toBe('#16A34A80');
    });

    test('zero opacity (0.0) = 00 suffix', () => {
      expect(applyColorOpacity('#16A34A', 0.0)).toBe('#16A34A00');
    });

    test('0.4 opacity (min wind) = 66 suffix', () => {
      expect(applyColorOpacity('#DC2626', 0.4)).toBe('#DC262666');
    });
  });
});

describe('Color Constants', () => {
  test('WIND_COLORS exports expected values', () => {
    expect(WIND_COLORS.TAILWIND).toBe('#16A34A');
    expect(WIND_COLORS.HEADWIND).toBe('#DC2626');
    expect(WIND_COLORS.CROSSWIND).toBe('#F59E0B');
    expect(WIND_COLORS.DEFAULT).toBe('#DAA520');
  });
});
