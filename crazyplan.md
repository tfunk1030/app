# Implementation Plan: AICaddyPro Full Feature Roadmap
Generated: 2026-01-11 (Refined)

## Goal

Complete implementation of all features required to achieve App Store readiness, followed by enhanced user experience polish and competitive feature parity. This roadmap is structured in three phases:

1. **Phase 1 - App Store Ready** (8-12 hours): Critical accessibility and UX gaps that could cause App Store rejection
2. **Phase 2 - Enhanced Experience** (4-6 hours): Polish and features for user retention
3. **Phase 3 - Competitive Features** (8+ hours): Future enhancements for market differentiation

---

## Dependency Graph

```
Phase 1 Task Order:

  ┌─────────────────┐
  │ 1.0 Feature Flag│
  │   (Pre-requisite)│
  └────────┬────────┘
           │
    ┌──────┴──────┐
    ▼              ▼
┌────────┐   ┌────────────┐
│ 1.1    │   │ 1.7        │
│ Button │   │ ErrorBanner│
│ a11y   │   │ Component  │
└───┬────┘   └─────┬──────┘
    │              │
    ▼              │
┌────────┐         │
│ 1.2    │         │
│ Screen │◄────────┘
│ a11y   │
└───┬────┘
    │
┌───┴───┬──────┬──────┐
▼       ▼      ▼      ▼
1.3    1.4    1.5    1.6
Touch  Input  Shot   Wind
Target Height  Load   Load

    All above complete
           │
           ▼
       ┌───────┐
       │  1.8  │
       │ Storage│
       │ Errors │
       └───┬───┘
           │
           ▼
       ┌───────┐
       │  1.9  │
       │reduce │
       │Motion │
       └───────┘
```

**Rollback Criteria:**
- If any Phase 1 task causes test failures, disable via feature flag before proceeding
- Feature flag: `PHASE1_ACCESSIBILITY_ENHANCEMENTS` (add to FeatureFlags.ts)

---

## Phase 1: App Store Ready (8-12 hours)

### 1.0 Feature Flag Setup (Pre-requisite, 15 min)

**Purpose:** Enable instant rollback without code deployment.

**File to modify:**
- `src/utils/FeatureFlags.ts`

**Add at line 93 (after existing configurations):**

```typescript
// Phase 1 accessibility enhancements - enables instant rollback
PHASE1_ACCESSIBILITY_ENHANCEMENTS: {
  development: true,
  production: false, // Start disabled, enable after testing
  description: 'Phase 1 accessibility and loading state improvements',
  remoteOverrideEnabled: true,
},
```

**Add static getter at line 140:**

```typescript
static get PHASE1_ACCESSIBILITY_ENHANCEMENTS(): boolean {
  return FeatureFlags.isEnabled('PHASE1_ACCESSIBILITY_ENHANCEMENTS');
}
```

**Verification Script:**

```bash
# Run from project root
npx tsc --noEmit src/utils/FeatureFlags.ts && echo "OK: FeatureFlags compiles"
grep -q "PHASE1_ACCESSIBILITY_ENHANCEMENTS" src/utils/FeatureFlags.ts && echo "OK: Flag exists"
```

---

### 1.1 Button Component Accessibility (30 min)

**Problem:** Button component missing accessibilityLabel and accessibilityRole prop forwarding.

**File to modify:**
- `src/core/components/ui/button.tsx`

**Step 1: Update ButtonProps interface (line 62-70)**

Current:
```typescript
export interface ButtonProps extends PressableProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  title?: string;
  glow?: boolean;
}
```

Replace with:
```typescript
export interface ButtonProps extends PressableProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  title?: string;
  glow?: boolean;
  /** Accessibility label for screen readers - defaults to title if not provided */
  accessibilityLabel?: string;
  /** Accessibility role - defaults to 'button' */
  accessibilityRole?: AccessibilityRole;
}
```

**Step 2: Add import at top of file (after line 24)**

```typescript
import { AccessibilityRole } from 'react-native';
```

**Step 3: Destructure props in component (line 72-81)**

Current:
```typescript
const Button = ({
  variant = 'default',
  size = 'default',
  children,
  title,
  style,
  textStyle,
  glow = false,
  ...props
}: ButtonProps) => {
```

Replace with:
```typescript
const Button = ({
  variant = 'default',
  size = 'default',
  children,
  title,
  style,
  textStyle,
  glow = false,
  accessibilityLabel,
  accessibilityRole = 'button',
  ...props
}: ButtonProps) => {
```

**Step 4: Compute effective label (after line 267)**

Add:
```typescript
const effectiveAccessibilityLabel = accessibilityLabel ?? (typeof buttonText === 'string' ? buttonText : undefined);
```

**Step 5: Add accessibility props to all AnimatedPressable instances**

For each AnimatedPressable (lines 336, 374, 401), add:
```typescript
accessibilityLabel={effectiveAccessibilityLabel}
accessibilityRole={accessibilityRole}
```

**Verification Script:**

```bash
# Check interface has new props
grep -n "accessibilityLabel\?: string" src/core/components/ui/button.tsx && echo "OK: accessibilityLabel prop"
grep -n "accessibilityRole\?: AccessibilityRole" src/core/components/ui/button.tsx && echo "OK: accessibilityRole prop"

# Check AnimatedPressable has props (should appear 3 times)
grep -c "accessibilityLabel={effectiveAccessibilityLabel}" src/core/components/ui/button.tsx | grep -q "3" && echo "OK: All 3 Pressables updated"

# TypeScript check
npx tsc --noEmit src/core/components/ui/button.tsx && echo "OK: Button compiles"
```

---

### 1.2 Screen-Level Accessibility Audit (1.5 hours)

**Problem:** Pressables without accessibilityLabel exist in setup.tsx.

**Files to modify:**
- `app/(tabs-redesign)/setup.tsx`
- `src/components/PresetSelector.tsx`

#### 1.2.1 setup.tsx Unit Selector (lines 596-640)

**Current (line 596-617):**
```typescript
<Pressable
  onPress={() => handleUnitChange('imperial')}
  style={[
    styles.unitOption,
    {
      backgroundColor: !isMetric ? colors.brandMuted : 'transparent',
      borderColor: !isMetric ? colors.brand : colors.border,
    },
  ]}
>
```

**Add after style prop:**
```typescript
accessibilityLabel="Imperial units: Yards, Fahrenheit, mph"
accessibilityRole="button"
accessibilityState={{ selected: !isMetric }}
```

**Same for metric (lines 619-640), add:**
```typescript
accessibilityLabel="Metric units: Meters, Celsius, km/h"
accessibilityRole="button"
accessibilityState={{ selected: isMetric }}
```

#### 1.2.2 PresetSelector.tsx (lines 115-166, 157-163, 248, 418-439)

**PresetItem Pressable (line 115):**
Current:
```typescript
<Pressable
  onPress={() => onLoad(preset)}
  onPressIn={handlePressIn}
  onPressOut={handlePressOut}
  style={[...]}
>
```

Add:
```typescript
accessibilityLabel={`Load preset: ${preset.name}`}
accessibilityRole="button"
accessibilityState={{ selected: isSelected }}
```

**Delete button (line 157):**
```typescript
<Pressable
  onPress={() => onDelete(preset)}
  style={[styles.deleteButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
  accessibilityLabel={`Delete preset: ${preset.name}`}
  accessibilityRole="button"
>
```

**Modal close (line 248):**
```typescript
<Pressable
  onPress={handleClose}
  hitSlop={8}
  accessibilityLabel="Close save preset dialog"
  accessibilityRole="button"
>
```

**Expand button (line 418):**
```typescript
<Pressable
  onPress={toggleExpanded}
  style={[...]}
  accessibilityLabel={`${isExpanded ? 'Hide' : 'Show'} saved presets, ${filteredPresets.length} available`}
  accessibilityRole="button"
  accessibilityState={{ expanded: isExpanded }}
>
```

**Verification Script:**

```bash
# Count Pressables without accessibilityLabel in setup.tsx
COUNT=$(grep -n "<Pressable" app/\(tabs-redesign\)/setup.tsx | wc -l)
A11Y_COUNT=$(grep -n "accessibilityLabel" app/\(tabs-redesign\)/setup.tsx | wc -l)
echo "Pressables: $COUNT, with a11y: $A11Y_COUNT"

# Same for PresetSelector
COUNT=$(grep -n "<Pressable" src/components/PresetSelector.tsx | wc -l)
A11Y_COUNT=$(grep -c "accessibilityLabel" src/components/PresetSelector.tsx)
echo "PresetSelector Pressables: $COUNT, with a11y: $A11Y_COUNT"

# TypeScript check
npx tsc --noEmit app/\(tabs-redesign\)/setup.tsx src/components/PresetSelector.tsx && echo "OK: Files compile"
```

---

### 1.3 Touch Target Compliance (20 min)

**Problem:** Club action buttons at 36dp, should be 48dp minimum.

**File to modify:**
- `app/(tabs-redesign)/setup.tsx`

**Location:** Lines 973-979

**Current:**
```typescript
clubAction: {
  width: 36,
  height: 36,
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center',
},
```

**Replace with:**
```typescript
clubAction: {
  width: 48,
  height: 48,
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center',
},
```

**Verification Script:**

```bash
# Check touch target size
grep -A2 "clubAction:" app/\(tabs-redesign\)/setup.tsx | grep -q "width: 48" && echo "OK: Width is 48"
grep -A2 "clubAction:" app/\(tabs-redesign\)/setup.tsx | grep -q "height: 48" && echo "OK: Height is 48"
```

---

### 1.4 Input Height Compliance (15 min)

**Problem:** Input height is 48dp, target is 56dp for glove use.

**File to modify:**
- `src/core/components/ui/Input.tsx`

