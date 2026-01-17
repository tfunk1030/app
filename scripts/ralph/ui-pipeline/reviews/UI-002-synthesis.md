# UI-002 Synthesis: SetupScreen.tsx

**Component:** `src/features/redesign/screens/SetupScreen.tsx`
**Date:** 2026-01-13
**Phase:** 3 - Skills Synthesis

---

## Review Sources Combined

| Source | Issues Found | Score |
|--------|--------------|-------|
| RAMS Initial | 14 issues (3 critical, 5 serious, 6 moderate) | 68/100 |
| GPT Cross-Review | +6 blind spots, 1 over-prioritized | - |
| ui-ux-pro-max | React Native + accessibility patterns | - |

---

## Consolidated Priority List

### P0 - Critical (Must Fix Before Ship)

| # | Issue | Source | Lines | Fix |
|---|-------|--------|-------|-----|
| 1 | Switch components missing accessibilityLabel | RAMS, GPT | 476-515 | Add `accessibilityLabel` to all 3 Switches |
| 2 | Club action buttons 36x36 below touch target | RAMS, GPT | 705-711 | Increase to 44x44 minimum |
| 3 | Missing radiogroup role on Theme container | GPT | 240 | Add `accessibilityRole="radiogroup"` |
| 4 | Missing radiogroup role on Unit container | GPT | 413 | Add `accessibilityRole="radiogroup"` |
| 5 | Switch rows not fully tappable | GPT | 472-516 | Make entire SettingRow trigger switch |

### P1 - High (Should Fix This Sprint)

| # | Issue | Source | Lines | Fix |
|---|-------|--------|-------|-----|
| 6 | SectionHeader action missing accessibilityLabel | RAMS | 99 | Add `accessibilityLabel={action}` |
| 7 | ClubRow buttons missing accessibilityRole | RAMS | 202-216 | Add `accessibilityRole="button"` |
| 8 | Premium card no onPress handler | RAMS, GPT | 524 | Add `disabled` prop or `onPress` handler |
| 9 | Page title missing header role | RAMS, GPT | 337-343 | Add `accessibilityRole="header"` |
| 10 | Icon-only actions missing hitSlop | GPT | 202-216 | Add `hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}` |

### P2 - Medium (Polish)

| # | Issue | Source | Lines | Fix |
|---|-------|--------|-------|-----|
| 11 | Non-standard gap values (10px) | RAMS | 729, 752 | Change to 8 or 12 (design scale) |
| 12 | Hardcoded spacing values | RAMS | multiple | Use `tokens.spacing.*` |
| 13 | Hardcoded typography | RAMS | 600-604 | Use typography tokens |
| 14 | Small text (12px) outdoor readability | GPT | 621-624 | Consider 14px minimum |
| 15 | Hardcoded borderRadius | RAMS | 634, 740 | Use `tokens.borderRadius.*` |

---

## Pattern Recommendations (ui-ux-pro-max)

### React Native Best Practices
- **Animations:** Already using Reanimated correctly (FadeIn, FadeInDown)
- **Gesture handling:** Add `hitSlop` to small touch targets
- **Testing:** Add testID to interactive elements for RNTL

### Accessibility Patterns (WCAG 2.1)
- **Grouped controls:** Use `accessibilityRole="radiogroup"` on containers
- **Touch targets:** 44dp minimum, 48dp+ for glove use
- **Error feedback:** Use `aria-live` equivalent for state changes
- **Color contrast:** Verify 4.5:1 ratio for all text

### Micro-interactions (From styles.csv)
- Current haptic feedback is good
- Consider 50-100ms hover states
- Success/error state animations for toggle changes

---

## Recommended Implementation Order

### Phase 1: Accessibility Critical (P0)
1. Add accessibilityLabel to all Switches
2. Increase club action buttons to 44x44
3. Add radiogroup role to Theme/Unit containers
4. Make switch rows fully tappable

### Phase 2: Accessibility High (P1)
5. Add accessibilityRole to ClubRow buttons
6. Add accessibilityLabel to SectionHeader action
7. Fix Premium card (disable or implement)
8. Add header role to title
9. Add hitSlop to icon buttons

### Phase 3: Design Polish (P2)
10. Normalize gap values to design scale
11. Replace hardcoded spacing with tokens
12. Replace hardcoded typography with tokens

---

## Golf-Specific Considerations

| Factor | Current State | Recommendation |
|--------|---------------|----------------|
| Touch targets | 36x36 buttons | 48dp+ for glove use |
| Row-level toggles | Toggle only | Full row tappable |
| Typography outdoor | 12px minimum | 14px minimum for sunlight |
| One-hand operation | Mixed alignment | Primary actions right-aligned |
| Fake CTAs | Premium card inactive | Disable or implement |

---

## Code Changes Summary

### Files to Modify
1. `src/features/redesign/screens/SetupScreen.tsx` (main changes)

### Estimated Changes
- ~30 lines for accessibility attributes
- ~10 lines for touch target sizing
- ~20 lines for row-level toggle behavior
- ~40 lines for token normalization

**Total:** ~100 lines modified

---

## Validation Checklist

After implementation, verify:
- [ ] `npx tsc --noEmit` passes
- [ ] VoiceOver/TalkBack announces all controls
- [ ] All touch targets >= 44dp
- [ ] Theme/Unit containers have radiogroup role
- [ ] Switch rows toggle on row tap
- [ ] Premium card has clear disabled state or working action

---

*Synthesis generated: 2026-01-13*
*Sources: RAMS, GPT Cross-Review, ui-ux-pro-max skill*
