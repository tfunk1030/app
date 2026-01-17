# UI-003 Implementation Plan: StatsScreen.tsx

**Component:** `src/features/redesign/screens/StatsScreen.tsx`
**Date:** 2026-01-13
**Phase:** 4 - Final Plan
**Estimated Changes:** ~50 lines

---

## Overview

This plan addresses 10 P0/P1 issues and 2 quick P2 wins. Deferred: GlassCard (separate component), typography scale (needs design input), full spacing normalization.

---

## Section 1: Tab Container Accessibility (P0)

### 1.1 Add tablist role to container

**Location:** Line 271

**Before:**
```tsx
<View style={[styles.tabSelector, { backgroundColor: colors.surface }]}>
```

**After:**
```tsx
<View
  style={[styles.tabSelector, { backgroundColor: colors.surface }]}
  accessibilityRole="tablist"
  accessibilityLabel="Stats navigation"
>
```

---

## Section 2: Page Title Header Role (P1)

### 2.1 Add header role to title

**Location:** Lines 262-264

**Before:**
```tsx
<Text style={[styles.title, { color: colors.textPrimary }]}>
  Stats
</Text>
```

**After:**
```tsx
<Text
  style={[styles.title, { color: colors.textPrimary }]}
  accessibilityRole="header"
>
  Stats
</Text>
```

---

## Section 3: Tab Button Accessibility (P1)

### 3.1 Add accessibilityLabel to tabs

**Location:** Lines 273-294

**Before:**
```tsx
<Pressable
  key={tab}
  onPress={() => setSelectedTab(tab)}
  style={[
    styles.tab,
    selectedTab === tab && {
      backgroundColor: colors.brandMuted,
    },
  ]}
  accessibilityRole="tab"
  accessibilityState={{ selected: selectedTab === tab }}
>
```

**After:**
```tsx
<Pressable
  key={tab}
  onPress={() => setSelectedTab(tab)}
  style={[
    styles.tab,
    selectedTab === tab && {
      backgroundColor: colors.brandMuted,
    },
  ]}
  accessibilityRole="tab"
  accessibilityState={{ selected: selectedTab === tab }}
  accessibilityLabel={`${tab.charAt(0).toUpperCase() + tab.slice(1)} tab`}
>
```

### 3.2 Fix tab touch target height

**Location:** Lines 472-477

**Before:**
```tsx
tab: {
  flex: 1,
  paddingVertical: 10,
  borderRadius: 8,
  alignItems: 'center',
},
```

**After:**
```tsx
tab: {
  flex: 1,
  paddingVertical: 12,
  minHeight: 44,
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center',
},
```

---

## Section 4: Premium Banner onPress (P1)

### 4.1 Add functional onPress handler

**Location:** Lines 352-361

**Before:**
```tsx
<Pressable
  style={[
    styles.premiumBanner,
    {
      backgroundColor: colors.brandMuted,
      borderColor: colors.brand,
    },
  ]}
  accessibilityRole="button"
  accessibilityLabel="Unlock Strokes Gained Analysis with Premium"
>
```

**After:**
```tsx
<Pressable
  style={[
    styles.premiumBanner,
    {
      backgroundColor: colors.brandMuted,
      borderColor: colors.brand,
    },
  ]}
  accessibilityRole="button"
  accessibilityLabel="Unlock Strokes Gained Analysis with Premium"
  onPress={() => Alert.alert('Premium', 'Strokes Gained Analysis requires a Premium subscription.')}
>
```

**Note:** Add `Alert` to imports at top of file.

---

## Section 5: ClubPerformanceRow Accessibility (P1)

### 5.1 Add accessibility description to row

**Location:** Lines 193-194

**Before:**
```tsx
return (
  <View style={[styles.clubRow, { borderBottomColor: colors.divider }]}>
```

**After:**
```tsx
return (
  <View
    style={[styles.clubRow, { borderBottomColor: colors.divider }]}
    accessibilityRole="text"
    accessibilityLabel={`${club.name}: ${club.avgDistance} yards average, ${club.accuracy}% accuracy, ${club.uses} shots`}
  >
```

---

## Section 6: Reduced Motion Support (P1)

### 6.1 Add useReducedMotion import and check

**Location:** Line 23 (imports)

**Add to imports:**
```tsx
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';
```

### 6.2 Use in component

**Location:** After line 246 (inside StatsScreen function)

**Add after state declarations:**
```tsx
const reduceMotion = useReducedMotion();
```

### 6.3 Apply to animations

