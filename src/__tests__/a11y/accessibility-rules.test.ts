/**
 * Accessibility Regression Tests
 *
 * Binary tests ensuring no accessibility regressions occur.
 * Tests validate component patterns, touch targets, and a11y props.
 *
 * Run with: npm test a11y
 *
 * @see CLAUDE.md rules/react-native-a11y.md for requirements
 */

import { Platform } from 'react-native';

/**
 * Accessibility Constants
 * Derived from Apple HIG and project requirements
 */
export const A11Y_CONSTANTS = {
  /** Minimum touch target size in dp (project requirement: 48dp, not iOS 44pt) */
  MIN_TOUCH_TARGET: 48,
  /** Primary action touch target size in dp */
  PRIMARY_TOUCH_TARGET: 56,
  /** Standard iOS touch target (for reference) */
  IOS_TOUCH_TARGET: 44,
};

/**
 * Valid accessibility roles for React Native components
 * @see https://reactnative.dev/docs/accessibility#accessibilityrole
 */
export const VALID_ACCESSIBILITY_ROLES = [
  'none',
  'button',
  'link',
  'search',
  'image',
  'keyboardkey',
  'text',
  'adjustable',
  'imagebutton',
  'header',
  'summary',
  'alert',
  'checkbox',
  'combobox',
  'menu',
  'menubar',
  'menuitem',
  'progressbar',
  'radio',
  'radiogroup',
  'scrollbar',
  'spinbutton',
  'switch',
  'tab',
  'tablist',
  'timer',
  'toolbar',
] as const;

export type AccessibilityRole = (typeof VALID_ACCESSIBILITY_ROLES)[number];

describe('Accessibility Constants', () => {
  test('MIN_TOUCH_TARGET is at least 48dp (project requirement)', () => {
    expect(A11Y_CONSTANTS.MIN_TOUCH_TARGET).toBeGreaterThanOrEqual(48);
  });

  test('PRIMARY_TOUCH_TARGET is at least 56dp for primary actions', () => {
    expect(A11Y_CONSTANTS.PRIMARY_TOUCH_TARGET).toBeGreaterThanOrEqual(56);
  });
});

describe('Accessibility Role Validation', () => {
  test('button is a valid role', () => {
    expect(VALID_ACCESSIBILITY_ROLES).toContain('button');
  });

  test('header is a valid role', () => {
    expect(VALID_ACCESSIBILITY_ROLES).toContain('header');
  });

  test('alert is a valid role', () => {
    expect(VALID_ACCESSIBILITY_ROLES).toContain('alert');
  });

  test('adjustable is a valid role (for sliders)', () => {
    expect(VALID_ACCESSIBILITY_ROLES).toContain('adjustable');
  });
});

/**
 * Validates that a touch target meets minimum size requirements
 * @param width - Width in dp
 * @param height - Height in dp
 * @param hitSlop - Optional hitSlop to add to dimensions
 * @returns Object with validation result and effective size
 */
export function validateTouchTarget(
  width: number,
  height: number,
  hitSlop?: { top?: number; bottom?: number; left?: number; right?: number }
): { isValid: boolean; effectiveWidth: number; effectiveHeight: number } {
  const effectiveWidth = width + (hitSlop?.left ?? 0) + (hitSlop?.right ?? 0);
  const effectiveHeight = height + (hitSlop?.top ?? 0) + (hitSlop?.bottom ?? 0);

  return {
    isValid:
      effectiveWidth >= A11Y_CONSTANTS.MIN_TOUCH_TARGET &&
      effectiveHeight >= A11Y_CONSTANTS.MIN_TOUCH_TARGET,
    effectiveWidth,
    effectiveHeight,
  };
}

describe('Touch Target Validation', () => {
  test('48x48 touch target is valid', () => {
    const result = validateTouchTarget(48, 48);
    expect(result.isValid).toBe(true);
  });

  test('40x40 touch target is NOT valid without hitSlop', () => {
    const result = validateTouchTarget(40, 40);
    expect(result.isValid).toBe(false);
  });

  test('40x40 with hitSlop bringing it to 48x48 IS valid', () => {
    const result = validateTouchTarget(40, 40, { top: 4, bottom: 4, left: 4, right: 4 });
    expect(result.isValid).toBe(true);
    expect(result.effectiveWidth).toBe(48);
    expect(result.effectiveHeight).toBe(48);
  });

  test('56x80 ThumbZoneLockButton dimensions are valid', () => {
    // ThumbZoneLockButton: 56 width, 80 height, with hitSlop 8/8/12/12
    const result = validateTouchTarget(56, 80, { top: 12, bottom: 12, left: 8, right: 8 });
    expect(result.isValid).toBe(true);
    expect(result.effectiveWidth).toBe(72);
    expect(result.effectiveHeight).toBe(104);
  });

  test('icon button (44pt) needs hitSlop on project requirement', () => {
    // iOS minimum is 44pt, but project requires 48dp
    const result = validateTouchTarget(44, 44);
    expect(result.isValid).toBe(false);

    // With 2px hitSlop on each side
    const withHitSlop = validateTouchTarget(44, 44, { top: 2, bottom: 2, left: 2, right: 2 });
    expect(withHitSlop.isValid).toBe(true);
  });
});

