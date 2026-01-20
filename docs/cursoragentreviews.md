I'll conduct a comprehensive code review of this codebase. Let me start by exploring the source directories and then systematically analyze the code for bugs, UI/UX issues, patterns, and security concerns.

[3 tools called]

Let me explore the features directory structure and then launch parallel analysis tasks for different areas of the codebase.

[3 tools called]

Let me read the key source files to conduct a thorough review. I'll start with the main feature screens and critical components.

[4 tools called]

Let me continue reading more critical files to complete the review - the compass components, core UI, hooks, and services.

[4 tools called]

Let me read more critical files for the review - the error boundary, services, and context providers.

[4 tools called]

Let me read a few more important files to complete the analysis.

[4 tools called]

Based on my comprehensive review of the codebase, here is my detailed analysis organized by issue type and severity:

---

# Code Review Report: AICaddyPro

## 1. BUGS

### Critical

**`src/features/settings/context/premium.tsx:46`**
- **Severity:** Critical
- **Issue:** `FORCE_PREMIUM_BYPASS = true` is hardcoded, bypassing all premium subscription checks. This is marked as "TESTING" but appears ready to ship.
- **Fix:** Remove or set to `false`, and use environment variable: `const FORCE_PREMIUM_BYPASS = process.env.EXPO_PUBLIC_BYPASS_PREMIUM === 'true';`

---

### High

**`src/features/wind/screen.tsx:232-234`**
- **Severity:** High
- **Issue:** Using `parseInt` without radix and no empty string validation can produce `NaN`
- **Current:**
```typescript
const effectiveWindSpeed = windOverride !== '' ? parseInt(windOverride, 10) : baseWindSpeed;
```
- **Fix:** Add explicit NaN check:
```typescript
const effectiveWindSpeed = windOverride !== '' && !isNaN(parseInt(windOverride, 10)) 
  ? parseInt(windOverride, 10) 
  : baseWindSpeed;
```

**`src/features/wind/context/compass-lock.tsx:135`**
- **Severity:** High
- **Issue:** Race condition - `relativeWindAngle` calculation uses mix of state and props that could be stale during rapid updates
- **Fix:** Wrap in `useMemo` with proper dependencies:
```typescript
const relativeWindAngle = useMemo(() => 
  ((windDirection - (lockState.isLocked ? lockState.referenceHeading : currentHeading) + lockState.manualOffset + 360) % 360),
  [windDirection, lockState, currentHeading]
);
```

**`src/features/wind/context/sensor-data.tsx:88-99`**
- **Severity:** High
- **Issue:** Global mutable state outside component (`previousHeadings`, `lastKnownOrientation`, `hasMagneticInterference`) causes state sharing across instances and test pollution
- **Fix:** Move these into `useRef` hooks inside the `SensorDataProvider` component

**`src/core/context/settings.tsx:118-124`**
- **Severity:** High  
- **Issue:** Race condition - state updates immediately but AsyncStorage save is async. Component unmount during save loses data.
- **Fix:** Use `useRef` to track component mount state and abort save on unmount

---

### Medium

**`src/features/calculator/screen.tsx:87`**
- **Severity:** Medium
- **Issue:** `prevShotDataRef.current` initialized as `null` but refs should use `undefined` for proper typing
- **Fix:** Change to `const prevShotDataRef = React.useRef<typeof shotData>(undefined);`

**`src/features/wind/hooks/useWindCalculator.ts:91-94`**
- **Severity:** Medium
- **Issue:** Comparing `isLoading !== shouldBeLoading` inside useEffect can cause unnecessary updates
- **Fix:** Use a ref to track previous loading state:
```typescript
const prevLoadingRef = useRef(isLoading);
useEffect(() => {
  if (prevLoadingRef.current !== shouldBeLoading) {
    setIsLoading(shouldBeLoading);
    prevLoadingRef.current = shouldBeLoading;
  }
}, [conditions, envLoading, shouldBeLoading]);
```

