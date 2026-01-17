# UI-003 Skills Synthesis: StatsScreen.tsx

**Component:** `src/features/redesign/screens/StatsScreen.tsx`
**Date:** 2026-01-13
**Phase:** 3 - Skills Synthesis
**Purpose:** Consolidate RAMS + GPT findings with React Native patterns

---

## Source Documents

1. **RAMS Review:** 12 issues (1 P0, 6 P1, 5 P2) - Score 72/100
2. **GPT Cross-Review:** +3 new P1 issues, +2 P2 issues, 2 downgrades

---

## Consolidated Issue List

### P0 - Critical (1 issue)

| # | Issue | Source | Impact |
|---|-------|--------|--------|
| 1 | Tab container missing `accessibilityRole="tablist"` | RAMS | Screen readers can't identify tabs as navigation |

### P1 - High (9 issues)

| # | Issue | Source | Impact |
|---|-------|--------|--------|
| 2 | Page title missing `accessibilityRole="header"` | RAMS | Heading structure broken |
| 3 | Tab buttons missing `accessibilityLabel` | RAMS | Clarity for screen readers |
| 4 | Premium banner has no `onPress` handler | RAMS | Broken affordance - fake button |
| 5 | ClubPerformanceRow missing accessibility description | RAMS | Data context not conveyed |
| 6 | Tab buttons below 44dp touch target | RAMS | Hard to tap with gloves |
| 7 | Tab panel content not associated with tabs | GPT | No aria linkage |
| 8 | Reduced motion preference not respected | GPT | Motion sensitivity issues |
| 9 | Trend icons lack text alternatives | GPT | Direction meaning lost |
| 10 | GlassCard missing accessibility props | RAMS | Shared component issue (defer) |

### P2 - Medium (5 issues)

| # | Issue | Source | Impact |
|---|-------|--------|--------|
| 11 | Decorative BarChart3 icon not hidden | GPT | Screen reader noise |
| 12 | ViewAllButton missing hitSlop | RAMS | Touch target edge case |
| 13 | Multiple spacing values off design scale | RAMS | Token consistency |
| 14 | Small typography for outdoor visibility | RAMS+GPT | Sunlight readability |
| 15 | Empty state icon accessibility | RAMS | Minor (decorative) |

---

## React Native Patterns Reference

### Tab Navigation Pattern
```tsx
// Container
<View accessibilityRole="tablist" accessibilityLabel="Navigation tabs">

// Tab Button
<Pressable
  accessibilityRole="tab"
  accessibilityState={{ selected: isSelected }}
  accessibilityLabel={`${label} tab`}
  nativeID={`tab-${id}`}
  style={[styles.tab, { minHeight: 44 }]}  // Ensure 44dp minimum
>

// Panel
<View
  accessibilityRole="tabpanel"
  accessibilityLabelledBy={`tab-${activeTab}`}
  nativeID={`tabpanel-${activeTab}`}
>
```

### Reduced Motion Pattern
```tsx
import { useReducedMotion } from 'react-native-reanimated';

function Component() {
  const reduceMotion = useReducedMotion();

  // Conditional animation
  const entering = reduceMotion ? undefined : FadeIn;

  return (
    <Animated.View entering={entering}>
      {/* content */}
    </Animated.View>
  );
}
```

### Data Row Accessibility Pattern
```tsx
<View
  accessibilityRole="text"
  accessibilityLabel={`${name}: ${value1} ${unit1}, ${value2} ${unit2}`}
>
  {/* Visual components */}
</View>
```

### Trend Indicator Pattern
```tsx
<View
  style={styles.trendContainer}
  accessibilityLabel={`Trend ${direction}: ${value}`}
>
  <TrendIcon
    accessibilityElementsHidden={true}
    importantForAccessibility="no"
  />
  <Text>{value}</Text>
</View>
```

---

## Implementation Priority

### Phase 1: Critical + Quick Wins (10-15 min)
1. Add `tablist` role to tab container
2. Add `header` role to title
3. Add `accessibilityLabel` to each tab button
4. Add `onPress` to premium banner
5. Hide decorative chart icon

### Phase 2: Touch Targets + Accessibility (15-20 min)
6. Increase tab padding to 44dp minimum
7. Add accessibility description to ClubPerformanceRow
8. Fix trend icon accessibility

### Phase 3: Motion + Polish (10 min)
9. Add useReducedMotion check
10. Add hitSlop to ViewAllButton
11. Add tab panel association (if time permits)

### Deferred
- GlassCard accessibility - requires separate component PR
- Typography scale audit - requires design input
- Spacing normalization - P2 polish pass

---

## Code Change Summary

| File | Changes | Lines Affected |
|------|---------|----------------|
| StatsScreen.tsx | Tab accessibility, touch targets, motion | ~30 lines |
| StatsScreen.tsx | ClubPerformanceRow accessibility | ~5 lines |
| StatsScreen.tsx | Premium banner onPress | ~3 lines |
| StatsScreen.tsx | Trend icon accessibility | ~10 lines |
| **Total** | | ~48 lines |

---

## Expected Outcome

| Metric | Before | After |
|--------|--------|-------|
| P0 Issues | 1 | 0 |
| P1 Issues | 9 | 0-1 (GlassCard deferred) |
| P2 Issues | 5 | 3 (deferred) |
| Score | 72/100 | 90+/100 |

---

*Skills Synthesis completed: 2026-01-13*
*Next: Phase 4 - Final Plan*
