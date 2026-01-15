# Optimal Wind Screen Plan (Evidence‑Verified)

## Verification Summary

**Files reviewed directly:**
- `app/(tabs-redesign)/wind.tsx`
- `app/(tabs-redesign)/index.tsx`
- `src/components/redesign/ResultCard.tsx`
- `src/features/wind/hooks/useWindCalculator.ts`
- `src/features/wind/components/compass/LockButton.tsx`

**Secondary review:** critic droid report (risks + confirmations).

---

## Evidence‑Based Findings (No Assumptions)

### 1. Yardage “.” Bug – Falsy Handling
**Evidence:** `app/(tabs-redesign)/index.tsx` uses:

```tsx
primaryValue={String(calculationResult.playsLike || targetDistance)}
```

`||` treats `0` as falsy; during transient states this can render unexpected output. The nullish fix is deterministic.

### 2. Auto‑Calculation in Wind Screen
**Evidence:** `app/(tabs-redesign)/wind.tsx` auto‑calculates in a `useEffect` tied to `relativeWindAngle`, `targetDistance`, and `effectiveWindSpeed`.

```tsx
React.useEffect(() => {
  if (conditionsWindSpeed !== undefined) {
    triggerCalculation();
  }
}, [targetDistance, effectiveWindSpeed, relativeWindAngle, isLocked, triggerCalculation, conditionsWindSpeed, conditionsWindDirection]);
```

This removes explicit user control and recalculates continuously when heading changes.

### 3. Lock Button Placement
**Evidence:** `src/features/wind/components/compass/LockButton.tsx` is rendered inside the compass component and positioned relative to the compass, not the screen edge.

### 4. Wind Info Row
**Evidence:** `app/(tabs-redesign)/wind.tsx` shows wind info as horizontal MetricPills inside a horizontal ScrollView.

### 5. ResultCard `minimumFontScale=0.5`
**Evidence:** `src/components/redesign/ResultCard.tsx` uses:

```tsx
minimumFontScale={0.5}
```

This is present but not confirmed as the root cause of the “.” bug; the falsy handling is confirmed in Shot screen.

---

## Optimal UX Plan (Golfer‑First)

### Core Principles
- **Two‑tap flow:** Lock → Calculate.
- **One‑handed:** Lock + Calculate live in a bottom action bar (natural thumb zone).
- **Single focus after calculation:** Full‑screen results mode.

### Layout (Compass/Input Mode)
1. **Hero Compass** (large, centered).
2. **Distance Slider + ±1 yd buttons** (fast + precise).
3. **Wind Info Row (3 items only):**
   - Constant wind speed
   - Gust (if higher than constant)
   - Direction (cardinal + degrees)
4. **Manual Input** (collapsed by default).
5. **Bottom Action Bar** (always visible, thumb zone):
   - **Lock** (left/right based on dominant hand)
   - **Calculate** (full‑width, disabled until locked)

### Results Mode (Full‑Screen, Single Focus)
After Calculate, **results take over the entire screen**. Only results + one action remain visible.

**Contents:**
- **Steady wind result card** (plays‑like, club, aim, wind/env/total).
- **Gust result card** (only if gust > steady).
- **Back/Recalculate** button to return to compass mode.

---

## Full‑Screen Results Animation Spec

**State:**
```ts
type WindViewState = 'compass' | 'results';
```

**Animation:**
- **Calculate:** slide results up + fade in; compass fades out.
- **Back:** slide results down + fade out; compass fades in.

**Implementation (reanimated):**
```ts
const slideOffset = useSharedValue(0); // 0 = compass, 1 = results

const compassStyle = useAnimatedStyle(() => ({
  transform: [{ translateY: interpolate(slideOffset.value, [0, 1], [0, -screenHeight]) }],
  opacity: interpolate(slideOffset.value, [0, 0.4], [1, 0]),
}));

const resultsStyle = useAnimatedStyle(() => ({
  transform: [{ translateY: interpolate(slideOffset.value, [0, 1], [screenHeight, 0]) }],
  opacity: interpolate(slideOffset.value, [0.6, 1], [0, 1]),
}));
```

---

## Manual Input (Collapsed)

- Toggle labeled **“Edit manually”**.
- Fields: wind speed override, wind direction override.
- Collapses after successful calculation.

---

## Implementation Checklist (Ordered)

1. Fix yardage “.” bug in Shot screen (`||` → `??`).
2. Remove auto‑calc and add explicit **Calculate** button in wind screen.
3. Move lock into bottom action bar (left/right based on dominant hand).
4. Add ±1 yard stepper buttons alongside the slider.
5. Simplify wind info row to 3 items only.
6. Implement full‑screen results mode with slide/fade transition.
7. Compute and render **steady + gust** results when gust differs.
8. Add collapsed manual input section for overrides.

---

## Notes

- No changes to `docs/ccplan.md` (per request).
- If dot issue persists after nullish fix, reassess `minimumFontScale` as a secondary mitigation.
