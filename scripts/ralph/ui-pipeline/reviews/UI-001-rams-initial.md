# RAMS Initial Review: UI-001 Play Screen

**Component:** `src/features/redesign/screens/PlayScreen.tsx`
**Related Files:**
- `src/components/redesign/MetricPill.tsx`
- `src/components/redesign/QuickAction.tsx`
- `src/components/redesign/ResultCard.tsx`

**Reviewer:** RAMS (Review Accessibility, Metrics, Style)
**Date:** 2026-01-13

---

## Executive Summary

The PlayScreen is well-structured with good component separation and follows many best practices. However, there are **12 issues** identified across visual hierarchy, spacing, design tokens, polish, and accessibility.

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Visual Hierarchy | 1 | 1 | 1 | - |
| Spacing Consistency | - | 2 | 2 | - |
| Design Token Compliance | 1 | 2 | 1 | - |
| Professional Polish | - | 1 | 1 | - |
| Accessibility | 1 | 1 | 1 | - |

---

## 1. Visual Hierarchy

### CRITICAL: DistanceInput Hero Value Dominance
**File:** `PlayScreen.tsx:498-503`
```tsx
distanceValue: {
  fontSize: 64,
  fontWeight: '700',
  letterSpacing: -2,
  lineHeight: 72,
}
```
**Issue:** The 64px hero number works well, but the `lineHeight: 72` creates tight line spacing. With the unit text below at `-4` margin, there's inconsistent vertical rhythm.

**Recommendation:** Use `lineHeight: 76` (1.19x ratio) for better optical balance, or increase the negative margin on unit to `-8`.

### HIGH: Header Title Size vs ResultCard Primary Value
**Files:** `PlayScreen.tsx:439-442`, `ResultCard.tsx:258-263`
```tsx
// PlayScreen title
title: { fontSize: 32, fontWeight: '700' }

// ResultCard primary
primaryValue: { fontSize: 48, fontWeight: '700' }
```
**Issue:** The "Your Shot" title (32px) and the result primary value (48px) have appropriate hierarchy, but the `subtitle` at 16px is too close to body text. This creates ambiguity about information importance.

**Recommendation:** Increase subtitle to 18px or add opacity/weight differentiation.

### MEDIUM: Conditions Bar Visual Weight
**File:** `PlayScreen.tsx:198-219`
**Issue:** All MetricPills have equal visual weight. Wind conditions should be emphasized since they most affect shot calculations.

**Recommendation:** Use `status="warning"` styling or a slightly larger first pill for wind data.

---

## 2. Spacing Consistency

### HIGH: Hardcoded Spacing Values
**File:** `PlayScreen.tsx` - Multiple locations

| Line | Value | Should Be |
|------|-------|-----------|
| 432 | `paddingTop: 8` | `tokens.spacing.sm` (8) |
| 437 | `marginBottom: 20` | `tokens.spacing.lg` (24) or custom |
| 454 | `marginHorizontal: -16` | `-tokens.spacing.md` |
| 458 | `gap: 8` | `tokens.spacing.sm` |
| 477 | `gap: 16` | `tokens.spacing.md` |
| 525 | `gap: 10` | `tokens.spacing.sm` (8) or `tokens.spacing.base` (12) |

**Issue:** Using magic numbers instead of design tokens. The value `20` on line 437 and `10` on line 525 are not in the spacing scale (4/8/12/16/24/32/48).

**Recommendation:** Replace all numeric values with token references. For `20`, use `24` (lg). For `10`, use `12` (base) or `8` (sm).

### HIGH: ResultCard marginBottom Inconsistency
**File:** `PlayScreen.tsx:534`
```tsx
resultCard: {
  marginBottom: 16,
}
```
**Issue:** The `16` is valid but inconsistent with `marginBottom: 24` used elsewhere (line 465, 514).

**Recommendation:** Standardize vertical rhythm. Recommend `24` (lg) for section spacing.

### MEDIUM: QuickAction Gap Value
**File:** `QuickAction.tsx:208`
```tsx
gap: 10,
```
**Issue:** `10` is not in the spacing scale.

