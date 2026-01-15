# AICaddyPro UI + UX Audit (React Native + Expo Router)

## Summary (key takeaways)
- **P0:** Touch targets are **not consistently ≥48dp** (several core controls still size to 44), violating the stated constraint.  
- **P0:** Several interactive surfaces **lack `accessibilityRole` + `accessibilityLabel`**, especially overlays/debug UI and some modal backdrops.  
- **P0:** The **“classic vs redesign” navigation preference is currently misleading**: app routing always redirects to `/(tabs-redesign)` and no classic tabs route is present.  
- **P0/P1:** **Permissions UX is fragmented**: location permission is requested on startup and again inside sensor code, while “permission toggles” in Setup mostly update local settings without aligning to OS permission state/request flow.  
- **P1:** **Reduced Motion is not applied consistently** (notably paywall/onboarding/overlay animations).  
- **P1:** **Token usage is inconsistent**: many screens/components still hardcode spacing/typography/colors despite having two token systems (`src/theme/tokens` and `src/theme/redesign/tokens`).  
- **P2:** Some error/empty states are present but **lack clear recovery actions** (e.g., “Unable to load conditions” with no retry).

---

## P0 Findings (must fix)
### P0-1 — Touch targets not guaranteed ≥48dp (constraint violation)
**Files:**  
- `src/utils/responsive.ts`  
- `src/core/components/ui/button.tsx`  
- `src/core/components/ui/slider.tsx`  
- `components/Button.tsx` (legacy component)

**Evidence (snippets):**
- `src/utils/responsive.ts`: `const MIN_TOUCH_TARGET = 44;`
- `src/core/components/ui/button.tsx`: `minHeight: getTouchTargetSize(44)`
- `src/core/components/ui/slider.tsx`: `const buttonSize = getTouchTargetSize(t.containerSize.icon.md); // 44px minimum touch target`
- `components/Button.tsx`: `minHeight: 44`

**Why it matters:** Misses, fatigue, and poor glove-use; violates stated requirement and will be flagged in accessibility review.

**Recommended fix:** Set a single minimum (48dp) in the responsive helpers and ensure button/slider sizing uses **`minSize: t.touchTarget.minimum`** (or redesign token equivalent).

---

### P0-2 — Interactive elements missing `accessibilityRole` + `accessibilityLabel`
**Files:**  
- `src/components/diagnostics/DiagnosticOverlay.tsx`  
- `src/components/ContextualOverlay.tsx`  
- `src/components/error-boundary/ErrorBoundary.tsx`  
- `app/(tabs-redesign)/setup.tsx`

**Evidence (snippets):**
- `src/components/diagnostics/DiagnosticOverlay.tsx`: multiple `Pressable` controls (tabs, close, expand, clear) without a11y props (e.g., `Pressable onPress={toggleExpanded}` / `onClose`).
- `src/components/ContextualOverlay.tsx`: close button `Pressable` has no `accessibilityRole`/`accessibilityLabel`; `OverlayItem` uses `Pressable onPress={onPress}` without a11y props.
- `src/components/error-boundary/ErrorBoundary.tsx`: “Try Again” `Pressable` has no a11y props.
- `app/(tabs-redesign)/setup.tsx`: modal backdrop `Pressable` closes modal but has no a11y label/role.

**Why it matters:** Screen reader users may not discover/understand controls; fails stated “all interactive elements must have role + label”.

**Recommended fix:** Add explicit a11y props (role, label, state) to these Pressables; for dismiss backdrops consider `accessibilityRole="button"` + label “Dismiss” or hide from SR and provide a visible close button with proper labeling.

---

### P0-3 — Navigation preference UI is misleading (classic not reachable)
**Files:**  
- `app/index.tsx`  
- `src/stores/navigationPreference.ts`  
- `app/(tabs-redesign)/setup.tsx`

**Evidence (snippets):**
- `app/index.tsx`: `return <Redirect href="/(tabs-redesign)" />;`
- `app/(tabs-redesign)/setup.tsx`: offers “Classic (5 tabs)” + triggers `Updates.reloadAsync()`
- `src/stores/navigationPreference.ts`: supports `style: 'classic' | 'redesign'`

**Why it matters:** Users can “switch” layouts but routing always forces redesign; this harms trust and discoverability.

**Recommended fix:** Either (a) implement classic routes and respect the preference at app entry, or (b) remove/disable the classic option until it exists.

