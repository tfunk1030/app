# UI-006 RAMS Initial Review: Core UI Components

**Component:** `src/core/components/ui/` (Directory)
**Date:** 2026-01-13
**Phase:** 1 - RAMS Review
**Reviewer:** RAMS (Accessibility & Design System Analysis)

---

## Executive Summary

Core UI components are well-designed with proper use of design tokens, animations, and reduced motion support. However, interactive components lack accessibility props when used as buttons or tabs.

**Initial Score:** 72/100

---

## Components Analyzed

1. **GlassCard.tsx** - Card with glassmorphism effect
2. **BoldCard.tsx** - Card with gradient surfaces
3. **GradientHero.tsx** - Gradient hero background
4. **FloatingTabBar.tsx** - Floating tab navigation
5. **BoldTabBar.tsx** - Bold gradient tab navigation

---

## Issues Found

### P0 - Critical (2 issues)

#### 1. GlassCard Interactive Mode Missing Accessibility
**Location:** `GlassCard.tsx` lines 201-218
**Issue:** When `onPress` is provided, AnimatedPressable lacks `accessibilityRole` and `accessibilityLabel`.
**Impact:** Interactive cards are not announced by screen readers.
**Fix:**
```tsx
<AnimatedPressable
  onPress={onPress}
  onPressIn={handlePressIn}
  onPressOut={handlePressOut}
  disabled={disabled}
  accessibilityRole="button"
  style={[...]}
>
```

#### 2. BoldCard Interactive Mode Missing Accessibility
**Location:** `BoldCard.tsx` lines 197-214
**Issue:** Same as GlassCard - AnimatedPressable lacks accessibility when interactive.
**Fix:**
```tsx
<AnimatedPressable
  onPress={onPress}
  onPressIn={handlePressIn}
  onPressOut={handlePressOut}
  disabled={disabled}
  accessibilityRole="button"
  style={[...]}
>
```

---

### P1 - Serious (4 issues)

#### 3. FloatingTabBar TabButton Missing Accessibility
**Location:** `FloatingTabBar.tsx` lines 81-134
**Issue:** TabButton AnimatedPressable lacks tab accessibility.
**Fix:**
```tsx
<AnimatedPressable
  onPress={onPress}
  onLongPress={onLongPress}
  style={[styles.tabButton, animatedStyle]}
  accessibilityRole="tab"
  accessibilityLabel={typeof label === 'string' ? label : route.name}
  accessibilityState={{ selected: isFocused }}
>
```

#### 4. FloatingTabBar Container Missing Tablist Role
**Location:** `FloatingTabBar.tsx` lines 170-177
**Issue:** Tab bar container needs `accessibilityRole="tablist"`.
**Fix:**
```tsx
<View
  style={[styles.tabBar, ...]}
  accessibilityRole="tablist"
>
```

#### 5. BoldTabBar TabButton Missing Accessibility
**Location:** `BoldTabBar.tsx` lines 117-160
**Issue:** Same as FloatingTabBar - TabButton needs accessibility.
**Fix:**
```tsx
<AnimatedPressable
  onPress={handlePress}
  onLongPress={handleLongPress}
  style={[styles.tabButton, animatedStyle]}
  accessibilityRole="tab"
  accessibilityLabel={typeof label === 'string' ? label : route.name}
  accessibilityState={{ selected: isFocused }}
>
```

#### 6. BoldTabBar Container Missing Tablist Role
**Location:** `BoldTabBar.tsx` lines 213-223
**Issue:** Tab bar container needs `accessibilityRole="tablist"`.
**Fix:**
```tsx
<View
  style={[styles.tabBar, ...]}
  accessibilityRole="tablist"
>
```

---

### P2 - Moderate (2 issues)

#### 7. GradientHero Decorative Content
**Location:** `GradientHero.tsx`
**Issue:** None - purely decorative/layout component.
**Status:** N/A - no fixes needed.

#### 8. Hardcoded Values in BoldCard/BoldTabBar
**Location:** Multiple files
**Issue:** Some hardcoded pixel values (16, 24, etc.) instead of tokens.
**Recommendation:** Use token references for consistency.

---

## Positive Patterns Found

1. **useReduceMotionValue hook** - Proper reduced motion support in BoldCard and BoldTabBar
2. **springConfigs** - Consistent animation timing
3. **Token-based styling** - Good use of design tokens throughout
4. **Memoized styles** - Performance optimization with useMemo
5. **Theme support** - Light/dark mode variants
6. **Touch targets** - Tab buttons meet 48dp minimum
7. **Haptic feedback** - BoldTabBar has haptic feedback

---

## Component Accessibility Status

| Component | Interactive | Accessibility | Status |
|-----------|-------------|---------------|--------|
| GlassCard | Optional | Missing when interactive | NEEDS FIX |
| BoldCard | Optional | Missing when interactive | NEEDS FIX |
| GradientHero | No | N/A | OK |
| FloatingTabBar | Yes | Missing tab semantics | NEEDS FIX |
| BoldTabBar | Yes | Missing tab semantics | NEEDS FIX |

---

## Score Breakdown

| Category | Score | Notes |
|----------|-------|-------|
| Accessibility | 14/25 | Missing tab/button semantics |
| Touch Targets | 20/20 | Well sized |
| Design Tokens | 17/20 | Good usage, minor hardcoding |
| Animation | 15/15 | Excellent reduced motion support |
| Code Quality | 6/20 | Good structure, accessibility gaps |
| **Total** | **72/100** | |

---

*RAMS Review completed: 2026-01-13*
*Next: Phase 2-5 - Implementation*
