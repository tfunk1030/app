# Optimal Wind Calculator Design (Research-Verified)

## Research Sources

| Source | Key Finding |
|--------|-------------|
| [Smashing Magazine - Thumb Zone](https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/) | 75% of mobile interactions are thumb-driven |
| [Medium - Mobile UX 2025](https://medium.com/design-bootcamp/the-thumb-zone-ux-in-2025) | Place key interactive elements in lower half of screen |
| Apple HIG | 44dp minimum touch target |
| Material Design | 48dp minimum touch target |
| WCAG AAA | 44px minimum touch target |

---

## DRD.md Analysis

| Spec | DRD Said | Research Says | Winner |
|------|----------|---------------|--------|
| Lock position | Mid-screen edge | Bottom thumb zone | **Research** |
| Lock size | 64dp fixed | 56dp sufficient | 56dp (exceeds all guidelines) |
| Compass size | 240-280px fixed | 180-280px adaptive | **Adaptive** (fits small phones) |
| Distance input | +/- only | Presets + +/- | **Hybrid** (presets faster) |

**Kept from DRD:**
- Calculate disabled until locked
- Dual wind results (steady + gust)
- Wind info row: cardinal + degrees
- Manual override collapsed by default

---

## Optimal Layout (Top → Bottom)

```
┌─────────────────────────────────────────┐
│  Wind Calculator                        │
│  12 mph from NE (45°) • Gusts 18 mph    │
├─────────────────────────────────────────┤
│                                         │
│      ┌─────────────────────┐            │
│      │                     │            │
│      │   COMPASS (adaptive)│            │
│      │    180-280px        │            │
│      └─────────────────────┘            │
│                                         │
│  ┌─ Wind Info Row ──────────────────┐   │
│  │ Wind: 12 mph │ Gust: 18 │ NE(45°)│   │
│  └──────────────────────────────────┘   │
│                                         │
│  [100] [125] [150] [175] [200]          │  ← Quick presets
│  Target: [─] 150 [+]                    │  ← +/- fine-tune
│                                         │
│  ▼ Edit manually (collapsed)            │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │ [🔒]              [ CALCULATE ]  │   │  ← BOTTOM THUMB ZONE
│  │ 56dp              flex-1         │   │
│  └──────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

## Why Bottom Thumb Zone?

From Smashing Magazine research:

```
┌─────────────────────┐
│  HARD TO REACH      │  ← Top corners (avoid primary actions)
│                     │
│     STRETCH         │  ← Mid-screen edges (DRD's lock position)
│                     │
│  ═══ NATURAL ═══    │  ← Bottom center (optimal for Lock + Calculate)
└─────────────────────┘
```

**DRD's mid-screen edge lock button is in the "Stretch Zone"** - users must awkwardly reach with their thumb. Bottom placement is the "Natural Zone" - comfortable one-handed operation.

---

## Touch Target Sizes

| Element | Size | Guideline | Status |
|---------|------|-----------|--------|
| Lock button | 56dp | 44-48dp min | ✓ Exceeds |
| Calculate button | 56dp height | 44-48dp min | ✓ Exceeds |
| +/- steppers | 48dp | 48dp min | ✓ Meets |
| Quick presets | 44dp | 44dp min | ✓ Meets |

---

## Handedness Support

```typescript
// Right-handed (default): Lock on RIGHT side of action bar
// Left-handed: Lock on LEFT side of action bar

<View style={styles.bottomActionBar}>
  <Pressable style={{ order: isLeftHanded ? 0 : 1 }}>
    <Lock />
  </Pressable>
  <Pressable style={{ flex: 1, order: isLeftHanded ? 1 : 0 }}>
    CALCULATE
  </Pressable>
</View>
```

---

## Results View

After Calculate → Results slide up from bottom:

```
┌─────────────────────────────────────────┐
│  Wind Calculator                    [↓] │
├─────────────────────────────────────────┤
│                                         │
│  ┌─ STEADY WIND (12 mph) ───────────┐   │
│  │  PLAYS LIKE: 158 yds             │   │
│  │  Club: 7-Iron • Aim 8 yds LEFT   │   │
│  │  Wind: +5 • Env: +3 • Total: +8  │   │
│  └──────────────────────────────────┘   │
│                                         │
│  ┌─ WITH GUSTS (18 mph) ────────────┐   │
│  │  PLAYS LIKE: 162 yds             │   │
│  │  Club: 6-Iron • Aim 12 yds LEFT  │   │
│  │  Wind: +9 • Env: +3 • Total: +12 │   │
│  └──────────────────────────────────┘   │
│                                         │
│  💡 Steady for controlled shots,        │
│     Gust for full swings                │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │ [🔒]           [ RECALCULATE ]   │   │
│  └──────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

## Implementation Files

| File | Change |
|------|--------|
| `src/components/redesign/ResultCard.tsx:145` | `minimumFontScale={0.5}` → `0.8` |
| `app/(tabs-redesign)/index.tsx:334` | `\|\|` → `??` |
| `app/(tabs-redesign)/wind.tsx` | Full redesign per this spec |
| `src/core/context/settings.tsx` | Add `dominantHand` setting |

---

## Summary

**User asked for "thumb target area"** - research confirms bottom of screen is optimal.

**DRD specified mid-screen edge** - research shows this is "Stretch Zone" (uncomfortable).

**This design prioritizes:**
1. One-handed golf course operation
2. Quick glances in bright sunlight
3. Both wind scenarios visible (no guessing)
4. Minimal taps to get result
