# UI-004 GPT Cross-Review: Wind/Calculator Screen

**Component:** `src/features/wind/screen.tsx`
**Date:** 2026-01-13
**Phase:** 2 - GPT Cross-Review
**Purpose:** Validate RAMS findings + identify blind spots

---

## RAMS Findings Validation

### Confirmed Issues

| RAMS Finding | GPT Assessment | Priority |
|--------------|----------------|----------|
| YardagePresetButton missing accessibility | **VALID** - Critical for preset buttons | P0 |
| Premium upgrade button non-functional | **VALID** - Broken affordance | P0 |
| Title missing header role | **VALID** - Standard pattern | P1 |
| Error state icon decorative | **VALID** - Should be hidden | P1 |
| Loading state no announcement | **VALID** - Accessibility gap | P1 |
| Compass hint low contrast | **VALID** - Golf outdoor concern | P1 |
| Results section missing context | **VALID** - Needs announcement | P1 |
| Initialize icon decorative | **VALID** - Should be hidden | P1 |

### Over-Prioritized (Suggest Downgrade)

| RAMS Finding | GPT Assessment |
|--------------|----------------|
| Token arithmetic in styles | P3 - Minor maintenance concern |
| Calculate button context | P3 - Current text is clear enough |

---

## Blind Spots Found

### 1. GlassCard on Compass/Sliders Missing Accessibility (P1)
**Issue:** GlassCard wrapping compass and sliders may intercept accessibility if it becomes interactive.
**Location:** Lines 182-189, 194-204, 209-237
**Note:** Currently non-interactive, but worth monitoring. Consider adding `accessible={false}` if issues arise.

### 2. Slider Component Accessibility (P1)
**Issue:** Custom Slider component should be reviewed for proper accessibility.
**Location:** Lines 195-203, 210-218
**Impact:** Sliders are critical inputs - must have proper roles and labels.
**Recommendation:** Verify Slider component has:
- `accessibilityRole="adjustable"`
- Proper value announcements
- Touch target sizing

### 3. Premium Container Missing Role (P2)
**Location:** Line 109
**Issue:** Premium upsell container could have `accessibilityRole="alert"` or `accessibilityRole="dialog"`.
**Fix:**
```tsx
<Animated.View
  entering={headerEntering}
  style={styles.premiumContainer}
  accessibilityRole="alert"
  accessibilityLabel="Premium feature required"
>
```

### 4. Error Container Missing Role (P2)
**Location:** Line 285
**Issue:** Error state container should have accessible role.
**Fix:**
```tsx
<Animated.View
  entering={headerEntering}
  style={styles.errorContainer}
  accessibilityRole="alert"
  accessibilityLabel="Error loading wind calculator"
>
```

### 5. Presets Section Missing Group Label (P2)
**Location:** Lines 221-236
**Issue:** Yardage presets are a group but not semantically grouped.
**Fix:**
```tsx
<View
  style={[styles.presetsContainer, { borderTopColor: t.colors.border }]}
  accessibilityRole="group"
  accessibilityLabel="Quick select yardage presets"
>
```

### 6. Compass Wrapper Missing Live Region (P2)
**Issue:** When compass data updates, screen readers should be notified of significant changes.
**Location:** Line 186
**Recommendation:** Consider `accessibilityLiveRegion="polite"` for dynamic compass values.

---

## Golf-Specific Analysis

### Outdoor Sunlight Readability

| Element | Opacity/Size | Concern Level |
|---------|--------------|---------------|
| Compass hint | opacity.subtle (~0.6) | HIGH - instructional text |
| Loading pulses | surfaceAlt | LOW - visual only |
| Error text | textMuted | MEDIUM - error state |

**Recommendation:** Compass hint opacity should be at least 0.8 for outdoor golf use.

### One-Hand Operation

```
  ┌─────────────────────┐
  │   Wind Calculator   │  ← Header (OK)
  │   ┌─────────────┐   │
  │   │   Weather   │   │  ← Collapsible (OK)
  │   └─────────────┘   │
  │   ┌─────────────┐   │
  │   │   Compass   │   │  ← Central (OK)
  │   │    [Lock]   │   │  ← Lock positioned by hand!
  │   └─────────────┘   │
  │   Wind Speed: ═══   │  ← Slider (OK)
  │   Yardage: ═══════  │  ← Slider (OK)
  │   [100][125][150]   │  ← Presets (needs accessibility)
  │   ┌─────────────┐   │
  │   │ CALCULATE   │   │  ← Primary CTA at bottom (GOOD)
  │   └─────────────┘   │
  └─────────────────────┘
```

**Verdict:** Excellent layout for one-hand operation. Lock button respects dominant hand setting.

### Premium Gate UX

The premium gate is well-designed visually but:
1. Button does nothing (P0)
2. No way to dismiss or proceed
3. Consider adding "Later" or navigation option

---

## Consolidated Priority List

### P0 - Critical (2)
1. YardagePresetButton missing accessibility *(RAMS)*
2. Premium upgrade button non-functional *(RAMS)*

### P1 - High (7)
3. Title missing header role *(RAMS)*
4. Error state icon decorative *(RAMS)*
5. Loading state no announcement *(RAMS)*
6. Compass hint low contrast *(RAMS)*
7. Results section missing context *(RAMS)*
8. Initialize icon decorative *(RAMS)*
9. Slider component accessibility check *(NEW)*

### P2 - Medium (5)
10. Premium container role *(NEW)*
11. Error container role *(NEW)*
12. Presets section group label *(NEW)*
13. GlassCard accessibility monitoring *(NEW)*
14. Compass live region *(NEW)*

---

## Implementation Recommendations

### Quick Wins (< 5 minutes each)
1. Add accessibility to YardagePresetButton
2. Add onPress to premium upgrade button
3. Add header role to title
4. Hide decorative icons

### Moderate Effort (5-15 minutes each)
1. Add loading state announcement
2. Add results section announcement
3. Review Slider component accessibility
4. Increase compass hint opacity

### Deferred
1. Full GlassCard accessibility audit
2. Live region for dynamic compass values

---

*GPT Cross-Review completed: 2026-01-13*
*Next: Phase 3 - Skills Synthesis*
