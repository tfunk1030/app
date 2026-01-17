# Wind Screen UX Redesign - Implementation Plan

**Spec:** `thoughts/shared/specs/2026-01-15-wind-screen-ux-redesign.md`
**Created:** 2026-01-15
**Estimated Total Effort:** Medium (8-12 hours)

---

## Overview

This plan transforms the Wind Calculator screen from a cluttered, multi-step flow into a streamlined, one-handed experience with arrow-based wind visualization. The redesign prioritizes instant wind awareness, responsive layouts, and clear visual hierarchy.

### Key Deliverables
1. Arrow-based wind visualization with crosswind indicator
2. Responsive layout with height breakpoints
3. Overlap fixes for lock button and cardinal directions
4. Bottom-positioned controls for thumb-reach
5. Inline results (no separate screen transition)
6. Accessibility and sensor reliability UX

---

## Phase 1: Foundation - Responsive Layout System

**Goal:** Establish the responsive infrastructure before UI changes.

### Task 1.1: Extend responsive utilities with height breakpoints
- [ ] **File:** `src/utils/responsive.ts` (MODIFY)
- **Changes:**
  - Add `getLayoutMode(screenHeight)` function returning `'compact' | 'regular' | 'large'`
  - Add `getCompassSizeByMode(mode, screenWidth)` with max constraints
  - Add breakpoint constants: `<700pt` compact, `700-850pt` regular, `>850pt` large
- **Dependencies:** None
- **Effort:** Quick (30 min)
- **Verification:** Unit test the breakpoint logic with mock dimensions

### Task 1.2: Create WindScreen layout hook
- [ ] **File:** `src/features/wind/hooks/useWindScreenLayout.ts` (NEW)
- **Changes:**
  - Hook that combines `useWindowDimensions`, `useSafeAreaInsets`, and responsive utilities
  - Returns `{ layoutMode, compassSize, hasCompactControls, bottomBarHeight }`
  - Memoized calculations to prevent re-renders
- **Dependencies:** Task 1.1
- **Effort:** Short (45 min)
- **Verification:** Visual inspection on SE, iPhone 14, and Pro Max simulators

---

## Phase 2: Arrow-Based Wind Visualization (P0)

**Goal:** Replace text labels with intuitive arrow visualization.

### Task 2.1: Enhance WindArrow with magnitude encoding
- [ ] **File:** `src/features/wind/components/compass/WindArrow.tsx` (MODIFY)
- **Changes:**
  - Add `magnitude` prop (wind speed in mph)
  - Scale arrow length based on magnitude (0-30mph range)
  - Add opacity gradient for magnitude (stronger wind = more opaque)
  - Adjust arrowhead style for better visibility
- **Dependencies:** None
- **Effort:** Short (45 min)
- **Verification:** Verify arrow scales correctly with 5, 15, 25 mph values

### Task 2.2: Create CrosswindIndicator component
- [ ] **File:** `src/features/wind/components/compass/CrosswindIndicator.tsx` (NEW)
- **Changes:**
  - Perpendicular tick mark showing crosswind component
  - Scale based on crosswind magnitude (from `relativeWindAngle`)
  - Color coding: neutral for small, warning for significant
  - Position relative to main wind arrow
- **Dependencies:** Task 2.1
- **Effort:** Short (1 hour)
- **Verification:** VoiceOver reads crosswind direction and magnitude

### Task 2.3: Create WindMagnitudeLegend component
- [ ] **File:** `src/features/wind/components/compass/WindMagnitudeLegend.tsx` (NEW)
- **Changes:**
  - Minimal icon-based legend (arrow + wind speed)
  - Shows current wind speed value
  - Small, non-intrusive placement below compass
  - Accessibility label for the legend
- **Dependencies:** Task 2.1
- **Effort:** Quick (30 min)
- **Verification:** Visible on all screen sizes without overlap

### Task 2.4: Update WindDirectionCompass types
- [ ] **File:** `src/features/wind/components/compass/types.ts` (MODIFY)
- **Changes:**
  - Add `CrosswindIndicatorProps` interface
  - Add `WindMagnitudeLegendProps` interface
  - Update `WindArrowProps` with optional `magnitude` prop
- **Dependencies:** None
- **Effort:** Quick (15 min)