**Find the input style (search for `height: 48`):**

```bash
grep -n "height: 48" src/core/components/ui/Input.tsx
```

**Change:**
```typescript
height: 48,  // Change to 56
```

**Verification Script:**

```bash
grep -q "height: 56" src/core/components/ui/Input.tsx && echo "OK: Input height is 56"
npx tsc --noEmit src/core/components/ui/Input.tsx && echo "OK: Input compiles"
```

---

### 1.5 Loading States for Shot Tab (1 hour)

**Problem:** No loading state when environmental conditions are being fetched.

**File to modify:**
- `app/(tabs-redesign)/index.tsx`

**Step 1: Add import (after line 31)**

```typescript
import { SkeletonScreen, SkeletonCard, SkeletonMetricsGrid } from '@/src/core/components/ui/Skeleton';
import { FeatureFlags } from '@/src/utils/FeatureFlags';
```

**Step 2: Add loading detection (after line 84, inside ShotScreen)**

```typescript
// Detect initial loading state
const isInitialLoading = FeatureFlags.PHASE1_ACCESSIBILITY_ENHANCEMENTS &&
  !environmental.conditions &&
  !environmental.error;
```

**Step 3: Add loading return before main render (before the main return statement, around line 230)**

```typescript
// Show skeleton during initial load
if (isInitialLoading) {
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={styles.scrollContent}>
        <SkeletonScreen showHero={false} cardCount={1} />
      </View>
    </SafeAreaView>
  );
}
```

**Verification Script:**

```bash
# Check imports exist
grep -q "SkeletonScreen" app/\(tabs-redesign\)/index.tsx && echo "OK: Skeleton imported"
grep -q "FeatureFlags" app/\(tabs-redesign\)/index.tsx && echo "OK: FeatureFlags imported"

# Check loading detection
grep -q "isInitialLoading" app/\(tabs-redesign\)/index.tsx && echo "OK: Loading detection exists"

# TypeScript check
npx tsc --noEmit app/\(tabs-redesign\)/index.tsx && echo "OK: Shot screen compiles"
```

---

### 1.6 Loading States for Wind Tab (45 min)

**Problem:** No compass calibration indicator or loading state.

**File to modify:**
- `app/(tabs-redesign)/wind.tsx`

**Step 1: Add ActivityIndicator import (update existing react-native import)**

Find line with:
```typescript
import {
  View,
  Text,
  ...
} from 'react-native';
```

Add `ActivityIndicator` to the import list.

**Step 2: Add icon import (find lucide-react-native import)**

Add `AlertTriangle` to the existing lucide import.

**Step 3: Add calibration state (inside WindCalculatorRedesign, after existing hooks)**

```typescript
// Compass calibration state - placeholder until sensor hook exposes this
const [isCalibrating, setIsCalibrating] = useState(false);
const sensorAvailable = true; // TODO: Get from useSensorData when available
```

**Step 4: Add calibration indicator (after compass section header, around line 340)**

```typescript
{FeatureFlags.PHASE1_ACCESSIBILITY_ENHANCEMENTS && isCalibrating && (
  <View style={styles.calibrationIndicator}>
    <ActivityIndicator size="small" color={colors.brand} />
    <Text style={[styles.calibrationText, { color: colors.textMuted }]}>
      Calibrating compass...
    </Text>
  </View>
)}

{FeatureFlags.PHASE1_ACCESSIBILITY_ENHANCEMENTS && !sensorAvailable && (
  <View style={styles.sensorWarning}>
    <AlertTriangle size={16} color={colors.warning} />
    <Text style={[styles.warningText, { color: colors.warning }]}>
      Compass unavailable
    </Text>
  </View>
)}
```

**Step 5: Add styles (in StyleSheet.create section)**

```typescript
calibrationIndicator: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 8,
  gap: 8,
},
calibrationText: {
  fontSize: 13,
},
sensorWarning: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 8,
  paddingHorizontal: 12,
  backgroundColor: 'rgba(245, 158, 11, 0.1)',
  borderRadius: 8,
  gap: 6,
  marginBottom: 8,
},
warningText: {
  fontSize: 13,
  fontWeight: '500',
},
```

**Verification Script:**

```bash
grep -q "calibrationIndicator" app/\(tabs-redesign\)/wind.tsx && echo "OK: Calibration indicator added"
grep -q "sensorWarning" app/\(tabs-redesign\)/wind.tsx && echo "OK: Sensor warning added"
npx tsc --noEmit app/\(tabs-redesign\)/wind.tsx && echo "OK: Wind screen compiles"
```

---

### 1.7 Error Banner Component (1 hour)

**Problem:** No user-facing error states for API/sensor failures.

**New file to create:**
- `src/core/components/ui/ErrorBanner.tsx`

**Content:**

```typescript
/**
 * ErrorBanner.tsx
 *
 * Dismissible error/warning banner for user-facing error states.
 * Supports retry actions and auto-dismiss.
 */

import { useAccessibleAnimations } from '@/src/hooks/useAccessibility';
import { useTokens } from '@/src/theme/useTokens';
import { AlertCircle, AlertTriangle, Info, X, RefreshCw } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

export type ErrorBannerVariant = 'error' | 'warning' | 'info';

export interface ErrorBannerProps {
  /** The message to display */
  message: string;
  /** Banner variant affecting color and icon */
  variant?: ErrorBannerVariant;
  /** Callback when retry is pressed */
  onRetry?: () => void;
  /** Callback when banner is dismissed */
  onDismiss?: () => void;
  /** Auto-dismiss after this many milliseconds (0 = never) */
  autoDismissMs?: number;
  /** Whether the banner is visible */
  visible?: boolean;
}

const variantConfig = {
  error: {
    icon: AlertCircle,
    bgOpacity: 0.12,
  },
  warning: {
    icon: AlertTriangle,
    bgOpacity: 0.1,
  },
  info: {
    icon: Info,
    bgOpacity: 0.08,
  },
};

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  variant = 'error',
  onRetry,
  onDismiss,
  autoDismissMs = 0,
  visible = true,
}) => {
  const tokens = useTokens();
  const { cardEntering } = useAccessibleAnimations();
  const [isVisible, setIsVisible] = useState(visible);

  const config = variantConfig[variant];
  const Icon = config.icon;

  const color = variant === 'error'
    ? tokens.colors.danger
    : variant === 'warning'
      ? tokens.colors.warning
      : tokens.colors.brand;

  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

  useEffect(() => {
    if (autoDismissMs > 0 && isVisible) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [autoDismissMs, isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <Animated.View
      entering={cardEntering(0)}
      exiting={FadeOutUp.duration(200)}
      style={[
        styles.container,
        {
          backgroundColor: `${color}${Math.round(config.bgOpacity * 255).toString(16).padStart(2, '0')}`,
          borderColor: color,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Icon size={18} color={color} />

      <Text
        style={[styles.message, { color: tokens.colors.textPrimary }]}
        numberOfLines={2}
      >
        {message}
      </Text>

      <View style={styles.actions}>
        {onRetry && (
          <Pressable
            onPress={onRetry}
            style={[styles.actionButton, { backgroundColor: `${color}20` }]}
            accessibilityLabel="Retry"
            accessibilityRole="button"
          >
            <RefreshCw size={14} color={color} />
          </Pressable>
        )}

        {onDismiss && (
          <Pressable
            onPress={handleDismiss}
            style={styles.dismissButton}
            accessibilityLabel="Dismiss"
            accessibilityRole="button"
          >
            <X size={16} color={tokens.colors.textMuted} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 10,
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
  },
  dismissButton: {
    padding: 4,
  },
});

export default ErrorBanner;
```

**Verification Script:**

```bash
# Check file exists and compiles
test -f src/core/components/ui/ErrorBanner.tsx && echo "OK: ErrorBanner.tsx exists"
npx tsc --noEmit src/core/components/ui/ErrorBanner.tsx && echo "OK: ErrorBanner compiles"
```

---

### 1.8 Error Handling - AsyncStorage (45 min)

**Problem:** AsyncStorage failures silently fail.

**Files to modify:**
- `src/core/context/settings.tsx`
- `src/features/settings/context/clubs.tsx`

#### 1.8.1 settings.tsx (lines 106-113)

**Add import at top:**
```typescript
import { errorNotificationService } from '@/src/services/notification/error-notification';
```

**Current (lines 106-113):**
```typescript
try {
  await AsyncStorage.setItem('userSettings', JSON.stringify(updated));
} catch (error) {
  console.error('Failed to save settings to AsyncStorage:', error);
}
```

**Replace with:**
```typescript
try {
  await AsyncStorage.setItem('userSettings', JSON.stringify(updated));
} catch (error) {
  console.error('Failed to save settings to AsyncStorage:', error);
  // Notify user of save failure
  errorNotificationService.showToast({
    message: 'Could not save settings. Changes may not persist.',
    type: 'warning',
    duration: 4000,
  });
}
```

#### 1.8.2 clubs.tsx - Find AsyncStorage catch blocks

Search for:
```bash
grep -n "catch.*error" src/features/settings/context/clubs.tsx
```

Apply same pattern: add `errorNotificationService.showToast` after console.error.

**Verification Script:**

```bash
# Check imports
grep -q "errorNotificationService" src/core/context/settings.tsx && echo "OK: settings.tsx has import"

# Check notification calls
grep -c "showToast" src/core/context/settings.tsx | grep -qE "[1-9]" && echo "OK: showToast calls exist"

# TypeScript check
npx tsc --noEmit src/core/context/settings.tsx && echo "OK: settings.tsx compiles"
```

---

### 1.9 reduceMotion Audit (1 hour)

**Problem:** Screen animations use raw FadeIn/FadeInDown instead of useAccessibleAnimations hook.

