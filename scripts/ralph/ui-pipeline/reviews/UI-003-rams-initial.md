# UI-003 RAMS Initial Review: StatsScreen.tsx

**Component:** `src/features/redesign/screens/StatsScreen.tsx`
**Date:** 2026-01-13
**Phase:** 1 - RAMS Review
**Reviewer:** RAMS (Accessibility & Design System Analysis)

---

## Executive Summary

StatsScreen displays performance analytics with a bento grid layout. Good use of memo() and proper component structure, but has several accessibility gaps around tab navigation, missing semantic roles, and touch target sizing.

**Initial Score:** 72/100

---

## Issues Found

### P0 - Critical (1 issue)

#### 1. Tab Container Missing TabList Role
**Location:** Line 271
**Issue:** Tab selector container lacks `accessibilityRole="tablist"` for proper screen reader grouping.
**Impact:** Screen readers cannot identify the grouped tabs as a navigation pattern.
**Fix:**
```tsx
<View
  style={[styles.tabSelector, { backgroundColor: colors.surface }]}
  accessibilityRole="tablist"
  accessibilityLabel="Stats navigation"
>
```

---

### P1 - Serious (6 issues)

#### 2. Page Title Missing Header Role
**Location:** Lines 262-264
**Issue:** Title "Stats" lacks `accessibilityRole="header"`.
**Fix:**
```tsx
<Text
  style={[styles.title, { color: colors.textPrimary }]}
  accessibilityRole="header"
>
  Stats
</Text>
```

#### 3. Tab Buttons Missing Explicit accessibilityLabel
**Location:** Lines 273-294
**Issue:** Tabs have `accessibilityRole="tab"` but rely on text content for announcement. Should have explicit labels.
**Fix:**
```tsx
<Pressable
  key={tab}
  onPress={() => setSelectedTab(tab)}
  style={...}
  accessibilityRole="tab"
  accessibilityState={{ selected: selectedTab === tab }}
  accessibilityLabel={`${tab.charAt(0).toUpperCase() + tab.slice(1)} tab`}
>
```

#### 4. Premium Banner Missing onPress Handler
**Location:** Lines 352-375
**Issue:** Pressable with `accessibilityRole="button"` but no `onPress` handler = broken affordance.
**Impact:** Users can't interact with the premium upsell; frustrating UX pattern.
**Fix:**
```tsx
<Pressable
  style={...}
  accessibilityRole="button"
  accessibilityLabel="Unlock Strokes Gained Analysis with Premium"
  onPress={() => Alert.alert('Premium', 'Unlock Strokes Gained with Premium!')}
>
```

#### 5. ClubPerformanceRow Missing Accessibility Description
**Location:** Lines 186-237
**Issue:** Each club row has no `accessibilityLabel` to describe the full context.
**Impact:** Screen reader users must navigate through each element to understand the data.
**Fix:**
```tsx
<View
  style={[styles.clubRow, { borderBottomColor: colors.divider }]}
  accessibilityLabel={`${club.name}: ${club.avgDistance} yards average, ${club.accuracy}% accuracy, ${club.uses} shots`}
  accessibilityRole="text"
>
```

#### 6. Tab Buttons Below Touch Target Minimum
**Location:** Lines 472-477
**Issue:** `paddingVertical: 10` creates tabs ~34dp tall, below 44dp minimum.
**Impact:** Difficult to tap accurately, especially with gloves or in motion.
**Fix:**
```tsx
tab: {
  flex: 1,
  paddingVertical: 14,  // Increased from 10
  minHeight: 44,         // Explicit minimum
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center',
},
```

#### 7. GlassCard Missing Accessibility Props (Related File)
**Location:** `src/core/components/ui/GlassCard.tsx` lines 201-218
**Issue:** When `onPress` is provided, AnimatedPressable lacks accessibility props.
**Impact:** Interactive GlassCards are not announced properly to screen readers.
**Fix:**
```tsx
<AnimatedPressable
  onPress={onPress}
  onPressIn={handlePressIn}
  onPressOut={handlePressOut}
  disabled={disabled}
  accessibilityRole="button"
  accessibilityLabel={/* should be passed as prop */}
  style={...}
>
```
**Note:** This requires adding an `accessibilityLabel` prop to GlassCardProps.