### Task 2.5: Integrate new components into WindDirectionCompass
- [ ] **File:** `src/features/wind/components/compass/WindDirectionCompass.tsx` (MODIFY)
- **Changes:**
  - Import and render CrosswindIndicator
  - Import and render WindMagnitudeLegend
  - Pass wind speed to WindArrow as magnitude
  - Remove HEADWIND/TAILWIND/CROSSWIND text label
  - Update accessibility labels for visual arrows
- **Dependencies:** Tasks 2.2, 2.3, 2.4
- **Effort:** Short (45 min)
- **Verification:** VoiceOver announces "Wind is 12 mph, 30 degrees left of target"

---

## Phase 3: Layout Restructure (P0)

**Goal:** Reorganize the screen for one-handed operation and clear hierarchy.

### Task 3.1: Fix LockButton positioning (overlap fix)
- [ ] **File:** `src/utils/responsive.ts` (MODIFY)
- **Changes:**
  - Update `getLockButtonMetrics` to position button OUTSIDE compass entirely
  - Move to ActionBar (bottom) instead of compass edge
  - Remove from `WindDirectionCompass` rendering
- **Dependencies:** Task 1.1
- **Effort:** Short (30 min)
- **Verification:** No overlap on any screen size

### Task 3.2: Move LockButton to ActionBar
- [ ] **File:** `src/features/wind/components/compass/LockButton.tsx` (MODIFY)
- **Changes:**
  - Remove absolute positioning styles
  - Make component work as inline ActionBar child
  - Update sizing for ActionBar context (56x56dp)
  - Keep haptic and accessibility behaviors
- **Dependencies:** Task 3.1
- **Effort:** Quick (30 min)

### Task 3.3: Restructure WindScreen layout
- [ ] **File:** `app/(tabs-redesign)/wind.tsx` (MODIFY)
- **Changes:**
  - **Remove:** ScrollView horizontal conditions bar (move to minimal header)
  - **Move:** Distance slider to bottom half (above ActionBar)
  - **Simplify:** Reduce card count - no separate cards for conditions
  - **Add:** InlineResult component placeholder (shows when locked)
  - **Update:** Use `useWindScreenLayout` hook for dimensions
  - **Structure:**
    ```
    SafeAreaView
    ├── HeaderSection (title only, minimal)
    ├── CompassSection (top ~55%)
    │   └── WindDirectionCompass (with new arrow viz)
    ├── DistanceSection (bottom ~30%)
    │   ├── DistanceSlider (thumb-reachable)
    │   └── InlineResult (visible when locked)
    └── ActionBar (fixed bottom)
        ├── LockButton
        └── CalculateButton
    ```
- **Dependencies:** Tasks 1.2, 3.2
- **Effort:** Medium (2 hours)
- **Verification:** Layout works on SE, standard, Pro Max without overlap

### Task 3.4: Create InlineResult component
- [ ] **File:** `src/features/wind/components/InlineResult.tsx` (NEW)
- **Changes:**
  - Shows "plays like" distance when locked
  - Expandable to show detailed breakdown
  - Uses flat MetricPill style (no GlassCard)
  - Animates in/out on lock state change
- **Dependencies:** None
- **Effort:** Short (1 hour)
- **Verification:** Result visible without scrolling on all screen sizes

### Task 3.5: Update styles for design system consistency
- [ ] **File:** `src/features/wind/components/compass/styles.ts` (MODIFY)
- **Changes:**
  - Remove any GlassCard-style gradients
  - Use flat/MetricPill style for all data containers
  - Ensure consistent border radii and spacing
- **Dependencies:** None
- **Effort:** Quick (30 min)

---

## Phase 4: Sensor Reliability UX (P1)

**Goal:** Handle sensor failures gracefully.

### Task 4.1: Create AccuracyIndicator component
- [ ] **File:** `src/features/wind/components/compass/AccuracyIndicator.tsx` (NEW)
- **Changes:**
  - Subtle visual indicator for compass reliability
  - Three states: high (hidden), medium (subtle dot), low (warning icon)
  - Position in corner of compass
  - Accessible label explaining accuracy state
- **Dependencies:** Uses `useSensorData` accuracy value
- **Effort:** Short (45 min)
- **Verification:** Indicator visible only when accuracy is medium or low

