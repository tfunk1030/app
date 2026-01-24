# Parallel Codebase Analysis Plan

**Project:** AICaddyPro
**Date:** 2026-01-18
**Commit:** ce3c2e9
**Purpose:** Comprehensive codebase review via parallel agent dispatch

---

## Overview

This plan defines 6 parallel analysis tracks that can run concurrently. Each track has a specific focus area and produces actionable findings.

---

## Track 1: Architecture & Dependency Analysis

**Agent:** `scout` or `architect`
**Time Budget:** ~3 min
**Focus:** Structural integrity and dependency health

### Tasks
1. Map the provider hierarchy in `app/_layout.tsx` and `src/core/context/AppProvider.tsx`
2. Identify circular dependencies between modules
3. Analyze import graph for:
   - `src/features/` → `src/core/` dependencies
   - `src/services/` → `src/lib/` dependencies
4. Check for orphaned files (not imported anywhere)
5. Validate that feature boundaries are respected (no cross-feature imports)

### Key Files
- `app/_layout.tsx`
- `src/core/context/AppProvider.tsx`
- `src/features/*/index.ts`
- `src/services/**/*.ts`

### Output
```yaml
findings:
  circular_deps: []
  orphaned_files: []
  boundary_violations: []
  provider_depth: number
  recommendations: []
```

---

## Track 2: Accessibility Audit

**Agent:** `critic` or `rams`
**Time Budget:** ~3 min
**Focus:** WCAG 2.1 compliance and React Native a11y

### Tasks
1. Scan all `Pressable`, `TouchableOpacity` for `accessibilityRole` and `accessibilityLabel`
2. Verify touch targets meet 48dp minimum (check explicit sizes or `hitSlop`)
3. Audit dynamic content for `AccessibilityInfo.announceForAccessibility`
4. Check `useReducedMotion` usage in animated components
5. Verify screen reader navigation flow on key screens

### Key Files
- `src/features/wind/screen.tsx`
- `src/features/wind/components/compass/*.tsx`
- `src/core/components/ui/button.tsx`
- `src/core/components/ui/slider.tsx`
- `src/hooks/useReduceMotion.ts`

### Checklist (from `.claude/rules/react-native-a11y.md`)
- [ ] Interactive elements have `accessibilityRole="button"`
- [ ] All interactive elements have `accessibilityLabel` with full context
- [ ] Touch targets ≥48dp
- [ ] Loading states announce with `AccessibilityInfo`
- [ ] Sliders have `accessibilityValue` with min/max/now

### Output
```yaml
findings:
  missing_labels: [{file, line, element}]
  small_touch_targets: [{file, line, size}]
  missing_announcements: [{file, context}]
  reduce_motion_issues: []
  score: number  # out of 100
```

---

## Track 3: Animation & Performance Review

**Agent:** `profiler` or `critic`
**Time Budget:** ~2 min
**Focus:** Animation compliance and performance

### Tasks
1. Verify all animations use `react-native-reanimated` (NOT `Animated` from react-native)
2. Check animation durations comply with rules (fast=150ms, normal=250ms, max=300ms)
3. Identify animations missing `useReducedMotion` fallback
4. Look for expensive computations in render paths
5. Check for proper memoization (`useMemo`, `useCallback`, `React.memo`)

### Key Files
- `src/features/wind/components/compass/WindArrow.tsx`
- `src/features/wind/components/compass/WindDirectionCompass.tsx`
- `src/features/wind/components/compass/LockButton.tsx`
- `src/utils/animations.ts`
- `src/hooks/useAccessibility.ts`

### Patterns to Find
```typescript
// BAD: Old Animated API
import { Animated } from 'react-native';

// GOOD: Reanimated
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';
```

### Output
```yaml
findings:
  old_animated_api: [{file, line}]
  long_animations: [{file, duration}]
  missing_reduce_motion: [{file, animation}]
  render_bottlenecks: []
  memoization_missing: []
```

---

## Track 4: Design System Compliance

**Agent:** `critic` or `judge`
**Time Budget:** ~2 min
**Focus:** Token usage and theming consistency

### Tasks
1. Find hardcoded colors (hex values not from tokens)
2. Find hardcoded spacing (magic numbers not from spacing scale)
3. Verify dark mode support (check for theme-aware token usage)
4. Check for direct style objects vs token-based styles
5. Validate font usage (should use design system fonts)

### Key Files
- `src/theme/tokens.ts` (source of truth)
- `src/features/wind/screen.tsx`
- `src/features/wind/components/compass/styles.ts`
- `src/core/components/ui/*.tsx`

### Patterns to Find
```typescript
// BAD: Hardcoded
backgroundColor: '#1E293B'
padding: 16

// GOOD: Token-based
backgroundColor: t.colors.surface
padding: t.spacing.md
```

### Output
```yaml
findings:
  hardcoded_colors: [{file, line, value}]
  hardcoded_spacing: [{file, line, value}]
  missing_dark_mode: [{file, component}]
  style_consistency_issues: []
  recommendations: []
```

---

## Track 5: TypeScript & Code Quality

**Agent:** `critic` or `qlty-check`
**Time Budget:** ~2 min
**Focus:** Type safety and code quality

### Tasks
1. Find `any` type usage (should be `unknown` or proper types)
2. Check for missing interface definitions on component props
3. Verify proper error handling patterns
4. Look for console.log statements (should use LogManager)
5. Check for proper async/await error handling

### Commands
```bash
# Find any types
grep -r ":\s*any" src/ --include="*.ts" --include="*.tsx"

# Find console.log
grep -r "console\.(log|warn|error)" src/ --include="*.ts" --include="*.tsx"

# TypeScript check
npx tsc --noEmit
```