**`src/features/wind/screen.tsx:614-619`**
- **Severity:** Medium
- **Issue:** Magic number `300` for initialization timeout without explanation
- **Fix:** Extract constant: `const INIT_DELAY_MS = 300; // Allow sensors to stabilize`

---

## 2. UI/UX ISSUES

### High

**`src/components/error-boundary/ErrorBoundary.tsx:167-168`**
- **Severity:** High
- **Issue:** Hardcoded `color: '#fff'` on button text ignores theme tokens and may fail contrast in light mode
- **Fix:** Use `color: t.colors.onBrand` for proper theming

**`src/components/error-boundary/ErrorBoundary.tsx:163-169`**
- **Severity:** High
- **Issue:** Retry button missing `accessibilityLabel` and `accessibilityRole`
- **Fix:**
```tsx
<Pressable
  style={[styles.button, { backgroundColor: t.colors.brand }]}
  onPress={resetError}
  accessibilityLabel="Try again to recover from error"
  accessibilityRole="button"
>
```

---

### Medium

**`src/features/wind/screen.tsx:494-504`**
- **Severity:** Medium
- **Issue:** Calculate button has `accessibilityHint` but no `accessibilityLabel`
- **Fix:** Add `accessibilityLabel="Calculate wind effect on shot"`

**`src/features/calculator/screen.tsx:321-329`**
- **Severity:** Medium
- **Issue:** `ConditionChip` uses `View` instead of `Pressable`, preventing keyboard focus and navigation
- **Fix:** If chips should be interactive, use `Pressable` with `accessibilityRole="text"`

**`src/components/onboarding/OnboardingFlow.tsx:346-350`**
- **Severity:** Medium
- **Issue:** Background colors use hardcoded rgba instead of theme tokens
- **Current:**
```typescript
backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
```
- **Fix:** Use `t.colors.surfaceAlt` or create alpha token

**`src/features/home/screen.tsx:148-149`**
- **Severity:** Medium
- **Issue:** MetricTile icon sizes use `t.fontSize.lg` which is font-based, not icon-appropriate
- **Fix:** Use `t.containerSize.icon.sm` or dedicated icon size token

---

### Low

**`src/features/settings/screen.tsx:572-573`**
- **Severity:** Low
- **Issue:** Icons in SegmentedControl use hardcoded color `tokens.colors.textMuted` regardless of selection state
- **Fix:** Use dynamic color based on selection: `isSelected ? tokens.colors.brand : tokens.colors.textMuted`

---

## 3. PATTERNS

### High

**`src/features/settings/screen.tsx:41`**
- **Severity:** High
- **Issue:** `AnimatedPressable` created at module level causes new component type on every render
- **Fix:** Move outside component or wrap in `useMemo`:
```typescript
// Outside component
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
```

**`src/services/api.ts:32-98`**
- **Severity:** High
- **Issue:** All API methods are mock implementations with no indication they're mocks; no real API calls
- **Fix:** Either implement real API calls or clearly namespace as `mockApi` and add TODO comments

---

### Medium

**`src/core/context/settings.tsx:154-157`**
- **Severity:** Medium
- **Issue:** Temperature conversion assumes input is Celsius when converting to Fahrenheit, but this is not documented and may cause confusion
- **Fix:** Rename function or add JSDoc:
```typescript
/** Convert temperature from Celsius to target unit */
const convertTemperature = (tempCelsius: number, to?: 'celsius' | 'fahrenheit') => {
```

**`src/providers/EnhancedEnvironmentalProvider.tsx:150-153`**
- **Severity:** Medium
- **Issue:** Missing `forceRefresh` in dependency array of useEffect
- **Current:**
```typescript
useEffect(() => {
  if (refreshTrigger > 0) {
    forceRefresh();
  }
}, [refreshTrigger]);
```
- **Fix:** Add `forceRefresh` to dependencies: `[refreshTrigger, forceRefresh]`