**Files to modify:**
- `app/(tabs-redesign)/index.tsx` - 8 instances
- `app/(tabs-redesign)/wind.tsx` - 14 instances
- `app/(tabs-redesign)/setup.tsx` - 8 instances

**Pattern to apply in each file:**

**Step 1: Update import**

Find:
```typescript
import Animated, {
  FadeIn,
  FadeInDown,
  ...
} from 'react-native-reanimated';
```

Keep the import but add the hook import:
```typescript
import { useAccessibleAnimations } from '@/src/hooks/useAccessibility';
```

**Step 2: Add hook inside component**

```typescript
const { headerEntering, cardEntering } = useAccessibleAnimations();
```

**Step 3: Replace animation usages**

| Current | Replace With |
|---------|--------------|
| `entering={FadeIn}` | `entering={headerEntering}` |
| `entering={FadeIn.delay(100)}` | `entering={headerEntering}` |
| `entering={FadeInDown.delay(200)}` | `entering={cardEntering(2)}` |
| `entering={FadeInDown.delay(300)}` | `entering={cardEntering(3)}` |
| `entering={FadeInDown.delay(N)}` | `entering={cardEntering(N/100)}` |

**Example transformation for index.tsx:**

Line 237: `entering={FadeIn}` -> `entering={headerEntering}`
Line 243: `entering={FadeIn.delay(100)}` -> `entering={headerEntering}`
Line 274: `entering={FadeInDown.delay(200)}` -> `entering={cardEntering(2)}`
Line 291: `entering={FadeInDown.delay(300)}` -> `entering={cardEntering(3)}`
Line 311: `entering={FadeInDown.delay(400)}` -> `entering={cardEntering(4)}`
Line 329: `entering={FadeInDown.delay(450)}` -> `entering={cardEntering(4)}`
Line 402: `entering={FadeInDown.delay(500)}` -> `entering={cardEntering(5)}`

**Verification Script:**

```bash
# Check that useAccessibleAnimations is used in all three files
for file in app/\(tabs-redesign\)/index.tsx app/\(tabs-redesign\)/wind.tsx app/\(tabs-redesign\)/setup.tsx; do
  grep -q "useAccessibleAnimations" "$file" && echo "OK: $file uses hook" || echo "FAIL: $file missing hook"
done

# Check that raw FadeInDown.delay is not used directly in render
for file in app/\(tabs-redesign\)/index.tsx app/\(tabs-redesign\)/wind.tsx app/\(tabs-redesign\)/setup.tsx; do
  COUNT=$(grep -c "entering={FadeInDown.delay" "$file" 2>/dev/null || echo 0)
  if [ "$COUNT" = "0" ]; then
    echo "OK: $file - no raw FadeInDown.delay"
  else
    echo "WARN: $file has $COUNT raw FadeInDown.delay usages"
  fi
done

# TypeScript check all screens
npx tsc --noEmit app/\(tabs-redesign\)/index.tsx app/\(tabs-redesign\)/wind.tsx app/\(tabs-redesign\)/setup.tsx && echo "OK: All screens compile"
```

**Manual Test:**
1. Enable "Reduce Motion" in iOS Settings > Accessibility > Motion
2. Launch app, navigate to each tab
3. Verify: No sliding/fading animations, content appears instantly
4. Verify: Buttons still respond to press (scale animation is handled by button.tsx)

---

## Phase 1 Verification Checklist

Run this comprehensive script after completing all Phase 1 tasks:

```bash
#!/bin/bash
# Save as: scripts/verify-phase1.sh

echo "=== Phase 1 Verification ==="
echo ""

# 1. Feature Flag
echo "1. Feature Flag Setup"
grep -q "PHASE1_ACCESSIBILITY_ENHANCEMENTS" src/utils/FeatureFlags.ts && echo "  [PASS] Flag exists" || echo "  [FAIL] Flag missing"

# 2. Button Accessibility
echo "2. Button Accessibility"
grep -q "accessibilityLabel\?: string" src/core/components/ui/button.tsx && echo "  [PASS] Label prop" || echo "  [FAIL] Label prop"
grep -c "accessibilityLabel={effectiveAccessibilityLabel}" src/core/components/ui/button.tsx | grep -q "3" && echo "  [PASS] All Pressables updated" || echo "  [FAIL] Pressables incomplete"

# 3. Touch Targets
echo "3. Touch Targets"
grep -A1 "clubAction:" app/\(tabs-redesign\)/setup.tsx | grep -q "width: 48" && echo "  [PASS] 48dp width" || echo "  [FAIL] Width not 48"

# 4. Input Height
echo "4. Input Height"
grep -q "height: 56" src/core/components/ui/Input.tsx && echo "  [PASS] 56dp height" || echo "  [FAIL] Height not 56"

# 5. Skeleton Loading
echo "5. Loading States"
grep -q "SkeletonScreen" app/\(tabs-redesign\)/index.tsx && echo "  [PASS] Shot skeleton" || echo "  [FAIL] Shot skeleton"
grep -q "calibrationIndicator" app/\(tabs-redesign\)/wind.tsx && echo "  [PASS] Wind calibration" || echo "  [FAIL] Wind calibration"

# 6. Error Banner
echo "6. Error Banner"
test -f src/core/components/ui/ErrorBanner.tsx && echo "  [PASS] Component exists" || echo "  [FAIL] Component missing"

# 7. AsyncStorage Error Handling
echo "7. AsyncStorage Errors"
grep -q "errorNotificationService" src/core/context/settings.tsx && echo "  [PASS] Settings notifies" || echo "  [FAIL] Settings silent"

# 8. reduceMotion
echo "8. reduceMotion Compliance"
for file in app/\(tabs-redesign\)/index.tsx app/\(tabs-redesign\)/wind.tsx app/\(tabs-redesign\)/setup.tsx; do
  grep -q "useAccessibleAnimations" "$file" && echo "  [PASS] $(basename $file)" || echo "  [FAIL] $(basename $file)"
done

# 9. TypeScript Compilation
echo "9. TypeScript Compilation"
npx tsc --noEmit 2>/dev/null && echo "  [PASS] No type errors" || echo "  [FAIL] Type errors exist"

# 10. Test Suite
echo "10. Tests"
npm test -- --coverage --silent 2>/dev/null && echo "  [PASS] Tests pass" || echo "  [FAIL] Tests fail"

echo ""
echo "=== End Verification ==="
```

---

## Phase 2: Enhanced Experience (4-6 hours)

### Phase 2 Dependency Graph

```
Phase 2 Task Order:

  ┌─────────────────────┐
  │ 2.0 Settings Context│
  │    Extensions       │
  │  (Pre-requisite)    │
  └──────────┬──────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
┌────────┐      ┌────────────┐
│ 2.1    │      │ 2.5        │
│Settings│      │ Sunlight   │
│   UI   │      │   Mode     │
└───┬────┘      └─────┬──────┘
    │                 │
    ▼                 │
┌────────┐           │
│ 2.6    │           │
│ Club   │◄──────────┘
│Presets │
└────────┘

    Independent Tasks:
    ┌─────────┬─────────┐
    ▼         ▼         ▼
  2.2       2.3       2.4
Tutorial   Lock     Manual
          Visual   Heading
```

**Rollback Criteria:**
- If any Phase 2 task causes test failures, revert that specific task
- Settings changes are backward-compatible (new fields default to safe values)

---

### 2.0 Settings Context Extensions (Pre-requisite, 15 min)

**Purpose:** Add new settings fields required by Phase 2 tasks.

**File to modify:**
- `src/core/context/settings.tsx`

**Step 1: Update Settings interface (lines 4-14)**

**Current:**
```typescript
export interface Settings {
  distanceUnit: 'yards' | 'meters';
  temperatureUnit: 'celsius' | 'fahrenheit';
  altitudeUnit: 'feet' | 'meters';
  speedUnit: 'mph' | 'kph' | 'kts' | 'mps';
  locationEnabled: boolean;
  compassEnabled: boolean;
  notificationsEnabled: boolean;
  activityTrackingEnabled: boolean;
  version: number; // Added version field to force re-renders
}
```

**Replace with:**
```typescript
export interface Settings {
  distanceUnit: 'yards' | 'meters';
  temperatureUnit: 'celsius' | 'fahrenheit';
  altitudeUnit: 'feet' | 'meters';
  speedUnit: 'mph' | 'kph' | 'kts' | 'mps';
  locationEnabled: boolean;
  compassEnabled: boolean;
  notificationsEnabled: boolean;
  activityTrackingEnabled: boolean;
  /** Sunlight mode for outdoor visibility - high contrast theme */
  sunlightModeEnabled: boolean;
  /** Wind speed unit (separate from speedUnit for granular control) */
  windSpeedUnit: 'mph' | 'kph' | 'kts' | 'mps';
  version: number;
}
```

**Step 2: Update defaultSettings (lines 32-42)**

**Current:**
```typescript
const defaultSettings: Settings = {
  distanceUnit: 'yards',
  temperatureUnit: 'fahrenheit',
  altitudeUnit: 'feet',
  speedUnit: 'mph',
  locationEnabled: false,
  compassEnabled: false,
  notificationsEnabled: false,
  activityTrackingEnabled: false,
  version: 1, // Initialize version field
};
```

**Replace with:**
```typescript
const defaultSettings: Settings = {
  distanceUnit: 'yards',
  temperatureUnit: 'fahrenheit',
  altitudeUnit: 'feet',
  speedUnit: 'mph',
  locationEnabled: false,
  compassEnabled: false,
  notificationsEnabled: false,
  activityTrackingEnabled: false,
  sunlightModeEnabled: false,
  windSpeedUnit: 'mph',
  version: 1,
};
```

**Verification Script:**

