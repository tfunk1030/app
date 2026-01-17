# UI-003 GPT Cross-Review: StatsScreen.tsx

**Component:** `src/features/redesign/screens/StatsScreen.tsx`
**Date:** 2026-01-13
**Phase:** 2 - GPT Cross-Review
**Purpose:** Validate RAMS findings + identify blind spots

---

## RAMS Findings Validation

### Confirmed Issues

| RAMS Finding | GPT Assessment | Priority |
|--------------|----------------|----------|
| Tab container missing tablist role | **VALID** - Critical for screen reader navigation | P0 |
| Page title missing header role | **VALID** - Standard heading practice | P1 |
| Tab buttons missing accessibilityLabel | **VALID** - Helps clarity | P1 |
| Premium banner no onPress | **VALID** - Broken affordance | P1 |
| ClubPerformanceRow missing accessibility | **VALID** - Data rows need context | P1 |
| Tab buttons below touch target | **VALID** - 34dp too small | P1 |
| GlassCard accessibility | **VALID** - Related component issue | P1 |

### Over-Prioritized (Suggest Downgrade)

| RAMS Finding | GPT Assessment |
|--------------|----------------|
| Empty state icon accessibility | Could be P3 - decorative, hidden by context |
| CARD_GAP off scale | P3 - Minor visual, 10 vs 12 negligible |

---

## Blind Spots Found

### 1. Tab Panel Content Association (P1)
**Issue:** Tab content areas are not associated with their tabs via ARIA patterns.
**Current:** Content just conditionally renders, no `aria-labelledby` or `id` linkage.
**Impact:** Screen readers announce tab but not what content region it controls.
**Recommended Fix:**
```tsx
// Tab button
<Pressable
  accessibilityRole="tab"
  nativeID={`tab-${tab}`}
  accessibilityControls={`tabpanel-${tab}`}
  ...
>

// Tab panel
<Animated.View
  nativeID={`tabpanel-${tab}`}
  accessibilityLabelledBy={`tab-${tab}`}
  accessibilityRole="tabpanel"
>
```

### 2. Reduced Motion Not Respected (P1)
**Issue:** Uses FadeIn, FadeInDown animations without checking `reduceMotion` preference.
**Current:**
```tsx
<Animated.View entering={FadeIn} style={styles.bentoGrid}>
<Animated.View entering={FadeInDown.delay(200)}>
```
**Impact:** Users with motion sensitivity may be affected.
**Recommended Fix:**
```tsx
import { useReducedMotion } from 'react-native-reanimated';

const reduceMotion = useReducedMotion();
const enterAnimation = reduceMotion ? undefined : FadeIn;
```

### 3. Trend Icons Missing Text Alternatives (P1)
**Issue:** TrendingUp/TrendingDown icons convey meaning but have no text description.
**Location:** Lines 145-152, 319-320, etc.
**Impact:** Screen readers only get the trendValue number, not the direction meaning.
**Recommended Fix:**
```tsx
{trendValue && TrendIcon && (
  <View style={styles.trendContainer} accessibilityLabel={`Trend ${trend}: ${trendValue}`}>
    <TrendIcon size={12} color={getTrendColor()} accessibilityElementsHidden={true} />
    <Text style={[styles.trendValue, { color: getTrendColor() }]}>
      {trendValue}
    </Text>
  </View>
)}
```

### 4. Club Data as Table (P2)
**Issue:** ClubPerformanceRow data is tabular but not structured semantically.
**Impact:** Data relationships (column headers to values) not conveyed.
**Note:** React Native doesn't have table roles, so using accessibilityLabel per row is acceptable (as RAMS suggested). Consider adding column context.
**Enhanced Fix:**
```tsx
accessibilityLabel={`${club.name}: Average distance ${club.avgDistance} yards, Accuracy ${club.accuracy} percent, from ${club.uses} shots`}
```

### 5. Decorative Chart Icon (P2)
**Location:** Line 390
**Issue:** BarChart3 icon in clubs header is decorative, should be hidden.
**Fix:**
```tsx
<BarChart3 size={20} color={colors.textMuted} accessibilityElementsHidden={true} importantForAccessibility="no" />
```