**Location:** Lines 301, 351

**Before (line 301):**
```tsx
<Animated.View entering={FadeIn} style={styles.bentoGrid}>
```

**After:**
```tsx
<Animated.View entering={reduceMotion ? undefined : FadeIn} style={styles.bentoGrid}>
```

**Before (line 351):**
```tsx
<Animated.View entering={FadeInDown.delay(200)}>
```

**After:**
```tsx
<Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(200)}>
```

**Also lines 382, 412:**
```tsx
// Line 382
<Animated.View
  entering={reduceMotion ? undefined : FadeIn}
  style={[styles.clubsContainer, { backgroundColor: colors.surface }]}
>

// Line 412
<Animated.View entering={reduceMotion ? undefined : FadeIn} style={styles.roundsContainer}>
```

---

## Section 7: Trend Icon Accessibility (P1)

### 7.1 Fix trend container accessibility

**Location:** Lines 145-153 (in StatCard component)

**Before:**
```tsx
{trendValue && TrendIcon && (
  <View style={styles.trendContainer}>
    <TrendIcon size={12} color={getTrendColor()} />
    <Text style={[styles.trendValue, { color: getTrendColor() }]}>
      {trendValue}
    </Text>
  </View>
)}
```

**After:**
```tsx
{trendValue && TrendIcon && (
  <View
    style={styles.trendContainer}
    accessibilityLabel={`Trend ${trend}: ${trendValue}`}
  >
    <TrendIcon
      size={12}
      color={getTrendColor()}
      accessibilityElementsHidden={true}
    />
    <Text
      style={[styles.trendValue, { color: getTrendColor() }]}
      accessibilityElementsHidden={true}
    >
      {trendValue}
    </Text>
  </View>
)}
```

---

## Section 8: Decorative Icons (P2)

### 8.1 Hide BarChart3 decorative icon

**Location:** Line 390

**Before:**
```tsx
<BarChart3 size={20} color={colors.textMuted} />
```

**After:**
```tsx
<BarChart3
  size={20}
  color={colors.textMuted}
  accessibilityElementsHidden={true}
/>
```

### 8.2 Hide empty state decorative icon

**Location:** Line 416

**Before:**
```tsx
<Clock size={48} color={colors.textMuted} />
```

**After:**
```tsx
<Clock
  size={48}
  color={colors.textMuted}
  accessibilityElementsHidden={true}
/>
```

---

## Section 9: ViewAllButton hitSlop (P2)

### 9.1 Add hitSlop for easier touch

**Location:** Lines 397-401

**Before:**
```tsx
<Pressable
  style={[styles.viewAllButton, { borderColor: colors.border }]}
  accessibilityRole="button"
  accessibilityLabel="View all clubs"
>
```

**After:**
```tsx
<Pressable
  style={[styles.viewAllButton, { borderColor: colors.border }]}
  accessibilityRole="button"
  accessibilityLabel="View all clubs"
  hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
>
```

---

## Summary of Changes

| Section | Issue | Lines Changed |
|---------|-------|---------------|
| 1 | Tab container tablist | 3 |
| 2 | Title header role | 2 |
| 3 | Tab accessibility + touch | 8 |
| 4 | Premium banner onPress | 1 |
| 5 | ClubPerformanceRow | 4 |
| 6 | Reduced motion | 8 |
| 7 | Trend icons | 10 |
| 8 | Decorative icons | 6 |
| 9 | ViewAllButton hitSlop | 1 |
| **Total** | | **~43 lines** |

---

## Import Updates Required

Add to line 15:
```tsx
import { Alert } from 'react-native';
```

Update line 23:
```tsx
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';
```

---

## Deferred Items

1. **GlassCard accessibility** - Requires separate component PR
2. **Typography scale** - Needs design input (14px minimum for golf outdoor use)
3. **Spacing normalization** - CARD_GAP 10→12, marginBottom 20→24, etc.
4. **Tab panel aria association** - Complex, low impact

---

## Verification Checklist

- [ ] `npx tsc --noEmit` passes
- [ ] Tab container has tablist role
- [ ] Title has header role
- [ ] All tabs have accessibilityLabel
- [ ] Tab buttons are 44dp minimum height
- [ ] Premium banner has onPress
- [ ] ClubPerformanceRow has accessibility description
- [ ] Reduced motion is respected
- [ ] Trend icons accessible
- [ ] Decorative icons hidden

---

*Implementation Plan completed: 2026-01-13*
*Ready for Phase 5: Implementation*