---

### P0-4 — Permission prompting & toggles are not coherent (repeated requests / not wired)
**Files:**  
- `app/_layout.tsx`  
- `src/features/wind/context/sensor-data.tsx`  
- `src/services/enhanced-environmental-service.ts`  
- `app/(tabs-redesign)/setup.tsx`  
- `src/utils/permissions.ts`

**Evidence (snippets):**
- `app/_layout.tsx`: calls `Location.requestForegroundPermissionsAsync()` on mount.
- `src/features/wind/context/sensor-data.tsx`: requests location permission again “as soon as the provider loads” and again in `setupNativeCompass`.
- `src/services/enhanced-environmental-service.ts`: `Location.requestForegroundPermissionsAsync()` in `getLocationThrottled`.
- `app/(tabs-redesign)/setup.tsx`: permission toggles call `updateSettings({ locationEnabled: value })` etc, but don’t align to OS permission status/request.
- `src/utils/permissions.ts`: notification permissions “not yet implemented”, compass permission simplified.

**Why it matters:** Users get prompted without context; toggles may suggest control that doesn’t exist; repeated prompts and mismatched states reduce clarity and can hurt App Store review.

**Recommended fix:** Centralize permission flow (use `PermissionRequest` / `requestPermission`), gate OS permission prompts behind explicit user actions, and have toggles reflect *actual OS permission state* (and deep-link to Settings when denied).

---

## P1 Findings (high priority)
### P1-1 — Reduced Motion not consistently respected across animations
**Files:**  
- `src/core/components/ui/Paywall.tsx`  
- `src/components/onboarding/OnboardingFlow.tsx`  
- `src/components/ContextualOverlay.tsx`

**Evidence (snippets):**
- `src/core/components/ui/Paywall.tsx`: crown float uses `withRepeat(...)` without checking reduce-motion.
- `src/components/onboarding/OnboardingFlow.tsx`: uses `FadeInDown`, `FadeInUp`, `withSpring`, etc. without a reduced-motion gate.
- `src/components/ContextualOverlay.tsx`: animates in/out via reanimated values without reduce-motion gating.

**Why it matters:** Users with vestibular sensitivity can experience discomfort; violates accessibility expectations and your audit scope requirement.

**Recommended fix:** Use `useReduceMotionValue()` or `useAccessibleAnimations()` consistently, disable continuous animations, and swap to instant transitions when reduced motion is enabled.

---

### P1-2 — Token usage inconsistency (hardcoded spacing/typography/colors remain widespread)
**Files (examples):**  
- `app/(tabs-redesign)/index.tsx`, `app/(tabs-redesign)/wind.tsx`, `app/(tabs-redesign)/setup.tsx`  
- `src/core/components/ui/Input.tsx`  
- `src/components/error-boundary/ErrorBoundary.tsx`  
- `src/components/diagnostics/DiagnosticOverlay.tsx`  
- `src/components/EmptyState.tsx`

**Evidence (snippets):**
- `app/(tabs-redesign)/index.tsx`: `paddingHorizontal: 16`, `fontSize: 32`, etc.
- `src/core/components/ui/Input.tsx`: `height: 56`, `borderRadius: 12`, etc.
- `src/components/error-boundary/ErrorBoundary.tsx`: `buttonText: { color: '#fff' }`
- `src/components/diagnostics/DiagnosticOverlay.tsx`: `backgroundColor: 'rgba(0, 0, 0, 0.85)'`, and `'#4FB3F6' / '#E45858'` in flags list.
- `src/components/EmptyState.tsx`: icon color `"#FFFFFF"`, borders via `rgba(...)`.

**Why it matters:** Violates the “must use tokens” constraint, increases theme drift, and makes outdoor/dark mode correctness harder.

**Recommended fix:** Pick a single token system per surface (legacy vs redesign) and eliminate hardcoded sizes/colors in audited UI paths.

---

## P2 Findings (medium priority)
### P2-1 — Some error states lack recovery actions / clarity
**Files:**  
- `src/features/wind/screen.tsx`  
- `src/providers/EnhancedEnvironmentalProvider.tsx`

**Evidence (snippets):**
- `src/features/wind/screen.tsx`: when `!conditions` → shows “Unable to load conditions” without a retry CTA.
- `src/providers/EnhancedEnvironmentalProvider.tsx`: forces `isActive=true` after 1s even if still loading (`“Forcing active state after short timeout”`) which can mask real problems.

