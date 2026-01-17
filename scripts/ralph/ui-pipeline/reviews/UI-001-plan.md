# UI-001 Play Screen: Implementation Plan

**Component:** `src/features/redesign/screens/PlayScreen.tsx`
**Date:** 2026-01-13
**Based on:** RAMS + GPT Synthesis

---

## P0 - Critical (Must Fix)

### 1. Fix Wind Details Dead Affordance (GPT-1)
**File:** `PlayScreen.tsx:386-404`
**Issue:** Pressable with `accessibilityRole="button"` but no `onPress` handler

**Current:**
```tsx
<Pressable
  style={[styles.windDetails, { backgroundColor: colors.surface }]}
  accessibilityRole="button"
  accessibilityLabel="View wind analysis details"
>
```

**Fix:** Add `onPress` handler or change to View if not interactive
```tsx
<Pressable
  onPress={() => {
    // TODO: Navigate to wind details or expand
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }}
  style={[styles.windDetails, { backgroundColor: colors.surface }]}
  accessibilityRole="button"
  accessibilityLabel="View wind analysis details"
  accessibilityHint="Tap to view detailed wind analysis"
>
```

---

### 2. Add Accessibility to ConditionsBar (C-2)
**File:** `PlayScreen.tsx:191-219`
**Issue:** ScrollView missing accessibility props

**Current:**
```tsx
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  style={styles.conditionsScroll}
  contentContainerStyle={styles.conditionsContainer}
>
```

**Fix:**
```tsx
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  style={styles.conditionsScroll}
  contentContainerStyle={styles.conditionsContainer}
  accessible={true}
  accessibilityRole="summary"
  accessibilityLabel="Current weather conditions"
>
```

---

### 3. Fix Hardcoded RGBA in QuickAction (C-1)
**File:** `QuickAction.tsx:183-185`
**Issue:** Hardcoded `rgba(255,255,255,0.8)` instead of theme token

**Current:**
```tsx
color: variant === 'primary'
  ? 'rgba(255,255,255,0.8)'
  : colors.textMuted,
```

**Fix:** Use theme color with opacity
```tsx
color: variant === 'primary'
  ? colors.textInverse + 'CC'  // 80% opacity in hex
  : colors.textMuted,
```

*Note: `CC` is hex for 80% opacity (204/255)*

---

## P1 - High Priority

### 4. Fix Hardcoded Spacing Values (C-3)
**File:** `PlayScreen.tsx` - Multiple locations

| Line | Current | Fix |
|------|---------|-----|
| 436 | `marginBottom: 20` | `marginBottom: tokens.spacing.lg` (24) |
| 525 | `gap: 10` | `gap: tokens.spacing.sm` (8) |

**a) Line 436:**
```tsx
// Current
header: {
  marginBottom: 20,
},

// Fix
header: {
  marginBottom: 24, // Use tokens.spacing.lg when tokens available in styles
},
```

**b) Line 525:**
```tsx
// Current
presetsRow: {
  flexDirection: 'row',
  gap: 10,
},

// Fix
presetsRow: {
  flexDirection: 'row',
  gap: 8, // Use tokens.spacing.sm when tokens available
},
```

---

### 5. Fix QuickAction Gap (C-4)
**File:** `QuickAction.tsx:208`
**Issue:** `gap: 10` not in spacing scale

**Current:**
```tsx
button: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 16,
  gap: 10,
},
```

**Fix:**
```tsx
button: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 16,
  gap: 8, // spacing.sm
},
```

---

## P2 - Nice to Have (If Time)

### 6. Add useReducedMotion Support (A11Y-3)
**Files:** PlayScreen.tsx, QuickAction.tsx, ResultCard.tsx
**Pattern:**
```tsx
import { useReducedMotion } from 'react-native-reanimated';

// In component:
const reducedMotion = useReducedMotion();

// When animating:
<Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(400)}>
```

### 7. RefreshControl Android Colors (GPT-RN)
**File:** `PlayScreen.tsx:~310`
```tsx
<RefreshControl
  refreshing={isRefreshing}
  onRefresh={handleRefresh}
  tintColor={colors.brand}
  colors={[colors.brand]} // Add for Android
/>
```

---

## Implementation Order

1. **QuickAction.tsx** - Fix RGBA and gap (2 edits, quick)
2. **PlayScreen.tsx:191-219** - Add accessibility to ConditionsBar
3. **PlayScreen.tsx:386-404** - Add onPress to Wind Details
4. **PlayScreen.tsx:436, 525** - Fix spacing values
5. **Run typecheck:** `npx tsc --noEmit`
6. *(Optional)* Add useReducedMotion and RefreshControl colors

---

## Verification Checklist

- [ ] All changes pass TypeScript check
- [ ] No new hardcoded colors or spacing
- [ ] All interactive elements have `onPress` handlers
- [ ] All scrollable regions have accessibility labels
- [ ] Test on iOS and Android simulators

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/redesign/QuickAction.tsx` | Fix RGBA (line 184), Fix gap (line 208) |
| `src/features/redesign/screens/PlayScreen.tsx` | A11y on ConditionsBar (191), onPress on WindDetails (386), spacing fixes (436, 525) |
