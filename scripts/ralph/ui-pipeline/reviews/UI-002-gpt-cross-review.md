# GPT Cross-Review: SetupScreen.tsx (UI-002)

**Review Date:** 2026-01-13
**Input:** RAMS Review (Score: 68/100, 14 issues)
**Purpose:** Blind spot analysis and priority validation

---

## Validation of RAMS Findings

### Confirmed Valid

| RAMS Finding | GPT Assessment |
|--------------|----------------|
| Switches lack accessibilityLabel | **VALID** - Real a11y gap, high priority. Screen readers will just announce "Switch" without context |
| Club action icons 36x36 | **VALID P1** - Below 44-48dp guideline, critical for glove use |
| Premium card no onPress | **VALID P1** - Broken affordance, presents as button but non-functional |
| ClubRow buttons missing accessibilityRole | **VALID P2/P1** - Worth fixing depending on a11y bar |
| SectionHeader action label | **LOWER PRIORITY** - Pressable contains Text child, will generally announce content |

### Potentially Over-Prioritized

| RAMS Finding | GPT Assessment |
|--------------|----------------|
| Theme/Unit selectors missing accessibilityLabel | **DROP TO P2** - Visible text usually becomes accessible label. Verify actual VoiceOver/TalkBack behavior before fixing |

---

## Blind Spots Identified (RAMS Missed)

### HIGH PRIORITY

1. **Radio groups lack grouping role** (`src/features/redesign/screens/SetupScreen.tsx`)
   - Missing `accessibilityRole="radiogroup"` on Theme/Unit containers
   - SR users can't understand context of radio options
   - **Recommended:** Add group role and label to containers

2. **Switch rows not fully tappable** (`src/features/redesign/screens/SetupScreen.tsx`)
   - Only the tiny toggle is tappable, not the row label
   - For gloves and one-hand use, make whole row toggleable
   - **Recommended:** Add `onPress` to row with `accessibilityRole="switch"` and `accessibilityState`

3. **Missing header structure** (`src/features/redesign/screens/SetupScreen.tsx`)
   - Title "Setup" and section headers are plain Text
   - SR users lack page structure
   - **Recommended:** Mark with `accessibilityRole="header"`

### MEDIUM PRIORITY

4. **Small text in outdoor conditions**
   - Section headers (12px) and secondary content (12-13px) risky in bright sunlight
   - **Recommended:** Minimum 14-16px and higher contrast

5. **Premium card disabled state**
   - If intentionally inactive, mark disabled so it doesn't read as actionable
   - **Recommended:** Add `accessibilityHint` or `disabled` state

6. **Icon-only actions missing hitSlop**
   - Even with increased size, explicit `hitSlop` helps on bumpy course conditions
   - **Recommended:** Add `hitSlop` to edit/delete buttons

---

## Priority Re-Assessment

### Over-Prioritized (Lower)
- Theme/Unit "missing accessibilityLabel" → P2 or "verify first"
- Hardcoded spacing/typography → Polish, not P2 a11y blocker (unless impacts touch size/readability)

### Under-Prioritized (Raise)
- Missing header roles → Bigger UX/a11y impact than token-purity
- Missing row-level toggle behavior → Critical for golf use case

---

## Golf-Specific Considerations

| Factor | Recommendation |
|--------|----------------|
| **Touch targets** | 48dp+ ideal, row-level for toggles. Gloves + cold fingers make tiny controls unusable |
| **Typography** | Increase scale and contrast for sunlight. 12-13px text washes out on bright days |
| **One-hand operation** | Align primary actions to right side, reduce reliance on small icon buttons |
| **Fake CTAs** | Inoperative Premium card reads like a bug on-course. Fix or mark disabled |
| **Permission feedback** | Show "Needs OS permission" state so users don't assume broken in field |

---

## Summary

| Category | RAMS | GPT Added |
|----------|------|-----------|
| Critical | 3 | +2 (radiogroup role, row-level toggles) |
| Serious | 5 | +2 (header structure, hitSlop) |
| Moderate | 6 | +2 (text size outdoor, permission feedback) |

**GPT Recommendation:** Focus on row-level tap targets and radiogroup roles before token-purity fixes.

---

*Review generated: 2026-01-13*
*Reviewer: GPT (Codex MCP cross-review)*
