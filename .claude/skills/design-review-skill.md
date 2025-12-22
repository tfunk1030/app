---
name: design-review
description: Automated design review for React Native components
---

# Design Review Skill

## Activation
Use this skill when:
- User asks to review, audit, or check design
- User mentions spacing, layout, visual
- Before any PR or merge

## Review Protocol

### Phase 1: Static Analysis
1. Check for hardcoded values:
   - Colors: grep for hex codes
   - Spacing: grep for arbitrary pixel values
   - Fonts: grep for fontFamily without token

2. Verify design token usage:
   - All colors from tokens.ts
   - All spacing from 8pt scale
   - All typography from theme

### Phase 2: Visual Analysis
1. If screenshot available:
   - Check alignment (8pt grid)
   - Verify touch target sizes
   - Assess visual hierarchy
   - Identify clutter

2. Apply heuristics:
   - Nielsen 10 usability heuristics
   - iOS HIG compliance
   - Material Design 3 patterns

### Phase 3: Accessibility Check
1. Verify required props:
   - accessibilityLabel
   - accessibilityRole
   - testID

2. Measure contrast ratios
3. Check focus order

## Output Format
Always output as table:
| Issue | Severity | Location | Heuristic | Fix |