### Task 4.2: Add calibration hint UI
- [ ] **File:** `app/(tabs-redesign)/wind.tsx` (MODIFY)
- **Changes:**
  - Detect when accuracy is 'unreliable' or 'low'
  - Show dismissible banner with calibration instructions
  - "Move phone in figure-8 pattern to calibrate"
  - Auto-dismiss when accuracy improves
- **Dependencies:** Task 4.1
- **Effort:** Short (45 min)

### Task 4.3: Improve manual direction fallback
- [ ] **File:** `app/(tabs-redesign)/wind.tsx` (MODIFY)
- **Changes:**
  - When sensors unavailable, show direction picker prominently
  - Replace collapsed "Edit manually" with visible direction wheel/slider
  - Pre-populate with last known wind direction
- **Dependencies:** None
- **Effort:** Short (1 hour)

---

## Phase 5: Accessibility Polish (P1)

**Goal:** Ensure full VoiceOver support and motion preferences.

### Task 5.1: Add comprehensive accessibility labels
- [ ] **Files:** Multiple compass components (MODIFY)
  - `WindArrow.tsx`: "Wind from [direction], [speed] miles per hour"
  - `CrosswindIndicator.tsx`: "Crosswind [magnitude] yards [left/right]"
  - `InlineResult.tsx`: "Plays like [distance] [unit]"
  - `AccuracyIndicator.tsx`: "Compass accuracy: [high/medium/low]"
- **Dependencies:** Tasks 2.1, 2.2, 4.1
- **Effort:** Short (45 min)
- **Verification:** VoiceOver audit on iOS Simulator

### Task 5.2: Add haptic feedback for heading lock
- [ ] **File:** `src/features/wind/context/compass-lock.tsx` (MODIFY)
- **Changes:**
  - Add `Haptics.notificationAsync(NotificationFeedbackType.Success)` on lock
  - Add `Haptics.impactAsync(ImpactFeedbackStyle.Light)` on unlock
- **Dependencies:** None
- **Effort:** Quick (15 min)
- **Already partially implemented** - verify and enhance

### Task 5.3: Respect reduced motion preference
- [ ] **Files:**
  - `WindArrow.tsx` (MODIFY)
  - `CrosswindIndicator.tsx` (MODIFY)
  - `InlineResult.tsx` (MODIFY)
- **Changes:**
  - Use `useReducedMotion` hook from accessibility
  - Skip flowing arrow animations when reduced motion enabled
  - Use instant transitions instead of spring physics
- **Dependencies:** Existing `useReducedMotion` hook
- **Effort:** Quick (30 min)

---

## Phase 6: Inline Results Flow (P1)

**Goal:** Show calculation results without screen transition.

### Task 6.1: Modify calculate flow for inline results
- [ ] **File:** `app/(tabs-redesign)/wind.tsx` (MODIFY)
- **Changes:**
  - Remove `slideOffset` animation to separate results view
  - On calculate: populate InlineResult instead of transitioning
  - Keep full results view accessible via "See details" tap
  - Remove `viewState` toggle (always show compass view)
- **Dependencies:** Task 3.4
- **Effort:** Medium (1.5 hours)
- **Verification:** Calculate shows result inline, no screen slide

### Task 6.2: Add expandable detail view
- [ ] **File:** `src/features/wind/components/InlineResult.tsx` (MODIFY)
- **Changes:**
  - Add "See breakdown" button
  - Expand to show headwind/crosswind/environmental effects
  - Collapsible accordion behavior
  - Maintain current scroll position when expanded
- **Dependencies:** Task 6.1
- **Effort:** Short (1 hour)

---

## Phase 7: Testing and Polish (P2 - Future)

### Task 7.1: Animation polish (P2)
- [ ] **Files:** Various compass components
- **Changes:**
  - Smooth arrow transitions with spring physics
  - Lock feedback animation refinement
  - Pulse on significant wind changes
- **Dependencies:** All P0/P1 complete
- **Effort:** Short (1 hour)
- **Status:** Future - implement after core functionality stable

### Task 7.2: Gust awareness indicator (P2)
- [ ] **File:** `src/features/wind/components/compass/GustIndicator.tsx` (NEW)
- **Changes:**
  - Secondary indicator showing gust difference
  - Color-coded warning for high gusts
  - Position near wind arrow
