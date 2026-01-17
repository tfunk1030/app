# Cross-review of Audit A vs Audit B (UI/UX)

## Agreement summary
- Both audits correctly focus on **accessibility fundamentals** (roles/labels + touch target sizing) and **performance risks from non-virtualized lists**.
- Audit A is stronger on **specific, actionable findings** (clear file targets and concrete fixes).
- Audit B is stronger on identifying **PresetSelector list rendering** (`ScrollView` + `.map()`), which Audit A missed.

## Misses (neither audit caught)
1. **“System” theme mode is treated as “dark” in many components, causing inconsistent light/system UI behavior**
   - Root cause: `useThemeMode()` returns only `mode` (`'system'|'light'|'dark'`), but many components compute `isDark` as `mode === 'dark' || mode === 'system'`.
   - Evidence:
     - `src/theme/ThemeProvider.tsx` exposes `mode` but does not expose `effectiveScheme`.
     - Examples of problematic checks:
       - `src/core/components/ui/Input.tsx`
       - `src/core/components/ui/button.tsx`
       - `src/core/components/ui/BoldTabBar.tsx`
       - `src/components/EmptyState.tsx`
       - `src/components/PresetSelector.tsx`
       - `src/features/wind/screen.tsx`
   - Why it matters: in “system” mode on a **light** device scheme, components may still apply “dark” branches (ripples, surfaces, styling choices), diverging from the actual token palette.

2. **BoldTabBar light-mode active label likely fails WCAG contrast for text**
   - Evidence:
     - `src/core/components/ui/BoldTabBar.tsx` uses `fontSize: 11` for labels (not “large text”).
     - The file’s own comment cites light-mode contrast ~**3.63:1**, which is **below 4.5:1** for normal-size text.
   - Why it matters: tab labels are critical navigation text; this is an accessibility regression risk.

3. **ErrorBoundary “Try Again” Pressable lacks explicit accessibility semantics (role/hint)**
   - Evidence:
     - `src/components/error-boundary/ErrorBoundary.tsx` has `<Pressable ... onPress={resetError}>` with no `accessibilityRole` / hint.
   - Why it matters: the error screen is a key recovery path; it should be unambiguous to screen readers.

## Duplicates & merge proposals
1. **Touch target sizing**
   - Duplicate cluster:
     - Audit A: “PlayScreen adjustButtons…” (`src/features/redesign/screens/PlayScreen.tsx`)
     - Audit A: “DiagnosticOverlay tabs…” (`src/components/diagnostics/DiagnosticOverlay.tsx`)
     - Audit B: “Potential Small Touch Targets” (`src/features/wind/screen.tsx`, `src/components/PresetSelector.tsx`)
   - Merged wording:
     - **“Standardize touch target enforcement (≥48dp) + hitSlop for dense/icon controls across primary screens and tooling overlays.”**

2. **List rendering / virtualization**
   - Duplicate cluster:
     - Audit A: OnboardingFlow FlatList→FlashList (`src/components/onboarding/OnboardingFlow.tsx`)
     - Audit A: Settings clubs list virtualization (`src/features/settings/screen.tsx`)
     - Audit B: PresetSelector ScrollView+map→FlashList (`src/components/PresetSelector.tsx`)
   - Merged wording:
     - **“Virtualize/optimize lists that can grow (FlashList where appropriate); avoid ScrollView+map for unbounded data.”**

3. **Hardcoded styling vs tokens**
   - Duplicate-ish cluster:
     - Audit A: Compass `rgba(...)` and other literals (`src/features/wind/components/compass/WindDirectionCompass.tsx`, `.../LockButton.tsx`)
     - Audit A: PlayScreen hardcoded spacing/typography (`src/features/redesign/screens/PlayScreen.tsx`)
     - Audit B: Tailwind config hardcoded colors (`tailwind.config.js`)
   - Merged wording:
     - **“Reduce hardcoded styling: single-source tokens for colors/alpha and spacing/typography to prevent drift.”**

## Priority adjustments (P0–P3) with rationale
- **Downgrade Audit A “P0 Input missing accessibilityLabel support” → P2**
  - `src/core/components/ui/Input.tsx` defines `InputProps extends TextInputProps`, so `accessibilityLabel` is already pass-through-able; the missing part is **defaults / enforcement at call sites**, not type support.
