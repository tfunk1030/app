# Accessibility Audit

Perform WCAG 2.2 AA accessibility audit on $ARGUMENTS.

## Audit Checklist:

### Perceivable
- Color contrast >= 4.5:1 for text
- Color contrast >= 3:1 for UI components
- Information not conveyed by color alone
- Text resizable to 200%

### Operable
- Touch targets >= 48x48dp
- No time limits on interactions
- Focus order is logical
- Gestures have alternatives

### Understandable
- Labels describe purpose
- Error messages are helpful
- Consistent navigation

### Robust
- accessibilityLabel on all interactive elements
- accessibilityRole defined correctly
- accessibilityHint for complex actions
- Works with VoiceOver/TalkBack

### Golf-Specific
- Large touch targets for glove use
- High contrast for outdoor sunlight
- Works one-handed (thumb reach)

## Output:
Provide pass/fail for each item with specific code locations for failures.
