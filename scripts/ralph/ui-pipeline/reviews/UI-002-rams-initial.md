# RAMS Design Review: SetupScreen.tsx

```
═══════════════════════════════════════════════════════════════════════════════
RAMS DESIGN REVIEW: src/features/redesign/screens/SetupScreen.tsx
═══════════════════════════════════════════════════════════════════════════════
```

## CRITICAL (3 issues)

### 1. [A11Y] Line 99: SectionHeader action button missing accessibilityLabel
```tsx
<Pressable onPress={onAction} accessibilityRole="button">
  <Text style={[styles.sectionAction, { color: colors.brand }]}>
    {action}
  </Text>
</Pressable>
```
**Issue:** Action button has `accessibilityRole` but no `accessibilityLabel` for screen readers.
**Fix:** Add `accessibilityLabel={action}` to the Pressable.
**WCAG:** 4.1.2 (Name, Role, Value)

### 2. [A11Y] Lines 476-515: Switch components missing accessibilityLabel
```tsx
<Switch
  value={settings.locationEnabled}
  onValueChange={(value) => {...}}
  trackColor={{ false: colors.border, true: colors.brand }}
  thumbColor={colors.surface}
/>
```
**Issue:** All three Switch components (Location, Compass, Notifications) lack `accessibilityLabel`. Screen reader users won't know what the switch controls.
**Fix:** Add `accessibilityLabel` to each Switch:
- `accessibilityLabel="Enable location access"`
- `accessibilityLabel="Enable compass"`
- `accessibilityLabel="Enable notifications"`
**WCAG:** 4.1.2 (Name, Role, Value)

### 3. [A11Y] Lines 202-216: ClubRow action buttons missing accessibilityRole
```tsx
<Pressable
  onPress={onEdit}
  style={[styles.clubAction, { backgroundColor: colors.surface }]}
  accessibilityLabel={`Edit ${club.name}`}
>
```
**Issue:** Edit and Delete buttons have `accessibilityLabel` but missing `accessibilityRole="button"`.
**Fix:** Add `accessibilityRole="button"` to both Pressable components.
**WCAG:** 4.1.2 (Name, Role, Value)

---

## SERIOUS (5 issues)

### 4. [TOUCH] Lines 705-711: Club action buttons below minimum touch target
```tsx
clubAction: {
  width: 36,
  height: 36,  // ❌ Below 44px minimum
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center',
},
```
**Issue:** Touch targets are 36x36px, below the 44x44px WCAG minimum (especially problematic for golf apps where users may wear gloves).
**Fix:** Increase to `width: 44, height: 44` using `tokens.touchTarget.minimum`.
**WCAG:** 2.5.5 (Target Size)

### 5. [A11Y] Lines 255-256: ThemeSelector radio buttons missing accessibilityLabel
```tsx
accessibilityRole="radio"
accessibilityState={{ selected: value === option.mode }}
```
**Issue:** Radio buttons have role and state but no `accessibilityLabel` for the individual options.
**Fix:** Add `accessibilityLabel={option.label}` to each theme option Pressable.
**WCAG:** 4.1.2 (Name, Role, Value)

### 6. [A11Y] Lines 414-463: Unit selector radio buttons missing accessibilityLabel
```tsx
<Pressable
  onPress={() => handleUnitChange('imperial')}
  style={[...]}
  accessibilityRole="radio"
  accessibilityState={{ selected: !isMetric }}
>
```
**Issue:** Imperial and Metric radio buttons have role/state but no `accessibilityLabel`.
**Fix:** Add `accessibilityLabel="Imperial units: Yards, Fahrenheit, mph"` and `accessibilityLabel="Metric units: Meters, Celsius, km/h"`.
**WCAG:** 4.1.2 (Name, Role, Value)

### 7. [HIERARCHY] Lines 337-343: Missing semantic heading structure
```tsx
<Text style={[styles.title, { color: colors.textPrimary }]}>
  Setup
</Text>
```
**Issue:** Page title is not marked as a heading for screen readers. Missing `accessibilityRole="header"`.
**Fix:** Add `accessibilityRole="header"` to the title Text component.
**WCAG:** 1.3.1 (Info and Relationships)

