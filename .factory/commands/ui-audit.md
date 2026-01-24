---
name: ui-audit
description: Run comprehensive UI audit for design system violations
---

Perform a comprehensive UI audit using specialized droids.

## Workflow

1. **Scan screens directory** (`src/screens/`) for all screen components
2. **For each screen**, delegate to `ui-reviewer` droid
3. **For card soup detection**, delegate to `design-enforcer` droid
4. **Compile findings** into prioritized report

## Focus Areas
- Design system compliance
- Visual hierarchy violations
- "Card soup" detection
- Mobile UX best practices
- Accessibility issues

## Output Format

Generate a markdown report:

```markdown
# UI Audit Report - [Date]

## Summary
- Screens audited: X
- Critical issues: X
- Card soup violations: X
- Estimated fix time: X hours

## By Screen

### [ScreenName]
- Status: 🔴/🟡/🟢
- Issues: [list]
- Priority: High/Medium/Low

## Prioritized Fix List
1. [Most critical issue] - [Screen] - [Est. time]
2. [Next issue] - [Screen] - [Est. time]

## Quick Wins
- [Easy fixes that can be done immediately]
```

## Usage
```
/ui-audit                    # Audit all screens
/ui-audit HomeScreen.tsx     # Audit specific screen
```