**Recommendation:** Use `tokens.spacing.sm` (8) or `tokens.spacing.base` (12).

### MEDIUM: MetricPill Padding Inconsistency
**File:** `MetricPill.tsx:156`
```tsx
paddingHorizontal: 14,
```
**Issue:** `14` is not in the spacing scale (should be 12 or 16).

**Recommendation:** Use `tokens.spacing.base` (12) or `tokens.spacing.md` (16).

---

## 3. Design Token Compliance

### CRITICAL: Hardcoded Colors in QuickAction
**File:** `QuickAction.tsx:184`
```tsx
color: variant === 'primary'
  ? 'rgba(255,255,255,0.8)'
  : colors.textMuted,
```
**Issue:** Hardcoded RGBA value for sublabel color instead of using theme token.

**Recommendation:** Create `colors.textInverseSecondary` or use `colors.textInverse` with opacity token.

### HIGH: Shadow Not Using Token System
**File:** `ResultCard.tsx:115-118`
```tsx
...(isHighlighted && {
  ...tokens.shadows.lg,
  shadowColor: colors.brand,
}),
```
**Issue:** Spreading `tokens.shadows.lg` but then overriding `shadowColor`. This pattern breaks if shadow tokens change structure. Also, `tokens.shadows` doesn't exist in the main tokens - it's `shadow` (no 's').

**Recommendation:** Access shadows correctly via `tokens.shadow.lg` or use the theme's shadow object.

### HIGH: Missing Token Usage in ResultCard Styles
**File:** `ResultCard.tsx:235-299`
```tsx
card: { borderRadius: 20, minHeight: 140 }
primarySection: { marginBottom: 16 }
primaryValue: { fontSize: 48, letterSpacing: -1.5, lineHeight: 56 }
detailsRow: { gap: 24 }
```
**Issues:**
- `borderRadius: 20` should use `tokens.borderRadius['2xl']` (20)
- `minHeight: 140` is magic number
- `marginBottom: 16` should use token
- `fontSize: 48` not in font scale
- `gap: 24` should use `tokens.spacing.lg`

### MEDIUM: Font Sizes Outside Scale
**Files:** Multiple
```
ResultCard.tsx:258 - fontSize: 48 (not in scale, closest is 36)
ResultCard.tsx:265 - fontSize: 36 (in scale)
PlayScreen.tsx:498 - fontSize: 64 (not in scale)
```
**Issue:** The font scale ends at `4xl: 36`. Larger sizes like 48, 64 are used but not defined.

**Recommendation:** Extend `fontSize` in tokens.ts:
```tsx
fontSize = {
  ...existing,
  '5xl': 48,
  '6xl': 64,
}
```

---

## 4. Professional Polish

### HIGH: Adjust Button Border Radius Inconsistency
**File:** `PlayScreen.tsx:480-485`
```tsx
adjustButton: {
  width: 56,
  height: 56,
  borderRadius: 16,
}
```
**Issue:** Using `borderRadius: 16` on a 56x56 button creates a rounded square, but QuickAction buttons use the same radius on variable widths. Consider using a proportional radius (like 28 for a circle) or consistent 16 across all buttons.

**Recommendation:** Decide on button shape language: fully round (28) or rounded square (16). Current inconsistency suggests unintentional design.

### MEDIUM: Wind Details Section Visual Separation
**File:** `PlayScreen.tsx:538-561`
**Issue:** The wind details section uses `padding: 16` and `borderRadius: 16` but lacks visual distinction from the ResultCard above. Both are surface-colored rectangles.

**Recommendation:** Add subtle top border, reduce border radius to 12, or use different background opacity to create visual hierarchy.

---

## 5. Accessibility

### CRITICAL: Missing accessibilityLabel on ConditionsBar
**File:** `PlayScreen.tsx:191-221`
```tsx
const ConditionsBar = memo(function ConditionsBar({...}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.conditionsScroll}
      ...
    >
```
**Issue:** The horizontal ScrollView has no accessibility label explaining it's a conditions summary. Screen readers can't communicate the purpose.