### 8. [A11Y] Line 524: Premium card Pressable has no onPress handler
```tsx
<Pressable
  style={[styles.premiumCard, {...}]}
  accessibilityRole="button"
  accessibilityLabel="Upgrade to Premium"
>
```
**Issue:** Pressable with button role but no `onPress` handler - non-functional interactive element.
**Fix:** Add `onPress` handler or change to `View` if not yet implemented.
**WCAG:** 2.1.1 (Keyboard)

---

## MODERATE (6 issues)

### 9. [SPACING] Line 592-593: Magic numbers in scrollContent padding
```tsx
scrollContent: {
  paddingHorizontal: 16,  // Should use tokens.spacing.md
  paddingTop: 8,          // Should use tokens.spacing.sm
},
```
**Issue:** Hardcoded spacing values instead of design tokens.
**Fix:** Use `paddingHorizontal: tokens.spacing.md` and `paddingTop: tokens.spacing.sm`.

### 10. [SPACING] Lines 596-598, 608-609: Magic numbers throughout styles
```tsx
header: { marginBottom: 24 },      // tokens.spacing.lg
subtitle: { fontSize: 16, marginTop: 4 },  // tokens.fontSize.base, tokens.spacing.xs
```
**Multiple locations with hardcoded values:**
- Line 598: `marginBottom: 24` → `tokens.spacing.lg`
- Line 609: `marginTop: 4` → `tokens.spacing.xs`
- Line 617: `marginBottom: 8` → `tokens.spacing.sm`
- Line 618: `marginTop: 24` → `tokens.spacing.lg`
- Line 619: `paddingHorizontal: 4` → `tokens.spacing.xs`
- Line 643: `paddingVertical: 14` → Not on scale (should be 12 or 16)
- Line 644: `paddingHorizontal: 16` → `tokens.spacing.md`
- Line 651: `gap: 12` → `tokens.spacing.base`
- Line 669: `gap: 8` → `tokens.spacing.sm`
- Line 681-682: `paddingVertical: 12, paddingHorizontal: 16`
- Line 697: `marginTop: 2` → Not on scale
- Line 703: `gap: 8` → `tokens.spacing.sm`
- Line 714: `padding: 24` → `tokens.spacing.lg`
- Line 725: `padding: 16` → `tokens.spacing.md`
- Line 729: `gap: 10` → Not on scale (should be 8 or 12)
- Line 737: `gap: 8` → `tokens.spacing.sm`
- Line 738: `paddingVertical: 12` → `tokens.spacing.base`
- Line 751-753: `padding: 12, gap: 10`
- Line 758: `paddingVertical: 16` → `tokens.spacing.md`
- Line 770: `marginTop: 4` → `tokens.spacing.xs`
- Line 778: `padding: 16` → `tokens.spacing.md`
- Line 786: `gap: 12` → `tokens.spacing.base`
- Line 796: `marginTop: 2` → Not on scale
- Line 802: `marginTop: 32` → `tokens.spacing.xl`
- Line 803: `marginBottom: 16` → `tokens.spacing.md`

### 11. [SPACING] Lines 729, 752: Non-standard gap values
```tsx
themeSelector: { gap: 10 },   // ❌ Not on 4/8/12/16 scale
unitSelector: { gap: 10 },    // ❌ Not on 4/8/12/16 scale
```
**Issue:** Gap value 10 is not on the design system spacing scale (4, 8, 12, 16, 24, 32, 48).
**Fix:** Use `gap: tokens.spacing.sm` (8) or `gap: tokens.spacing.base` (12).

### 12. [TYPOGRAPHY] Lines 600-604, 621-624: Magic numbers in typography
```tsx
title: {
  fontSize: 32,              // Should use tokens.fontSize['4xl'] (36) or define new token
  fontWeight: '700',         // Should use tokens.fontWeight.bold
  letterSpacing: -0.5,       // Should use tokens.letterSpacing.tight
},
sectionTitle: {
  fontSize: 12,              // tokens.fontSize.xs
  fontWeight: '600',         // tokens.fontWeight.semibold
  letterSpacing: 1,          // tokens.letterSpacing.wider
},
```
**Issue:** Hardcoded typography values instead of design tokens.
**Fix:** Replace with token references.

