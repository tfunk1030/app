# Design Review

Perform a comprehensive design review of $ARGUMENTS.

## Review Criteria:

### 1. Spacing Consistency
- All spacing uses 8pt grid (4, 8, 16, 24, 32, 48)
- No magic numbers or arbitrary values
- Consistent gaps between related elements

### 2. Color Usage
- Only design tokens used (no hardcoded hex)
- Sufficient contrast (WCAG AA: 4.5:1 text, 3:1 UI)
- Dark mode support

### 3. Typography
- Proper hierarchy (h1 > h2 > body)
- Minimum 16px for body text
- Readable outdoors (high contrast)

### 4. Touch Targets
- Minimum 48x48dp
- Adequate spacing between targets
- Thumb-zone friendly for primary actions

### 5. Visual Hierarchy
- Clear primary action
- Logical grouping
- Appropriate whitespace
- No visual clutter

### 6. Accessibility
- accessibilityLabel on all interactive elements
- accessibilityRole defined
- Screen reader logical order

## Output Format:
| Issue | Severity (1-4) | Location | Fix |
Severity: 1=Critical, 2=Major, 3=Minor, 4=Enhancement
