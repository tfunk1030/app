# Consolidated UI/UX Execution Plan (AICaddyPro)

## Executive summary
This plan merges the audits/cross‑reviews into a single, PR-sized execution sequence prioritized for **release correctness + accessibility**:
1. **P0:** Fix **System theme** bug (treating `system` as always dark) and make theme react to OS changes.
2. **P0:** Make the **Wind flow resilient** (surface calculation failures + retry path).
3. **P1:** Defer **Location permission** until needed and make forecast/location errors **actionable** (request/open settings).
4. **P1:** Ship **core screen accessibility** upgrades (Home + Calculator) and improve key control semantics (Slider/Input).
5. **P1→P2:** Enforce **48dp touch targets** and finish **tokens-only** cleanup in user-facing overlays; keep dev-only DiagnosticOverlay later.

---

## Consolidated issue list (deduped)

| Consolidated ID | Priority | Title | Primary files | Notes / dedupe resolution |
|---|---:|---|---|---|
| THEME-001 | P0 | `system` mode treated as always dark (`mode === 'system'`) | `src/theme/ThemeProvider.tsx`, many UI files listed in PR‑1 | Root cause for widespread light/dark mismatches. |
| THEME-002 | P1 | Theme does not update live on OS appearance change | `src/theme/ThemeProvider.tsx` | Add listener / state-driven scheme. Often implemented with THEME‑001. |
| WIND-001 | P0 | Wind calculation failures must be visible + recoverable | `src/features/wind/screen.tsx`, `src/features/wind/hooks/useWindCalculator.ts` | From cross-review: treat as functional blocker (avoid silent failure). |
| PERM-001 | P1 | Location permission requested on app launch (no context) | `app/_layout.tsx` | Defer until location-dependent feature. |
| WIND-002 | P2 | Wind forecast errors are non-actionable (no permission/settings CTA) | `src/features/wind/components/WindHourlyForecastBar.tsx`, `src/features/wind/context/sensor-data.tsx` | Pair with PERM‑001. |
| A11Y-001 | P1 | Home screen lacks accessible semantics (labels/headers/loading) | `src/features/home/screen.tsx`, `src/core/components/ui/MetricTile.tsx` | Keep high priority; cross-review suggests P1. |
| A11Y-002 | P1 | Calculator ConditionChip labels missing context | `src/features/calculator/screen.tsx` | Make labels include metric name + value. |
| A11Y-003 | P1 | Slider needs SR semantics (value + unit) + hints | `src/core/components/ui/slider.tsx` | Merged from both audits. |
| A11Y-004 | P1 | Input needs accessibility contract + error semantics | `src/core/components/ui/Input.tsx` | Prefer dev-time enforcement + accessible error linkage. |
| TOUCH-001 | P1 | Minimum touch target should be ≥48dp (not 44) | `src/utils/responsive.ts` | Audit + fix dense layouts. |
| TOKENS-001 | P2 | Hardcoded colors in user-facing components (tokens-only rule) | `src/components/ContextualOverlay.tsx`, `src/components/error-boundary/ErrorBoundary.tsx`, `components/EmptyState.tsx` | Split dev-only overlays later. |
| DEV-001 | P2 | DiagnosticOverlay missing a11y props + tokens-only | `src/components/diagnostics/DiagnosticOverlay.tsx` | Cross-review: downgrade since developer tool. |
| ONBOARD-001 | P2 | Onboarding lacks SR-friendly progress/pagination semantics | `src/components/onboarding/OnboardingFlow.tsx`, `src/components/onboarding/OnboardingStep.tsx` | Add “Step X of Y” semantics + announcements. |
| COMPASS-001 | P2 | Compass lock announcements lack context; remaining hardcoded colors | `src/features/wind/components/compass/WindDirectionCompass.tsx`, `src/features/wind/context/sensor-data.tsx` | Bundle with Wind polish PR. |
| ARCH-001 | P3 | Legacy vs redesign theme systems diverge (system/outdoor inconsistency) | `src/theme/ThemeProvider.tsx`, `src/theme/redesign/RedesignThemeProvider.tsx`, `app/*` | Requires explicit decision; schedule late. |
| RESOLVED | — | ResultCard accessibility missing labels | `src/components/redesign/ResultCard.tsx` | **False positive**; file already sets `accessibilityRole`/`accessibilityLabel`. |