```bash
# Check interface has new fields
grep -q "sunlightModeEnabled: boolean" src/core/context/settings.tsx && echo "OK: sunlightModeEnabled exists"
grep -q "windSpeedUnit:" src/core/context/settings.tsx && echo "OK: windSpeedUnit exists"

# TypeScript check
npx tsc --noEmit src/core/context/settings.tsx && echo "OK: Settings compiles"
```

---

### 2.1 Expose Hidden Settings UI (1.5 hours)

**Problem:** Permission toggles exist in state but lack UI controls.

**Files to modify:**
- `app/(tabs-redesign)/setup.tsx`

#### 2.1.1 Add Activity Tracking Toggle (lines 679-694)

**Location:** After the Notifications SettingRow (line 693), before the closing `</View>`

**Find this block (lines 679-694):**
```typescript
            <SettingRow
              icon={<Bell size={18} color={colors.brand} />}
              label="Notifications"
              rightElement={
                <Switch
                  value={settings.notificationsEnabled}
                  onValueChange={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateSettings({ notificationsEnabled: value });
                  }}
                  trackColor={{ false: colors.border, true: colors.brand }}
                  thumbColor={colors.surface}
                />
              }
            />
          </View>
```

**Insert after the Notifications SettingRow, before `</View>` (after line 693):**
```typescript
            <SettingRow
              icon={<Activity size={18} color={colors.brand} />}
              label="Activity Tracking"
              rightElement={
                <Switch
                  value={settings.activityTrackingEnabled}
                  onValueChange={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateSettings({ activityTrackingEnabled: value });
                  }}
                  trackColor={{ false: colors.border, true: colors.brand }}
                  thumbColor={colors.surface}
                  accessibilityLabel="Activity Tracking toggle"
                />
              }
            />
```

**Step 2: Add Activity icon import (line 38)**

**Find lucide-react-native import block (lines 27-44):**
```typescript
import {
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  Sun,
  Moon,
  Ruler,
  Crown,
  Bell,
  MapPin,
  Compass,
  HelpCircle,
  MessageSquare,
  Shield,
  LayoutGrid,
  X,
} from 'lucide-react-native';
```

**Add `Activity` to the import list after `X`:**
```typescript
import {
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  Sun,
  Moon,
  Ruler,
  Crown,
  Bell,
  MapPin,
  Compass,
  HelpCircle,
  MessageSquare,
  Shield,
  LayoutGrid,
  X,
  Activity,
  Database,
  Wind,
} from 'lucide-react-native';
```

#### 2.1.2 Add DATA Section with Clear Cache Button

**Location:** After PERMISSIONS section (after line 695), before Navigation Style section

**Insert new section after PERMISSIONS closing tag:**
```typescript
        {/* Data Management */}
        <Animated.View entering={FadeInDown.delay(325)}>
          <SectionHeader title="DATA" />
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <SettingRow
              icon={<Database size={18} color={colors.brand} />}
              label="Clear Weather Cache"
              onPress={() => {
                Alert.alert(
                  'Clear Weather Cache',
                  'This will remove cached weather data. Fresh data will be fetched on next use.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Clear',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await AsyncStorage.removeItem('weatherCache');
                          await AsyncStorage.removeItem('weatherCacheTimestamp');
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          Alert.alert('Success', 'Weather cache cleared.');
                        } catch (error) {
                          console.error('Failed to clear cache:', error);
                          Alert.alert('Error', 'Failed to clear cache.');
                        }
                      },
                    },
                  ]
                );
              }}
            />
          </View>
        </Animated.View>
```

#### 2.1.3 Add Wind Speed Unit Selector in UNITS Section

**Location:** Inside the UNITS section, after the Imperial/Metric selector (around line 642)

**Find the closing of unitSelector View (line 641-642):**
```typescript
            </View>
          </View>
        </Animated.View>
```

**Replace the UNITS section (lines 591-643) with expanded version:**

**Current UNITS section (lines 591-643):**
```typescript
        {/* Units */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <SectionHeader title="UNITS" />
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.unitSelector}>
              <Pressable
                onPress={() => handleUnitChange('imperial')}
                style={[
                  styles.unitOption,
                  {
                    backgroundColor: !isMetric ? colors.brandMuted : 'transparent',
                    borderColor: !isMetric ? colors.brand : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.unitOptionLabel,
                    { color: !isMetric ? colors.brand : colors.textMuted },
                  ]}
                >
                  Imperial
                </Text>
                <Text style={[styles.unitOptionDetail, { color: colors.textMuted }]}>
                  Yards, °F, mph
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleUnitChange('metric')}
                style={[
                  styles.unitOption,
                  {
                    backgroundColor: isMetric ? colors.brandMuted : 'transparent',
                    borderColor: isMetric ? colors.brand : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.unitOptionLabel,
                    { color: isMetric ? colors.brand : colors.textMuted },
                  ]}
                >
                  Metric
                </Text>
                <Text style={[styles.unitOptionDetail, { color: colors.textMuted }]}>
                  Meters, °C, km/h
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
```

**Replace with (includes wind speed unit selector):**
```typescript
        {/* Units */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <SectionHeader title="UNITS" />
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.unitSelector}>
              <Pressable
                onPress={() => handleUnitChange('imperial')}
                style={[
                  styles.unitOption,
                  {
                    backgroundColor: !isMetric ? colors.brandMuted : 'transparent',
                    borderColor: !isMetric ? colors.brand : colors.border,
                  },
                ]}
                accessibilityLabel="Imperial units: Yards, Fahrenheit, mph"
                accessibilityRole="button"
                accessibilityState={{ selected: !isMetric }}
              >
                <Text
                  style={[
                    styles.unitOptionLabel,
                    { color: !isMetric ? colors.brand : colors.textMuted },
                  ]}
                >
                  Imperial
                </Text>
                <Text style={[styles.unitOptionDetail, { color: colors.textMuted }]}>
                  Yards, °F, mph
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleUnitChange('metric')}
                style={[
                  styles.unitOption,
                  {
                    backgroundColor: isMetric ? colors.brandMuted : 'transparent',
                    borderColor: isMetric ? colors.brand : colors.border,
                  },
                ]}
                accessibilityLabel="Metric units: Meters, Celsius, km/h"
                accessibilityRole="button"
                accessibilityState={{ selected: isMetric }}
              >
                <Text
                  style={[
                    styles.unitOptionLabel,
                    { color: isMetric ? colors.brand : colors.textMuted },
                  ]}
                >
                  Metric
                </Text>
                <Text style={[styles.unitOptionDetail, { color: colors.textMuted }]}>
                  Meters, °C, km/h
                </Text>
              </Pressable>
            </View>

            {/* Wind Speed Unit Selector */}
            <View style={[styles.settingRow, { borderBottomColor: colors.divider, borderBottomWidth: 0 }]}>
              <View style={styles.settingRowLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.brandMuted }]}>
                  <Wind size={18} color={colors.brand} />
                </View>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                  Wind Speed
                </Text>
              </View>
            </View>
            <View style={[styles.windUnitSelector, { paddingHorizontal: 12, paddingBottom: 12 }]}>
              {(['mph', 'kph', 'kts', 'mps'] as const).map((unit) => (
                <Pressable
                  key={unit}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateSettings({ windSpeedUnit: unit, speedUnit: unit });
                  }}
                  style={[
                    styles.windUnitOption,
                    {
                      backgroundColor: settings.speedUnit === unit ? colors.brandMuted : 'transparent',
                      borderColor: settings.speedUnit === unit ? colors.brand : colors.border,
                    },
                  ]}
                  accessibilityLabel={`Wind speed in ${unit === 'mps' ? 'meters per second' : unit}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: settings.speedUnit === unit }}
                >
                  <Text
                    style={[
                      styles.windUnitOptionLabel,
                      { color: settings.speedUnit === unit ? colors.brand : colors.textMuted },
                    ]}
                  >
                    {unit === 'mps' ? 'm/s' : unit}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>
```

#### 2.1.4 Add Wind Unit Selector Styles

**Location:** In StyleSheet.create section (after unitOptionDetail, around line 1039)

**Add these new styles after `unitOptionDetail`:**
```typescript
  windUnitSelector: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },

  windUnitOption: {
    flex: 1,
    minWidth: 60,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },

  windUnitOptionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
```

**Verification Script:**

```bash
# Check Activity icon import
grep -q "Activity," app/\(tabs-redesign\)/setup.tsx && echo "OK: Activity icon imported"

# Check Activity Tracking toggle
grep -q "activityTrackingEnabled" app/\(tabs-redesign\)/setup.tsx && echo "OK: Activity toggle exists"

# Check DATA section
grep -q "Clear Weather Cache" app/\(tabs-redesign\)/setup.tsx && echo "OK: Clear cache exists"

# Check wind unit selector
grep -q "windUnitSelector" app/\(tabs-redesign\)/setup.tsx && echo "OK: Wind unit selector exists"

# TypeScript check
npx tsc --noEmit app/\(tabs-redesign\)/setup.tsx && echo "OK: setup.tsx compiles"
```

---

### 2.2 Compass First-Use Tutorial (1 hour)

**Problem:** New users don't know they can lock the compass direction.

**Files to modify:**
- `app/(tabs-redesign)/wind.tsx`

**Dependencies:** None (independent task)

#### 2.2.1 Add AsyncStorage Import and Tutorial State

**Location:** Add import at top of file (after line 22)

**Add import:**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
```

**Location:** Inside WindCalculatorRedesign component (after line 138, after `scrollViewRef`)

