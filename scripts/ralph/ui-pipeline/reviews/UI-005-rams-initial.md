# UI-005 RAMS Initial Review: Settings Screen

**Component:** `src/features/settings/screen.tsx`
**Date:** 2026-01-13
**Phase:** 1 - RAMS Review
**Reviewer:** RAMS (Accessibility & Design System Analysis)

---

## Executive Summary

Settings Screen is a comprehensive settings page with theme selection, unit preferences, club management, and premium status. Well-structured component hierarchy with memoization. However, multiple interactive elements lack accessibility props.

**Initial Score:** 68/100

---

## Issues Found

### P0 - Critical (3 issues)

#### 1. SegmentedControl Options Missing Accessibility
**Location:** `screen.tsx` lines 89-107
**Issue:** Pressable buttons in SegmentedControl lack `accessibilityRole` and `accessibilityLabel`.
**Impact:** Screen readers cannot identify theme/unit options.
**Fix:**
```tsx
<Pressable
  key={option.value}
  onPress={() => onChange(option.value)}
  style={[...]}
  accessibilityRole="radio"
  accessibilityLabel={option.label}
  accessibilityState={{ selected: isSelected }}
>
```

#### 2. Title Missing Header Role
**Location:** `screen.tsx` line 523
**Issue:** "Settings" title lacks `accessibilityRole="header"`.
**Fix:**
```tsx
<Text style={[styles.title, { color: tokens.colors.textPrimary }]} accessibilityRole="header">
  Settings
</Text>
```

#### 3. ClubItem Missing Accessibility
**Location:** `screen.tsx` lines 264-290
**Issue:** AnimatedPressable for ClubItem has no accessibility props.
**Impact:** Club list items not identified by screen readers.
**Fix:**
```tsx
<AnimatedPressable
  onPressIn={handlePressIn}
  onPressOut={handlePressOut}
  style={[clubStyles.item, animatedStyle]}
  accessibilityLabel={`${club.name}, ${Math.round(displayYardage)} ${unit}`}
>
```

---

### P1 - Serious (6 issues)

#### 4. SettingsRow Missing Accessibility
**Location:** `screen.tsx` lines 168-188
**Issue:** Pressable in SettingsRow lacks accessibility props.
**Fix:**
```tsx
<Pressable
  onPress={onPress}
  style={...}
  accessibilityRole="button"
  accessibilityLabel={`${label}${value ? `, ${value}` : ''}`}
>
```

#### 5. Club Action Buttons Missing Labels
**Location:** `screen.tsx` lines 276-287
**Issue:** Edit and Delete buttons have no `accessibilityLabel`.
**Fix:**
```tsx
<Pressable
  onPress={onEdit}
  style={...}
  accessibilityRole="button"
  accessibilityLabel={`Edit ${club.name}`}
>
```

#### 6. Add Club Button Missing Accessibility
**Location:** `screen.tsx` lines 609-614
**Issue:** Plus button to add club lacks label.
**Fix:**
```tsx
<Pressable
  onPress={() => setShowAddForm(true)}
  style={styles.addButton}
  accessibilityRole="button"
  accessibilityLabel="Add new club"
>
```

#### 7. TextInput Fields Missing Accessibility
**Location:** `screen.tsx` lines 621-649
**Issue:** Club name and distance inputs lack `accessibilityLabel`.
**Fix:**
```tsx
<TextInput
  placeholder="Club Name (e.g., 7 Iron)"
  accessibilityLabel="Club name"
  ...
/>
```

#### 8. SegmentedControl Container Missing Radiogroup Role
**Location:** `screen.tsx` line 85
**Issue:** Container should have `accessibilityRole="radiogroup"`.
**Fix:**
```tsx
<View style={segmentStyles.container} accessibilityRole="radiogroup">
```

#### 9. Section Headers Decorative Icons
**Location:** Lines 533, 555, 600-602, 701, 775
**Issue:** Section header icons should be hidden from accessibility.
**Fix:** Add `accessibilityElementsHidden={true}` to decorative icons.

---

### P2 - Moderate (5 issues)

#### 10. Font Size Arithmetic
**Location:** Multiple lines (79, 154, 163, 241, 309, 328, etc.)
**Issue:** Using expressions like `t.fontSize.sm + 1` instead of tokens.
**Recommendation:** Define semantic font size tokens.

#### 11. Spacing Arithmetic
**Location:** Lines 67-70, 228, 319, 397, etc.
**Issue:** Using `t.spacing.sm + 2`, `t.spacing.xs - 2` instead of semantic tokens.
**Recommendation:** Use closest available token value.

#### 12. ChevronRight Icons Decorative
**Location:** Lines 185, 748, 784
**Issue:** Navigation icons should be hidden from accessibility tree.
**Fix:** Add `accessibilityElementsHidden={true}`.

#### 13. Form Cancel/Save Button Context
**Location:** Lines 651-661
**Issue:** Cancel and Save buttons could have more context.
**Note:** Low priority - current text is acceptable.

#### 14. Premium Badge Missing Context
**Location:** Lines 706-718
**Issue:** Trial/Lifetime badges are visual indicators with limited context.
**Recommendation:** Consider adding to parent element's accessibility label.

---

## Positive Patterns Found

1. **useAccessibleAnimations hook** - Proper animation support
2. **Pressable press state feedback** - Uses `pressed` style state
3. **useSharedValue animations** - Proper Reanimated usage
4. **Restore Purchases** - Has `accessibilityRole="button"` and label
5. **Manage Subscription** - Has proper accessibility props
6. **Touch targets** - Most elements meet 44dp minimum
7. **Memoization** - Good use of `React.memo` and `useMemo`
8. **Token usage** - Generally good design token adherence

---

## Component Analysis

### SegmentedControl
- Missing radiogroup semantics
- Options need radio role
- Icons decorative but announced

### SettingsRow
- Generic row component lacks accessibility
- Would benefit from role="button" and label

### ClubItem
- Complex interactive element
- Action buttons need individual labels
- Parent pressable needs description

---

## Golf-Specific Observations

| Requirement | Status | Notes |
|-------------|--------|-------|
| Touch targets 44dp+ | PASS | Action buttons 44x44 |
| One-hand operation | PASS | Actions on right side |
| Outdoor readability | PASS | High contrast colors |
| Glanceable info | PASS | Clear club distances |

---

## Score Breakdown

| Category | Score | Notes |
|----------|-------|-------|
| Accessibility | 12/25 | Multiple missing props |
| Touch Targets | 18/20 | Well sized |
| Design Tokens | 15/20 | Some arithmetic usage |
| Golf-Specific | 14/15 | Good layout |
| Code Quality | 9/20 | Good structure, accessibility gaps |
| **Total** | **68/100** | |

---

*RAMS Review completed: 2026-01-13*
*Next: Phase 2 - GPT Cross-Review*