**Multiple files (wind/screen.tsx, settings.tsx, etc.)**
- **Severity:** Medium
- **Issue:** Inconsistent use of `console.error` vs `LogManager.getLogger()` - some files mix both
- **Fix:** Use LogManager consistently across all files

---

### Low

**`src/features/settings/screen.tsx:478-479`**
- **Severity:** Low
- **Issue:** Using `console.warn` instead of LogManager for validation warnings
- **Fix:** Use `logger.warn('Club name is required');`

**`src/hooks/useAccessibility.ts:46-49`**
- **Severity:** Low
- **Issue:** Deprecated function `useReducedMotion()` still exported
- **Fix:** Remove deprecated export or add more aggressive deprecation warning

---

## 4. SECURITY

### Critical

**`src/features/settings/context/premium.tsx:46`**
- **Severity:** Critical
- **Issue:** `FORCE_PREMIUM_BYPASS = true` completely bypasses subscription verification - this would give all users premium access in production
- **Fix:** Remove entirely or gate behind build-time flag:
```typescript
const FORCE_PREMIUM_BYPASS = __DEV__ && process.env.EXPO_PUBLIC_DEV_PREMIUM === 'true';
```

---

### Medium

**`src/features/wind/context/compass-lock.tsx:70-80`**
- **Severity:** Medium
- **Issue:** Sensitive heading/location data stored in AsyncStorage without encryption
- **Fix:** Consider using `expo-secure-store` for sensitive location data

**`src/core/context/settings.tsx`**
- **Severity:** Medium
- **Issue:** No input validation on settings values before AsyncStorage persistence
- **Fix:** Add validation schema:
```typescript
const validateSettings = (settings: Partial<Settings>): boolean => {
  if (settings.quickSelectPresets?.some(p => p < 0 || p > 500)) return false;
  // Add more validations
  return true;
};
```

---

### Low

**`src/components/error-boundary/ErrorBoundary.tsx:154-162`**
- **Severity:** Low  
- **Issue:** Full error message shown to user could leak sensitive implementation details
- **Fix:** Show sanitized message: `{error.message.split(':')[0] || 'An unexpected error occurred'}`

**`src/services/api.ts`**
- **Severity:** Low
- **Issue:** Mock API has no rate limiting or input sanitization
- **Fix:** Add validation when implementing real API calls

---

## Summary

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Bugs | 1 | 4 | 3 | 0 |
| UI/UX | 0 | 2 | 4 | 1 |
| Patterns | 0 | 2 | 3 | 2 |
| Security | 1 | 0 | 2 | 2 |
| **Total** | **2** | **8** | **12** | **5** |

**Priority Fixes:**
1. Remove `FORCE_PREMIUM_BYPASS = true` immediately
2. Fix input validation for parseInt in wind screen
3. Move global mutable state into component refs
4. Add missing accessibility labels to interactive elements

###GPT 5.2###
[34 tools called]

Here are the issues found (focused on `src/features/**` and `src/components/**`, plus one critical security issue outside those folders):

- File: `src/stores/subscription.ts:185`  
  Severity: Critical  
  Issue: `FORCE_PREMIUM_BYPASS` is hardcoded to `true`, causing `isPremium` to always resolve as premium in production paths. This bypasses paywall enforcement.  
  Suggested fix: Gate the bypass behind `__DEV__` or an internal build flag, and default it to `false` in production builds.

- File: `src/features/settings/context/premium.tsx:45`  
  Severity: High  
  Issue: `FORCE_PREMIUM_BYPASS` is also hardcoded to `true` in the context defaults. If `usePremium` is ever consumed outside the provider, it grants premium by default.  
  Suggested fix: Remove the bypass or gate it behind `__DEV__`/build flags, and default to `false`.

- File: `src/features/wind/components/compass/WindDirectionCompass.tsx:104`  
  Severity: Medium  
  Issue: `windDirection` prop is accepted but never used; the component relies on `conditions?.windDirection` instead. UI overrides in `WindScreen` won’t affect the compass or announcements.  
  Suggested fix: Use the `windDirection` prop to drive display and announcements, or remove the override UI entirely.