**Add tutorial state and effect:**
```typescript
  // Tutorial tooltip state
  const [showTutorial, setShowTutorial] = useState(false);

  // Check if user has seen tutorial
  useEffect(() => {
    const checkTutorial = async () => {
      try {
        const hasSeen = await AsyncStorage.getItem('hasSeenCompassTutorial');
        if (!hasSeen) {
          // Delay showing tutorial to let compass render first
          setTimeout(() => setShowTutorial(true), 1500);
        }
      } catch (error) {
        console.error('Failed to check tutorial state:', error);
      }
    };
    checkTutorial();
  }, []);

  const dismissTutorial = useCallback(async () => {
    setShowTutorial(false);
    try {
      await AsyncStorage.setItem('hasSeenCompassTutorial', 'true');
    } catch (error) {
      console.error('Failed to save tutorial state:', error);
    }
  }, []);
```

#### 2.2.2 Add Tutorial Tooltip Component

**Location:** After the Compass Section (after line 344, after `</Animated.View>` of compassSection)

**Add tooltip component:**
```typescript
        {/* First-Use Tutorial Tooltip */}
        {showTutorial && (
          <Animated.View
            entering={FadeInDown.delay(100)}
            style={[
              styles.tutorialTooltip,
              { backgroundColor: colors.surface, borderColor: colors.brand },
            ]}
          >
            <Pressable
              onPress={dismissTutorial}
              style={styles.tutorialContent}
              accessibilityLabel="Tutorial: Tap to lock your shot direction. Tap to dismiss."
              accessibilityRole="button"
            >
              <View style={styles.tutorialTextContainer}>
                <Lock size={16} color={colors.brand} />
                <Text style={[styles.tutorialText, { color: colors.textPrimary }]}>
                  Tap the lock button to freeze your shot direction
                </Text>
              </View>
              <View style={[styles.tutorialArrow, { borderTopColor: colors.surface }]} />
            </Pressable>
          </Animated.View>
        )}
```

#### 2.2.3 Add Tutorial Styles

**Location:** In StyleSheet.create section (after resetButtonText, around line 844)

**Add these styles:**
```typescript
  // Tutorial tooltip
  tutorialTooltip: {
    position: 'absolute',
    top: -60,
    left: '50%',
    transform: [{ translateX: -120 }],
    width: 240,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },

  tutorialContent: {
    alignItems: 'center',
  },

  tutorialTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  tutorialText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  tutorialArrow: {
    position: 'absolute',
    bottom: -18,
    left: '50%',
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
```

**Note:** The tooltip positioning is relative to the compass section. The `top: -60` positions it above the compass, and the arrow points down.

**Verification Script:**

```bash
# Check AsyncStorage import
grep -q "import AsyncStorage" app/\(tabs-redesign\)/wind.tsx && echo "OK: AsyncStorage imported"

# Check tutorial state
grep -q "showTutorial" app/\(tabs-redesign\)/wind.tsx && echo "OK: Tutorial state exists"

# Check tutorial component
grep -q "tutorialTooltip" app/\(tabs-redesign\)/wind.tsx && echo "OK: Tutorial component exists"

# Check AsyncStorage key
grep -q "hasSeenCompassTutorial" app/\(tabs-redesign\)/wind.tsx && echo "OK: Tutorial key exists"

# TypeScript check
npx tsc --noEmit app/\(tabs-redesign\)/wind.tsx && echo "OK: wind.tsx compiles"
```

---

### 2.3 Compass Lock Visual Indicator (30 min)

**Problem:** Locked state not visually distinct enough.

**Files to modify:**
- `src/features/wind/components/compass/LockButton.tsx`
- `src/features/wind/components/compass/styles.ts`

**Dependencies:** None (independent task)

#### 2.3.1 Update LockButton with Enhanced Glow Animation

**Current LockButton.tsx already has pulse animation (lines 88-102):**
```typescript
          {isLocked && (
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                styles.lockPulse,
                {
                  backgroundColor: tokens.colors.success,
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.08],
                    outputRange: [0.1, 0],
                  }),
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
          )}
```

**Enhance with outer glow ring. Replace lines 86-112 (the entire inner View content):**

**Current (lines 86-112):**
```typescript
        >
          {!isLocked && <BlurView intensity={15} style={StyleSheet.absoluteFill} />}
          {isLocked && (
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                styles.lockPulse,
                {
                  backgroundColor: tokens.colors.success,
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.08],
                    outputRange: [0.1, 0],
                  }),
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
          )}
          <MaterialCommunityIcons
            name={isLocked ? 'lock' : 'lock-open-variant'}
            size={24}
            color={isLocked
              ? tokens.colors.surface
              : tokens.colors.textPrimary
            }
          />
        </View>
```

**Replace with enhanced version:**
```typescript
        >
          {!isLocked && <BlurView intensity={15} style={StyleSheet.absoluteFill} />}

          {/* Outer glow ring - only when locked */}
          {isLocked && (
            <Animated.View
              style={[
                styles.lockOuterGlow,
                {
                  width: lockMetrics.size + 12,
                  height: lockMetrics.size + 12,
                  borderRadius: (lockMetrics.size + 12) / 2,
                  borderColor: tokens.colors.success,
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.08],
                    outputRange: [0.6, 0.2],
                  }),
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
          )}

          {/* Inner pulse */}
          {isLocked && (
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                styles.lockPulse,
                {
                  backgroundColor: tokens.colors.success,
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.08],
                    outputRange: [0.15, 0],
                  }),
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
          )}

          <MaterialCommunityIcons
            name={isLocked ? 'lock' : 'lock-open-variant'}
            size={24}
            color={isLocked
              ? tokens.colors.surface
              : tokens.colors.textPrimary
            }
          />
        </View>
```

#### 2.3.2 Add Outer Glow Style

**Location:** In `src/features/wind/components/compass/styles.ts` (after lockPulse, line 296)

**Add this style to lockButtonStyles:**
```typescript
  lockOuterGlow: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 999,
  },
```

#### 2.3.3 Add reduceMotion Support

**Location:** In LockButton.tsx, add useReduceMotion hook

**Add import at top of file (after line 8):**
```typescript
import { useReduceMotion } from 'react-native-reanimated';
```

**Inside LockButton component (after line 39):**
```typescript
  const reduceMotion = useReduceMotion();
```

**Update opacity interpolations to respect reduceMotion (replace the outer glow opacity):**

**Current:**
```typescript
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.08],
                  outputRange: [0.6, 0.2],
                }),
```

**Replace with:**
```typescript
                opacity: reduceMotion ? 0.4 : pulseAnim.interpolate({
                  inputRange: [1, 1.08],
                  outputRange: [0.6, 0.2],
                }),
                transform: reduceMotion ? [] : [{ scale: pulseAnim }],
```

**Similarly update inner pulse (replace both opacity and transform lines):**
```typescript
                opacity: reduceMotion ? 0.1 : pulseAnim.interpolate({
                  inputRange: [1, 1.08],
                  outputRange: [0.15, 0],
                }),
                transform: reduceMotion ? [] : [{ scale: pulseAnim }],
```

**Verification Script:**

```bash
# Check outer glow exists
grep -q "lockOuterGlow" src/features/wind/components/compass/LockButton.tsx && echo "OK: Outer glow added"
grep -q "lockOuterGlow" src/features/wind/components/compass/styles.ts && echo "OK: Outer glow style added"

# Check reduceMotion support
grep -q "useReduceMotion" src/features/wind/components/compass/LockButton.tsx && echo "OK: reduceMotion imported"

# TypeScript check
npx tsc --noEmit src/features/wind/components/compass/LockButton.tsx && echo "OK: LockButton compiles"
```

---

### 2.4 Manual Heading Input Fallback (45 min)

**Problem:** Compass may be unavailable on some devices or in certain conditions.

**Files to modify:**
- `app/(tabs-redesign)/wind.tsx`

**Dependencies:** None (independent task)

#### 2.4.1 Add Manual Heading State and Sensor Detection

**Location:** Inside WindCalculatorRedesign component, after existing state (around line 138)

**Add manual heading state:**
```typescript
  // Manual heading fallback
  const [manualHeading, setManualHeading] = useState<number>(0);
  const [useManualHeading, setUseManualHeading] = useState(false);
```

**Location:** Add sensor availability check (need to get from useSensorData in parent)

**In WindCalculatorWithCompass (around line 503-515), update to pass sensor availability:**

**Current:**
```typescript
function WindCalculatorWithCompass() {
  const environmental = useEnhancedEnvironmental();
  const { heading } = useSensorData();

  return (
    <CompassLockProvider
      currentHeading={heading || 0}
      windDirection={environmental.conditions?.windDirection || 0}
    >
      <WindCalculatorRedesign />
    </CompassLockProvider>
  );
}
```

**Replace with:**
```typescript
function WindCalculatorWithCompass() {
  const environmental = useEnhancedEnvironmental();
  const { heading, isAvailable: sensorAvailable } = useSensorData();

  return (
    <CompassLockProvider
      currentHeading={heading || 0}
      windDirection={environmental.conditions?.windDirection || 0}
    >
      <WindCalculatorRedesign sensorAvailable={sensorAvailable} />
    </CompassLockProvider>
  );
}
```

**Update WindCalculatorRedesign to accept sensorAvailable prop. Find the function signature (line 113):**

**Current:**
```typescript
function WindCalculatorRedesign() {
```

**Replace with:**
```typescript
function WindCalculatorRedesign({ sensorAvailable = true }: { sensorAvailable?: boolean }) {
```

#### 2.4.2 Add Manual Heading Input Section

**Location:** After Compass Section (after line 344), insert manual input fallback