### 6. Missing Loading/Error States (P2)
**Issue:** Component shows mock data with no loading or error states.
**Impact:** Production code will need these; accessibility should be considered now.
**Note:** For now, this is informational. Add states when real data integration happens.

---

## Golf-Specific Analysis

### Outdoor Readability Deep Dive

| Element | Current Size | Recommended | Priority |
|---------|--------------|-------------|----------|
| Tab text | 14px | 16px (OK for touch, larger better) | P2 |
| StatCard title | 13px | 14px minimum | P2 |
| StatCard subtitle | 13px | 14px minimum | P2 |
| Trend value | 12px | 14px minimum | P2 |
| Club stat label | 11px | 13px minimum | P2 |
| Club uses text | 13px | 14px | P3 |

**Outdoor Typography Rule:** In bright sunlight, anything under 14px becomes hard to read. Golf apps should target 14px minimum for all non-auxiliary text.

### One-Hand Thumb Zone Analysis

```
  ┌─────────────────────┐
  │     Stats Title     │  ← OK (view only)
  │  ┌─────┬─────┬────┐ │
  │  │ O   │ C   │ R  │ │  ← CONCERN: Tabs at top require reach
  │  └─────┴─────┴────┘ │
  │  ┌─────────────────┐│
  │  │  Large StatCard ││  ← OK (large touch target)
  │  └─────────────────┘│
  │  ┌──────┐ ┌──────┐  │
  │  │ Sm   │ │ Sm   │  │  ← OK (adequate size)
  │  └──────┘ └──────┘  │
  │  ┌─────────────────┐│
  │  │  Premium Banner ││  ← OK (large touch target)
  │  └─────────────────┘│
  └─────────────────────┘
```

**Verdict:** Tabs at top require stretch but are acceptable for navigation. Primary content (stat cards) are in comfortable zone.

### Glance-Friendly Analysis

| Element | Glanceable? | Notes |
|---------|-------------|-------|
| Overall Score (76.2) | YES | Large 40px font, prominent |
| Small stat values | YES | 28px font is readable |
| Trend indicators | PARTIAL | Small (12px) + icon only |
| Club row data | PARTIAL | Values good, labels small |

**Recommendation:** Increase trend value size to 14px for quick glancing.

---

## Consolidated Priority List

### P0 - Critical (1)
1. Tab container missing tablist role *(RAMS)*

### P1 - High (9)
2. Page title missing header role *(RAMS)*
3. Tab buttons missing accessibilityLabel *(RAMS)*
4. Premium banner no onPress *(RAMS)*
5. ClubPerformanceRow accessibility *(RAMS)*
6. Tab buttons below touch target *(RAMS)*
7. Tab panel content association *(NEW)*
8. Reduced motion not respected *(NEW)*
9. Trend icons missing text alternatives *(NEW)*
10. GlassCard accessibility *(RAMS - defer to component PR)*

### P2 - Medium (6)
11. Decorative chart icon *(NEW)*
12. ViewAllButton hitSlop *(RAMS)*
13. Normalize spacing values *(RAMS)*
14. Small typography for outdoor use *(RAMS)*
15. Empty state icon *(RAMS - downgraded)*
16. CARD_GAP normalization *(RAMS - downgraded)*

---

## Implementation Recommendations

### Quick Wins (< 5 minutes each)
1. Add tablist role
2. Add header role to title
3. Add accessibilityLabel to tabs
4. Add onPress to premium banner
5. Hide decorative chart icon

### Moderate Effort (5-15 minutes each)
1. Fix tab touch targets (increase padding)
2. Add accessibility to ClubPerformanceRow
3. Add reduced motion check
4. Fix trend icon accessibility

### Deferred (Separate PR)
1. GlassCard accessibility props - affects shared component
2. Full typography scale audit - needs design input

---

*GPT Cross-Review completed: 2026-01-13*
*Next: Phase 3 - Skills Synthesis*