**Recommendation:** Add:
```tsx
accessible={true}
accessibilityRole="summary"
accessibilityLabel="Current weather conditions"
```

### HIGH: Touch Target Size for Adjust Buttons
**File:** `PlayScreen.tsx:480-485`
```tsx
adjustButton: {
  width: 56,
  height: 56,
}
```
**Analysis:** 56x56 meets the minimum 48dp requirement but for a golf app used with gloves outdoors, the design system recommends 72dp for primary actions.

**Recommendation:** Increase to 64x64 or 72x72 for glove-friendly interaction.

### MEDIUM: Reduced Motion Not Respected
**Files:** `PlayScreen.tsx:338-405`, `QuickAction.tsx:75-84`, `ResultCard.tsx:90-103`
**Issue:** Animations using `FadeIn`, `FadeInDown`, `withTiming` don't check for reduced motion preferences.

**Recommendation:** Wrap animations with `useReducedMotion()` from reanimated:
```tsx
const reducedMotion = useReducedMotion();
// Skip or minimize animation if reducedMotion is true
```

---

## Issue Summary Table

| ID | Severity | File | Line | Issue | Fix |
|----|----------|------|------|-------|-----|
| VH-1 | CRITICAL | PlayScreen.tsx | 500-503 | lineHeight/margin rhythm | Increase lineHeight to 76 |
| VH-2 | HIGH | PlayScreen.tsx | 445-448 | subtitle visual weight | Increase to 18px |
| VH-3 | MEDIUM | PlayScreen.tsx | 198-219 | wind not emphasized | Add status styling |
| SP-1 | HIGH | PlayScreen.tsx | multiple | hardcoded spacing | Use tokens |
| SP-2 | HIGH | PlayScreen.tsx | 534 | inconsistent marginBottom | Use 24 (lg) |
| SP-3 | MEDIUM | QuickAction.tsx | 208 | gap: 10 off-scale | Use 8 or 12 |
| SP-4 | MEDIUM | MetricPill.tsx | 156 | padding: 14 off-scale | Use 12 or 16 |
| DT-1 | CRITICAL | QuickAction.tsx | 184 | hardcoded RGBA | Use theme token |
| DT-2 | HIGH | ResultCard.tsx | 115-118 | shadows.lg typo | Use shadow.lg |
| DT-3 | HIGH | ResultCard.tsx | 235-299 | multiple magic numbers | Use tokens |
| DT-4 | MEDIUM | Multiple | - | fontSize 48/64 undefined | Extend token scale |
| PP-1 | HIGH | PlayScreen.tsx | 480-485 | button radius inconsistent | Standardize shape |
| PP-2 | MEDIUM | PlayScreen.tsx | 538-561 | wind section not distinct | Add visual separation |
| A11Y-1 | CRITICAL | PlayScreen.tsx | 191-221 | ConditionsBar no a11y | Add role/label |
| A11Y-2 | HIGH | PlayScreen.tsx | 480-485 | touch targets small | Increase to 64+ |
| A11Y-3 | MEDIUM | Multiple | - | reduced motion ignored | Add useReducedMotion |

---

## Recommendations Priority

### P0 - Must Fix Before Next Phase
1. **A11Y-1:** Add accessibility props to ConditionsBar
2. **DT-1:** Replace hardcoded RGBA with theme token
3. **VH-1:** Fix lineHeight for hero distance value

### P1 - Should Fix
4. **SP-1:** Replace all hardcoded spacing with tokens
5. **DT-2:** Fix shadow token reference (shadows → shadow)
6. **A11Y-2:** Increase touch target sizes
7. **PP-1:** Standardize button border radius

### P2 - Nice to Have
8. **DT-4:** Extend font size scale
9. **A11Y-3:** Add reduced motion support
10. All remaining MEDIUM issues

---

## Next Steps

This review should be sent to GPT for cross-review (Phase 2: `gpt-cross-review`) to:
1. Identify blind spots RAMS may have missed
2. Validate priority assessments
3. Add React Native/Golf app specific insights