**Add conditional manual input section:**
```typescript
        {/* Manual Heading Fallback - shown when compass unavailable */}
        {!sensorAvailable && (
          <Animated.View entering={FadeInDown.delay(160)} style={styles.manualHeadingSection}>
            <View style={[styles.manualHeadingCard, { backgroundColor: colors.surface }]}>
              <View style={styles.manualHeadingHeader}>
                <Compass size={18} color={colors.warning} />
                <Text style={[styles.manualHeadingTitle, { color: colors.textPrimary }]}>
                  Manual Shot Direction
                </Text>
              </View>
              <Text style={[styles.manualHeadingSubtitle, { color: colors.textMuted }]}>
                Compass unavailable. Set your shot direction manually.
              </Text>

              {/* Heading Slider */}
              <Slider
                value={manualHeading}
                onValueChange={setManualHeading}
                min={0}
                max={359}
                step={1}
                label="Heading"
                unit="°"
                dense
              />

              {/* Cardinal Direction Quick Select */}
              <View style={styles.cardinalButtonRow}>
                {[
                  { label: 'N', value: 0 },
                  { label: 'NE', value: 45 },
                  { label: 'E', value: 90 },
                  { label: 'SE', value: 135 },
                  { label: 'S', value: 180 },
                  { label: 'SW', value: 225 },
                  { label: 'W', value: 270 },
                  { label: 'NW', value: 315 },
                ].map((dir) => (
                  <Pressable
                    key={dir.label}
                    onPress={() => {
                      setManualHeading(dir.value);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[
                      styles.cardinalButton,
                      {
                        backgroundColor: manualHeading === dir.value ? colors.brandMuted : colors.backgroundAlt,
                        borderColor: manualHeading === dir.value ? colors.brand : colors.border,
                      },
                    ]}
                    accessibilityLabel={`Set heading to ${dir.label}`}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.cardinalButtonText,
                        { color: manualHeading === dir.value ? colors.brand : colors.textMuted },
                      ]}
                    >
                      {dir.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Animated.View>
        )}
```

#### 2.4.3 Add Manual Heading Styles

**Location:** In StyleSheet.create section (after tutorialArrow styles)

**Add these styles:**
```typescript
  // Manual heading fallback
  manualHeadingSection: {
    marginBottom: 20,
  },

  manualHeadingCard: {
    borderRadius: 16,
    padding: 16,
  },

  manualHeadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },

  manualHeadingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },

  manualHeadingSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },

  cardinalButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },

  cardinalButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    minWidth: 44,
    alignItems: 'center',
  },

  cardinalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
```

#### 2.4.4 Update Calculation to Use Manual Heading

**Location:** Find the triggerCalculation function and update relativeWindAngle calculation

In the `triggerCalculation` callback, the `relativeWindAngle` comes from `useCompassLock`. When using manual heading, we need to compute it differently.

**Add above triggerCalculation (after manual heading state):**
```typescript
  // Compute effective relative wind angle (manual or sensor-based)
  const effectiveRelativeWindAngle = useMemo(() => {
    if (!sensorAvailable) {
      // Manual mode: calculate relative angle from manual heading
      const windDir = environmental.conditions?.windDirection || 0;
      const relative = (windDir - manualHeading + 360) % 360;
      return relative;
    }
    return relativeWindAngle;
  }, [sensorAvailable, manualHeading, relativeWindAngle, environmental.conditions?.windDirection]);
```

**Update triggerCalculation to use effectiveRelativeWindAngle:**

**Find line with `calculate(relativeWindAngle)` (around line 238) and replace:**

**Current:**
```typescript
      calculate(relativeWindAngle);
```

**Replace with:**
```typescript
      calculate(effectiveRelativeWindAngle);
```

**Update the useEffect dependency (around line 251):**

**Current:**
```typescript
  React.useEffect(() => {
    triggerCalculation();
  }, [targetDistance, effectiveWindSpeed, relativeWindAngle, isLocked, triggerCalculation]);
```

**Replace with:**
```typescript
  React.useEffect(() => {
    triggerCalculation();
  }, [targetDistance, effectiveWindSpeed, effectiveRelativeWindAngle, isLocked, triggerCalculation]);
```

**Verification Script:**

```bash
# Check manual heading state
grep -q "manualHeading" app/\(tabs-redesign\)/wind.tsx && echo "OK: Manual heading state exists"

# Check sensor availability prop
grep -q "sensorAvailable" app/\(tabs-redesign\)/wind.tsx && echo "OK: Sensor availability passed"

# Check cardinal buttons
grep -q "cardinalButtonRow" app/\(tabs-redesign\)/wind.tsx && echo "OK: Cardinal buttons exist"

# TypeScript check
npx tsc --noEmit app/\(tabs-redesign\)/wind.tsx && echo "OK: wind.tsx compiles"
```

---

### 2.5 Outdoor/Sunlight Mode (1 hour)

**Problem:** App difficult to read in bright sunlight.

**Files to modify:**
- `src/theme/redesign/tokens.ts`
- `src/theme/redesign/index.tsx` (or wherever ThemeContext is)
- `app/(tabs-redesign)/setup.tsx`

**Dependencies:** 2.0 Settings Context Extensions

#### 2.5.1 Add Sunlight Theme Colors

**Location:** In `src/theme/redesign/tokens.ts` (after outdoorTheme, around line 222)

**Add sunlight theme after outdoorTheme:**
```typescript
/**
 * Sunlight Theme - Maximum contrast for direct sunlight
 * Near-black background with bright yellow/cyan text
 */
export const sunlightTheme: ThemeColors = {
  background: '#0A0A0A',           // Near-black
  backgroundAlt: '#141414',        // Slightly lighter black
  surface: '#1A1A1A',              // Dark surface
  surfaceElevated: '#222222',      // Elevated surface

  textPrimary: '#FFE600',          // Bright yellow - primary text
  textSecondary: '#00FFE5',        // Cyan - secondary text
  textMuted: '#CCCCCC',            // Light gray for less important
  textInverse: '#0A0A0A',          // Black for inverse

  brand: '#FFE600',                // Yellow brand
  brandMuted: 'rgba(255, 230, 0, 0.2)',
  accent: '#00FFE5',               // Cyan accent

  border: '#333333',               // Dark border
  borderStrong: '#444444',         // Stronger border
  divider: '#222222',              // Subtle divider

  interactive: '#FFE600',          // Yellow interactive
  interactiveHover: '#FFEB3B',     // Lighter yellow
  interactivePressed: '#FDD835',   // Pressed state

  success: '#00FF88',              // Bright green
  warning: '#FF9500',              // Orange warning
  error: '#FF3B30',                // Red error
  info: '#00D4FF',                 // Cyan info
};
```

**Update ThemeMode type (line 90):**

**Current:**
```typescript
export type ThemeMode = 'light' | 'dark' | 'outdoor';
```

**Replace with:**
```typescript
export type ThemeMode = 'light' | 'dark' | 'outdoor' | 'sunlight';
```

**Update themes export (around line 633-636):**

**Current:**
```typescript
  themes: {
    light: lightTheme,
    dark: darkTheme,
    outdoor: outdoorTheme,
  },
```

**Replace with:**
```typescript
  themes: {
    light: lightTheme,
    dark: darkTheme,
    outdoor: outdoorTheme,
    sunlight: sunlightTheme,
  },
```

#### 2.5.2 Update Theme Provider to Support Sunlight Mode

**Location:** Find the theme provider file (likely `src/theme/redesign/index.tsx`)

**Need to read this file to add sunlight theme support:**

The theme provider needs to check `settings.sunlightModeEnabled` and apply sunlight theme when active.

**Note:** This requires reading the theme provider implementation. The key changes are:
1. Import sunlightTheme from tokens
2. Check settings.sunlightModeEnabled
3. If enabled, override theme to sunlight regardless of mode setting

#### 2.5.3 Add Sunlight Mode Toggle in Setup

**Location:** In setup.tsx, after the ThemeSelector in APPEARANCE section

**Find the APPEARANCE section (lines 576-588):**
```typescript
        {/* Appearance */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <SectionHeader title="APPEARANCE" />
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={[styles.settingRow, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                Theme
              </Text>
            </View>
            <View style={styles.themeSelectorContainer}>
              <ThemeSelector value={mode} onChange={setMode} />
            </View>
          </View>
        </Animated.View>
```

**Replace with (includes sunlight toggle):**
```typescript
        {/* Appearance */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <SectionHeader title="APPEARANCE" />
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={[styles.settingRow, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                Theme
              </Text>
            </View>
            <View style={styles.themeSelectorContainer}>
              <ThemeSelector value={mode} onChange={setMode} />
            </View>
            <SettingRow
              icon={<Sun size={18} color={colors.brand} />}
              label="Sunlight Mode"
              rightElement={
                <Switch
                  value={settings.sunlightModeEnabled}
                  onValueChange={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateSettings({ sunlightModeEnabled: value });
                  }}
                  trackColor={{ false: colors.border, true: colors.brand }}
                  thumbColor={colors.surface}
                  accessibilityLabel="Sunlight mode toggle"
                />
              }
            />
            <Text style={[styles.sunlightModeHint, { color: colors.textMuted }]}>
              High contrast theme for outdoor visibility
            </Text>
          </View>
        </Animated.View>
```

#### 2.5.4 Add Sunlight Mode Hint Style

**Location:** In StyleSheet.create section (after windUnitOptionLabel)

```typescript
  sunlightModeHint: {
    fontSize: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
  },
```

**Verification Script:**

```bash
# Check sunlight theme exists
grep -q "sunlightTheme" src/theme/redesign/tokens.ts && echo "OK: Sunlight theme exists"

# Check ThemeMode includes sunlight
grep -q "'sunlight'" src/theme/redesign/tokens.ts && echo "OK: Sunlight in ThemeMode"

# Check sunlight toggle in settings
grep -q "sunlightModeEnabled" app/\(tabs-redesign\)/setup.tsx && echo "OK: Sunlight toggle exists"

# TypeScript check
npx tsc --noEmit src/theme/redesign/tokens.ts && echo "OK: tokens.ts compiles"
npx tsc --noEmit app/\(tabs-redesign\)/setup.tsx && echo "OK: setup.tsx compiles"
```

