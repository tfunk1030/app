# AICaddyPro UI/UX Audit Report

## Summary

- **Overall Accessibility**: Strong foundation with `accessibilityRole`, `accessibilityLabel`, and `accessibilityState` implemented across most interactive components. The `useReducedMotion` hook and `useAccessibleAnimations` provide robust reduced motion support.
- **Touch Targets**: Core UI components (Button, Slider, MetricTile) properly enforce 44-48dp minimum touch targets via `getTouchTargetSize()` utility. However, PlayScreen's `adjustButton` at 56x56 is adequate but some elements lack explicit minimum heights.
- **Token Usage**: Excellent design system with `darkTokens`/`lightTokens` providing themed consistency. Some hardcoded `rgba()` values remain in Wind compass components and one hardcoded `#fff` in ErrorBoundary button text.
- **Empty/Loading/Error States**: Skeleton screens, EmptyState component, and ErrorBoundary are well-implemented with proper accessibility announcements.
- **Performance Concerns**: OnboardingFlow uses FlatList instead of FlashList; WindDirectionCompass has continuous Animated.loop that could drain battery; Slider component has a continuous pulse animation.
- **Navigation**: 3-tab redesign layout (Shot/Wind/Setup) is straightforward. Tab bar icons lack `accessibilityHint` for discoverability.

---

## P0 - Critical / Blocking Issues

| ID | Issue | Files | Evidence |
|----|-------|-------|----------|
| UI-001 | **ErrorBoundary button text uses hardcoded color** | `src/components/error-boundary/ErrorBoundary.tsx` | Line 187: `color: '#fff'` - should be `t.colors.onBrand` |
| UI-002 | **Input component missing `accessibilityRole` and `accessibilityLabel`** | `src/core/components/ui/Input.tsx` | TextInput element has no `accessibilityRole="textbox"` or `accessibilityLabel` prop support |

---

## P1 - High Priority

| ID | Issue | Files | Evidence |
|----|-------|-------|----------|
| UI-003 | **PlayScreen adjustButtons lack touch target enforcement** | `src/features/redesign/screens/PlayScreen.tsx` | Line 488: `height: 56` - hardcoded, not using `getTouchTargetSize()` utility |
| UI-004 | **DiagnosticOverlay tabs have small touch targets** | `src/components/diagnostics/DiagnosticOverlay.tsx` | `paddingVertical: 8` results in ~30px tap height, below 44dp minimum |
| UI-005 | **WindDirectionCompass continuous animation battery drain** | `src/features/wind/components/compass/WindDirectionCompass.tsx` | Lines 100-108: Animated.loop runs indefinitely without reduce motion check |
| UI-006 | **OnboardingFlow uses FlatList instead of FlashList** | `src/components/onboarding/OnboardingFlow.tsx` | Line 36: Uses deprecated FlatList for paging |
| UI-007 | **GlassCard non-interactive variant missing accessibilityRole** | `src/core/components/ui/GlassCard.tsx` | Non-pressable GlassCard has no `accessibilityRole="region"` or similar |

---

## P2 - Medium Priority

| ID | Issue | Files | Evidence |
|----|-------|-------|----------|
| UI-008 | **Hardcoded rgba values in Wind compass** | `src/features/wind/components/compass/WindDirectionCompass.tsx`, `src/features/wind/components/compass/LockButton.tsx` | Lines 67-74, 44: `rgba(220, 38, 38, 0.15)` etc. should use token alpha variants |
| UI-009 | **Slider thumb pulse animation runs when reduce motion enabled** | `src/core/components/ui/slider.tsx` | Lines 137-152: Only skips if `reduceMotion`, but already runs `useEffect` |
| UI-010 | **PlayScreen StyleSheet uses hardcoded values** | `src/features/redesign/screens/PlayScreen.tsx` | Lines 475-540: Hardcoded spacing values like `gap: 8`, `fontSize: 32` instead of tokens |
| UI-011 | **Tab bar icons missing accessibilityHint** | `app/(tabs-redesign)/_layout.tsx` | TabBarIcon lacks hints explaining tab purpose |
| UI-012 | **MetricTile non-interactive missing region role** | `src/core/components/ui/MetricTile.tsx` | Lines 305: Only `accessibilityLabel` set, missing `accessibilityRole` for non-button variant |