**Why it matters:** Users get stuck or uncertain; outdoor/on-course usage needs fast recovery.

**Recommended fix:** Provide clear retry actions and show staleness (“last updated”) when using cached values; avoid “force active” masking and instead present an actionable banner.

---

### P2-2 — Unit handling inconsistency (wind speed display/controls)
**Files:**  
- `src/features/wind/screen.tsx`  
- `src/features/home/screen.tsx`

**Evidence (snippets):**
- `src/features/wind/screen.tsx`: `Slider ... label="Wind Speed" unit="mph"`
- `src/features/home/screen.tsx`: wind speed displays `(conditions.windSpeed).toFixed(1) mph`

**Why it matters:** Users who select metric/kts/mps will see mismatched units and potentially make wrong on-course decisions.

**Recommended fix:** Use `settings.speedUnit` (and conversion) consistently in wind-related screens.

---

### P2-3 — Haptics may be overly frequent in “live” calculations
**Files:**  
- `src/features/calculator/screen.tsx`  
- `src/core/components/ui/slider.tsx`

**Evidence (snippets):**
- `src/features/calculator/screen.tsx`: triggers `Haptics.notificationAsync(Success)` on carry distance change.
- `src/core/components/ui/slider.tsx`: `Haptics.selectionAsync()` on step boundary crossing during drag.

**Why it matters:** Can be distracting and fatiguing; for accessibility users, frequent haptics can be undesirable.

**Recommended fix:** Throttle/limit haptics (e.g., only on release, or only when change exceeds a threshold), and respect reduced-motion/“reduce haptics” if you support it.

---

## P3 Findings (lower priority)
### P3-1 — Large-list readiness: avoid ScrollView/`.map()` for potentially growing lists
**Files:**  
- `app/(tabs-redesign)/setup.tsx` (clubs list via `clubs.map`)  
- `src/features/settings/screen.tsx` (clubs list via `clubs.map`)  

**Why it matters:** If club lists/presets grow, ScrollView + map can cause jank; your constraint prefers FlashList for large lists.

**Recommended fix:** Swap to `FlashList` once list size exceeds a threshold (or standardize on it for lists).

---

## Quick wins (≤10)
1. **Raise global min touch target to 48dp**: update `src/utils/responsive.ts` and consumers (`button.tsx`, `slider.tsx`).  
2. Add a11y props to **DiagnosticOverlay** Pressables (`src/components/diagnostics/DiagnosticOverlay.tsx`).  
3. Add a11y props (and/or hide from SR appropriately) for **ContextualOverlay** backdrop/close and `OverlayItem` Pressable (`src/components/ContextualOverlay.tsx`).  
4. Add a11y props to **ErrorBoundary fallback** “Try Again” button (`src/components/error-boundary/ErrorBoundary.tsx`).  
5. Fix navigation preference mismatch: either **respect `navigationPreference` in `app/index.tsx`** or remove classic toggle (`app/(tabs-redesign)/setup.tsx`, `src/stores/navigationPreference.ts`).  
6. Stop requesting location permission on startup; gate behind explicit UI flow (use `PermissionRequest`) and dedupe requests (`app/_layout.tsx`, `src/features/wind/context/sensor-data.tsx`, `src/services/enhanced-environmental-service.ts`).  
7. Make Paywall/Onboarding/Overlays respect Reduced Motion (`src/core/components/ui/Paywall.tsx`, `src/components/onboarding/OnboardingFlow.tsx`, `src/components/ContextualOverlay.tsx`).  
8. Remove/replace obvious hardcoded colors in audited UI paths (e.g., `'#fff'` in ErrorBoundary, debug overlay colors).  
9. Align wind units with `settings.speedUnit` everywhere (`src/features/wind/screen.tsx`, `src/features/home/screen.tsx`).  
10. Add modal accessibility affordances (e.g., `accessibilityViewIsModal`, clear “Close” semantics) across modals.

---

## Risks / Dependencies
- **Token system split** (`src/theme/tokens` vs `src/theme/redesign/tokens`) is a structural risk: resolving it requires design/system decisions, not just code tweaks.  
- **Permissions + App Store review**: current permission prompting patterns (startup prompts, toggles not reflecting OS state) may require product copy and iOS/Android platform-specific handling.  
- **Navigation**: “classic” layout appears partially removed; reintroducing it requires route structure work in `app/` (Expo Router groups).