---

### 2.6 Club Validation & Presets (1 hour)

**Problem:** No validation on club entries, no preset options for quick setup.

**Files to modify:**
- `src/features/settings/context/clubs.tsx`
- `app/(tabs-redesign)/setup.tsx`

**Dependencies:** 2.1 (uses setup.tsx patterns)

#### 2.6.1 Add Validation Functions to clubs.tsx

**Location:** After DEFAULT_CLUBS constant (around line 32), add validation

```typescript
// Validation constants
const MAX_CLUBS = 14;
const MIN_DISTANCE_YARDS = 50;
const MAX_DISTANCE_YARDS = 400;
const MAX_NAME_LENGTH = 20;
const MIN_NAME_LENGTH = 1;

// Validation result type
export interface ClubValidationResult {
  isValid: boolean;
  errors: string[];
}

// Validation function
export function validateClub(
  club: Partial<ClubData>,
  existingClubs: ClubData[],
  isUpdate: boolean = false,
  updatingClubId?: string
): ClubValidationResult {
  const errors: string[] = [];

  // Name validation
  const name = (club.name || '').trim();
  if (name.length < MIN_NAME_LENGTH) {
    errors.push('Club name is required');
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.push(`Club name must be ${MAX_NAME_LENGTH} characters or less`);
  }

  // Check for duplicate names (case-insensitive)
  const duplicateName = existingClubs.some(
    (c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== updatingClubId
  );
  if (duplicateName) {
    errors.push('A club with this name already exists');
  }

  // Distance validation
  const distance = club.normalYardage || 0;
  if (distance < MIN_DISTANCE_YARDS) {
    errors.push(`Distance must be at least ${MIN_DISTANCE_YARDS} yards`);
  } else if (distance > MAX_DISTANCE_YARDS) {
    errors.push(`Distance must be ${MAX_DISTANCE_YARDS} yards or less`);
  }

  // Count validation (only for new clubs)
  if (!isUpdate && existingClubs.length >= MAX_CLUBS) {
    errors.push(`Maximum ${MAX_CLUBS} clubs allowed`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Club presets
export const CLUB_PRESETS = {
  beginner: {
    name: 'Beginner',
    description: '10 clubs with forgiving distances',
    clubs: [
      { name: 'Driver', normalYardage: 220 },
      { name: '3-Wood', normalYardage: 190 },
      { name: '5-Wood', normalYardage: 175 },
      { name: '5-Iron', normalYardage: 155 },
      { name: '6-Iron', normalYardage: 145 },
      { name: '7-Iron', normalYardage: 135 },
      { name: '8-Iron', normalYardage: 125 },
      { name: '9-Iron', normalYardage: 115 },
      { name: 'PW', normalYardage: 100 },
      { name: 'SW', normalYardage: 80 },
    ] as Partial<ClubData>[],
  },
  intermediate: {
    name: 'Intermediate',
    description: '14 clubs with average distances',
    clubs: DEFAULT_CLUBS.map((c) => ({
      name: c.name,
      normalYardage: Math.round(c.normalYardage * 0.85), // 85% of tour average
    })),
  },
  pro: {
    name: 'Pro',
    description: '14 clubs with tour-average distances',
    clubs: DEFAULT_CLUBS.map((c) => ({
      name: c.name,
      normalYardage: c.normalYardage,
    })),
  },
} as const;

export type ClubPresetKey = keyof typeof CLUB_PRESETS;
```

#### 2.6.2 Add loadPreset Function to Context

**Location:** Inside ClubSettingsProvider, after removeClub (around line 114)

```typescript
  const loadPreset = React.useCallback(async (presetKey: ClubPresetKey) => {
    const preset = CLUB_PRESETS[presetKey];
    if (!preset) return;

    const newClubs: ClubData[] = preset.clubs.map((c) => ({
      id: generateClubId(),
      name: c.name || '',
      normalYardage: c.normalYardage || 0,
      ball_speed: 0,
      launch_angle: 0,
      spin_rate: 0,
      max_height: 0,
      land_angle: 0,
      spin_decay: 0,
      wind_sensitivity: 1.0,
    }));

    setClubs(sortClubs(newClubs));
    await saveClubs(newClubs);
  }, []);
```

**Update context type (line 8-14):**

**Current:**
```typescript
interface ClubSettingsContextType {
  clubs: ClubData[];
  addClub: (club: ClubData) => Promise<void>;
  updateClub: (clubId: string, club: ClubData) => Promise<void>;
  removeClub: (clubId: string) => Promise<void>;
  getRecommendedClub: (targetYardage: number) => ClubData | null;
}
```

**Replace with:**
```typescript
interface ClubSettingsContextType {
  clubs: ClubData[];
  addClub: (club: ClubData) => Promise<void>;
  updateClub: (clubId: string, club: ClubData) => Promise<void>;
  removeClub: (clubId: string) => Promise<void>;
  getRecommendedClub: (targetYardage: number) => ClubData | null;
  loadPreset: (presetKey: ClubPresetKey) => Promise<void>;
}
```

**Update default context (around line 34):**
```typescript
const ClubSettingsContext = React.createContext<ClubSettingsContextType>({
  clubs: DEFAULT_CLUBS,
  addClub: async () => {},
  updateClub: async () => {},
  removeClub: async () => {},
  getRecommendedClub: () => null,
  loadPreset: async () => {},
});
```

**Update value memo (around line 117):**

**Current:**
```typescript
  const value = React.useMemo(() => ({
    clubs,
    addClub,
    updateClub,
    removeClub,
    getRecommendedClub
  }), [clubs, addClub, updateClub, removeClub, getRecommendedClub]);
```

**Replace with:**
```typescript
  const value = React.useMemo(() => ({
    clubs,
    addClub,
    updateClub,
    removeClub,
    getRecommendedClub,
    loadPreset,
  }), [clubs, addClub, updateClub, removeClub, getRecommendedClub, loadPreset]);
```

#### 2.6.3 Add Preset Selection UI in setup.tsx

**Location:** In setup.tsx, update the MY BAG section header to include preset button

**Find SectionHeader for MY BAG (lines 508-513):**
```typescript
          <SectionHeader
            title="MY BAG"
            action="Add Club"
            onAction={handleOpenAddModal}
          />
```

**Replace with (two actions):**
```typescript
          <View style={styles.bagHeaderRow}>
            <SectionHeader title="MY BAG" />
            <View style={styles.bagHeaderActions}>
              <Pressable
                onPress={() => setPresetModalVisible(true)}
                style={styles.presetButton}
                accessibilityLabel="Load preset clubs"
                accessibilityRole="button"
              >
                <Text style={[styles.sectionAction, { color: colors.brand }]}>
                  Presets
                </Text>
              </Pressable>
              <Pressable
                onPress={handleOpenAddModal}
                style={styles.addClubButton}
                accessibilityLabel="Add club"
                accessibilityRole="button"
              >
                <Text style={[styles.sectionAction, { color: colors.brand }]}>
                  Add Club
                </Text>
              </Pressable>
            </View>
          </View>
```

**Add preset modal state (after existing modal state, around line 336):**
```typescript
  const [presetModalVisible, setPresetModalVisible] = useState(false);
```

**Import CLUB_PRESETS and ClubPresetKey (add to clubs.tsx import):**

**Current import (line 51):**
```typescript
import { useClubSettings } from '@/src/features/settings/context/clubs';
```

**Replace with:**
```typescript
import { useClubSettings, CLUB_PRESETS, ClubPresetKey } from '@/src/features/settings/context/clubs';
```

**Add loadPreset to destructuring (line 330):**

**Current:**
```typescript
  const { clubs, addClub, updateClub, removeClub } = useClubSettings();
```

**Replace with:**
```typescript
  const { clubs, addClub, updateClub, removeClub, loadPreset } = useClubSettings();
```

**Add preset selection handler (after handleSaveClub, around line 482):**
```typescript
  const handlePresetSelect = useCallback((presetKey: ClubPresetKey) => {
    Alert.alert(
      'Load Preset',
      `This will replace your current ${clubs.length} clubs with the "${CLUB_PRESETS[presetKey].name}" preset. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace',
          style: 'destructive',
          onPress: async () => {
            await loadPreset(presetKey);
            setPresetModalVisible(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  }, [clubs.length, loadPreset]);