- **Downgrade Audit A “P0 ErrorBoundary hardcoded #fff” → P2**
  - In `src/components/error-boundary/ErrorBoundary.tsx`, `styles.buttonText.color = '#fff'` is currently overridden by inline `{ color: t.colors.textPrimary }`. The real issue is **semantic correctness** (should likely be `t.colors.onBrand`) and removing dead styling, not a release blocker.
- **Downgrade Audit A DiagnosticOverlay touch targets P1 → P3**
  - `src/components/diagnostics/DiagnosticOverlay.tsx` is a debug overlay; prioritize touch target fixes in core user flows first.
- **Downgrade Audit A OnboardingFlow FlatList→FlashList P1 → P3**
  - `src/components/onboarding/OnboardingFlow.tsx` likely has a small, bounded list; FlashList conversion is optional unless perf issues are observed.
- **Drop/narrow Audit B “Missing roles on WindDirectionCompass”**
  - `src/features/wind/components/compass/LockButton.tsx` already provides `accessibilityRole`, label, hint, and hitSlop; `WindDirectionCompass.tsx` appears mostly non-interactive aside from the lock control.

## Top 10 actions (consolidated)
1. **P1** Fix “system mode treated as dark” pattern (introduce/use an *effective scheme* rather than `mode === 'system'` checks)  
   Files to start: `src/theme/ThemeProvider.tsx`, then update call sites like `src/core/components/ui/{button,Input,BoldTabBar}.tsx`, `src/components/{EmptyState,PresetSelector}.tsx`, `src/features/wind/screen.tsx`.
2. **P1** Make `WindDirectionCompass` continuous pulse respect reduce motion (and ensure loop stops cleanly)  
   File: `src/features/wind/components/compass/WindDirectionCompass.tsx`.
3. **P1** Fix BoldTabBar light-mode active label contrast for 11px text (don’t rely on 3:1 “component” threshold for text)  
   File: `src/core/components/ui/BoldTabBar.tsx`.
4. **P2** Virtualize PresetSelector list (replace `ScrollView` + `.map()` with `FlashList`)  
   File: `src/components/PresetSelector.tsx`.
5. **P2** Virtualize Settings club list if it can grow large (replace `.map()` with a virtualized list)  
   File: `src/features/settings/screen.tsx`.
6. **P2** Add semantic accessibility defaults where missing in shared UI primitives (e.g., non-pressable card regions)  
   File: `src/core/components/ui/GlassCard.tsx` (non-interactive branch).
7. **P2** Normalize ErrorBoundary recovery button: semantic text color (`onBrand`), remove dead `#fff`, and add `accessibilityRole`/hint  
   File: `src/components/error-boundary/ErrorBoundary.tsx`.
8. **P2** Standardize touch targets/hitSlop for dense controls (PlayScreen adjust controls + DiagnosticOverlay tabs + PresetSelector icon buttons)  
   Files: `src/features/redesign/screens/PlayScreen.tsx`, `src/components/diagnostics/DiagnosticOverlay.tsx`, `src/components/PresetSelector.tsx`.
9. **P3** Replace hardcoded compass color literals (`rgba(...)`, fixed hex in gradients/ripples) with tokenized alpha variants  
   Files: `src/features/wind/components/compass/WindDirectionCompass.tsx`, `src/features/wind/components/compass/LockButton.tsx`.
10. **P3** Improve screen reader clarity for condition chips (add context to labels)  
   File: `src/features/calculator/screen.tsx` (`ConditionChip`).

---

