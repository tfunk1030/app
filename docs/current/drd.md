# Wind Screen DRD (Design Requirements Document)

## Purpose & Goals

- Provide a fast, reliable on-course wind workflow with minimal taps.
- Enable one‑handed, glove‑friendly operation in outdoor glare.
- Replace auto‑calculation with an explicit **Calculate** action.

## Current Pain Points

- **Yardage shows "."** due to falsy/nullish handling in primary value rendering.
- **Auto‑calc on every input** creates jank and unstable results.
- **Lock control** is hard to find and not in thumb‑reach.

## User Flow (30 Seconds Max)

1. **Point phone at target** while standing over the ball.
2. **Tap LOCK** (thumb zone, screen edge) to freeze heading.
3. **Adjust distance** if needed (input + quick presets).
4. **Tap CALCULATE** for the shot adjustment.
5. **Read result** (constant + gust), then hit the shot.

## Layout Spec (Top → Bottom)

1. **Header**: “Wind Calculator” + short instruction line.
2. **Hero Compass (240–280px)**: shows phone heading + wind direction.
3. **LOCK Button**: fixed to screen edge in thumb zone.
   - Right‑handed → right edge
   - Left‑handed → left edge
   - 64x64dp minimum, distinct styling
4. **Distance Input**: numeric input + small +/- controls + quick presets.
5. **Wind Info Row (3 items)**:
   - **Wind Speed (constant)**
   - **Gust** (only if higher than constant)
   - **Direction** (cardinal + degrees)
6. **Calculate Button**: large, full‑width, disabled until locked.
7. **Results Panel** (appears after calculate):
   - **Constant Wind Result** (club, plays‑like, lateral)
   - **Gust Result** (club, plays‑like, lateral)
   - **Breakdown**: wind, lateral, environment, total

## Result Model

- **Constant wind** and **gust wind** calculated in the same action.
- Each result includes:
  - Plays‑like yardage
  - Recommended club
  - Lateral adjustment (aim direction + yards)
  - Wind adjustment
  - Environmental adjustment
  - Total adjustment

## Manual Input (Collapsed by Default)

- “Edit manually” expands to allow:
  - Wind speed override
  - Wind direction override (if compass unavailable)
- Collapse after calculation to return to clean view.

## Bug Fix Requirements

- Replace falsy `||` usage with nullish coalescing:
  - `primaryValue={String(calculationResult?.playsLike ?? targetDistance)}`

## Implementation Checklist

1. Fix yardage “.” bug on Shot + Wind screens.
2. Remove auto‑calculation and add explicit Calculate button.
3. Add dual calculation (constant + gust) with two results.
4. Move LOCK button to thumb zone edge (left/right by dominant hand).
5. Simplify wind info to 3 items (constant, gust, direction).
6. Add manual input section (collapsed by default).