### Key Files
- All `src/**/*.tsx` and `src/**/*.ts`
- Focus on `src/services/` and `src/features/`

### Output
```yaml
findings:
  any_types: [{file, line}]
  missing_interfaces: [{file, component}]
  unhandled_errors: [{file, line}]
  console_logs: [{file, line}]
  ts_errors: []
```

---

## Track 6: Test Coverage & Verification

**Agent:** `arbiter` or `test`
**Time Budget:** ~3 min
**Focus:** Test health and coverage gaps

### Tasks
1. Run existing tests and capture results
2. Identify untested critical paths
3. Check Storybook story coverage for UI components
4. Verify visual test baselines exist
5. Identify flaky or slow tests

### Commands
```bash
# Run wind tests
npm test wind-colors

# Check for test files
find src -name "*.test.ts" -o -name "*.test.tsx"

# Check for stories
find src -name "*.stories.tsx"
```

### Key Files
- `src/features/wind/utils/__tests__/wind-colors.test.ts`
- `src/features/wind/components/compass/*.stories.tsx`
- `e2e/visual.spec.ts`
- `playwright.config.ts`

### Coverage Gaps to Check
| Component | Has Tests | Has Story |
|-----------|-----------|-----------|
| WindArrow | ? | ? |
| WindDirectionCompass | ? | ? |
| LockButton | ? | ? |
| Slider | ? | ? |
| Button | ? | ? |

### Output
```yaml
findings:
  test_results:
    passed: number
    failed: number
    skipped: number
  coverage_gaps: [{component, missing}]
  story_coverage: [{component, has_story}]
  flaky_tests: []
  slow_tests: [{test, duration}]
```

---

## Execution Plan

### Phase 1: Parallel Dispatch (All 6 tracks simultaneously)

```
┌─────────────────────────────────────────────────────────────┐
│                    PARALLEL EXECUTION                       │
├─────────────┬─────────────┬─────────────┬─────────────────────┤
│ Track 1     │ Track 2     │ Track 3     │ Track 4           │
│ Architecture│ A11y Audit  │ Animation   │ Design System     │
│ ~3 min      │ ~3 min      │ ~2 min      │ ~2 min            │
├─────────────┼─────────────┼─────────────┼─────────────────────┤
│ Track 5     │ Track 6     │             │                   │
│ TypeScript  │ Test Coverage│            │                   │
│ ~2 min      │ ~3 min      │             │                   │
└─────────────┴─────────────┴─────────────┴─────────────────────┘
```

### Phase 2: Synthesis

After all tracks complete:
1. Aggregate findings into unified report
2. Prioritize issues by severity (P0/P1/P2)
3. Cross-reference findings (e.g., a11y issues that are also design system violations)
4. Generate actionable improvement plan

---

## Agent Prompts

### Track 1 Prompt (Architecture)
```
Analyze the AICaddyPro codebase architecture:
1. Map provider hierarchy from app/_layout.tsx
2. Find circular dependencies in src/
3. Check feature boundary violations (cross-feature imports)
4. List orphaned files not imported anywhere
Return findings as YAML.
```

### Track 2 Prompt (Accessibility)
```
Audit AICaddyPro for React Native accessibility:
1. Find Pressable/TouchableOpacity missing accessibilityRole or accessibilityLabel
2. Check touch targets for 48dp minimum size
3. Verify useReducedMotion usage in animated components
4. Check for announceForAccessibility on dynamic content
Focus on src/features/wind/. Return findings as YAML with file:line locations.
```

### Track 3 Prompt (Animation)
```
Review animations in AICaddyPro:
1. Find any use of react-native Animated API (should use reanimated)
2. Check animation durations (max 300ms per .ralphy/config.yaml)
3. Find animations missing useReducedMotion fallback
Focus on src/features/wind/components/compass/. Return findings as YAML.
```

### Track 4 Prompt (Design System)
```
Audit design system compliance in AICaddyPro:
1. Find hardcoded colors (hex values not from tokens.ts)
2. Find hardcoded spacing (numbers not from spacing scale)
3. Check for missing dark mode support
Reference src/theme/tokens.ts as source of truth. Return findings as YAML.
```

### Track 5 Prompt (TypeScript)
```
Check TypeScript quality in AICaddyPro:
1. Find 'any' type usage (should use unknown or proper types)
2. Find console.log/warn/error (should use LogManager)
3. Check for missing interface definitions on props
4. Run npx tsc --noEmit for type errors
Return findings as YAML.
```

### Track 6 Prompt (Tests)
```
Analyze test coverage in AICaddyPro:
1. Run npm test wind-colors and report results
2. List components without test files
3. List UI components without Storybook stories
4. Check if visual test baselines exist in test-results/
Return findings as YAML.
```

---

## Success Criteria

| Track | Success Threshold |
|-------|-------------------|
| Architecture | No circular deps, <5 boundary violations |
| Accessibility | Score ≥90/100, no P0 issues |
| Animation | 100% reanimated, all durations ≤300ms |
| Design System | <10 hardcoded values |
| TypeScript | 0 `any` types, 0 TS errors |
| Test Coverage | All 41 wind tests pass, >80% story coverage |

---

## Output Location

All agent outputs should be written to:
```
thoughts/shared/analysis/2026-01-18/
├── track-1-architecture.yaml
├── track-2-accessibility.yaml
├── track-3-animation.yaml
├── track-4-design-system.yaml
├── track-5-typescript.yaml
├── track-6-tests.yaml
└── synthesis-report.md
```