### 13. [BORDER] Lines 634, 740, 760, 780: Inconsistent borderRadius values
```tsx
section: { borderRadius: 16 },      // tokens.borderRadius.xl
themeOption: { borderRadius: 12 },  // tokens.borderRadius.lg
unitOption: { borderRadius: 12 },   // tokens.borderRadius.lg
premiumCard: { borderRadius: 16 },  // tokens.borderRadius.xl
```
**Issue:** Hardcoded border radius values. While consistent, should use tokens for maintainability.
**Fix:** Use `tokens.borderRadius.xl` (16) and `tokens.borderRadius.lg` (12).

### 14. [BORDER] Lines 740, 760, 780: Inconsistent borderWidth
```tsx
themeOption: { borderWidth: 1.5 },
unitOption: { borderWidth: 1.5 },
premiumCard: { borderWidth: 1.5 },
```
**Issue:** Border width 1.5 should use `tokens.borderWidth.medium` for consistency.
**Fix:** Use `tokens.borderWidth.medium` (1.5).

---

## VISUAL DESIGN OBSERVATIONS

### Positive Patterns
- ✅ Good use of semantic color tokens from theme (`colors.brand`, `colors.textPrimary`, etc.)
- ✅ Proper use of `memo` for sub-components (performance optimization)
- ✅ Haptic feedback on interactions
- ✅ FadeIn/FadeInDown animations for visual polish
- ✅ Section grouping with clear visual hierarchy

### Areas for Enhancement
- ⚠️ Title font size 32 is between scale values (30 and 36) - consider using `fontSize['3xl']` (30) or `fontSize['4xl']` (36)
- ⚠️ No loading/empty states for clubs list (only empty state handled)
- ⚠️ paddingVertical: 14 is not on the spacing scale (12 or 16 would be)
- ⚠️ marginTop: 2 appears twice - not on scale, consider 4 (xs)

---

```
═══════════════════════════════════════════════════════════════════════════════
SUMMARY: 3 critical, 5 serious, 6 moderate = 14 total issues
Score: 68/100
═══════════════════════════════════════════════════════════════════════════════
```

## Priority Matrix

| Priority | Issue | Impact |
|----------|-------|--------|
| P0 | Switch components missing a11y labels | Screen reader users cannot identify switches |
| P0 | ClubRow buttons below touch target | Usability, especially with gloves |
| P0 | SectionHeader action missing a11y label | Screen reader navigation |
| P1 | Theme/Unit selectors missing a11y labels | Radio button identification |
| P1 | Premium card non-functional | Dead interactive element |
| P1 | Missing heading role on title | Screen reader navigation |
| P2 | Hardcoded spacing values | Maintainability, consistency |
| P2 | Non-standard gap values | Design system compliance |
| P2 | Hardcoded typography | Maintainability |

---

## Recommended Fixes Summary

### Critical Fixes (Must Do)
1. Add `accessibilityLabel` to all Switch components
2. Add `accessibilityRole="button"` to ClubRow action buttons
3. Increase club action button size from 36x36 to 44x44
4. Add `accessibilityLabel={action}` to SectionHeader action

### Serious Fixes (Should Do)
5. Add `accessibilityLabel` to ThemeSelector options
6. Add `accessibilityLabel` to unit selector options
7. Add `accessibilityRole="header"` to page title
8. Add `onPress` handler to Premium card or make it non-interactive

### Moderate Fixes (Consider)
9. Replace all hardcoded spacing with token references
10. Replace all hardcoded typography with token references
11. Standardize gap values to design scale (8 or 12)
12. Use token references for borderRadius and borderWidth

---

*Review generated: 2026-01-13*
*Reviewer: RAMS (Accessibility & Visual Design)*