- File: `src/features/wind/screen.tsx:595`  
  Severity: Medium  
  Issue: `CompassLockProvider` always receives `conditions?.windDirection`, so any “From” override in the UI can’t influence `relativeWindAngle` calculations.  
  Suggested fix: Pass the effective override value into `CompassLockProvider` (e.g., `windDirection={effectiveDirection}`).

- File: `src/features/wind/hooks/useWindCalculator.ts:52`  
  Severity: Medium  
  Issue: `windSpeed` is initialized to `10` and never synchronized to live conditions; calculations can be wrong unless the user manually adjusts the slider.  
  Suggested fix: On first conditions load (and when no manual override exists), set `windSpeed` from `conditions.windSpeed`.

- File: `src/features/wind/screen.tsx:195`  
  Severity: Low  
  Issue: `useWindCalculator` exposes `error`, but the screen never renders it. Calculation failures silently result in no output.  
  Suggested fix: Add an error state UI (alert/banner) when `error` is set and prevent showing the modal.

- File: `src/features/wind/components/compass/WindDirectionCompass.tsx:217`  
  Severity: Low  
  Issue: `useMemo` is used for logging side effects; it should be `useEffect`. This is a pattern/code smell and can lead to inconsistent logging behavior.  
  Suggested fix: Replace the `useMemo` with `useEffect` for side-effect logging.

- File: `src/components/ContextualOverlay.tsx:287`  
  Severity: Medium  
  Issue: The close button `Pressable` lacks `accessibilityRole` and `accessibilityLabel`, which makes the modal harder to dismiss with screen readers.  
  Suggested fix: Add `accessibilityRole="button"` and a clear `accessibilityLabel`/`accessibilityHint`.

- File: `src/components/PermissionRequest.tsx:9`  
  Severity: Medium  
  Issue: Uses static `tokens` instead of `useTokens()`, so the UI may not respond to theme changes; also the “Allow” button text uses `textPrimary` on a brand background, risking contrast failures.  
  Suggested fix: Switch to `useTokens()` for theme-aware values and use `colors.onBrand` for button text.

- File: `src/features/redesign/screens/SetupScreen.tsx:623`  
  Severity: Medium  
  Issue: Large StyleSheet block uses hardcoded spacing and font sizes instead of design tokens, creating inconsistent theming and violating the project token rule.  
  Suggested fix: Replace hardcoded values with token-based spacing/typography and `useRedesignTheme()`/tokens.

- File: `src/features/redesign/screens/PlayScreen.tsx:434`  
  Severity: Medium  
  Issue: Similar token violations with hardcoded sizing/spacing; will diverge across themes and accessibility scaling.  
  Suggested fix: Use tokenized spacing and font sizes instead of raw numbers.

- File: `src/components/EmptyState.tsx:150`  
  Severity: Low  
  Issue: Hardcoded color usage (`#FFFFFF`, `#000`) in shadows and icon fills breaks token rules and can reduce contrast in dark mode.  
  Suggested fix: Replace with token-driven colors (e.g., `colors.onBrand`, `colors.shadow`).

If you want, I can convert these into actionable fixes with targeted PR-ready patches.

###GEMINI###
[5 tools called]

The comprehensive code review of `src/features` and `src/components` has identified several issues ranging from critical logic bugs to UI/UX and security concerns.

### **1. BUGS**

*   **File:Line**: `src/features/redesign/screens/PlayScreen.tsx:243`
    *   **Severity**: **Critical**
    *   **Issue description**: The `calculationResult` currently uses **mock logic** with arbitrary multipliers (`windSpeed * 0.8`, etc.) instead of the actual physics-based wind calculation service.
    *   **Suggested fix**: Replace the mock implementation with the `useWindCalculator` hook and integrate `calculateWindEffectRecursive` to ensure accurate results consistent with the rest of the app.