---

## Proposed PR sequence

### PR-1 — **Fix theme correctness for `system` mode and centralize `isDark`** (P0)
**Goal:** Make `system` follow OS (light stays light), and remove app-wide ad-hoc `mode === 'system'` checks.

**Files touched (core + mechanical replacements)**
- `src/theme/ThemeProvider.tsx`
- `src/core/context/theme.tsx` (currently defaults system → dark per grep)
- Replace `const isDark = mode === 'dark' || mode === 'system'` in:
  - `components/EmptyState.tsx`
  - `components/ContextualOverlay.tsx`
  - `components/PresetSelector.tsx`
  - `components/onboarding/OnboardingFlow.tsx`
  - `components/onboarding/OnboardingStep.tsx`
  - `src/features/home/screen.tsx`
  - `src/features/wind/screen.tsx`
  - `src/features/calculator/screen.tsx`
  - `src/core/components/ui/{MetricTile,FloatingTabBar,GradientHero,slider,GlassCard,button,Input,BoldTabBar,SectionHeader,card,BoldCard}.tsx`
  - (and any other grep hits)

**Tasks**
- [ ] Extend theme context to expose `effectiveScheme` and/or `isDark` (derived from `mode` + OS scheme).
- [ ] Subscribe to OS appearance changes (e.g., `Appearance.addChangeListener`) so `mode='system'` updates live.
- [ ] Replace all `mode === 'system'` checks in UI with `isDark`/`effectiveScheme` from theme.
- [ ] Add a small unit test for the theme derivation helper (system+OS light → light; system+OS dark → dark).

**Acceptance criteria**
- With theme mode set to `system`:
  - OS light ⇒ app renders light tokens.
  - OS dark ⇒ app renders dark tokens.
- Changing OS appearance while app is running updates UI without restart.
- No remaining instances of `mode === 'dark' || mode === 'system'` in app UI code.

---

### PR-2 — **Wind flow: surface failures + add retry** (P0)
**Goal:** Prevent “silent failure” in the Wind calculator; give a clear recovery path.

**Files touched**
- `src/features/wind/screen.tsx`
- `src/features/wind/hooks/useWindCalculator.ts`

**Tasks**
- [ ] Detect calculation/data failure states explicitly (not just `null` rendering).
- [ ] Show an accessible error panel with:
  - short explanation,
  - “Retry” action,
  - and (if applicable) “Reset inputs” / “Use manual entry” fallback.
- [ ] Ensure retry triggers the correct refetch/recompute path (hook-level).
- [ ] Add unit tests around error state transitions for `useWindCalculator` (where feasible).

**Acceptance criteria**
- If wind calculation fails or required data is missing, the UI shows an error state (not a blank/partial UI).
- Error state includes a working Retry action that restores normal UI when data becomes available.
- VoiceOver/TalkBack reads the error and the Retry button label clearly.

---

### PR-3 — **Defer location permission + make forecast/location errors actionable** (P1)
**Goal:** No permission prompt at launch; when needed, show rationale + CTA to request/open settings.

**Files touched**
- `app/_layout.tsx`
- `src/features/wind/components/WindHourlyForecastBar.tsx`
- `src/features/wind/context/sensor-data.tsx`
- (optional) a shared helper: `src/utils/permissions.ts` (only if it already exists or is clearly needed)

**Tasks**
- [ ] Remove unconditional `Location.requestForegroundPermissionsAsync()` from app startup.
- [ ] Add an in-context rationale UI before requesting location (only when user enters a location-dependent flow).
- [ ] In forecast UI, if permission is missing/denied:
  - show “Grant location access” button (request again),
  - show “Open Settings” button when permanently denied.
- [ ] Ensure all CTAs are accessible (role/label/hint) and ≥48dp.

**Acceptance criteria**
- App launch does **not** trigger a location permission prompt.
- Entering a location-dependent feature triggers: rationale → OS prompt (only then).
- Forecast permission errors provide working CTAs (request again / open settings).