---

## P3 - Low Priority / Polish

| ID | Issue | Files | Evidence |
|----|-------|-------|----------|
| UI-013 | **ConditionChip accessibility label is redundant** | `src/features/calculator/screen.tsx` | Line 283: `accessibilityLabel={\`${value}\`}` - should include context like "Temperature: 72°F" |
| UI-014 | **EmptyState button default text "Get Started" generic** | `src/components/EmptyState.tsx` | Line 84: `actionLabel = 'Get Started'` - context-specific defaults would improve UX |
| UI-015 | **Settings club list not virtualized** | `src/features/settings/screen.tsx` | Maps over `clubs` array directly in render - could use FlashList for large lists |
| UI-016 | **Compass announces lock state but not heading changes** | `src/features/wind/components/compass/WindDirectionCompass.tsx` | Lines 121-126: Only lock/unlock announced, heading changes silent |

---

## Quick Wins (≤10)

1. **Fix ErrorBoundary button text color** → Replace `color: '#fff'` with `color: t.colors.onBrand` at line 187
2. **Add accessibilityRole to Input component** → Add `accessibilityRole="textbox"` to TextInput
3. **Use getTouchTargetSize in PlayScreen** → Replace hardcoded `height: 56` with `getTouchTargetSize(56)`
4. **Add reduce motion check to compass animation** → Wrap Animated.loop in `if (!reduceMotion)` guard
5. **Add accessibilityHint to tab icons** → e.g., `accessibilityHint="Calculate shot adjustments"`
6. **Replace hardcoded spacing in PlayScreen** → Use `tokens.spacing.lg` instead of `24`
7. **Add accessibilityRole="region" to GlassCard** → For non-interactive cards
8. **Increase DiagnosticOverlay tab padding** → Change `paddingVertical: 8` to `paddingVertical: 14` (44dp)
9. **Improve ConditionChip labels** → Change to include context: `Temperature: ${value}`
10. **Add accessibilityRole to MetricTile** → Set `accessibilityRole="text"` for non-button variant

---

## Risks / Dependencies

| Risk | Impact | Mitigation |
|------|--------|------------|
| **FlashList migration** | Breaking change if OnboardingFlow relies on FlatList-specific APIs | Test pagination behavior thoroughly |
| **Continuous animations** | Battery drain on older devices, accessibility complaints | Add global animation toggle in settings |
| **Token refactoring in PlayScreen** | Large file with many hardcoded values | Incremental migration, test visual regression |

---