*   **File:Line**: `src/components/ui/ProgressiveLoader.tsx:203`
    *   **Severity**: **Medium**
    *   **Issue description**: The "force render" timeout logic is ineffective because the render condition `if (isLoading || !minimumTimeElapsed)` prevents display as long as `isLoading` is true, regardless of the timeout.
    *   **Suggested fix**: Update the condition to bypass `isLoading` when the force render timeout has triggered: `if ((isLoading && !forceRender) || !minimumTimeElapsed)`.

*   **File:Line**: `src/features/wind/context/sensor-data.tsx:102`
    *   **Severity**: **Low**
    *   **Issue description**: **Dead Code**. The `calculateHeadingFromMagnetometer` function and associated variables are defined but never used, as the component relies exclusively on `Location.watchHeadingAsync`.
    *   **Suggested fix**: Remove the unused custom magnetometer smoothing logic to clean up the codebase.

### **2. UI/UX ISSUES**

*   **File:Line**: `src/features/redesign/screens/SetupScreen.tsx:375`
    *   **Severity**: **High**
    *   **Issue description**: **Missing Functionality**. Core "My Bag" actions (Add/Edit Club) trigger "coming soon!" alerts instead of actual functionality, blocking bag management.
    *   **Suggested fix**: Implement the `ClubEditor` modal and connect it to `useClubSettings` context actions.

*   **File:Line**: `src/features/wind/components/compass/WindDirectionCompass.tsx:276`
    *   **Severity**: **Medium**
    *   **Issue description**: **Style Compatibility**. Uses web-standard `boxShadow` string syntax which may crash or be ignored on native iOS/Android unless using specific interop features.
    *   **Suggested fix**: Replace with standard React Native shadow props (`shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`) or `elevation`.

*   **File:Line**: `src/features/redesign/screens/PlayScreen.tsx:188`
    *   **Severity**: **Low**
    *   **Issue description**: **Accessibility**. The `ConditionsBar` horizontal scroll view lacks explicit accessibility hints for screen reader navigation.
    *   **Suggested fix**: Add `accessibilityHint="Scroll for more conditions"` and ensure swipe actions are announced.

### **3. PATTERNS**

*   **File:Line**: `src/features/redesign/navigation/RedesignTabNavigator.tsx:15`
    *   **Severity**: **Medium**
    *   **Issue description**: **Custom Navigation**. The app implements a custom tab navigator instead of using standard libraries like React Navigation, leading to missing features (deep linking, android back handling, screen focus events).
    *   **Suggested fix**: Refactor to use `@react-navigation/bottom-tabs` while retaining the custom `RedesignTabBar` component for the UI.

*   **File:Line**: `src/features/wind/context/compass-lock.tsx:26`
    *   **Severity**: **Low**
    *   **Issue description**: **Over-Persistence**. Ephemeral "Compass Lock" state is persisted to storage, meaning a lock set days ago could persist unexpectedly.
    *   **Suggested fix**: Convert `LOCK_STATE` and `REFERENCE_HEADING` to in-memory React state only; remove `AsyncStorage` for these ephemeral values.

### **4. SECURITY**

*   **File:Line**: `src/components/diagnostics/DiagnosticOverlay.tsx:40`
    *   **Severity**: **High**
    *   **Issue description**: **Information Disclosure**. The diagnostic overlay exposes internal state and raw logs.
    *   **Suggested fix**: Ensure `FeatureFlags.DIAGNOSTIC_MODE` is strictly disabled in production builds (e.g., wrap in `if (__DEV__)`).

*   **File:Line**: `src/features/redesign/screens/SetupScreen.tsx:51`
    *   **Severity**: **Low**
    *   **Issue description**: **Hardcoded URLs**. Privacy Policy and TOS URLs are hardcoded, requiring app updates to change.
    *   **Suggested fix**: Move these URLs to a central configuration file or remote config.