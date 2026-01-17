# UI-005 GPT Cross-Review: Settings Screen

**Component:** `src/features/settings/screen.tsx`
**Date:** 2026-01-13
**Phase:** 2 - GPT Cross-Review
**Purpose:** Validate RAMS findings + identify blind spots

---

## RAMS Findings Validation

### Confirmed Issues

| RAMS Finding | GPT Assessment | Priority |
|--------------|----------------|----------|
| SegmentedControl missing accessibility | **VALID** - Critical pattern | P0 |
| Title missing header role | **VALID** - Standard pattern | P0 |
| ClubItem missing accessibility | **VALID** - List items need labels | P0 |
| SettingsRow missing accessibility | **VALID** - Generic rows need props | P1 |
| Club action buttons missing labels | **VALID** - Icons need context | P1 |
| Add club button missing label | **VALID** - Icon-only button | P1 |
| TextInput fields missing labels | **VALID** - Form accessibility | P1 |
| SegmentedControl radiogroup role | **VALID** - Container semantics | P1 |

### Over-Prioritized (Suggest Downgrade)

| RAMS Finding | GPT Assessment |
|--------------|----------------|
| Font/spacing arithmetic | P3 - Maintenance concern only |
| ChevronRight icons decorative | P3 - Standard navigation pattern |

---

## Blind Spots Found

### 1. Section Titles Missing Header Role (P1)
**Issue:** "Appearance", "Unit System", "My Clubs", "Premium" section titles lack `accessibilityRole="header"`.
**Location:** Lines 534-536, 556-558, 604-606, 702-704
**Fix:**
```tsx
<Text
  style={[styles.sectionTitle, { color: tokens.colors.textPrimary }]}
  accessibilityRole="header"
>
  Appearance
</Text>
```

### 2. Empty State Missing Accessibility (P2)
**Issue:** "No clubs added yet" text could be more descriptive.
**Location:** Lines 687-690
**Fix:**
```tsx
<Text
  style={[styles.emptyText, { color: tokens.colors.textMuted }]}
  accessibilityLabel="No clubs in your bag. Tap the plus button to add a club."
>
```

### 3. Premium Status Missing Context (P2)
**Issue:** Premium status section has visual badges but limited screen reader context.
**Location:** Lines 720-729
**Recommendation:** Combine status into parent's accessibilityLabel.

### 4. Loading/Disabled State Announcement (P2)
**Issue:** Restore button's loading state not announced.
**Location:** Lines 764-785
**Fix:** Add `accessibilityState={{ disabled: isRestoring, busy: isRestoring }}`

### 5. Form Validation Feedback (P2)
**Issue:** Disabled Save button state not communicated.
**Location:** Lines 654-661
**Fix:** Add `accessibilityState={{ disabled: !newClub.name || !newClub.normalYardage }}`

---

## Golf-Specific Analysis

### Club Management UX

```
  ┌─────────────────────────┐
  │ My Clubs          [+]   │  ← Add button needs label
  ├─────────────────────────┤
  │ Driver        285 yds   │  ← Item needs label
  │           [✏️] [🗑️]     │  ← Actions need labels
  ├─────────────────────────┤
  │ 7 Iron        165 yds   │
  │           [✏️] [🗑️]     │
  └─────────────────────────┘
```

**Key Issues:**
1. Club items not labeled for screen readers
2. Edit/Delete buttons rely on icons only
3. Distance units not announced

### One-Hand Operation

| Section | Thumb Zone | Assessment |
|---------|------------|------------|
| Theme selector | Center | OK |
| Unit selector | Center | OK |
| Club actions | Right edge | GOOD |
| Form buttons | Bottom | GOOD |

---

## Consolidated Priority List

### P0 - Critical (3)
1. SegmentedControl options missing radio role/label *(RAMS)*
2. Title missing header role *(RAMS)*
3. ClubItem missing accessibility label *(RAMS)*

### P1 - High (8)
4. SettingsRow missing accessibility *(RAMS)*
5. Club action buttons missing labels *(RAMS)*
6. Add club button missing label *(RAMS)*
7. TextInput fields missing labels *(RAMS)*
8. SegmentedControl container radiogroup *(RAMS)*
9. Section titles missing header role *(NEW)*
10. Decorative icons not hidden *(RAMS)*

### P2 - Medium (4)
11. Empty state accessibility *(NEW)*
12. Loading/disabled state announcement *(NEW)*
13. Form validation feedback *(NEW)*
14. Premium status context *(NEW)*

---

## Implementation Recommendations

### Quick Wins (< 5 minutes each)
1. Add header role to Settings title
2. Add radiogroup to SegmentedControl container
3. Add radio role/label to SegmentedControl options
4. Add labels to TextInput fields
5. Add label to Add Club button

### Moderate Effort (5-15 minutes each)
1. Add accessibility to ClubItem
2. Add accessibility to SettingsRow
3. Add labels to club action buttons
4. Add header role to section titles

### Deferred
1. Token arithmetic normalization
2. ChevronRight icon hiding (low impact)

---

*GPT Cross-Review completed: 2026-01-13*
*Next: Phase 3-5 - Implementation*