- **Dependencies:** All P0/P1 complete
- **Effort:** Short (1 hour)
- **Status:** Future - implement based on user feedback

---

## Dependency Graph

```
Phase 1 (Foundation)
  └── 1.1 responsive utilities
       └── 1.2 layout hook
            └── Phase 3 (Layout)

Phase 2 (Arrow Viz)
  ├── 2.1 WindArrow magnitude
  │    └── 2.2 CrosswindIndicator
  │         └── 2.5 Compass integration
  ├── 2.3 Legend
  │    └── 2.5 Compass integration
  └── 2.4 Types
       └── 2.5 Compass integration

Phase 3 (Layout)
  ├── 3.1 LockButton positioning
  │    └── 3.2 LockButton ActionBar
  │         └── 3.3 Screen restructure
  ├── 3.4 InlineResult (independent)
  └── 3.5 Styles (independent)

Phase 4 (Sensor UX)
  ├── 4.1 AccuracyIndicator
  │    └── 4.2 Calibration hint
  └── 4.3 Manual fallback (independent)

Phase 5 (Accessibility)
  └── Depends on Phases 2, 3, 4 components existing

Phase 6 (Inline Results)
  └── 6.1 → 6.2 (sequential)
  └── Depends on 3.4 InlineResult
```

---

## Implementation Order (Recommended)

### Day 1 (4-5 hours)
1. Task 1.1 - Responsive utilities
2. Task 1.2 - Layout hook
3. Task 2.4 - Update types
4. Task 2.1 - WindArrow magnitude
5. Task 2.3 - Legend component

### Day 2 (4-5 hours)
1. Task 2.2 - CrosswindIndicator
2. Task 2.5 - Compass integration
3. Task 3.1 - LockButton positioning fix
4. Task 3.2 - LockButton ActionBar
5. Task 3.5 - Style consistency

### Day 3 (3-4 hours)
1. Task 3.4 - InlineResult component
2. Task 3.3 - Main screen restructure
3. Task 5.1 - Accessibility labels
4. Task 5.3 - Reduced motion

### Day 4 (2-3 hours)
1. Task 4.1 - AccuracyIndicator
2. Task 4.2 - Calibration hint
3. Task 4.3 - Manual fallback
4. Task 6.1 - Inline results flow
5. Task 6.2 - Expandable details
6. Task 5.2 - Haptic refinement

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Arrow-only ambiguity | Medium | Medium | Legend component (Task 2.3) + VoiceOver labels |
| Sensor reliability varies by device | High | Low | AccuracyIndicator + manual fallback (Phase 4) |
| Responsive breakpoints need tuning | Medium | Low | Test on real devices, not just simulators |
| InlineResult overflow on small screens | Medium | Medium | Compact mode collapses detail view |
| Animation jank during drag | Low | Medium | Use native driver for all animations |

---

## Success Criteria Checklist

- [ ] Wind direction visible instantly via arrow (no lock/calculate needed for basic awareness)
- [ ] All primary actions reachable with one thumb (bottom positioning)
- [ ] No overlapping elements on SE, iPhone 14, Pro Max
- [ ] Clear hierarchy: Wind arrow dominant, distance secondary
- [ ] VoiceOver labels for all visual indicators
- [ ] Single design language (flat/MetricPill style, no GlassCard)
- [ ] Calculate shows results inline (no screen transition for basic result)

---

## Files Summary

### New Files (6)
- `src/features/wind/hooks/useWindScreenLayout.ts`
- `src/features/wind/components/compass/CrosswindIndicator.tsx`
- `src/features/wind/components/compass/WindMagnitudeLegend.tsx`
- `src/features/wind/components/compass/AccuracyIndicator.tsx`
- `src/features/wind/components/InlineResult.tsx`
- `src/features/wind/components/compass/GustIndicator.tsx` (P2)

### Modified Files (8)
- `src/utils/responsive.ts`
- `src/features/wind/components/compass/types.ts`
- `src/features/wind/components/compass/WindArrow.tsx`
- `src/features/wind/components/compass/WindDirectionCompass.tsx`
- `src/features/wind/components/compass/LockButton.tsx`
- `src/features/wind/components/compass/styles.ts`
- `src/features/wind/context/compass-lock.tsx`
- `app/(tabs-redesign)/wind.tsx`
