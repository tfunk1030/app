# UICrit Evaluation Rubric

Research-backed scoring template based on the UICrit dataset of 3,059 design critiques.

## Instructions

Score each dimension 1-10. Scores 7+ require explicit justification.
Mark confidence: HIGH (visual evidence) | MEDIUM (inference) | LOW (guess)

---

## Component: [NAME]
## File: [PATH]
## Date: [DATE]
## Reviewer: [AGENT]

---

## AESTHETICS (40% weight)

| Dimension | Score | Confidence | Evidence |
|-----------|-------|------------|----------|
| Visual Balance | /10 | | |
| Color Harmony | /10 | | |
| Whitespace | /10 | | |
| Typography | /10 | | |
| Overall Appeal | /10 | | |

**Aesthetics Subtotal**: /50

---

## USABILITY (60% weight)

| Dimension | Score | Confidence | Evidence |
|-----------|-------|------------|----------|
| Learnability | /10 | | |
| Efficiency | /10 | | |
| Error Prevention | /10 | | |
| Feedback | /10 | | |
| Accessibility | /10 | | |

**Usability Subtotal**: /50

---

## CATEGORY CHECKLIST

### Layout
- [ ] Alignment to 8pt grid
- [ ] Consistent spacing values
- [ ] Clear visual hierarchy
- [ ] Proper grouping of related elements
- [ ] No orphaned elements

### Color Contrast
- [ ] Text contrast ≥4.5:1 (normal) / 3:1 (large)
- [ ] Interactive element contrast sufficient
- [ ] Works in both light/dark modes
- [ ] Outdoor readability (golf app specific)

### Text Readability
- [ ] Body text ≥16sp
- [ ] Appropriate line height (1.4-1.6x)
- [ ] Number of lines limited
- [ ] Truncation handled gracefully

### Button Usability
- [ ] Touch targets ≥48dp (56dp preferred for golf)
- [ ] Clear affordances (looks tappable)
- [ ] Proper button states (normal, pressed, disabled)
- [ ] Adequate spacing between targets

### Learnability
- [ ] Standard patterns used where expected
- [ ] Icons are recognizable
- [ ] Labels are clear and concise
- [ ] First-time user can figure it out

---

## GOLF APP SPECIFIC

| Dimension | Pass/Fail | Notes |
|-----------|-----------|-------|
| Outdoor sunlight readability | | |
| One-handed thumb-zone operation | | |
| Glanceability while walking | | |
| Glove-friendly touch targets | | |
| Quick info retrieval (<3 taps) | | |

---

## FINAL SCORES

| Category | Raw Score | Weight | Weighted |
|----------|-----------|--------|----------|
| Aesthetics | /50 | 40% | |
| Usability | /50 | 60% | |
| **TOTAL** | | | **/100** |

---

## VERDICT

- [ ] POLISHED (80+): Ready for production
- [ ] ACCEPTABLE (60-79): Minor issues, can ship
- [ ] NEEDS WORK (40-59): Significant issues, fix before merge
- [ ] CRITICAL (0-39): Major problems, do not ship

---

## TOP 3 ISSUES

1. **[SEVERITY]** [Description] (line: XX)
2. **[SEVERITY]** [Description] (line: XX)
3. **[SEVERITY]** [Description] (line: XX)

---

## ANTI-SYCOPHANCY CHECK

Before submitting, verify:
- [ ] I started with criticism, not praise
- [ ] I questioned scores 7+ with evidence
- [ ] I provided specific line numbers
- [ ] I compared to Apple/Google standards
- [ ] A senior designer would agree