---

### P2 - Moderate (5 issues)

#### 8. Empty State Icon Missing Accessibility Handling
**Location:** Line 416
**Issue:** Large decorative icon should be hidden from accessibility tree.
**Fix:**
```tsx
<Clock size={48} color={colors.textMuted} accessibilityElementsHidden={true} importantForAccessibility="no" />
```

#### 9. ViewAllButton Missing hitSlop
**Location:** Lines 397-406
**Issue:** Button lacks hitSlop for easier touch.
**Fix:**
```tsx
<Pressable
  style={[styles.viewAllButton, { borderColor: colors.border }]}
  accessibilityRole="button"
  accessibilityLabel="View all clubs"
  hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
>
```

#### 10. CARD_GAP Off Design Scale
**Location:** Line 436
**Issue:** `const CARD_GAP = 10;` not on spacing scale (4/8/12/16/24/32/48).
**Fix:**
```tsx
const CARD_GAP = 12; // or 8
```

#### 11. Multiple Hardcoded Spacing Values
**Locations:**
| Line | Current | Should Be |
|------|---------|-----------|
| 450 | `marginBottom: 20` | `marginBottom: 24` |
| 621 | `paddingVertical: 14` | `paddingVertical: 12` or `16` |
| 637 | `marginTop: 2` | `marginTop: 4` |
| 655 | `marginTop: 2` | `marginTop: 4` |

#### 12. Small Typography for Outdoor Use
**Locations:**
| Line | Size | Concern |
|------|------|---------|
| 527 | 13px | Small for sunlight |
| 551-553 | 13px | Small for sunlight |
| 562 | 12px | Very small |
| 654 | 11px | Very small |

**Note:** Golf apps need larger text for outdoor visibility. Consider 14px minimum for secondary text, 12px only for truly auxiliary info.

---

## Positive Patterns Found

1. **Good memo() usage** - StatCard and ClubPerformanceRow properly memoized
2. **StatCard has proper accessibility** - When pressable, has accessibilityRole and accessibilityLabel
3. **Tab state management** - Proper accessibilityState for selected tabs
4. **StyleSheet.create()** - Proper style definition
5. **Responsive layout** - Uses Dimensions for calculations

---

## Golf-Specific Observations

| Requirement | Status | Notes |
|-------------|--------|-------|
| Touch targets 44dp+ | PARTIAL | Tabs too small, cards OK |
| Glove-friendly interactions | PARTIAL | Tab sizing issue |
| One-hand operation | GOOD | Content scrollable |
| Outdoor readability | NEEDS WORK | Several small font sizes |
| Glanceable stats | GOOD | Large value numbers in StatCard |

---

## Related Files Review

### GlassCard.tsx
- **Issue:** Missing accessibility props on interactive variant
- **Priority:** P1 - affects reusable component

### MetricTile.tsx
- **Status:** GOOD - Has proper accessibility handling
- Lines 292-297: Properly sets accessibilityLabel and accessibilityRole when onPress exists

---

## Recommended Fix Order

1. **P0:** Add tablist role to tab container
2. **P1:** Add header role to title
3. **P1:** Add accessibilityLabel to tabs
4. **P1:** Add onPress to premium banner
5. **P1:** Add accessibility to ClubPerformanceRow
6. **P1:** Increase tab touch targets to 44dp
7. **P1:** Fix GlassCard accessibility (separate PR if needed)
8. **P2:** Add hitSlop to ViewAllButton
9. **P2:** Normalize CARD_GAP to 12
10. **P2:** Normalize other spacing values

---

## Score Breakdown

| Category | Score | Notes |
|----------|-------|-------|
| Accessibility | 14/25 | Missing roles, labels, touch targets |
| Touch Targets | 16/20 | Tabs too small |
| Design Tokens | 15/20 | Multiple off-scale values |
| Golf-Specific | 12/15 | Typography too small |
| Code Quality | 15/20 | Good structure, minor issues |
| **Total** | **72/100** | |

---

*RAMS Review completed: 2026-01-13*
*Next: Phase 2 - GPT Cross-Review*