```

**Add Preset Modal (after existing Club Edit Modal, around line 845):**
```typescript
      {/* Preset Selection Modal */}
      <Modal
        visible={presetModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPresetModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setPresetModalVisible(false)}
        >
          <Pressable style={[styles.modalContent, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Club Presets
              </Text>
              <Pressable
                onPress={() => setPresetModalVisible(false)}
                style={styles.modalClose}
                accessibilityLabel="Close presets"
                accessibilityRole="button"
              >
                <X size={24} color={colors.textMuted} />
              </Pressable>
            </View>

            <Text style={[styles.presetWarning, { color: colors.warning }]}>
              Selecting a preset will replace all your current clubs
            </Text>

            {(Object.keys(CLUB_PRESETS) as ClubPresetKey[]).map((key) => {
              const preset = CLUB_PRESETS[key];
              return (
                <Pressable
                  key={key}
                  onPress={() => handlePresetSelect(key)}
                  style={[styles.presetOption, { borderColor: colors.border }]}
                  accessibilityLabel={`${preset.name} preset: ${preset.description}`}
                  accessibilityRole="button"
                >
                  <View style={styles.presetInfo}>
                    <Text style={[styles.presetName, { color: colors.textPrimary }]}>
                      {preset.name}
                    </Text>
                    <Text style={[styles.presetDescription, { color: colors.textMuted }]}>
                      {preset.description}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.textMuted} />
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
```

#### 2.6.4 Add Preset Modal Styles

**Location:** In StyleSheet.create section (after sunlightModeHint)

```typescript
  // Bag header row
  bagHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 24,
    paddingHorizontal: 4,
  },

  bagHeaderActions: {
    flexDirection: 'row',
    gap: 16,
  },

  presetButton: {
    paddingVertical: 4,
  },

  addClubButton: {
    paddingVertical: 4,
  },

  // Preset modal styles
  presetWarning: {
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },

  presetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
  },

  presetInfo: {
    flex: 1,
  },

  presetName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },

  presetDescription: {
    fontSize: 13,
  },
```

#### 2.6.5 Add Validation to Club Save

**Location:** In handleSaveClub function (around line 442)

**Current handleSaveClub:**
```typescript
  const handleSaveClub = useCallback(() => {
    if (!clubName.trim() || !clubDistance.trim()) return;
    // ... rest of function
  }, [...]);
```

**Replace with validated version:**
```typescript
  const handleSaveClub = useCallback(() => {
    if (!clubName.trim() || !clubDistance.trim()) return;

    const numericYardage = parseFloat(clubDistance) || 0;
    const processedYardage =
      settings.distanceUnit === 'meters'
        ? convertDistance(numericYardage, 'yards')
        : numericYardage;

    // Import validateClub from clubs.tsx context
    const { validateClub } = await import('@/src/features/settings/context/clubs');

    const validation = validateClub(
      { name: clubName.trim(), normalYardage: processedYardage },
      clubs,
      !!editingClubId,
      editingClubId || undefined
    );

    if (!validation.isValid) {
      Alert.alert('Invalid Club', validation.errors.join('\n'));
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const existingClub = editingClubId ? clubs.find((c) => c.id === editingClubId) : null;
    const clubData = {
      name: clubName.trim(),
      normalYardage: processedYardage,
      ball_speed: existingClub?.ball_speed ?? 0,
      launch_angle: existingClub?.launch_angle ?? 0,
      spin_rate: existingClub?.spin_rate ?? 0,
      max_height: existingClub?.max_height ?? 0,
      land_angle: existingClub?.land_angle ?? 0,
      spin_decay: existingClub?.spin_decay ?? 0,
      wind_sensitivity: existingClub?.wind_sensitivity ?? 1.0,
    };

    if (editingClubId) {
      updateClub(editingClubId, clubData);
    } else {
      addClub(clubData);
    }

    setModalVisible(false);
  }, [
    clubName,
    clubDistance,
    settings.distanceUnit,
    convertDistance,
    editingClubId,
    clubs,
    updateClub,
    addClub,
  ]);
```

**Note:** Actually, since validateClub is a sync function, use direct import at top of file instead of dynamic import.

**Add validateClub to import (update the clubs import):**
```typescript
import { useClubSettings, CLUB_PRESETS, ClubPresetKey, validateClub } from '@/src/features/settings/context/clubs';
```

**Verification Script:**

```bash
# Check validation function
grep -q "validateClub" src/features/settings/context/clubs.tsx && echo "OK: validateClub exists"

# Check presets constant
grep -q "CLUB_PRESETS" src/features/settings/context/clubs.tsx && echo "OK: CLUB_PRESETS exists"

# Check loadPreset in context
grep -q "loadPreset" src/features/settings/context/clubs.tsx && echo "OK: loadPreset in context"

# Check preset modal
grep -q "presetModalVisible" app/\(tabs-redesign\)/setup.tsx && echo "OK: Preset modal exists"

# TypeScript check
npx tsc --noEmit src/features/settings/context/clubs.tsx && echo "OK: clubs.tsx compiles"
npx tsc --noEmit app/\(tabs-redesign\)/setup.tsx && echo "OK: setup.tsx compiles"
```

---

## Phase 2 Verification Checklist

Run this comprehensive script after completing all Phase 2 tasks:

```bash
#!/bin/bash
# Save as: scripts/verify-phase2.sh

echo "=== Phase 2 Verification ==="
echo ""

# 2.0 Settings Extensions
echo "2.0 Settings Extensions"
grep -q "sunlightModeEnabled: boolean" src/core/context/settings.tsx && echo "  [PASS] sunlightModeEnabled" || echo "  [FAIL] sunlightModeEnabled"
grep -q "windSpeedUnit:" src/core/context/settings.tsx && echo "  [PASS] windSpeedUnit" || echo "  [FAIL] windSpeedUnit"

# 2.1 Hidden Settings UI
echo "2.1 Hidden Settings UI"
grep -q "activityTrackingEnabled" app/\(tabs-redesign\)/setup.tsx && echo "  [PASS] Activity toggle" || echo "  [FAIL] Activity toggle"
grep -q "Clear Weather Cache" app/\(tabs-redesign\)/setup.tsx && echo "  [PASS] Cache clear" || echo "  [FAIL] Cache clear"
grep -q "windUnitSelector" app/\(tabs-redesign\)/setup.tsx && echo "  [PASS] Wind unit selector" || echo "  [FAIL] Wind unit selector"

# 2.2 Compass Tutorial
echo "2.2 Compass Tutorial"
grep -q "hasSeenCompassTutorial" app/\(tabs-redesign\)/wind.tsx && echo "  [PASS] Tutorial flag" || echo "  [FAIL] Tutorial flag"
grep -q "tutorialTooltip" app/\(tabs-redesign\)/wind.tsx && echo "  [PASS] Tutorial component" || echo "  [FAIL] Tutorial component"

# 2.3 Lock Visual Indicator
echo "2.3 Lock Visual Indicator"
grep -q "lockOuterGlow" src/features/wind/components/compass/LockButton.tsx && echo "  [PASS] Outer glow" || echo "  [FAIL] Outer glow"
grep -q "useReduceMotion" src/features/wind/components/compass/LockButton.tsx && echo "  [PASS] reduceMotion" || echo "  [FAIL] reduceMotion"

# 2.4 Manual Heading
echo "2.4 Manual Heading Fallback"
grep -q "manualHeading" app/\(tabs-redesign\)/wind.tsx && echo "  [PASS] Manual state" || echo "  [FAIL] Manual state"
grep -q "cardinalButtonRow" app/\(tabs-redesign\)/wind.tsx && echo "  [PASS] Cardinal buttons" || echo "  [FAIL] Cardinal buttons"

# 2.5 Sunlight Mode
echo "2.5 Sunlight Mode"
grep -q "sunlightTheme" src/theme/redesign/tokens.ts && echo "  [PASS] Sunlight theme" || echo "  [FAIL] Sunlight theme"
grep -q "'sunlight'" src/theme/redesign/tokens.ts && echo "  [PASS] Sunlight in ThemeMode" || echo "  [FAIL] Sunlight in ThemeMode"

# 2.6 Club Validation & Presets
echo "2.6 Club Validation & Presets"
grep -q "validateClub" src/features/settings/context/clubs.tsx && echo "  [PASS] Validation function" || echo "  [FAIL] Validation function"
grep -q "CLUB_PRESETS" src/features/settings/context/clubs.tsx && echo "  [PASS] Presets data" || echo "  [FAIL] Presets data"
grep -q "presetModalVisible" app/\(tabs-redesign\)/setup.tsx && echo "  [PASS] Preset modal" || echo "  [FAIL] Preset modal"

# TypeScript compilation
echo ""
echo "TypeScript Compilation"
npx tsc --noEmit 2>/dev/null && echo "  [PASS] No type errors" || echo "  [FAIL] Type errors exist"

# Test suite
echo ""
echo "Tests"
npm test -- --coverage --silent 2>/dev/null && echo "  [PASS] Tests pass" || echo "  [FAIL] Tests fail"

echo ""
echo "=== End Phase 2 Verification ==="
```

---

## Testing Strategy

### Unit Tests to Add

| Test | File | Description |
|------|------|-------------|
| Button a11y props | `__tests__/button.test.tsx` | Verify accessibilityLabel/Role forwarded |
| Touch target size | `__tests__/setup.test.tsx` | Verify clubAction is 48x48 |
| reduceMotion hook | `__tests__/useReduceMotion.test.tsx` | Verify returns correct values |
| Club validation | `__tests__/clubs.test.tsx` | Test all validation rules |

### Integration Tests to Add

| Test | Description |
|------|-------------|
| Settings persistence | Toggle setting, restart app, verify persisted |
| Theme switching | Change theme, verify all screens update |
| Error recovery | Mock API failure, verify banner shows, retry works |

### Verification Commands

```bash
# Run all tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- __tests__/button.test.tsx

# Check coverage thresholds (minimum 60% for new code)
npm test -- --coverage --coverageThreshold='{"global":{"lines":60}}'
```

---

## Risks & Mitigations

| Risk | Impact | Mitigation | Rollback |
|------|--------|------------|----------|
| reduceMotion breaks animations | Medium | Test with setting ON before merge | Feature flag OFF |
| Touch targets break layout | Low | Use flex layout, test on devices | Revert CSS change |
| Skeleton causes flash | Medium | Debounce loading state (200ms) | Feature flag OFF |
| ErrorBanner too intrusive | Low | Use subtle styling, auto-dismiss | Hide via flag |
| Storage notification spam | Low | Throttle to max 1 per session | Remove notification |

---

## Estimated Complexity

| Phase | Tasks | Estimated Hours | Risk Level |
|-------|-------|----------------|------------|
| Phase 1 | 10 tasks | 8-12 hours | Low (feature flagged) |
| Phase 2 | 6 tasks | 4-6 hours | Medium |
| Phase 3 | 4 tasks | 8+ hours | Medium-High |

**Total for App Store submission (Phase 1)**: 8-12 hours
**Total for Enhanced Experience (Phase 1+2)**: 12-18 hours

---

*Refined by Plan Agent - 2026-01-11*
*Based on GPT Plan Reviewer feedback*