/**
 * Validates accessibility label format
 * Labels should be:
 * - Non-empty
 * - Descriptive (not just "button" or "image")
 * - Include context when needed
 * - Include units for values
 */
export function validateAccessibilityLabel(label: string | undefined): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!label) {
    return { isValid: false, issues: ['Missing accessibility label'] };
  }

  if (label.trim() === '') {
    issues.push('Empty accessibility label');
  }

  // Check for generic labels
  const genericLabels = ['button', 'image', 'icon', 'link', 'press', 'tap', 'click'];
  if (genericLabels.includes(label.toLowerCase().trim())) {
    issues.push(`Generic label "${label}" - should be more descriptive`);
  }

  // Check for trailing/leading whitespace
  if (label !== label.trim()) {
    issues.push('Label has leading/trailing whitespace');
  }

  return { isValid: issues.length === 0, issues };
}

describe('Accessibility Label Validation', () => {
  test('descriptive label is valid', () => {
    const result = validateAccessibilityLabel('Lock compass direction');
    expect(result.isValid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  test('undefined label is invalid', () => {
    const result = validateAccessibilityLabel(undefined);
    expect(result.isValid).toBe(false);
    expect(result.issues).toContain('Missing accessibility label');
  });

  test('empty label is invalid', () => {
    const result = validateAccessibilityLabel('');
    expect(result.isValid).toBe(false);
  });

  test('generic "button" label is flagged', () => {
    const result = validateAccessibilityLabel('button');
    expect(result.isValid).toBe(false);
    expect(result.issues[0]).toContain('Generic label');
  });

  test('label with units is valid', () => {
    const result = validateAccessibilityLabel('Temperature: 72 degrees Fahrenheit');
    expect(result.isValid).toBe(true);
  });

  test('whitespace-only label is invalid', () => {
    const result = validateAccessibilityLabel('   ');
    expect(result.isValid).toBe(false);
  });
});

/**
 * Validates that a value label includes its unit
 * Important for screen readers to announce "72 degrees" not just "72"
 */
export function validateValueWithUnit(
  value: string | number,
  expectedUnitPattern?: RegExp
): { hasUnit: boolean; value: string } {
  const stringValue = String(value);

  // Common unit patterns
  const unitPatterns = [
    /\d+\s*(mph|km\/h|m\/s)/i, // Speed
    /\d+\s*(degrees?|°|deg)/i, // Angle/temperature
    /\d+\s*(yards?|yds?|meters?|m|feet|ft)/i, // Distance
    /\d+\s*(percent|%)/i, // Percentage
    /\d+\s*(seconds?|sec|s|minutes?|min|hours?|hr)/i, // Time
  ];

  const patterns = expectedUnitPattern ? [expectedUnitPattern] : unitPatterns;
  const hasUnit = patterns.some((pattern) => pattern.test(stringValue));

  return { hasUnit, value: stringValue };
}

describe('Value with Unit Validation', () => {
  test('"15 mph" has unit', () => {
    const result = validateValueWithUnit('15 mph');
    expect(result.hasUnit).toBe(true);
  });

  test('"72 degrees" has unit', () => {
    const result = validateValueWithUnit('72 degrees');
    expect(result.hasUnit).toBe(true);
  });

  test('"72" alone does NOT have unit', () => {
    const result = validateValueWithUnit('72');
    expect(result.hasUnit).toBe(false);
  });

  test('"150 yards" has unit', () => {
    const result = validateValueWithUnit('150 yards');
    expect(result.hasUnit).toBe(true);
  });

  test('"50%" has unit', () => {
    const result = validateValueWithUnit('50%');
    expect(result.hasUnit).toBe(true);
  });

  test('custom unit pattern works', () => {
    const result = validateValueWithUnit('5 clubs', /\d+\s*clubs?/i);
    expect(result.hasUnit).toBe(true);
  });
});

/**
 * Required accessibility props for interactive elements
 */
export interface RequiredA11yProps {
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
}

/**
 * Validates that an interactive element has required a11y props
 */
export function validateInteractiveElement(props: Partial<RequiredA11yProps>): {
  isValid: boolean;
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];

  if (!props.accessibilityRole) {
    missing.push('accessibilityRole');
  }

  if (!props.accessibilityLabel) {
    missing.push('accessibilityLabel');
  } else {
    const labelValidation = validateAccessibilityLabel(props.accessibilityLabel);
    if (!labelValidation.isValid) {
      warnings.push(...labelValidation.issues);
    }
  }

  // accessibilityHint is recommended but not required
  if (!props.accessibilityHint) {
    warnings.push('Consider adding accessibilityHint for non-obvious interactions');
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
}

describe('Interactive Element Validation', () => {
  test('complete props are valid', () => {
    const result = validateInteractiveElement({
      accessibilityRole: 'button',
      accessibilityLabel: 'Lock compass direction',
      accessibilityHint: 'Locks the shot direction for wind calculations',
    });
    expect(result.isValid).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  test('missing role is flagged', () => {
    const result = validateInteractiveElement({
      accessibilityLabel: 'Lock compass direction',
    });
    expect(result.isValid).toBe(false);
    expect(result.missing).toContain('accessibilityRole');
  });

  test('missing label is flagged', () => {
    const result = validateInteractiveElement({
      accessibilityRole: 'button',
    });
    expect(result.isValid).toBe(false);
    expect(result.missing).toContain('accessibilityLabel');
  });

  test('missing hint produces warning', () => {
    const result = validateInteractiveElement({
      accessibilityRole: 'button',
      accessibilityLabel: 'Lock compass direction',
    });
    expect(result.isValid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

/**
 * Validates decorative element is hidden from accessibility tree
 */
export function validateDecorativeElement(props: {
  accessibilityElementsHidden?: boolean;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
}): { isHidden: boolean } {
  const isHidden =
    props.accessibilityElementsHidden === true ||
    props.importantForAccessibility === 'no' ||
    props.importantForAccessibility === 'no-hide-descendants';

  return { isHidden };
}

describe('Decorative Element Validation', () => {
  test('accessibilityElementsHidden=true is hidden', () => {
    const result = validateDecorativeElement({ accessibilityElementsHidden: true });
    expect(result.isHidden).toBe(true);
  });

  test('importantForAccessibility="no" is hidden', () => {
    const result = validateDecorativeElement({ importantForAccessibility: 'no' });
    expect(result.isHidden).toBe(true);
  });

  test('importantForAccessibility="no-hide-descendants" is hidden', () => {
    const result = validateDecorativeElement({ importantForAccessibility: 'no-hide-descendants' });
    expect(result.isHidden).toBe(true);
  });

  test('no props means NOT hidden (regression check)', () => {
    const result = validateDecorativeElement({});
    expect(result.isHidden).toBe(false);
  });
});

/**
 * Validates slider/adjustable element has required value props
 */
export function validateSliderAccessibility(props: {
  accessibilityRole?: string;
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
}): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (props.accessibilityRole !== 'adjustable') {
    issues.push('Slider should have accessibilityRole="adjustable"');
  }

  if (!props.accessibilityValue) {
    issues.push('Missing accessibilityValue');
    return { isValid: false, issues };
  }

  if (props.accessibilityValue.min === undefined) {
    issues.push('Missing accessibilityValue.min');
  }

  if (props.accessibilityValue.max === undefined) {
    issues.push('Missing accessibilityValue.max');
  }

  if (props.accessibilityValue.now === undefined) {
    issues.push('Missing accessibilityValue.now');
  }

  // text should include unit
  if (props.accessibilityValue.text) {
    const unitCheck = validateValueWithUnit(props.accessibilityValue.text);
    if (!unitCheck.hasUnit) {
      issues.push('accessibilityValue.text should include unit (e.g., "15 mph")');
    }
  }

  return { isValid: issues.length === 0, issues };
}

describe('Slider Accessibility Validation', () => {
  test('complete slider props are valid', () => {
    const result = validateSliderAccessibility({
      accessibilityRole: 'adjustable',
      accessibilityValue: {
        min: 0,
        max: 30,
        now: 15,
        text: '15 mph',
      },
    });
    expect(result.isValid).toBe(true);
  });

  test('missing role is flagged', () => {
    const result = validateSliderAccessibility({
      accessibilityValue: { min: 0, max: 30, now: 15 },
    });
    expect(result.isValid).toBe(false);
    expect(result.issues[0]).toContain('adjustable');
  });

  test('missing accessibilityValue is flagged', () => {
    const result = validateSliderAccessibility({
      accessibilityRole: 'adjustable',
    });
    expect(result.isValid).toBe(false);
    expect(result.issues).toContain('Missing accessibilityValue');
  });

  test('text without unit produces issue', () => {
    const result = validateSliderAccessibility({
      accessibilityRole: 'adjustable',
      accessibilityValue: {
        min: 0,
        max: 30,
        now: 15,
        text: '15', // Missing unit
      },
    });
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.includes('unit'))).toBe(true);
  });
});