```json
{
  "add": [
    {
      "title": "Fix incorrect isDark detection when theme mode is 'system' (components treat 'system' as dark)",
      "priority": "P1",
      "files": [
        "src/theme/ThemeProvider.tsx",
        "src/core/components/ui/Input.tsx",
        "src/core/components/ui/button.tsx",
        "src/core/components/ui/BoldTabBar.tsx",
        "src/components/EmptyState.tsx",
        "src/components/PresetSelector.tsx",
        "src/features/wind/screen.tsx"
      ]
    },
    {
      "title": "BoldTabBar light-mode active label likely fails WCAG contrast for 11px text (comment cites ~3.63:1)",
      "priority": "P1",
      "files": [
        "src/core/components/ui/BoldTabBar.tsx"
      ]
    },
    {
      "title": "ErrorBoundary recovery action missing explicit accessibilityRole/hint",
      "priority": "P2",
      "files": [
        "src/components/error-boundary/ErrorBoundary.tsx"
      ]
    }
  ],
  "drop": [
    {
      "idOrTitle": "Audit A UI-009 Slider thumb pulse animation setup runs despite reduce motion",
      "reason": "In `src/core/components/ui/slider.tsx`, the pulse effect returns early when `reduceMotion` is true and cancels the animation in cleanup; this appears already handled."
    },
    {
      "idOrTitle": "Audit B UI-001 Missing Accessibility Roles on Custom Controls",
      "reason": "Key interactions already include explicit roles/labels (e.g., `src/features/wind/components/compass/LockButton.tsx` and `src/features/wind/screen.tsx`). `WindDirectionCompass.tsx` appears to have limited interactive surface beyond the lock button."
    },
    {
      "idOrTitle": "Audit B UI-005 Tab Bar Content Overlap Risk (absolute positioning)",
      "reason": "`src/core/components/ui/BoldTabBar.tsx` is not absolutely positioned; overlap should be validated per screen/padding patterns rather than assumed from positioning."
    }
  ],
  "merge": [
    {
      "items": [
        "Audit A UI-003 PlayScreen adjustButtons use hardcoded dimensions",
        "Audit A UI-004 DiagnosticOverlay tabs have insufficient touch targets",
        "Audit B UI-002 Potential Small Touch Targets"
      ],
      "mergedTitle": "Standardize touch target enforcement (≥48dp) and hitSlop for dense/icon controls",
      "priority": "P2"
    },
    {
      "items": [
        "Audit A UI-006 OnboardingFlow uses FlatList instead of FlashList",
        "Audit A UI-015 Settings club list not virtualized",
        "Audit B UI-003 Use of ScrollView for List Data"
      ],
      "mergedTitle": "Virtualize/optimize lists that can grow (FlashList where appropriate); avoid ScrollView+map for unbounded data",
      "priority": "P2"
    },
    {
      "items": [
        "Audit A UI-008 Hardcoded rgba values in Wind compass components",
        "Audit A UI-010 PlayScreen StyleSheet uses hardcoded spacing and typography",
        "Audit B UI-004 Hardcoded Colors in Tailwind Config"
      ],
      "mergedTitle": "Reduce hardcoded styling: single-source tokens for colors/alpha and spacing/typography to prevent drift",
      "priority": "P3"
    }
  ],
  "reprioritize": [
    {
      "idOrTitle": "Audit A UI-001 ErrorBoundary button text uses hardcoded color",
      "from": "P0",
      "to": "P2",
      "reason": "In `src/components/error-boundary/ErrorBoundary.tsx`, the hardcoded `#fff` is currently overridden by inline `{ color: t.colors.textPrimary }`. The remaining work is semantic cleanup (likely `onBrand`) rather than a blocker."
    },
    {
      "idOrTitle": "Audit A UI-002 Input component missing accessibilityRole and accessibilityLabel",
      "from": "P0",
      "to": "P2",
      "reason": "`InputProps` extends `TextInputProps` in `src/core/components/ui/Input.tsx`, so consumers can pass `accessibilityLabel` today. Improvements are defaults/consistency and ensuring call sites provide labels."
    },
    {
      "idOrTitle": "Audit A UI-004 DiagnosticOverlay tabs have insufficient touch targets",
      "from": "P1",
      "to": "P3",
      "reason": "`src/components/diagnostics/DiagnosticOverlay.tsx` is a debug overlay; prioritize primary user flows before tooling polish."
    },
    {
      "idOrTitle": "Audit A UI-006 OnboardingFlow uses FlatList instead of FlashList",
      "from": "P1",
      "to": "P3",
      "reason": "`src/components/onboarding/OnboardingFlow.tsx` likely renders a small, bounded dataset; FlashList is optional unless measured perf issues exist."
    },
    {
      "idOrTitle": "Audit B UI-004 Hardcoded Colors in Tailwind Config",
      "from": "P2",
      "to": "P3",
      "reason": "Single-sourcing colors is valuable, but it’s primarily an architectural consistency task unless it’s already causing theme drift."
    }
  ]
}
```