---

### PR-4 — **Core screen accessibility: Home + Calculator** (P1)
**Goal:** Ensure primary screens are usable with screen readers and have correct semantic structure.

**Files touched**
- `src/features/home/screen.tsx`
- `src/features/calculator/screen.tsx`
- `src/core/components/ui/MetricTile.tsx` (if needed)
- (as needed) shared icon wrappers used on Home

**Tasks**
- [ ] Add `accessibilityRole="header"` to main screen titles (Home + Calculator).
- [ ] Provide `accessibilityLabel` for each Home metric that includes **label + value + unit**.
- [ ] Add accessible loading announcement/state on Home (“Loading conditions”).
- [ ] Update Calculator `ConditionChip` a11y labels to include context (`"${label}: ${value}"`).
- [ ] Mark decorative icons as hidden from accessibility focus (`accessibilityElementsHidden` / `importantForAccessibility="no"` where appropriate).

**Acceptance criteria**
- TalkBack/VoiceOver announces:
  - Screen titles as headers,
  - Each metric with full context (not raw numbers),
  - Loading state when fetching.
- Calculator chips announce metric name + value (e.g., “Temperature: 68°F”).

---

### PR-5 — **Control semantics: Slider hints/value + Input contract + accessible errors** (P1)
**Goal:** Make primary controls understandable and operable via assistive tech; prevent unlabeled Inputs.

**Files touched**
- `src/core/components/ui/slider.tsx`
- `src/core/components/ui/Input.tsx`
- `src/core/components/ui/button.tsx` (to pass through `accessibilityHint` if needed)
- `src/core/components/ui/GlassCard.tsx` (if pressable cards need hints)

**Tasks**
- [ ] Slider:
  - add `accessibilityValue` (min/max/now + `text` with unit),
  - add clear `accessibilityHint` for +/- and drag interactions.
- [ ] Input:
  - add `error` prop with token-based error styling,
  - set `accessibilityState={{ invalid: error }}` / `accessibilityInvalid` equivalent for RN,
  - link error text to the field (pattern appropriate for RN a11y).
- [ ] Add dev-time enforcement:
  - either require `accessibilityLabel` in the Input prop type, **or**
  - emit a dev warning when missing (to avoid huge breaking churn if many call sites exist).

**Acceptance criteria**
- Slider announces current value with unit and provides actionable hints on focus.
- Inputs visually and semantically communicate validation errors (screen reader identifies invalid field).
- Missing Input labels are caught during development (type error or dev warning).

---

### PR-6 — **48dp touch targets** (P1)
**Goal:** Match glove-use requirement and reduce mis-taps.

**Files touched**
- `src/utils/responsive.ts`
- Any components that rely on the minimum (fix layout regressions if they appear)

**Tasks**
- [ ] Change minimum touch target constant from 44 → 48.
- [ ] Audit dense controls impacted (close buttons, small icon buttons, tab buttons, sliders).
- [ ] Add/adjust `hitSlop` where sizing can’t change without layout break.

**Acceptance criteria**
- Minimum touch target utility enforces ≥48dp.
- No critical UI overlaps/regressions on compact devices.

---

### PR-7 — **Tokens-only cleanup (user-facing overlays + error UI)** (P2)
**Goal:** Remove hardcoded hex/rgba from user-facing components and route through semantic tokens.

**Files touched**
- `src/components/ContextualOverlay.tsx`
- `src/components/error-boundary/ErrorBoundary.tsx`
- `components/EmptyState.tsx`
- Token sources as needed:
  - `src/theme/tokens.ts`
  - `src/theme/gradients.ts` (if it is the canonical raw color home)

**Tasks**
- [ ] Replace hardcoded `'#FFFFFF'` / `rgba(...)` with semantic tokens.
- [ ] Introduce missing semantic tokens (overlay surface/border/backdrop) in theme token files if absent.
- [ ] Verify light/dark parity (and outdoor readability where relevant).

**Acceptance criteria**
- No hardcoded hex/rgba remain in the listed component files (except unavoidable platform APIs).
- Visual output remains consistent across light/dark.