```json
{
  "issues": [
    {
      "id": "UI-001",
      "priority": "P0",
      "title": "ErrorBoundary button text uses hardcoded color",
      "screen": "Error fallback",
      "files": ["src/components/error-boundary/ErrorBoundary.tsx"],
      "evidence": ["Line 187: color: '#fff'", "Should use t.colors.onBrand for theme consistency"],
      "whyItMatters": "Hardcoded white text may have insufficient contrast in light mode or future theme changes, breaking WCAG AA compliance",
      "recommendedFix": "Replace `color: '#fff'` with `color: t.colors.onBrand` to use the design system semantic color",
      "acceptanceCriteria": [
        "Button text uses onBrand token color",
        "Text remains readable in both light and dark modes",
        "Contrast ratio meets WCAG AA 4.5:1"
      ],
      "effort": "S",
      "category": "consistency"
    },
    {
      "id": "UI-002",
      "priority": "P0",
      "title": "Input component missing accessibilityRole and accessibilityLabel",
      "screen": "Various (Settings, forms)",
      "files": ["src/core/components/ui/Input.tsx"],
      "evidence": ["TextInput has no accessibilityRole prop", "No accessibilityLabel support in props interface"],
      "whyItMatters": "Screen readers cannot properly identify or describe text input fields, making forms unusable for visually impaired users",
      "recommendedFix": "Add accessibilityRole='textbox' to TextInput and expose accessibilityLabel in InputProps interface",
      "acceptanceCriteria": [
        "Input has accessibilityRole='textbox'",
        "accessibilityLabel prop is forwarded to TextInput",
        "Screen reader announces input purpose correctly"
      ],
      "effort": "S",
      "category": "a11y"
    },
    {
      "id": "UI-003",
      "priority": "P1",
      "title": "PlayScreen adjustButtons use hardcoded dimensions",
      "screen": "PlayScreen (Shot)",
      "files": ["src/features/redesign/screens/PlayScreen.tsx"],
      "evidence": ["Line 488: height: 56", "Not using getTouchTargetSize() utility"],
      "whyItMatters": "Bypasses the design system's responsive touch target calculation, could break on devices with accessibility scaling",
      "recommendedFix": "Import getTouchTargetSize from utils/responsive and use getTouchTargetSize(56) instead of hardcoded 56",
      "acceptanceCriteria": [
        "adjustButton uses getTouchTargetSize()",
        "Touch target scales appropriately with system font size",
        "Minimum 44dp maintained at all scale factors"
      ],
      "effort": "S",
      "category": "a11y"
    },
    {
      "id": "UI-004",
      "priority": "P1",
      "title": "DiagnosticOverlay tabs have insufficient touch targets",
      "screen": "Diagnostic Overlay",
      "files": ["src/components/diagnostics/DiagnosticOverlay.tsx"],
      "evidence": ["tab style: paddingVertical: 8", "Results in ~30px tap height, below 44dp minimum"],
      "whyItMatters": "Users with motor impairments or in field conditions (gloves, outdoor) will struggle to tap tabs accurately",
      "recommendedFix": "Increase paddingVertical to 14 or use minHeight: 44 to ensure WCAG-compliant touch targets",
      "acceptanceCriteria": [
        "Tab buttons have minimum 44dp touch height",
        "Tab bar remains visually balanced",
        "All tabs equally tappable"
      ],
      "effort": "S",
      "category": "a11y"
    },
    {
      "id": "UI-005",
      "priority": "P1",
      "title": "WindDirectionCompass continuous animation ignores reduce motion",
      "screen": "Wind Calculator",
      "files": ["src/features/wind/components/compass/WindDirectionCompass.tsx"],
      "evidence": ["Lines 100-108: Animated.loop runs unconditionally", "No reduceMotion check before starting animation"],
      "whyItMatters": "Users with vestibular disorders or motion sensitivity will experience discomfort; also causes unnecessary battery drain",
      "recommendedFix": "Add reduce motion check: if (reduceMotion) { pulseAnim.setValue(1); return; } before Animated.loop",
      "acceptanceCriteria": [
        "Animation respects system reduce motion setting",
        "Compass still renders correctly without animation",
        "Battery usage reduced when animations disabled"
      ],
      "effort": "S",
      "category": "a11y"
    },
    {
      "id": "UI-006",
      "priority": "P1",
      "title": "OnboardingFlow uses FlatList instead of FlashList",
      "screen": "Onboarding",
      "files": ["src/components/onboarding/OnboardingFlow.tsx"],
      "evidence": ["Line 36: import FlatList", "Line 371: <FlatList for horizontal paging"],
      "whyItMatters": "FlashList provides better performance and memory efficiency, especially important during onboarding when first impressions matter",
      "recommendedFix": "Replace FlatList with FlashList from @shopify/flash-list, add estimatedItemSize prop",
      "acceptanceCriteria": [
        "FlashList renders onboarding steps",
        "Horizontal paging still works correctly",
        "No visual regression in step transitions"
      ],
      "effort": "M",
      "category": "performance"
    },
    {
      "id": "UI-007",
      "priority": "P1",
      "title": "GlassCard non-interactive variant missing accessibilityRole",
      "screen": "Various (Calculator, Wind, Settings)",
      "files": ["src/core/components/ui/GlassCard.tsx"],
      "evidence": ["Non-pressable branch returns Animated.View without accessibilityRole", "Only pressable variant has role='button'"],
      "whyItMatters": "Screen readers cannot identify card regions, making content structure unclear for visually impaired users",
      "recommendedFix": "Add accessibilityRole='region' or 'group' to non-interactive GlassCard wrapper",
      "acceptanceCriteria": [
        "Non-interactive GlassCard has accessibilityRole",
        "Screen reader announces card as content region",
        "Maintains existing behavior for pressable cards"
      ],
      "effort": "S",
      "category": "a11y"
    },
    {
      "id": "UI-008",
      "priority": "P2",
      "title": "Hardcoded rgba values in Wind compass components",
      "screen": "Wind Calculator",
      "files": ["src/features/wind/components/compass/WindDirectionCompass.tsx", "src/features/wind/components/compass/LockButton.tsx"],
      "evidence": ["Line 67-74: rgba(220, 38, 38, 0.15) for headwind", "Line 44 LockButton: rgba(255,255,255,0.12) ripple"],
      "whyItMatters": "Bypasses design token system, making theme changes inconsistent and increasing maintenance burden",
      "recommendedFix": "Use token alpha variants: t.colors.dangerBackgroundAlpha, t.colors.successBackgroundAlpha, t.colors.ripple",
      "acceptanceCriteria": [
        "All rgba values replaced with token references",
        "Visual appearance unchanged",
        "Colors update correctly with theme changes"
      ],
      "effort": "M",
      "category": "consistency"
    },
    {
      "id": "UI-009",
      "priority": "P2",
      "title": "Slider thumb pulse animation setup runs despite reduce motion",
      "screen": "Various (Calculator, Wind)",
      "files": ["src/core/components/ui/slider.tsx"],
      "evidence": ["Lines 137-152: useEffect runs Animated.loop", "Conditional only sets value, loop still starts briefly"],
      "whyItMatters": "Animation briefly flickers before being stopped, potentially causing discomfort for sensitive users",
      "recommendedFix": "Move reduceMotion check to before withRepeat call: if (reduceMotion) return; before animation setup",
      "acceptanceCriteria": [
        "No animation code runs when reduce motion enabled",
        "useEffect cleanup properly cancels animation",
        "No visual flicker on mount"
      ],
      "effort": "S",
      "category": "a11y"
    },
    {
      "id": "UI-010",
      "priority": "P2",
      "title": "PlayScreen StyleSheet uses hardcoded spacing and typography",
      "screen": "PlayScreen (Shot)",
      "files": ["src/features/redesign/screens/PlayScreen.tsx"],
      "evidence": ["Line 475: marginBottom: 24", "Line 482: fontSize: 32", "Line 490: gap: 16"],
      "whyItMatters": "Inconsistent with design system tokens, making global style updates impossible and increasing visual inconsistency risk",
      "recommendedFix": "Import tokens from useRedesignTheme and replace hardcoded values with tokens.spacing.lg, tokens.fontSize['3xl'], etc.",
      "acceptanceCriteria": [
        "All hardcoded values use token references",
        "Visual appearance unchanged",
        "Styles respond to theme changes"
      ],
      "effort": "M",
      "category": "consistency"
    },
    {
      "id": "UI-011",
      "priority": "P2",
      "title": "Tab bar icons missing accessibilityHint",
      "screen": "Tab Navigation",
      "files": ["app/(tabs-redesign)/_layout.tsx"],
      "evidence": ["TabBarIcon components have no accessibilityHint prop", "Users don't know what each tab does before selecting"],
      "whyItMatters": "Screen reader users cannot preview tab content, forcing trial-and-error navigation",
      "recommendedFix": "Add accessibilityHint to each tab icon describing its purpose: 'Calculate shot adjustments', 'Analyze wind conditions', 'Manage clubs and settings'",
      "acceptanceCriteria": [
        "Each tab has descriptive accessibilityHint",
        "Hints are concise but informative",
        "Screen reader announces hint on focus"
      ],
      "effort": "S",
      "category": "a11y"
    },
    {
      "id": "UI-012",
      "priority": "P2",
      "title": "MetricTile non-interactive missing semantic role",
      "screen": "Home, Calculator",
      "files": ["src/core/components/ui/MetricTile.tsx"],
      "evidence": ["Line 305: Only accessibilityLabel set for non-button", "Missing accessibilityRole for semantic structure"],
      "whyItMatters": "Screen readers treat tile as generic view, losing semantic meaning of metric data",
      "recommendedFix": "Add accessibilityRole='text' or 'summary' to non-interactive MetricTile Animated.View",
      "acceptanceCriteria": [
        "Non-interactive tiles have appropriate role",
        "Screen reader announces tile as text content",
        "Maintains button role for interactive tiles"
      ],
      "effort": "S",
      "category": "a11y"
    },
    {
      "id": "UI-013",
      "priority": "P3",
      "title": "ConditionChip accessibility label lacks context",
      "screen": "Shot Calculator",
      "files": ["src/features/calculator/screen.tsx"],
      "evidence": ["Line 283: accessibilityLabel={`${value}`}", "Just says '72°F' not 'Temperature: 72°F'"],
      "whyItMatters": "Screen reader users hear raw values without understanding what metric they represent",
      "recommendedFix": "Pass label context to ConditionChip and include in accessibilityLabel: `${label}: ${value}`",
      "acceptanceCriteria": [
        "Accessibility label includes metric name",
        "Screen reader announces 'Temperature: 72 degrees Fahrenheit'",
        "All condition chips have contextual labels"
      ],
      "effort": "S",
      "category": "a11y"
    },
    {
      "id": "UI-014",
      "priority": "P3",
      "title": "EmptyState default actionLabel is generic",
      "screen": "Various empty states",
      "files": ["src/components/EmptyState.tsx"],
      "evidence": ["Line 84: actionLabel = 'Get Started'", "Same text regardless of context"],
      "whyItMatters": "Generic call-to-action reduces clarity and conversion; users don't know what 'Get Started' will do",
      "recommendedFix": "Remove default value, require actionLabel when onAction is provided, or use context-specific defaults",
      "acceptanceCriteria": [
        "Each EmptyState has specific actionLabel",
        "Labels describe the action: 'Add First Club', 'Enable Location'",
        "TypeScript warns if actionLabel missing with onAction"
      ],
      "effort": "S",
      "category": "ux"
    },
    {
      "id": "UI-015",
      "priority": "P3",
      "title": "Settings club list not virtualized",
      "screen": "Settings",
      "files": ["src/features/settings/screen.tsx"],
      "evidence": ["clubs.map() renders all clubs directly", "No virtualization for potentially long lists"],
      "whyItMatters": "Users with many custom clubs may experience scroll lag on lower-end devices",
      "recommendedFix": "Replace map with FlashList if club count exceeds threshold (e.g., 20+), or use conditional virtualization",
      "acceptanceCriteria": [
        "Club list performs well with 50+ items",
        "Scroll remains smooth on mid-range devices",
        "Visual appearance unchanged"
      ],
      "effort": "M",
      "category": "performance"
    },
    {
      "id": "UI-016",
      "priority": "P3",
      "title": "Compass announces lock state but not heading changes",
      "screen": "Wind Calculator",
      "files": ["src/features/wind/components/compass/WindDirectionCompass.tsx"],
      "evidence": ["Lines 121-126: AccessibilityInfo.announceForAccessibility for lock only", "Heading changes silent"],
      "whyItMatters": "Screen reader users relying on audio cannot track heading changes during alignment",
      "recommendedFix": "Add debounced heading announcement when heading changes significantly (e.g., >10°)",
      "acceptanceCriteria": [
        "Heading announced when changes by 10+ degrees",
        "Announcements debounced to avoid spam",
        "Optional setting to disable heading announcements"
      ],
      "effort": "M",
      "category": "a11y"
    }
  ]
}
```
