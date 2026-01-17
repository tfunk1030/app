# Wind Calculator UX Redesign + Display Bug Fixes

**Research-verified design (DRD.md overrides where research contradicts)**

## Research Sources

| Source | Finding | Applied To |
|--------|---------|------------|
| Smashing Magazine - Thumb Zone | 75% thumb-driven, bottom = natural zone | Lock + Calculate at bottom |
| Apple HIG / Material Design | 44-48dp minimum touch target | 56dp exceeds guideline |
| WCAG AAA | 44px minimum | 56dp exceeds |

**DRD Overrides:**
- Lock button: DRD "mid-screen edge" → Research "bottom thumb zone" ✓
- Lock size: DRD "64dp" → Research "56dp sufficient" ✓
- Compass: DRD "240-280px fixed" → Research "180-280px adaptive" ✓

## Issues Found

### Bug 1: "." Display Issue
**Root cause**: `ResultCard.tsx:145` has `minimumFontScale={0.5}` - too aggressive, causing text to render as dots on some devices.

**Files affected**:
- `src/components/redesign/ResultCard.tsx:145`
- `app/(tabs-redesign)/index.tsx:334` (uses `||` instead of `??`)

### Bug 2: Calculate Button Missing from Wind Screen
**Root cause**: Recent changes removed the calculate button from the redesign wind screen, making it auto-calculate (which user doesn't want).

### Bug 3: Poor Wind Screen UX
**Current state**: Confusing layout with too many elements, auto-calculation, buried controls.

---

## Layout Spec (RESEARCH-VERIFIED, Top → Bottom)

```
1. Header: "Wind Calculator" + instruction line
2. Hero Compass: 180-280px (ADAPTIVE for all phone sizes)
3. Wind Info Row: constant, gust (if higher), direction (cardinal + degrees)
4. Distance Input: quick presets + numeric + +/- controls
5. Manual Override: collapsed by default
6. Bottom Action Bar (THUMB ZONE):
   - Lock Button: 56dp, handedness-aware (left/right side)
   - Calculate Button: flex-1, DISABLED until locked
7. Results Panel: slides up, shows BOTH constant + gust results
```

---

## Implementation Plan

### Phase 1: Fix Display Bugs

#### 1.1 Fix ResultCard font scaling
**File**: `src/components/redesign/ResultCard.tsx:145`
```diff
- minimumFontScale={0.5}
+ minimumFontScale={0.8}
```

#### 1.2 Fix falsy value handling
**File**: `app/(tabs-redesign)/index.tsx:334`
```diff
- primaryValue={String(calculationResult.playsLike || targetDistance)}
+ primaryValue={String(calculationResult.playsLike ?? targetDistance)}
```

---

### Phase 2: Redesign Wind Screen Layout

**File**: `app/(tabs-redesign)/wind.tsx`

#### 2.1 State Structure

```typescript
type WindViewState = 'compass' | 'results';
const [viewState, setViewState] = useState<WindViewState>('compass');

interface WindResultDisplay {
  playsLike: number;
  club: string;
  lateralAdjustment: { direction: 'left' | 'right' | 'none'; yards: number };
  windAdjustment: number;
  environmentalAdjustment: number;
  totalAdjustment: number;
}

interface DualWindResult {
  steady: WindResultDisplay;
  gust: WindResultDisplay | null;
}

const isLeftHanded = settings.dominantHand === 'left';
```

#### 2.2 Hero Compass (240-280px)

```typescript
const compassSize = Math.max(240, Math.min(280, screenHeight * 0.35));
```

#### 2.3 Distance Input (+/- Controls + Presets)

- Numeric input with +/- stepper buttons
- Quick presets: [100] [125] [150] [175] [200]
- +/- buttons minimum 48dp touch targets

#### 2.4 Wind Info Row (3 Items)

- **Wind**: constant speed
- **Gust**: only if higher than constant
- **Direction**: cardinal + degrees (e.g., "NE (45°)")

#### 2.5 Bottom Action Bar (THUMB ZONE - Research-Verified)

```typescript
// RESEARCH: 75% thumb-driven, bottom = natural zone
<View style={styles.bottomActionBar}>
  <Pressable
    style={{
      width: 56, height: 56,  // Exceeds 44-48dp guidelines
      order: isLeftHanded ? 0 : 1,  // Handedness-aware
    }}
    accessibilityState={{ selected: isLocked }}
  >
    <Lock />
  </Pressable>
  <Pressable style={{ flex: 1, height: 56 }} disabled={!isLocked}>
    CALCULATE
  </Pressable>
</View>
```

#### 2.6 Results View (Full Breakdown)

Each result (constant + gust) includes:
- Plays-like yardage
- Recommended club
- Lateral adjustment (aim direction + yards)
- Breakdown: wind, lateral, environment, total

#### 2.8 Manual Input (Collapsed by Default)

- "Edit manually" toggle
- Wind speed override input
- Wind direction override (if compass unavailable)

---

### Phase 3: Remove Auto-Calculation

Delete auto-calc useEffect (lines 256-261):
```diff
- React.useEffect(() => {
-   if (conditionsWindSpeed !== undefined) {
-     triggerCalculation();
-   }
- }, [targetDistance, effectiveWindSpeed, ...]);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/redesign/ResultCard.tsx:145` | Fix minimumFontScale 0.5 → 0.8 |
| `app/(tabs-redesign)/index.tsx:334` | Fix \|\| → ?? |
| `app/(tabs-redesign)/wind.tsx` | Major rewrite per DRD |
| `src/core/context/settings.tsx` | Add dominantHand setting |

---

## Verification Checklist

### Display Bug Fix
- [ ] Target 0 yards shows "0 yds" not "."
- [ ] ResultCard.tsx has minimumFontScale={0.8}
- [ ] index.tsx uses ?? not ||

### Wind Screen - Input Phase (RESEARCH-VERIFIED)
- [ ] Compass: 180-280px (ADAPTIVE)
- [ ] Bottom Action Bar in THUMB ZONE
- [ ] Lock button: 56dp, handedness-aware (left/right side in bar)
- [ ] Distance: quick presets + numeric + +/- controls
- [ ] Wind Info: 3 items (constant, gust if higher, direction cardinal+degrees)
- [ ] Calculate: flex-1 in bottom bar, DISABLED until locked

### Wind Screen - Results Phase
- [ ] Constant result: plays-like, club, lateral, breakdown
- [ ] Gust result: plays-like, club, lateral, breakdown (if gust > constant)
- [ ] Animation with slideOffset + withSpring

### Manual Input
- [ ] Collapsed by default
- [ ] Wind speed override
- [ ] Direction override if compass unavailable

### Run Commands
```bash
npx tsc --noEmit
npx expo lint
npx expo start
```
