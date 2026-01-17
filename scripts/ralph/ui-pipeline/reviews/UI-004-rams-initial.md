# UI-004 RAMS Initial Review: Wind/Calculator Screen

**Component:** `src/features/wind/screen.tsx`
**Date:** 2026-01-13
**Phase:** 1 - RAMS Review
**Reviewer:** RAMS (Accessibility & Design System Analysis)

---

## Executive Summary

WindScreen is a premium feature with a compass-based wind calculator. Good use of `useAccessibleAnimations` hook and proper touch target sizing. However, several interactive elements lack accessibility props, and the premium upgrade button is non-functional.

**Initial Score:** 76/100

---

## Issues Found

### P0 - Critical (2 issues)

#### 1. YardagePresetButton Missing Accessibility Props
**Location:** `screen.tsx` lines 70-74
**Issue:** Pressable buttons for yardage presets lack `accessibilityRole` and `accessibilityLabel`.
**Impact:** Screen readers cannot identify these as buttons or their purpose.
**Fix:**
```tsx
<Pressable
  onPress={onPress}
  style={buttonStyle}
  accessibilityRole="button"
  accessibilityLabel={`Select ${value} yards`}
  accessibilityState={{ selected: isSelected }}
>
```

#### 2. Premium Upgrade Button Non-Functional
**Location:** `screen.tsx` lines 119-126
**Issue:** `onPress={() => {}}` - button does nothing when pressed.
**Impact:** Broken affordance, user frustration on premium gate.
**Fix:**
```tsx
<Button
  onPress={() => {
    // Navigate to premium screen or show upgrade modal
    Alert.alert('Premium', 'Wind calculator requires a Premium subscription.');
  }}
  variant="neon"
  size="lg"
  style={styles.premiumButton}
>
```

---

### P1 - Serious (6 issues)

#### 3. Title Missing Header Role
**Location:** `screen.tsx` line 165
**Issue:** "Wind Calculator" title lacks `accessibilityRole="header"`.
**Fix:**
```tsx
<Text
  style={[styles.title, { color: t.colors.textPrimary }]}
  accessibilityRole="header"
>
  Wind Calculator
</Text>
```

#### 4. Error State Icon Should Be Hidden
**Location:** `screen.tsx` line 146
**Issue:** Wind icon in error state is decorative but announced.
**Fix:**
```tsx
<Wind
  size={t.containerSize.icon.lg}
  color={t.colors.textMuted}
  accessibilityElementsHidden={true}
/>
```

#### 5. Loading State Missing Accessibility
**Location:** `screen.tsx` lines 133-140
**Issue:** Loading state shows visual pulses but no screen reader announcement.
**Fix:** Add accessible loading indicator or use React Native's ActivityIndicator with proper label:
```tsx
<View
  style={[styles.container, styles.centerContent, { backgroundColor: t.colors.background }]}
  accessibilityRole="progressbar"
  accessibilityLabel="Loading wind calculator"
>
```

#### 6. Compass Hint Low Contrast
**Location:** `screen.tsx` lines 183-185, style line 382
**Issue:** Hint text has `opacity: t.opacity.subtle` which may reduce readability outdoors.
**Impact:** Golf-specific concern - outdoor sunlight readability.
**Recommendation:** Review opacity value and consider minimum 0.7 for instructional text.

#### 7. Results Section Missing Context
**Location:** `screen.tsx` line 256
**Issue:** When results appear, no announcement for screen readers.
**Fix:**
```tsx
<Animated.View
  entering={cardEntering(0)}
  accessibilityRole="summary"
  accessibilityLabel="Wind calculation results"
>
  <WindCalculationResults result={result} />
</Animated.View>
```

#### 8. Initialize Wind Icon Decorative
**Location:** `screen.tsx` lines 337-339
**Issue:** Initial loading Wind icon should be hidden from accessibility tree.
**Fix:**
```tsx
<Wind
  size={t.containerSize.icon.sm}
  color={t.colors.textMuted}
  accessibilityElementsHidden={true}
/>
```

---

### P2 - Moderate (4 issues)

#### 9. Title Font Size Uses Arithmetic
**Location:** `screen.tsx` line 363
**Issue:** `fontSize: safeScaledFontSize(t.fontSize['4xl'] - 4)` - uses arithmetic instead of token.
**Recommendation:** Define a specific token or use `t.fontSize['3xl']` (28px) if available.

#### 10. Subtitle Font Size Uses Arithmetic
**Location:** `screen.tsx` line 369
**Issue:** `fontSize: safeScaledFontSize(t.fontSize.sm + 1)` - uses arithmetic.
**Recommendation:** Use `t.fontSize.base` (16px) or define specific subtitle token.

#### 11. Complex Spacing Calculations
**Locations:** Lines 395, 438, 463
**Issue:** Using expressions like `t.spacing.md + t.spacing.xs` instead of semantic tokens.
**Recommendation:** Define semantic spacing tokens or use closest available value.

#### 12. Calculate Button Could Have More Context
**Location:** `screen.tsx` lines 242-250
**Issue:** Button text is clear but could benefit from describing what data will be used.
**Note:** Low priority - current text is acceptable.

---

## Positive Patterns Found

1. **useAccessibleAnimations hook** - Proper reduced motion support
2. **YardagePresetButton touch targets** - Uses `t.touchTarget.minimum`
3. **WindDirectionCompass accessibility** - Excellent!
   - Uses `AccessibilityInfo.announceForAccessibility` for lock state
   - Has `accessibilityRole="text"` on wind label
   - Proper accessibility labels throughout
4. **LockButton** - Positioned based on dominant hand setting
5. **EffectsGrid** - All effect values have `accessibilityLabel`
6. **PrimaryRecommendation** - Has `accessibilityRole="header"` on label
7. **Token-based styling** - Good use of design tokens throughout

---

## Related Files Analysis

### WindDirectionCompass.tsx
- **Status:** EXCELLENT accessibility implementation
- Uses announceForAccessibility for state changes
- Proper labels on all interactive elements

### WindCalculationResults.tsx
- **Status:** GOOD - uses accessible sub-components
- Sub-components (EffectsGrid, etc.) have proper labels

### PrimaryRecommendation.tsx
- **Status:** GOOD - has header role

### EffectsGrid.tsx
- **Status:** EXCELLENT - all values have accessibilityLabel

---

## Golf-Specific Observations

| Requirement | Status | Notes |
|-------------|--------|-------|
| Touch targets 44dp+ | PASS | Uses touchTarget.minimum |
| Glove-friendly interactions | PASS | Large buttons, proper spacing |
| One-hand operation | PASS | Calculate button at bottom, lock button positioned by hand |
| Outdoor readability | NEEDS WORK | Compass hint opacity too low |
| Glanceable results | PASS | Large primary recommendation |

---

## Score Breakdown

| Category | Score | Notes |
|----------|-------|-------|
| Accessibility | 16/25 | Missing props on presets, broken premium CTA |
| Touch Targets | 19/20 | Well implemented |
| Design Tokens | 16/20 | Some arithmetic usage |
| Golf-Specific | 12/15 | Hint opacity concern |
| Code Quality | 13/20 | Good structure, some issues |
| **Total** | **76/100** | |

---

*RAMS Review completed: 2026-01-13*
*Next: Phase 2 - GPT Cross-Review*