---

# Machine-readable issues JSON
```json
{
  "issues": [
    {
      "id": "UI-001",
      "priority": "P0",
      "title": "Touch targets are not consistently ≥48dp (constraint violation)",
      "screen": "Global",
      "files": [
        "src/utils/responsive.ts",
        "src/core/components/ui/button.tsx",
        "src/core/components/ui/slider.tsx",
        "components/Button.tsx"
      ],
      "evidence": [
        "src/utils/responsive.ts: `const MIN_TOUCH_TARGET = 44;`",
        "src/core/components/ui/button.tsx: `minHeight: getTouchTargetSize(44)`",
        "components/Button.tsx: `minHeight: 44`"
      ],
      "whyItMatters": "Miss-taps and fatigue increase (especially outdoors/gloves) and this fails the stated ≥48dp requirement.",
      "recommendedFix": "Set the minimum touch target to 48 in the responsive layer and ensure shared controls (Button/Slider/etc.) use token-driven minimums consistently.",
      "acceptanceCriteria": [
        "All tappable controls meet or exceed 48dp in their rendered size (excluding explicit exceptions with documented rationale).",
        "Shared primitives (Button, Slider steppers, icon buttons) enforce the minimum without per-screen fixes."
      ],
      "effort": "M",
      "category": "ux"
    },
    {
      "id": "UI-002",
      "priority": "P0",
      "title": "Interactive elements missing accessibilityRole/accessibilityLabel in overlays and error UI",
      "screen": "Overlays / Error states",
      "files": [
        "src/components/diagnostics/DiagnosticOverlay.tsx",
        "src/components/ContextualOverlay.tsx",
        "src/components/error-boundary/ErrorBoundary.tsx",
        "app/(tabs-redesign)/setup.tsx"
      ],
      "evidence": [
        "src/components/diagnostics/DiagnosticOverlay.tsx: multiple `Pressable` controls (tabs/close/expand/clear) without explicit accessibility props.",
        "src/components/ContextualOverlay.tsx: close button `Pressable` lacks `accessibilityRole`/`accessibilityLabel`; `OverlayItem` wraps `Pressable onPress={onPress}` without a11y props.",
        "src/components/error-boundary/ErrorBoundary.tsx: `Pressable ... onPress={resetError}` without a11y props."
      ],
      "whyItMatters": "Screen reader users may not discover or understand controls; violates the stated requirement that all interactive elements have role + label.",
      "recommendedFix": "Add `accessibilityRole`, `accessibilityLabel`, and appropriate `accessibilityState` to all interactive Pressables; for modal backdrops either hide from SR or label as 'Dismiss'.",
      "acceptanceCriteria": [
        "All Pressable/Touchable interactive elements in the listed files include `accessibilityRole` and `accessibilityLabel` (or are explicitly hidden from accessibility).",
        "Modal close/dismiss actions are discoverable and work via screen reader navigation."
      ],
      "effort": "M",
      "category": "a11y"
    },
    {
      "id": "UI-003",
      "priority": "P0",
      "title": "Navigation preference (classic vs redesign) is misleading; app always redirects to redesign tabs",
      "screen": "Setup → Navigation Style",
      "files": [
        "app/index.tsx",
        "src/stores/navigationPreference.ts",
        "app/(tabs-redesign)/setup.tsx"
      ],
      "evidence": [
        "app/index.tsx: `<Redirect href=\"/(tabs-redesign)\" />`",
        "src/stores/navigationPreference.ts: supports `style: 'classic' | 'redesign'`",
        "app/(tabs-redesign)/setup.tsx: offers Classic (5 tabs) and triggers reload"
      ],
      "whyItMatters": "Users are told they can switch layouts, but routing appears to ignore the preference, harming trust and discoverability.",
      "recommendedFix": "Either implement classic routes and conditionally route based on stored preference, or remove/disable the classic option until supported.",
      "acceptanceCriteria": [
        "Selecting 'classic' results in the classic tab layout being shown after reload.",
        "Or, if classic is not supported, UI does not present the option."
      ],
      "effort": "M",
      "category": "navigation"
    },
    {
      "id": "UI-004",
      "priority": "P0",
      "title": "Permissions UX is fragmented (startup prompting + repeated requests; toggles not aligned to OS permissions)",
      "screen": "Startup / Setup → Permissions",
      "files": [
        "app/_layout.tsx",
        "src/features/wind/context/sensor-data.tsx",
        "src/services/enhanced-environmental-service.ts",
        "app/(tabs-redesign)/setup.tsx",
        "src/utils/permissions.ts"
      ],
      "evidence": [
        "app/_layout.tsx: calls `Location.requestForegroundPermissionsAsync()` on mount.",
        "src/features/wind/context/sensor-data.tsx: requests location permission in multiple effects.",
        "src/utils/permissions.ts: notification permissions 'not yet implemented'; compass permission simplified."
      ],
      "whyItMatters": "Users can be prompted without context and see toggles that don't reflect actual OS state; this can reduce conversions and cause review issues.",
      "recommendedFix": "Centralize permission checks/requests, dedupe prompts, gate prompting behind explicit user action, and have toggles reflect OS state (with Settings deep-link when denied).",
      "acceptanceCriteria": [
        "No OS permission prompt appears on cold start without an explicit user action that requires it (unless product explicitly wants otherwise).",
        "Permission toggles reflect the OS permission state and can trigger a guided request flow."
      ],
      "effort": "L",
      "category": "ux"
    },
    {
      "id": "UI-005",
      "priority": "P1",
      "title": "Reduced Motion preference not consistently respected (paywall/onboarding/overlays)",
      "screen": "Paywall / Onboarding / Overlays",
      "files": [
        "src/core/components/ui/Paywall.tsx",
        "src/components/onboarding/OnboardingFlow.tsx",
        "src/components/ContextualOverlay.tsx"
      ],
      "evidence": [
        "src/core/components/ui/Paywall.tsx: `withRepeat(...)` crown animation without reduce-motion gating.",
        "src/components/onboarding/OnboardingFlow.tsx: uses `FadeInDown`, `FadeInUp`, `withSpring` without reduce-motion checks."
      ],
      "whyItMatters": "Continuous or animated transitions can cause discomfort for users with vestibular sensitivity; this is a common accessibility expectation.",
      "recommendedFix": "Gate animations with `useReduceMotionValue()`/`useAccessibleAnimations()`; disable continuous animations and use instant transitions when reduced motion is enabled.",
      "acceptanceCriteria": [
        "With Reduce Motion enabled, paywall/onboarding/overlay transitions are instant or significantly reduced.",
        "No continuous repeating animations run when Reduce Motion is enabled."
      ],
      "effort": "M",
      "category": "a11y"
    },
    {
      "id": "UI-006",
      "priority": "P1",
      "title": "Design-token inconsistency and hardcoded values remain across audited UI paths",
      "screen": "Global",
      "files": [
        "app/(tabs-redesign)/index.tsx",
        "app/(tabs-redesign)/wind.tsx",
        "app/(tabs-redesign)/setup.tsx",
        "src/core/components/ui/Input.tsx",
        "src/components/error-boundary/ErrorBoundary.tsx",
        "src/components/diagnostics/DiagnosticOverlay.tsx",
        "src/components/EmptyState.tsx"
      ],
      "evidence": [
        "app/(tabs-redesign)/index.tsx: hardcoded `paddingHorizontal: 16`, `fontSize: 32`, etc.",
        "src/components/error-boundary/ErrorBoundary.tsx: `buttonText: { color: '#fff' }`",
        "src/components/diagnostics/DiagnosticOverlay.tsx: `backgroundColor: 'rgba(0, 0, 0, 0.85)'` and `'#4FB3F6'`"
      ],
      "whyItMatters": "Hardcoded values increase theme drift and undermine light/dark/outdoor consistency; violates the stated 'no hardcoded colors/spacing' constraint.",
      "recommendedFix": "Standardize token usage per surface (legacy vs redesign), remove hardcoded colors/spacing/typography in screens and shared components, and enforce via linting or review checks.",
      "acceptanceCriteria": [
        "Audited screens do not introduce new hardcoded colors/spacing/typography outside token sources.",
        "Existing hardcoded values in listed files are migrated to tokens or justified exceptions are documented in code."
      ],
      "effort": "L",
      "category": "consistency"
    },
    {
      "id": "UI-007",
      "priority": "P1",
      "title": "Outdoor readability strategy is inconsistent (outdoor theme exists only in redesign provider; glass effects may reduce clarity)",
      "screen": "Global",
      "files": [
        "src/theme/ThemeProvider.tsx",
        "src/theme/redesign/RedesignThemeProvider.tsx",
        "src/core/components/ui/GlassCard.tsx"
      ],
      "evidence": [
        "src/theme/redesign/RedesignThemeProvider.tsx: supports `mode: 'light' | 'dark' | 'outdoor'`",
        "src/theme/ThemeProvider.tsx: supports only `system|light|dark` (no outdoor)",
        "src/core/components/ui/GlassCard.tsx: uses `BlurView` and `surfaceGlass` for dark mode cards"
      ],
      "whyItMatters": "Sunlight use-cases need predictable high-contrast rendering; mixed theme systems and glassmorphism can reduce legibility outdoors.",
      "recommendedFix": "Decide how 'outdoor' mode should apply across the whole app (including legacy screens/components) and ensure critical data surfaces avoid low-contrast/glassy treatments in outdoor mode.",
      "acceptanceCriteria": [
        "Outdoor mode can be applied consistently across redesign and non-redesign screens (or the app clearly restricts outdoor mode scope).",
        "Primary decision outputs remain high-contrast in outdoor mode."
      ],
      "effort": "L",
      "category": "visual"
    },
    {
      "id": "UI-008",
      "priority": "P2",
      "title": "Error states sometimes lack recovery actions (e.g., conditions unavailable)",
      "screen": "Wind Calculator (classic)",
      "files": [
        "src/features/wind/screen.tsx"
      ],
      "evidence": [
        "src/features/wind/screen.tsx: when `!conditions` renders `Unable to load conditions` with no retry CTA."
      ],
      "whyItMatters": "On-course usage requires quick recovery; without retry or guidance, users may abandon the flow.",
      "recommendedFix": "Add an explicit retry action (e.g., call `forceRefresh`) and show brief guidance (connectivity/permissions) when conditions are unavailable.",
      "acceptanceCriteria": [
        "When conditions fail to load, UI offers a visible retry action.",
        "The retry action triggers a data refresh attempt and provides feedback."
      ],
      "effort": "S",
      "category": "ux"
    },
    {
      "id": "UI-009",
      "priority": "P2",
      "title": "Wind unit display/controls not fully aligned with user settings",
      "screen": "Wind + Weather (classic)",
      "files": [
        "src/features/wind/screen.tsx",
        "src/features/home/screen.tsx",
        "src/core/context/settings.tsx"
      ],
      "evidence": [
        "src/features/wind/screen.tsx: wind speed slider uses `unit=\"mph\"`.",
        "src/features/home/screen.tsx: displays wind speed as `mph`.",
        "src/core/context/settings.tsx: supports `speedUnit: 'mph'|'kph'|'kts'|'mps'`."
      ],
      "whyItMatters": "Incorrect or inconsistent units can cause real-world decision errors (club choice, aim adjustments).",
      "recommendedFix": "Use `settings.speedUnit` (and conversion helpers) consistently for wind displays and inputs.",
      "acceptanceCriteria": [
        "Changing speed unit in settings updates wind speed units everywhere in UI.",
        "Underlying calculations and displayed values remain consistent after unit changes."
      ],
      "effort": "M",
      "category": "consistency"
    },
    {
      "id": "UI-010",
      "priority": "P3",
      "title": "Potential list scaling/performance risk: map-rendered lists instead of FlashList",
      "screen": "Setup / Settings",
      "files": [
        "app/(tabs-redesign)/setup.tsx",
        "src/features/settings/screen.tsx"
      ],
      "evidence": [
        "app/(tabs-redesign)/setup.tsx: renders clubs via `clubs.map(...)`.",
        "src/features/settings/screen.tsx: renders clubs via `clubs.map(...)`."
      ],
      "whyItMatters": "If club/preset counts grow, ScrollView/map patterns can cause memory and performance issues.",
      "recommendedFix": "Adopt FlashList for any list that can grow beyond a small threshold, or add a threshold-based switch to FlashList.",
      "acceptanceCriteria": [
        "Lists that can exceed a small count (e.g., >25) use FlashList or equivalent virtualization.",
        "Scrolling remains smooth under larger datasets."
      ],
      "effort": "M",
      "category": "performance"
    }
  ]
}
```