---

### PR-8 — **DiagnosticOverlay a11y + tokens (dev tool)** (P2)
**Goal:** Make the dev diagnostic overlay accessible and token-compliant without blocking release.

**Files touched**
- `src/components/diagnostics/DiagnosticOverlay.tsx`

**Tasks**
- [ ] Add `accessibilityRole="button"` + labels for expand/collapse/close.
- [ ] Add selected state for tabs (`accessibilityState={{ selected: true }}`).
- [ ] Ensure tab/header hit targets are ≥48dp (size or `hitSlop`).
- [ ] Replace hardcoded colors with tokens.

**Acceptance criteria**
- Screen reader announces expand/close/tab controls and selected tab state.
- Token-only rule is satisfied for this file.

---

### PR-9 — **Onboarding SR progress + pagination semantics** (P2)
**Goal:** Make onboarding understandable without relying on purely visual pagination.

**Files touched**
- `src/components/onboarding/OnboardingFlow.tsx`
- `src/components/onboarding/OnboardingStep.tsx`

**Tasks**
- [ ] Add “Step X of Y” accessible text/announcement when page changes.
- [ ] Ensure pagination indicators are either:
  - accessible with proper labels/states, **or**
  - hidden and replaced with accessible controls (Next/Back buttons with labels).
- [ ] Hide decorative icons from SR focus.

**Acceptance criteria**
- VoiceOver/TalkBack can determine current step and move through steps without guessing.
- No “mystery swipe-only” progress for screen reader users.

---

### PR-10 — **Theme architecture alignment (legacy + redesign) + small polish** (P3)
**Goal:** Reduce long-term inconsistency risk by aligning theme sources of truth.

**Files touched**
- `src/theme/ThemeProvider.tsx`
- `src/theme/redesign/RedesignThemeProvider.tsx`
- `app/_layout.tsx`, `app/(tabs-redesign)/_layout.tsx`
- (optional polish) `src/components/redesign/MetricPill.tsx`

**Tasks**
- [ ] Decide: one theme SOT vs bridge layer (legacy tokens ↔ redesign tokens).
- [ ] Add `system` support to redesign theme (or explicitly lock redesign to non-system with rationale).
- [ ] Define how “outdoor mode” maps across the whole app (legacy + redesign).
- [ ] Polish items only if trivial:
  - tab selected state (if still needed),
  - MetricPill sizing/spacing via tokens.

**Acceptance criteria**
- One coherent theme behavior across navigation surfaces (system/light/dark/outdoor as decided).
- No area unexpectedly defaults to a different theme model.

---

## Validation checklist (per PR)
Run these before merging each PR:
- `yarn format:check`
- `yarn lint` (Expo lint)
- `yarn tsc -p tsconfig.json --noEmit`
- `yarn test:ci`

Manual QA (targeted to changed areas):
- iOS + Android: verify theme switching (light/dark/system) and OS theme change behavior.
- VoiceOver + TalkBack passes for modified screens/controls (Home, Calculator, Wind, overlays).
- Compact device layout smoke test after 48dp touch target change.

---

## Open questions / risks
- **Theme SOT:** Legacy vs redesign providers currently diverge (redesign lacks `system` mode despite reading `useColorScheme()`); PR‑10 needs an explicit decision to avoid ongoing inconsistencies.
- **Breaking change risk (Input a11y contract):** Making `accessibilityLabel` required could touch many call sites; consider a staged approach (dev warnings → enforce later).
- **Tokens-only scope creep:** Removing all raw colors can expand quickly; keep PR‑7 scoped to the listed user-facing components and add tokens only when missing.
- **Permission UX edge cases:** “Ask again” vs “Open settings” behavior differs by platform/state; ensure both flows are handled and labeled clearly.

---

## JSON plan
```json
{
  "prs": [
    {
      "id": "PR-1",
      "title": "Fix system theme correctness and centralize isDark/effectiveScheme",
      "priority": "P0",
      "files": [
        "src/theme/ThemeProvider.tsx",
        "src/core/context/theme.tsx",
        "components/EmptyState.tsx",
        "components/ContextualOverlay.tsx",
        "components/PresetSelector.tsx",
        "components/onboarding/OnboardingFlow.tsx",
        "components/onboarding/OnboardingStep.tsx",
        "src/features/home/screen.tsx",
        "src/features/wind/screen.tsx",
        "src/features/calculator/screen.tsx",
        "src/core/components/ui/MetricTile.tsx",
        "src/core/components/ui/FloatingTabBar.tsx",
        "src/core/components/ui/GradientHero.tsx",
        "src/core/components/ui/slider.tsx",
        "src/core/components/ui/GlassCard.tsx",
        "src/core/components/ui/button.tsx",
        "src/core/components/ui/Input.tsx",
        "src/core/components/ui/BoldTabBar.tsx",
        "src/core/components/ui/SectionHeader.tsx",
        "src/core/components/ui/card.tsx",
        "src/core/components/ui/BoldCard.tsx"
      ],
      "tasks": [
        "Expose effectiveScheme/isDark from ThemeProvider (mode + OS scheme)",
        "Subscribe to OS appearance changes so system mode updates live",
        "Replace all `mode === 'dark' || mode === 'system'` checks with centralized isDark/effectiveScheme",
        "Add a small unit test for theme derivation logic"
      ],
      "acceptanceCriteria": [
        "System+OS light renders light tokens; System+OS dark renders dark tokens",
        "Changing OS appearance updates UI live without app restart",
        "No remaining `mode === 'dark' || mode === 'system'` checks in UI code"
      ]
    },
    {
      "id": "PR-2",
      "title": "Wind flow: surface calculation failures and add retry/recovery",
      "priority": "P0",
      "files": [
        "src/features/wind/screen.tsx",
        "src/features/wind/hooks/useWindCalculator.ts"
      ],
      "tasks": [
        "Explicitly represent failure states (avoid silent/blank UI)",
        "Add accessible error UI with Retry and appropriate fallback/reset",
        "Wire Retry to refetch/recompute path",
        "Add unit tests for error state transitions where feasible"
      ],
      "acceptanceCriteria": [
        "Failures show a clear error state instead of silent failure",
        "Retry restores normal UI when data is available",
        "Screen readers announce the error and Retry action clearly"
      ]
    },
    {
      "id": "PR-3",
      "title": "Defer location permission and make forecast/location errors actionable",
      "priority": "P1",
      "files": [
        "app/_layout.tsx",
        "src/features/wind/components/WindHourlyForecastBar.tsx",
        "src/features/wind/context/sensor-data.tsx"
      ],
      "tasks": [
        "Remove unconditional location permission request from app launch",
        "Add rationale UI before requesting location in a location-dependent flow",
        "Add Request Permission / Open Settings CTAs for forecast permission errors",
        "Ensure CTAs are accessible and >=48dp"
      ],
      "acceptanceCriteria": [
        "No location prompt appears at app launch",
        "Permission is requested only after user enters a location-dependent feature with rationale shown first",
        "Forecast errors offer working CTAs (request/open settings)"
      ]
    },
    {
      "id": "PR-4",
      "title": "Core screen accessibility: Home + Calculator semantics and labels",
      "priority": "P1",
      "files": [
        "src/features/home/screen.tsx",
        "src/features/calculator/screen.tsx",
        "src/core/components/ui/MetricTile.tsx"
      ],
      "tasks": [
        "Add accessibilityRole=header to primary titles",
        "Add accessibilityLabel for Home metrics including label/value/unit",
        "Add accessible loading announcement/state on Home",
        "Update Calculator ConditionChip labels to include metric context",
        "Hide decorative icons from the accessibility tree"
      ],
      "acceptanceCriteria": [
        "Screen readers announce titles as headers",
        "Home metrics announce full context (not raw values)",
        "Calculator chips announce metric name + value"
      ]
    },
    {
      "id": "PR-5",
      "title": "Controls a11y: Slider semantics/hints + Input error/accessibility contract",
      "priority": "P1",
      "files": [
        "src/core/components/ui/slider.tsx",
        "src/core/components/ui/Input.tsx",
        "src/core/components/ui/button.tsx",
        "src/core/components/ui/GlassCard.tsx"
      ],
      "tasks": [
        "Add accessibilityValue (with unit text) and hints to slider interactions",
        "Add Input error prop with token-based styling and accessibility invalid semantics",
        "Add dev-time enforcement (type or warning) for missing Input accessibilityLabel",
        "Ensure Button/GlassCard can pass through accessibilityHint where used"
      ],
      "acceptanceCriteria": [
        "Slider announces value+unit and provides usable hints",
        "Inputs indicate validation errors visually and via screen reader",
        "Missing Input labels are caught during development"
      ]
    },
    {
      "id": "PR-6",
      "title": "Raise minimum touch target to 48dp and audit impacted controls",
      "priority": "P1",
      "files": [
        "src/utils/responsive.ts"
      ],
      "tasks": [
        "Change minimum touch target constant from 44 to 48",
        "Audit and fix dense controls with hitSlop or sizing adjustments",
        "Smoke test on compact layouts"
      ],
      "acceptanceCriteria": [
        "Touch target utilities enforce >=48dp",
        "No critical layout regressions on compact devices"
      ]
    },
    {
      "id": "PR-7",
      "title": "Tokens-only cleanup for user-facing overlays and error UI",
      "priority": "P2",
      "files": [
        "src/components/ContextualOverlay.tsx",
        "src/components/error-boundary/ErrorBoundary.tsx",
        "components/EmptyState.tsx",
        "src/theme/tokens.ts",
        "src/theme/gradients.ts"
      ],
      "tasks": [
        "Replace hardcoded hex/rgba in user-facing overlays with semantic tokens",
        "Add missing semantic overlay tokens if needed",
        "Verify light/dark visual parity"
      ],
      "acceptanceCriteria": [
        "No hardcoded hex/rgba remains in the listed component files (except unavoidable platform APIs)",
        "Visual parity maintained across light/dark"
      ]
    },
    {
      "id": "PR-8",
      "title": "DiagnosticOverlay accessibility and tokens (dev tool)",
      "priority": "P2",
      "files": [
        "src/components/diagnostics/DiagnosticOverlay.tsx"
      ],
      "tasks": [
        "Add accessibilityRole/Label to expand/collapse/close",
        "Add selected state to tabs",
        "Ensure >=48dp hit targets (size or hitSlop)",
        "Replace hardcoded colors with tokens"
      ],
      "acceptanceCriteria": [
        "Screen reader announces overlay controls and selected tab state",
        "Token-only rule satisfied for DiagnosticOverlay"
      ]
    },
    {
      "id": "PR-9",
      "title": "Onboarding: add screen-reader progress/pagination semantics",
      "priority": "P2",
      "files": [
        "src/components/onboarding/OnboardingFlow.tsx",
        "src/components/onboarding/OnboardingStep.tsx"
      ],
      "tasks": [
        "Add 'Step X of Y' accessible text/announcement on page change",
        "Ensure pagination is operable and understandable via screen reader",
        "Hide decorative elements from accessibility focus"
      ],
      "acceptanceCriteria": [
        "Screen readers can identify current step and navigate steps reliably",
        "No purely visual-only progress indicators without accessible equivalent"
      ]
    },
    {
      "id": "PR-10",
      "title": "Align legacy + redesign theme architecture (system/outdoor consistency) and minor polish",
      "priority": "P3",
      "files": [
        "src/theme/ThemeProvider.tsx",
        "src/theme/redesign/RedesignThemeProvider.tsx",
        "app/_layout.tsx",
        "app/(tabs-redesign)/_layout.tsx",
        "src/components/redesign/MetricPill.tsx"
      ],
      "tasks": [
        "Decide theme source-of-truth or bridge layer strategy",
        "Add/clarify system theme behavior in redesign theme provider",
        "Define outdoor mode behavior consistently across app",
        "Apply small token-based polish (only if trivial) to reduce inconsistencies"
      ],
      "acceptanceCriteria": [
        "Theme behavior is coherent across legacy and redesign surfaces (per decided model)",
        "Outdoor/system behavior is explicit and consistent"
      ]
    }
  ]
}
```
